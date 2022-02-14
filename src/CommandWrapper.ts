import spawn from 'cross-spawn';
import npmRunPath from 'npm-run-path';
import TaskConfig from '@skills17/task-config';
import path from 'path';
import fs from 'fs';
import util from 'util';
import glob0 from 'glob';
import TestResultPrinter from '@skills17/test-result-printer';
import ReportReader from './ReportReader';

const glob = util.promisify(glob0);

export default class CommandWrapper {
  private readonly config: TaskConfig;

  private readonly reportReader: ReportReader;

  constructor(private argv: string[]) {
    this.config = new TaskConfig();
    this.config.loadFromFileSync();
    this.reportReader = new ReportReader(this.config);
  }

  /**
   * Processes the command
   */
  public async process(): Promise<void> {
    // load config
    await this.config.loadFromFile();

    if (!this.isJson()) {
      console.log('Starting newman...'); // eslint-disable-line no-console
    }

    // remove old reports
    const newmanReportsDir = path.resolve(this.config.getProjectRoot(), 'newman');
    if (fs.existsSync(newmanReportsDir)) {
      fs.rmSync(newmanReportsDir, { recursive: true });
    }

    // run newman for each collection
    const collectionsGlob = path.resolve(this.config.getProjectRoot(), 'collections/**/*.json');
    const collections = await glob(collectionsGlob);

    let exitCodePromise = Promise.resolve(0);
    collections.forEach((collection) => {
      exitCodePromise = exitCodePromise.then((previousExitCode) =>
        this.runNewman(collection).then((newExitCode) => {
          this.reportReader.readTestReport();
          return newExitCode > previousExitCode ? newExitCode : previousExitCode;
        }),
      );
    });

    const exitCode = await exitCodePromise;

    if (this.isJson()) {
      console.log(JSON.stringify(this.reportReader.testRun.toJSON(), null, 2)); // eslint-disable-line no-console
    } else {
      const printer = new TestResultPrinter(this.reportReader.testRun);
      console.log(); // eslint-disable-line no-console
      printer.print({
        printFooter: true,
        printPoints: this.config.arePointsDisplayed(),
      });
    }

    process.exit(exitCode);
  }

  /**
   * Run newman
   */
  private runNewman(collection: string): Promise<number> {
    return new Promise((resolve) => {
      // execute newman
      const newman = spawn('newman', this.buildNewmanArgs(collection), {
        cwd: this.config.getProjectRoot(),
        env: {
          ...npmRunPath.env({ env: process.env }),
        },
      });

      newman.on('exit', (code) => resolve(code ?? 1));
      newman.stdout?.pipe(process.stdout);
      newman.stderr?.pipe(process.stderr);
    });
  }

  /**
   * Returns whether the output is json or not
   */
  private isJson(): boolean {
    return this.argv.includes('--json');
  }

  /**
   * Builds arguments that will be passed to the newman command
   */
  private buildNewmanArgs(collection: string): string[] {
    const args = [...this.argv.filter((arg) => arg !== '--json'), collection];

    // add json reporter
    if (!args.includes('--reporters') && !args.includes('-r') && args.length > 0) {
      if (this.isJson()) {
        args.push('--reporters', 'json');
        args.push('--silent');
      } else {
        args.push('--reporters', 'cli,json');
      }
    }

    // add BASE_URL global var
    if (this.config.getServe()?.bind) {
      let baseUrl = `http://${this.config.getServe().bind}`;
      if (this.config.getServe().port) {
        baseUrl = `${baseUrl}:${this.config.getServe().port}`;
      }
      args.push('--global-var', `BASE_URL=${baseUrl}`);
    }

    // add timeouts for good practice
    if (!args.includes('--timeout')) {
      args.push('--timeout', '60000');
    }
    if (!args.includes('--timeout-request')) {
      args.push('--timeout-request', '10000');
    }
    if (!args.includes('--timeout-script')) {
      args.push('--timeout-script', '10000');
    }

    return args;
  }
}
