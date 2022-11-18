# Demonstration

This is a simple demonstration of the CBMC Proof Debugger.

* Follow the CBMC
  [installation](https://model-checking.github.io/cbmc-training/installation.html)
  instructions to install CBMC and CBMC-related tools.
* Follow the debugger [installation](../user-guide/installation.md)
  instructions to add the debugger to Visual Studio Code.
* Clone the debugger code repository and change to the demo directory
  ```
  git clone https://github.com/model-checking/cbmc-proof-debugger
  cd cbmc-proof-debugger/demo
  ```
  This directory contains a simple project consisting of a
  [Makefile](proof-debugger/demo/Makefile) and two source files
  [foo.c](demo/foo.c) and [main.c](demo/main.c).
* Run CBMC on the source code
  ```
  make
  ```
  This will run `goto-cc` to compile the source code for CBMC,
  run `cbmc` to do bounded model checking on the source code with CBMC, and
  run `cbmc-viewer` to produce a browsable summary of the CBMC findings.
* Just for fun, open the browsable summary in a web browser and look around.
  On MacOS, do
  ```
  open report/html/index.html
  ```
  The `report` directory produced by `cbmc-viewer`
  actually contains two subdirectories:
  * `html` contains the browsable summary.
  * `json` contains some JSON files that are summaries of artifacts produced
    by CBMC.

Now let's run the debugger on the error traces produced by CBMC.
In the `demo` project directory:
* Open Visual Studio Code.
  ```
  code .
  ```

* Configure the debugger for this project using the
  [configuration](../user-guide/configuration.md) instructions.
* Open the proof debugger console:  At the bottom of the screen, click on
  the console name "Proof Debugger."
  (If you don't see any consoles at the bottom
  of the screen, click on "View -> Terminal" to make them visible.)
* Load the error traces:  On the right of the debugger console, click on
  "Load Traces," navigate to the folder `demo/report/json` in the dialog
  window, and click on "Open."
* Select the trace you want to debug: Clicking on the failure description
  for the failure you want to debug.  For example, under Line 3,
  click on "dereference failure: pointer NULL in *ptr."
* Start the debugger:  Click on the "debug and run" icon on the left,
  and select the "CBMC Proof Debugger" from the drop-down list of available
  debuggers at the top, and press the green "start" icon to the left of
  "CBMC Proof Debugger."

Now you can see the familiar debugger interface. In particular, you can see
the debugger toolbar at the top of the screen.

<img src="debugger-toolbar.png" alt="Debugger toolbar"
     style="height: 40px; margin: auto; display: block;">

The icons left-to-right are:
* Run forwards
* Step over forwards
* Step into function
* Step out of function
* Step over backwards
* Run backwards
* Restart the debugger
* Halt the debugger

For more information, read about
[debugging](https://code.visualstudio.com/docs/editor/debugging).

Now you can use the debugger interface to examine the program behavior
determined by the error trace just as you would to examine the program
behavior determined by a set of input values.

* You can run forward to run until the failure occurs, examine
  the program stack, and step forwards and backwards to examine the
  code leading up to the failure.
* You can set a break point and run forwards or backwards to a break point.
* You can examine data in any stack frame, any static variable, and any
  heap object by clicking in the data view on the left.  In particular,
  for structured data like strings, arrays, and structs, you can click
  on a value to open it up and expose data components.
