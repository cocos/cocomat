const Path = require('path');
const Fs = require('fs-extra');

const usrSettingPath = Path.join(Editor.Project.path, 'settings/cocomat.json');

const packagePath = Path.join(Editor.Project.path, 'packages/cocomat');
const cocomatLibPath = Path.join(packagePath, 'coco-mat/lib');
const cocomatResPath = Path.join(packagePath, 'resources/cocomat');

const assetsLibPath = Path.join(Editor.Project.path, 'coco-mat/lib');
const assetsResPath = Path.join(Editor.Project.path, 'assets/resources/cocomat');

const template = `
<style>
    div.group {
      margin-right: 10px;
      margin-bottom: 10px;
    }
  </style>
  <div class="section" style="margin: 20;">
    <h1>模块设置</h1>
    <p>未勾选的模块在"构建发布"的时候不会打包进工程文件</p>
    <p>请不要将正在使用的功能模块去除，否则构建后的工程可能无法正常工作</p>
    <hr/>
  </div>
  <div class="scroll" style="padding: 20px;height: 480px;background-color: rgba(0,0,0,.2);margin: 20;">
    <li v-for="(i, m) in modules" track-by="$index" style="list-style-type: none">
      <div class="wrapper layout horizontal" style="padding-bottom: 10px;padding-top: 5px">
        <ui-checkbox checked="{{m.checked}}" id={{m.name}} @change="onCheckBoxChange(i)">{{m.name}}</ui-checkbox>
        <div v-if=m.dependences style="color:#fd942b; padding-left: 20px">
          {{m.dependences}}
        </div>
      </div>
    </li>
  </div>
  <div class="wrapper layout horizontal end-justified" style="padding-right: 20px">
    <ui-button style="width: 100px" class="green" @click="onSaveClick()">保存</ui-button>
  </div>
`;

Editor.Panel.extend({
  template,

  ready() {
    this.loadModuleSetting()
      .then(this.listModules.bind(this))
      .then(this.createWindow.bind(this));
  },

  createWindow(modules) {
    const self = this;
    this.win = new window.Vue({
      el: this.shadowRoot,
      data: {
        modules
      },
      methods: {
        onCheckBoxChange(i) {
          const self1 = this;
          const curModule = this.modules[i];
          curModule.checked = !curModule.checked;

          // check dependences

          const { moduleDependences } = self.settings;
          if (!curModule.checked) {
            if (isDependentByOthers(curModule.name)) {
              setTimeout(() => {
                curModule.checked = true;
              }, 10);
            }
          } else if (moduleDependences[curModule.name]) {
            for (const module of moduleDependences[curModule.name]) {
              const moduleData = getModuleData(module);
              if (moduleData) {
                moduleData.checked = true;
              }
            }
          }

          function getModuleData(moduleName) {
            return self1.modules.find(m => m.name === moduleName);
          }

          function isDependentByOthers(moduleName) {
            for (const module of Object.keys(moduleDependences)) {
              const moduleData = getModuleData(module);
              const isDependent = moduleDependences[module].indexOf(moduleName) > -1;
              if (moduleData && moduleData.checked && isDependent) {
                return true;
              }
            }
            return false;
          }
        },
        onSaveClick() {
          self.saveModuleSetting();
        }
      }
    });
  },

  loadModuleSetting() {
    return new Promise((resolve) => {
      Editor.Ipc.sendToMain('coco:read-setting', (err, settings) => {
        if (!err) {
          this.settings = settings;
          resolve(settings);
        }
      });
    });
  },

  saveModuleSetting() {
    this.settings.excludeModules = this.win.$data.modules.filter(m => !m.checked).map(m => m.name);
    saveSettingFile(this.settings.excludeModules);

    let libChanged = false;
    let resChanged = false;

    for (const m of this.allModules) {
      if (this.isExcluded(m)) {
        removeModuleLib(m);
        remvoeModuleRes(m);
      } else {
        addModuleLib(m);
        addModuleRes(m);
      }
    }

    if (libChanged || resChanged) {
      refreshFolder(resChanged);
    }

    function saveSettingFile(excludeModules) {
      const settings = {
        excludeModules
      };
      Fs.writeFile(usrSettingPath, JSON.stringify(settings, null, '\t'));
    }

    function removeModuleLib(m) {
      const tarLib = Path.join(assetsLibPath, m);
      if (Fs.existsSync(tarLib)) {
        Fs.removeSync(tarLib);
        Fs.removeSync(`${tarLib}.meta`);
        libChanged = true;
      }
    }

    function remvoeModuleRes(m) {
      const tarRes = Path.join(assetsResPath, m);
      if (Fs.existsSync(tarRes)) {
        Fs.removeSync(tarRes);
        Fs.removeSync(`${tarRes}.meta`);
        resChanged = true;
      }
    }

    function addModuleLib(m) {
      const srcLib = Path.join(cocomatLibPath, m);
      const tarLib = Path.join(assetsLibPath, m);
      if (Fs.existsSync(srcLib) && !Fs.existsSync(tarLib)) {
        Fs.copySync(srcLib, tarLib);
        Fs.copySync(`${srcLib}.meta`, `${tarLib}.meta`);
        libChanged = true;
      }
    }

    function addModuleRes(m) {
      const srcRes = Path.join(cocomatResPath, m);
      const tarRes = Path.join(assetsResPath, m);
      if (Fs.existsSync(srcRes) && !Fs.existsSync(tarRes)) {
        Fs.copySync(srcRes, tarRes);
        Fs.copySync(`${srcRes}.meta`, `${tarRes}.meta`);
        resChanged = true;
      }
    }

    function refreshFolder(resChanged) {
      setTimeout(() => {
        Editor.assetdb.refresh('db://coco-mat');
        resChanged && Editor.assetdb.refresh('db://assets/resources/cocomat');
      }, 500);
    }
  },

  listModules(settings) {
    const self = this;
    return new Promise((resolve) => {
      const modules = Fs.readdirSync(cocomatLibPath)
        .filter(filterIgnore)
        .filter(filterDirector)
        .map(wrapModule)
        .sort();

      this.allModules = modules.map(m => m.name);
      resolve(modules);
    });

    function filterIgnore(module) {
      return settings.ignoreModules.indexOf(module) === -1;
    }

    function filterDirector(module) {
      const path = Path.join(cocomatLibPath, module);
      const stat = Fs.lstatSync(path);
      return stat && stat.isDirectory();
    }

    function wrapModule(m) {
      const dependences = settings.moduleDependences;
      return {
        name: m,
        checked: !self.isExcluded(m, settings.excludeModules),
        dependences: dependences[m] ? `依赖: ${dependences[m].join(', ')}` : '',
        hasDependences: `${!!dependences[m]}`
      };
    }
  },

  isExcluded(moduleName, excludeModules) {
    const modules = excludeModules || this.settings.excludeModules;
    return modules.indexOf(moduleName) > -1;
  }
});
