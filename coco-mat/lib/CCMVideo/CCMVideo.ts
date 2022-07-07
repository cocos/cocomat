import { CCMVideoAssembler } from './CCMVideoAssembler';

export enum EventType {
    PREPARING = 1,
    LOADED = 2,
    READY = 3,
    COMPLETED = 4,
    ERROR = 5,
    PLAYING = 6,
    PAUSED = 7,
    STOPPED = 8,
    BUFFER_START = 9,
    BUFFER_UPDATE = 10,
    BUFFER_END = 11
};

enum VideoState {
    ERROR = -1,
    IDLE = 0,
    PREPARING = 1,
    PREPARED = 2,
    PLAYING = 3,
    PAUSED = 4,
    COMPLETED = 5
};

enum ReadyState {
    HAVE_NOTHING = 0,
    HAVE_METADATA = 1,
    HAVE_CURRENT_DATA = 2,
    HAVE_FUTURE_DATA = 3,
    HAVE_ENOUGH_DATA = 4
};

enum PixelFormat {
    NONE = -1,
    I420 = 0,
    RGB = 2,
    NV12 = 23,
    NV21 = 24,
    RGBA = 26
};

const { ccclass, property } = cc._decorator;

const gfx: any = (cc as any).gfx;

@ccclass
export class CCMVideo extends cc.RenderComponent {

    private source: cc.Asset | string = null;
    private seekTime: number = 0;
    private nativeDuration: number = 0;
    private nativeWidth: number = 0;
    private nativeHeight: number = 0;
    private currentState = VideoState.IDLE;
    private targetState = VideoState.IDLE;
    private pixelFormat = PixelFormat.RGBA;
    private impl: any = null;
    private textures: any[] = [];
    private loaded: boolean = false;
    private isBuffering: boolean = false;
    private inBackground: boolean = false;
    private lastPlayState: boolean = false;

    // hide materials property of base class
    @property({
        type: [cc.Material],
        visible: false,
        override: true,
    })
    get materials() {
        return this['_materials'];
    }

    set materials(val) {
        this['_materials'] = val;
        // @ts-ignore
        this._activateMaterial();
    }

    // video resource
    get clip() {
        return this.source;
    }

    set clip(value: cc.Asset | string) {
        this.source = value;
        this.updateVideoSource();
    }

    // rgb material
    @property(cc.Material)
    protected rgb: cc.Material = null;

    // rgb material
    @property(cc.Material)
    protected rgba: cc.Material = null;

    // i420 material
    @property(cc.Material)
    protected i420: cc.Material = null;

    // nv12 material
    @property(cc.Material)
    protected nv12: cc.Material = null;

    // nv21 material
    @property(cc.Material)
    protected nv21: cc.Material = null;

    // current position of the video which is playing
    get currentTime() {
        if (!this.impl) return 0;
        if (this.isInPlaybackState()) {
            if (CC_JSB) {
                return this.impl.currentTime();
            } else {
                return this.impl.currentTime;
            }
        } else {
            return this.seekTime;
        }
    }

    // seek to position
    set currentTime(value: number) {
        if (!this.impl) return;
        if (this.isInPlaybackState()) {
            if (CC_JSB) {
                this.impl.seek(value);
            } else {
                this.impl.currentTime = value;
            }
        } else {
            this.seekTime = value;
        }
    }

    // duration of the video
    get duration(): number {
        if (!this.impl) return 0;
        if (this.nativeDuration > 0) return this.nativeDuration;
        if (CC_JSB) {
            this.nativeDuration = this.impl.duration();
        } else {
            let duration = this.impl.duration;
            this.nativeDuration = isNaN(duration) ? 0 : duration;
        }
        return this.nativeDuration;
    }

    get width(): number {
        if (!this.isInPlaybackState()) return 0;
        if (this.nativeWidth > 0) return this.nativeWidth;
        if (CC_JSB) {
            this.nativeWidth = this.impl.width();
        } else {
            let width = this.impl.videoWidth;
            this.nativeWidth = isNaN(width) ? 0 : width;
        }
        return this.nativeWidth;
    }

    get height(): number {
        if (!this.isInPlaybackState()) return 0;
        if (this.nativeHeight > 0) return this.nativeHeight;
        if (CC_JSB) {
            this.nativeHeight = this.impl.height();
        } else {
            let height = this.impl.videoHeight;
            this.nativeHeight = isNaN(height) ? 0 : height;
        }
        return this.nativeHeight;
    }

    // loop property
    @property
    private loop: boolean = false;

    // not accurate because native event is async, larger than actual percentage.
    get bufferPercentage(): number {
        if (!this.impl) return 0;
        if (CC_JSB) {
            return this.impl.bufferPercentage();
        } else {
            return 0;
        }
    }

    // video event handler for editor
    @property([cc.Component.EventHandler])
    public videoPlayerEvent: cc.Component.EventHandler[] = [];

    private constructor() {
        super();
        this.initialize();
    }

