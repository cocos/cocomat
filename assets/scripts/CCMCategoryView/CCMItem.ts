
const { ccclass, property } = cc._decorator;

@ccclass
export class CCMItem extends cc.Component {

    @property({ type: cc.Label })
    private text: cc.Label = null;

    private index: number = 0;
    private listener: (index: number) => void = null;

    public setup(data: any, index: number, listener: (index: number) => void) {
        this.text.string = String(data);
        this.index = index;
        this.listener = listener;
    }

    public onClick() {
        if (this.listener) this.listener(this.index);
    }

}