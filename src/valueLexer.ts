/** This is a lexer for values that appear in a trace. */

export enum TknKind {
    space,
    lbrace,
    rbrace,
    comma,
    period,
    colon,
    equal,
    sstring,
    dstring,
    number,
    symbol,
    string,
}

export interface Token {
    kind: TknKind,
    value: string
}

export const tknDfn = [ // first matching pattern determines token kind
    [TknKind.space, '\\s+'],
    [TknKind.lbrace, '{'],
    [TknKind.rbrace, '}'],
    [TknKind.comma, ','],
    [TknKind.colon, ':'],
    [TknKind.equal, '='],
    [TknKind.period, '\\.'],
    [TknKind.number, '\\+\\d+'],
    [TknKind.number, '-\\d+'],
    [TknKind.number, '\\d+'],
    [TknKind.dstring, '"[^"]*"'],
    [TknKind.sstring, "'[^']*'"],
    [TknKind.string, '[^=},:]+'], // terminators = and } and , delimit struct components
    [TknKind.symbol, '\\w+'],
];
const tknKinds = tknDfn.map(pair => (pair[0] as TknKind));
const tknPatterns = tknDfn.map(pair => (pair[1] as string));
const tknRegExp = RegExp('^(' + tknPatterns.map(ptn => `(${ptn})`).join('|') + ')');

function nextToken(buffer: string): Token | undefined {
    let result = tknRegExp.exec(buffer);
    if (!result) {
        console.error(`ERROR: value lexer failed at ${buffer.slice(0, 10)}...`);
        return undefined;
    }
    let matches = result.slice(2, tknKinds.length + 2);
    for (let i = 0; i < tknKinds.length; i = i + 1) {
        if (matches[i] === undefined) { continue; }
        return { kind: tknKinds[i], value: matches[i] };
    }
    console.error(`ERROR: value lexer failed at ${buffer.slice(0, 10)}...`);
    return undefined;
}

export function tokenize(buffer: string): Token[] {
    let tokens = [];
    while (buffer.length > 0) {
        let token = nextToken(buffer);
        if (token === undefined) { return []; }
        tokens.push(token);
        buffer = buffer.slice(token.value.length);
    }
    return tokens.filter(tkn => tkn.kind !== TknKind.space);
}

export function isRbrace(token: Token): boolean {
    return token.kind === TknKind.rbrace;
}

export function isLbrace(token: Token): boolean {
    return token.kind === TknKind.lbrace;
}

export function isColon(token: Token): boolean {
    return token.kind === TknKind.colon;
}

export function isComma(token: Token): boolean {
    return token.kind === TknKind.comma;
}

export function isDot(token: Token): boolean {
    return token.kind === TknKind.period;
}

export function isEqual(token: Token): boolean {
    return token.kind === TknKind.equal;
}

export function isName(token: Token): boolean {
    return (
        token.kind === TknKind.symbol ||
        token.kind === TknKind.sstring ||
        token.kind === TknKind.dstring
    );
}

export function isNumber(token: Token): boolean {
    return token.kind === TknKind.number;
}

export function isString(token: Token): boolean {
    return (
        token.kind === TknKind.string ||
        token.kind === TknKind.sstring ||
        token.kind === TknKind.dstring ||
        token.kind === TknKind.symbol
    );
}

export function isValue(token: Token): boolean {
    return (
        isName(token) || isNumber(token) || isString(token)
    );
}