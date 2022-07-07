# cocomat

## 项目介绍

由腾讯团队贡献的一套可在多个业务间复用的高性能、高效能 Cocos Creator 公共组件框架。

`cocomat` 的原意是 “椰子树皮编织物” ，与这个项目用于加速 Cocos 业务开发的目的接近。另外 `mat` 与 `mate` 相似，有 “Cocos 的 伙伴” 的含义。

`cocomat` 目前主要包括：

* 一系列 UI 组件，如 `Toast`、`Loading`、`BackBtn` 等；
* 工具组件，如场景管理、截图工具、音频播放、View 管理、内存管理等；
* 一套自研无层级视频播放器。

### 关于meta文件行尾的问题

检出代码后，打开creator，可能会自动修改meta文件的行尾，导致看到大量meta文件为待提交的状态，可以在命令行输入以下配置，不对文件的行尾进行转换

`git config --global core.autocrlf false`

## 组件列表

| 组件名称 | 组件分类 | 用途 |
|-------| -----| ----- |
| [CCMSDFLabel](#) | UI 组件 | 基于SDF的字体渲染实现 |
| [CCMToast](#) | UI 组件 | 一款类似于 Android Toast 的吐司组件 |
| [CCMBackBtn](#) | UI 组件 | 返回按钮组件，搭配 CCMSceneManager，风味更佳 |
| [CCMFitWidget](#) | UI 组件 | 屏幕适配组件 |
| [CCMPicker](#) | UI 组件 | 选择器组件 |
| [CCMCategoryView](#) | UI 组件 | 相对复杂的宫格组件 |
| [CCMVideo](#) | UI 组件 | 一套同层渲染视频组件 |
| [CCMHanziWriter](#) | UI 组件 | 一个用于 CocosCreator 的 HanziWriter 项目 |
| [CCMResLoader](#) | 资源组件 | 封装资源的加载和卸载接口 |
| [CCMResLeakChecker](#) | 资源组件 | 内存泄露检查工具 |
| [CCMSceneManager](#) | 工具组件 | 受 Android Activity 启动模式启发，将其启动模式复刻到了 CocosCreator |
| [CCMAudioManager](#) | 工具组件 | 用来播放本地和远程音频文件 |
| [CCMCapture](#) | 工具组件 | 用来对指定节点进行截图 |
| [CCMUtils](#) | 工具组件 | 提供一些可以提高开发效率的方法 |
| [CCMImageLoader](#) | 工具组件 | 图片加载类，动态加载项目中或者远程图片（实验性功能） |
| [CCMSpineLoader](#) | 工具组件 | 骨骼动画加载类，动态加载项目中或者远程骨骼动画（实验性功能） |
| [CCMBinding](#) | 工具组件 | 一套在TS中绑定Native方法的框架，旨在抹平不同平台的调用差异（实验性功能） |

## 项目贡献者

按昵称首字母序（排名不分先后）：

[宝爷](https://forum.cocos.org/u/111304)，[bearhuang](https://blog.csdn.net/hbdatouerzi)，[buckethead](https://forum.cocos.org/u/moneycoder)，[陈皮皮](https://gitee.com/ifaswind)，coolcao，[大风起兮云飞扬](https://forum.cocos.org/u/1111926)，[渡鸦](https://forum.cocos.org/u/valiancer)，[galiohuang](https://4ndroidev.github.io/)，[jianfeili](http://lijianfei.com)，[honmono](https://forum.cocos.org/u/1099263878)，hughxnwang，[jrainliu](https://jrainlau.github.io/#/)，[khanzhang](https://github.com/QinGeneral)，legendyu，[next](https://github.com/potato47)，[nowpaper](https://github.com/Nowpaper)，[wzpan](https://github.com/wzpan)，[子龙山人](https://zilongshanren.com/)，[子山喵叔](https://forum.cocos.org/u/smilesnow0)