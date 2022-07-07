import CCMPopupBase from "../../../coco-mat/lib/CCMPopup/CCMPopupBase";
import CCMPopupManager from "../../../coco-mat/lib/CCMPopup/CCMPopupManager";

const { ccclass, property } = cc._decorator;

/**
 * 测试用例弹窗
 */
@ccclass
export default class TestPopup extends CCMPopupBase<Options> {

    @property(cc.Node)
    protected closeBtn: cc.Node = null;

    @property(cc.Label)
    protected curIdLabel: cc.Label = null;

    @property(cc.Label)
    protected newIdLabel: cc.Label = null;

    @property(cc.Label)
    protected curPriorityLabel: cc.Label = null;

    @property(cc.Label)
    protected newPriorityLabel: cc.Label = null;

    @property(cc.Node)
    protected normalBtn: cc.Node = null;

    @property(cc.Node)
    protected priorityBtn: cc.Node = null;

    @property(cc.Node)
    protected immediatelyBtn: cc.Node = null;

    protected nextId: string = null;

    protected nextPriority: number = null;

    /** 弹窗路径 */
    public static get path() {
        return 'prefabs/TestPopup';
    }

    protected onLoad() {
        this.registerEvent();
    }

    /**
     * 订阅事件
     */
    protected registerEvent() {
        this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.normalBtn.on(cc.Node.EventType.TOUCH_END, this.onNormalBtnClick, this);
        this.priorityBtn.on(cc.Node.EventType.TOUCH_END, this.onPriorityBtnClick, this);
        this.immediatelyBtn.on(cc.Node.EventType.TOUCH_END, this.onImmediatelyBtnClick, this);
    }

    /**
     * 更新样式
     * @param options 选项
     */
    protected updateDisplay(options: Options) {
        this.curIdLabel.string = `当前 ID: ${options.id}`;
        this.curPriorityLabel.string = `当前优先级: ${options.priority != null ? options.priority : 0}`;
        this.generateNewId();
        this.newPriorityLabel.string = ``;
    }

    /**
     * 生产新 ID
     */
    protected generateNewId() {
        this.nextId = (Math.random() * 10000).toFixed(0).padStart(5, '0');
        this.newIdLabel.string = `下个 ID: ${this.nextId}`;
    }

    /**
     * 生产新优先级
     */
    protected generateNewPriority() {
        if (this.nextPriority != null) {
            this.nextPriority++;
        } else {
            this.nextPriority = this.options.priority + 1;
        }
        this.newPriorityLabel.string = `下个优先级: ${this.nextPriority}`;
    }

    /**
     * 关闭按钮点击回调
     */
    protected onCloseBtnClick() {
        this.hide();
    }

    /**
     * 按钮点击回调
     */
    protected onNormalBtnClick() {
        const options = {
            id: this.nextId
        };
        const params = {
            mode: CCMPopupManager.CacheMode.Frequent,
            priority: 0
        };
        CCMPopupManager.show(TestPopup.path, options, params);
        this.generateNewId();
    }

    /**
     * 按钮点击回调
     */
    protected onPriorityBtnClick() {
        const options = {
            id: this.nextId,
            priority: this.nextPriority
        };
        const params = {
            mode: CCMPopupManager.CacheMode.Frequent,
            priority: this.nextPriority
        };
        CCMPopupManager.show(TestPopup.path, options, params);
        this.generateNewId();
        this.generateNewPriority();
    }

    /**
     * 按钮点击回调
     */
    protected onImmediatelyBtnClick() {
        const options = {
            id: this.nextId
        };
        const params = {
            mode: CCMPopupManager.CacheMode.Frequent,
            immediately: true
        };
        CCMPopupManager.show(TestPopup.path, options, params);
    }

}

interface Options {
    id: string;
    priority: number;
}
