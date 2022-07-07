/**
 * 路由方法，可以注册方法供别的模块,或者是native主动发起调用
 */
import CCMBinding from './CCMBinding';

const TAG = 'CCMRouter';
export default class CCMRouter {
    private static instance: CCMRouter;

    public static callMethod(methodName: string, args?: any): Promise<any> {
        return this.Instance.callMethod(methodName, args);
    }

    public static registerMethod(methodName: string, callback: Function) {
        return this.Instance.registerMethod(methodName, callback);
    }

    public static unRegisterMethod(eventName: string) {
        return this.Instance.unRegisterMethod(eventName);
    }

    public static get Instance() {
        if (!this.instance) {
            this.instance = new CCMRouter();
        }
        return this.instance;
    }

    methodMap = new Map();

    /**
     * 自定义事件处理者
     */
    public registerMethod(eventName: string, callback: Function) {
        this.methodMap.set(eventName, callback);
        window[`ccmbinding_router_${eventName}`] = (args) => {
            cc.log(TAG, 'called eventName' + eventName);
            return this.callMethod(eventName, args).then().catch();
        };
    }

    public unRegisterMethod(eventName: string) {
        this.methodMap.delete(eventName);
        delete window[`ccmbinding_router_${eventName}`];
    }

    public callMethod(methodName: string, args: any): Promise<any> {
        const method = this.methodMap.get(methodName);
        if (method) {
            const data = args['data'];
            const exeResult = method.call(this, data);
            // 如果是在native环境下，则需要把结果返回到native中。
            if (cc.sys.isNative && typeof exeResult === 'object') {
                if (exeResult instanceof Promise) {
                    exeResult.then((result) => {
                        cc.log('start call native from ts');
                        const callbackName = args['@nativeCallbackName'];
                        CCMBinding.withOptions({hasCallback: false}).callNativeMethod(callbackName, result)
                            .then((rs) => {
                                cc.log('receive:', rs);
                            }).catch(e => {
                            cc.log('exception:', e);
                        });
                    });
                } else {
                    cc.log('start call native from ts');
                    const callbackName = args['@nativeCallbackName'];
                    CCMBinding.withOptions({hasCallback: false}).callNativeMethod(callbackName, exeResult)
                        .then((rs) => {
                            cc.log('receive:', rs);
                        }).catch(e => {
                        cc.log('exception:', e);
                    });
                }
            }
            return Promise.resolve(exeResult);
        } else {
            return Promise.reject({code: -1, msg: `${methodName} not register`});
        }
    }
}
