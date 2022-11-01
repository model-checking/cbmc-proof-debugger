/** This is a lexer for variable expressions that appear in a trace. */

export enum TknKind {
    space,
    lbrace,
    rbrace,
    lsquare,
    rsquare,
    period,
    equal,
    number,
    identifier
}

export interface Token {
    kind: TknKind,
    value: string
}

const tknDfn = [ // first matching pattern determines token kind
    [TknKind.space, '\\s+'],
    [TknKind.lbrace, '{'],
    [TknKind.rbrace, '}'],
    [TknKind.lsquare, '\\['],
    [TknKind.rsquare, '\\]'],
    [TknKind.equal, '='],
    [TknKind.period, '\\.'],
    [TknKind.number, '\\+\\d+[a-z]?'],
    [TknKind.number, '-\\d+[a-z]?'],
    [TknKind.number, '\\d+[a-z]?'],
    [TknKind.identifier, '\\w[\\w$]*'],
];
const tknKinds = tknDfn.map(pair => (pair[0] as TknKind));
const tknPatterns = tknDfn.map(pair => (pair[1] as string));
const tknRegExp = RegExp('^(' + tknPatterns.map(ptn => `(${ptn})`).join('|') + ')');

function nextToken(buffer: string): Token | undefined {
    let result = tknRegExp.exec(buffer);
    if (!result) {
        console.error(`ERROR: variable lexer failed at ${buffer.slice(0, 10)}...`);
        return undefined;
    }
    let matches = result.slice(2, tknKinds.length + 2);
    for (let i = 0; i < tknKinds.length; i = i + 1) {
        if (matches[i] === undefined) { continue; }
        return { kind: tknKinds[i], value: matches[i] };
    }
    console.error(`ERROR: variable lexer failed at ${buffer.slice(0, 10)}...`);
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

export function isRsquare(token: Token): boolean {
    return token.kind === TknKind.rsquare;
}

export function isLsquare(token: Token): boolean {
    return token.kind === TknKind.lsquare;
}

export function isDot(token: Token): boolean {
    return token.kind === TknKind.period;
}

export function isId(token: Token): boolean {
    return token.kind === TknKind.identifier;
}

export function isNumber(token: Token): boolean {
    return token.kind === TknKind.number;
}

