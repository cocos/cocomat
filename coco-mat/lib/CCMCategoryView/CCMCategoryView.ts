const { ccclass, property } = cc._decorator;

export enum ItemType {
    ITEM = 1,
    HEADER = 2,
    CATEGORY = 3,
    CONTAINER = 4
}

export interface Adapter {
    dataSource: {
        category: string,
        items: any[]
    }[],
    headerData?: any,
    itemScale?: number,
    initialOffset?: number,
    onFocus?: (index: number) => void,
    bindView: (node: cc.Node, data: any, itemType: ItemType, index: number) => void,
}

interface ViewItem {
    index: number,
    height: number,
    type: ItemType,
    position: cc.Vec2,
    value?: any,
    invisible?: boolean
    originalIndex?: number,
    categoryBottom?: number,
}

interface RecyclePool {
    headers: cc.Node[],
    categories: cc.Node[],
    items: cc.Node[],
    containers?: cc.Node[]
}

interface NodeMap {
    [key: number]: cc.Node
}

const InvisiblePosition = cc.v2(0, 1080);

@ccclass
export class CCMCategoryView extends cc.ScrollView {

    @property({ override: true, visible: false })
    public horizontal: boolean = false;

    @property({ override: true, visible: false })
    public vertical: boolean = true;

    @property({ override: true, visible: false })
    public inertia: boolean = true;

    @property({ override: true, visible: false })
    public elastic: boolean = true;

    @property({ override: true, visible: false })
    public cancelInnerEvents: boolean = true;

    @property({ override: true, visible: false })
    // @ts-ignore
    get verticalScrollBar(): cc.Scrollbar {
        return null;
    };

    set verticalScrollBar(scrollbar: cc.Scrollbar) {
        // nothing to do
    }

    @property({ override: true, visible: false })
    // @ts-ignore
    get horizontalScrollBar(): cc.Scrollbar {
        return null;
    };

    set horizontalScrollBar(scrollbar: cc.Scrollbar) {
        // nothing to do
    }

    @property({ override: true, visible: false, type: [cc.Component.EventHandler] })
    public scrollEvents: cc.Component.EventHandler[] = [];

    @property(cc.Prefab)
    private itemPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    private categoryPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    private headerPreafab: cc.Prefab = null;

    @property
    private spacingX = 0;

    @property
    private spacingY = 0;

    @property
    private paddingLeft = 0;

    @property
    private paddingRight = 0;

    @property
    private paddingTop = 0;

    @property
    private paddingBottom = 0;

    @property(cc.Node)
    private container: cc.Node = null;

    @property(cc.Prefab)
    private containerPrefab: cc.Prefab = null;

    private canLayout = false;
    private recycleThresHold = 0;
    private items: ViewItem[] = [];
    private visibleItems: ViewItem[] = [];
    private recyclePool: RecyclePool = {
        items: [],
        headers: [],
        categories: [],
        containers: []
    };
    private itemScale = 1;
    private item4node: NodeMap = {};
    private dirtyItems: number[] = [];
    private categories: ViewItem[] = [];
    private currentCategoryIndex = 0;
    private targetCategoryIndex = -1;

    private adapter: Adapter = null;

    // for container
    private hasContainer = false;
    private containers: ViewItem[] = [];
    private container4node: NodeMap = {};
    private visibleContainers: ViewItem[] = [];

    private updateAlignment(node: cc.Node) {
        let widget = node.getComponent(cc.Widget);
        if (!!widget) widget.updateAlignment();
        let children = node.children;
        if (!children || !children.length) return;
        for (let i = 0, ii = children.length; i < ii; i++) {
            this.updateAlignment(children[i]);
        }
    }

