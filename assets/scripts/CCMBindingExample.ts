import CCMBackBtn from '../../coco-mat/lib/CCMBackBtn/CCMBackBtn';
import CCMBinding from '../../coco-mat/lib/CCMBinding/CCMBinding';
import { CCMSceneManager } from '../../coco-mat/lib/CCMSceneManager/CCMSceneManager';
import CCMRouter from '../../coco-mat/lib/CCMBinding/CCMRouter';

const {ccclass, property} = cc._decorator;

@ccclass
export default class CCMBindingExample extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';
    id = 0;

    protected onLoad() {
        CCMRouter.registerMethod('forNative', (args: any) => {
            cc.log(`received:${JSON.stringify(args)}`);
            return {text: this.label.string};
        });
    }

    protected start() {
        if (cc.sys.isNative) {
            this.label.string = this.text;
        } else {
            this.label.string = '本demo需要打包到Native体验';
        }
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
    }

    protected onDestroy() {
        CCMRouter.unRegisterMethod('forNative');
    }

    protected download() {
        CCMBinding.withOptions({
            timeout: 120,
            onProgress: (progress) => {
                cc.log(`${JSON.stringify(progress)}`);
                this.label.string = `progress:${progress.current}`;
            }
        }).callNativeMethod('downloadFile', {url: 'https://www.cocos.com/wp-content/themes/cocos/image/logo.png'}).then((result) => {
            this.label.string = `下载成功:path=${JSON.stringify(result.path)}`;
        }).catch((errorMsg) => {
            if (errorMsg) {
                this.label.string = JSON.stringify(errorMsg);
            }
        });
    }

    queryNameById() {
        CCMBinding.callNativeMethod('getNameById', {id: this.id++}).then((result) => {
            this.label.string = 'name=' + result.name + '\n';
        }).catch((errorMsg) => {
            if (errorMsg) {
                this.label.string = 'error=' + JSON.stringify(errorMsg);
            }
        });
    }

    queryHardwareInfo() {
        CCMBinding.callNativeMethod('getHardWareInfo').then((hardwareInfo) => {
            this.label.string = JSON.stringify(hardwareInfo);
        }).catch((errorMsg) => {
            if (errorMsg) {
                this.label.string = 'error=' + JSON.stringify(errorMsg);
            }
        });
    }

    callByNative() {
        CCMBinding.callNativeMethod('callByNative').then((hardwareInfo) => {
            this.label.string = JSON.stringify(hardwareInfo);
        }).catch((errorMsg) => {
            if (errorMsg) {
                this.label.string = `error=${JSON.stringify(errorMsg)}`;
            }
        });
    }

}
