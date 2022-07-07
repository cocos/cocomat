import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import { CCMVideo, EventType } from "../../../coco-mat/lib/CCMVideo/CCMVideo";

const { ccclass, property } = cc._decorator;

@ccclass
export class CCMVideoExample extends cc.Component {

    @property(cc.Node)
    private container: cc.Node = null;

    @property({ type: CCMVideo })
    private video: CCMVideo = null;

    @property(cc.Sprite)
    private playState: cc.Sprite = null;

    @property(cc.SpriteFrame)
    private statePlaying: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    private statePaused: cc.SpriteFrame = null;

    @property(cc.Label)
    private current: cc.Label = null;

    @property(cc.Label)
    private duration: cc.Label = null;

    @property(cc.Slider)
    private slider: cc.Slider = null;

    private videoIndex: number = 0;
    private videoUrls: string[] = [];

    protected onLoad() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });
        if(cc.winSize.width > cc.winSize.height){
            this.container.scale = cc.winSize.height / this.container.height * 0.8;
        }else{
            this.container.scale = cc.winSize.width / this.container.width * 0.9;
        }
        this.videoIndex = 0;
        this.videoUrls = [
            cc.url.raw('resources/videos/big_buck_bunny.mp4'),
            'https://media.w3.org/2010/05/sintel/trailer.mp4',
        ];
    }

    protected start() {
        this.video.clip = this.videoUrls[this.videoIndex];
        this.video.play();
    }

    private toggle() {
        if (this.video.isPlaying()) {
            this.video.pause();
        } else {
            this.video.resume();
        }
    }

    private onVideoEvent(sender, event) {
        switch (event) {
            case EventType.READY:
                console.log('CCMVideoExample', this.video.width + ', ' + this.video.height);
                this.updateDuration();
                this.updateCurrentTime(true);
                break;
            case EventType.PLAYING:
            case EventType.PAUSED:
            case EventType.STOPPED:
                this.updateState();
                break;
            case EventType.COMPLETED:
                this.next();
                break;
        }
    }

    private updateCurrentTime(force = false) {
        if (!force && !this.video.isPlaying()) return;
        let currentTime = this.video.currentTime;
        let minutes = Math.floor(currentTime / 60);
        let seconds = Math.floor(currentTime) % 60;
        let minutePrefix = minutes < 10 ? '0' : '';
        let secondPrefix = seconds < 10 ? '0' : '';
        let timestamp = `${minutePrefix}${minutes}:${secondPrefix}${seconds}`;
        // @ts-ignore
        if (!this.slider._dragging) {
            this.current.string = timestamp;
            let duration = this.video.duration;
            if (duration <= 0) duration = 1;
            let progress = Math.min(1, currentTime / duration);
            this.slider.progress = progress;
        }
    }

    private updateDuration() {
        let duration = Math.round(this.video.duration);
        let minutes = Math.floor(duration / 60);
        let seconds = duration % 60;
        let minutePrefix = minutes < 10 ? '0' : '';
        let secondPrefix = seconds < 10 ? '0' : '';
        this.duration.string = `${minutePrefix}${minutes}:${secondPrefix}${seconds}`;
    }

    private updateState() {
        let isPlaying = this.video.isPlaying();
        this.playState.spriteFrame = isPlaying ? this.statePlaying : this.statePaused;
    }

    private next() {
        this.videoIndex++;
        let length = this.videoUrls.length;
        let index = this.videoIndex % length;
        this.video.clip = this.videoUrls[index];
        this.video.play();
    }

    private previous() {
        this.videoIndex--;
        let length = this.videoUrls.length;
        if (this.videoIndex < 0) this.videoIndex += length;
        let index = this.videoIndex % length;
        this.video.clip = this.videoUrls[index];
        this.video.play();
    }

    protected update(dt: number) {
        this.updateCurrentTime();
    }

    private onSlide() {
        let progress = this.slider.progress;
        let duration = this.video.duration;
        let seekTime = duration * progress;
        // @ts-ignore
        if (this.slider._dragging) {
            let minutes = Math.floor(seekTime / 60);
            let seconds = Math.floor(seekTime) % 60;
            let minutePrefix = minutes < 10 ? '0' : '';
            let secondPrefix = seconds < 10 ? '0' : '';
            this.current.string = `${minutePrefix}${minutes}:${secondPrefix}${seconds}`;
        } else {
            this.video.currentTime = seekTime;
        }
    }
}