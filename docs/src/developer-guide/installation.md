# Installation

Clone the debugger code repository with
```
git clone https://github.com/model-checking/cbmc-proof-debugger
cd cbmc-proof-debugger
```

Install Node.js and all TypeScript/JavaScript dependencies with
```
make setup-macos
```
or
```
make setup-ubuntu
```
depending on your operating system and package management tools.

On other platforms, you can download a Node.js installer for your platform
from the [Node.js download page](https://nodejs.org/en/download),
and the remaining setup steps in the Makefile should work.
If you learn how to build and install this package on your platform,
please submit a [pull request](https://github.com/model-checking/cbmc-proof-debugger/pulls) to contribute your instructions.

From this point, the following targets will be helpful
* `make package` builds the extension package.
* `make install` installs the extension package into Visual Studio Code.
* `make publish` publishes the extension package to the Extension Marketplace.
* `make format` runs the TypeScript formatter to standardize formatting.