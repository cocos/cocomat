import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMCapture } from "../../coco-mat/lib/CCMCapture/CCMCapture";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class CCMCaptureExample extends cc.Component {

    @property(cc.Node)
    sourceNode: cc.Node = null;
    @property(cc.Node)
    displayNode: cc.Node = null;

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    onBtnCapture() {
        const spriteFrame = CCMCapture.Instance.captureNodeToSpriteFrame(this.sourceNode);
        this.displayNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
    }

}
