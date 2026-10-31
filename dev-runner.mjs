#!/usr/bin/env node
/**
 * Shared dev launcher for every project in this workspace.
 *
 * Vite already falls forward to the next free port (5173 -> 5174 -> ...). This
 * does the same for the Express/MSSQL backend: it picks the first free port at
 * or above 3001, then starts Vite with VITE_API_URL pointed at that exact port.
 * That keeps the UI talking to the backend that is actually running instead of
 * whatever else happens to hold 3001.
 *
 * Run through `npm run dev` from a project directory.
 */
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const cwd = process.cwd();
const startPort = Number(process.env.PORT) || 3001;
const lastPort = startPort + 50;

function isFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port);
  });
}

let backendPort = startPort;
while (backendPort <= lastPort && !(await isFree(backendPort))) {
  backendPort += 1;
}
if (backendPort > lastPort) {
  console.error(`[dev] No free backend port in ${startPort}-${lastPort}.`);
  process.exit(1);
}

const children = [];
let shuttingDown = false;

function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) stop(child);
  process.exit(code);
}

function start(name, color, args, extraEnv) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push(child);

  const prefix = `\u001b[${color}m[${name}]\u001b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8');
    let buffered = '';
    stream.on('data', (chunk) => {
      buffered += chunk;
      const lines = buffered.split('\n');
      buffered = lines.pop();
      for (const line of lines) process.stdout.write(prefix + line + '\n');
    });
    stream.on('end', () => {
      if (buffered) process.stdout.write(prefix + buffered + '\n');
    });
  }

  child.on('error', (err) => {
    console.error(`[dev] Failed to start ${name}: ${err.message}`);
    shutdown(1);
  });
  child.on('exit', (code) => shutdown(code ?? 0));

  return child;
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

if (backendPort !== startPort) {
  console.log(`[dev] Port ${startPort} is in use — the backend will use ${backendPort}.`);
}

start('backend', '36', ['backend/server.js'], { PORT: String(backendPort) });
start('frontend', '35', [path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js'), '--logLevel', 'info'], {
  VITE_API_URL: `http://localhost:${backendPort}`,
});
