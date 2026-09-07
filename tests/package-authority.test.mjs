import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const EXPECTED = {
  module: 'tummycrypt_vite_plugin_a11y',
  npmRepo: 'tummycrypt_vite_plugin_a11y_npm',
  package: '@tummycrypt/vite-plugin-a11y',
  version: '0.2.4',
};
const CI_TEMPLATES_CANARY =
  'tinyland-inc/ci-templates/.github/workflows/js-bazel-package.yml@6244d36f3048cf93672a8f37a873ec2db2cb09a3';

const [moduleBazel, buildBazel, packageJsonText, pnpmLock, ci] = await Promise.all([
  readFile('MODULE.bazel', 'utf8'),
  readFile('BUILD.bazel', 'utf8'),
  readFile('package.json', 'utf8'),
  readFile('pnpm-lock.yaml', 'utf8'),
  readFile('.github/workflows/ci.yml', 'utf8'),
]);
const packageJson = JSON.parse(packageJsonText);
const moduleBlock = moduleBazel.match(/module\(([\s\S]*?)\)/)?.[1];
const packageBlock = buildBazel.match(
  /npm_package\(\s*name\s*=\s*"pkg",([\s\S]*?)\n\)/,
)?.[1];

assert.ok(moduleBlock, 'top-level module() declaration');
assert.ok(packageBlock, '//:pkg npm_package() declaration');
assert.match(moduleBlock, new RegExp(`name\\s*=\\s*"${EXPECTED.module}"`));
assert.match(moduleBlock, new RegExp(`version\\s*=\\s*"${EXPECTED.version}"`));
assert.match(moduleBazel, new RegExp(`name\\s*=\\s*"${EXPECTED.npmRepo}"`));
assert.match(moduleBazel, new RegExp(`use_repo\\(npm,\\s*"${EXPECTED.npmRepo}"\\)`));
assert.match(buildBazel, new RegExp(`@${EXPECTED.npmRepo}//:defs\\.bzl`));
assert.equal(packageJson.name, EXPECTED.package);
assert.equal(packageJson.version, EXPECTED.version);
assert.equal(packageJson.publishConfig, undefined);
assert.match(packageBlock, new RegExp(`package\\s*=\\s*"${EXPECTED.package}"`));
assert.match(packageBlock, new RegExp(`version\\s*=\\s*"${EXPECTED.version}"`));

for (const field of [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'overrides',
  'resolutions',
]) {
  for (const dependency of Object.keys(packageJson[field] ?? {})) {
    assert.doesNotMatch(dependency, /^@(tummycrypt|tinyland)\//, `${field}.${dependency}`);
  }
}
assert.doesNotMatch(pnpmLock, /['"]?@(tummycrypt|tinyland)\//);

assert.match(ci, new RegExp(CI_TEMPLATES_CANARY.replaceAll('.', '\\.')));
assert.match(ci, /\/\/:pkg \/\/:typecheck \/\/:test \/\/:package_authority_test \/\/:package_artifact_test/);
assert.doesNotMatch(
  ci,
  /npm_publish_mode|npm_access|github_package_name|packages:\s*write|TINYLAND_GITHUB_PACKAGES_TOKEN|secrets:\s*inherit/,
);
for (const workflow of await readdir('.github/workflows')) {
  assert.doesNotMatch(workflow, /publish/i);
}
