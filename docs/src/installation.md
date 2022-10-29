# Installation

We expect this proof debugger to be released as an extension in the
[Visual Studio Code Marketplace](https://marketplace.visualstudio.com/VSCode).
At that point, users will install the debugger from within Code itself
just like any other extension in the marketplace.

For now, install the debugger manually as follows.

## MacOS

On MacOS, use the [homebrew](https://brew.sh/) package manager to install with

```
brew install node
git clone https://gitlab.aws.dev/cbmc/proof-debugger.git proof-debugger
cd proof-debugger
npm install
make
make install
```

The [homebrew](https://brew.sh/) page gives instructions for
installing `brew`.
The command `brew install node` installs the [Node.js](https://nodejs.org)
runtime for [JavaScript](https://en.wikipedia.org/wiki/JavaScript),
including the [npm](https://docs.npmjs.com/about-npm) package manager.
The command `npm install` installs the dependencies listed in
`package.json` into the directory `node_modules`.
The command `make` builds the extension into a file
named `proof-debugger-VERSION.vsix` where `VERSION` is the version number
given in `package.json`.
The command `make install` runs `code` from the command line to
install the extension into Visual Studio Code.

## Other platforms

On other platforms, you can download a Node.js installer for your platform
from the [Node.js download page](https://nodejs.org/en/download),
and the remaining instructions should work.
On Ubuntu, you can install Node.js with just `apt install nodejs`.
If you learn how to build and install this package on your platform,
please submit a [pull request](https://gitlab.aws.dev/cbmc/proof-debugger/merge_requests) to contribute your instructions.
