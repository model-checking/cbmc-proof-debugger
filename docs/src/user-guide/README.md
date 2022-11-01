# User guide


We expect to have a user guide soon, but for now, follow the installation
instructions above and then...
(warning: these instructions are a work in progress)

* start code in the root of your code repository
* click on the debugger icon to open the debug window
* click on "configure" to configure the debugger (select "proof debugger"
  from among the options)
* click on the "Proof debugger" tab in the console window
* click on the "Load traces" button at the top of the proof
  debugger console.
* naviagte to the `json` directory produced by `cbmc-viewer` (this is usually
  `report/json` under the directory in which you ran `cbmc-viewer`).
* click on the error trace you want to debug
* use the debugger controls at the top of the Code window as you would with
  any other debugger.