    // instaniate header, category, item, container
    private instantiateItem(type: ItemType) {
        let nodes: cc.Node[];
        let prefab: cc.Prefab;
        let scale = 1;
        if (type == ItemType.HEADER) {
            nodes = this.recyclePool.headers;
            prefab = this.headerPreafab;
        } else if (type == ItemType.CATEGORY) {
            nodes = this.recyclePool.categories;
            prefab = this.categoryPrefab;
            scale = this.itemScale;
        } else if (type == ItemType.ITEM) {
            nodes = this.recyclePool.items;
            prefab = this.itemPrefab;
            scale = this.itemScale;
        } else {
            nodes = this.recyclePool.containers;
            prefab = this.containerPrefab;
            scale = this.itemScale;
        }
        if (!nodes.length) {
            let node = cc.instantiate(prefab);
            if (type == ItemType.CONTAINER) {
                node.height *= scale;
                node.parent = this.container;
            } else {
                node.scale = scale;
                node.parent = this.content;
            }
            return node;
        } else {
            return nodes.shift();
        }
    }

    // get scroll offset of y axis
    public getCurrentOffset(): number {
        return this.getScrollOffset().y;
    }

    private focusCategoryByOffset() {
        let baseline = -this.getCurrentOffset() - this.node.height / 2;
        let index = this.findFocusCategoryIndex(baseline);
        this.focusCategory(index);
    }

    // override
    private _startAutoScroll(deltaMove, timeInSecond, attenuated) {
        // @ts-ignore
        super._startAutoScroll(deltaMove, timeInSecond, attenuated);
        // @ts-ignore
        let baseline = -this._autoScrollStartPosition.y - this._autoScrollTargetDelta.y;
        this.targetCategoryIndex = this.findFocusCategoryIndex(baseline);
    }

    // override
    public getScrollEndedEventTiming() {
        return 0.5;
    }

    // override
    private _dispatchEvent(event) {
        // @ts-ignore
        super._dispatchEvent(event);
        if (event == 'scroll-ended-with-threshold') {
            this.focusCategory(this.targetCategoryIndex);
        }
    }

    // override
    private _handlePressLogic() {
        // @ts-ignore
        super._handlePressLogic();
        this.targetCategoryIndex = -1;
    }

    // override
    private _handleReleaseLogic(touch: cc.Touch) {
        // @ts-ignore
        super._handleReleaseLogic(touch);
        // @ts-ignore
        if (!this._autoScrolling) {
            this.focusCategoryByOffset();
        }
    }

    private focusCategory(index: number) {
        if (index < 0 || index > this.categories.length) return;
        this.currentCategoryIndex = index;
        if (!this.adapter || !this.adapter.onFocus) return;
        this.adapter.onFocus(index);
    }

    // setup adapter
    public setAdapter(adapter: Adapter) {
        if (!adapter || this.adapter == adapter) return;
        this.canLayout = false;
        this.items.splice(0);
        this.categories.splice(0);
        this.containers.splice(0);
        this.adapter = adapter;
        this.itemScale = adapter.itemScale || 1;
        this.hasContainer = cc.isValid(this.container) && cc.isValid(this.containerPrefab);
        this.updateAlignment(this.node);
        this.measureContent();
        this.scheduleOnce(() => {
            this.canLayout = true;
            this._moveContent(cc.v2(0, adapter.initialOffset - this.getCurrentOffset()), false);
            this.focusCategoryByOffset();
        }, 0);
    }

    private resetLayout() {
        let {
            item4node,
            dirtyItems,
            visibleItems
        } = this;
        for (let i = 0, ii = visibleItems.length; i < ii; i++) {
            this.recycleItem(visibleItems[i], item4node);
        }
        dirtyItems.splice(0);
        visibleItems.splice(0);

        if (!this.hasContainer) return;

        let {
            container4node,
            visibleContainers
        } = this;
        for (let i = 0, ii = visibleContainers.length; i < ii; i++) {
            this.recycleItem(visibleContainers[i], container4node);
        }
        visibleContainers.splice(0);
    }

    // focus category directly
    public setCategoryIndex(index: number) {
        if (index == this.currentCategoryIndex) return;
        if (index < 0 || index >= this.categories.length) return;
        this.currentCategoryIndex = index;
        this.stopAutoScroll();
        this.resetLayout();
        let category = this.categories[index];
        let targetOffset = Math.abs(category.position.y + category.height / 2) - this.spacingY;
        this._moveContent(cc.v2(0, targetOffset - this.getCurrentOffset()), false);
    }

