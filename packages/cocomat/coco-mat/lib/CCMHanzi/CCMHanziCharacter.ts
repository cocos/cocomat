const { ccclass, property } = cc._decorator;

@ccclass("CCMHanziNetworkOptions")
/**
 * CCMHanzi的网络设置
 */
export class CCMHanziNetworkOptions {
    /** 默认的数据取得地址
     *  其中${char}为替换字符标记
     */
    public static defaultHanziUrl: string = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json";
    @property({ tooltip: "配置网络读取地址，自动替换 ${char} 标记位置" })
    hanziUrl: string = CCMHanziNetworkOptions.defaultHanziUrl;
    @property({ type: cc.Component.EventHandler, tooltip: "当读取完成后，用网络加载才会用得上" })
    onCharLoadComplete: cc.Component.EventHandler = new cc.Component.EventHandler();
}
/**
 * 能够绘制Hanzi数据的CocosCreator组件
 */
@ccclass
export default class CCMHanziCharacter extends cc.Component {
    public charOffset = { x: -500, y: -400 };
    @property
    get Char(): string { return this._char; }
    set Char(v: string) {
        this._char = v;
        this.loadCharFromNetwork();
    }
    charLoaded = false;
    @property
    private _char: string = "我";
    @property({ tooltip: "绘制每个笔划的颜色。" })
    get strokeColor(): cc.Color { return this._strokeColor; }
    set strokeColor(v: cc.Color) { this._strokeColor = v; this.node.emit('HanziCallDraw', this); }
    @property
    private _strokeColor: cc.Color = new cc.Color(85, 85, 85);

