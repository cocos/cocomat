import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class StandardMode extends cc.Component {

    // onLoad () {}

    protected start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }
}
