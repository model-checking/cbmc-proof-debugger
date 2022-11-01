/** Display name for the debugger used by code in menus, etc. */
export const debuggerName = 'Proof debugger';
/** Type name for the debugger used by code to identify the debugger. */
export const debuggerType = 'proof-debugger';

/** File containing loop data from viewer. */
export const viewerLoopFile = 'viewer-loop.json';
/** JSON key identifying blob of loop data from viewer. */
export const viewerLoopHeaderKey = 'viewer-loop';
/** JSON key of loop data from viewer. */
export const viewerLoopKey = 'loops';

/** File containing result data from viewer. */
export const viewerResultFile = 'viewer-result.json';
/** JSON key identifying blob of result data from viewer. */
export const viewerResultHeaderKey = 'viewer-result';
/** JSON key of result data from viewer. */
export const viewerResultKey = 'results';

/** File containing trace data from viewer. */
export const viewerTraceFile = 'viewer-trace.json';
/** JSON key identifying blob of trace data from viewer. */
export const viewerTraceHeaderKey = 'viewer-trace';
/** JSON key of trace data from viewer. */
export const viewerTracesKey = 'traces';

/** Step kind for a function call in a trace. */
export const functionCallStepKind = 'function-call';
/** Step kind for a function return in a trace. */
export const functionReturnStepKind = 'function-return';
/** Step kind for an assignment of actual to formal function parameters in a trace. */
export const parameterAssignmentStepKind = 'parameter-assignment';
/** Step kind for an assignment to a variable in a trace. */
export const variableAssignmentStepKind = 'variable-assignment';
/** Step kind for a failure (property violation) in a trace. */
export const failureStepKind = 'failure';

/** The reason for a failure in a failure step in a trace. */
export const stepFailureReason = 'reason';
/** The LHS variable for an assignment in a trace. */
export const stepAssignLhsKey = 'lhs';
/** The RHS value for an assignment in a trace. */
export const stepAssignRhsKey = 'rhs-value';
/** The fully-scoped name of the variable on the LHS of an assignment in a trace. */
export const stepAssignLhsPathKey = 'lhs-lexical-scope';

/** File containing property data from viewer. */
export const viewerPropertyFile = 'viewer-property.json';
/** JSON key identifying blob of property data from viewer. */
export const viewerPropertyHeaderKey = 'viewer-property';
/** JSON key of property data from viewer. */
export const viewerPropertyKey = 'properties';

/** The source location of a property included in the results data from viewer. */
export const viewerPropertyLocationKey = 'location';
/** The description of a property included in the results data from viewer. */
export const viewerPropertyDescriptionKey = 'description';

/** Key for the trace folder in persistent storage. */
export const traceFolderStorageKey = 'traceFolder';
/** Command to get the trace folder from persistent storage. */
export const getTraceFolderCommand = 'proofDebugger.getTraceFolder';
/** Command to set the trace folder in persistent storage. */
export const setTraceFolderCommand = 'proofDebugger.setTraceFolder';
/** Command to show the trace folder in a dialog box. */
export const showTraceFolderCommand = 'proofDebugger.showTraceFolder';
/** Command to select and set the trace folder from a file dialog box. */
export const getTraceFolderDialogCommand = 'proofDebugger.setTraceFolderDialog';

/** Key for the trace name in persistent storage. */
export const traceNameStorageKey = 'traceName';
/** Command to get the trace name from persistent storage. */
export const getTraceNameCommand = 'proofDebugger.getTraceName';
/** Command to set the trace name from persistent storage. */
export const setTraceNameCommand = 'proofDebugger.setTraceName';
/** Command to show the trace name in a dialog box. */
export const showTraceNameCommand = 'proofDebugger.showTraceName';

/** Command to load the list of traces in the trace view panel. */
export const refreshTraceListCommand = 'traceView.refresh';
/** Name of the data provider giving the list of traces for the trace view panel. */
export const traceViewProviderName = 'proof-debugger-trace-view';

/** The file name is missing in a source location in a trace. */
export const fileMissing = 'MISSING';
/** The function name is missing in a source location in a trace. */
export const functionMissing = 'MISSING';
/** The line number is missing in a source location in a trace. */
export const lineMissing = 0;
/** Prefix for a file name used in a source location for built-in functions. */
export const fileBuiltInPrefix1 = '<built-in-';
/** Prefix for a file name used in a source location for built-in functions. */
export const fileBuiltInPrefix2 = '<builtin-';

/**
 * Log file for the log of requests and responses in the debug adapter protocol.
 *
 * This is used only while debugging the debug adapter.
 * */
export const logFile = 'proof-debugger.txt';

/** Name of the stack frame used to model heap memory. */
export const heapFrameName = 'Heap';
/** Name of the stack frame used to model static memory. */
export const staticFrameName = 'Static';
/** Name of the local scope of a stack frame. */
export const localScopeName = 'Local';

/** Component separator in fully-scoped names of variables. */
export const moduleSeparator = '::';
/** Component name for heap objects in fully-scoped names of variables. */
export const heapVariablePrefix = 'symex_dynamic';

/** Output channel used by the debug adapter to send messages to the user */
export const outputChannel = 'Proof debugger';

/**
 * Maximum length of an unsummarized memory value.
 *
 * The shallowString() methods of the memory objects will return value summaries
 * like "{a:.., b:..}" of values whose value results in a string longer than
 * this value.
*/
export const shallowLength = 20;