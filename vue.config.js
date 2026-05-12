/*
 * @Author: YangRui
 * @Date: 2026-05-11 21:35:34
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-12 21:47:27
 * @Description: 请输入
 */
const {
  defineConfig
} = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: "./" // 只需要加这一行！
})