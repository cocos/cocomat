const CAMERA_NODE_NAME_PREFIX = 'capture_';

export class CCMCapture {

    private static instance: CCMCapture;

    public static get Instance() {
        if (!this.instance) {
            this.instance = new CCMCapture();
        }
        return this.instance;
    }

    private constructor() { }

    captureNodeToRenderTexture(target: cc.Node) {
        if (!cc.isValid(target)) {
            cc.error('capture fail, target node is invalid');
            return null;
        }
        let cameraNodeName = `${CAMERA_NODE_NAME_PREFIX}${target.name}`;
        let cameraNode = target.getChildByName(cameraNodeName);
        let camera = null;
        if (!cameraNode) {
            cameraNode = new cc.Node(cameraNodeName);
            cameraNode.parent = target;
            camera = cameraNode.addComponent(cc.Camera);
            camera.cullingMask = 0xffffffff;
            camera.backgroundColor = cc.color(0, 0, 0, 0);
            camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL;
        } else {
            camera = cameraNode.getComponent(cc.Camera);
        }
        //cocos2.2.2 升级，截图缩小,需要调节zoomRatio
        camera.zoomRatio = Math.max(cc.winSize.width / target.width, cc.winSize.height / target.height);
        let renderTexture = new cc.RenderTexture();
        renderTexture.initWithSize(target.width, target.height, cc['gfx'].RB_FMT_S8);
        camera.targetTexture = renderTexture;
        camera.render(target);
        cameraNode.destroy();
        return renderTexture;
    }

    captureNodeToSpriteFrame(target: cc.Node, ignoreOpacity = false, flipY = true) {
        let renderTexture = this.captureNodeToRenderTexture(target);
        if (!renderTexture) {
            return null;
        }
        let picData: any = this.getPixelsData(renderTexture, ignoreOpacity, flipY);
        let texture = new cc.Texture2D();
        texture.initWithData(picData, 32, renderTexture.width, renderTexture.height);
        return new cc.SpriteFrame(texture);
    }

    captureNodeToPNGImage(target: cc.Node, callBack: Function, options?: { ignoreOpacity?: boolean, flipY?: boolean }) {
        if (!cc.sys.isNative) return;
        let ignoreOpacity = (options && options.ignoreOpacity !== undefined) ? options.ignoreOpacity : false;
        let flipY = (options && options.flipY !== undefined) ? options.flipY : true;
        let renderTexture = this.captureNodeToRenderTexture(target);
        if (!renderTexture) {
            return;
        }
        let picData = this.getPixelsData(renderTexture, ignoreOpacity, flipY);
        cc.log(`target width: ${target.width}; target height: ${target.height}; renderTexture width: ${renderTexture.width}; renderTexture.height: ${renderTexture.height}`);
        let dirpath = jsb.fileUtils.getWritablePath() + 'shareContent/';
        if (!jsb.fileUtils.isDirectoryExist(dirpath)) {
            jsb.fileUtils.createDirectory(dirpath);
        }
        let name = (new Date()).getTime() + '.png';
        let filePath = dirpath + name;
        jsb['saveImageData'](picData, target.width, target.height, filePath);
        cc.log('save share content succeed.');
        !!callBack && callBack(filePath);
    }

    private getPixelsData(renderTexture: cc.RenderTexture, ignoreOpacity = false, flipY = true) {
        let picData = renderTexture.readPixels();
        if (flipY) {
            picData = this.flipYImage(picData, renderTexture.width, renderTexture.height);
        }
        if (ignoreOpacity) {
            for (let i = 0; i < renderTexture.width; i++) {
                for (let j = 0; j < renderTexture.height; j++) {
                    let w = i * renderTexture.height * 4 + j * 4 + 3;
                    if (picData[w] > 0) {
                        picData[w] = 255;
                    }
                }
            }
        }
        return picData;
    }

    // This is a temporary solution
    private flipYImage(data: Uint8Array, width: number, height: number) {
        // create the data array
        let picData = new Uint8Array(width * height * 4);
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let start = srow * width * 4;
            let reStart = row * width * 4;
            // save the piexls data
            for (let i = 0; i < rowBytes; i++) {
                picData[reStart + i] = data[start + i];
            }
        }
        return picData as any;
    }

};
