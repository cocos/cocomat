import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import CCMHanziCharacter from "../../../coco-mat/lib/CCMHanzi/CCMHanziCharacter";
import CCMHanziWriter from "../../../coco-mat/lib/CCMHanzi/CCMHanziWriter";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMHanziWriteExample extends cc.Component {

    @property(CCMHanziWriter)
    hanzi: CCMHanziWriter = null;
    @property(cc.Label)
    labelTips1: cc.Label = null;
    @property(cc.Label)
    labelTips2: cc.Label = null;
    @property(cc.Node)
    colorNode1: cc.Node = null;
    @property(cc.Node)
    colorNode2: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    onCharLoaded() {
        this.hanzi.getComponent(CCMHanziCharacter).strokeNum = this.hanzi.getComponent(CCMHanziCharacter).Stokes.length;
    }
    onCharChanged(e: cc.EditBox) {
        this.hanzi.getComponent(CCMHanziCharacter).Char = e.string;
    }
    onSliderChange(s: cc.Slider, e) {
        this.hanzi.inkWidth = Math.ceil(s.progress * 50);
        this.labelTips1.string = this.hanzi.inkWidth.toFixed(0);
        this.hanzi.getComponent(CCMHanziCharacter).draw();
    }
    randomColors(s, e) {
        let sprites: cc.Sprite[] = [];
        if (e == 'ink') {
            sprites = this.colorNode1.getComponentsInChildren(cc.Sprite);
        } else {
            sprites = this.colorNode2.getComponentsInChildren(cc.Sprite);
        }
        for (let i = 1; i < sprites.length; i++) {
            sprites[i].node.color = cc.color(255 * Math.random(), 255 * Math.random(), 255 * Math.random());
        }
    }
    toColor(s: cc.Button, e) {
        if (e == 'ink') {
            this.hanzi.inkColor = s.target.color;
        } else {
            this.hanzi.lightColor = s.target.color;
        }
        this.hanzi.getComponent(CCMHanziCharacter).draw();
    }
    onShowMedian(s: cc.Toggle) {
        this.hanzi.getComponent(CCMHanziCharacter).showMedian = s.isChecked;
        this.hanzi.getComponent(CCMHanziCharacter).draw();
    }

    onMistake() {
        this.labelTips2.string = "错了";
        this.labelTips2.node.opacity = 255;
    }
    onCorrect() {
        this.labelTips2.string = "对了";
        this.labelTips2.node.opacity = 255;
    }
    onComplete() {
        this.labelTips2.string = "完成";
        this.labelTips2.node.opacity = 255;
    }
    update(dt) {
        this.labelTips2.node.opacity -= dt * 100;
        if (this.labelTips2.node.opacity < 0) {
            this.labelTips2.node.opacity = 0;
        }
    }
}
