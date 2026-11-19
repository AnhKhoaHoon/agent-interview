import { createRequire } from 'node:module';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const js = require('@eslint/js');
const globals = require('globals');
export default [
  js.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } }
];
