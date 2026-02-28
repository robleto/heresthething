#!/usr/bin/env node

import net from 'node:net';
import { spawn } from 'node:child_process';

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function pickPort(preferredPort, fallbackPorts) {
  const allPorts = [preferredPort, ...fallbackPorts.filter((port) => port !== preferredPort)];

  for (const port of allPorts) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  return null;
}

async function main() {
  const mode = process.argv[2];
  if (!mode || !['dev', 'start'].includes(mode)) {
    console.error('Usage: node scripts/run-next-with-port.mjs <dev|start>');
    process.exit(1);
  }

  const preferredPort = Number(process.env.PORT) || 3000;
  const fallbackPorts = Array.from({ length: 10 }, (_, index) => 3001 + index);
  const chosenPort = await pickPort(preferredPort, fallbackPorts);

  if (!chosenPort) {
    console.error('No available ports found in range 3000-3010.');
    process.exit(1);
  }

  const args = mode === 'dev'
    ? ['dev', '--turbopack', '-p', String(chosenPort)]
    : ['start', '-p', String(chosenPort)];

  console.log(`Starting Next.js in ${mode} mode on port ${chosenPort}...`);

  const child = spawn('next', args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
