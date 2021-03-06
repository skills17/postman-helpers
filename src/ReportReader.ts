import TaskConfig from '@skills17/task-config';
import { TestRun } from '@skills17/test-result';
import path from 'path';
import fs from 'fs';
import { NewmanItem, NewmanReport } from './types';

export default class ReportReader {
  public readonly testRun: TestRun;

  private readonly consumedReports: string[] = [];

  constructor(private config: TaskConfig) {
    this.testRun = this.config.createTestRun();
  }

  readTestReport() {
    const files = this.orderRecentFiles();
    if (!files.length) {
      throw new Error('Could not find recent newman json report.');
    }
    const recentReport = path.resolve(this.config.getProjectRoot(), 'newman', files[0].file);

    if (this.consumedReports.includes(recentReport)) {
      throw new Error(
        'Most recent report has already been consumed. There should have be a more recent one.',
      );
    }

    this.consumedReports.push(recentReport);
    const newmanReport = JSON.parse(String(fs.readFileSync(recentReport)));
    this.record(newmanReport);
  }

  private orderRecentFiles() {
    const dir = path.resolve(this.config.getProjectRoot(), 'newman');
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs
      .readdirSync(dir)
      .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
      .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  }

  private record(newmanReport: NewmanReport) {
    // build request id to name lookup map recursively
    const requests = ReportReader.buildRequestNames(newmanReport);

    // newman includes requests sent in pre-request scripts as an identical execution items,
    // which leads to duplicate requests. We extract tests first and deduplicating executions, and then record them.

    // extract tests
    const tests: {
      [id: string]: { fullName: string; testName: string; extra: boolean; successful: boolean };
    } = {};
    newmanReport?.run?.executions?.forEach((execution) => {
      execution.assertions?.forEach((assertion) => {
        const testIdentifier = `${execution.item.id}-${assertion.assertion}`;
        if (tests[testIdentifier]) {
          if (assertion.error) {
            tests[testIdentifier].successful = false;
          }
        } else {
          tests[testIdentifier] = {
            fullName: `${requests[execution.item.id].fullName} > ${assertion.assertion}`,
            testName: `${requests[execution.item.id].testName} > ${assertion.assertion}`,
            extra: requests[execution.item.id].isExtra,
            successful: !assertion.error,
          };
        }
      });
    });

    // record test results
    Object.values(tests).forEach((test) => {
      this.testRun.recordTest(test.fullName, test.testName, test.extra, test.successful);
    });
  }

  private static buildRequestNames(newmanReport: NewmanReport): {
    [id: string]: { fullName: string; testName: string; isExtra: boolean };
  } {
    const result: {
      [id: string]: { fullName: string; testName: string; isExtra: boolean };
    } = {};

    const isExtra = newmanReport.collection?.info?.name?.toLowerCase().endsWith('extra');

    function traverse(item: NewmanItem, parentName: string) {
      const testName = item.name;
      const fullName = `${parentName} > ${testName}`;
      result[item.id] = { fullName, testName, isExtra };

      if (item.item) {
        item.item.forEach((child) => traverse(child, fullName));
      }
    }

    newmanReport.collection?.item?.forEach((item) =>
      traverse(item, newmanReport.collection?.info?.name),
    );

    return result;
  }
}
