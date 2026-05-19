import { spawn } from 'node:child_process';

const command = 'npx pagefind --site dist';

let output = '';
let stderrOutput = '';

const child = spawn(command, {
  cwd: process.cwd(),
  env: process.env,
  shell: true,
});

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  output += text;
  stderrOutput += text;
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    process.stdout.write(stderrOutput);
    process.exit(0);
  }

  if (isOnlyKnownStemmingWarning(output)) {
    process.stdout.write(stderrOutput);
    console.log('Pagefind completed; ignoring known stemming warning for ja/zh-cn/zh-tw.');
    process.exit(0);
  }

  process.stderr.write(stderrOutput);
  process.exit(code ?? 1);
});

function isOnlyKnownStemmingWarning(text) {
  const clean = stripAnsi(text);
  const hasFinished = /\bFinished in\b/.test(clean);
  const hasStemmingWarning = /Pagefind doesn't support stemming for the language (ja|zh-cn|zh-tw)\./.test(clean);
  const hasError = /\b(error|failed|exception)\b/i.test(clean);

  return hasFinished && hasStemmingWarning && !hasError;
}

function stripAnsi(text) {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}
