# skills17/postman-helpers

This package provides Postman helpers for usage in a skills competition environment. It includes:
- Custom output formatter
- Opinionated Newman run command for multiple collections at once
- ... and more

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

**Requirements:**
- Node `16` or greater
- Postman `9.0` or greater

To install this package, run the following command:

```bash
npm install @skills17/postman-helpers
```

It is suggested to add the following npm scripts:

```json
  "scripts": {
    "test": "skills17-postman run",
    "test:json": "skills17-postman run --json"
  },
```

This will provide the following commands:
- `npm test` - Run all tests once and show a nice output with the awarded points (useful for the competitors to see their points)
- `npm run test:json` - Run all tests once and get a json output (useful for automated marking scripts)

The runner will look for exported Postman collections in a `collections/` folder and run them all.

## Usage

A `config.yaml` file needs to be created that contains some information about the task. It should be placed in the root folder of your task, next to the `package.json` file.

See the [`@skills17/task-config`](https://github.com/skills17/task-config#configuration) package for a detailed description of all available properties in the `config.yaml` file.

### CLI

As seen in the installation instructions, the `skills17-postman` command is available.

It is a thin wrapper around the actual `newman` command which prepares the task and configures Newman correctly.

All arguments to the command will be forwarded to `newman` so Newman can be used exactly the same way if this package wouldn't be installed.

Additionally, the following new arguments are available:
- `--json` output the test result with scored points in json to standard out

### Grouping

A core concept are request folders. You usually don't want to test everything for one criterion in one request test function but instead split it into multiple ones for a cleaner tests and a better overview.

In Postman, tests can be grouped by folders. Request names have to be specified with their path in the `config.yaml` file.

For example, a request with name "bar" in a collection "skills" and folder "foo" will have the name `skills > foo > bar`.

To catch and group all tests within the `foo` context, the group matcher can be set to `skills > foo > .+` for example. Each of the tests within that group will now award 1 point to the group.

### Extra tests

To prevent cheating, extra tests can be used.
They are not available to the competitors and should test exactly the same things as the normal tests do, but with different values.

For example, if your normal test contains a check to reject a random token in a header (e.g. 'foo'), copy the test into an extra test and change the token to another value (e.g. 'bar').
Since the competitors will not know the extra test, it would detect statically returned responses that were returned to simply satisfy the 'foo' tests instead of actually implementing the requested logic.

Extra tests are detected if they the collection name contains a suffix `extra`. That means that you can duplicate your collection `foo` and name it `foo-extra`. The test names should exactly equal the ones from the normal tests. If they don't, a warning will be displayed.

It usually makes sense to move the extra tests in a separate folder, so the folder can simply be deleted before the tasks are distributed to the competitors.
Nothing else needs to be done or configured.

If an extra test fails while the corresponding normal test passes, a warning will be displayed that a manual review of that test is required since it detected possible cheating.
The penalty then has to be decided manually from case to case, the points visible in the output assumed that the test passed and there was no cheating.

## License

[MIT](https://github.com/skills17/postman-helpers/blob/master/LICENSE)
