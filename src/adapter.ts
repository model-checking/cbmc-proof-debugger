/**
 * This is the debug adapter for the proof debugger.
 *
 * The role of the debug adapter is to receive requests from visual studio code,
 * to drive or interrogate the debugger, and send responses to visual studio
 * code. The debug adapter sends events to visual studio code when certain
 * events happen in the debugger (eg, the debugger comes to a stopping point).
 * The interaction between code and the debug adapter is defined by the Debug
 * Adapter Protocol.
 *
 * This file implements a class extending a DebugSession.  Code communciates
 * with the adapter by invoking methods in the API of a DebugSession.
 *
 * There is a good overview of the Debug Adapter Protocol at
 * https://code.visualstudio.com/api/extension-guides/debugger-extension and
 * https://microsoft.github.io/debug-adapter-protocol/overview
 *
 * There is good documentation of the requests and responses in the protocol at
 * https://microsoft.github.io/debug-adapter-protocol/specification
 *
 * The overview uses an example that formed the basis of this work at
 * https://github.com/microsoft/vscode-mock-debug.git
 */

// @ts-ignore
import { Subject } from 'await-notify';
import * as vscode from 'vscode';
import {
    Logger, logger, LoggingDebugSession,
    InitializedEvent, TerminatedEvent, StoppedEvent,
    Thread, StackFrame, Scope, Source
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';

import { outputChannel, logFile, localScopeName, getTraceFolderCommand, getTraceNameCommand } from './constants';
import { Simulator, Status } from './simulator';
import * as state from './simulatorState';

/**
 * The debug adapter managing the debugger for a single debug session.  In the
 * comments below, the client is Visual Studio Code and the debugger is the
 * Proof debugger trace simulator.
 */
export class ProofDebuggerSession extends LoggingDebugSession {

    /**
     * The thread id used by the adapter in all communication with the client.
     * This is a single-threaded debugger.  Multiple threads are not suppored.
     */
    private static threadID = 1;

    /**
     * The signal used by within debug adapter to synchronize initialization and
     * launch.  The initialization phase sends the signal when initialization is
     * done, and the launch phase waits for the signal before launching the
     * debugger.
     */
    private configurationDone = new Subject();

    /**
     * The debugger (the Proof debugger trace simulator) managed by the debug adapter.
     */
    simulator: Simulator = new Simulator();

    /**
     * An output channel used by the debug adapter and the debugger to display
     * information like variable assignments to the user.
     */
    output: vscode.OutputChannel = vscode.window.createOutputChannel(outputChannel);

    /**
     * A copy of the configuration information sent by the client to the debug
     * adapter in the Initialize request.  The initializer here is a placeholder
     * using a bogus value for the one argument required by the interface.
     */
    private initializeRequestArgs: DebugProtocol.InitializeRequestArguments = {
        'adapterID': 'none'  // bogus value
    };

    /**
     * Construct a debug adapter for a debug session.
     */
    public constructor() {
        super(logFile);

        // File logging supported by LoggingDebugSession seems not to work.
        // Uncommenting these lines sends logging to the debug console.
        // logger.setup(Logger.LogLevel.Verbose, true);
        // logger.init(e => console.log(e.body.output), logFile, true);

        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
    }

    /**
     * Handle the "Initialze" request from the client.
     *
     * The request includes general configuration information from the client.
     * The response tells the client what services the debug adpater supports,
     * and tells the client to begin sending other configuration information
     * like preset breakpoints.
     */
    protected initializeRequest(
        response: DebugProtocol.InitializeResponse,
        args: DebugProtocol.InitializeRequestArguments): void {

        // save the configuration data sent by code to the adapter.  currently unused.
        this.initializeRequestArgs = args;

        // Send the response describing the services the debug adapter supports
        response.body = response.body || {};
        // the adapter implements the configurationDoneRequest
        response.body.supportsConfigurationDoneRequest = true;
        // the adapter supports reverse debugging
        response.body.supportsStepBack = true;
        // the adpater supports initialization of breakpoints during initialization
        response.body.supportsBreakpointLocationsRequest = true;
        this.sendResponse(response);

        // start the debugger managed by the debug adapter
        this.simulator = new Simulator(this.output);

        // tell code we are ready to receive the set of preexisting breakpoints
        this.sendEvent(new InitializedEvent());
    }

    /**
     * Handle the "ConfigurationDone" request from the client.
     *
     * The client has finished sending configuration information like preset
     * breakpoints and is ready to launch the debugging session.  This ends the
     * initialization phase in the debug adapter, so signal the launch phase in
     * the debug adapter that it may now begin.
     */
    protected configurationDoneRequest(
        response: DebugProtocol.ConfigurationDoneResponse,
        args: DebugProtocol.ConfigurationDoneArguments): void {
        super.configurationDoneRequest(response, args);

        // notify launch that configuration has finished
        this.configurationDone.notify();

        this.sendResponse(response);
    }

    /**
     * Handle the "Threads" request from the client.
     *
     * The client is asking for the list of active threads in the debugger. The
     * simulator is a single-threaded debugger, so the response is a list
     * containing a single thread with a hard-coded thread id.
     */
    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        // runtime supports no threads so just return a default thread.
        response.body = {
            threads: [
                new Thread(ProofDebuggerSession.threadID, 'thread 1')
            ]
        };
        this.sendResponse(response);
    }

    /**
     * Handle the "SetBreakPoints" request from the client.
     *
     * The client is giving a file and giving a list of all breakpoints that
     * should be currently set in the file.  We handle only simple line-oriented
     * breakpoints: no function breakpoints (we don't have access to a symbol
     * table), no data breakpoints (we don't have access to a good memory
     * model), no exception breakpoints (we are just replying an existing
     * failure trace).  Set the breakpoints in the simulator and respond that
     * the breakpoints have been set.
     */
    protected async setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): Promise<void> {
        let path: string = args.source.path ? args.source.path : '';
        let lines: number[] = args.breakpoints ? args.breakpoints.map(bp => bp.line) : [];
        let results: boolean[] = this.simulator.setBreakpoints(path, lines);
        response.body = {
            breakpoints: results.map(done => { return { verified: done }; })
        };
        this.sendResponse(response);
    }

    /**
     * Handle the "BreakpointLocations" request from the client.
     *
     * The client is specifying a file and starting and ending line numbers, and
     * is asking for all breakpoints currently set between those lines.  Ask the
     * simulator for breakpoints currently set and send the back to the client
     * in the response.
     */
    protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, request?: DebugProtocol.Request): void {
        let path: string = args.source.path ? args.source.path : '';
        let lineStart = args.line;
        let lineEnd = args.endLine ? args.endLine : lineStart;
        let lines = this.simulator.listBreakpoints(path, lineStart, lineEnd);
        response.body = {
            breakpoints: lines.map(line => { return { line: line }; })
        };
        this.sendResponse(response);
    }

    /**
     * Handle the "Launch" request that starts the debugger.
     */
    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: ProofDebuggerLaunchRequestArguments) {

        // Set the logging level to  requests and responses between the client
        // and the debug adapter to a file if tracing has been requested. We log
        // to the debug console because logging to a file doesn't appear to work
        // (see the constructor for more information).
        logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

        // wait until configuration has finished
        await this.configurationDone.wait(1000);

        try {
            let traceFolder = await vscode.commands.executeCommand<vscode.Uri | undefined>(getTraceFolderCommand);
            let traceName = await vscode.commands.executeCommand<string | undefined>(getTraceNameCommand);
            if (!traceFolder) { throw Error("Can't find a trace folder to open"); }
            if (!traceName) { throw Error("Can't find a trace name to open"); }
            await this.simulator.launch(traceFolder, traceName);
        } catch (e) {
            console.log((e as Error).message);
            vscode.window.showErrorMessage((e as Error).message);
            this.sendEvent(new TerminatedEvent());
            return;
        }
        this.sendResponse(response);
        // We always stop on entry.
        // We ignore the actual value of stopOnEntry received from the client.
        this.sendEvent(new StoppedEvent('entry', ProofDebuggerSession.threadID));
    }

    /**
     * Handle the "Next" request the client.
     *
     * Advance the simulator to the start of the next line of source code.
     */
    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
        let done = this.simulator.stepOver();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Handle the "StepIn" request from the client.
     *
     * If the simulator is stopped at a function call, advance the simulator to
     * the start of the function body.  Otherwise, advance to the start of the
     * next line of source code as with "Next".
     */
    protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void {
        let done = this.simulator.stepForward();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Hanlde the "StepOut" request from the client.
     *
     * If the simulator is stopped in the middle of a function call, advance the
     * simulator to the line of source code immediately after the function
     * return.  Otherwise, advance to the start of the next line of source code
     * as in "Next".
     *
     * Note: If the failure occurs before the end of the function, the stepping
     * out of the function will halt at the failure.  It can be confusing to
     * think you are stepping out of a function and stop at a failure. This is
     * particularly confusing if you are already confused and try to step out
     * of main.
     */
    protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void {
        let done = this.simulator.stepOut();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Handle the "Continue" request from the client.
     *
     * This runs the simulation from the current point forward until reaching
     * the end of the trace, a breakpoint, or a failure.
     */
    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        let done = this.simulator.continueForward();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Handle the "StepBack" request from the client.
     *
     * This moves backwards in the trace to the start of the previous line of
     * source code.  The "Next" and "StepBack" requests are inverses of each
     * other.
     *
     * Note: It would be nice if "StepOver" and "StepBackOver" were inverses of
     * each other, but the debug adapter protocol does not include a
     * "StepBackOver" request. This can be confusing, because "StepBack" just
     * after a function call steps back into the function itself and doesn't
     * step back over the function call.
     */
    protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
        let done = this.simulator.stepBackward();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Handle the "ReverseContinue" request from the client.
     *
     * This runs the simulation from the current point backwards until reaching
     * the start of the trace, a breakpoint, or a failure.
     */
    protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse, args: DebugProtocol.ReverseContinueArguments): void {
        let done = this.simulator.continueBackward();
        this.sendResponse(response);
        this.sendStoppedEvent(done);
    }

    /**
     * Handle the "StackTrace" request the client.
     *
     * The client is asking for the list of stack frames with the top of the
     * stack at the start of the list.  The client displays in the editor the
     * current location as specified by the file and line number in the top
     * stack frame.  Ask the simulator for the list of stack frames.  Each stack
     * frame includes a memory with a memory id that describes the local
     * variables for the stack frame.  Cache the memory and the memory id. Send
     * the list of stack frames to the client, using the memory id for the stack
     * frame id.  This way, future requests for stack frame variables can be
     * serviced easily from the cache by looking up the stack frame's memory id.
     */
    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
        let stack: StackFrame[] = [];

        let openFolders = vscode.workspace.workspaceFolders;
        if (!openFolders) { throw Error("Can't find the root of the current workspace."); }
        let rootFolder = openFolders[0].uri;

        for (let frame of this.simulator.stackFrames()) {
            let mem = frame.memory;
            let memId = mem.id;
            this.simulator.setCache(memId, mem);
            stack.push(
                new StackFrame(
                    memId,    // frame id (must be unique: used to ask about frame variables)
                    frame.function,  // frame name
                    new Source(frame.file, vscode.Uri.joinPath(rootFolder, frame.file).toString()),
                    this.convertDebuggerLineToClient(frame.line)
                )
            );
        }
        response.body = {
            stackFrames: stack
        };
        this.sendResponse(response);
    }

    /**
     * Handle the "Scopes" request from the client.
     *
     * The client is asking for the list of variable scopes appearing in a stack
     * frame.  In some debuggers this might include scopes like "locals" and
     * "registers" and "configuration", but we model only "locals".  Respond
     * with the "locals" scope and the variable reference set to the memory id
     * (serving as the frame id) for the memory in the cache containing the
     * local variables for the stack frame.
     */
    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        response.body = {
            scopes: [
                new Scope(localScopeName, args.frameId, false)
            ]
        };
        this.sendResponse(response);
    }

    /**
     * Handle the "Variables" request from the client.
     *
     * The client is asking for the value of the variable given by a variable
     * reference. The variable reference is a memory id for a memory in the
     * cache.  Respond with the list of variables, values, and references for
     * the variables in the memory.  The reference for a variable will be 0 when
     * the value is a scalar, and will the a memory id for a memory giving the
     * value components if the value is a structured value like a struct or
     * array.  The client may use these references in future requests to get the
     * component values.
     */
    protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, request?: DebugProtocol.Request) {
        let variables: DebugProtocol.Variable[] = [];
        let id: number = args.variablesReference;
        let locals: state.Variable[] = this.simulator.getVariables(id);
        for (let local of locals) {
            variables.push({
                name: local.name,
                value: local.value,
                variablesReference: local.ref

            });
        }

        response.body = {
            variables: variables
        };
        this.sendResponse(response);
    }

    /**
     * Send a Stopped event to the client.
     *
     * Requests like "Next" and "Continue" run the simulator to the next
     * stopping point, at which point the debug adapter must send a Stopped
     * event to the client that includes a reason for stopping.  The debug
     * adapter runs the simulator and waits for the simulator to return a
     * status. We use that status here to determine the stopping reason to send
     * to the client.
     */
    protected sendStoppedEvent(state: Status) {
        switch (state) {
            case Status.step: {
                this.sendEvent(new StoppedEvent('step', ProofDebuggerSession.threadID));
                break;
            }
            case Status.breakpoint: {
                this.sendEvent(new StoppedEvent('breakpoint', ProofDebuggerSession.threadID));
                break;
            }
            case Status.entry: {
                // 'entry' seems like the right thing to send here, but it
                // appears to restart the debugger.
                this.sendEvent(new StoppedEvent('step', ProofDebuggerSession.threadID));
                break;
            }
            case Status.failure: {
                this.sendEvent(new StoppedEvent('step', ProofDebuggerSession.threadID));
                break;
            }
            case Status.terminated: {
                vscode.window.showInformationMessage('Terminated: restarting...');
                this.sendEvent(new TerminatedEvent(ProofDebuggerSession.threadID));
                break;
            }
            default: {
                let message = 'Proof debugger should never stop in this state!';
                vscode.window.showErrorMessage(message);
                throw Error(message);
            }
        }
    }
}

/**
 * Arguments received by the debug adapter in the "Launch" request from the client.
 *
 * These arguments are in addition to the arguments defined by the Debug Adapter
 * Protocol. A schema from these arguments is given in package.json, and this
 * interface must match that schema.
 */
interface ProofDebuggerLaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    /** Stop the debugger immediately upon launching the debugger. */
    stopOnEntry?: boolean;
    /** Log requests and responses in the Debug Adapter Protocol to the debug console. */
    trace?: boolean;
}