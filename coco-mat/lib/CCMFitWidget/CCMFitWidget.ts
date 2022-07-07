
const { ccclass, property, executeInEditMode } = cc._decorator;

/**
 * 适配模式
 */
enum FitType {
    /**
     * 无适配
     */
    None,
    /**
     * 嵌入父窗口
     */
    FitInParent,
    /**
     * 铺满父窗口
     */
    EnvelopeParent,
    /**
     * 匹配父窗口宽
     */
    FitWidth,
    /**
     * 匹配父窗口高
     */
    FitHeight,
}

let sx = 1;
let sy = 1;

/**
 * 窗口自适配组件
 */
@ccclass
@executeInEditMode()
export default class CCMFitWidget extends cc.Component {
    /**
     * 适配模式定义
     * @property {FitType} FitType
     */
    static get FitType() {
        return FitType;
    }

    /**
     * 适配模式
     * @property {FitType} fitType
     */
    @property({ type: cc.Enum(FitType) })_fitType = FitType.None;
    @property({ type: cc.Enum(FitType) })
    get fitType() {
        return this._fitType;
    }
    set fitType(v) {
        this._fitType = v;
        this.updateAspect();
    }

    /**
     * 使用自定义的区域与父窗口进行适配
     * @property {boolean} useCustomArea
     */
    @property() _useCustomArea = false;
    @property()
    get useCustomArea() {
        return this._useCustomArea;
    }
    set useCustomArea(v) {
        this._useCustomArea = v;
        this.updateAspect();
    }

    /**
     * 在场景中绘制出 area 边框
     * @property {boolean} debugDrawArea
     */
    @property({
        visible() {
            return this.useCustomArea;
        },
    })
    debugDrawArea = false;

    /**
     * 自定义适配区域
     * @property {cc.Size} area
     */
    @property() _area = cc.Size.ZERO;
    @property({
        visible() {
            return this.useCustomArea;
        },
    })
    get area() {
        this.validArea();
        return this._area;
    }
    set area(v) {
        this._area = v;
        if (this.validArea()) {
            this.updateAspect();
        }
    }

    pen: cc.Graphics = null;

    onEnable() {
        this.node.parent.on(cc.Node.EventType.SIZE_CHANGED, this.updateAspect, this);
        this.updateAspect();
    }

    onDisable() {
        this.node.parent.targetOff(this);
    }

    /**
     * 自动调整area大小
     * 当输入area的width或height为0时，自动设置成父节点的width或height
     */
    validArea() {
        if (this.useCustomArea && (this._area.width === 0 || this._area.height === 0)) {
            this._area.width = (this._area.width === 0 ? this.node.parent.width : this._area.width);
            this._area.height = (this._area.height === 0 ? this.node.parent.height : this._area.height);
            this.updateAspect();
            return false;
        }
        return true;
    }

    /**
     * 更新适配
     */
    updateAspect() {
        const width = this.useCustomArea ? this.area.width : this.node.width;
        const height = this.useCustomArea ? this.area.height : this.node.height;
        if (width === 0 || height === 0) {
            return;
        }

        switch (this.fitType) {
            case FitType.FitInParent:
                sx = this.node.parent.width / width;
                sy = this.node.parent.height / height;
                this.node.scale = Math.min(sx, sy);
                break;
            case FitType.EnvelopeParent:
                sx = this.node.parent.width / width;
                sy = this.node.parent.height / height;
                this.node.scale = Math.max(sx, sy);
                break;
            case FitType.FitWidth:
                this.node.scale = this.node.parent.width / width;
                break;
            case FitType.FitHeight:
                this.node.scale = this.node.parent.height / height;
                break;
            case FitType.None:
                this.node.scale = 1;
                break;
            default:
                cc.warn('unsupport FitType:', this.fitType);
                break;
        }

        if (this.debugDrawArea) {
            this.debugDraw();
        }
    }

    /**
     * 绘制area区域
     */
    debugDraw() {
        if (CC_EDITOR) {
            return;
        }
        if (!this.useCustomArea) {
            if (this.pen) {
                this.pen.clear();
            }
            return;
        }
        if (!this.pen) {
            const node = new cc.Node();
            node.parent = this.node;
            this.pen = node.addComponent(cc.Graphics);
        }

        this.pen.clear();
        this.pen.rect(-this.area.width * 0.5, -this.area.height * 0.5, this.area.width, this.area.height);
        this.pen.strokeColor = cc.Color.RED;
        this.pen.lineWidth = 3;
        this.pen.stroke();
    }
}
