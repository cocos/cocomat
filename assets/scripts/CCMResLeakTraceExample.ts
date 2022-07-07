import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMResLeakChecker } from "../../coco-mat/lib/CCMResManager/CCMResLeakChecker";
import CCMResLoader, { resLoader } from "../../coco-mat/lib/CCMResManager/CCMResLoader";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMResLeakTraceExample extends cc.Component {
    @property(cc.Label)
    dumpLabel: cc.Label = null;
    asset: cc.Asset = null;

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
        let checker = new CCMResLeakChecker();
        checker.startCheck();
        resLoader.resLeakChecker = checker;
        resLoader.load("testres/testPrefab2", (error: Error, prefab: cc.Prefab) => {
            if (!error) {
                this.asset = prefab;
            }
        });
    }

    updateLabel() {
        let refCnt = this.asset == null ? 0 : this.asset.refCount;
        if (refCnt == 0) {
            this.asset = null;
        }
        this.dumpLabel.string = `${refCnt}`;
    }

    onDump() {
        resLoader.resLeakChecker.dump();
    }

    addRef1() {
        if (this.asset) {
            this.asset.addRef();
            this.updateLabel();
        }
    }

    addRef2() {
        if (this.asset) {
            this.asset.addRef();
            this.updateLabel();
        }        
    }

    decRef1() {
        if (this.asset) {
            this.asset.decRef();
            this.updateLabel();
        }
    }

    decRef2() {
        if (this.asset) {
            this.asset.decRef();
            this.updateLabel();
        }
    }
}
