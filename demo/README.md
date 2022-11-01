# Demo: A Code debugger for CBMC traces

## Preparation

Do the following to prepare

```
cd $HOME/proof-debugger/demo
make demo
export PATH=${HOME}/cbmc-viewer:$PATH
```

## Demonstration

This is an extension to Visual Studio Code that contributes a debugger
for debugging error traces from CBMC using standard interface to a
debugger provided by Visual Studio Code.

I'm demonstrating this on C.  It also works for Rust.

Let's run CBMC as we usually do:

```
cd $HOME/proof-debugger/demo
make report
```

Look at the report, look at the json.  Viewer renders the json.
We want visual studio code to render the json.

```
code --install-extension proof-debugger-0.0.1.vsix
code .
load the traces
select the trace
open debugger view
choose viewer environment
select configure
choose viewer environment
close double debuggers and restart debugger
```

Starting
* Open code with 'code .'
* Open the debuger panel
* Open the configuration and configure 'Viewer'
* Load the traces and select the trace.
* Run the debugger on the trace

Demo:
* Run to the failure
* Show the stack, statics, heap.
* Show how to examine a heap object
* Show stepping backwards
* Show setting a break point, reset to start, and run to break point

* Show stepping over basic data types
* Show stepping over a function
* Show stepping into a function
* Show stack, static, heap

HTML viewer still has value
* It is how customers see CI results
* It is how customers debug traces

JSON has value:
* dump to cloudwatch for metrics
* use in CI to detect changes

Debugger has room for growth:
* function breakpoints
* variable watch breakpoints
* tooltip giving variable values
* expression evaluation

Most important:
* Runs on Rust, but variables are MIR values
* Need to map MIR values to Rust values
