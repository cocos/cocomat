/**
 * SceneManager 主要是受 Android Activity 启动模式启发，将其启动模式复刻到了 CocosCreator。
 * SceneManager 将原来无序的场景启动返回，放到栈中进行管理，让返回场景、特殊的启动场景变得简单。并提供了场景间传递数据的功能，否则开发者需要通过全局变量或者挂载永久节点的方式来实现。
 * SceneManager 工作方式如下：
 * 1. 调用 startScene 启动一个场景，该场景会被压栈记录下来。你可以 startScene 的 data 参数中放入传递给下一个场景的数据；
 * 2. 调用 backScene 返回上一个场景，当前场景会出栈。传递数据同上；
 * 3. 默认启动模式为标准模式，是指简单的启动时压栈、返回时出栈。返回上一个场景时，只需调用 backScene 方法，无需记录上一个场景是什么；
 * 4. 清栈模式：即清空当前栈中所有场景，将指定场景入栈。通常用在启动 home 界面的情况下；
 * 5. 临时场景：当启动场景时 A——>B——>C，返回希望 C——>A 时，对 B 使用临时场景模式即可；
 * 6. 栈顶模式：当压栈时，如果栈中已有此场景，则先将其出栈，此模式应用场景较少。
 */

type SceneData = { [key: string]: any };
interface CCMScene {
    sceneName: string;
    isTempScene: boolean;
}

interface BackSceneOption {
    data?: SceneData;
    onSceneLaunched?: Function;
}

interface StartSceneOption extends BackSceneOption {
    startMode?: StartSceneMode;
}

export enum StartSceneMode {
    STANDARD, // 标准模式：直接压栈
    SINGLE_TOP, // 栈顶模式：如果存在，则清空在其之上的scene，然后压栈；否则直接压栈
    CLEAR_STACK, // 清空栈，再压栈
    TEMPORARY, // 临时场景：返回时会跳过这个场景
}

export class CCMSceneManager {

    private static instance: CCMSceneManager;
    private static TAG = 'CCMSceneManager';

    public static getInstance(): CCMSceneManager {
        if (!CCMSceneManager.instance) {
            CCMSceneManager.instance = new CCMSceneManager();
        }

        return CCMSceneManager.instance;
    }

    private sceneStack: CCMScene[] = [];
    private data: SceneData;
    private curSceneName: string;
    private isLoadingScene = false;
    private countDownTimer: number;
    private loadSceneTimeout = 10 * 1000;

    private constructor() { }

    /**
     * SceneManager 初始化
     * 因为游戏默认启动一个场景，所以第一个场景并不是由 SceneManager 启动，所以通过此方法设定默认启动的场景
     * @param initSceneName 第一个场景的场景名
     */
    public init(initSceneName: string) {
        if (this.sceneStack.length == 0 && initSceneName) {
            this.sceneStack.push({ sceneName: initSceneName, isTempScene: false });
        }
    }

    /**
     * 获取当前的场景栈
     */
    public getSceneStack(): CCMScene[] {
        return this.sceneStack.slice();
    }

    /**
     * 获取上一个场景传递过来的数据
     */
    public getSceneData(): SceneData {
        return this.data;
    }

    /**
     * @description 启动一个场景
     * @param sceneName 要启动的场景名称
     * @param data 要传递的数据
     * @param startMode 启动模式
     * @param onSceneLaunched 场景启动完成后的回调
     */
    public startScene(sceneName: string, options?: StartSceneOption) {
        if (this.isLoadingScene) {
            cc.log(CCMSceneManager.TAG, 'It is loading scene now, skip this invoke.');
            return;
        }

        try {
            if (!sceneName) {
                this.isLoadingScene = false;
                return;
            }

            if (!options) {
                options = {}
            }
            let nameArray = sceneName.split('/');
            sceneName = nameArray[nameArray.length - 1];
            this.isLoadingScene = true;
            this.data = options.data;
            this.doStartScene(sceneName, options.startMode, options.onSceneLaunched);
        } catch (err) {
            this.isLoadingScene = false;
            cc.log(CCMSceneManager.TAG, 'startScene err=' + err);
        }
    }

    /**
     * @description 回到上一个场景
     * @param data 需要传递给上一个场景的数据
     * @param onSceneLaunched 场景启动完成后的回调
     */
    public backScene(options?: BackSceneOption): boolean {
        if (this.isLoadingScene) {
            cc.log(CCMSceneManager.TAG, 'It is loading back scene now, skip this invoke.');
            return;
        }
        try {
            if (this.sceneStack.length <= 1) {
                cc.log(CCMSceneManager.TAG, 'This is last scene.');
                this.isLoadingScene = false;
                return false;
            }

            if (!options) {
                options = {}
            }

            let sceneInfo = this.getBackSceneInfo();
            if (!sceneInfo.sceneName) {
                cc.log(CCMSceneManager.TAG, 'backScene failed: sceneName is null');
                return;
            }
            this.isLoadingScene = true;
            this.data = options.data;
            this.doGoBackScene(sceneInfo.sceneName, options.onSceneLaunched);

        } catch (err) {
            cc.log(CCMSceneManager.TAG, 'backscene err=' + err);
            this.isLoadingScene = false;
        }
        return true;
    }

