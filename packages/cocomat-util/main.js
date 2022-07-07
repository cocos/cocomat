'use strict';
const Path = require('path');
const Fs = require('fs-extra');

const cocomatRoot = Path.join(Editor.Project.path, 'packages/cocomat');
const cocomatLib = Path.join(cocomatRoot, 'coco-mat/lib');
const cocomatRes = Path.join(cocomatRoot, 'resources/cocomat');

const assetsLib = Path.join(Editor.Project.path, 'coco-mat/lib');
const assetsRes = Path.join(Editor.Project.path, 'assets/resources/cocomat');

function sync2package() {
  const tasks = [];

  const modules = Fs.readdirSync(assetsLib);
  for (const name of modules) {
    if (name.startsWith('.')) {
      continue;
    }
    const projlib = Path.join(assetsLib, name);
    const ccmlib = Path.join(cocomatLib, name);
    tasks.push({
      name: ccmlib,
      type: '代码',
      task: Fs.copy(projlib, ccmlib, { overwrite: true })
    });
  }

  const resources = Fs.readdirSync(assetsRes);
  for (const name of resources) {
    if (name.startsWith('.')) {
      continue;
    }
    const projres = Path.join(assetsRes, name);
    const ccmres = Path.join(cocomatRes, name);
    tasks.push({
      name: ccmres,
      type: '资源',
      task: Fs.copy(projres, ccmres, { overwrite: true })
    });
  }

  let i = 0;
  doTask();

  function doTask() {
    if (i >= tasks.length) {
      syncFinished();
      return;
    }
    const task = tasks[i];
    task.task.then(() => {
      Editor.log(`已同步：${task.type}`, task.name);
      i += 1;
      doTask();
    });
  }

  function syncFinished() {
    /* Editor.Dialog.messageBox({
      type: 'info',
      buttons: [Editor.T('MESSAGE.ok')],
      message: '同步完成！'
    }); */
    Editor.log('同步完成！');
  }
}

module.exports = {
  messages: {
    'sync-to-package': sync2package
  },
};