    public calculateColumns(itemScale = 1) {
        this.updateAlignment(this.node);
        let {
            paddingLeft,
            paddingRight,
            spacingX,
            itemPrefab: {
                data: {
                    width: itemWidth,
                }
            },
            content: {
                width: visibleWidth,
            },
        } = this;
        itemWidth *= itemScale;
        spacingX *= itemScale;
        return Math.floor((visibleWidth - paddingLeft - paddingRight + spacingX) / (itemWidth + spacingX));
    }

    // override
    private _moveContent(deltaMove, canStartBounceBack) {
        // @ts-ignore
        super._moveContent(deltaMove, canStartBounceBack);
        this.layoutItems(this.items, this.visibleItems, this.item4node);
        if (this.hasContainer) {
            this.container.y = this.content.y;
            this.layoutItems(this.containers, this.visibleContainers, this.container4node);
        }
    }

    // unused
    private prepareBuffer() {
        // prepare category buffer
        for (let i = 0; i < 2; i++) {
            let node = this.instantiateItem(ItemType.CATEGORY);
            node.setPosition(InvisiblePosition);
            this.recyclePool.categories.push(node);
        }
        // prepare item buffer
        for (let i = 0, ii = 10; i < ii; i++) {
            let node = this.instantiateItem(ItemType.ITEM);
            node.setPosition(InvisiblePosition);
            this.recyclePool.items.push(node);
        }
        if (!this.hasContainer) return;
        // prepare row buffer
        for (let i = 0; i < 2; i++) {
            let node = this.instantiateItem(ItemType.CONTAINER);
            node.setPosition(InvisiblePosition);
            this.recyclePool.containers.push(node);
        }
    }

    // measure header height and bind header view
    private measureHeader(): number {
        if (this.adapter.headerData && this.headerPreafab) {
            let headerHeight = this.headerPreafab.data.height;
            let header: ViewItem = {
                originalIndex: 0,
                value: this.adapter.headerData,
                index: this.items.length,
                type: ItemType.HEADER,
                position: cc.v2(0, -this.paddingTop - headerHeight / 2),
                height: headerHeight,
                categoryBottom: -this.paddingTop - headerHeight
            };
            this.items.push(header);
            this.categories.push(header);
            // preload header
            let node = this.instantiateItem(ItemType.HEADER);
            node.setPosition(InvisiblePosition);
            this.recyclePool.headers.push(node);
            this.adapter.bindView(node, header.value, header.type, header.originalIndex);
            return this.paddingTop + headerHeight;
        } else {
            return this.paddingTop;
        }
    }

