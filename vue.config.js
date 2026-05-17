/*
 * @Author: YangRui
 * @Date: 2026-05-11 21:35:34
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-17 17:43:49
 * @Description: 请输入
 */
// 1. 从 @vue/cli-service 里拿到 defineConfig 工具
// 2. 导出 Vue CLI 的配置对象
const {
  defineConfig
} = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true, // 3. 自动转译依赖包（让项目兼容性更好）
  publicPath: "./", // 4. 打包时的静态资源路径 = 相对路径
  // 作用：部署到服务器子目录、本地打开dist都不会报错
  // 5. 开发服务器配置
  devServer: {
    open: true // 运行 npm run serve 后 → 自动打开浏览器
  },
})