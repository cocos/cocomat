const EPSILON = 1e-4;
const MINIMUM_VELOCITY = 30;

const { ccclass, property } = cc._decorator;

export interface Adapter {
    dataSource: any[],
    onPick?: (index: number) => void,
    bindView?: (node: cc.Node, data: any, index: number) => void,
    transform?: (node: cc.Node, ratio: number) => void
}

@ccclass
export class CCMPicker extends (cc.ScrollView as any) {

    @property({
        override: true,
        visible: false
    })
    public horizontal: boolean = false;

    @property({
        override: true,
        visible: false
    })
    public vertical: boolean = true;

    @property({
        override: true,
        visible: false
    })
    public inertia: boolean = true;

    @property({
        override: true,
        visible: false
    })
    public elastic: boolean = true;

    @property({
        override: true,
        visible: false
    })
    public cancelInnerEvents: boolean = true;

    @property({
        override: true,
        visible: false
    })
    get verticalScrollBar(): cc.Scrollbar {
        return null;
    };

    set verticalScrollBar(scrollbar: cc.Scrollbar) {
        // nothing to do
    }

    @property({
        override: true,
        visible: false
    })
    get horizontalScrollBar(): cc.Scrollbar {
        return null;
    };

    set horizontalScrollBar(scrollbar: cc.Scrollbar) {
        // nothing to do
    }

    @property({
        override: true,
        visible: false,
        type: [cc.Component.EventHandler]
    })
    public scrollEvents: cc.Component.EventHandler[] = [];

    @property(cc.Prefab)
    private itemPrefab: cc.Prefab = null;

    private itemHeight = 0;
    private currentIndex = 0;
    private hasLocated = false;
    private adapter: Adapter = null;

    private pickCallback = () => {
        if (!this.adapter || !this.adapter.onPick) return;
        this.adapter.onPick(this.getCurrentIndex());
    };

    public onLoad() {
        this.itemHeight = this.itemPrefab.data.height;
        var layout = this.content.getComponent(cc.Layout);
        if (!!layout) {
            layout.paddingTop = (this.node.height - this.itemHeight) / 2;
            layout.paddingBottom = layout.paddingTop + this.content.parent.height - this.node.height;
        }
    }

    private getBaseline(): number {
        return - this.getScrollOffset().y - this.node.height / 2;
    }

    private _moveContent(deltaMove: any, canStartBounceBack: boolean) {
        // @ts-ignore
        super._moveContent(deltaMove, canStartBounceBack);
        if (!this.adapter || !this.adapter.transform) return;
        let children = this.content.children;
        if (!children || !children.length) return;
        let baseline = this.getBaseline();
        for (let i = 0, ii = children.length; i < ii; i++) {
            let child = children[i];
            let offset = child.y - baseline;
            let ratio = offset / this.itemHeight;
            this.adapter.transform(child, ratio);
        }
    }

    public setAdapter(adapter: Adapter) {
        if (!adapter) {
            cc.error('adapter can not be undefined!');
            return;
        }
        this.adapter = adapter;
        let { dataSource, bindView } = adapter;
        for (let i = 0, ii = dataSource.length; i < ii; i++) {
            let child = cc.instantiate(this.itemPrefab);
            if (bindView) bindView(child, dataSource[i], i);
            this.content.addChild(child);
        }
    }

    // override disable wheel event
    private _onMouseWheel() {
    }

    public setCurrentIndex(index: number) {
        this.currentIndex = index;
        this.hasLocated = true;
        let targetY = index * this.itemHeight;
        let offsetY = Math.abs(this.getScrollOffset().y);
        let deltaY = Math.abs(targetY - offsetY);
        let duration = Math.min(0.5 * deltaY / this.itemHeight, 0.8);
        this.unschedule(this.pickCallback);
        this.scrollToOffset(cc.v2(0, targetY), duration);
    }