    // measure content height
    private measureContent() {
        let visibleWidth = this.content.width;
        let spacing = cc.size(this.spacingX * this.itemScale, this.spacingY * this.itemScale);
        let itemSize = cc.size(this.itemPrefab.data.width * this.itemScale, this.itemPrefab.data.height * this.itemScale);
        let categorySize = cc.size(this.categoryPrefab.data.width * this.itemScale, this.categoryPrefab.data.height * this.itemScale);
        let columns = Math.floor((visibleWidth - this.paddingLeft - this.paddingRight + spacing.width) / (itemSize.width + spacing.width));
        let paddingHorizontal = (visibleWidth - itemSize.width * columns - spacing.width * (columns - 1)) / 2;
        let usedSpaceY = this.measureHeader();
        for (let i = 0, ii = this.adapter.dataSource.length; i < ii; i++) {
            let { category: categoryValue, items: itemValues } = this.adapter.dataSource[i];
            let categoryPadding = this.hasContainer ? 0 : paddingHorizontal;
            let category: ViewItem = {
                originalIndex: i,
                value: categoryValue,
                type: ItemType.CATEGORY,
                index: this.items.length,
                height: categorySize.height,
                position: cc.v2(-visibleWidth / 2 + categoryPadding + categorySize.width / 2, -usedSpaceY - categorySize.height / 2)
            };
            this.items.push(category);
            usedSpaceY += categorySize.height;
            let items = itemValues.slice(0);
            let lack = (items.length % columns) == 0 ? 0 : columns - (items.length % columns);
            for (let j = 0; j < lack; j++) {
                items.push(undefined);
            }
            for (let k = 0, kk = items.length; k < kk; k++) {
                let column = k % columns;
                let row = Math.floor(k / columns);
                let itemValue = items[k];
                let item: ViewItem = {
                    originalIndex: k,
                    value: itemValue,
                    type: ItemType.ITEM,
                    invisible: !itemValue,
                    height: itemSize.height,
                    index: this.items.length,
                    position: cc.v2(
                        - visibleWidth / 2 + paddingHorizontal + itemSize.width / 2 + column * itemSize.width + column * spacing.width,
                        - usedSpaceY - itemSize.height / 2 - row * itemSize.height - row * spacing.height
                    )
                };
                this.items.push(item);
                if (!this.hasContainer || column != 0) continue;
                let container: ViewItem = {
                    height: itemSize.height,
                    type: ItemType.CONTAINER,
                    index: this.containers.length,
                    position: cc.v2(0, - usedSpaceY - itemSize.height / 2 - row * itemSize.height - row * spacing.height)
                };
                this.containers.push(container);
            }
            usedSpaceY += Math.ceil(items.length / columns) * (itemSize.height + spacing.height);
            category.categoryBottom = -usedSpaceY;
            this.categories.push(category);
        }
        this.recycleThresHold = itemSize.height;
        this.content.height = Math.max(0, usedSpaceY + this.paddingBottom);
        if (this.hasContainer) this.container.height = this.content.height;
    }

    /**
     * recycle item
     * @param item view item or container item
     * @param nodes node map for indexing
     */
    private recycleItem(item: ViewItem, nodes: NodeMap) {
        let { index, type } = item;
        let node = nodes[index];
        node.setPosition(InvisiblePosition);
        if (type == ItemType.HEADER) {
            this.recyclePool.headers.push(node);
        } else if (type == ItemType.CATEGORY) {
            this.recyclePool.categories.push(node);
        } else if (type == ItemType.ITEM) {
            this.recyclePool.items.push(node);
        } else {
            this.recyclePool.containers.push(node);
        }
        delete nodes[index];
    }

    /**
     * recycle all items which are out of threshold range
     * @param visibleItems visible view item or visible container item
     * @param nodes node map for indexing
     * @param top top of visible rect, negative scroll offset of y axis
     * @param bottom bottom of visible rect
     */
    private recycleItems(visibleItems: ViewItem[], nodes: NodeMap, top: number, bottom: number): { frontRecycled: boolean, backRecycled: boolean } {
        let frontIndex = -1, backIndex = -1;
        let recycleThresHold = this.recycleThresHold;
        for (let i = 0, ii = visibleItems.length; i < ii; i++) {
            let item = visibleItems[i];
            let delta = item.position.y - item.height / 2 - top;
            if (delta < 0) break;
            if (delta < recycleThresHold) continue;
            this.recycleItem(item, nodes);
            frontIndex = i;
        }
        if (frontIndex != -1) {
            visibleItems.splice(0, frontIndex + 1);
        }
        for (let i = visibleItems.length - 1; i >= 0; i--) {
            let item = visibleItems[i];
            let delta = item.position.y + item.height / 2 - bottom;
            if (delta > 0) break;
            if (delta > -recycleThresHold) continue;
            this.recycleItem(item, nodes);
            backIndex = i;
        }
        if (backIndex != -1) {
            visibleItems.splice(backIndex);
        }
        return { frontRecycled: frontIndex != -1, backRecycled: backIndex != -1 };
    }

