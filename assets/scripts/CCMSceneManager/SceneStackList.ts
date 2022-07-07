import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    private stackBtn: cc.Node = null;
    @property(cc.Node)
    private stackList: cc.Node = null;
    @property(cc.Node)
    private stackListContent: cc.Node = null;
    @property(cc.Prefab)
    private listTitlePrefab: cc.Prefab = null;
    @property(cc.Prefab)
    private listItemPrefab: cc.Prefab = null;

    // onLoad () {}

    protected start() {
        console.log('onStart');
        cc.game.addPersistRootNode(this.stackBtn);
        cc.game.addPersistRootNode(this.stackList);
        this.stackList.active = false;
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            if (this.stackList.active) {
                this.initList();
            }
        });
    }

    // update (dt) {}

    private onStackBtnClicked() {
        this.stackList.active = !this.stackList.active;
        this.stackBtn.getComponentInChildren(cc.Label).string = this.stackList.active ? "隐藏场景栈" : "显示场景栈";
        if (this.stackList.active) {
            this.initList();
        }
    }

    private initList() {
        this.stackListContent.removeAllChildren();

        this.stackListContent.addChild(this.createTitle('SceneStack'));

        let stackListData = CCMSceneManager.getInstance().getSceneStack();
        stackListData.reverse();
        for (let i = 0; i < stackListData.length; i++) {
            let node = this.createItem((stackListData.length - i - 1) + ' ' + stackListData[i].sceneName);
            node.x = 0;
            this.stackListContent.addChild(node);
        }
    }

    private createTitle(title) {
        let node = cc.instantiate(this.listTitlePrefab);
        node.getComponentInChildren(cc.Label).string = title;
        return node;
    }

    private createItem(name) {
        let node = cc.instantiate(this.listItemPrefab);
        node.getComponentInChildren(cc.Label).string = name;
        return node;
    }
}
