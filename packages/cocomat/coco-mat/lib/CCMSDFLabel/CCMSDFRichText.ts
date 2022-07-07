import {CCMSDFLabel} from "./CCMSDFLabel";

const HorizontalAlign = cc.macro.TextAlignment;
const VerticalAlign = cc.macro.VerticalTextAlignment;
const RichTextChildName: string = "RICHTEXT_CHILD";
const RichTextChildImageName: string = "RICHTEXT_Image_CHILD";

/**
 * RichText pool
 */
let pool = new cc.js.Pool(function (node) {
    if (CC_EDITOR) {
        return false;
    }

    if (CC_DEV) {
        cc.assert(!node._parent, 'Recycling node\'s parent should be null!');
    }

    if (!cc.isValid(node)) {
        return false;
    } else if (node.getComponent(cc.LabelOutline)) {
        return false;
    }

    return true;
}, 20);

pool.get = function (string, richtext) {
    let labelNode = this._get();
    if (!labelNode) {
        labelNode = new cc.PrivateNode(RichTextChildName);
    }

    let labelComponent = labelNode.getComponent(CCMSDFLabel);
    if (!labelComponent) {
        labelComponent = labelNode.addComponent(CCMSDFLabel);
    }

    labelNode.setPosition(0, 0);
    labelNode.setAnchorPoint(0.5, 0.5);
    labelNode.setContentSize(128, 128);
    labelNode.skewX = 0;

    if (typeof string !== "string") {
        string = "" + string;
    }

    let isAsset = richtext.font instanceof cc.Font;
    if (isAsset) {
        labelComponent.font = richtext.font;
    } else {
        labelComponent.fontFamily = richtext.fontFamily;
    }

    labelComponent.string = string;
    labelComponent.horizontalAlign = HorizontalAlign.LEFT;
    labelComponent.verticalAlign = VerticalAlign.TOP;
    labelComponent.fontSize = richtext.fontSize || 40;
    labelComponent.overflow = 0;
    labelComponent.enableWrapText = true;
    labelComponent.lineHeight = 25;
    labelComponent.enableBold = false;
    labelComponent.enableItalics = false;
    labelComponent.enableUnderline = false;

    return labelNode;
};

// SDF rich text.

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export class CCMSDFRichText extends cc.RichText {

    @property()
    public _font: cc.BitmapFont = null;

    public get font(): cc.BitmapFont {
        return this._font;
    }

    @property({ type: cc.BitmapFont, override: true })
    public set font(v: cc.BitmapFont) {
        let oldFont = this.font;
        this._font = v;
        if (oldFont === v) {
            return;
        }

        this._layoutDirty = true;
        if (this.font) {
            this.useSystemFont = false;
            this._onTTFLoaded();
        } else {
            this.useSystemFont = true;
        }

        this._updateRichTextStatus();
    }

    // SDF 材质
    @property()
    private _sdfFontMaterial: cc.Material = null;

    public get sdfFontMaterial(): cc.Material {
        return this._sdfFontMaterial;
    }

    @property({ type: cc.Material })
    public set sdfFontMaterial(v: cc.Material) {
        this._sdfFontMaterial = v;
        this._layoutDirty = true;
        this._updateRichTextStatus();
    }

    // 制作 SDF 字体时候原始的字体大小
    // 注意，这里的字号需要和SDF文件里面的字号匹配
    @property()
    private _bitmapFontSize: number = 20;

    public get bitmapFontSize(): number {
        return this._bitmapFontSize;
    }

    @property()
    public set bitmapFontSize(v: number) {
        this._bitmapFontSize = v;
        this._layoutDirty = true;
        this._updateRichTextStatus();
    }

    // LIFE-CYCLE CALLBACKS:

    protected onLoad() {

    }

    protected start() {
        super.start();
    }

    protected onDestroy() {
        for (let i = 0; i < this._labelSegments.length; ++i) {
            this._labelSegments[i].removeFromParent();
            pool.put(this._labelSegments[i]);
        }
    }

    // update (dt) {}

    private _resized(): void {
        this._layoutDirty = true;
    }

    // Override CCRichText._createFontLabel
    private _createFontLabel(content: string): cc.Node {
        let node = pool.get(content, this);
        let label: cc.Label = node.getComponent(cc.Label);
        if (label) {
            if (label.getMaterial(0) !== this.sdfFontMaterial) {
                label.setMaterial(0, this.sdfFontMaterial);
            }
        }

        node.off(cc.Node.EventType.SIZE_CHANGED, this._resized, this);
        node.on(cc.Node.EventType.SIZE_CHANGED, this._resized, this);

        return node;
    }

    // Override CCRichText._resetState
    private _resetState(): void {
        let children = this.node.children;
        for (let i = children.length - 1; i >= 0; i--) {
            let child = children[i];
            if (child.name === RichTextChildName || child.name === RichTextChildImageName) {
                if (child.parent === this.node) {
                    child.parent = null;
                } else {
                    // In case child.parent !== this.node, child cannot be removed from children
                    children.splice(i, 1);
                }
                if (child.name === RichTextChildName) {
                    pool.put(child);
                }
            }
        }

        this._labelSegments.length = 0;
        this._labelSegmentsCache.length = 0;
        this._linesWidth.length = 0;
        this._lineOffsetX = 0;
        this._lineCount = 1;
        this._labelWidth = 0;
        this._labelHeight = 0;
        this._layoutDirty = true;
    }
}
