interface Options {
    /**
     * 接口调用超时时间,单位秒
     */
    timeout?: number;
    hasCallback?: boolean;
    onProgress?: Function;
}

let AUTO_INCREASE_ID = 0;

const ERROR_CODE_METHOD_NOT_DEFINED = -1;
const ERROR_CODE_PARAMS_ERROR = -2;
const ERROR_CODE_TIMEOUT = -3;
const ERROR_CODE_UNKNOW = -999;
export default class CCMBinding {
    private static instance: CCMBinding;

    public static get Instance() {
        if (!this.instance) {
            this.instance = new CCMBinding();
        }
        return this.instance;
    }

    public static withOptions(options: Options): CCMBinding {
        return this.Instance.withOptions(options);
    }

    public static callNativeMethod(methodName: string, args?: Record<string, string | number | boolean>): Promise<any> {
        return this.Instance.callNativeMethod(methodName, args);
    }

    private DEFAULT_OPTIONS: Options = {timeout: 60, hasCallback: true, onProgress: undefined};
    private _options: Options = this.DEFAULT_OPTIONS;


    /**
     * 创建一个临时请求native方法的可选项，包含：
     * 超时时间设置默认60秒，过程回调（若有)
     * @param options Options,
     */
    public withOptions(options: Options): CCMBinding {
        const oriProto = Object.getPrototypeOf(this);
        const temp = Object.assign(Object.create(oriProto), this);
        temp._options = Object.assign({}, this.DEFAULT_OPTIONS, options);
        return temp;
    }

    public callNativeMethod(methodName: string, args?: Record<string, string | number | boolean>): Promise<any> {
        console.log(`options:${JSON.stringify(this._options)}, args:${args}`);
        const hasCallback = this._options.hasCallback;
        const hasProgress = this._options.onProgress;
        return new Promise((resolve, reject) => {
            let cbName = '';
            let timeoutId;
            let cbProgressName = '';
            if (hasCallback || hasProgress) {
                // eslint-disable-next-line no-plusplus
                cbName = `CCM_CB${new Date().getTime()}_${AUTO_INCREASE_ID++}`;
                cbProgressName = `${cbName}_p`;
                timeoutId = setTimeout(() => {
                    if (window[cbName]) {
                        this.clearCallback(cbName, -1, cbProgressName);
                        reject({code: ERROR_CODE_TIMEOUT, msg: `delete cb name: ${cbName},because of timeout`});
                    }
                }, this._options.timeout * 1000);
                window[cbName] = (result) => {
                    console.log('result from native:', JSON.stringify(result));
                    if (result) {
                        const code = result.code;
                        const msg = result.msg;
                        const errCode = result.eCode;
                        const data = result.data;
                        if (code == 0) {
                            resolve(data);
                        } else {
                            reject({code: errCode, msg: msg});
                        }
                    } else {
                        reject({code: ERROR_CODE_UNKNOW, msg: 'result is null'});
                    }
                    this.clearCallback(cbName, timeoutId, cbProgressName);
                };

                window[cbProgressName] = (progressData) => {
                    cc.log('invoke data', JSON.stringify(progressData));
                    if (this._options.onProgress && progressData) {
                        const code = progressData.code;
                        const msg = progressData.msg;
                        const errCode = progressData.eCode;
                        const data = progressData.data;
                        if (code == 0) {
                            this._options.onProgress(data);
                        } else {
                            cc.log(`progress error: ${code}, ${errCode},${msg}`);
                        }
                    }
                };
            }

            if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
                const resultCode = jsb.reflection.callStaticMethod('com/tencent/cocomat/binding/CCMBinding', 'execute', '(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)I',
                    methodName, typeof args === 'object' ? JSON.stringify(args) : '', cbName);
                if (resultCode !== 0) {
                    switch (resultCode) {
                        case -1:
                            reject({
                                code: ERROR_CODE_METHOD_NOT_DEFINED,
                                msg: `${methodName} not found on Android platform`
                            });
                            break;
                        case -2:
                            reject({code: ERROR_CODE_PARAMS_ERROR, msg: `error! invalid parameters`});
                            break;
                        default:
                            reject({code: resultCode, msg: `error! result code=${resultCode}`});
                            break;
                    }
                    if (hasCallback) {
                        this.clearCallback(cbName, timeoutId, cbProgressName);
                    }
                }
            } else if (cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS) {
                const retId = jsb.reflection.callStaticMethod('CCMBinding', 'executeWithMethodName:args:callback:',
                    methodName, typeof args === 'object' ? JSON.stringify(args) : '', cbName);
            } else {
                const msg = 'no implemented on this platform';
                reject({code: ERROR_CODE_METHOD_NOT_DEFINED, msg: msg});
                this.clearCallback(cbName, timeoutId, cbProgressName);
            }
        });
    }

    private clearCallback(cbName: string, timeoutId: number = -1, cbProgressName = '') {
        if (cbProgressName && cbProgressName != '') {
            console.log(`delete cbProgressName${cbName}`);
            delete window[cbProgressName];
        }
        if (cbName && cbName != '') {
            console.log(`delete cbName${cbName}`);
            delete window[cbName];
        }
        if (timeoutId >= 0) {
            console.log(`clearTimeout${cbName}`);
            clearTimeout(timeoutId);
        }
    }
}

