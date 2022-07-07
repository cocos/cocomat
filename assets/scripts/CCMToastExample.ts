import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import CCMToast from "../../coco-mat/lib/CCMToast/CCMToast";

const {ccclass, property} = cc._decorator;

@ccclass
export default class CCMToastExample extends cc.Component {

    // onLoad () {}

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    showCCMToast() {
        CCMToast.show('CCMToast');
    }
}
