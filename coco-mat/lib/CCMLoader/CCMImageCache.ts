/**
 * @Author: Hugh
 * @createdTime: 2020/12/22 10:04 下午
 * @description: CCM文件缓存类
 */
import Texture2D = cc.Texture2D;

const TAG = 'CCMImageCache';

/**
 * @ignore
 */
class CCMImageCache {

    //内存缓存.
    private loadedRes: Array<TextureCacheListItem> = [];

    //缓存的文件名称
    private cachedFileNames = [];

    /**
     * 通过key(url)找到相应纹理
     * @param key
     * @return {Texture2D} 返回纹理图片
     */
    public getImage(key): Texture2D {
        let found: TextureCacheListItem = null;
        let trimList: Array<TextureCacheListItem> = [];
        for (let idx = 0; idx < this.loadedRes.length; ++idx) {
            let ctx = this.loadedRes[idx];
            if (ctx.tex && cc.isValid(ctx.tex)) {
                if (ctx.key === key) {
                    found = ctx;
                }
            } else {
                cc.loader.release(ctx.tex);
                cc.error(TAG, 'the cached texture already destroyed');
                trimList.push(ctx);
            }
        }
        this.trimCache(trimList);
        if (found) {
            return found.tex;
        }
        return null;
    }

    /**
     * 保存图片texture到内存缓存
     *
     * @param {*} key 一般为url的md5
     * @param {*} texture 纹理
     * @param {*} path 用于删除时的本地path
     * @param {*} url 资源url
     * @param {*} res 是否是res资源
     * @param autoRelease 是否场景切换自动释放资源
     */
    public saveTextureToMem(key, texture, path, url, res, autoRelease) {
        if (key && texture) {
            if (this.cachedFileNames.indexOf(key) == -1) {
                this.cachedFileNames.push(key);
            } else {
                //delete the key for item
                this.loadedRes = this.loadedRes.filter(item => {
                    let keep = (item.key !== key);
                    if (!keep) {
                        cc.error(TAG, `update Item:${item}`);
                    }
                    return keep;
                });
            }
            this.loadedRes.push({
                tex: texture,
                key: key,
                path: path,
                url: url,
                isRes: res
            });
            cc.loader.setAutoReleaseRecursively(path, autoRelease);
        }
    }

    private trimCache(preDeleteIndexs: Array<TextureCacheListItem>) {
        if (!preDeleteIndexs || preDeleteIndexs.length == 0) {
            return;
        }
        this.loadedRes = this.loadedRes.filter(item => {
            let keep = !preDeleteIndexs.includes(item);
            if (!keep) {
                cc.error(TAG, `remove:${item}`);
            }
            return keep;
        });
    }
}

interface TextureCacheListItem {
    tex: Texture2D,
    key: string,
    path: string,
    url: string,
    isRes: boolean
}
/**
 * @ignore
 */
export const ccmImageCache = new CCMImageCache();

