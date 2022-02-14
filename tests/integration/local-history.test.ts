import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { ChildProcess } from 'child_process';
import { executeApp, executeNewman } from './utils';

const historyDir = path.resolve(__dirname, 'local-history', '.history');
const disabledHistoryDir = path.resolve(__dirname, 'local-history-disabled', '.history');

describe('local history', () => {
  let app: ChildProcess;
  beforeAll(() => {
    // serve app
    app = executeApp();
  });

  afterAll(() => {
    // kill app
    app.kill();
  });

  beforeEach(() => {
    if (fs.existsSync(historyDir)) {
      rimraf.sync(historyDir);
    }
  });

  it('stores a history file for a test run', async () => {
    expect(fs.existsSync(historyDir)).toEqual(false);

    // execute newman in the subdirectory
    await executeNewman('local-history', 'run');

    expect(fs.existsSync(historyDir)).toEqual(true);

    const historyFiles = fs.readdirSync(historyDir);

    expect(historyFiles).toHaveLength(1);

    historyFiles.forEach((file) => {
      const history = JSON.parse(fs.readFileSync(path.resolve(historyDir, file)).toString());

      expect(typeof history.time).toEqual('number');
      expect(history.testResults).toStrictEqual([
        {
          group: history.testResults[0].group,
          points: 1,
          maxPoints: 2,
          strategy: 'add',
          manualCheck: false,
          tests: [
            {
              name: 'Foo > test',
              points: 1,
              maxPoints: 1,
              successful: true,
              required: false,
              manualCheck: false,
            },
            {
              name: 'Bar > test',
              points: 0,
              maxPoints: 1,
              successful: false,
              required: false,
              manualCheck: false,
            },
          ],
        },
      ]);
    });
  }, 60000);

  it('is disabled by default', async () => {
    expect(fs.existsSync(disabledHistoryDir)).toEqual(false);

    // execute newman in the subdirectory
    await executeNewman('local-history-disabled', 'run');

    expect(fs.existsSync(disabledHistoryDir)).toEqual(false);
  }, 60000);
});
