import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import CCMToast from "../../coco-mat/lib/CCMToast/CCMToast";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMBackBtnExample extends cc.Component {

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
