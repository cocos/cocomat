import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import CCMPopupManager from "../../coco-mat/lib/CCMPopup/CCMPopupManager";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import TestPopup from "./CCMPopup/TestPopup";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMPopupExample extends cc.Component {

    @property(cc.Node)
    private testBtn: cc.Node = null;

    protected onLoad() {
        this.init();
        this.registerEvent();
    }

    /**
     * 订阅事件
     */
    private registerEvent() {
        this.testBtn.on(cc.Node.EventType.TOUCH_END, this.onTestBtnClick, this);
    }

    /**
     * 初始化
     */
    protected init() {
        // 加载返回按钮
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    /**
     * 按钮点击回调
     */
    private onTestBtnClick() {
        const options = {
            id: (Math.random() * 10000).toFixed(0).padStart(5, '0'),
            priority: 0
        };
        const params = {
            mode: CCMPopupManager.CacheMode.Frequent
        };
        CCMPopupManager.show(TestPopup.path, options, params);
    }

}
