/** This is a parser for values that appear in a trace. */

import * as lexer from './valueLexer';
import { Token, isRbrace, isLbrace, isColon, isComma, isDot, isEqual, isNumber, isString } from './valueLexer';
import { Value, StringValue, NumberValue, ArrayValue, StructValue } from './value';

type Tokens = Token[];

export class ValueParser {
    constructor() { }

    static parse(buffer: string): Value | undefined {
        let tokens = lexer.tokenize(buffer);
        if (tokens === undefined) { return undefined; }
        let value = ValueParser.parser(tokens);
        return value ? value[0] : undefined;
    }

    static parser(tokens: Tokens): [Value, Tokens] | undefined {
        if (StructParser.isPrefix(tokens)) {
            return StructParser.parser(tokens);
        }
        if (ArrayParser.isPrefix(tokens)) {
            return ArrayParser.parser(tokens);
        }
        if (StringParser.isPrefix(tokens)) {
            return StringParser.parser(tokens);
        }
        if (NumberParser.isPrefix(tokens)) {
            return NumberParser.parser(tokens);
        }
        console.error(`ERROR: value parser failed at token '${tokens[0].value}'`);
        console.error(tokens);
        return undefined;
    }
}

export class StringParser {
    constructor() { }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 0 && isString(tokens[0]);
    }

    static parser(tokens: Tokens): [StringValue, Tokens] | undefined {
        if (!StringParser.isPrefix(tokens)) { return undefined; }
        let tkn = tokens[0];
        let val = tkn.value;
        if (tkn.kind === lexer.TknKind.sstring || tkn.kind === lexer.TknKind.dstring) {
            val = val.slice(1, -1);
        }
        return [new StringValue(val), tokens.slice(1)];
    }
}

export class NumberParser {
    constructor() { }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 0 && isNumber(tokens[0]);
    }

    static parser(tokens: Tokens): [NumberValue, Tokens] | undefined {
        if (!NumberParser.isPrefix(tokens)) { return undefined; }
        return [new NumberValue(parseInt(tokens[0].value)), tokens.slice(1)];
    }
}

export class ComponentParser {
    constructor() { }

    static isPrefix(tokens: Tokens): boolean {
        return ComponentParser.isPrefix1(tokens) || ComponentParser.isPrefix2(tokens);
    }

    static isPrefix1(tokens: Tokens): boolean {
        return tokens.length > 1 && isString(tokens[0]) && isColon(tokens[1]);
    }

    static isPrefix2(tokens: Tokens): boolean {
        return tokens.length > 2 && isDot(tokens[0]) && isString(tokens[1]) && isEqual(tokens[2]);
    }

    static parser(tokens: Tokens): [[string, Value], Tokens] | undefined {

        if (ComponentParser.isPrefix1(tokens)) {
            return ComponentParser.parser1(tokens);
        }

        if (ComponentParser.isPrefix2(tokens)) {
            return ComponentParser.parser2(tokens);
        }

        return undefined;
    }

    static parser1(tokens: Tokens): [[string, Value], Tokens] | undefined {
        if (!ComponentParser.isPrefix1(tokens)) { return undefined; }

        let nameResult = StringParser.parser(tokens);
        if (nameResult === undefined) { return undefined; }
        let name = nameResult[0].value;
        tokens = nameResult[1];

        if (tokens.length > 0 && isColon(tokens[0])) {
            tokens = tokens.slice(1);
        } else {
            return undefined;
        }

        let valueResult = ValueParser.parser(tokens);
        if (valueResult === undefined) { return undefined; }
        let val = valueResult[0];
        tokens = valueResult[1];

        return [[name, val], tokens];
    }

    static parser2(tokens: Tokens): [[string, Value], Tokens] | undefined {
        if (!ComponentParser.isPrefix2(tokens)) { return undefined; }

        if (tokens.length > 0 && isDot(tokens[0])) {
            tokens = tokens.slice(1);
        } else {
            return undefined;
        }

        let nameResult = StringParser.parser(tokens);
        if (nameResult === undefined) { return undefined; }
        let name = nameResult[0].value;
        tokens = nameResult[1];

        if (tokens.length > 0 && isEqual(tokens[0])) {
            tokens = tokens.slice(1);
        } else {
            return undefined;
        }

        let valueResult = ValueParser.parser(tokens);
        if (valueResult === undefined) { return undefined; }
        let val = valueResult[0];
        tokens = valueResult[1];

        return [[name, val], tokens];
    }
}

export class StructParser {
    constructor() { }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 1 && isLbrace(tokens[0]) && ComponentParser.isPrefix(tokens.slice(1));
    }

    static parser(tokens: Tokens): [StructValue, Tokens] | undefined {
        if (!StructParser.isPrefix(tokens)) { return undefined; }
        let components: [string, Value][] = [];

        if (tokens.length > 0 && isLbrace(tokens[0])) {
            tokens = tokens.slice(1);
        } else {
            return undefined;
        }

        while (tokens.length > 0 && !isRbrace(tokens[0])) {
            if (isComma(tokens[0])) {
                tokens = tokens.slice(1);
                continue;
            }

            let componentResult = ComponentParser.parser(tokens);
            if (componentResult === undefined) { return undefined; }
            components.push(componentResult[0]);
            tokens = componentResult[1];
        }

        if (tokens.length > 0 && isRbrace(tokens[0])) {
            return [new StructValue(components), tokens.slice(1)];
        }

        return undefined;
    }
}

export class ArrayParser {
    constructor() { }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 0 && isLbrace(tokens[0]);
    }

    static parser(tokens: Tokens): [ArrayValue, Tokens] | undefined {
        if (!ArrayParser.isPrefix(tokens)) { return undefined; }
        let values: Value[] = [];

        if (tokens.length > 0 && isLbrace(tokens[0])) {
            tokens = tokens.slice(1);
        } else {
            return undefined;
        }

        while (tokens.length > 0 && !isRbrace(tokens[0])) {
            if (isComma(tokens[0])) {
                tokens = tokens.slice(1);
                continue;
            }

            let valueResult = ValueParser.parser(tokens);
            if (valueResult === undefined) { return undefined; }
            values.push(valueResult[0]);
            tokens = valueResult[1];
        }

        if (tokens.length > 0 && isRbrace(tokens[0])) {
            return [new ArrayValue(values), tokens.slice(1)];
        }

        return undefined;
    }
}
