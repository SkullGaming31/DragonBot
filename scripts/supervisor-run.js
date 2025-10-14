const { spawn } = require('child_process');

console.log('Starting supervisor: spawning `npm run dev`');

let child;
if (process.platform === 'win32') {
  // Use cmd.exe /c to reliably run npm on Windows in child_process spawn
  child = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
    cwd: process.cwd(),
    env: process.env,
  });
} else {
  child = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: process.env,
  });
}

child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');

child.stdout.on('data', (chunk) => {
  chunk.toString().split(/\r?\n/).forEach(line => {
    if (line) console.log(`[child stdout] ${line}`);
  });
});

child.stderr.on('data', (chunk) => {
  chunk.toString().split(/\r?\n/).forEach(line => {
    if (line) console.error(`[child stderr] ${line}`);
  });
});

child.on('exit', (code, signal) => {
  console.log(`Child exited. code=${code} signal=${signal}`);
  process.exit(code ?? (signal ? 1 : 0));
});

child.on('error', (err) => {
  console.error('Failed to start child process:', err);
  process.exit(1);
});

// forward SIGINT/SIGTERM to child
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(sig => {
  process.on(sig, () => {
    console.log(`Supervisor got ${sig}, forwarding to child`);
    child.kill(sig);
  });
});
