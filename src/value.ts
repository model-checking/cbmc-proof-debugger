/**
 * This is a model of values that appear in a trace and can be stored as values
 * of variable in a stack frame.
 */

import * as parser from './valueParser';
import { Path, Index, Member, Element } from './variable';
import { shallowLength } from './constants';

export function parse(buffer: string): Value | undefined {
    return parser.ValueParser.parse(buffer);
}

export class Value {
    static counter: number = 0;
    id: number;

    constructor(id?: number) {
        if (id === undefined) {
            Value.counter = Value.counter + 1;
            this.id = Value.counter;
        } else {
            this.id = id;
        }
    }

    // Every Value object is a derived object and method calls should be made on the derived object
    clone(): Value {
        throw Error('ERROR: clone failed on Value object');
    }
    set(path: Path, value: Value): Value {
        throw Error('ERROR: set failed on Value object');
    }
    get(path: Path): Value | undefined {
        throw Error('ERROR: get failed on Value object');
    }
    toString(): string {
        throw Error('ERROR: toString failed on Value object');
    }
    toSummary(shorten: boolean = true): string {
        throw Error('ERROR: shallowString failed on Value object');
    }
    hasElements(): boolean {
        throw Error('ERROR: hasElements failed on Value object');
    }
    listElements(): MemoryDescription[] {
        throw Error('ERROR: listElements failed on Value object');
    }

    static fromPathAndValue(path: Path, value: Value): Value {
        if (path.length === 0) {
            return value;
        }

        let elem = path.shift();
        if (elem === undefined) { throw Error('Unreachable code: convince eslint elem is nonnull.'); }

        let val = Value.fromPathAndValue(path, value);
        if (elem instanceof Member) {
            let mem = new StructValue([]);
            mem.fields[elem.field] = val;
            return mem;
        }
        if (elem instanceof Index) {
            let mem = new ArrayValue([]);
            mem.values[elem.index] = val;
            return mem;
        }
        throw Error('Error: This should never happen:  The list of variable projections is exhaustive.');
    }
}

export class StringValue extends Value {
    value: string;

    constructor(str: string, id?: number) {
        super(id);
        this.value = str;
    }

    toString(): string {
        return this.value;
    }

    toSummary(shorten: boolean = true): string {
        return this.toString();
    }

    clone(): StringValue {
        return new StringValue(this.value.toString(), this.id);
    }

    set(path: Path, value: Value): StringValue {
        if (path.length !== 0) {
            console.error(`ERROR: Tried to set string value ${this} with nonempty path ${path.map(elem => elem.toString()).join('')}`);
            return this;
        }

        if (!(value instanceof StringValue)) {
            console.error(`ERROR: Tried to set string value ${this} to nonstring value ${value.toString()})}`);
            return this;
        }

        this.value = value.value;
        return this;
    }

    get(path: Path): Value | undefined {
        if (path.length !== 0) {
            console.error(`ERROR: Tried to get string value ${this} with nonempty path ${path.map(elem => elem.toString()).join('')}`);
        }
        return this;
    }

    hasElements(): boolean {
        return false;
    }

    listElements(): MemoryDescription[] {
        return [];
    }
}

export class NumberValue extends Value {
    value: number;

    constructor(num: number, id?: number) {
        super(id);
        this.value = num;
    }

    toString(): string {
        return this.value.toString();
    }

    toSummary(shorten: boolean = true): string {
        return this.toString();
    }

    clone(): NumberValue {
        return new NumberValue(this.value, this.id);
    }

    set(path: Path, value: Value): NumberValue {
        if (path.length !== 0) {
            console.error(`ERROR: Tried to set number value ${this} with nonempty path ${path.map(elem => elem.toString()).join('')}`);
            return this;
        }

        if (!(value instanceof NumberValue)) {
            console.error(`ERROR: Tried to set number value ${this} to nonnumber value ${value.toString()})}`);
            return this;
        }

        this.value = value.value;
        return this;
    }

    get(path: Path): Value | undefined {
        if (path.length !== 0) {
            console.error(`ERROR: Tried to get string value ${this} with nonempty path ${path.map(elem => elem.toString()).join('')}`);
        }
        return this;
    }

    hasElements(): boolean {
        return false;
    }

    listElements(): MemoryDescription[] {
        return [];
    }

}

interface NameValue {
    name: string,
    value: Value
}

interface Fields {
    [field: string]: Value
}

export class StructValue extends Value {
    fields: Fields = {};

    constructor(fields: [string, Value][], id?: number) {
        super(id);
        for (let field of fields) {
            this.fields[field[0]] = field[1];
        }
    }

    toList(): NameValue[] {
        let list: NameValue[] = [];
        for (let name in this.fields) {
            list.push({ name: name, value: this.fields[name] });
        }
        return list;
    }

    toString(): string {
        return `{${this.toList().map(field => `${field.name}: ${field.value}`).join(', ')}`;
    }

    toSummary(shorten: boolean = true): string {
        let body = this.toList()
            .map(field => `${field.name}: ${field.value.toSummary(shorten)}`)
            .join(', ');
        if (shorten && body.length > shallowLength) {
            body = '..';
        }
        return `{${body}}`;
    }

