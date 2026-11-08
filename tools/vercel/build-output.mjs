// Packages an Angular SSR build into Vercel's Build Output API layout.
// Usage: node tools/vercel/build-output.mjs <app>
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = process.argv[2];
if (!app) {
  throw new Error('Usage: node tools/vercel/build-output.mjs <app>');
}

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(root, 'dist/apps', app);
const output = join(root, 'apps', app, '.vercel/output');
const fn = join(output, 'functions/ssr.func');

rmSync(output, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });
cpSync(join(dist, 'browser'), join(output, 'static'), { recursive: true });
cpSync(join(dist, 'server'), join(fn, 'server'), { recursive: true });
// Vercel would serve this file at /, bypassing SSR. The server bundle has its own copy.
rmSync(join(output, 'static/index.csr.html'), { force: true });

writeFileSync(
  join(fn, 'index.mjs'),
  "export { reqHandler as default } from './server/server.mjs';\n",
);
writeFileSync(
  join(fn, '.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs22.x',
    handler: 'index.mjs',
    launcherType: 'Nodejs',
    // Vercel sets these; Angular falls back to client rendering if they are untrusted.
    environment: {
      NG_TRUST_PROXY_HEADERS:
        'x-forwarded-for,x-forwarded-host,x-forwarded-port,x-forwarded-proto',
    },
  }),
);

// Serves static pages at clean URLs: prezentare.html at /prezentare,
// and prerendered foo/index.html at /foo.
const overrides = {};
const staticFiles = readdirSync(join(output, 'static'), {
  recursive: true,
}).map((file) => String(file).replaceAll('\\', '/'));
for (const file of staticFiles) {
  if (!file.endsWith('.html') || file === 'index.html') {
    continue;
  }
  overrides[file] = { path: file.replace(/(\/index)?\.html$/, '') };
}

writeFileSync(
  join(output, 'config.json'),
  JSON.stringify({
    version: 3,
    overrides,
    routes: [{ handle: 'filesystem' }, { src: '/.*', dest: '/ssr' }],
  }),
);