    private scrollToClosestLocation() {
        let { y: currentOffset } = this.getScrollOffset();
        let remainder = currentOffset % this.itemHeight;
        let delta = Math.abs(remainder) > this.itemHeight / 2 ? (this.itemHeight - Math.abs(remainder)) : (-Math.abs(remainder));
        let targetOffset = currentOffset + delta;
        let duration = 0.5;
        this.hasLocated = true;
        this.scrollToOffset(cc.v2(0, targetOffset), duration);
        let index = Math.round(Math.abs(targetOffset) / this.itemHeight);
        this.unschedule(this.pickCallback);
        if (this.currentIndex == index) return;
        this.currentIndex = index;
        this.scheduleOnce(this.pickCallback, duration);
    }

    private _handleReleaseLogic(touch: cc.Touch) {
        this._gatherTouchMove(touch.getDelta());
        let bounceBackStarted = this._startBounceBackIfNeeded();
        if (!bounceBackStarted && this.inertia) {
            let velocity = this._calculateTouchMoveVelocity();
            let needFling = cc.sys.OS_ANDROID == cc.sys.os ? Math.abs(velocity.y) > MINIMUM_VELOCITY : !velocity.fuzzyEquals(cc.v2(0, 0), EPSILON);
            if (needFling && this.brake < 1) {
                this.hasLocated = false;
                this._startInertiaScroll(velocity);
            } else if (this._touchMoved) {
                this.scrollToClosestLocation();
            }
        }
        this._onScrollBarTouchEnded();
        if (this._autoScrolling) return;
        this.scrollToClosestLocation();
    }

    private getCurrentIndex(): number {
        return this.currentIndex || 0;
    }

    private getCurrentData(): any {
        if (!this.adapter || !this.adapter.dataSource) return undefined;
        return this.adapter.dataSource[this.getCurrentIndex()];
    }

    private _startAutoScroll(deltaMove, timeInSecond, attenuated) {
        let adjustedDeltaMove = this._flattenVectorByDirection(deltaMove);
        if (!this.hasLocated) {
            timeInSecond *= 0.2;
            let scrollOffset = this.getScrollOffset();
            let autoScrollEndOffset = adjustedDeltaMove.add(scrollOffset);
            let remainder = autoScrollEndOffset.y % this.itemHeight;
            if (Math.abs(remainder) > this.itemHeight / 2) {
                adjustedDeltaMove.y += (this.itemHeight - Math.abs(remainder));
            } else {
                adjustedDeltaMove.y -= Math.abs(remainder);
            }
            let { y: offsetY } = adjustedDeltaMove.add(scrollOffset);
            let { y: maxoffsetY } = this.getMaxScrollOffset();
            if (offsetY < 0) {
                offsetY = 0;
            } else if (offsetY > maxoffsetY) {
                offsetY = maxoffsetY;
            }
            this.currentIndex = Math.round(Math.abs(offsetY) / this.itemHeight);
            this.unschedule(this.pickCallback);
            this.scheduleOnce(this.pickCallback, timeInSecond * 0.5);
        }
        this._autoScrolling = true;
        this._autoScrollTargetDelta = adjustedDeltaMove;
        this._autoScrollAttenuate = attenuated;
        this._autoScrollStartPosition = this.getContentPosition();
        this._autoScrollTotalTime = timeInSecond;
        this._autoScrollAccumulatedTime = 0;
        this._autoScrollBraking = false;
        this._isScrollEndedWithThresholdEventFired = false;
        this._autoScrollBrakingStartPosition = cc.v2(0, 0);

        let currentOutOfBoundary = this._getHowMuchOutOfBoundary();
        if (!currentOutOfBoundary.fuzzyEquals(cc.v2(0, 0), EPSILON)) {
            this._autoScrollCurrentlyOutOfBoundary = true;
            let afterOutOfBoundary = this._getHowMuchOutOfBoundary(adjustedDeltaMove);
            if (currentOutOfBoundary.x * afterOutOfBoundary.x > 0 ||
                currentOutOfBoundary.y * afterOutOfBoundary.y > 0) {
                this._autoScrollBraking = true;
            }
        }
    }

}