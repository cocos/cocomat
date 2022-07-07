/**
 * 基于CCMHanziCharacter的CCMHanziGrid组件，用来显示田字格
 * 需要CCMHanziCharacter组件支持
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMHanziGrid extends cc.Component {


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    @property({ tooltip: "是否开启田字格" })
    get GridLine(): boolean { return this._GridLine; }
    set GridLine(v: boolean) {
        this._GridLine = v;
        this.node.emit('HanziCallDraw', this);
    }
    @property({ tooltip: "田字格的颜色", visible(this) { return this.GridLine; } })
    get Color(): cc.Color { return this._color; }
    set Color(c: cc.Color) { this._color = c; this.node.emit('HanziCallDraw', this); }

    @property({ tooltip: "是否有背景颜色" })
    get bgFill(): boolean { return this._bgFill; }
    set bgFill(v: boolean) {
        this._bgFill = v;
        this.node.emit('HanziCallDraw');
    }
    @property({ tooltip: "田字格的背景颜色" , visible(this) { return this.bgFill; }  })
    get fillColor(): cc.Color { return this._bgColor; }
    set fillColor(c: cc.Color) { this._bgColor = c; this.node.emit('HanziCallDraw', this); }
    @property({ tooltip: "田字格的线宽", slide: true, range: [0, 10, 1], })
    get lineWidth(): number { return this._lineWidth; }
    set lineWidth(v: number) {
        this._lineWidth = v;
        this.node.emit('HanziCallDraw', this);
    }

    @property
    private _GridLine: boolean = true;
    @property
    private _lineWidth: number = 2;
    @property
    private _color: cc.Color = new cc.Color(33, 33, 33);
    @property
    private _bgColor: cc.Color = cc.Color.WHITE;
    @property
    private _bgFill: boolean = false;
    start() {

    }
    draw() {
        const graphics = this.getComponent(cc.Graphics);
        if (graphics) {
            if (this.bgFill) {
                graphics.fillColor = this.fillColor;
                graphics.rect(-graphics.node.width / 2, -graphics.node.height / 2, graphics.node.width, graphics.node.height);
                graphics.fill();
            }
            if (this.GridLine) {
                graphics.strokeColor = this.Color;
                const nodeWidth = graphics.node.width;
                const nodeHeight = graphics.node.height;
                graphics.rect(-nodeWidth / 2, -nodeHeight / 2, nodeWidth, nodeHeight);
                this.drawDottedLine(graphics, -nodeWidth / 2, -nodeHeight / 2, nodeWidth / 2, nodeHeight / 2);
                this.drawDottedLine(graphics, nodeWidth / 2, -nodeHeight / 2, -nodeWidth / 2, nodeHeight / 2);
                graphics.moveTo(-nodeWidth / 2, 0);
                graphics.lineTo(nodeWidth / 2, 0);
                graphics.moveTo(0, -nodeHeight / 2);
                graphics.lineTo(0, nodeHeight / 2);
                graphics.lineWidth = this.lineWidth;
                graphics.stroke();
            }
        }
    }
    /** 绘制虚线 */
    private drawDottedLine(graphics, beginx: number, beginy: number, endx: number, endy: number) {
        let v = cc.v2(beginx, beginy).subtract(cc.v2(endx, endy));
        const span = v.len() / 41;
        v.x = v.x > 0 ? 1 : -1;
        v.y = v.y > 0 ? 1 : -1;
        const increment = Math.sqrt(span * span / 2);
        for (let i = 0; i < 20; i++) {
            graphics.moveTo(beginx, beginy);
            beginx -= increment * v.x;
            beginy -= increment * v.y;
            graphics.lineTo(beginx, beginy);
            beginx -= increment * v.x;
            beginy -= increment * v.y;
        }
    }
    // update (dt) {}
}
