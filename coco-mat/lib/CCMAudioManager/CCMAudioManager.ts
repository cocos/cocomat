interface IAudioCallbackOptions {
    onError?: Function;
    onComplete?: Function;
    onStop?: Function;
    onPause?: Function;
    onResume?: Function;
    onEnd?: Function; // onComplete || onError || onStop
};

interface IAudioPlayOptions extends IAudioCallbackOptions {
    loop?: boolean;
    volume?: number;
}

type AudioRes = string | cc.AudioClip;

export class CCMAudioManager {

    private static instance: CCMAudioManager;

    public static get Instance() {
        if (!this.instance) {
            this.instance = new CCMAudioManager();
        }
        return this.instance;
    }

    private constructor() { }

    private volume = 1;
    private bgmAudioID = -1;
    private musicPlayCallback: Map<number, IAudioCallbackOptions> = new Map();
    private effectPlayCallback: Map<number, IAudioCallbackOptions> = new Map();

    /**
     * 播放音乐，默认会停掉其他未播放完的音乐，不会影响背景音乐
     */
    public playMusic(res: AudioRes, options?: IAudioPlayOptions, stopOther = true) {
        if (stopOther) {
            this.stopAllMusic();
        }
        this.play(res, options).then(audioID => {
            this.musicPlayCallback.set(audioID, options);
            cc.audioEngine.setFinishCallback(audioID, () => {
                if (options) {
                    options.onComplete && options.onComplete();
                    options.onEnd && options.onEnd();
                }
                this.musicPlayCallback.delete(audioID);
            });
        }).catch(err => {
            cc.error(err);
            if (options) {
                options.onError && options.onError(err);
                options.onEnd && options.onEnd();
            }
        });
    }

    public pauseAllMusic() {
        this.musicPlayCallback.forEach((callbacks, audioID) => {
            cc.audioEngine.pause(audioID);
            callbacks.onPause && callbacks.onPause();
        });
    }

    public resumeAllMusic() {
        this.musicPlayCallback.forEach((callbacks, audioID) => {
            cc.audioEngine.resume(audioID);
            callbacks.onResume && callbacks.onResume();
        });
    }

    public stopAllMusic() {
        this.musicPlayCallback.forEach((callbacks, audioID) => {
            cc.audioEngine.stop(audioID);
            callbacks.onStop && callbacks.onStop();
            callbacks.onEnd && callbacks.onEnd();
            this.musicPlayCallback.delete(audioID);
        });
    }

    /**
     * 播放音效，多个音效可重叠播放
     */
    public playEffect(res: AudioRes, options?: IAudioPlayOptions) {
        this.play(res, options).then(audioID => {
            this.effectPlayCallback.set(audioID, options);
            cc.audioEngine.setFinishCallback(audioID, () => {
                if (options) {
                    options.onComplete && options.onComplete();
                    options.onEnd && options.onEnd();
                }
                this.effectPlayCallback.delete(audioID);
            });
        }).catch(err => {
            cc.error(err);
            if (options) {
                options.onError && options.onError(err);
                options.onEnd && options.onEnd();
            }
        });
    }

    public stopAllEffects() {
        this.effectPlayCallback.forEach((callbacks, audioID) => {
            cc.audioEngine.stop(audioID);
            callbacks.onStop && callbacks.onStop();
            callbacks.onEnd && callbacks.onEnd();
            this.effectPlayCallback.delete(audioID);
        });
    }

    /**
     * 播放背景音乐，同一时间只能播放一首背景音乐
     */
    public playBGM(res: AudioRes, options?: { volume?: number; }) {
        options = options || {};
        (options as IAudioPlayOptions).loop = true;
        this.stopBGM();
        this.play(res, options).then(audioID => {
            this.bgmAudioID = audioID;
        }).catch(err => {
            cc.error(err);
        });
    }

    public pauseBGM() {
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.pause(this.bgmAudioID);
        }
    }

    public resumeBGM() {
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.resume(this.bgmAudioID);
        }
    }

    public stopBGM() {
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
            this.bgmAudioID = -1;
        }
    }

    public stopAll() {
        this.musicPlayCallback.clear();
        this.effectPlayCallback.clear();
        cc.audioEngine.stopAll();
    }

    public setVolume(volume: number) {
        this.volume = volume;
    }

    private getClip(url: string, options?: IAudioPlayOptions) {
        return new Promise<cc.AudioClip>((resolve, reject) => {
            const isRemote = url.indexOf(':') > -1;
            if (!isRemote) {
                url = url.substring(0, url.lastIndexOf('.'));
            }
            const onClipLoaded = (err: Error, clip: cc.AudioClip) => {
                if (err) {
                    cc.error(err);
                    reject(err);
                    return;
                }
                resolve(clip);
            }
            if (isRemote) {
                cc.assetManager.loadRemote(url, onClipLoaded);
            } else {
                cc.resources.load(url, cc.AudioClip, onClipLoaded);
            }
        });
    }

    private play(res: AudioRes, options?: IAudioPlayOptions) {
        return new Promise<number>((resolve, reject) => {
            if (typeof (res) === 'string') {
                this.getClip(res, options).then(clip => {
                    resolve(this.playClip(clip, options));
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(this.playClip(res, options));
            }
        })

    }

    private playClip(clip: cc.AudioClip, options?: IAudioPlayOptions) {
        const volume = (options && options.volume !== undefined) ? options.volume : this.volume;
        const loop = (options && options.loop !== undefined) ? options.loop : false;
        return cc.audioEngine.play(clip, loop, volume);
    }

}
