# Sofie: The Modern TV News Studio Automation System

## Installation (for developers)

For developers, the installation steps are as follows:

```sh
git clone https://github.com/KGWN-Projects/sofie-KGWN-blueprints.git
yarn
yarn build:blueprints
```

The `dist/*-bundle.js` files can then be uploaded, assigned, and configured in the Sofie UI.

## Development

This project builds with webpack and can auto upload on successful compilation

```sh
yarn watch:blueprints # alias to upload to a local instance
# yarn watch --server="http://localhost:3000" # can be used to connect to upload to a remote sofie instance
```

The `--bundle=distriktsnyheter` can be used for watch or build to only build a specific bundle. Warning: using this parameter with the `yarn dist` will cause mismatched versions in the outputs.

There are some unit tests for the project, currently just to validate that the blueprints do not crash while executing.
These can be run with

```sh
yarn test:blueprints
```

When adding code that uses new fields on the MosExternalMetadata, make sure to add a new rundown to the tests, to ensure that code is covered by the few tests that have been added.
