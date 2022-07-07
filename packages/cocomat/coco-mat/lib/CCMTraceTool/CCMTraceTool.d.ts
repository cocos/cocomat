
interface TraceOption {
    /**
     * background color. rgb(43, 152, 255) / blue / #ff0000 / #f00
     */
    background?: string,
    /**
     * text color. rgb(43, 152, 255) / blue / #ff0000 / #f00
     */
    color?: string,
    /**
     * print call stack. default is true
     */
    stack?: boolean,
    /**
     * ignore traced functions
     */
    ignores?: string[],
    /**
     * custom tag, default is class name
     */
    tag?: string
}

/**
 * example: @traceClass({ background: blue })
 */
declare function traceClass(options?: TraceOption);

/**
 * example:
 * onLoad() {
 *     traceObject(this, { background: blue });
 * }
 */
declare function traceObject(obj: any, options?: TraceOption);