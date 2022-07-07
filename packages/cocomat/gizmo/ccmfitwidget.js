class CCMFitWidgetGizmo extends Editor.Gizmo {
    onCreateRoot() {
        this.tool = this._root.group();

        const rect = this.tool
            .rect(this.target.area.width, this.target.area.height)
            .fill('none')
            .stroke({ color: 'rgba(255,0,0,1)' });

        this.tool.plot = (p, w, h) => {
            this.tool.move(p.x, p.y);
            rect.size(w, h);
        };
    }

    onUpdate() {
        let wp0 = this.node.convertToWorldSpaceAR(cc.v2(
                -this.target.area.width * this.target.node.anchorX,
                this.target.area.height * this.target.node.anchorY
            ));
        let wp1 = this.node.convertToWorldSpaceAR(cc.v2(
                this.target.area.width * (1 - this.target.node.anchorX),
                -this.target.area.height * (1 - this.target.node.anchorY)
            ));

        // svg view 的坐标体系和节点坐标体系不太一样，这里使用内置函数来转换坐标
        wp0 = this.worldToPixel(wp0);
        wp1 = this.worldToPixel(wp1);

        // 对齐坐标，防止 svg 因为精度问题产生抖动
        wp0 = Editor.GizmosUtils.snapPixelWihVec2(wp0);
        wp1 = Editor.GizmosUtils.snapPixelWihVec2(wp1);

        this.tool.plot(wp0, wp1.x - wp0.x, wp1.y - wp0.y);
    }

    // 如果需要自定义 Gizmo 显示的时机，重写 visible 函数即可
    visible() {
        return this.target.useCustomArea && (this.selecting || this.editing);
    }

    // Gizmo 创建在哪个 Layer 中：foreground, scene, background
    layer() {
        return 'foreground';
    }
}

module.exports = CCMFitWidgetGizmo;
