interface LogOption {
    tag?: string;
    level?: LogLevel;
}

enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export default class CCMLog {

    private static instance: CCMLog;
    private static TAG = 'CCMLog';

    public static get Instance() {
        if (!this.instance) {
            this.instance = new CCMLog();
        }
        return this.instance;
    }

    /**
     * @description debug 级别输出 log
     * @param tag 标签，建议使用模块名
     * @param msg log 正文
     */
    public d(tag, msg) {
        this.log(msg, {
            tag: tag,
            level: LogLevel.DEBUG
        });
    }

    /**
     * @description info 级别输出 log
     * @param tag 标签，建议使用模块名
     * @param msg log 正文
     */
    public i(tag, msg) {
        this.log(msg, {
            tag: tag,
            level: LogLevel.INFO
        });
    }

    /**
     * @description warn 级别输出 log
     * @param tag 标签，建议使用模块名
     * @param msg log 正文
     */
    public w(tag, msg) {
        this.log(msg, {
            tag: tag,
            level: LogLevel.WARN
        });
    }

    /**
     * @description error 级别输出 log
     * @param tag 标签，建议使用模块名
     * @param msg log 正文
     */
    public e(tag, msg) {
        this.log(msg, {
            tag: tag,
            level: LogLevel.ERROR
        });
    }

    private getDate() {
        var d, s;
        d = new Date();
        s = d.getFullYear() + "-"; //取年份
        s = s + (d.getMonth() + 1) + "-"; //取月份
        s += d.getDate() + " "; //取日期
        s += d.getHours() + ":"; //取小时
        s += d.getMinutes() + ":"; //取分
        s += d.getSeconds(); //取秒
        return (s);
    }

    /**
     * @description 打印日志
     * @param msg 日志内容
     * @param options 可选参数
     *          - level：log 等级
     *          - tag: 标签，比如当前所在的模块名、方法名
     */
    private log(msg: string, options?: LogOption) {
        if (!options) {
            options = {};
        }
        let tag = options.tag ? '' + options.tag : '';
        let level = options.level != undefined ? options.level : LogLevel.DEBUG;
        msg = '' + JSON.stringify(msg);
        switch (level) {
            case LogLevel.DEBUG:
                console.log(`[${tag}]`, msg);
                break;
            case LogLevel.INFO:
                console.info(`[${tag}]`, msg);
                break;
            case LogLevel.WARN:
                console.warn(`[${tag}]`, msg);
                break;
            case LogLevel.ERROR:
                console.error(`[${tag}]`, msg);
                break;
            default:
                console.log(`[${tag}]`, msg);
                break;
        }
    }
}

const ccmlog = CCMLog.Instance;
cc.log = ccmlog.i.bind(ccmlog);
cc.warn = ccmlog.w.bind(ccmlog);
cc.error = ccmlog.e.bind(ccmlog);
