import store from 'src/helper/store'
import fs from 'fs-extra'
import {cliOptionsType} from 'src/types'
import {MFOptions} from 'src/config'
class WpPluginOptions {
  public htmlWebpackPlugin = {}
  public moduleFederation: MFOptions = {}
  public definePlugin = {}
  private isESM = false
  constructor() {}
  public async setup() {
    this.isESM = ['es3', 'es5'].indexOf(store.config.build.target) === -1
    this.htmlWebpackPlugin = this.setHtmlWebpackPlugin()
    this.definePlugin = this.setDefinePlugin()
    this.moduleFederation = await this.setModuleFederation()
  }
  private setDefinePlugin() {
    const clist: cliOptionsType = store.cliOptions
    clist.mode = store.config.mode
    const defines: cliOptionsType = {}

    Object.keys(clist).map(key => {
      if (this.isESM && store.config.useImportMeta) defines[`import.meta.env.${key}`] = JSON.stringify(clist[key])
      else defines[`process.env.${key}`] = JSON.stringify(clist[key])
    })

    // console.log('defines', defines)
    return defines
  }
  private async setModuleFederation() {
    let mf: MFOptions = {}
    let {moduleFederation} = store.config
    if (moduleFederation) {
      if (typeof moduleFederation === 'function') {
        moduleFederation = await moduleFederation(store.config)
      }
      moduleFederation.filename = moduleFederation.filename || 'emp.js'
      // emp esm module
      if (!moduleFederation.library && this.isESM) {
        //TODO: 实验 MF 的 ESM 模式是否正常运行
        // moduleFederation.library = {type: 'module'}
        // moduleFederation.library = {type: 'window', name: moduleFederation.name}
      }
      mf = moduleFederation
    }
    return mf
  }
  private setHtmlWebpackPlugin() {
    let template = store.resolve('src/index.html')
    let favicon = store.resolve('src/favicon.ico')
    if (!fs.existsSync(template)) {
      template = store.empResolve('template/index.html')
    }
    if (!fs.existsSync(favicon)) {
      favicon = store.empResolve('template/favicon.ico')
    }
    console.log('store.config', store.config)
    return {
      title: 'EMP',
      template,
      chunks: ['index'],
      favicon,
      //
      // inject: false, //避免插入两个同样 js ::TODO 延展增加 node_modules
      //  filename: 'index.html',
      files: {
        css: store.wpo.externalAssets.css,
        js: store.wpo.externalAssets.js,
      },
      scriptLoading: ['es3', 'es5'].indexOf(store.config.build.target) > -1 ? 'defer' : 'module',
      minify: store.wpo.mode === 'production' && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }
  }
}

export default WpPluginOptions
