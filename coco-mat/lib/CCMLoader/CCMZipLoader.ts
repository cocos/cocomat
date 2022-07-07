import CCMBinding from '../CCMBinding/CCMBinding';
// @ts-ignore
import JSZip = require('jszip.min');

const TAG = 'CCMZipLoader';

// @ts-ignore
cc.assetManager.downloader.register({ '.zip': cc.assetManager.downloader._downloaders['.bin'] });

class ZipLoader {
    protected url: string;
    protected filelist: Array<string>;

    constructor(url: string) {
        this.url = url;
        this.filelist = [];
    }

    get loader() {
        return this.url.startsWith('http')
            ? cc.assetManager.loadRemote.bind(cc.assetManager)
            : cc.resources.load.bind(cc.resources);
    }

    load() {
        if (!this.url) {
            cc.error(TAG, 'zip url is empty');
        }
    }

    /**
     * 获取包内的任意类型文件
     * @param {*} name
     */
    file(name): Promise<any> {
        throw new Error('need overwrite "file" method');
    }

    /**
     * 使用指定 cc.Texture2D 创建 cc.SpriteFrame
     * @param {*} imageName
     */
    spriteFrame(imageName) {
        return new Promise((resolve, reject) => {
            this.file(imageName).then(tex => {
                resolve(new cc.SpriteFrame(tex));
            })
                .catch(reject);
        });
    }

    /**
     * 将 zip 包转化为 sp.SkeletonData
     */
    toSkeletonData(): Promise<sp.SkeletonData> {
        return new Promise((resolve, reject) => {
            let jsonName = this.filelist.find(f => f.endsWith('.json'));
            let atlasName = this.filelist.find(f => f.endsWith('.atlas'));
            if (!atlasName) {
                atlasName = this.filelist.find(f => f.endsWith('.txt'));
            }
            let texNames = this.filelist.filter(f => f.endsWith('.png'));

            let err = '';
            if (!jsonName) err = 'json file not found.';
            else if (!atlasName) err = 'atlas or txt file not found.';
            else if (texNames.length == 0) err = 'texture not found.';
            if (err) {
                cc.error(TAG, err + this.filelist.join(', '));
                reject(err);
                return;
            }

            Promise.all([this.file(jsonName), this.file(atlasName), this.file(texNames)]).then(results => {
                let [jsonFile, atlasFile, textures] = results;
                let skeletonData = new sp.SkeletonData();
                skeletonData.loaded = true;
                skeletonData['_objFlags'] = 0;
                skeletonData['_name'] = jsonName;
                skeletonData['_native'] = this.url + '/' + jsonName;
                skeletonData.skeletonJson = jsonFile;
                skeletonData['_atlasText'] = atlasFile;
                // @ts-ignore
                skeletonData.textures = textures;
                skeletonData['_uuid'] = this.url;
                skeletonData['textureNames'] = texNames.map(name => name.split('/').pop());

                // TODO? 直接使用有概率会显示不出来，先延迟一帧返回
                setTimeout(() => {
                    resolve(skeletonData);
                }, 10);
            })
                .catch(reject);
        });
    }

    /**
     * 打印包内文件列表
     */
    dump() {
        this.filelist.forEach(f => cc.log(TAG, f));
    }
}

class WebZipLoader extends ZipLoader {
    private readonly items;

    constructor(url) {
        super(url);
        this.items = {};
    }

    load(): Promise<ZipLoader> {
        super.load();
        return new Promise((resolve, reject) => {
            this.loader(this.url, (err, res) => {
                cc.log(TAG, res.length);
                if (res) {
                    // @ts-ignore
                    res = res instanceof cc.Asset ? res._nativeAsset : res;
                    this.unzip(res).then(resolve.bind(null, this)).catch(reject);
                } else if (err) {
                    reject(JSON.stringify(err));
                }
            });
        });
    }

    file(filename): Promise<any> {
        if (filename instanceof Array) {
            let files = [];
            filename.forEach(f => files.push(this.items[f]));
            return Promise.resolve(files);
        }
        return Promise.resolve(this.items[filename]);
    }

