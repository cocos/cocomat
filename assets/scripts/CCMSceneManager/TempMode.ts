import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    // onLoad () {}

    protected start() {
    }

    // update (dt) {}

    private onStartNextScene() {
        CCMSceneManager.getInstance().startScene('StandardMode');
    }
}
