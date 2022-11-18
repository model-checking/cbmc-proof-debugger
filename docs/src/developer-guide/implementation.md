# Implementation

This is an overview of the objects in the implementation and the source files
that define these objects.

## Values

A value can be a string, a number, a struct, or an array.  A value can appear in a trace or be stored in memory.
A value is represented in CBMC output as a string that must be parsed.
* value.ts: Defines the Value class and subclasses for strings, number, structs, and arrays.
* valueLexer.ts: A lexer for values in CBMC output.
* valueParser.ts: A parser for values in CBMC output.

## Variables

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

## Failures

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

## Debug adapter

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

## Debugger

* simulator.ts: Simulator is the debugger being managed by the debug adpater
* simulatorState.ts: A state of a trace being simulated by the simulator
* simulatorTrace.ts: A trace being simulated by the simulator (and methods to load the trace)

## Extension activation

* extension.ts: Methods to activate and deactive the debugger extension.

## Extension utilities

* constants.ts: Defines string constants used in the extension
* exceptions.ts: Defines an exception raised by the extension
* storage.ts: Defines methods to access the persistent storage available to the extension
