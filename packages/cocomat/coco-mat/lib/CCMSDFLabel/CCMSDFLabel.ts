
const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export class CCMSDFLabel extends cc.Label {
    // 字体整体柔和度
    @property()
    private _softness: number = 0.0625;

    public get softness(): number {
        return this._softness;
    }

    @property()
    public set softness(v: number) {
        this._softness = v;
        this._refresh();
    }

    // 描边开关
    @property()
    private _useOutline: boolean = false;

    public get useOutline(): boolean {
        return this._useOutline;
    }

    @property()
    public set useOutline(v: boolean) {
        this._useOutline = v;
        this._refresh();
    }

    // 描边颜色
    @property()
    private _outlineColor: cc.Color = cc.Color.BLACK;

    public get outlineColor(): cc.Color {
        return this._outlineColor;
    }

    @property({ visible() { return this.useOutline; } })
    public set outlineColor(v: cc.Color) {
        this._outlineColor = v;
        this._refresh();
    }

    // 描边厚度
    @property()
    private _outlineThickness: number = 1;

    public get outlineThickness(): number {
        return this._outlineThickness;
    }

    @property({ visible() { return this.useOutline; }, range: [0, 10], slide: false })
    public set outlineThickness(v: number) {
        this._outlineThickness = v;
        this._refresh();
    }

    // 阴影开关
    @property()
    private _useShadow: boolean = false;

    public get useShadow(): boolean {
        return this._useShadow;
    }

    //是否开启阴影
    @property()
    public set useShadow(v: boolean) {
        this._useShadow = v;
        this._refresh();
    }

    // 阴影颜色
    @property()
    private _shadowColor: cc.Color = cc.Color.BLACK;

    public get shadowColor(): cc.Color {
        return this._shadowColor;
    }

    @property({ visible() { return this.useShadow; } })
    public set shadowColor(v: cc.Color) {
        this._shadowColor = v;
        this._refresh();
    }

    // 阴影偏移
    @property()
    private _shadowOffset: cc.Vec2 = cc.v2(-2, -2);

    public get shadowOffset(): cc.Vec2 {
        return this._shadowOffset;
    }

    @property({ visible() { return this.useShadow; } })
    public set shadowOffset(v: cc.Vec2) {
        this._shadowOffset = v;
        this._refresh();
    }

    // 阴影平滑度
    @property()
    private _shadowSmoothing: number = 0.05;

    public get shadowSmoothing(): number {
        return this._shadowSmoothing;
    }

    @property({ visible() { return this.useShadow; }, range: [0, 0.5], slide: false })
    public set shadowSmoothing(v: number) {
        this._shadowSmoothing = v;
        this._refresh();
    }

    // LIFE-CYCLE CALLBACKS:

    protected onLoad() {
        super.onLoad();
        this.useSystemFont = false;
    }

    protected start() {

    }

    protected onEnable() {
        super.onEnable();
        this._refresh();
    }

    // update (dt) {}

    private _refresh(): void {
        this._updateSDFMaterial();
    }

    private _updateSDFMaterial(): void {
        let material = this.getMaterial(0);
        if ((undefined === material) || (null === material) || 0 !== material.name.search("default-SDF-label-materiall")) {
            cc.error("SpriteOutline._updateMaterial: You should use material default-SDF-label-materiall.");
            return;
        }

        material.define("USE_COLOR", true, 0, true);
        material.setProperty("softness", this.softness);

        material.define("USE_OUTLINE", this.useOutline, 0, true);
        if (this.useOutline) {
            material.setProperty("outlineColor", this.outlineColor);
            material.setProperty("outlineThickness", 0.5 - this.outlineThickness * 0.05);
        }

        material.define("USE_SHADOW", this.useShadow, 0, true);
        if (this.useShadow) {
            material.setProperty("shadowColor", this.shadowColor);
            material.setProperty("shadowOffset", cc.v2(this.shadowOffset.x * 0.0006, this.shadowOffset.y * -0.0006));
            material.setProperty("shadowSmoothing", this.shadowSmoothing);
        }
    }
}
