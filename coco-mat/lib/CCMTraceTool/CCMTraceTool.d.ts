/*
 * 追踪函数调用及传入参数的日志工具
 * 1. 追踪一个类的所有函数调用
 *    @traceClass()
 *    class TestClass {
 *    }
 * 2. 追踪一个object的函数调用
 *    onLoad() {
 *        traceObject(this, { background: blue });
 *    }
 * 
 * 使用时需要将脚本导入为插件
 * 
 * by 子山喵叔
 */


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