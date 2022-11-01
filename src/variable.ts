import * as parser from './variableParser';

/** 
 * This is a model of variable expressions that appear in a trace.
 *
 * A variable is a string like 'foo.bar[0]` consisting of a base name 'foo'
 * followed by a list of selectors like field member selection '.bar' or array
 * indexing '[0]'.  We consider memory to be a single variable MEMORY with a
 * field 'foo', so 'foo.bar[0]' is modeled as 'MEMORY.foo.bar[0]' or
 * equivalently as path ['.foo', '.bar', '[0]'] of selectors indexing into
 * MEMORY.  
 *
 * A variable path element is either a field member like '.foo' or an array
 * index like '[0]'.
 */
export type Path = Element[];

/** 
 * Parse a variable into a list of variable path elements. 
 *
 * Parse a variable 'foo.bar[0]' into a list ['.foo', '.bar', '[0]'] of variable
 * path elements that index into memory via field member selection and array
 * indexing.
 */
export function parse(variable: string): Path | undefined {
    return parser.PathParser.parse(`.${variable}`);
}

/** A variable path element.
 *
 * A variable path element is either an index into an array variable or a member
 * field selction from a struct variable. 
 */
export class Element {
    constructor() { }

    toString(): string {
        if (this instanceof Index) {
            return (this as Index).toString();
        }
        if (this instanceof Member) {
            return (this as Member).toString();
        }
        throw Error('Unreachable code: Element is not an Index or a Member.');
    }
}

/** Index an array variable. */
export class Index extends Element {
    index: number;

    constructor(index: number) { super(); this.index = index; }

    toString(): string {
        return `[${this.index}]`;
    }
}

/** Select a member of a strut variable. */
export class Member extends Element {
    field: string;

    constructor(field: string) { super(); this.field = field; }

    toString(): string {
        return `.${this.field}`;
    }
}