    unzip(zipData) {
        const zip = new JSZip();
        return new Promise((resolve, reject) => {
            zip.loadAsync(zipData).then(z => {
                let tasks = [];
                for (let filename of Object.keys(z.files)) {
                    if (filename.startsWith('__MACOS') || filename.endsWith('/')) {
                        continue;
                    }

                    this.filelist.push(filename);

                    let exp = filename.split('.').pop();
                    let file = z.file(filename);
                    switch (exp) {
                        case 'json':
                        case 'atlas':
                        case 'txt':
                            tasks.push(this.loadText(file));
                            break;
                        case 'png':
                        case 'jpg':
                            tasks.push(this.loadImage(file));
                            break;
                        case 'mp3':
                            tasks.push(this.loadAudio(file));
                            break;
                        case 'zip':
                            tasks.push(this.loadZip(file));
                            break;
                        default:
                            cc.error(TAG, 'unsupport file type: ' + filename);
                    }
                }

                Promise.all(tasks).then(resolve).catch(reject);
            }).catch(err => {
                reject(err);
            });
        });
    }

    loadText(zfile) {
        return new Promise((resolve, reject) => {
            zfile.async('text').then(data => {
                let json = data.replace(',]', ']');

                this.items[zfile.name] = json;
                resolve(json);
            })
                .catch(reject);
        });
    }

    loadImage(zfile) {
        return new Promise((resolve, reject) => {
            zfile.async('base64').then(data => {
                let img = new Image();
                img.src = 'data:image/png;base64,' + data;

                let tex = new cc.Texture2D();
                tex.initWithElement(img);

                this.items[zfile.name] = tex;
                resolve(tex);
            })
                .catch(reject);
        });
    }

    loadAudio(zfile) {
        return new Promise((resolve, reject) => {
            zfile.async('arraybuffer').then(data => {
                // @ts-ignore
                cc.sys.__audioSupport.context.decodeAudioData(data, audioBuffer => {
                    let clip = new cc.AudioClip();
                    // @ts-ignore
                    clip._nativeAsset = audioBuffer;
                    // @ts-ignore
                    clip._setRawAsset(zfile.name, false);
                    clip.url = zfile.name;

                    this.items[zfile.name] = clip;
                    resolve(clip);
                });
            })
                .catch(reject);
        });
    }

    loadZip(zfile) {
        return new Promise((resolve, reject) => {
            zfile.async('uint8array').then(data => {
                this.unzip(data).then(resolve).catch(reject);
            }).catch(reject);
        });
    }
}

class NativeZipLoader extends ZipLoader {
    load(): Promise<ZipLoader> {
        return CCMBinding.Instance.callNativeMethod('@downloadZipFile', { url: this.url })
            .then(({ files }) => {
                this.filelist = files;
                return Promise.resolve(this);
            });
    }


    file(filename) {
        if (filename instanceof Array) {
            let tasks = [];
            filename.forEach(f => tasks.push(new Promise((resolve, reject) => {
                cc.assetManager.loadRemote(f, (err, res) => {
                    if (res) {
                        resolve(this.getAssetContent(filename, res));
                    } else {
                        reject(err);
                    }
                });
            })));
            return Promise.all(tasks);
        }

        return new Promise((resolve, reject) => {
            cc.assetManager.loadRemote(filename, (err, res) => {
                if (res) {
                    resolve(this.getAssetContent(filename, res));
                } else {
                    reject(err);
                }
            });
        });
    }

    getAssetContent(filename, asset) {
        if (!!asset) {
            const ext = cc.path.extname(filename);
            switch (ext) {
                case '.atlas': return asset.text;
                case '.json': return asset.json;
            }
        }
        return asset;
    }
}

export class CCMZipLoader {
    public static load(url, isNative: boolean): Promise<ZipLoader> {
        let loader;
        if (isNative) {
            loader = new NativeZipLoader(url);
        } else {
            loader = new WebZipLoader(url);
        }
        return loader.load();
    }
}
