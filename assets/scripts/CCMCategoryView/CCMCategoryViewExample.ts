import CCMBackBtn from "../../../coco-mat/lib/CCMBackBtn/CCMBackBtn";
import { CCMCategoryView, Adapter as CategoryAdapter, ItemType } from "../../../coco-mat/lib/CCMCategoryView/CCMCategoryView";
import { CCMPicker, Adapter as NavigationAdapter } from "../../../coco-mat/lib/CCMPicker/CCMPicker";
import { CCMSceneManager } from "../../../coco-mat/lib/CCMSceneManager/CCMSceneManager";
import { CCMCategory } from "./CCMCategory";
import { CCMItem } from "./CCMItem";
import { CCMNavigation } from "./CCMNavigation";

const { ccclass, property } = cc._decorator;

const randomInt = (max: number) => 1 + Math.floor(Math.random() * Math.floor(max));

let payload: {
    category: string,
    items: any[]
}[];

let initialOffset = 0;

const TAG = 'CCMCategoryViewExample';

@ccclass
export class CCMCategoryViewExample extends cc.Component {

    @property({ type: CCMPicker })
    private navigations: CCMPicker = null;

    @property({ type: CCMCategoryView })
    private container: CCMCategoryView = null;

    protected onLoad() {
        CCMBackBtn.showOnLeftTop({
            callback: () => {
                CCMSceneManager.getInstance().backScene();
            }
        });

        if (!payload) {
            payload = [];
            for (let i = 1, ii = 8; i <= ii; i++) {
                let category = `category ${i}`;
                let items = [];
                for (let j = 1, jj = 4 + randomInt(5); j <= jj; j++) {
                    items.push('c ' + i + ' i ' + j);
                }
                payload.push({ category, items });
            }
        }

        let navigationAdapter: NavigationAdapter = {
            dataSource: payload.map(element => element.category),
            onPick: (index: number) => {
                this.container.setCategoryIndex(index);
            },
            bindView: (node: cc.Node, data: any, index: number) => {
                node.getComponent(CCMNavigation).setup(data, index, index => {
                    this.navigations.setCurrentIndex(index);
                    this.container.setCategoryIndex(index);
                });
            },
            transform: (node: cc.Node, ratio: number) => {
                let text = node.getChildByName('text');
                if (ratio > 1) {
                    ratio = 1;
                } else if (ratio < -1) {
                    ratio = -1;
                }
                let absRatio = Math.abs(ratio);
                text.y = 30 * ratio;
                text.scale = 1.3 - 0.3 * absRatio;
            }
        };
        this.navigations.setAdapter(navigationAdapter);

        let categoryAdapter: CategoryAdapter = {
            dataSource: payload,
            initialOffset: initialOffset,
            bindView: (node: cc.Node, data: any, type: ItemType, index: number) => {
                if (type == ItemType.CATEGORY) {
                    node.getComponent(CCMCategory).setup(data);
                } else if (type == ItemType.ITEM) {
                    node.getComponent(CCMItem).setup(data, index, (index: number) => {
                        console.log(TAG, 'click item: ' + data);
                    });
                }
            },
            onFocus: (index: number) => {
                this.navigations.setCurrentIndex(index);
            }
        };
        this.container.setAdapter(categoryAdapter);
    }

    public onDisable() {
        initialOffset = this.container.getCurrentOffset();
    }

}