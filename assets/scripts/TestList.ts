import { CCMSceneManager, StartSceneMode } from '../../coco-mat/lib/CCMSceneManager/CCMSceneManager';
import { DocListener } from './DocListener';

const { ccclass, property } = cc._decorator;

@traceClass()
@ccclass
export default class TestList extends cc.Component {


    @property(cc.Node)
    private listContent: cc.Node = null;
    @property(cc.Prefab)
    private itemTitlePrefab: cc.Prefab = null;
    @property(cc.Prefab)
    private itemPrefab: cc.Prefab = null;

    private caseScenePrefix = 'db://assets/scenes/cases/';
    private sceneList = [];

    // onLoad () {}

    protected start() {
        if (CCMSceneManager.getInstance().getSceneStack().length == 0) {
            CCMSceneManager.getInstance().init('TestList');
        }
        this.getListData();
        this.initView();

        new DocListener(this.sceneList.slice());
    }

    // update (dt) {}

    private getListData() {
        let scenes = cc.game['_sceneInfos'];
        let dict = {};
        if (scenes) {
            for (let temp of scenes) {
                let url = temp.url;

                if (!url.startsWith(this.caseScenePrefix)) {
                    continue;
                }
                let dirname = cc.path.dirname(url).replace(this.caseScenePrefix, '');
                let scenename = cc.path.basename(url, '.fire');

                if (!dirname) dirname = '_root';
                if (!dict[dirname]) {
                    dict[dirname] = {};
                }
                dict[dirname][scenename] = url;
            }
        } else {
            cc.error('failed to get scene list!');
        }
        let dirs = Object.keys(dict);
        dirs.sort();
        for (let temp of dirs) {
            this.sceneList.push({
                name: temp,
                isTitle: true
            });
            let scenenames = Object.keys(dict[temp]);
            scenenames.sort();
            for (let name of scenenames) {
                let url = dict[temp][name];
                this.sceneList.push({ name, url });
            }
        }
    }

    private initView() {
        for (let sceneData of this.sceneList) {
            let node;
            if (sceneData.isTitle) {
                node = this.creatTitle(sceneData.name);
            } else {
                node = this.createItem(sceneData);
            }
            this.listContent.addChild(node);
        }
    }

    private creatTitle(title) {
        let titleNode = cc.instantiate(this.itemTitlePrefab);
        titleNode.getComponent(cc.Label).string = title;
        titleNode.x = 0;
        return titleNode;
    }

    private createItem(data) {
        let node = cc.instantiate(this.itemPrefab);
        node.getComponentInChildren(cc.Label).string = data.name;
        node.x = 0;
        node.on('click', function (button) {
            let startSceneMode = (data.name == 'TempMode') ? StartSceneMode.TEMPORARY : StartSceneMode.STANDARD;
            CCMSceneManager.getInstance().startScene(data.name, { data: { 'key': 'FromeTestSceneData' }, startMode: startSceneMode });
        });
        return node;
    }
}
