/**
 * This is a state appearing in a simulator trace produced by the simulator.
 */

import { assert } from 'console';

import {
    fileMissing, functionMissing, staticFrameName, heapFrameName, heapVariablePrefix,
    fileBuiltInPrefix1, fileBuiltInPrefix2, moduleSeparator
} from './constants';
import * as variable from './variable';
import * as value from './value';
import { Value, StructValue } from './value';

/** A source location for a step in a trace produced by viewer. */
export interface Location {
    file: string,
    line: number,
    function: string,
}

/** A step in a trace produced by viewer. */
export interface Step {
    detail: any,
    hidden: boolean,
    kind: string,
    location: Location
}

/** A description of a variable giving the name and value as strings and the variable id. */
export interface Variable {
    name: string,
    value: string,
    ref: number
}

/**
 * A stack frame of a stack in a simulation trace.
 */
export class Frame {
    /** A counter used to produce a unique id for each frame. */
    static nextId: number = 0;
    /** A unique id for this stack frame. */
    id: number;
    /** The name of the function for which this stack frame is allocated. */
    function: string;
    /** The file containing the definition of the function for which this stack frame is allocated. */
    file: string;
    /** The current line number within the function for which this stack frame is allocated. */
    line: number;
    /** The local variables in this stack frame (modeled as a single struct value). */
    memory: StructValue;

    /** Construct a stack frame. */
    constructor(func: string, file: string, line: number, bumpId: boolean = true) {
        if (bumpId) { Frame.nextId = Frame.nextId + 1; }
        this.id = Frame.nextId;
        this.function = func;
        this.file = file;
        this.line = line;
        this.memory = new StructValue([]);
    }

    /** Clone this stack frame. */
    clone(): Frame {
        let copy: Frame = new Frame('', '', 0, false);
        copy.id = this.id;
        copy.function = this.function;
        copy.file = this.file;
        copy.line = this.line;
        copy.memory = this.memory.clone();
        return copy;
    }

    /** Add an assignment to a local variable in this stack frame. */
    addAssignment(lhs: string, rhs: any) {
        let varName = variable.parse(lhs);
        let varValue = value.parse(rhs);
        if (varName === undefined) {
            console.error(`ERROR: found variable name missing in assignment ${lhs}=${rhs}`);
            return;
        }
        if (varValue === undefined) {
            console.error(`ERROR: found found value expression missing in assignment ${lhs}=${rhs}`);
            return;
        }
        this.memory.set(varName, varValue);
    }

    /** Get the list of local variable in this stack frame. */
    getVariables(): Variable[] {
        return this.memory.toList().map(field => {
            return {
                name: field.name,
                value: field.value.toString(),
                ref: 0
            };
        });
    }
}

/**
 * A stack in a simulation trace.
 */
export class Stack {
    /** The stack frames listed from the top down (so the head of the list is the current frame). */
    frames: Frame[] = [];

    /** Construct a stack */
    constructor() { }

    /** Push a frame onto the stack. */
    push(frame: Frame) {
        this.frames.unshift(frame);
    }

    /** Pop a frame off of the stack. */
    pop(): Frame | undefined {
        return this.frames.shift();
    }

    /** Clone the stack. */
    clone(): Stack {
        let copy = new Stack();
        copy.frames = this.frames.map(frame => frame.clone());
        return copy;
    }

    /** Set the current location in the current frame from a source location. */
    setLocation(loc: Location) {
        if (!loc.file || loc.file === fileMissing || !loc.function || loc.function === functionMissing) { return; }
        let frame = this.pop();
        if (frame) {
            frame.file = loc.file;
            frame.function = loc.function;
            frame.line = loc.line;
            this.push(frame);
        }
    }

    /** The number of frames in the stack. */
    depth(): number {
        return this.frames.length;
    }

    /** 
     * Add an assignment to a local variable in the variable's stack frame. 
     *
     * The fully-scoped variable name begins with the name of the function in
     * which the variable is declared.  The assignment is added to the stack
     * frame for that function.
     */
    addAssignment(scope: string, lhs: string, rhs: any) {
        function parseFuncVar(scope: string): [string, string] {
            let components = scope.split(moduleSeparator);
            if (components.length === 1) {
                return [staticFrameName, components[0]];
            } else {
                let module = components[0];
                let variable = components[components.length - 1];
                module = module === heapVariablePrefix ? heapFrameName : module;
                return [module, variable];
            }
        }
        function frameIndex(func: string, frames: Frame[]): number | undefined {
            for (let idx in frames) {
                if (frames[parseInt(idx)].function === func) { return parseInt(idx); }
            }
            return undefined;
        }

        let funcvar = parseFuncVar(scope);
        let funcName = funcvar[0];
        let varName = funcvar[1];
        assert(lhs.startsWith(varName));
        let idx = frameIndex(funcName, this.frames);
        if (idx === undefined) {
            console.error(`Error: Can't find stack frame for symbol ${scope}`);
        } else {
            this.frames[idx].addAssignment(lhs, rhs);
        }
    }

    /** Get the stack frame with the given frame id. */
    getFrameById(id: number): Frame | undefined {
        let frames = this.frames.filter(frame => frame.id === id);
        switch (frames.length) {
            case 0: return undefined;
            case 1: return frames[0];
            default: {
                console.error(`Error: Failed to find stack frame with id ${id}`);
                return undefined;
            }
        }
    }

    /** Get the local variables in the stack frame with the given frame id. */
    getVariablesInFrame(id: number): Variable[] {
        let frame = this.getFrameById(id);
        if (frame === undefined) {
            return [];
        }
        return frame.getVariables();
    }
}

/**
 * A state of the simulator.
 */
export class SimulatorState {
    /** The step about to be executed in this state. */
    step: Step;
    /** The source location for the step about to be executed in this state. */
    location: Location;
    /** The stack just before the step about to be executed in this state. */
    stack: Stack = new Stack();
    /** 
     * A cache of values in the stack.
     *
     * A value may be any value in the stack or any subterm of any value in the
     * stack.  The cache maps a value's id to the value itself.  The cache is
     * used to service requests from the client to the debug adapter asking for
     * the named or indexed subterms of values previously reported to the
     * client.
     */
    cache: Value[] = [];
    /** The step about to be executed is hidden. */
    isHidden: boolean = false;
    /** The trace is considered terminated before the step about to be executed. */
    hasTerminated: boolean = false;
    /** The step about to be executed is a failure step. */
    hasFailed: boolean = false;
    /** The output displayed to the user after the step is executed. */
    output: string = '';

    /** Construct a state of the simulator. */
    constructor(step: Step) {
        this.step = step;
        this.location = step.location;

        let file: string = step.location.file;
        this.isHidden = !file || file === fileMissing || file.startsWith(fileBuiltInPrefix1) || file.startsWith(fileBuiltInPrefix2);
    }

    /** Insert a value tagged with a value id into the value cache. */
    setCache(id: number, val: Value) {
        this.cache[id] = val;
    }
    /** Get a value tagged with a value id from the value cache. */
    getCache(id: number): Value | undefined {
        return this.cache[id];
    }

    /** Get the named or indexed subvalues of a value with a given id in the value cache. */
    getVariables(id: number): Variable[] {
        let val = this.getCache(id);
        if (val === undefined) { return []; }
        let vars: Variable[] = [];
        for (let element of val.listElements()) {
            this.setCache(element.id, element.value);
            vars.push({
                name: element.name,
                value: element.value.toSummary(),
                ref: element.hasElements ? element.id : 0
            });
        }
        return vars;
    }
}
