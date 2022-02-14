import fs from 'fs';
import path from 'path';
import uniqid from 'uniqid';
import TaskConfig from '@skills17/task-config';
import { TestRun } from '@skills17/test-result';

/**
 * Store a test run in a history file
 */
export default function storeTestRun(config: TaskConfig, testRun: TestRun): void {
  const historyDir = path.resolve(config.getProjectRoot(), '.history');
  const historyFile = path.resolve(historyDir, `${uniqid()}.json`);

  // create history dir if it doesn't exist
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir);
  }

  // write history file
  fs.writeFileSync(
    historyFile,
    JSON.stringify(
      { time: Math.round(new Date().getTime() / 1000), ...testRun.toJSON() },
      undefined,
      2,
    ),
  );
}
