
const { ccclass, property } = cc._decorator;

@ccclass
export class CCMCategory extends cc.Component {

    @property({ type: cc.Label })
    private text: cc.Label = null;

    public setup(data: any) {
        this.text.string = String(data);
    }

}