    /**
     * binary search the first visible index
     * @param items view items or container items
     * @param top top of visible rect, negative scroll offset of y axis
     */
    private findFirstVisibleIndex(items: ViewItem[], top: number): number {
        let l = 0, h = items.length - 1, m = 0;
        while (l <= h) {
            m = Math.floor((l + h) / 2);
            let delta = items[m].position.y - items[m].height / 2 - top;
            if (delta < 0) {
                h = m - 1;
            } else if (delta > this.recycleThresHold) {
                l = m + 1;
            } else {
                return m;
            }
        }
        return Math.max(0, Math.min(m, items.length - 1));
    }

    /**
     * binary search the focus index
     * @param baseline focus offset of y axis
     */
    private findFocusCategoryIndex(baseline: number): number {
        let categories = this.categories;
        let len = categories.length;
        let l = 0, h = len - 1, m = 0;
        while (l <= h) {
            m = Math.floor((l + h) / 2);
            let { position, height, categoryBottom } = categories[m];
            if (baseline > position.y + height / 2) {
                h = m - 1;
            } else if (baseline <= categoryBottom) {
                l = m + 1;
            } else {
                return m;
            }
        }
        return Math.max(0, Math.min(m, len - 1));
    }

    /**
     * layout item
     * @param item view item or container item
     */
    private layoutItem(item: ViewItem): cc.Node {
        let node = this.instantiateItem(item.type);
        if (item.invisible) {
            node.setPosition(InvisiblePosition);
        } else {
            node.setPosition(item.position);
        }
        return node;
    }

    private isMutableItem(item: ViewItem): boolean {
        return item.type != ItemType.HEADER && item.type != ItemType.CONTAINER;
    }

    /**
     * layout all items
     * @param items view items or container items
     * @param visibleItems visible view item or visible container item
     * @param nodes node map for indexing
     */
    private layoutItems(items: ViewItem[], visibleItems: ViewItem[], nodes: NodeMap) {
        if (!this.canLayout) return;
        let top = -this.getCurrentOffset();
        let bottom = top - cc.winSize.height;
        let recycleThresHold = this.recycleThresHold;
        let { frontRecycled, backRecycled } = this.recycleItems(visibleItems, nodes, top, bottom);
        let itemCount = items.length;
        if (!visibleItems.length) {
            let index = this.findFirstVisibleIndex(items, top);
            while (index < itemCount) {
                let item = items[index];
                if (item.position.y + item.height / 2 - bottom <= -recycleThresHold) break;
                visibleItems.push(item);
                nodes[index] = this.layoutItem(item);
                if (this.isMutableItem(item)) {
                    this.adapter.bindView(this.item4node[index], item.value, item.type, item.originalIndex);
                }
                index++;
            }
        } else {
            if (!frontRecycled) {
                let index = visibleItems[0].index - 1;
                while (index >= 0) {
                    let item = items[index];
                    if (item.position.y - item.height / 2 - top >= recycleThresHold) break;
                    visibleItems.unshift(item);
                    nodes[index] = this.layoutItem(item);
                    if (this.isMutableItem(item) && this.dirtyItems.indexOf(index) == -1) {
                        this.dirtyItems.push(index);
                    }
                    index--;
                }
            }
            if (!backRecycled) {
                let index = visibleItems[visibleItems.length - 1].index + 1;
                while (index < itemCount) {
                    let item = items[index];
                    if (item.position.y + item.height / 2 - bottom <= -recycleThresHold) break;
                    visibleItems.push(item);
                    nodes[index] = this.layoutItem(item);
                    if (this.isMutableItem(item) && this.dirtyItems.indexOf(index) == -1) {
                        this.dirtyItems.push(index);
                    }
                    index++;
                }
            }
        }
    }

    private updateItem() {
        if (!this.dirtyItems.length) return;
        let index = this.dirtyItems.shift();
        if (index == undefined || index < 0 || index >= this.items.length) return;
        let item = this.items[index];
        if (item.invisible) return;
        let node = this.item4node[index];
        if (!node) return;
        this.adapter.bindView(node, item.value, item.type, item.originalIndex);
    }

    public update(dt: number) {
        super.update(dt);
        this.updateItem();
    }

}