/** An exception used whenever the debug adaptor has trouble loading trace data. */
export class TracesMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TracesMissingError';
        // is this enough to get a stack trace when this expection is thrown?
    }
}