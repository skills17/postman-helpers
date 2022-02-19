import path from 'path';
import { exec } from 'child_process';

// eslint-disable-next-line import/prefer-default-export
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