    @property({ tooltip: "当前第几笔" })
    get strokeNum(): number { return this._strokeNum; }
    set strokeNum(count: number) {
        this._strokeNum = count;
        this.node.emit('HanziCallDraw', this);
    }
    @property
    private _strokeNum: number = -1;
    /** 组件的网络设置 */
    @property(CCMHanziNetworkOptions)
    networkOptions: CCMHanziNetworkOptions = new CCMHanziNetworkOptions();
    ratio: number = 1;
    private _graphics: cc.Graphics;
    start() {
        this._graphics = this.getComponent(cc.Graphics);
        this.ratio = Math.min(1000 / this._graphics.node.width, 1000 / this._graphics.node.height);
        this.node.on('HanziCallDraw', this.onHanziCallDraw, this);
        this.loadCharFromNetwork();
    }
    @property({ tooltip: "显示中线" })
    showMedian: boolean = false;
    private callDraw = [];
    private onHanziCallDraw(e) {
        this.callDraw.push(e);
    }
    /** 绘制 */
    draw() {
        this._graphics.clear();
        const grid = this.getComponent("CCMHanziGrid");

        if (grid) {

            if (grid.enabled) {
                grid.draw();
            }
        }
        if (this._strokeNum == -1 || this._strokeNum > this._strokes.length) {
            this._strokeNum = this._strokes.length;
        }
        this._strokes.forEach((stroke, index) => {
            if (index < this._strokeNum) {
                stroke.draw(this._graphics);
            }
        });
        if (this.showMedian) {
            for (let m of this.Medians) {
                m.draw(this._graphics);
            }
        }
        const writer = this.getComponent("CCMHanziWriter");
        if (writer) {
            writer.draw();
        }
    }
    /** 从网络读取数据 */
    private loadCharFromNetwork() {
        if (this._char == '') {
            console.error('character is empty !');
            // this._char = '错';
            return;
        }

        if (escape(this._char).indexOf("%u") < 0) {
            console.error('character is not Chinese !');
            // this._char = '错'
            return;
        }
        this._char = this._char[0];
        this.charLoaded = false;
        CCMHanziCharacter.charDataLoader(this.networkOptions.hanziUrl.replace('${char}', this._char)).then((data) => {
            this.setCharacterData(data);
            this.charLoaded = true;
            if (this.networkOptions.onCharLoadComplete) {
                (this.networkOptions.onCharLoadComplete as cc.Component.EventHandler).emit([]);
            }
            this.node.emit("onCharLoadComplete", data);
        });
    }
    /** 从网络上读取文字的方法 */
    private static charDataLoader(charUrl: string): Promise<any> {
        return new Promise((res, rej) => {
            const xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                // IE 9 and 10 don't seem to support this...
                xhr.overrideMimeType('application/json');
            }
            // xhr.open('GET', `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${VERSION}/${char}.json`, true);
            xhr.open('GET', charUrl, true);
            xhr.onerror = (event) => {
                rej(event);
            };
            xhr.onreadystatechange = () => {
                // TODO: error handling
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    res(JSON.parse(xhr.responseText));
                } else if (xhr.status !== 0) {
                    rej(xhr);
                }
            };
            xhr.send(null);
        });
    }
    update(dt) {
        if (this.callDraw.length > 0) {
            // console.log(this.callDraw);

            this.callDraw = [];
            this.draw();
        }
    }

    /** 笔画数据 */
    protected _strokes: CCMHanziStroke[] = [];
    get Stokes(): CCMHanziStroke[] { return this._strokes; }
    /** 中线数据 */
    protected _medians: CCMHanziMedian[] = [];
    get Medians(): CCMHanziMedian[] { return this._medians; }
    /** 弧线数据索引集合 */
    radStrokes: number[];
    _data: CCMHanziCharacterData;
    /** 设置字符数据 */
    private setCharacterData(data: CCMHanziCharacterData) {
        this._strokes = [];
        for (let strokedata of data.strokes) {
            this._strokes.push(new CCMHanziStroke(strokedata, this));
        }
        this._medians = [];
        for (let mediandata of data.medians) {
            this._medians.push(new CCMHanziMedian(mediandata, this));
        }

        this.node.emit('HanziCallDraw', this);
    }
    /** 销毁 */
    onDestroy() {
        if (this.networkOptions) {
            this.networkOptions.onCharLoadComplete = null;
        }
        for (let stroke of this._strokes) {
            stroke.destroy();
        }
        this._strokes = null;
        for (let median of this._medians) {
            median.destroy();
        }
        this._medians = null;
        this._data = null;
        this.callDraw = [];
    }
}
/** 汉字数据结构 */
export class CCMHanziCharacterData {
    /** 笔画数据字段 */
    strokes: string[];
    /** 中线的数据 */
    medians: Array<Array<number[]>>;
    /** 笔顺 */
    radStrokes: number[];
}
/** 自定义点数据结构 */
export class Point {
    x: number;
    y: number;
}
/** 中线的数据结构和处理 */
export class CCMHanziMedian {
    private _medians: Point[] = [];
    get mediansPoints(): Point[] {
        return this._medians;
    }
    constructor(items: Array<number[]>, hanziChar: CCMHanziCharacter) {
        const ratio = hanziChar.ratio;
        for (let item of items) {
            this._medians.push(
                {
                    x: (item[0] + hanziChar.charOffset.x) / ratio,
                    y: (item[1] + hanziChar.charOffset.y) / ratio,
                });
        }
    }
    destroy() {
        this._medians.splice(0, this._medians.length);
        this._medians = null;
    }
    draw(g: cc.Graphics) {
        g.moveTo(this._medians[0].x, this._medians[0].y);
        for (let i = 1; i < this._medians.length; i++) {
            g.lineTo(this._medians[i].x, this._medians[i].y);
        }
        g.strokeColor = cc.Color.RED;
        g.stroke();
    }
}
/** 汉字笔画的处理类 */
export class CCMHanziStroke extends cc.Object {
    color: cc.Color = null;
    /** 笔画的不透明alpha，0-1，用来做透明动画的 */
    alpha: number = 1;
    /** 对于色值而言的不透明度 */
    opacity: number = 1;
    private hanziChar: CCMHanziCharacter;
    private _pathString: string;
    get pathString() { return this._pathString; }
    private _pathParts: string[];
    private _pathCmdParams: { cmd: string, rawParams: number[] }[];
    constructor(pathString: string, hanziChar: CCMHanziCharacter) {
        super();
        this.hanziChar = hanziChar;
        this._pathString = pathString;
        this._pathParts = pathString.split(/(^|\s+)(?=[A-Z])/).filter((part) => part !== ' ');
        const [cmd, ...rawParams] = this._pathString.split(/\s+/);
        this._pathCmdParams = [];
        for (const part of this._pathParts) {
            const [cmd, ...rawParams] = part.split(/\s+/);
            this._pathCmdParams.push(
                {
                    cmd: cmd,
                    rawParams: rawParams.map((param, index) => (parseFloat(param) + (index % 2 == 0 ? hanziChar.charOffset.x : hanziChar.charOffset.y)) / this.hanziChar.ratio) as any[]
                });
        }
    }
    draw(graphics: cc.Graphics) {
        CCMHanziStroke.Draw(graphics, this);
    }
    static Draw(graphics: cc.Graphics, stroke: CCMHanziStroke, opacity = null) {
        for (const cmdParams of stroke._pathCmdParams) {
            const cmd = cmdParams.cmd;
            const params = cmdParams.rawParams;
            if (cmd === 'M') {
                graphics.moveTo(...params);
            } else if (cmd === 'L') {
                graphics.lineTo(...params);
            } else if (cmd === 'C') {
                graphics.bezierCurveTo(...params);
            } else if (cmd === 'Q') {
                graphics.quadraticCurveTo(...params);
            } else if (cmd === 'Z') {
                // close
            }
        }
        const color = stroke.color == null ? stroke.hanziChar.strokeColor.clone() : stroke.color;
        if (opacity == null || opacity < 0) {
            opacity = stroke.opacity;
        }
        color.a = stroke.alpha * color.a;
        color.r += (255 - color.r) * (1 - opacity);
        color.g += (255 - color.g) * (1 - opacity);
        color.b += (255 - color.b) * (1 - opacity);
        graphics.fillColor = color;
        graphics.fill();

    }
    onDestroy() {
        this._pathCmdParams = null;
        this.hanziChar = null;
        this.color = null;
    }

}