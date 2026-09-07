import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageRoot = resolve(process.argv[2]);
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));

assert.equal(manifest.name, '@tummycrypt/vite-plugin-a11y');
assert.equal(manifest.version, '0.2.4');
assert.equal(manifest.publishConfig, undefined);
await Promise.all([
  access(resolve(packageRoot, 'dist/index.js')),
  access(resolve(packageRoot, 'dist/index.d.ts')),
]);