    /**
     * @description 获取返回的场景信息
     */
    private getBackSceneInfo(): CCMScene {
        let sceneInfo: CCMScene;
        for (let i = this.sceneStack.length - 2; i >= 0; i--) {
            sceneInfo = this.sceneStack[i];
            if (!sceneInfo.isTempScene) {
                break;
            }
        }
        return sceneInfo;
    }

    /**
     * @description 开始启动场景，并处理场景栈
     * @param sceneName 场景名
     * @param startMode 启动模式
     * @param onSceneLaunched 场景启动完成后的回调
     */
    private doStartScene(sceneName: string, startMode?: StartSceneMode, onSceneLaunched?: Function) {
        this.countDownLoadScene();
        let isLoadSuccess = cc.director.loadScene(sceneName, (...args) => {
            this.handleStackByMode(sceneName, startMode);
            this.curSceneName = sceneName;
            this.isLoadingScene = false;
            cc.log(CCMSceneManager.TAG, 'loadScene Finish');
            this.cancelCountDownTimer();
            if (onSceneLaunched) {
                onSceneLaunched(...args);
            }
        });
        cc.log(CCMSceneManager.TAG, sceneName + ' isLoadSuccess: ' + isLoadSuccess);
        if (!isLoadSuccess) {
            this.isLoadingScene = false;
        }
    }

    /**
     * @description 开始返回场景
     * @param {String} sceneName 要返回的名字
     * @param onSceneLaunched 返回场景成功后的回调
     */
    private doGoBackScene(sceneName: string, onSceneLaunched?: Function) {
        this.countDownLoadScene();
        let isLoadSuccess = cc.director.loadScene(sceneName, (...args) => {
            this.isLoadingScene = false;
            this.cancelCountDownTimer();
            cc.log(CCMSceneManager.TAG, 'backScene Finish');
            this.curSceneName = sceneName;
            this.handleBackSceneStack();
            if (onSceneLaunched) {
                onSceneLaunched(...args);
            }
        });
        cc.log(CCMSceneManager.TAG, 'backScene isSuccess ' + sceneName + ' ' + isLoadSuccess);
        if (!isLoadSuccess) {
            this.isLoadingScene = false;
        }
    }

    /**
     * @description 处理返回场景时的栈
     */
    private handleBackSceneStack() {
        this.sceneStack.pop();

        let sceneInfo = this.sceneStack[this.sceneStack.length - 1];
        while (sceneInfo.isTempScene) {
            this.sceneStack.pop();
            sceneInfo = this.sceneStack[this.sceneStack.length - 1];
        }
    }
    /**
     * @description 处理不同启动模式时的入栈情况
     * @param sceneName 要入栈的scene名称
     * @param startMode 启动模式
     */
    private handleStackByMode(sceneName: string, startMode?: StartSceneMode) {
        if (!startMode) {
            startMode = StartSceneMode.STANDARD;
        }
        let isTemp = false;
        switch (startMode) {
            case StartSceneMode.STANDARD:
                break;
            case StartSceneMode.SINGLE_TOP:
                let index = -1;
                for (let i = 0; i < this.sceneStack.length; i++) {
                    if (sceneName == this.sceneStack[i].sceneName) {
                        index = i;
                        break;
                    }
                }
                if (index != -1) {
                    this.sceneStack.splice(index, this.sceneStack.length - index);
                }
                break;
            case StartSceneMode.CLEAR_STACK:
                this.sceneStack = [];
                break;
            case StartSceneMode.TEMPORARY:
                isTemp = true;
                break;
            default:

        }
        this.sceneStack.push({ sceneName: sceneName, isTempScene: isTemp });
    }

    /**
     * @description 加载场景的计时器，防止加载一个场景卡死无回调时，SceneManager 无法启动其他场景的问题
     */
    private countDownLoadScene() {
        cc.log(CCMSceneManager.TAG, 'begin count down loadScene.');
        this.cancelCountDownTimer();
        this.countDownTimer = setTimeout(() => {
            this.isLoadingScene = false;
            cc.log(CCMSceneManager.TAG, 'loadScene timeout');
            this.cancelCountDownTimer();
        }, this.loadSceneTimeout);
    }

    private cancelCountDownTimer() {
        if (this.countDownTimer) {
            clearTimeout(this.countDownTimer);
            this.countDownTimer = null;
        }
    }
}