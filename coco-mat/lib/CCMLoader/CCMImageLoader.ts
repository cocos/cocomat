import Texture2D = cc.Texture2D;
import * as MD5 from 'md5';
import { ccmImageCache } from './CCMImageCache';
import CCMBinding from '../CCMBinding/CCMBinding';
import CCMUtils from '../CCMUtils';

const TAG = 'CCMImageLoader';
const DEFAULT_IMAGELOADER_CONFIG = {timeout: 10, autoRelease: true};

/**
 * @experiment 实验性功能
 *
 * ### 图片加载接口
 * 1. 可加载本地资源和远程资源
 * 2. 支持配置加载超时
 * 3. 可绑定component 生命周期
 */
export interface ImageLoader {
    /**
     * 请求下载网络图片/或者本地图片 返回纹理信息
     * @param url 需要加载的url ，可以为本地图片路径，如<b>images/title</b>（不含文件名），也可以是http(s)协议的远程图片
     * @param options  配置项属性
     * * timeout 超时时间（秒）
     * * target 依赖的组件cc.Component，若组件已经被销毁，则会返回已销毁异常，需要catch
     * * autoRelease 资源是否随场景自动释放 默认true,若为false ，则下次加载此url时采用缓存.
     *
     */
    loadImg(url: string, options?: ImageLoaderOptions): Promise<Texture2D>;
}

export interface ImageLoaderOptions {
    /**
     * 图片加载超时时间
     */
    timeout?: Number
    /**
     * 回调依赖的组件，如 ImageView,如果cc.isValid(target) 为true时 才回调加载的图片
     */
    target?: cc.Component
    /**
     * 是否随场景自动释放图片
     */
    autoRelease?: boolean
}

/**
 * 图片加载类
 * 1. 可加载本地资源和远程资源
 * 2. 支持配置加载超时
 * 3. 可绑定component 生命周期
 *
 * * 使用方法：
 *
 *```typescript
 *
 * // 请求下载网络图片/或者本地图片 返回纹理信息
 * // @param url
 * // @param options 选项 timeout 超时时间（秒）,
 * //                  target 依赖的组件cc.Component，若组件已经被销毁，则会返回已销毁异常，需要catch
 * //                   autoRelease 资源是否随场景自动释放 默认true
 * //
 * loadImg(url: string, options?: ImageLoaderOptions): Promise<Texture2D>;
 * ```
 * @implements {ImageLoader}
 */
export class CCMImageLoader implements ImageLoader {
    /**
     * 参考 ImageLoader.loadImg文档描述
     * @param url
     * @param options
     */
    loadImg(url: string, options?: ImageLoaderOptions) {
        let tmOption = Object.assign({}, DEFAULT_IMAGELOADER_CONFIG, options);
        let target = tmOption.target;
        let timeout = tmOption.timeout;
        //优先cache
        // @ts-ignore
        let key = MD5(url);
        let img = ccmImageCache.getImage(key);
        if (img && cc.isValid(img)) {
            return Promise.resolve(img);
        }
        if (!url.startsWith('http')) {
            return this.loadWithTimeout(new ImageLoaderCacheProxy(new LocalImageLoader(), tmOption.autoRelease).loadImg(url), target, timeout);
        }
        return this.loadWithTimeout(new ImageLoaderCacheProxy(new RemoteImageLoader(), tmOption.autoRelease).loadImg(url), target, timeout);
    };

    private loadWithTimeout(promise: Promise<Texture2D>, target: cc.Component, timeout: number): Promise<Texture2D> {
        let timmer = null;
        return Promise.race([new Promise((resolve, reject) => {
            timmer = setTimeout(() => {
                reject(new Error('LoadImageTimeout'));
            }, timeout * 1000);

        }), promise]).then((result) => {
            clearTimeout(timmer);
            if (target && !cc.isValid(target)) {
                throw Error('target is invalid');
            }
            if (result instanceof Texture2D) {
                return result;
            } else {
                cc.error(TAG, 'result is not texture');
                throw Error('result is not texture');
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

class ImageLoaderCacheProxy implements ImageLoader {
    private readonly imageloader;
    private readonly autoRelease;

    constructor(imageLoader: ImageLoader, autoRelease: boolean) {
        this.imageloader = imageLoader;
        this.autoRelease = autoRelease;

    }

    loadImg(url: string): Promise<cc.Texture2D> {
        return this.imageloader.loadImg(url).then((texture) => {
            // @ts-ignore
            let md5 = MD5(url);
            ccmImageCache.saveTextureToMem(md5, texture, url, url, (this.imageloader instanceof LocalImageLoader), this.autoRelease);
            return texture;
        });
    }

}

class LocalImageLoader implements ImageLoader {
    loadImg(url: string): Promise<cc.Texture2D> {
        return new Promise((resolve, reject) => {
            cc.resources.load(url, function (err, texture) {
                if (!err && texture) {
                    resolve(texture);
                } else {
                    cc.log('load local path failed：' + url + ', err:' + `${err.name}: ${err.message}`);
                    return reject('load local url failed：' + url + ', err:' + `${err.name}: ${err.message}`);
                }
            });
        });
    }
}

class RemoteImageLoader implements ImageLoader {
    loadImg(url: string): Promise<cc.Texture2D> {
        //use native remote request if needed
        if (CCMUtils.getInstance().isAndroid()) {
            return new AndroidImageLoader().loadImg(url);
        }
        if (CCMUtils.getInstance().isIOS()) {
            return new IOSImageLoader().loadImg((url));
        }
        return new Promise((resolve, reject) => {
            cc.assetManager.loadRemote(url, function (err, texture) {
                if (!err && texture) {
                    resolve(texture);
                } else {
                    let msg = 'load remote url failed：' + url + ', err:' + `${err.name}: ${err.message}`;
                    cc.log(msg);
                    return reject(msg);
                }
            });
        });
    }
}

class AndroidImageLoader extends RemoteImageLoader {
    loadImg(url: string): Promise<cc.Texture2D> {
        return CCMBinding.Instance.callNativeMethod('@downloadFile', {url: url})
            .then(({localPath}) => {
                return new Promise((resolve, reject) => {
                    cc.assetManager.loadRemote(localPath, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });

    }
}

class IOSImageLoader extends RemoteImageLoader {
    loadImg(url: string): Promise<cc.Texture2D> {
        return Promise.reject('not implemented yet');
    }
}
