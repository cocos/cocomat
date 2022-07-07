export default class CCMUtils {

    private static instance: CCMUtils;
    private static TAG = 'CCMSceneManager';

    public static getInstance() {
        if (!CCMUtils.instance) {
            CCMUtils.instance = new CCMUtils();
        }

        return CCMUtils.instance;
    }

    private clickTime = {};

    /**
     * @description 是否频繁点击
     * @param 判断重点的一个id，用于区分不同时机 
     * @duration 少于该时长即认为发生了重复点击（毫秒）     
     **/
    public isQuickClick(tag?: string, duration?: number) : boolean{
        if (!tag) tag = 'normal';
        if (!this.clickTime) this.clickTime = {};
        if (this.clickTime[tag] == undefined) this.clickTime[tag] = 0;
        let gapTime = new Date().getTime() - this.clickTime[tag];
        if (!duration) duration = 500;
        if (gapTime < duration) {
            console.log(CCMUtils.TAG, '请勿重复点击');
            return true;
        }
        this.clickTime[tag] = new Date().getTime();
        return false;
    }

    /**
     * @description 是否是平板的屏幕，仅根据屏幕高宽比判断，不适合用于确定是否真的平板
     */
    isPadScreen() : boolean{
        let screenWidth = cc.view.getVisibleSize().width;
        let screenHeight = cc.view.getVisibleSize().height;
        let ratio = 1.69;
        return !(screenWidth > screenHeight && screenWidth >= ratio * screenHeight)
            && !(screenHeight > screenWidth && screenHeight >= ratio * screenWidth);
    }

    public isWxGame() : boolean{
        return cc.sys.platform === cc.sys.WECHAT_GAME;
    }

    public isAndroid() : boolean{
        return cc.sys.isNative && cc.sys.os == cc.sys.OS_ANDROID;
    }

    public isIOS() : boolean{
        return cc.sys.isNative && cc.sys.os == cc.sys.OS_IOS;
    }

    public isBrowser() : boolean{
        return cc.sys.isBrowser;
    }

    /**
     * @description 快速获取某个数据对象中深层 key 的值
     * @param src 数据对象
     * @param key 要获取值对应的 key，层级通过 # 分割
     */
    key4property(src, key) {
        if (!src) return undefined;
        let keys = key.split('#');
        for (let i = 0, j = keys.length; i < j; i++) {
            src = src[keys[i]];
            if (typeof src == 'object' && src != null) continue;
            if (i < j - 1) return undefined;
        }
        return src;
    }
}
