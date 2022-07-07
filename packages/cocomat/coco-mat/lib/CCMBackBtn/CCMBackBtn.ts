import CCMUtils from '../CCMUtils';

interface ShowOption {
    x?: number;
    y?: number;
    callback: Function;
}
const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMBackBtn extends cc.Component {

    private static prefabPath = 'cocomat/CCMBackBtn/CCMBackBtn';
    private static backBtnNode = null;
    private static clickCallback: Function = null;

    /**
     * @description 展示到指定位置
     * @param options 展示相关参数，包含以下内容：
     * x 按钮的x坐标
     * y 按钮的y坐标
     * callback 点击按钮的回调
     */
    public static show(options: ShowOption) {
        this.clickCallback = options.callback;
        cc.resources.load(CCMBackBtn.prefabPath, (err, prefab) => {
            CCMBackBtn.backBtnNode = cc.instantiate(prefab);
            cc.loader.setAutoReleaseRecursively(prefab, true);
            CCMBackBtn.backBtnNode.x = options.x;
            CCMBackBtn.backBtnNode.y = options.y;
            cc.director.getScene().addChild(CCMBackBtn.backBtnNode);
            CCMBackBtn.backBtnNode.name = 'CCMBackBtn';
        });
    }

    /**
     * @description 展示到左上角
     * @param options 展示相关参数，包含以下内容：
     * x 与屏幕左边界的距离
     * y 与屏幕上边界的距离
     * callback 点击按钮的回调
     */
    public static showOnLeftTop(options: ShowOption) {
        CCMBackBtn.clickCallback = options.callback;
        cc.resources.load(CCMBackBtn.prefabPath, (err, prefab) => {
            CCMBackBtn.backBtnNode = cc.instantiate(prefab);
            cc.loader.setAutoReleaseRecursively(prefab, true);
            let screenHeight = cc.view.getVisibleSize().height;
            let x = options.x != undefined ? options.x : 80;
            let y = options.y != undefined ? options.y : 80;
            CCMBackBtn.backBtnNode.x = x;
            CCMBackBtn.backBtnNode.y = screenHeight - y;
            cc.director.getScene().addChild(CCMBackBtn.backBtnNode);
            CCMBackBtn.backBtnNode.name = 'CCMBackBtn';
        });
    }

    /**
     * @description 隐藏返回按钮
     */
    public static hide() {
        console.log('hide()');
        CCMBackBtn.backBtnNode && (CCMBackBtn.backBtnNode.active = false);
    }

    /**
     * @description 重新显示返回按钮
     */
    public static showAgain() {
        CCMBackBtn.backBtnNode && (CCMBackBtn.backBtnNode.active = true);
    }

    /**
     * @description 设置点击回调
     * @param callback 点击按钮的回调
     */
    public static setCallabck(callback) {
        this.clickCallback = callback;
    }

    @property(cc.Button)
    backBtn: cc.Button = null;

    onClick() {
        if (CCMUtils.getInstance().isQuickClick()) return;
        CCMBackBtn.clickCallback && CCMBackBtn.clickCallback();
    }
}
