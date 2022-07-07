import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import CCMFitWidget from "../../coco-mat/lib/CCMFitWidget/CCMFitWidget";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMFitWidgetExample extends cc.Component {

    @property(cc.Label) fitTypeLabel: cc.Label = null;
    @property(cc.Label) desLabel: cc.Label = null;
    @property(cc.Node) fitTypeBtn: cc.Node = null;
    @property(cc.Node) dropdownRoot: cc.Node = null;
    @property(cc.Node) dropdownContainer: cc.Node = null;
    @property(cc.Node) thumb: cc.Node = null;
    @property(cc.Node) area: cc.Node = null;
    @property(CCMFitWidget) fitWidget: CCMFitWidget = null;

    descritions: any;

    onLoad() {
        this.initDropdown();
        this.initThumb();
        this.initDescription();

        this.fitTypeLabel.string = CCMFitWidget.FitType[this.fitWidget.fitType];
        this.desLabel.string = this.descritions[this.fitWidget.fitType];
        this.dropdownContainer.x = this.fitTypeBtn.x;
    }

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    onSelectFitTypeClick() {
        this.dropdownRoot.active = true;
    }

    onDropdownItemClick(name) {
        this.fitTypeLabel.string = name;

        let fitType = +CCMFitWidget.FitType[name];
        this.fitWidget.fitType = fitType;
        this.desLabel.string = this.descritions[fitType];
    }

    onCustomAreaToggle(toggle: cc.Toggle) {
        this.fitWidget.useCustomArea = toggle.isChecked;
    }

    initDropdown() {
        let itemTemplate = this.dropdownContainer.children[0];
        itemTemplate.removeFromParent(false);

        this.dropdownRoot.on(cc.Node.EventType.TOUCH_END, () => this.dropdownRoot.active = false);

        Object.keys(CCMFitWidget.FitType).forEach(name => {
            let item = cc.instantiate(itemTemplate);
            item.parent = this.dropdownContainer;
            item.getComponentInChildren(cc.Label).string = name;
            item.on('click', () => {
                this.onDropdownItemClick(name);
                this.dropdownRoot.active = false;
            })
        })

        this.dropdownRoot.active = false;
    }

    initThumb() {
        this.area.getComponentInChildren(cc.Widget).updateAlignment();
        this.area.width = Math.max(this.thumb.x - this.area.x, 0);
        this.area.height = Math.max(this.area.y - this.thumb.y, 0);

        this.thumb.on(cc.Node.EventType.TOUCH_MOVE, (ev: cc.Event.EventTouch) => {
            this.thumb.position = this.thumb.position.add(cc.v3(ev.getDelta()));
            this.area.width = Math.max(this.thumb.x - this.area.x, 0);
            this.area.height = Math.max(this.area.y - this.thumb.y, 0);
        })
    }

    initDescription() {
        this.descritions = {
            [CCMFitWidget.FitType.None]: '请选择适配模式',
            [CCMFitWidget.FitType.FitInParent]: '节点完全嵌入父窗口，父窗口边缘会留白',
            [CCMFitWidget.FitType.EnvelopeParent]: '节点完全铺满父窗口，节点边缘会被裁剪',
            [CCMFitWidget.FitType.FitWidth]: '节点宽永远等于父窗口',
            [CCMFitWidget.FitType.FitHeight]: '节点高永远等于父窗口'
        }
    }
}
