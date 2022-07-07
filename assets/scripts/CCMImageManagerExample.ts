import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMImageLoader } from "../../coco-mat/lib/CCMLoader";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import CCMToast from "../../coco-mat/lib/CCMToast/CCMToast";

import SpriteFrame = cc.SpriteFrame;
import Scheduler = cc.Scheduler;

const {ccclass, property} = cc._decorator;

const TAG = 'CCMImageManagerExample';
@ccclass
export default class CCMImageManager extends cc.Component {

    @property(cc.Button)
    imageBtn: cc.Button = null;

    @property(cc.Sprite)
    imageSprite: cc.Sprite = null;

    imageLoader: CCMImageLoader = null;

    onLoad() {
        this.imageLoader = new CCMImageLoader();
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    start() {

    }

    loadFromLocal() {
        this.imageLoader.loadImg('images/title').then(r => {
            if (r) {
                cc.log(TAG, 'set the texture');
                this.imageSprite.spriteFrame = new SpriteFrame(r);
            } else {
                cc.log(TAG, 'the texture is null');
            }
        }).catch((errmsg) => {
            cc.log(TAG, 'load error' + errmsg);
        });
    }

    loadFromRemote() {
        cc.log(TAG, 'loadFromRemote');
        this.imageLoader.loadImg('https://www.cocos.com/wp-content/themes/cocos/image/logo.png', {
            timeout: 5,
            // target: this,//配置以后当前窗口销毁不再回调图片
        }).then(texture => {
            if (texture) {
                cc.log(TAG, 'set the texture');
                this.imageSprite.spriteFrame = new SpriteFrame(texture);
                CCMToast.show('加载成功,下次进入需重新加载');
            } else {
                cc.log(TAG, 'the texture is null');
            }
        }).catch((errmsg) => {
            cc.log(TAG, 'load error:' + errmsg);
        });
    }

    loadFromRemoteWithCache() {
        this.imageLoader.loadImg('https://www.cocos.com/wp-content/themes/cocos/image/logo.png', {
            timeout: 6,
            target: this,
            autoRelease: false
        }).then(texture => {
            if (texture) {
                cc.log(TAG, 'set the texture');
                this.imageSprite.spriteFrame = new SpriteFrame(texture);
                CCMToast.show('加载成功,下次进入可立即载入');
            } else {
                cc.log(TAG, 'the texture is null');
            }
        }).catch((errmsg) => {
            cc.log(TAG, 'load error:' + errmsg);
            CCMToast.show('加载失败'+errmsg);
        });
    }
}
