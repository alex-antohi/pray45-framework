// Prints a one-time login link, without sending an email. For testing only.
// Usage: node tools/dev-login.mjs <email> [redirect-url]
// Needs SUPABASE_SECRET_KEY in the environment. Never commit that key.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fcdizyuyogaqwkbfrust.supabase.co';
const DEFAULT_REDIRECT = 'http://localhost:4200';

const [email, redirectTo = DEFAULT_REDIRECT] = process.argv.slice(2);
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!email) {
  console.error('Usage: node tools/dev-login.mjs <email> [redirect-url]');
  process.exit(1);
}
if (!secretKey) {
  console.error('SUPABASE_SECRET_KEY is not set in this terminal.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
});

if (error) {
  console.error(`Could not create the link: ${error.message}`);
  process.exit(1);
}

console.log(data.properties.action_link);
