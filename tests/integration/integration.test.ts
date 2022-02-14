import fs from 'fs';
import path from 'path';
import { ChildProcess } from 'child_process';
import { executeApp, executeNewman, stripOutput } from './utils';

describe('integration tests', () => {
  // get all integration tests
  const integrationTests = fs.readdirSync(__dirname).filter((file) => {
    const fileInfo = fs.statSync(path.resolve(__dirname, file));
    return fileInfo.isDirectory();
  });

  let app: ChildProcess;
  beforeAll(() => {
    // serve app
    app = executeApp();
  });

  afterAll(() => {
    // kill app
    app.kill('SIGINT');
  });

  it.each(integrationTests)(
    '%s - console reporter',
    async (test) => {
      // execute newman in the subdirectory
      let { output } = await executeNewman(test, 'run');
      output = stripOutput(output);

      // update expected output if required
      if (process.env.UPDATE_EXPECTED_OUTPUT === '1') {
        fs.writeFileSync(path.resolve(__dirname, test, 'expected.txt'), output);
      }

      // read expected output
      const expectedOutput = fs.readFileSync(path.resolve(__dirname, test, 'expected.txt'));

      expect(output).toEqual(expectedOutput.toString().trim());
    },
    60000,
  );

  it.each(integrationTests)(
    '%s - json reporter',
    async (test) => {
      // execute newman in the subdirectory
      let { output } = await executeNewman(test, 'run --json');
      output = stripOutput(output);

      // update expected output if required
      if (process.env.UPDATE_EXPECTED_OUTPUT === '1') {
        fs.writeFileSync(path.resolve(__dirname, test, 'expected.json'), output.trim());
      }

      // read expected output
      const expectedOutput = fs.readFileSync(path.resolve(__dirname, test, 'expected.json'));

      expect(output).toEqual(expectedOutput.toString().trim());
    },
    60000,
  );
});