    clone(): StructValue {
        let fields: [string, Value][] = this.toList().map(field => [field.name, field.value.clone()]);
        return new StructValue(fields, this.id);
    }

    set(path: Path, value: Value): StructValue {
        let elem = path.shift();
        if (elem === undefined) {
            console.error(`ERROR: Tried to set struct value ${this} without a member`);
            return this;
        }
        if (!(elem instanceof Member)) {
            console.error(`ERROR: Tried to set struct value ${this} with an index ${elem.toString()} and not a member`);
            return this;
        }

        let val = this.fields[elem.field];
        if (val === undefined) {
            this.fields[elem.field] = Value.fromPathAndValue(path, value);
        } else {
            let newVal: Value;
            if (path.length > 0 && canIndex(path[0], val)) {
                newVal = val.set(path, value);
            } else {
                newVal = Value.fromPathAndValue(path, value);
            }
            this.fields[elem.field] = newVal;
        }
        return this;
    }

    get(path: Path): Value | undefined {
        let elem = path.shift();
        if (elem === undefined) { return this; }
        if (!(elem instanceof Member)) {
            console.warn(`Indexing struct Value with ${elem} which is not a member`);
            return undefined;
        }
        let mem = this.fields[elem.field];
        if (mem === undefined) {
            console.warn(`Warning: Indexing struct value with index ${elem} which is not present`);
            return undefined;
        };
        return mem.get(path);
    }

    hasElements(): boolean {
        return Object.keys(this.fields).length !== 0;
    }

    listElements(): MemoryDescription[] {
        return this.toList().map(field => {
            return {
                name: field.name,
                value: field.value,
                id: field.value.id,
                hasElements: field.value.hasElements()
            };
        });
    }

}

interface IndexValue {
    index: number,
    value: Value
}

export class ArrayValue extends Value {
    values: Value[];

    constructor(values: Value[], id?: number) {
        super(id);
        this.values = values;
    }

    toList(): IndexValue[] {
        let list: IndexValue[] = [];
        for (let idx in this.values) {
            list.push({ index: parseInt(idx), value: this.values[parseInt(idx)] });
        }
        return list;
    }

    toString(): string {
        return `[${this.values.map(val => val.toString()).join(', ')}]`;
    }

    toSummary(shorten: boolean = true): string {

        // special case a char array
        function isZero(mem: Value): boolean {
            let val = (mem instanceof NumberValue) && ((mem as NumberValue).value === 0);
            return val;
        }
        function isChar(mem: Value): boolean {
            let val = (mem instanceof StringValue) && ((mem as StringValue).value.length === 1);
            return val;
        }
        function isString(mem: ArrayValue): boolean {
            if (mem.values.length === 0) { return false; }
            return mem.values.slice(0, -1).reduce(
                (cur, val) => cur && isChar(val),
                isZero(mem.values[mem.values.length - 1])
            );
        }
        if (isString(this)) {
            let body = this.values.slice(0, -1).map(val => val.toString()).join('');
            if (shorten && body.length > shallowLength - 2) {
                if (shallowLength > 2) {
                    body = body.slice(0, shallowLength - 4) + '..';
                } else {
                    body = '..';
                }
            }
            return `"${body}"`;
        }

        let body = this.values.map(mem => mem.toSummary(shorten)).join(', ');
        if (shorten && body.length > shallowLength) {
            body = '..';
        }
        return `[${body}]`;
    }

    clone(): ArrayValue {
        return new ArrayValue(this.values.map(val => val.clone()), this.id);
    }

    set(path: Path, value: Value): ArrayValue {
        let elem = path.shift();
        if (elem === undefined) {
            console.error(`ERROR: Tried to set array value ${this} without an index`);
            return this;
        }
        if (!(elem instanceof Index)) {
            console.error(`ERROR: Tried to set array value ${this} with a member ${elem.toString()} and not an index`);
            return this;
        }

        let val = this.values[elem.index];
        if (val === undefined) {
            this.values[elem.index] = Value.fromPathAndValue(path, value);
        } else {
            let newVal: Value;
            if (path.length > 0 && canIndex(path[0], val)) {
                newVal = val.set(path, value);
            } else {
                newVal = Value.fromPathAndValue(path, value);
            }
            this.values[elem.index] = newVal;
        }
        return this;
    }

    get(path: Path): Value | undefined {
        let elem = path.shift();
        if (elem === undefined) { return this; }
        if (!(elem instanceof Index)) {
            console.warn(`Warning: Indexing array value with ${elem} which is not an index`);
            return undefined;
        }

        let val = this.values[elem.index];
        if (val === undefined) {
            console.warn(`Warning: Indexing array value with index ${elem} which is not present`);
            return undefined;
        }
        return val.get(path);
    }

    hasElements(): boolean {
        return this.values.length > 0;
    }

    listElements(): MemoryDescription[] {
        return this.toList().map(item => {
            return {
                name: item.index.toString(),
                value: item.value,
                id: item.value.id,
                hasElements: item.value.hasElements()

            };
        });
    }

}

interface MemoryDescription {
    name: string,
    value: Value,
    id: number,
    hasElements: boolean
}

function canIndex(elem: Element, value: Value) {
    return (
        (elem instanceof Index && value instanceof ArrayValue) ||
        (elem instanceof Member && value instanceof StructValue)
    );

}
