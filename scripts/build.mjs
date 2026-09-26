import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'assets'), { recursive: true });

const tsc = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const result = spawnSync(tsc, ['-p', resolve(root, 'tsconfig.json')], {
  cwd: root,
  stdio: 'inherit',
  shell: false
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await cp(resolve(root, 'public'), dist, { recursive: true });
console.log(`Built PWA to ${dist}`);
