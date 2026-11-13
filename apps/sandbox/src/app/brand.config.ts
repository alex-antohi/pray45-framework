import { BrandInput } from '@pray45/ui';

// The sandbox's default style. The picker changes it only in the browser.
export const sandboxBrand: BrandInput = {
  name: 'Pray45 Sandbox',
  signature: 'P45',
  fonts: { primary: 'archivo', secondary: 'inter', accent: 'ibm-plex-mono' },
  colors: { primary: '#1f47d6', secondary: '#e3e9fb', accent: '#e4572e' },
  images: {
    logo: {
      rectangle: '/brand/logo-rectangle.svg',
      square: '/brand/logo-square.svg',
    },
  },
};
