# Sofie: The Modern TV News Studio Automation System

## Installation (for developers)

For developers, the installation steps are as follows:

```sh
git clone https://github.com/KGWN-Projects/sofie-KGWN-blueprints.git
yarn
yarn build:blueprints
```

When adding code that uses new fields on the MosExternalMetadata, make sure to add a new rundown to the tests, to ensure that code is covered by the few tests that have been added.
