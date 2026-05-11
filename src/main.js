/*
 * @Author: YangRui
 * @Date: 2026-05-11 18:20:29
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-11 18:29:00
 * @Description: 请输入
 */
import Vue from 'vue'
import App from './App.vue'

// 👇 这两行就是引入 ElementUI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// 👇 让 Vue 使用 ElementUI
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')