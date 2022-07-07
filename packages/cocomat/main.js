'use strict';
const { paths, utils } = require('./utils');
const Path = require('path');
const Fs = require('fs-extra');

function remove(path) {
  if (Fs.existsSync(path)) {
    return Fs.remove(path);
  }
}

function copy(src, tar) {
  if (Fs.existsSync(src)) {
    return Fs.copy(src, tar, { overwrite: true });
  }
}

function restore() {
  const tasks = Promise.all([
    remove(paths.tarLibRoot),
    remove(paths.tarRes)
  ]);

  return new Promise((resolve) => {
    const opt = Editor.Dialog.messageBox({
      type: 'warning',
      buttons: [Editor.T('MESSAGE.ok'), Editor.T('MESSAGE.cancel')],
      title: Editor.T('MESSAGE.warning'),
      message: '将从项目中移除\n/coco-mat\n/assets/resources/cocomat\n插件仍会保留，是否继续？',
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (opt === 0) {
      tasks.then(() => {
        Editor.assetdb.refresh('db://coco-mat');
        Editor.assetdb.refresh('db://assets/resources');
        resolve();
        Editor.Dialog.messageBox({
          type: 'info',
          buttons: [Editor.T('MESSAGE.ok')],
          message: 'cocomat 移除完成',
          noLink: true
        });
      });
    }
  });
}

function checkExcludeModules() {
  return new Promise((resolve) => {
    utils.readUserSetting().then(settings => {
      if (settings && settings.excludeModules && settings.excludeModules.length) {
        setTimeout(() => {
          for (const module of settings.excludeModules) {
            removeModuleLib(module);
            remvoeModuleRes(module);
          }
          resolve();
        }, 100);
      } else {
        resolve();
      }
    });
  });

  function removeModuleLib(m) {
    const tarLib = Path.join(paths.tarLib, m);
    if (Fs.existsSync(tarLib)) {
      Fs.removeSync(tarLib);
      Fs.removeSync(`${tarLib}.meta`);
    }
  }

  function remvoeModuleRes(m) {
    const tarRes = Path.join(paths.tarRes, m);
    if (Fs.existsSync(tarRes)) {
      Fs.removeSync(tarRes);
      Fs.removeSync(`${tarRes}.meta`);
    }
  }
}

function install() {
  Promise.all([
    copy(paths.srcLib, paths.tarLib),
    copy(paths.srcRes, paths.tarRes)
  ])
    .then(checkExcludeModules)
    .then(() => {
      Editor.assetdb.refresh('db://coco-mat/lib');
      Editor.assetdb.refresh('db://assets/resources/cocomat');
      Editor.Dialog.messageBox({
        type: 'info',
        buttons: [Editor.T('MESSAGE.ok')],
        message: '安装完成！cocomat 安装到了以下位置：\n/coco-mat\n/assets/resources/cocomat',
        defaultId: 0,
        noLink: true
      });
    });
}

module.exports = {
  messages: {
    'install'() {
      install();
    },
    'restore'() {
      restore();
    },
    'open-setting'() {
      Editor.Panel.open('coco');
    },
    'read-setting'(event) {
      Promise.all([
        utils.readSysSetting(),
        utils.readUserSetting()
      ])
        .then(([sys, usr]) => {
          event.reply(null, Object.assign(sys, usr));
        });
    }
  },
};
