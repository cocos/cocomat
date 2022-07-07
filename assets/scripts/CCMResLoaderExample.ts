import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { resLoader } from "../../coco-mat/lib/CCMResManager/CCMResLoader";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMResLoaderExample extends cc.Component {
    @property(cc.Node)
    attachNode: cc.Node = null;
    @property(cc.Label)
    dumpLabel: cc.Label = null;
    assets: Set<cc.Asset> = new Set<cc.Asset>();

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    ccloadRes() {
        cc.loader.loadRes("testres/testPrefab2", cc.Prefab, (error: Error, prefab: cc.Prefab) => {
            if (!error) {
                cc.instantiate(prefab).parent = this.attachNode;
            }
        });
    }

    ccrelaseRes() {
        this.attachNode.removeAllChildren(true);
        cc.loader.releaseRes("testres/testPrefab2");
    }

    decRefs() {
        this.attachNode.removeAllChildren(true);
        this.assets.forEach(element => {
            element.decRef();
        });
        this.assets.clear();
    }

    resloaderLoad() {
        resLoader.load("testres/testPrefab2", (error: Error, prefab: cc.Prefab) => {
            if (!error) {
                this.assets.add(prefab);
                cc.instantiate(prefab).parent = this.attachNode;
            }
        });
    }

    resloaderLoadDir() {
        resLoader.loadDir("testres", cc.Prefab, (err, prefabs: cc.Prefab[]) => {
            if (err) return;
            for (let i = 0; i < prefabs.length; ++i) {
                this.assets.add(prefabs[i]);
                cc.instantiate(prefabs[i]).parent = this.attachNode;
            }
        });
    }

    resloaderLoadArray() {
        resLoader.load(["testres/testPrefab", "testres/testPrefab2"], cc.Prefab, (err, prefabs: cc.Prefab[]) => {
            if (err) return;
            for (let i = 0; i < prefabs.length; ++i) {
                this.assets.add(prefabs[i]);
                cc.instantiate(prefabs[i]).parent = this.attachNode;
            }
        });
    }

    resloaderLoadRemote() {
        resLoader.loadRemote("http://tools.itharbors.com/christmas/res/tree.png", (err, res) => {
            if (err || !res) return;
            this.assets.add(res);
            let spriteFrame = new cc.SpriteFrame(res);
            let node = new cc.Node("tmp");
            let sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            node.parent = this.attachNode;
        });
    }

    onDump() {
        this.dumpLabel.string = `${cc.assetManager.assets.count}`;
    }
}
