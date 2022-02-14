import path from 'path';
import { ChildProcess, exec } from 'child_process';

export function executeNewman(
  testName: string,
  args: string,
  env?: Record<string, unknown>,
): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const bin = path.resolve(__dirname, '..', '..', 'bin', 'skills17-postman');

    // execute newman in the subdirectory
    const cmd = exec(`${bin} ${args}`, {
      cwd: path.resolve(__dirname, testName),
      env: { ...process.env, FORCE_COLOR: '0', ...env },
    });

    // catch output
    let output = '';
    cmd.stdout?.on('data', (data) => {
      output += data;
    });
    cmd.stderr?.on('data', (data) => {
      output += data;
    });

    // wait until the process finishes
    cmd.on('exit', (code: number) => resolve({ exitCode: code, output }));
  });
}

export function executeApp(): ChildProcess {
  const child = exec(`node app-server.mjs`, {
    cwd: __dirname,
    timeout: 60000,
  });
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);

  return child;
}

export function stripOutput(output: string): string {
  let cleanedOutput = output.trim();
  cleanedOutput = cleanedOutput.replace(/\d+ms/g, () => '000ms');
  cleanedOutput = cleanedOutput.replace(/\d+s/g, () => '000s');
  cleanedOutput = cleanedOutput.replace(/\d+µs/g, () => '000µs');
  return cleanedOutput;
}
