import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];

if (!command) {
  console.error('Missing Next.js command.');
  process.exit(1);
}

const distDir = command === 'dev' ? '.next' : '.next-build';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');

const child = spawn(
  process.execPath,
  [nextBin, command],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DIST_DIR: distDir,
    },
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
