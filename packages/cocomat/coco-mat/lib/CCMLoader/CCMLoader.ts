import CCMSpineLoader, { SpineLoaderOptions } from './CCMSpineLoader';
import { CCMImageLoader, ImageLoaderOptions } from './CCMImageLoader';
export class CCMLoader {
    public static loadSpine(url:string, options?: SpineLoaderOptions){
        return new CCMSpineLoader().loadSpine(url,options);
    }
    public static loadImage(url:string,options?: ImageLoaderOptions){
        return new CCMImageLoader().loadImg(url,options);
    }
}