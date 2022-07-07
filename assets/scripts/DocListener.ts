import { CCMSceneManager, StartSceneMode } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

interface DocMsg {
    type: string;
    title: string;
    relativePath: string;
}

export class DocListener {

    private sceneList;

    constructor(sceneList) {
        this.sceneList = sceneList;
        window.addEventListener('message', ({ data }) => {
            console.log("eventListener", data);
            this.startScene(data);
        });
    }

    startScene(data: DocMsg) {
        if (!data || !data.relativePath) {
            return;
        }
        let scene = this.getSceneName(data.relativePath);
        cc.log("DocListener", "getSceneName " + scene);
        if (!scene) {
            return;
        }
        CCMSceneManager.getInstance().startScene(scene, {
            startMode: StartSceneMode.TEMPORARY
        });
    }

    getSceneName(relativePath: string) {
        let articleName = relativePath.split('/')[1].split('.')[0];
        for (const index in this.sceneList) {
            if (!Object.prototype.hasOwnProperty.call(this.sceneList, index)) {
                continue;
            }
            const element = this.sceneList[index];
            if (element.name == articleName && parseInt(index) < this.sceneList.length - 1) {
                return this.sceneList[parseInt(index) + 1].name;
            }
        }
        return null;
    }
}