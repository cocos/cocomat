import CCMBackBtn from "../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMAudioManager } from "../../coco-mat/lib/CCMAudioManager/CCMAudioManager";
import { CCMSceneManager } from "../../coco-mat/lib/CCMSceneManager/CCMSceneManager";

const { ccclass } = cc._decorator;
const TAG = 'CCMAudioManagerExample';
@ccclass
export class CCMAudioManagerExample extends cc.Component {

    start() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    playRemoteMusic() {
        const url = 'https://raw.githubusercontent.com/CreateJS/SoundJS/master/examples/Game/sounds/music.mp3';
        CCMAudioManager.Instance.playMusic(url, {
            onComplete: () => { // 播放完成
                cc.log(TAG, 'remote music on complete');
            },
            onStop: () => { // 手动停止
                cc.log(TAG, 'remote music on stop');
            },
            onError: (err: Error) => { // 播放错误
                cc.error(TAG, err);
            },
            onEnd: () => { // 正常播放完成,播放错误或手动停止都会调用
                cc.log(TAG, 'remote music on end');
            }
        })
    }

    stopRemoteMusic() {
        CCMAudioManager.Instance.stopAllMusic();
    }

    playLocalEffect() {
        const res = 'audios/sfxBoing.mp3';
        CCMAudioManager.Instance.playEffect(res);
    }

    playBGM() {
        const res = 'audios/bgmDance.mp3';
        CCMAudioManager.Instance.playBGM(res);
    }

    pauseBGM() {
        CCMAudioManager.Instance.pauseBGM();
    }

    resumeBGM() {
        CCMAudioManager.Instance.resumeBGM();
    }

    stopBGM() {
        CCMAudioManager.Instance.stopBGM();
    }

    stopAll() {
        CCMAudioManager.Instance.stopAll();
    }
}
