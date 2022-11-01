/** This is a parser for variable expressions that appear in a trace. */

import * as lexer from './variableLexer';
import { Token, isRsquare, isLsquare, isDot, isId, isNumber } from './variableLexer';
import { Path, Element, Index, Member } from './variable';

type Tokens = Token[];

export class PathParser {
    constructor() { }

    static parse(buffer: string): Path | undefined {
        let tokens = lexer.tokenize(buffer);
        if (tokens === undefined) { return undefined; }
        let path = PathParser.parser(tokens);
        return path ? path[0] : undefined;
    }

    static parser(tokens: Tokens): [Path, Tokens] | undefined {
        let elems: Element[] = [];
        while (tokens.length > 0) {
            let elem = ElementParser.parser(tokens);
            if (elem === undefined) { return undefined; }
            elems.push(elem[0]);
            tokens = elem[1];
        }
        return [elems, tokens];
    }
}

class ElementParser {
    constructor() { }

    static parser(tokens: Tokens): [Element, Tokens] | undefined {
        if (IndexParser.isPrefix(tokens)) {
            return IndexParser.parser(tokens);
        }
        if (MemberParser.isPrefix(tokens)) {
            return MemberParser.parser(tokens);
        }
        return undefined;
    }
}

class IndexParser extends ElementParser {
    constructor() { super(); }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 2 && isLsquare(tokens[0]) && isNumber(tokens[1]) && isRsquare(tokens[2]);
    }

    static parser(tokens: Tokens): [Index, Tokens] | undefined {
        if (IndexParser.isPrefix(tokens)) {
            return [new Index(parseInt(tokens[1].value)), tokens.slice(3)];
        }
        return undefined;
    }
}

class MemberParser extends ElementParser {
    constructor() { super(); }

    static isPrefix(tokens: Tokens): boolean {
        return tokens.length > 1 && isDot(tokens[0]) && isId(tokens[1]);
    }

    static parser(tokens: Tokens): [Member, Tokens] | undefined {
        if (MemberParser.isPrefix(tokens)) {
            return [new Member(tokens[1].value), tokens.slice(2)];
        }
        return undefined;
    }

}
