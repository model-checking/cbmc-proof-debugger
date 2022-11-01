# Architecture

This document describes the overall architecture of the proof
debugger.  It describes the major components of the implementation and
the organization of the source code.  A lot of the presentation here
comes from comments embedded in the source code.  For more detail, see
the source code itself.

## Visual Studio Code

The [user documentation](https://code.visualstudio.com/docs)
is the place to start if you are unfamiliar with Visual Studio Code.  The
[user guide](https://code.visualstudio.com/docs/editor/codebasics)
introduces the basic concepts like
[editing](https://code.visualstudio.com/docs/editor/codebasics)
and
[debugging](https://code.visualstudio.com/docs/editor/debugging).
Most important are
* The
  [debug actions](https://code.visualstudio.com/docs/editor/debugging#_debug-actions)
  that a software developer uses to interact with a debugger.
* The [debug configuration](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations)
  that a software developer uses to select a debugger.


The [developer documentation](https://code.visualstudio.com/api) is the place
for extension developers to start.
Most important is
* The
  [debugger extension](https://code.visualstudio.com/api/extension-guides/debugger-extension)
  overview gives a fairly complete example of how to write and package a debugger
  extension.
  The code repository used in that example was the starting point for this debugger.


You should now be able to read the code implementing this debugger,
but you will eventually want to skim
* The
  [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
  that describe the Visual Studio Code Extension APIs.
  This debugger uses
  * [Tree Views](https://code.visualstudio.com/api/extension-guides/tree-view)
    to display the code issues having traces available for debugging.
* The [UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)
  that describe the Visual Studio Code user interface.  This debugger uses

  * [Views](https://code.visualstudio.com/api/ux-guidelines/views)
    as containers of the content that appears in sidebars and panels,
  * [Sidebars](https://code.visualstudio.com/api/ux-guidelines/sidebars)
    and
    [Panels](https://code.visualstudio.com/api/ux-guidelines/panel)
    to display views, and
  * [Notifications](https://code.visualstudio.com/api/ux-guidelines/notifications)
    to display progress and error messages.

## Architecture overview

Visual Studio Code implements a generic user interface to debuggers.
A developer needs to learn only one user interface to use any debugger
supported by VS Code.
For example, using the debug toolbar

<center>
<img src="https://code.visualstudio.com/assets/docs/editor/debugging/toolbar.png">
</center>

a developer can run the program to a breakpoint, step over a function call, step into a function call,
step out of a function call, restart the program, and stop the program.
Adding a new debugger to VS Code involves writing a new VS Code extension that tells VS Code how to
drive the debugger.

The
[debugging architecture](https://code.visualstudio.com/api/extension-guides/debugger-extension#debugging-architecture-of-vs-code)
of Visual Studio Code is described in the
[Debugger Extension](https://code.visualstudio.com/api/extension-guides/debugger-extension)
guide.
In this architecture, a debug adapter sits between VS Code and the debugger.

<center>
<img src="https://code.visualstudio.com/assets/api/extension-guides/debugger-extension/debug-arch1.png">
</center>

The role of the debug adapter is to receive a request from VS Code,
to drive or interrogate the debugger on behalf of VS Code,
and to send an appropriate response back to VS Code.
The debug adapter also sends events to VS Code when certain events happen
within the debugger (for example, when the debugger comes to a stopping point).


VS Code communicates with the debug adapter using the
[Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol).
The [protocol specification](https://microsoft.github.io/debug-adapter-protocol/specification)
defines the set of requests, responses, and event notifications sent between VS Code and the
debug adapter.
The [protocol overview](https://microsoft.github.io/debug-adapter-protocol/overview) gives a nice example
of a sequence of requests and events that might be sent between VS Code and a debug adapter
for gdb:
<center>
<img src="https://microsoft.github.io/debug-adapter-protocol/img/init-launch.png">
</center>

## Implementation overview

### Values

A value can be a string, a number, a struct, or an array.  A value can appear in a trace or be stored in memory.
A value is represented in CBMC output as a string that must be parsed.
* value.ts: Defines the Value class and subclasses for strings, number, structs, and arrays.
* valueLexer.ts: A lexer for values in CBMC output.
* valueParser.ts: A parser for values in CBMC output.

### Variables

A variable in a trace is a string like 'foo.bar[0]` consisting of a base name 'foo'
followed by a list of selectors like field member selection '.bar' or array
indexing '[0]'.
We model memory as a single struct, so 'foo.bar[0]' is modeled as 'MEMORY.foo.bar[0]'.
We think of '.foo.bar[0]' as a path through memory, where path elements
denote field selection and array indexing.
A variable is represented in CBMC output as a string that must be parsed.
* variable.ts: Defines the Element class and subclasses for field selection and array indexing.
* variableLexer.ts: A lexer for variables in CBMC output.
* variableParser.ts: A parser for variables in CBMC output.

### Failures

A panel at the bottom of the screen displays the set of failures that can be debugged.
The failures are organized into a tree and displayed as
nested lists of files, functions within a file, lines within a
function, and failures at a line.
The debug extension describes this tree to Visual Studio Code using the Tree View API.
The key to the Tree View is the TreeDataProvider interface that includes
functions like getChildren(node) returning a node's children and getTreeItem(node)
returning a node's contents.
So the debug extension must load the failures available for debugging,
organize them into a tree,
and use the tree to implement the TreeDataProvider interface.
* traceData.ts:
  The method create(result, property, loop) loads the summaries produced
  by cbmc-viewer and returns a mapping file_name -> function_name -> line_number -> failure.
* traceTree.ts:
  The method create(mapping) transforms a failure mapping into a failure tree.
* traceView.ts:
  The class TraceProvider implements the TreeDataProvider.

### Debug adapter

The debug adapter sits between Visual Studio Code and the debugger.
The job of the debug adapter is to accept requests from Visual Studio
Code like "set breakpoint" and "run" and to generate responses after
driving the debugger and inspecting its state.

Visual Studio Code and the debug adapter communicate via requests and responses
defined by the [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol).
Visual Studio Code sends the
[SetBreakpointsRequest](https://microsoft.github.io/debug-adapter-protocol/specification#Requests_SetBreakpoints)
to the debug adapter which sends a SetBreakpointsResponse back to Visual Studio Code.

The class ProofDebuggerSession implements the DebugSession interface.  It maintains the state of the
debug adapter for one debugging session, and it implements methods like setBreakPointsRequest that
Visual Studio Code can use to send the SetBreakpointsRequest and receive the SetBreapointsRepsonse.

How the debug adapter and the debugger communicate is of no concern to Visual Studio Code.  In our case,
the debugger is really just a trace simulator.  The debug adaptor uses methods in the simulator interface
to move the simulator forwards and backwards in the trace, and to examine the current state of the trace.

* adapter.ts: Defines ProofDebuggerSession implementing the DebugSession interface.

### Debugger

* simulator.ts: Simulator is the debugger being managed by the debug adpater
* simulatorState.ts: A state of a trace being simulated by the simulator
* simulatorTrace.ts: A trace being simulated by the simulator (and methods to load the trace)

### Extension activation

* extension.ts: Methods to activate and deactive the debugger extension.

### Extension utilities

* constants.ts: Defines string constants used in the extension
* exceptions.ts: Defines an exception raised by the extension
* storage.ts: Defines methods to access the persistent storage available to the extension
