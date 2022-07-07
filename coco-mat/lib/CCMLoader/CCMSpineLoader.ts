import ccloader = cc.loader;
import { CCMZipLoader } from './CCMZipLoader';
import CCMUtils from '../CCMUtils';

const TAG = 'CCMSpineLoader';

const DEFAULT_IMAGELOADER_CONFIG = {timeout: 10, autoRelease: true};

/**
 * @experiment 实验性功能
 *
 * ### Spine加载接口
 * 1. 可加载本地资源和远程资源
 * 2. 支持配置加载超时
 * 3. 可绑定component 生命周期
 */
export interface SpineLoader {
    /**
     * 请求下载网络Spine/或者本地Spine 返回纹理信息
     * @param url 需要加载的url ，可以为本地Spine路径，如<b>images/title</b>（不含文件名），也可以是http(s)协议的远程Spine
     * @param options  配置项属性
     * * timeout 超时时间（秒）
     * * target 依赖的组件cc.Component，若组件已经被销毁，则会返回已销毁异常，需要catch
     * * autoRelease 资源是否随场景自动释放 默认true,若为false ，则下次加载此url时采用缓存.
     */
    loadSpine(url: string, options?: SpineLoaderOptions): Promise<sp.SkeletonData>;
}

export interface SpineLoaderOptions {
    /**
     * 加载超时时间 单位（秒）
     */
    timeout?: Number
    /**
     * 回调依赖的组件，如 SpineView,如果cc.isValid(target) 为true时 才回调加载的资源
     */
    target?: cc.Component
}

/**
 * Spine加载类
 * 1. 可加载本地资源和远程资源
 * 2. 支持配置加载超时
 * 3. 可绑定component 生命周期
 *
 * * 使用方法：
 *
 *```typescript
 *
 * // 请求下载网络Spine/或者本地Spine 返回 SkeletonData
 * // @param url
 * // @param options 选项 timeout 超时时间（秒）,
 * //                  target 依赖的组件cc.Component，若组件已经被销毁，则会返回已销毁异常，需要catch
 * //
 * //
 * loadSpine(url: string, options?: SpineLoaderOptions): Promise<sp.SkeletonData>;
 * ```
 * @implements {SpineLoader}
 */
export default class CCMSpineLoader implements SpineLoader {
    /**
     * 参考 SpineLoader.loadSpine文档描述
     * @param url
     * @param options
     */
    public loadSpine(url: string, options?: SpineLoaderOptions) {
        let tmOption = Object.assign({}, DEFAULT_IMAGELOADER_CONFIG, options);
        let target = tmOption.target;
        let timeout = tmOption.timeout;
        if (!url.startsWith('http')) {
            return this.loadWithTimeout(new SpineLoaderCacheProxy(new LocalSpineLoader(), tmOption.autoRelease).loadSpine(url), target, timeout);
        }
        return this.loadWithTimeout(new SpineLoaderCacheProxy(new RemoteSpineLoader(), tmOption.autoRelease).loadSpine(url), target, timeout);
    };

    private loadWithTimeout(promise: Promise<sp.SkeletonData>, target: cc.Component, timeout: number): Promise<sp.SkeletonData> {
        let timmer = null;
        return Promise.race([new Promise((resolve, reject) => {
            timmer = setTimeout(() => {
                reject(new Error('LoadSpineTimeout'));
            }, timeout * 1000);

        }), promise]).then((result) => {
            clearTimeout(timmer);
            if (target && !cc.isValid(target)) {
                throw Error('target is invalid');
            }
            if (result instanceof sp.SkeletonData) {
                return result;
            } else {
                cc.error(TAG, 'result is not spine');
                throw Error('result is not spine');
            }
        }).catch(exception => {
            clearTimeout(timmer);
            //throw the original exception if the target is valid or null
            cc.error(TAG, `err:[${exception}]`);
            if (!target || cc.isValid(target)) {
                throw exception;
            }
            throw Error('target is invalid');
        });
    }
}

class SpineLoaderCacheProxy implements SpineLoader {
    private readonly spineloader;
    private readonly autoRelease;

    constructor(spineloader: SpineLoader, autoRelease: boolean) {
        this.spineloader = spineloader;
        this.autoRelease = autoRelease;

    }

    loadSpine(url: string): Promise<sp.SkeletonData> {
        return this.spineloader.loadSpine(url).then((texture) => {
            return texture;
        });
    }

}

class LocalSpineLoader implements SpineLoader {
    loadSpine(url: string): Promise<sp.SkeletonData> {
        return new Promise((resolve, reject) => {
            cc.resources.load(url, sp.SkeletonData, function (err, skeData) {
                if (!err && skeData) {
                    resolve(skeData);
                } else {
                    cc.log('load local path failed：' + url + ', err:' + `${err.name}: ${err.message}`);
                    return reject('load local url failed：' + url + ', err:' + `${err.name}: ${err.message}`);
                }
            });
        });
    }
}

class RemoteSpineLoader implements SpineLoader {
    loadSpine(url: string): Promise<sp.SkeletonData> {
        //use native remote request if needed
        if (CCMUtils.getInstance().isAndroid()) {
            return new AndroidSpineLoader().loadSpine(url);
        }
        if (CCMUtils.getInstance().isIOS()) {
            return new IOSSpineLoader().loadSpine((url));
        }
        return new Promise((resolve, reject) => {
            CCMZipLoader.load(url, false).then(zip => {
                zip.toSkeletonData().then(skeletonData => {
                    resolve(skeletonData);
                }).catch(err => {
                    let msg = 'load remote url failed：' + url + ', err:' + `${err.name}: ${err.message}`;
                    cc.log(msg);
                    return reject(msg);
                });
            });
        });
    }
}

class AndroidSpineLoader extends RemoteSpineLoader {
    loadSpine(url: string): Promise<sp.SkeletonData> {
        return CCMZipLoader.load(url, true).then(zip => {
            cc.error(TAG + 'zip :', JSON.stringify(zip));
            return zip.toSkeletonData().then(skeletonData => {
                return Promise.resolve(skeletonData);
            }).catch(err => {
                let msg = 'load remote url failed：' + url + ', err:' + `${err.name}: ${err.message}`;
                cc.log(msg);
                return Promise.reject(msg);
            });
        });

    }
}

class IOSSpineLoader extends RemoteSpineLoader {
    loadSpine(url: string): Promise<sp.SkeletonData> {
        return CCMZipLoader.load(url, true).then(zip => {
            cc.error(TAG + 'zip :', JSON.stringify(zip));
            return zip.toSkeletonData().then(skeletonData => {
                return Promise.resolve(skeletonData);
            }).catch(err => {
                let msg = 'load remote url failed：' + url + ', err:' + `${err.name}: ${err.message}`;
                cc.log(msg);
                return Promise.reject(msg);
            });
        });

    }
}

