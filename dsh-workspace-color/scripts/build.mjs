// 构建：把 src/ 的两份源码拼进 client.js（浏览器侧 bundle 无法 require，只能内联）。
//
//   node scripts/build.mjs          # 写入 client.js
//   node scripts/build.mjs --check  # 只校验 client.js 与 src/ 是否同步（CI 用，未同步则退出码 1）
//
// 改样式改 src/settings.css，改设置页组件改 src/settings-section.js；
// 不要直接改 client.js 里这两段——下次构建会被覆盖。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..')
const CLIENT = path.join(ROOT, 'client.js')
const CSS_SRC = path.join(ROOT, 'src', 'settings.css')
const SECTION_SRC = path.join(ROOT, 'src', 'settings-section.js')

// client.js 原样读（结尾换行要保住），src/ 两份读进来去掉行尾空白
const source = fs.readFileSync(CLIENT, 'utf8').replace(/\r\n/g, '\n')
const trim = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\s+$/, '')
const css = trim(CSS_SRC)
const section = trim(SECTION_SRC)

// CSS 要塞进模板字面量，这三个字符会炸掉 bundle
for (const bad of ['`', '${', '\\']) {
  if (css.includes(bad)) throw new Error('src/settings.css 含模板字面量非法字符: ' + JSON.stringify(bad))
}
if (section.includes('`')) throw new Error('src/settings-section.js 含反引号模板字面量，构建脚本用反引号做锚点，请改用字符串拼接')

let out = source

/* ① SETTINGS_CSS 常量体：从 `const SETTINGS_CSS = ` 到收尾反引号 */
const cssRe = /( {4}const SETTINGS_CSS = `\n)([\s\S]*?)(\n`\n)/
if (!cssRe.test(out)) {
  throw new Error(
    '找不到 SETTINGS_CSS 常量。若 client.js 还是 0.9.1 之前的版本（没有内联设置页样式），先补一次常量声明（见 README「开发」）再回来构建。',
  )
}
out = out.replace(cssRe, (_m, head, _old, tail) => head + css + tail)

/* ② 设置页区段：从分区注释头到 apply(ctx) 之间 */
const startMark = '    /* ============================================================================\n     * 设置页分区（React）'
const endMark = '\n\n    function apply(ctx) {'
const startAt = out.indexOf(startMark)
const endAt = out.indexOf(endMark)
if (startAt < 0) throw new Error('找不到设置页区段起点（分区注释头）')
if (endAt < 0 || endAt < startAt) throw new Error('找不到 apply(ctx) 锚点')
out = out.slice(0, startAt) + section + out.slice(endAt)

/* ③ 注入策略（只需改一次，之后是幂等的）：
      停用态也要注入设置页样式；启用态把它拼在主题 CSS 后面。 */
const disabledReady = "          tag.textContent = '/* 插件已停用 */\\n' + SETTINGS_CSS"
const disabledRaw = "          tag.textContent = '/* 插件已停用 */'"
if (!out.includes(disabledReady)) {
  if (!out.includes(disabledRaw)) throw new Error('找不到停用态注入分支')
  out = out.replace(disabledRaw, disabledReady)
}

const cssReady = "        let css = palette.css + '\\n' + CSS + '\\n' + SETTINGS_CSS"
const cssRaw = "        let css = palette.css + '\\n' + CSS\n"
if (!out.includes(cssReady)) {
  if (!out.includes(cssRaw)) throw new Error('找不到 rebuild 里的样式拼接行')
  out = out.replace(cssRaw, cssReady + '\n')
}

/* 收尾 */
const inSync = out === source
if (process.argv.includes('--check')) {
  if (inSync) console.log('client.js 与 src/ 同步 ✓')
  else {
    console.error('client.js 与 src/ 不同步，请跑 node scripts/build.mjs')
    process.exit(1)
  }
} else if (inSync) {
  console.log('无需改动，client.js 已是最新（' + source.split('\n').length + ' 行）')
} else {
  fs.writeFileSync(CLIENT, out, 'utf8')
  console.log('已构建 client.js：' + source.split('\n').length + ' → ' + out.split('\n').length + ' 行，' + Buffer.byteLength(out, 'utf8') + ' 字节')
}
