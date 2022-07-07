// @ts-nocheck
const { ccclass, property } = cc._decorator;

@ccclass
export class CCMVideoSlider extends cc.Slider {

    @property(cc.Node)
    private progressBar: cc.Node = null;

    private _onTouchEnded(event) {
        super._onTouchEnded(event);
        this._emitSlideEvent();
    }

    private _onTouchCancelled(event) {
        super._onTouchCancelled(event);
        this._emitSlideEvent();
    }

    private _handleSliderLogic(touch: cc.Touch) {
        super._handleSliderLogic(touch);
        this._updateProgress(touch);
        this._emitSlideEvent();
    }

    private _updateHandlePosition() {
        super._updateHandlePosition();
        this.progressBar.width = this.node.width * this.progress;
    }
}
