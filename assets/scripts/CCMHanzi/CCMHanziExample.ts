import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import CCMHanziCharacter from "../../../coco-mat/lib/CCMHanzi/CCMHanziCharacter";
import CCMHanziGrid from "../../../coco-mat/lib/CCMHanzi/CCMHanziGrid";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMHanziExample extends cc.Component {
    @property(CCMHanziCharacter)
    hanzi: CCMHanziCharacter = null;
    @property(cc.Label)
    labelTips1: cc.Label = null;
    @property(cc.Label)
    labelTips2: cc.Label = null;
    @property(cc.Slider)
    slider2: cc.Slider = null;
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
    onCharChanged(e: cc.EditBox) {
        this.hanzi.Char = e.string;
    }
    onCharLoaded() {
        this.slider2.progress = 1;
        this.hanzi.strokeNum = this.hanzi.Stokes.length;
        this.labelTips2.string = this.hanzi.Stokes.length + "/" + this.hanzi.Stokes.length;
    }
    onSliderChange(s: cc.Slider, e) {
        if (e == 'num') {
            this.hanzi.strokeNum = Math.ceil(s.progress * this.hanzi.Stokes.length);
            this.labelTips2.string = this.hanzi.strokeNum + "/" + this.hanzi.Stokes.length;
        } if (e == 'gridwidth') {
            this.hanzi.getComponent(CCMHanziGrid).lineWidth = Math.ceil(s.progress * 10);
            this.labelTips1.string = this.hanzi.getComponent(CCMHanziGrid).lineWidth.toFixed(0);
        }
    }
    randomColors(s, e) {
        let sprites: cc.Sprite[] = [];
        if (e == 'grid') {
            sprites = this.colorNode1.getComponentsInChildren(cc.Sprite);
        } else {
            sprites = this.colorNode2.getComponentsInChildren(cc.Sprite);
        }
        for (let i = 1; i < sprites.length; i++) {
            sprites[i].node.color = cc.color(255 * Math.random(), 255 * Math.random(), 255 * Math.random());
        }
    }
    toColor(s: cc.Button, e) {
        if (e == 'grid') {
            this.hanzi.getComponent(CCMHanziGrid).Color = s.target.color;
        } else {
            this.hanzi.strokeColor = s.target.color;
        }
    }
}
