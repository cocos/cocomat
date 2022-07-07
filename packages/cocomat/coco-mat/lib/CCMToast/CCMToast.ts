const { ccclass, property } = cc._decorator;

interface ShowOption {
    duration?: number;
    icon?: string;
}
@ccclass
export default class CCMToast extends cc.Component {

    private static TAG = 'CCMToast';
    private static toastNode = null;
    private static isInstantiating = false; // 是否正在实例化prefab

    /**
     * @description 展示 toast
     * @param text toast 中的文本内容
     * @param options 其他展示选项，包含以下内容：
     * duration：toast 停留时间
     * icon：toast 图标
     */
    public static show(text, options?: ShowOption) {
        console.log(CCMToast.TAG, 'CCMToast show()');

        if (!CCMToast.toastNode && !cc.isValid(CCMToast.toastNode) && !CCMToast.isInstantiating) {
            CCMToast.isInstantiating = true;
            cc.resources.load('cocomat/CCMToast/CCMToast', function (err, prefab) {
                CCMToast.isInstantiating = false;
                CCMToast.toastNode = cc.instantiate(prefab);

                let scene = cc.director.getScene();
                scene.addChild(CCMToast.toastNode);

                let toast = CCMToast.toastNode.getComponent('CCMToast');
                if (!toast) {
                    console.log(CCMToast.TAG, 'CRITICAL: toast script is not attached!');
                    return;
                }
                if (!options) {
                    options = {};
                }
                if (options.duration) {
                    toast.leftTime = options.duration;
                }
                toast.setContent({
                    text: text,
                    icon: options.icon
                });
                toast.display();

            });
        } else if (cc.isValid(CCMToast.toastNode)) {
            let toast = CCMToast.toastNode.getComponent('CCMToast');
            if (toast.dismissing) {
                // 已有Toast正在关闭，则先干掉原来的Toast，重新展示一个新的
                CCMToast.toastNode.stopAllActions();
                if (cc.isValid(CCMToast.toastNode)) CCMToast.toastNode.destroy();
                CCMToast.toastNode = null;
                this.show(text, options);
                return;
            }
            if (options.duration) {
                toast.leftTime = options.duration;
            }
            toast.setContent({
                text: text,
                icon: options.icon
            });
            toast.scheduleDismiss();
        }
    }

    @property(cc.Label)
    private content: cc.Label = null;
    @property(cc.Node)
    private iconNode: cc.Node = null;

    private dismissing = false;
    private leftTime = 2;
    private lastIcon = undefined;

    private setContent(args) {
        if (!cc.isValid(this.node)) {
            return;
        }
        if (args) {
            if (args.text) {
                this.content.string = args.text;
            }
            if (args.icon && args.icon != this.lastIcon) {
                this.iconNode.active = true;
                cc.resources.load(args.icon, (err, img) => {
                    if (img) {
                        this.iconNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(img);
                    }
                });
                this.lastIcon = args.icon;
            } else {
                this.iconNode.active = false;
            }
        }
    }

    /**
     * @description 展示CCMToast
     */
    private display() {
        console.log(CCMToast.TAG, 'display()');
        let anim = cc.moveBy(0.5, cc.v2(0, -180));
        this.node.y = cc.view.getVisibleSize().height + this.node.height;
        this.node.runAction(cc.sequence(anim, cc.callFunc(() => {
            this.scheduleDismiss();
        })));
    }

    /**
     * @description 结束CCMToast
     */
    private dismiss() {
        if (this.dismissing) return;
        console.log(CCMToast.TAG, 'dismiss()');
        this.dismissing = true;
        let anim = cc.moveBy(0.5, cc.v2(0, 170));
        this.node.runAction(cc.sequence(anim, cc.callFunc(() => {
            if (!cc.isValid(this.node)) {
                return;
            }
            this.dismissing = false;
            this.node.destroy();
            CCMToast.toastNode = null;
        })));
    }

    private scheduleDismiss() {
        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) {
                this.dismiss();
            }
        }, this.leftTime);
    }
}