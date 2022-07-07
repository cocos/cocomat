// 将脚本导入为插件


function _traceForTarget(obj, tag, options) {
    if (!window['CC_PREVIEW']) {
        return;
    }
    options = Object.assign({
        background: 'rgb(43, 152, 255)',
        color: 'white',
        stack: true,
        ignores: []
    }, options);
    options.ignores.push('constructor', 'update');

    const { background, color, stack, ignores } = options;
    const prefix = `- [${tag}]`;
    const keys = Object.keys(obj).filter(k => 
        ignores.indexOf(k) < 0 && typeof obj[k] === 'function'
    );

    for(let key of keys) {
        obj[key] = functionProxy(prefix, obj[key], key);
    }

    function functionProxy(logPrefix, func, name) {
        const handler = {
            apply(target, thisArg, argArray) {
                const msg = `${logPrefix} ${name}`;
                const msgs = [`%c ${msg} `, `background:${background};color:${color}`];
                const grouped = argArray.length || stack;
                if (grouped) {
                    console.groupCollapsed(...msgs);
                    argArray.length && argArray.forEach(arg => logArg(arg));
                    if (stack) {
                        console.groupCollapsed('stack');
                        console.trace();
                        console.groupEnd();
                    }
                    console.groupEnd();
                } else {
                    console.log(...msgs);
                }
                const ret = target.apply(thisArg, argArray);
                return ret;
            }
        };
        return new Proxy(func, handler);
    }

    function logArg(arg) {
        if (typeof arg === 'function') {
            console.groupCollapsed('function');
            console.log(arg);
            console.groupEnd();
        } else {
            console.log(arg);
        }
    }
}


/**
 * example: @traceClass({ background: blue })
 */
function traceClass(options = {}) {
    return function(cls) {
        _traceForTarget(cls.prototype, cls.name, options);
    }
}


/**
 * example:
 * onLoad() {
 *     traceObject(this, { background: blue });
 * }
 */
function traceObject(obj, options = {}) {
    if (obj.constructor) {
        _traceForTarget(obj.constructor.prototype, obj.constructor.name, options);
    } else {
        _traceForTarget(obj, options.tag || 'unknown', options);
    }
}


window['traceClass'] = traceClass;
window['traceObject'] = traceObject;