    /**
     * override private method __preload
     */
    private __preload(): void {
        this.initializeMaterials();
        // @ts-ignore
        super.__preload();
    }

    // must be called before super.__preload()
    private initializeMaterials(): void {
        this['_materials'] = [this.rgba];
    }

    /**
     * override private method _updateMaterial for set material properties
     */
    protected _updateMaterial(): void {
        let material = this.getMaterial(0);
        if (material) {
            material.setProperty('texture0', { getImpl: () => this.textures[0] });
            switch (this.pixelFormat) {
                case PixelFormat.I420:
                    material.setProperty('texture2', { getImpl: () => this.textures[2] });
                // fall through
                case PixelFormat.NV12:
                case PixelFormat.NV21:
                    material.setProperty('texture1', { getImpl: () => this.textures[1] });
                    break;
            }
        }
        // @ts-ignore
        this.markForRender(true);
    }

    /**
     * update pixel format for android, ios, web platform, support yuv render
     */
    private updatePixelFormat(): void {
        let pixelFormat = CC_JSB ? this.impl.pixelFormat() : PixelFormat.RGB;
        if (this.pixelFormat == pixelFormat) return;
        this.pixelFormat = pixelFormat;
        switch (pixelFormat) {
            case PixelFormat.RGB:
                this.materials = [this.rgb];
                break;
            case PixelFormat.RGBA:
                this.materials = [this.rgba];
                break;
            case PixelFormat.I420:
                this.materials = [this.i420];
                break;
            case PixelFormat.NV12:
                this.materials = [this.nv12];
                break;
            case PixelFormat.NV21:
                this.materials = [this.nv21];
                break;
        }
    }

    /**
     * override private method _resetAssembler for customize video assembler
     */
    private _resetAssembler(): void {
        // @ts-ignore
        this.setVertsDirty();
        this['_assembler'] = new CCMVideoAssembler();
        this['_assembler'].init(this);
    }

    /**
     * initialize native video player, register video event handler
     */
    private initializeNative(): void {
        this.impl = new gfx.Video();
        this.textures = this.impl.getTextures();
        this.impl.addEventListener('loaded', () => this.onMetaLoaded());
        this.impl.addEventListener('ready', () => this.onReadyToPlay());
        this.impl.addEventListener('completed', () => this.onCompleted());
        this.impl.addEventListener('error', () => this.onError());
        this.impl.addEventListener('buffer_start', () => this.onBufferStart());
        this.impl.addEventListener('buffer_update', () => this.onBufferUpdate());
        this.impl.addEventListener('buffer_end', () => this.onBufferEnd());
    }

