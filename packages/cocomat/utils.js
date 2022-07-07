const Path = require('path');
const Fs = require('fs-extra');

const rootPath = Editor.Project.path;
const paths = {
  root: rootPath,
  srcLib: Path.join(rootPath, 'packages/cocomat/coco-mat/lib'),
  tarLib: Path.join(rootPath, 'coco-mat/lib'),
  tarLibRoot: Path.join(rootPath, 'coco-mat'),
  srcRes: Path.join(rootPath, 'packages/cocomat/resources/cocomat'),
  tarRes: Path.join(rootPath, 'assets/resources/cocomat'),
  usrSetting: Path.join(rootPath, 'settings/cocomat.json'),
  sysSetting: Path.join(rootPath, 'packages/cocomat/settings.json')
};

const utils = {
  readUserSetting() {
    if (Fs.existsSync(paths.usrSetting)) {
      return new Promise((resolve, reject) => {
        Fs.readFile(paths.usrSetting).then(content => {
          resolve(JSON.parse(content));
        })
        .catch(err => {
          Editor.error('load cocomat custom settings failed', err);
          reject(err);
        });
      });
    }
    const settings = {
      excludeModules: []
    };
    return Promise.resolve(settings);
  },
  readSysSetting() {
    if (Fs.existsSync(paths.sysSetting)) {
      return new Promise((resolve, reject) => {
        Fs.readFile(paths.sysSetting).then(content => {
          resolve(JSON.parse(content));
        })
        .catch(err => {
          Editor.error('load cocomat default settings failed', err);
          reject(err);
        });
      });
    }
    const settings = {
      ignoreModules: [],
      moduleDependences: {}
    };
    return Promise.resolve(settings);
  }
};

module.exports = {
  paths,
  utils
};
