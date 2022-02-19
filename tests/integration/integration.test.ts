import fs from 'fs';
import path from 'path';
import { executeNewman } from './utils';

describe('integration tests', () => {
  // get all integration tests
  const integrationTests = fs.readdirSync(__dirname).filter((file) => {
    const fileInfo = fs.statSync(path.resolve(__dirname, file));
    return fileInfo.isDirectory();
  });

  it.each(integrationTests)(
    '%s - console reporter',
    async (test) => {
      // execute newman in the subdirectory
      const { output } = await executeNewman(test, 'run');
      const resultOutput = output
        .substring(output.indexOf('------------       RESULT       ------------'))
        .trim();

      // update expected output if required
      if (process.env.UPDATE_EXPECTED_OUTPUT === '1') {
        fs.writeFileSync(path.resolve(__dirname, test, 'expected.txt'), resultOutput);
      }

      // read expected output
      const expectedOutput = fs.readFileSync(path.resolve(__dirname, test, 'expected.txt'));

      expect(resultOutput).toEqual(expectedOutput.toString().trim());
    },
    60000,
  );

  it.each(integrationTests)(
    '%s - json reporter',
    async (test) => {
      // execute newman in the subdirectory
      const { output } = await executeNewman(test, 'run --json');
      const resultOutput = output
        .substring(output.indexOf('------------       RESULT       ------------'))
        .trim();

      // update expected output if required
      if (process.env.UPDATE_EXPECTED_OUTPUT === '1') {
        fs.writeFileSync(path.resolve(__dirname, test, 'expected.json'), resultOutput);
      }

      // read expected output
      const expectedOutput = fs.readFileSync(path.resolve(__dirname, test, 'expected.json'));

      expect(resultOutput).toEqual(expectedOutput.toString().trim());
    },
    60000,
  );
});
