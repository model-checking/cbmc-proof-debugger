## Installation

On MacOS, use the [homebrew](https://brew.sh/) package manager to install with

```
brew install node
git clone https://model-checking/cbmc-proof-debugger.git cbmc-proof-debugger
cd cbmc-proof-debugger
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
packages.json into the directory `node_modules`.
The command `make` builds the extension into a file
named `proof-debugger-VERSION.vsix` where `VERSION` is the version number
given in package.json.
The command `make install` runs `code` from the command line to
install the extension in Code.

On other platforms, you can download a Node.js installer for your platform
from the [Node.js download page](https://nodejs.org/en/download),
and the remaining instructions should work.
On Ubuntu, you can install Node.js with just `apt install nodejs`.
If you learn how to build and install this package on your platform,
please submit a pull request to contribute your instructions.