    /**
     * initialize browser player, register video event handler
     */
    private initializeBrowser(): void {
        this.impl = document.createElement('video');
        this.impl.crossOrigin = 'anonymous';
        this.impl.autoplay = false;
        this.impl.loop = false;
        this.impl.muted = false;
        this.textures = [
            // @ts-ignore
            new cc.renderer.Texture2D(cc.renderer.device, {
                wrapS: gfx.WRAP_CLAMP,
                wrapT: gfx.WRAP_CLAMP,
                genMipmaps: false,
                premultiplyAlpha: false,
                flipY: false,
                format: gfx.TEXTURE_FMT_RGBA8
            })
        ];
        this.impl.addEventListener('loadedmetadata', () => this.onMetaLoaded());
        this.impl.addEventListener('ended', () => this.onCompleted());
        this.loaded = false;
        let onCanPlay = () => {
            if (this.loaded || this.currentState == VideoState.PLAYING)
                return;
            if (this.impl.readyState === ReadyState.HAVE_ENOUGH_DATA ||
                this.impl.readyState === ReadyState.HAVE_METADATA) {
                this.impl.currentTime = 0;
                this.loaded = true;
                this.onReadyToPlay();
            }
        };
        this.impl.addEventListener('canplay', onCanPlay);
        this.impl.addEventListener('canplaythrough', onCanPlay);
        this.impl.addEventListener('suspend', onCanPlay);

        // @ts-ignore
        let gl = cc.renderer.device._gl;
        this.update = dt => {
            if (this.isInPlaybackState()) {
                gl.bindTexture(gl.TEXTURE_2D, this.textures[0]._glID);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.impl);
                // @ts-ignore
                cc.renderer.device._restoreTexture(0);
            }
        };
    }

    /**
     * initialize video player
     */
    private initialize(): void {
        if (CC_JSB) {
            this.initializeNative();
        } else {
            this.initializeBrowser();
        }
    }

    public onLoad(): void {
        if (this.impl) {
            this.updateVideoSource();
        }
    }

    /**
     * register game show and hide event handler
     */
    public onEnable(): void {
        super.onEnable();
        cc.game.on(cc.game.EVENT_SHOW, this.onShow, this);
        cc.game.on(cc.game.EVENT_HIDE, this.onHide, this);
    }

    // unregister game show and hide event handler
    public onDisable(): void {
        super.onDisable();
        cc.game.off(cc.game.EVENT_SHOW, this.onShow, this);
        cc.game.off(cc.game.EVENT_HIDE, this.onHide, this);
        this.stop();
    }

    private onShow(): void {
        if (!this.inBackground) return;
        this.inBackground = false;
        if (this.lastPlayState) this.resume();
    }

    private onHide(): void {
        if (this.inBackground) return;
        this.inBackground = true;
        this.lastPlayState = this.isPlaying();
        if (this.lastPlayState) this.pause();
    }

    public _onPreDestroy(): void {
        if (this.impl) {
            if (CC_JSB) this.impl.destroy();
            this.impl = undefined;
        }
        // @ts-ignore
        super._onPreDestroy();
    }

    /**
     * update video data source
     */
    private updateVideoSource(): void {
        this.seekTime = 0;
        this.nativeDuration = 0;
        this.nativeWidth = 0;
        this.nativeHeight = 0;
        this.currentState = VideoState.PREPARING;
        this.targetState = VideoState.PREPARING;

        let url = '';
        if (this.source) {
            if (typeof this.source == 'string') {
                url = this.source;
            } else {
                url = this.source.nativeUrl;
            }
        }
        if (url && cc.loader.md5Pipe) {
            url = cc.loader.md5Pipe.transformURL(url);
        }
        if (CC_JSB) {
            this.impl.stop();
            this.impl.setURL(url);
            this.impl.prepare();
        } else {
            this.loaded = false;
            this.impl.pause();
            this.impl.src = url;
        }
        this.node.emit('preparing', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PREPARING);
    }

    private onReadyToPlay(): void {
        this.updatePixelFormat();
        this.currentState = VideoState.PREPARED;
        if (this.seekTime > 0.1) {
            this.currentTime = this.seekTime;
        }
        this.node.emit('ready', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.READY);
        this.targetState == VideoState.PLAYING && this.play();
    }

    private onMetaLoaded(): void {
        this.node.emit('loaded', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.LOADED);
    }

    private onBufferStart(): void {
        this.isBuffering = true;
        this.node.emit('buffer_start', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_START);
    }

    private onBufferUpdate(): void {
        this.node.emit('buffer_update', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_UPDATE);
    }

    private onBufferEnd(): void {
        this.isBuffering = false;
        this.node.emit('buffer_end', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_END);
    }

    private onCompleted(): void {
        if (this.loop) {
            if (this.currentState == VideoState.PLAYING) {
                this.currentTime = 0;
                this.impl.play();
            }
        } else {
            this.currentState = VideoState.COMPLETED;
            this.targetState = VideoState.COMPLETED;
            this.node.emit('completed', this);
            cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.COMPLETED);
        }
    }

    private onError() {
        this.currentState = VideoState.ERROR;
        this.targetState = VideoState.ERROR;
        this.node.emit('error', this);
        cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.ERROR);
    }

    public play() {
        if (this.isInPlaybackState()) {
            if (this.currentState == VideoState.COMPLETED) {
                this.currentTime = 0;
            }
            if (this.currentState != VideoState.PLAYING) {
                this.impl.play();
                this.node.emit('playing', this);
                this.currentState = VideoState.PLAYING;
                this.targetState = VideoState.PLAYING;
                cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PLAYING);
            }
        } else {
            this.targetState = VideoState.PLAYING;
        }
    }

    public resume() {
        if (this.isInPlaybackState() && this.currentState != VideoState.PLAYING) {
            if (CC_JSB) {
                this.impl.resume();
            } else {
                this.impl.play();
            }
            this.node.emit('playing', this);
            this.currentState = VideoState.PLAYING;
            this.targetState = VideoState.PLAYING;
            cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PLAYING);
        } else {
            this.targetState = VideoState.PLAYING;
        }
    }

    public pause() {
        if (this.isInPlaybackState() && this.currentState != VideoState.PAUSED) {
            this.impl.pause();
            this.node.emit('paused', this);
            this.currentState = VideoState.PAUSED;
            this.targetState = VideoState.PAUSED;
            cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PAUSED);
        } else {
            this.targetState = VideoState.PAUSED;
        }
    }

    public stop() {
        this.seekTime = 0;
        if (this.isInPlaybackState() && this.currentState != VideoState.IDLE) {
            if (CC_JSB) {
                this.impl.stop();
            } else {
                this.impl.pause();
                this.impl.currentTime = 0;
            }
            this.node.emit('stopped', this);
            this.currentState = VideoState.IDLE;
            this.targetState = VideoState.IDLE;
            cc.Component.EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.STOPPED);
        } else {
            this.targetState = VideoState.IDLE;
        }
    }

    public clear() {

    }

    public isPlaying() {
        return this.currentState == VideoState.PLAYING || this.targetState == VideoState.PLAYING;
    }

    private isInPlaybackState() {
        return !!this.impl && this.currentState != VideoState.IDLE && this.currentState != VideoState.PREPARING && this.currentState != VideoState.ERROR;
    }

}