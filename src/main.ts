import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css';
import "codemirror/lib/codemirror.css";
import "codemirror/mode/css/css.js";

import App from './App.vue'
import { GlobalCmComponent } from "codemirror-editor-vue3";

const app = createApp(App);
app.use(GlobalCmComponent);
app.use(ElementPlus);
app.mount('#app')

