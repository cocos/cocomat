import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMPicker, Adapter } from "../../../coco-mat/lib/CCMPicker/CCMPicker";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import { CCMPickerItem } from "./CCMPickerItem";


const { ccclass, property } = cc._decorator;

@ccclass
export class CCMPickerExample extends cc.Component {

    @property({ type: CCMPicker })
    private picker: CCMPicker = null;

    @property({ type: cc.Label })
    private text: cc.Label = null;

    protected onLoad() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
        let dataSource = [];
        for (let i = 0; i < 20; i++) {
            dataSource.push(`index ${i}`);
        }
        let adapter: Adapter = {
            dataSource: dataSource,
            onPick: (index: number) => {
                this.text.string = 'pick: ' + index;
            },
            bindView: (node: cc.Node, data: any, index: number) => {
                node.getComponent(CCMPickerItem).setup(data, index, index => {
                    this.picker.setCurrentIndex(index);
                    this.text.string = 'pick index: ' + index;
                });
            },
            transform: (node: cc.Node, ratio: number) => {
                let text = node.getChildByName('text');
                if (ratio > 1) {
                    ratio = 1;
                } else if (ratio < -1) {
                    ratio = -1;
                }
                let absRatio = Math.abs(ratio);
                text.y = 30 * ratio;
                text.scale = 1.3 - 0.3 * absRatio;
            }
        };
        this.picker.setAdapter(adapter);
    }

}