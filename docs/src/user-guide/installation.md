# Installation

## Install the debugger

Most people should install the debugger from within Visual Studio Code:

* Click on the Extensions icon in the Activity Bar on the left.

  <img src="https://code.visualstudio.com/assets/docs/editor/extension-marketplace/extensions-view-icon.png"
       alt="Extensions icon">
* Search for "CBMC Proof Debugger."
* Click on "CBMC Proof Debugger."
* Click on "Install."

For more information, read about
[installing extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)
from the Extension Marketplace.

You can also install the debugger from the project release page:

* Open the
  [release page](https://github.com/model-checking/cbmc-proof-debugger/releases/latest).
* Download the package `cbmc-proof-debugger-*.vsix` at the bottom of the page.
* Run `code --install-extension cbmc-proof-debugger-*.vsix` to install the package.

You can safely ignore the deprecation warning about the Buffer class.

## Uninstall the debugger

To uninstall the debugger from within Visual Studio Code,
* click on the Extensions icon in the Activity Bar on the left,
* click on "CBMC Proof Debugger," and
* click on "Uninstall."

To uninstall the debugger from the command line, run
```
code --uninstall-extension model-checking.cbmc-proof-debugger
```