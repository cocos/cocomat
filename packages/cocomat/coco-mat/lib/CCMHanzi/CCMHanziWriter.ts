import CCMHanziCharacter, { CCMHanziCharacterData, CCMHanziStroke, Point } from "./CCMHanziCharacter";

/**
 * 基于CCMHanziCharacter的CCMHanziWriter组件
 * 需要CCMHanziCharacter组件支持
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMHanziWriter extends cc.Component {
    private writing: boolean = true;
    @property
    inkMode: boolean = false;
    @property({ tooltip: "墨迹颜色。", visible(this) { return this.inkMode; } })
    get inkColor(): cc.Color { return this._inkColor; }
    set inkColor(v: cc.Color) { this._inkColor = v; this.node.emit('HanziCallDraw', this); }
    @property
    private _inkColor: cc.Color = new cc.Color(200, 10, 10);
    @property
    inkWidth: number = 15;
    @property({ tooltip: "当前第几笔" })
    get strokeNum(): number { return this._strokeNum; }
    set strokeNum(count: number) {
        this._strokeNum = count;
        this.node.emit('HanziCallDraw', this);
    }
    @property
    private _strokeNum: number = 0;
    @property
    CheckRadius: number = 30;

    @property({ tooltip: "绘制每个笔划的颜色。" })
    get lightColor(): cc.Color { return this._lightColor; }
    set lightColor(v: cc.Color) { this._lightColor = v; this.node.emit('HanziCallDraw', this); }
    @property
    private _lightColor: cc.Color = new cc.Color(200, 200, 255);



    @property({ type: cc.Component.EventHandler, tooltip: "错误的笔" })
    onMistake: cc.Component.EventHandler = new cc.Component.EventHandler();
    @property({ type: cc.Component.EventHandler, tooltip: "正确的笔" })
    onCorrect: cc.Component.EventHandler = new cc.Component.EventHandler();
    @property({ type: cc.Component.EventHandler, tooltip: "正确完成测验之后的调用" })
    onComplete: cc.Component.EventHandler = new cc.Component.EventHandler();


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    private _graphics: cc.Graphics;
    private _hanziChar: CCMHanziCharacter;

    start() {

        this._graphics = this.getComponent(cc.Graphics);
        this._hanziChar = this.getComponent(CCMHanziCharacter);
        this._graphics.lineCap = cc.Graphics.LineCap.ROUND;
        this._graphics.lineJoin = cc.Graphics.LineJoin.ROUND;
        if (this._graphics && this._hanziChar) {
            this.node.on("onCharLoadComplete", this.onCharLoadComplete, this);
            this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        } else {
            console.error('this node is not have Graphics & CCMHanziCharacter Component');
        }
    }
    private onCharLoadComplete(data: CCMHanziCharacterData) {
        this._hanziChar.Stokes.forEach((item) => { item.opacity = 0.5 });
        this._strokeNum = 0;
        this.writing = true;
        this.drawingPoint = [];
        this.node.emit('HanziCallDraw', this);
    }
    /** 自动消失的时间 */
    private pointLiveTime = 1000;
    private _checkMedianPoints: Point[];
    private _touchPoints: DrawingPoint[] = [];
    private drawingPoint: DrawingPoint[] = [];
    private onTouchStart(e: cc.Event.EventTouch) {
        if (!this.writing) return;
        if(!this.getComponent(CCMHanziCharacter).charLoaded){
            return;
        }
        const v = this._graphics.node.convertToNodeSpaceAR(e.getLocation());
        this._touchPoints = [];
        this._touchPoints.push(
            {
                cd: this.pointLiveTime,
                x: v.x, y: v.y,
                cmd: "M"
            }
        );
        /** 开始记录检查 */
        this._checkMedianPoints = this._hanziChar.Medians[this.strokeNum].mediansPoints;
        this.node.emit('HanziCallDraw', this);
    }

    private onTouchMove(e: cc.Event.EventTouch) {
        if (!this.writing) return;
        if(!this.getComponent(CCMHanziCharacter).charLoaded){
            return;
        }
        const v = this._graphics.node.convertToNodeSpaceAR(e.getLocation());
        if (this.getDistance(v, this._touchPoints[this._touchPoints.length - 1]) > 5) {
            this._touchPoints.push(
                {
                    cd: this.pointLiveTime,
                    x: v.x, y: v.y,
                    cmd: this._touchPoints.length == 0 ? "M" : "L"
                }
            );
        }
        this.node.emit('HanziCallDraw', this);
    }
    private totalMistakes = 0;
    private mistakeStroke: CCMHanziStroke = null;
    private onTouchEnd(e: cc.Event.EventTouch) {
        if (!this.writing) return;
        if(!this.getComponent(CCMHanziCharacter).charLoaded){
            return;
        }
        // 检查是否准确，采用分段检查方式

        const span = Math.floor(this._touchPoints.length / this._checkMedianPoints.length);
        // 确保第一笔和最后一笔的准确
        const ptFrist = this._checkMedianPoints[0];
        const ptEnd = this._checkMedianPoints[this._checkMedianPoints.length - 1];
        let correct_frist = false;
        let correct_end = false;
        for (let j = 0; j < span; j++) {
            if (this.getDistance(ptFrist, this._touchPoints[j]) < this.CheckRadius) {
                correct_frist = true;
            }
            if (this.getDistance(ptEnd, this._touchPoints[this._touchPoints.length - j - 1]) < this.CheckRadius) {
                correct_end = true;
            }
        }
        let correct = correct_frist && correct_end;
        for (let i = 0; i < this._checkMedianPoints.length; i++) {
            const pt = this._checkMedianPoints[i];
            for (let j = 0; j < this._touchPoints.length; j++) {
                if (this.getDistance(pt, this._touchPoints[j]) < this.CheckRadius) {
                    correct = correct && true;
                    break;
                }
            }
        }
        const stroke = this._hanziChar.Stokes[this.strokeNum];
        if (correct) {
            //笔画多一个
            this.strokeNum += 1;
            if (this.onCorrect) {
                (this.onCorrect as cc.Component.EventHandler).emit([stroke]);
            }
            if (this.strokeNum >= this._hanziChar.strokeNum) {
                if (this.onComplete) {
                    const summary = { character: this._hanziChar, totalMistakes: this.totalMistakes };
                    (this.onComplete as cc.Component.EventHandler).emit([summary]);
                }
                this.writing = false;
            }
        } else {
            this.totalMistakes += 1;
            if (this.onMistake) {
                (this.onMistake as cc.Component.EventHandler).emit([stroke]);
            }
            // 错误情况下，显示一个动画
            if (!this.mistakeStroke) {
                this.mistakeStroke = new CCMHanziStroke(stroke.pathString, this._hanziChar);
                this.mistakeStroke.color = cc.Color.WHITE;
                const color2 = this.lightColor.clone();
                (cc.tween(this.mistakeStroke) as cc.Tween)
                    .to(0.1, { color: color2 })
                    .to(0.1, { color: cc.Color.WHITE })
                    .to(0.1, { color: color2 })
                    .to(0.1, { color: cc.Color.WHITE })
                    .to(0.1, { color: color2 })
                    .call(() => {
                        this.node.emit('HanziCallDraw', this.mistakeStroke);
                        this.mistakeStroke.destroy();
                        this.mistakeStroke = null;
                    })
                    .start();
            }
        }
        // 取消书写
        for (let p of this._touchPoints) {
            if (correct && this.inkMode) {
                p.cd = -99;
                this.drawingPoint.push(p);
            } else {
                if (p.cd != -99) {
                    p.cd = 100 / 1000;
                }
            }
        }
        this._touchPoints = [];
        this._checkMedianPoints = null;
        this.node.emit('HanziCallDraw', this);
    }

    private getDistance(a: Point, b: Point): number {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    draw() {
        // for (let i = 0; i < this.strokeNum; i++) {
        //     this._hanziChar.Stokes[i].draw(this._graphics);
        // }
        if (this.drawingPoint.length > 1 || this._touchPoints.length > 1) {
            if (this.inkMode) {
                this._graphics.strokeColor = this.inkColor;
                this._graphics.lineWidth = this.inkWidth;
            } else {
                this._graphics.strokeColor = this._hanziChar.strokeColor;
            }
            this.drawPoints(this.drawingPoint);
            this.drawPoints(this._touchPoints);

        }
        if (!this.inkMode) {
            for (let i = 0; i < this.strokeNum; i++) {
                CCMHanziStroke.Draw(this._graphics, this._hanziChar.Stokes[i], 1);
            }
        }
    }
    private drawPoints(points: DrawingPoint[]) {
        if (points.length <= 1) return;
        for (let i = 0; i < points.length; i++) {
            const dp = points[i];
            if (dp.cmd === "M") {
                this._graphics.moveTo(dp.x, dp.y);
            } else {
                this._graphics.lineTo(dp.x, dp.y);
            }
        }
        this._graphics.stroke();
    }
    onDestroy() {
        this.node.off("onCharLoadComplete", this.onCharLoadComplete, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
    update(dt) {
        // 周期减少
        for (let i = this.drawingPoint.length - 1; i >= 0; i--) {
            const dp = this.drawingPoint[i];
            dp.cd -= dp.cd == -99 ? 0 : dt;
            if (dp.cd <= 0 && dp.cd != -99) {
                if (i + 1 < this.drawingPoint.length) {
                    this.drawingPoint[i + 1].cmd = "M";
                }
                this.drawingPoint.splice(i, 1);
            }
        }
        if (this.mistakeStroke) {
            this.mistakeStroke.draw(this._graphics);
        }
    }
}
class DrawingPoint extends Point {
    /** M 开始点,L 是过程点 */
    cmd: string;
    /** 它存在的时间 */
    cd: number;
}