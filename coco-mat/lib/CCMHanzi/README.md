# CCMHanziWriter

这是一个基于CocosCreator的HanziWriter项目，整个项目参考了[HanziWriter.org](https://hanziwriter.org/)，是它的功能在CocosCreator中的翻版，虽然参考和借鉴了很多，但几乎按照CocosCreator的方式重写了一遍，从而兼具其原有特性的同时，保持和引擎一致的开发体验，去掉了大量的只能在web开发中使用的特性。

# 特性

- 代码方式快速创建文字块，20多项自定义`Option`，按照需求灵活配置
- 同屏多字块分离处理，各字之间互不干扰
- 动态更替内容`字`，动态刷新`Options`
- 标准字模式，书写模式，墨迹模式，色值均可定义
- 中线检查和检测，中线路径绘制等
- 绘制田字格，可自定义线宽和颜色
- 可对象控制：字、笔画、书写器
- 支持网络数据源，可配置数据路径url
- 自适应目标`cc.Graphics`，自动计算对象大小
- 提供检查事件，支持`function`和`cc.Component.EventHandler`事件

# 组件使用

为`Node`添加`HanziWriterComponent`，指定`targetGraphics` ！

## 数据来源

Hanzi Writer使用的笔划顺序数据来自[Make me a Hanzi](https://github.com/skishore/makemeahanzi)项目，但进行了一些细微调整。可以在[Hanzi Writer Data](https://github.com/chanind/hanzi-writer-data)中找到该数据，此数据可视化工具在[这里](https://chanind.github.io/hanzi-writer-data)。

数据源CDN [jsdelivr CDN](https://www.jsdelivr.com/package/npm/hanzi-writer-data)