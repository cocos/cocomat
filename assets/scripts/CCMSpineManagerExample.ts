import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMLoader } from "../../coco-mat/lib/CCMLoader";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import Scheduler = cc.Scheduler;

const { ccclass, property } = cc._decorator;

const TAG = 'CCMSpineManagerExample';
@ccclass
export default class CCMImageManager extends cc.Component {


    @property(sp.Skeleton)
    spineSkeleton: sp.Skeleton = null;

    onLoad() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    start() {

    }

    loadFromLocal() {
        CCMLoader.loadSpine('spine/spineboy/spineboy').then(skeletonData => {
            if (skeletonData) {
                cc.log(TAG, 'set the skeletonData');
                this.spineSkeleton.skeletonData = skeletonData;
                this.spineSkeleton.setAnimation(0, 'run', true);
            } else {
                cc.log(TAG, 'the skeletonData is null');
            }
        }).catch((errmsg) => {
            cc.log(TAG, 'load error:' + errmsg);
        });
    }

    loadFromRemote() {
        cc.log(TAG, 'loadFromRemote');
        CCMLoader.loadSpine('https://wzpan-1253537070.cos.ap-guangzhou.myqcloud.com/misc/spineboy.zip', { timeout: 10 }).then(skeletonData => {
            if (skeletonData) {
                cc.log(TAG, 'set the skeletonData');
                this.spineSkeleton.skeletonData = skeletonData;
                this.spineSkeleton.setAnimation(0, 'shoot', true);
            } else {
                cc.log(TAG, 'the skeletonData is null');
            }
        }).catch((errmsg) => {
            cc.log(TAG, 'load error:' + errmsg);
        });
    }

}
