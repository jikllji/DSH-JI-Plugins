// client.js —— DSH 侧边栏：工作区身份色 + 父子层级色块。
//
// 纯展示层：只注入 CSS、给 DOM 打属性、在设置页注册一个分区；
// 不动数据、不动 app.asar、不改任何服务。
//
// 关键事实（均在 DSH 0.2.1-rc.2 源码里核实过）：
//
// 1. 每个工作区 = 一个 groupSection（renderGroup，WorkspaceBrowser.tsx:475-591），
//    内联 style 带 --dsh-workspace-indent = depth * 12px；子工作区经
//    <div role="group"> 递归渲染成更深一层的 groupSection，所以「父子工作区」
//    是真实的嵌套结构，色块可以按包含关系一层套一层。
//
// 2. 文件夹行 data-row-key="workspace:<id>"，会话行 data-row-key="session:<id>"；
//    每行外面还包了一层 HoverCard 的 span（display:block; position:relative），
//    所以任何 `section > row` 的直接子选择器都不成立——一律用后代选择器。
//
// 3. 行本身 padding-inline-start = 8px + indent，因此色块做逐层内缩后，
//    必须把行 padding 里多出来的那截减掉，标题位置才和原生完全一致。
//
// 4. 设置页：官方槽 settings.section（list / scope:'root'），插件 exports
//    声明 inject = ['slots'] 后在 apply 里 ctx.slots.inject(...) 注册即可，
//    晚注册也会立刻出现在设置导航里（见 vendor/ji-theme 的同款用法）。
//    注意：必须刷新页面才会加载新的 client bundle。
//
// 视觉规则（v0.9，按交互确认的设计）：
//   ① 每个工作区铺满自己整棵子树的背景块，子块在父块内逐层内缩
//      （左 8px / 右 4px，6 层封顶防止窄屏挤爆）；
//   ② 外浅内深：第 0 层最淡，越深越浓（blockBase + blockStep × depth）；
//   ③ 会话行保持透明，只随所在块；当前会话标题仍标红；
//   ④ 配色按层级：同一根分支内同层同色、隔层换色 —— 兄弟节点同色、
//      父子节点不同色；根工作区按自身 id 选起始色，步进量也由根 id 决定，
//      不同分支的色序自然错开。不画任何连线。
//   ⑤ 颜色预设：鼠标悬浮工作区行时，「⋯」左侧出现颜料板图标（和官方动作
//      按钮一起显隐），点开可选：12 个圆点 = 9 个彩色预设（颜色只由色相 H 决定，
//      明暗/饱和统一走 TONE 的 L/C，所以所有预设亮度一致）+ 白/灰/黑；
//      再点一次已选中的预设恢复层级自动；彩虹点 = 用系统取色器挑任意颜色
//      （默认只取色相、按主题协调化，可在设置里关闭）。自动配色改为
//      「让出背景色相 ±45° 冲突弧后均分」。
//      设置页导航里本分区也用颜料板图标。
//      手动颜色存 settings.overrides（workspaceId → 预设 id 或 #rrggbb），
//      由 resolveOverride 解析成内联 --ws-color / --ws-accent / --ws-weight。

window.__ModuleLoader__.load({
  id: 'dsh-workspace-color',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const name = 'dsh-workspace-color'
    const inject = ['slots']
    const STYLE_ID = 'dsh-workspace-color/style'
    const SECTION_ID = 'dsh-workspace-color'
/** 设置页导航里显示的分区名。 */
const SECTION_LABEL = '侧边栏配色'
    /** 自动配色的槽位数：6 个，色相环让出背景冲突弧后均分（45° 一档）。 */
    const PALETTE = 6
    /** 层级换色的步进量候选：与 6 互质（5 ≡ -1），保证父层 ≠ 子层且一档 45° 变化明显。 */
    const PALETTE_STEPS = [1, 5]
    /**
     * 取色浮层的彩色预设：只给「色相锚点」，实际颜色由 TONE（浅/深两套 L/C）实时生成，
     * 于是所有预设亮度一致、饱和一致、只有色相不同，和自动配色放在一起观感统一。
     */
    const HUE_PRESETS = [
      { id: 'h25', label: '红', H: 25 },
      { id: 'h55', label: '橙', H: 55 },
      { id: 'h95', label: '黄', H: 95 },
      { id: 'h145', label: '绿', H: 145 },
      { id: 'h195', label: '青', H: 195 },
      { id: 'h250', label: '蓝', H: 250 },
      { id: 'h275', label: '靛', H: 275 },
      { id: 'h305', label: '紫', H: 305 },
      { id: 'h345', label: '品红', H: 345 },
    ]
    /**
     * 无彩色预设：不能走 TONE（会把纯黑/纯白推成某个色相），单独给 tint、浓度倍率，
     * 以及浅/深两套主题各自的图标与文字色（否则浅色主题下白字看不见）。
     */
    const NEUTRAL_PRESETS = [
      { id: 'n-white', label: '白', tint: '#ffffff', weight: 1.8, accentLight: '#4b5563', accentDark: '#d1d5db' },
      { id: 'n-gray', label: '灰', tint: '#8b93a1', weight: 1, accentLight: '#4b5563', accentDark: '#c7ccd3' },
      { id: 'n-black', label: '黑', tint: '#000000', weight: 2.5, accentLight: '#111827', accentDark: '#9ca3af' },
    ]
    /** 全部预设 id（清洗 localStorage 里的 overrides 时用）。 */
    const PRESET_IDS = new Set([...HUE_PRESETS.map((p) => p.id), ...NEUTRAL_PRESETS.map((p) => p.id)])
    /** 系统取色器的兜底初值（中性灰）。 */
    const AUTO_DOT_COLOR = '#9aa0a6'

    /* ============================================================================
     * OKLCH 颜色引擎
     *
     * 为什么用 OKLCH 而不是直接写死 hex：它是感知均匀色彩空间，同样的 L 值
     * 人眼感受到的亮度一致。所以浅色/深色主题可以用「同一色相 + 不同亮度」
     * 生成一对颜色，观感统一，不会出现手工调色时浅色发灰、深色发艳的问题。
     *
     * 公式来源：Björn Ottosson (2020) OKLab/OKLCH，标准 sRGB 矩阵。
     * 纯计算，不碰 DOM。
     * ========================================================================= */

    /** OKLab → 线性 sRGB。 */
    function oklabToLinear(L, a, b) {
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b
      const s_ = L - 0.0894841775 * a - 1.291485548 * b
      const l = l_ * l_ * l_
      const m = m_ * m_ * m_
      const s = s_ * s_ * s_
      return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
      ]
    }

    /** 线性 sRGB → OKLab。 */
    function linearToOklab(r, g, b) {
      const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
      const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
      const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
      const l_ = Math.cbrt(l)
      const m_ = Math.cbrt(m)
      const s_ = Math.cbrt(s)
      return [
        0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
      ]
    }

    function encodeGamma(x) {
      return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    }

    function decodeGamma(x) {
      return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    }

    function toHex(rgb) {
      return (
        '#' +
        rgb
          .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'))
          .join('')
      )
    }

    /** 解析 #rgb / #rrggbb → [r,g,b]（0..1），非法返回 null。 */
    function parseHex(hex) {
      let h = String(hex || '').trim().replace(/^#/, '')
      if (h.length === 3) h = h.split('').map((c) => c + c).join('')
      if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
      return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
      ]
    }

    /**
     * OKLCH → hex。若饱和度超出该亮度下的 sRGB 色域，则逐步降低 C
     * 直到落入色域（色相与亮度保持不变），不产生非法色值。
     */
    function oklchToHex(L, C, Hdeg) {
      const hue = (Hdeg * Math.PI) / 180
      let c = Math.max(0, C)
      for (let i = 0; i < 60; i++) {
        const lin = oklabToLinear(L, c * Math.cos(hue), c * Math.sin(hue))
        const lo = Math.min(lin[0], lin[1], lin[2])
        const hi = Math.max(lin[0], lin[1], lin[2])
        if (lo >= -0.0001 && hi <= 1.0001) return toHex(lin.map((v) => encodeGamma(v)))
        c *= 0.96
        if (c < 0.0005) break
      }
      return toHex(oklabToLinear(L, c * Math.cos(hue), c * Math.sin(hue)).map((v) => encodeGamma(v)))
    }

    /** hex → { L, C, H }，非法返回 null。 */
    function hexToOklch(hex) {
      const rgb = parseHex(hex)
      if (!rgb) return null
      const [r, g, b] = rgb.map(decodeGamma)
      const [L, A, B] = linearToOklab(r, g, b)
      const C = Math.sqrt(A * A + B * B)
      let H = (Math.atan2(B, A) * 180) / Math.PI
      if (H < 0) H += 360
      return { L, C, H }
    }

    /** 亮度/饱和度档位：浅色用中等亮度，深色提亮并略降饱和。 */
    const TONE = {
      light: { L: 0.55, C: 0.11 },
      dark: { L: 0.76, C: 0.095 },
    }

    /** 色相环距离（0..180）。 */
    function hueDistance(a, b) {
      const d = Math.abs((((a % 360) + 360) % 360) - (((b % 360) + 360) % 360))
      return d > 180 ? 360 - d : d
    }

    /**
     * 生成 N 个槽位色相：均匀分布 + 避开背景色相（防撞色）。
     * 思路：把「冲突区」（以背景色相为中心、半宽 conflictDeg 的弧）整段让出来，
     * 在剩余安全弧里均匀取 N 个点；安全弧 = 360 − 2×conflictDeg。
     */
    function buildHues(count, bgHue, conflictDeg) {
      const n = Math.max(1, Math.floor(count))
      const gap = conflictDeg === undefined ? 45 : conflictDeg
      if (bgHue === null || bgHue === undefined || Number.isNaN(bgHue)) {
        return Array.from({ length: n }, (_, i) => (360 / n) * i)
      }
      const bg = ((bgHue % 360) + 360) % 360
      const safeStart = bg + gap
      const safeLen = 360 - 2 * gap
      if (safeLen <= 0) {
        return Array.from({ length: n }, (_, i) => (safeStart + (360 / n) * i) % 360)
      }
      const step = safeLen / n
      return Array.from({ length: n }, (_, i) => (safeStart + step * i + step / 2) % 360)
    }

    /** 当前主题：DSH 用 body[data-ds-dark-theme] 标识深色。 */
    function isDarkThemeNow() {
      return !!(document.body && document.body.hasAttribute('data-ds-dark-theme'))
    }

    /** 色相 → 指定设置下、当前主题的实色（预设色点与取色浮层共用）。 */
    function toneHex(settingsObj, H) {
      const s = settingsObj || defaultSettings()
      const tone = isDarkThemeNow() ? s.tone.dark : s.tone.light
      return oklchToHex(tone.L, tone.C, H)
    }

    /** 读取当前文档背景色相，用于防撞色；取不到返回 null（不避让）。 */
    function pageBackgroundHue() {
      const body = document.body
      if (!body) return null
      const raw = getComputedStyle(body).backgroundColor
      if (!raw || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)') {
        const html = document.documentElement
        const raw2 = html ? getComputedStyle(html).backgroundColor : ''
        const parsed2 = parseCssColor(raw2)
        if (parsed2) return hexToOklch(parsed2)?.H ?? null
        return null
      }
      const parsed = parseCssColor(raw)
      return parsed ? (hexToOklch(parsed)?.H ?? null) : null
    }

    /** 把 "rgb(r, g, b)" / "rgba(...)" 这类计算值转成 #rrggbb。 */
    function parseCssColor(str) {
      const m = String(str).match(/rgba?\(([^)]+)\)/i)
      if (!m) return null
      const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
      if (parts.length < 3 || parts.some((v) => Number.isNaN(v))) return null
      return toHex([parts[0] / 255, parts[1] / 255, parts[2] / 255])
    }

    /** 规范化 #rgb / #rrggbb → 小写 6 位；非法返回 ''。 */
    function normalizeHex(value) {
      const m = String(value === undefined || value === null ? '' : value)
        .trim()
        .match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
      if (!m) return ''
      const body = m[1].toLowerCase()
      if (body.length === 3) {
        return '#' + body.split('').map((c) => c + c).join('')
      }
      return '#' + body
    }

    /* ============================================================================
     * 用户设置（持久化到 localStorage）
     *
     * 配色属纯外观，localStorage 足够；要跨浏览器同步再考虑官方 Config。
     * ========================================================================= */

    const SETTINGS_KEY = 'dsh-workspace-color:settings'
    /** 更早的插件名用过的设置键，升级时迁移一次，避免已有设置被重置。 */
    const LEGACY_SETTINGS_KEYS = ['dsh-ji-sidebar-color:settings']

    function clamp(value, min, max) {
      const n = Number(value)
      if (!Number.isFinite(n)) return min
      return Math.min(max, Math.max(min, n))
    }

    /** 默认设置。overrides 记录「单个工作区手动挑的颜色」（预设 id 或 #rrggbb），缺省=按层级自动。 */
    function defaultSettings() {
      return {
        enabled: true,
        /** workspaceId → 自定义颜色（#rrggbb）。 */
        overrides: {},
        tone: { light: { L: 0.55, C: 0.11 }, dark: { L: 0.76, C: 0.095 } },
        /** 第 0 层色块混色比例（%）。 */
        blockBase: 6,
        /** 每深一层多混入的比例（%）。 */
        blockStep: 3,
        /** 当前会话标题标红。 */
        titleRed: true,
        /** 置顶图钉图标颜色（#rrggbb）；空字符串 = 跟随主题原生色。 */
        pinColor: '',
        /** 系统取色器挑的颜色是否只取色相、按主题统一重算明暗（true 更协调）。 */
        harmonizeCustom: true,
      }
    }

    /**
     * 清洗「工作区 → 颜色」映射：
     *  - 预设 id（'h25' / 'n-black' 这类）原样保留，颜色由当前主题实时计算；
     *  - #rgb / #rrggbb 视为用户自定义色（旧版本存的就是预设 hex，也兼容）。
     */
    function sanitizeOverrides(raw) {
      const out = {}
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
      for (const key of Object.keys(raw)) {
        if (!key) continue
        const value = String(raw[key] || '')
        if (PRESET_IDS.has(value)) {
          out[key] = value
          continue
        }
        const hex = normalizeHex(value)
        if (hex) out[key] = hex
      }
      return out
    }

    function loadSettings() {
      const base = defaultSettings()
      try {
        let raw = localStorage.getItem(SETTINGS_KEY)
        // 插件改名后旧键还在：迁移一次，避免用户已调好的设置被重置
        if (!raw) {
          for (const legacyKey of LEGACY_SETTINGS_KEYS) {
            const legacy = localStorage.getItem(legacyKey)
            if (!legacy) continue
            raw = legacy
            try {
              localStorage.setItem(SETTINGS_KEY, legacy)
              localStorage.removeItem(legacyKey)
            } catch (e) {
              /* 写入失败也继续用迁移来的值 */
            }
            break
          }
        }
        if (!raw) return base
        const saved = JSON.parse(raw)
        if (!saved || typeof saved !== 'object') return base
        return {
          enabled: saved.enabled !== false,
          overrides: sanitizeOverrides(saved.overrides),
          tone: {
            light: {
              L: clamp(saved.tone && saved.tone.light && saved.tone.light.L, 0.2, 0.98),
              C: clamp(saved.tone && saved.tone.light && saved.tone.light.C, 0, 0.3),
            },
            dark: {
              L: clamp(saved.tone && saved.tone.dark && saved.tone.dark.L, 0.2, 0.98),
              C: clamp(saved.tone && saved.tone.dark && saved.tone.dark.C, 0, 0.3),
            },
          },
          blockBase: clamp(saved.blockBase === undefined ? base.blockBase : saved.blockBase, 0, 20),
          blockStep: clamp(saved.blockStep === undefined ? base.blockStep : saved.blockStep, 0, 12),
          titleRed: saved.titleRed !== false,
          pinColor: normalizeHex(saved.pinColor) || '',
          harmonizeCustom: saved.harmonizeCustom !== false,
        }
      } catch (e) {
        return base
      }
    }

    function saveSettings(settings) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch (e) {
        /* 隐私模式等场景下写入失败，不影响运行 */
      }
    }

    // 调色板由 OKLCH 动态生成（见 buildPaletteCss），这里只保留与之无关的固定规则。
    // 浅色/深色两套色值运行时算好后注入 CSS 变量 --ws-color-N，下方规则只读变量。
    const CSS = `
/* ===== ① 层级色块：每个工作区铺满整棵子树，子块逐层内缩 =====
   外浅内深：第 0 层最淡，越深越浓（blockBase + blockStep × depth）。
   内缩：左侧 8px/层、右侧 4px/层（上限 6 层），给深层留出足够的标题宽度；
   根块之间留 6px 呼吸。 */
[data-ws-section]{
  --ws-depth:0;
  /* 手动颜色（--ws-accent / --ws-weight）只作用于本层：每层重置这两个变量，
     否则父层手动选色后会整棵子树继承同一个文字色/浓度，父子就分不开了。 */
  --ws-accent:initial;
  --ws-weight:1;
  --ws-inset-left:calc(8px * min(var(--ws-depth), 6));
  --ws-inset-right:calc(4px * min(var(--ws-depth), 6));
  --ws-mix:calc((var(--ws-base,6) + var(--ws-step,3) * var(--ws-depth)) * var(--ws-weight,1) * 1%);
  position:relative;
  margin-inline-start:var(--ws-inset-left);
  margin-inline-end:var(--ws-inset-right);
  border-radius:max(8px,calc(16px - 2px * var(--ws-depth)));
  background:color-mix(in srgb,var(--ws-color) var(--ws-mix),var(--dsw-specific-sidebar-fill,#f9fafb));
}
[data-ws-depth="0"]{--ws-depth:0}
[data-ws-depth="1"]{--ws-depth:1}
[data-ws-depth="2"]{--ws-depth:2}
[data-ws-depth="3"]{--ws-depth:3}
[data-ws-depth="4"]{--ws-depth:4}
[data-ws-depth="5"]{--ws-depth:5}
[data-ws-depth="6"]{--ws-depth:6}
[data-ws-depth="7"]{--ws-depth:7}
[data-ws-depth="8"]{--ws-depth:8}

/* 块内缩多少，行初始 padding 就补偿多少 —— 标题/图标位置与原生完全一致。 */
[data-ws-section] [data-row-key^="workspace:"],
[data-ws-section] [data-row-key^="session:"]{
  padding-inline-start:calc(8px + var(--dsh-workspace-indent,0px) - var(--ws-inset-left,0px));
}
/* 「显示更多会话」按钮同理：原生 28px + indent，补偿掉块内缩。 */
[data-ws-section] [data-row-key^="overflow:"]{
  padding-left:calc(28px + var(--dsh-workspace-indent,0px) - var(--ws-inset-left,0px));
}

/* 根工作区之间的呼吸感（原生是 4px）。 */
[data-ws-depth="0"] + [data-ws-depth="0"]{margin-top:6px;}

/* ② 文件夹图标 / 名称用身份实色；行底不再单独铺色（块已经铺满整棵子树），
   只让官方 hover / 选中高亮照常盖在上面。 */
[data-ws-row] > span:nth-child(1),
[data-ws-row] > span:nth-child(1) svg{color:var(--ws-accent,var(--ws-color));}
[data-ws-row] > span:nth-child(3) > span{color:var(--ws-accent,var(--ws-color));}

/* ③ 当前对话标题标红：钩子是官方自己在当前对话行上输出的 aria-selected="true"。
   标题恒为行的第 2 个子 span（class 是构建哈希，不可依赖），只染文字，
   时间/状态点/操作按钮保持原样。 */
:root{--ws-current-title:#D92B2B;--ws-palette-mask:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMDAwJyBzdHJva2Utd2lkdGg9JzEuOScgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJz48cGF0aCBkPSdNMTIgMy41YTguNSA4LjUgMCAxIDAgMCAxN2MxLjMgMCAyLS45IDItMS45IDAtMS0uOC0xLjUtLjgtMi40IDAtLjkuNy0xLjUgMS43LTEuNWgxLjhhNC4zIDQuMyAwIDAgMCA0LjMtNC4zYzAtMy45LTMuOS02LjktOS02Ljl6Jy8+PGNpcmNsZSBjeD0nNy42JyBjeT0nMTEuNCcgcj0nMS4wNScgZmlsbD0nIzAwMCcvPjxjaXJjbGUgY3g9JzkuNycgY3k9JzcuNCcgcj0nMS4wNScgZmlsbD0nIzAwMCcvPjxjaXJjbGUgY3g9JzE0LjEnIGN5PSc2LjknIHI9JzEuMDUnIGZpbGw9JyMwMDAnLz48Y2lyY2xlIGN4PScxNy4yJyBjeT0nOS42JyByPScxLjA1JyBmaWxsPScjMDAwJy8+PC9zdmc+");}
body[data-ds-dark-theme]{--ws-current-title:#FF6B6B;}
[data-row-key^="session:"][aria-selected="true"] > span:nth-child(2){color:var(--ws-current-title);}

/* ④ 取色入口：只在鼠标悬浮工作区行时出现，位置在行尾「⋯」左侧；
   隐藏时 display:none 不占宽度（和官方动作按钮同一套显隐节奏）。
   图标是中性颜料板，颜色由浮层里的圆点/取色器决定。 */
[data-ws-color-host]{
  display:none;align-items:center;flex:none;
  margin-inline:2px;
}
[data-ws-row]:hover > [data-ws-color-host],
[data-ws-row]:focus-within > [data-ws-color-host]{display:inline-flex;}
[data-ws-color-btn]{
  display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;padding:0;border:0;border-radius:6px;
  background:transparent;color:var(--dsw-alias-label-secondary,#8a8a8a);
  cursor:pointer;
}
[data-ws-color-btn]:hover{
  background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));
  color:var(--ws-accent,var(--ws-color));
}
[data-ws-color-btn]:focus-visible{outline:2px solid var(--ws-current-title);outline-offset:1px;}

/* ⑤ 官方设置页的导航栏：对未知分区会回退成齿轮图标；这里用同款颜料板线稿
   做 mask 把它换掉（只改视觉，不动 React 树里的节点）。 */
[data-ws-nav-palette] > svg{display:none;}
[data-ws-nav-palette]::before{
  content:'';flex:none;width:16px;height:16px;
  background-color:currentColor;
  -webkit-mask:var(--ws-palette-mask) center/16px 16px no-repeat;
  mask:var(--ws-palette-mask) center/16px 16px no-repeat;
  opacity:.85;
}

/* ⑥ 置顶图钉图标：官方固定用 --dsw-alias-label-caption 上色，这里允许设置页覆盖。
   --ws-pin-color 只在用户设置过颜色时才生成；未设置时回落到官方原色。
   选择器用 class 后缀定位（CSS Modules 哈希前缀不可依赖）。 */
[data-row-key^="session:"] [class*="pinIndicator"]{
  color:var(--ws-pin-color,var(--dsw-alias-label-caption));
}
`

    // 设置页样式：独立命名空间 ws-，只读 DSH 主题变量，深浅主题自动跟随。
    // 单独一份常量，是因为插件停用（CSS 被清空）时设置页仍要有正常样式。
    const SETTINGS_CSS = `
/* ===========================================================================
 * dsh-workspace-color 设置页
 * 命名空间 ws-；只依赖 DSH 主题变量，深浅主题自动跟随。
 * 结构：页头 → 预览 → 配色 → 标记
 * ========================================================================= */


.ws-set {
  /* 当前调色（色相槽位 0）的主色，滑杆 / 开关 / 色点共用这一支 */
  --ws-tint: #b0679f;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 564px;
  margin: 0 auto;
  color: var(--dsw-alias-label-primary);
  -webkit-font-smoothing: antialiased;
}

/* ---------------- 页头 ---------------- */
.ws-set-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 2px;
}
.ws-set-heading {
  flex: 1 1 auto;
  min-width: 0;
}
.ws-set-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: 0.005em;
}
.ws-set-sub {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}

/* ---------------- 卡片 ---------------- */
.ws-card {
  padding: 14px 15px 15px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  background: var(--dsw-alias-bg-module-platform);
}
.ws-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.ws-card-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}
.ws-card-note {
  flex: none;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}

/* 关闭插件后整块变淡并失去交互（页头开关留在外面，始终可点） */
.ws-set[data-enabled='false'] .ws-body {
  opacity: 0.42;
  pointer-events: none;
  transition: opacity 0.2s var(--ds-ease-in-out);
}

/* ---------------- 开关 ---------------- */
.ws-toggle {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.ws-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  margin: 0;
}
.ws-toggle-track {
  position: relative;
  width: 34px;
  height: 20px;
  flex: none;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 15%, transparent);
  transition: background 0.18s var(--ds-ease-in-out);
}
.ws-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dsw-alias-switch-thumb, #fff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: transform 0.18s var(--ds-ease-in-out);
}
.ws-toggle input:checked + .ws-toggle-track {
  background: var(--dsw-alias-brand-primary);
}
.ws-toggle input:checked + .ws-toggle-track .ws-toggle-thumb {
  transform: translateX(14px);
}
.ws-toggle input:focus-visible + .ws-toggle-track {
  outline: 2px solid var(--dsw-alias-link, #4d6bfe);
  outline-offset: 2px;
}
/* 行内开关的文字只留给读屏：行标题已经说明了它管什么，页头那个除外 */
.ws-toggle-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.ws-set-head .ws-toggle-label {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip-path: none;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}

/* ---------------- 分段控件 ---------------- */
.ws-seg {
  position: relative;
  flex: none;
  display: inline-flex;
  padding: 2px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
}
.ws-seg-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  border-radius: 7px;
  background: var(--dsw-alias-bg-base);
  box-shadow: var(--dsw-shadow-lv1);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.ws-seg[data-index='1'] .ws-seg-thumb {
  transform: translateX(100%);
}
/* 深色主题下换成亮一档的表面，否则拇指会陷进轨道里 */
body[data-ds-dark-theme] .ws-seg-thumb {
  background: var(--dsw-static-neutral-bluish-800, #353538);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.ws-seg-btn {
  position: relative;
  z-index: 1;
  appearance: none;
  border: 0;
  background: transparent;
  padding: 2px 12px;
  border-radius: 7px;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition: color 0.15s var(--ds-ease-in-out);
}
.ws-seg-btn.is-active {
  color: var(--dsw-alias-label-primary);
}

/* ---------------- 侧栏预览 ---------------- */
.ws-prev {
  --pv-bg: #f9fafb;
  --pv-label: #26282c;
  --pv-dim: #6d7177;
  --pv-folder: #9aa0a6;
  position: relative;
  padding: 7px 8px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 11px;
  background: var(--pv-bg);
  overflow: hidden;
  transition: background 0.25s var(--ds-ease-in-out);
}
.ws-prev[data-mode='dark'] {
  --pv-bg: #1b1b1c;
  --pv-label: #e9eaec;
  --pv-dim: #9aa0a6;
  --pv-folder: #7a7f86;
  border-color: rgba(255, 255, 255, 0.09);
}

.ws-pblk {
  --pv-mix: calc((var(--pv-base, 6) + var(--pv-step, 3) * var(--pv-d, 0)) * 1%);
  --pv-inset: calc(10px * var(--pv-d, 0));
  margin-inline: var(--pv-inset);
  border-radius: max(6px, calc(12px - 2px * var(--pv-d, 0)));
  background: color-mix(in srgb, var(--pv-hue, transparent) var(--pv-mix), var(--pv-bg));
  transition: background 0.28s var(--ds-ease-in-out);
}
/* 深度 → 内缩 / 浓度，与真实侧栏的 --ws-depth 一一对应 */
.ws-pblk[data-d='0'] {
  --pv-d: 0;
}
.ws-pblk[data-d='1'] {
  --pv-d: 1;
}
.ws-pblk[data-d='2'] {
  --pv-d: 2;
}
.ws-pblk[data-d='3'] {
  --pv-d: 3;
}
.ws-pblk[data-d='4'] {
  --pv-d: 4;
}
.ws-pblk + .ws-pblk {
  margin-top: 2px;
}
/* 同层相邻色块之间留一条缝，仍成组 */
.ws-pblk[data-d='0'] + .ws-pblk[data-d='0'] {
  margin-top: 6px;
}
.ws-prow {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding-inline: 7px;
  font-size: 12px;
  line-height: 22px;
  color: var(--pv-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-prow-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-prow-caret {
  flex: none;
  display: inline-flex;
  width: 9px;
  height: 9px;
  color: var(--pv-dim);
  opacity: 0.9;
}
.ws-prow-caret svg {
  width: 9px;
  height: 9px;
}
.ws-prow-icon {
  flex: none;
  display: inline-flex;
  width: 12px;
  height: 12px;
  color: var(--pv-folder);
}
.ws-prow-icon svg {
  width: 12px;
  height: 12px;
}
/* 工作区行：图标与名称吃身份色（已按明度 / 饱和度重算） */
.ws-prow[data-identity] {
  color: var(--pv-hue);
}
.ws-prow[data-identity] .ws-prow-icon {
  color: var(--pv-hue);
}
/* 会话行：内缩一级、压暗，不参与配色 */
.ws-prow--session {
  padding-inline-start: 22px;
  color: var(--pv-dim);
}
.ws-prow--session::before {
  content: '';
  flex: none;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.55;
  margin-inline-end: 2px;
}
.ws-prow--current,
.ws-prow--current.ws-prow--session {
  color: var(--ws-current-title, #d92b2b);
}
.ws-prev[data-mode='dark'] .ws-prow--current {
  color: #ff6b6b;
}
/* 关掉「标题标红」时，预览里的当前会话退回普通文字色 */
.ws-prev[data-title-red='false'] .ws-prow--current,
.ws-prev[data-title-red='false'] .ws-prow--current.ws-prow--session {
  color: var(--pv-dim);
}
/* 关闭插件后预览退化为无色底 */
.ws-set[data-enabled='false'] .ws-pblk {
  background: transparent;
}
.ws-set[data-enabled='false'] .ws-prow[data-identity] {
  color: var(--pv-label);
}
.ws-set[data-enabled='false'] .ws-prow[data-identity] .ws-prow-icon {
  color: var(--pv-folder);
}

/* ---------------- 两列（分隔线由伪元素画，不被 gap 截断） ---------------- */
.ws-cols {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 22px;
}
.ws-cols::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 3px;
  bottom: 3px;
  width: 0.5px;
  background: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
}
.ws-col {
  min-width: 0;
}
.ws-col-title {
  font-size: 11.5px;
  line-height: 16px;
  letter-spacing: 0.02em;
  color: var(--dsw-alias-label-tertiary);
  margin-bottom: 1px;
}

/* ---------------- 滑杆 ---------------- */
.ws-slider {
  padding: 4px 0 1px;
}
.ws-slider + .ws-slider {
  padding-top: 3px;
}
.ws-slider-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 1px;
}
.ws-slider-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
}
.ws-slider-value {
  flex: none;
  font-size: 11.5px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary);
  padding: 1px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
}
.ws-slider-hint {
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
  margin-bottom: 4px;
}

/* 已填充部分由 --fill 控制，深浅主题共用一条轨道 */
.ws-range {
  --fill: 50%;
  appearance: none;
  -webkit-appearance: none;
  display: block;
  width: 100%;
  height: 18px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
.ws-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--ws-tint) var(--fill),
    color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) var(--fill)
  );
}
.ws-range::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);
}
.ws-range::-moz-range-progress {
  height: 4px;
  border-radius: 2px;
  background: var(--ws-tint);
}
.ws-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 50%;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.12s var(--ds-ease-in-out);
}
.ws-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.ws-range:hover::-webkit-slider-thumb {
  transform: scale(1.08);
}
.ws-range:active::-webkit-slider-thumb {
  transform: scale(1.16);
}
.ws-range:focus-visible {
  outline: none;
}
.ws-range:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--dsw-alias-link, #4d6bfe);
  outline-offset: 1px;
}

/* ---------------- 色相槽位 ---------------- */
.ws-hues {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
}
.ws-hues-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
}
.ws-hue-dots {
  display: flex;
  gap: 7px;
  flex: none;
}
.ws-hue-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.28);
  transition: background 0.28s var(--ds-ease-in-out);
}

/* ---------------- 行（标记 / 覆盖） ---------------- */
.ws-rows {
  display: flex;
  flex-direction: column;
}
.ws-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 28px;
  padding: 4px 0;
}
.ws-rows--list .ws-row + .ws-row {
  border-top: 0.5px solid var(--dsw-alias-border-l1);
}
.ws-row-main {
  flex: 1 1 auto;
  min-width: 0;
}
.ws-row-label {
  font-size: 13px;
  line-height: 20px;
}
.ws-row-desc {
  margin-top: 1px;
  font-size: 11.5px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
}

/* ---------------- 按钮 ---------------- */
.ws-btn {
  appearance: none;
  flex: none;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  padding: 3px 10px;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transition: background 0.15s var(--ds-ease-in-out), color 0.15s var(--ds-ease-in-out);
}
.ws-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.ws-btn--quiet {
  border-color: transparent;
}
.ws-btn--danger:hover {
  color: var(--dsw-alias-state-error-primary);
}
.ws-btn[disabled] {
  opacity: 0.4;
  cursor: default;
}
.ws-btn[disabled]:hover {
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}

/* ---------------- 取色圆点 ---------------- */
.ws-swatch {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  /* 未自定义时显示主题原生的图钉色 */
  background: var(--dsw-alias-label-caption);
  box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.3);
  cursor: pointer;
  overflow: hidden;
}
.ws-swatch input {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}
.ws-swatch-code {
  flex: none;
  font-size: 11.5px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary);
  min-width: 58px;
}
.ws-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

/* 覆盖数小徽标 */
  flex: none;
  min-width: 18px;
  padding: 0 5px;
  height: 18px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary);
}
`

    /** sdbm 32-bit 稳定哈希：同一 workspaceId 永远落同一个预设下标。
     *  选 sdbm 而非 FNV-1a，是因为它对 UUID 这类 0-9a-f 十六进制串的桶分布更均匀。
     *  结果再按根工作区 + 嵌套深度步进，得到「同层同色、父子异色」的层级配色。 */
    function paletteIndex(id) {
      let h = 0
      for (let i = 0; i < id.length; i++) {
        h = (id.charCodeAt(i) + (h << 6) + (h << 16) - h) >>> 0
      }
      return h % PALETTE
    }

    /**
     * 生成调色板 CSS：为每个槽位产出 `--ws-color-N`（浅色）与深色覆盖，
     * 并把 [data-ws-row="N"] / [data-ws-section="N"] 的 --ws-color 指向它。
     * 色相环上与背景色相避让（让出 ±45° 冲突弧）后均分，颜色只由「明暗与饱和度」
     * 两个滑杆调质感。
     * @returns { css: string, hues: number[], light: string[], dark: string[] }
     */
    function buildPaletteCss(lightBgHue, darkBgHue, settings) {
      const st = settings || defaultSettings()
      const tone = st.tone || defaultSettings().tone
      const hues = buildHues(PALETTE, lightBgHue, 45)

      const light = hues.map((h) => oklchToHex(tone.light.L, tone.light.C, h))
      const dark = hues.map((h) => oklchToHex(tone.dark.L, tone.dark.C, h))

      const lines = []
      lines.push(':root{' + light.map((c, i) => `--ws-color-${i}:${c};`).join('') + '}')
      lines.push('body[data-ds-dark-theme]{' + dark.map((c, i) => `--ws-color-${i}:${c};`).join('') + '}')
      for (let i = 0; i < PALETTE; i++) {
        lines.push(`[data-ws-row="${i}"],[data-ws-section="${i}"]{--ws-color:var(--ws-color-${i});}`)
      }
      return { css: lines.join('\n'), hues, light, dark }
    }

    /* ============================================================================
     * 设置页分区（React）
     *
     * 结构：页头（标题 + 总开关）→ 实时预览 → 配色（层级色块 / 调色 + 色相槽位）→ 标记
     * 控件全部自绘，样式见 SETTINGS_CSS（命名空间 ws-），颜色一律读 DSH 主题变量，
     * 深浅主题自动跟随；预览里的色块与真实侧栏同一套混色公式。
     * ========================================================================= */

    function buildSettingsSection(deps) {
      const h = React.createElement
      const useState = React.useState

      const CARET_D = 'M2.5 4 5 6.5 7.5 4'
      const FOLDER_D =
        'M1.8 4.2A1.4 1.4 0 0 1 3.2 2.8h2.4l1.2 1.5h5a1.4 1.4 0 0 1 1.4 1.4v5.1a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4z'

      function Icon(props) {
        return h(
          'svg',
          {
            viewBox: props.box,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: props.weight,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': 'true',
          },
          h('path', { d: props.d }),
        )
      }

      function Toggle(props) {
        return h(
          'label',
          { className: 'ws-toggle' },
          h('input', {
            type: 'checkbox',
            checked: !!props.value,
            onChange: (e) => props.onChange(e.target.checked),
            'aria-label': props.name || undefined,
          }),
          h('span', { className: 'ws-toggle-track' }, h('span', { className: 'ws-toggle-thumb' })),
          props.name ? h('span', { className: 'ws-toggle-label' }, props.name) : null,
        )
      }

      /** 浅色 / 深色：同时决定预览用哪套配色、下面「调色」编辑哪个主题。 */
      function Seg(props) {
        const items = [
          { mode: 'light', text: '浅色' },
          { mode: 'dark', text: '深色' },
        ]
        return h(
          'div',
          {
            className: 'ws-seg',
            'data-index': props.value === 'dark' ? '1' : '0',
            role: 'group',
            'aria-label': '主题',
          },
          h('span', { className: 'ws-seg-thumb', 'aria-hidden': 'true' }),
          ...items.map((item) =>
            h(
              'button',
              {
                key: item.mode,
                type: 'button',
                className: 'ws-seg-btn' + (props.value === item.mode ? ' is-active' : ''),
                'aria-pressed': props.value === item.mode,
                onClick: () => props.onChange(item.mode),
              },
              item.text,
            ),
          ),
        )
      }

      function SliderRow(props) {
        const span = props.max - props.min || 1
        const fill = Math.max(0, Math.min(1, (props.value - props.min) / span)) * 100
        return h(
          'div',
          { className: 'ws-slider', title: props.hint || undefined },
          h(
            'div',
            { className: 'ws-slider-head' },
            h('span', { className: 'ws-slider-label' }, props.label),
            h('span', { className: 'ws-slider-value' }, props.valueText),
          ),
          h('input', {
            className: 'ws-range',
            type: 'range',
            min: props.min,
            max: props.max,
            step: props.step,
            value: props.value,
            style: { '--fill': fill + '%' },
            'aria-label': props.label,
            onChange: (e) => props.onChange(Number(e.target.value)),
          }),
        )
      }

      function CardHead(props) {
        return h(
          'div',
          { className: 'ws-card-head' },
          h('div', { className: 'ws-card-title' }, props.title),
          props.note ? h('div', { className: 'ws-card-note' }, props.note) : null,
          props.right || null,
        )
      }

      /* ---------------------------------------------------------------- 预览 */

      /** 示例树：三条根分支，其中一条带子工作区 —— 正好演示「同层同色、父子异色」。 */
      const PREVIEW_TREE = [
        {
          name: 'design-system',
          slot: 0,
          children: [{ name: 'tokens', slot: 1, sessions: ['重构设置页交互', '调色板避让背景色'], current: 1 }],
        },
        { name: 'client-app', slot: 3, sessions: ['状态栏配色'] },
        { name: '个人笔记', slot: 4, sessions: ['周报草稿'] },
      ]

      function previewBlock(node, depth, settings, colors) {
        const rows = [
          h(
            'div',
            { key: 'self', className: 'ws-prow', 'data-identity': '' },
            h('span', { className: 'ws-prow-caret' }, h(Icon, { box: '0 0 10 10', weight: 1.5, d: CARET_D })),
            h('span', { className: 'ws-prow-icon' }, h(Icon, { box: '0 0 16 16', weight: 1.4, d: FOLDER_D })),
            h('span', { className: 'ws-prow-name' }, node.name),
          ),
        ]
        for (const child of node.children || []) {
          rows.push(previewBlock(child, depth + 1, settings, colors))
        }
        ;(node.sessions || []).forEach((text, index) => {
          const current = node.current === index
          rows.push(
            h(
              'div',
              {
                key: 'session-' + index,
                className: 'ws-prow ws-prow--session' + (current ? ' ws-prow--current' : ''),
              },
              text,
            ),
          )
        })
        return h(
          'div',
          {
            key: node.name,
            className: 'ws-pblk',
            'data-d': String(Math.min(depth, 4)),
            style: {
              '--pv-hue': colors[node.slot % colors.length],
              '--pv-base': settings.blockBase,
              '--pv-step': settings.blockStep,
            },
          },
          ...rows,
        )
      }

      function Preview(props) {
        const colors = props.mode === 'dark' ? props.palette.dark : props.palette.light
        return h(
          'div',
          {
            className: 'ws-prev',
            'data-mode': props.mode,
            'data-title-red': props.settings.titleRed ? 'true' : 'false',
          },
          ...PREVIEW_TREE.map((node) => previewBlock(node, 0, props.settings, colors)),
        )
      }

      /* ------------------------------------------------------------ 分区本体 */

      function SidebarColorSection() {
        const [s, setS] = useState(() => deps.snapshot())
        const [mode, setMode] = useState('light')

        const commit = (patch) => {
          deps.update(patch)
          setS(deps.snapshot())
        }

        const live = deps.getPalette ? deps.getPalette() : null
        const palette = live && live.light ? live : buildPaletteCss(pageBackgroundHue(), null, s)
        const tint = (isDarkThemeNow() ? palette.dark : palette.light)[0]
        const tone = s.tone[mode]
        const customCount = Object.keys(s.overrides || {}).length
        const percent = (v) => (v % 1 === 0 ? String(v) : v.toFixed(1)) + '%'
        const pinValue = normalizeHex(s.pinColor)

        const toneSlider = (label, key, min, max, step, digits, hint) =>
          h(SliderRow, {
            key: key,
            label,
            hint,
            min,
            max,
            step,
            value: tone[key],
            valueText: String(Number(tone[key].toFixed(digits))),
            onChange: (v) => commit({ tone: { ...s.tone, [mode]: { ...s.tone[mode], [key]: v } } }),
          })

        return h(
          'div',
          {
            className: 'ws-set',
            'data-enabled': s.enabled ? 'true' : 'false',
            style: { '--ws-tint': tint },
          },
          // 页头：标题 + 总开关（开关留在变淡区之外，随时可点）
          h(
            'div',
            { className: 'ws-set-head' },
            h(
              'div',
              { className: 'ws-set-heading' },
              h('div', { className: 'ws-set-title' }, SECTION_LABEL),
              h('div', { className: 'ws-set-sub' }, '工作区按层级自动上色，父子区分、同层同色。'),
            ),
            h(Toggle, { value: s.enabled, onChange: (v) => commit({ enabled: v }), name: '启用' }),
          ),
          h(
            'div',
            { className: 'ws-body' },
            // ① 预览
            h(
              'section',
              { className: 'ws-card' },
              h(CardHead, { title: '预览', right: h(Seg, { value: mode, onChange: setMode }) }),
              h(Preview, { settings: s, mode, palette }),
            ),
            // ② 配色：层级色块 + 调色，两列并排
            h(
              'section',
              { className: 'ws-card' },
              h(CardHead, { title: '配色', note: '色相自动分配，避让页面底色' }),
              h(
                'div',
                { className: 'ws-cols' },
                h(
                  'div',
                  { className: 'ws-col' },
                  h('div', { className: 'ws-col-title' }, '层级色块'),
                  h(SliderRow, {
                    label: '最外层浓度',
                    hint: '第 0 层工作区混入身份色的比例，子块在此基础上逐层加深',
                    min: 0,
                    max: 20,
                    step: 0.5,
                    value: s.blockBase,
                    valueText: percent(s.blockBase),
                    onChange: (v) => commit({ blockBase: v }),
                  }),
                  h(SliderRow, {
                    label: '每层加深',
                    hint: '每深一层多混入的比例，0 表示所有层级同色',
                    min: 0,
                    max: 12,
                    step: 0.5,
                    value: s.blockStep,
                    valueText: percent(s.blockStep),
                    onChange: (v) => commit({ blockStep: v }),
                  }),
                ),
                h(
                  'div',
                  { className: 'ws-col' },
                  h('div', { className: 'ws-col-title' }, '调色 · ' + (mode === 'dark' ? '深色' : '浅色')),
                  toneSlider('明度', 'L', 0.35, 0.95, 0.01, 2, '当前主题下身份色的明度 L（OKLCH）'),
                  toneSlider('饱和度', 'C', 0.01, 0.2, 0.005, 3, '当前主题下身份色的饱和度 C（OKLCH）'),
                ),
              ),
              h(
                'div',
                { className: 'ws-hues' },
                h('span', { className: 'ws-hues-label' }, '自动色相 · ' + PALETTE + ' 个槽位'),
                h(
                  'span',
                  { className: 'ws-hue-dots' },
                  ...(mode === 'dark' ? palette.dark : palette.light).map((color, i) =>
                    h('span', { key: 'hue-' + i, className: 'ws-hue-dot', style: { background: color } }),
                  ),
                ),
              ),
            ),
            // ③ 标记
            h(
              'section',
              { className: 'ws-card' },
              h(CardHead, { title: '标记', note: '只影响视觉，不改动数据' }),
              h(
                'div',
                { className: 'ws-rows ws-rows--list' },
                h(
                  'div',
                  { className: 'ws-row' },
                  h('div', { className: 'ws-row-main' }, h('div', { className: 'ws-row-label' }, '当前会话标题标红')),
                  h(Toggle, { value: s.titleRed, onChange: (v) => commit({ titleRed: v }), name: '标题标红' }),
                ),
                h(
                  'div',
                  { className: 'ws-row' },
                  h(
                    'div',
                    { className: 'ws-row-main' },
                    h('div', { className: 'ws-row-label' }, '置顶图钉颜色'),
                    h('div', { className: 'ws-row-desc' }, '留空则跟随主题原生色'),
                  ),
                  h(
                    'div',
                    { className: 'ws-row-actions' },
                    h(
                      'span',
                      { className: 'ws-swatch', style: pinValue ? { background: pinValue } : undefined },
                      h('input', {
                        type: 'color',
                        value: pinValue || '#9aa0a6',
                        title: '选择图钉颜色',
                        'aria-label': '置顶图钉颜色',
                        onChange: (e) => commit({ pinColor: e.target.value }),
                      }),
                    ),
                    h('span', { className: 'ws-swatch-code' }, pinValue ? pinValue.toUpperCase() : '跟随主题'),
                    pinValue
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'ws-btn ws-btn--quiet',
                            onClick: () => commit({ pinColor: '' }),
                          },
                          '默认',
                        )
                      : null,
                  ),
                ),
                h(
                  'div',
                  { className: 'ws-row' },
                  h(
                    'div',
                    { className: 'ws-row-main' },
                    h('div', { className: 'ws-row-label' }, '自定义色只取色相'),
                    h('div', { className: 'ws-row-desc' }, '按主题统一重算明暗与饱和，黑白灰不受影响'),
                  ),
                  h(Toggle, {
                    value: s.harmonizeCustom !== false,
                    onChange: (v) => commit({ harmonizeCustom: v }),
                    name: '自定义色只取色相',
                  }),
                ),
                h(
                  'div',
                  { className: 'ws-row' },
                  h(
                    'div',
                    { className: 'ws-row-main' },
                    h('div', { className: 'ws-row-label' }, '单独取色的工作区'),
                    h('div', { className: 'ws-row-desc' }, '行尾「⋯」左侧的颜料板里可单独指定'),
                  ),
                  h(
                    'div',
                    { className: 'ws-row-actions' },
                    customCount > 0 ? h('span', { className: 'ws-count' }, String(customCount)) : null,
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'ws-btn',
                        onClick: () => commit({ overrides: {} }),
                        disabled: customCount === 0,
                      },
                      '清除',
                    ),
                  ),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'ws-foot' },
            h(
              'button',
              { type: 'button', className: 'ws-btn ws-btn--quiet', onClick: () => commit(defaultSettings()) },
              '恢复默认',
            ),
          ),
        )
      }

      return SidebarColorSection
    }

    function apply(ctx) {
      const settings = loadSettings()
      /** 最近一次生成的调色板，供设置页展示色块。 */
      let palette = null
      let lightBgHue = null
      let darkBgHue = null
      let tag = null

      /** 依据当前设置重建样式并写入 <style>。 */
      function rebuild() {
        if (!tag) return
        if (!settings.enabled) {
          tag.textContent = '/* 插件已停用 */\n' + SETTINGS_CSS
          return
        }
        palette = buildPaletteCss(lightBgHue, darkBgHue, settings)
        let css = palette.css + '\n' + CSS + '\n' + SETTINGS_CSS
        css += '\n:root{--ws-base:' + settings.blockBase + ';--ws-step:' + settings.blockStep + ';}'
        // 置顶图钉颜色：留空就不生成变量，CSS 里回落到官方原色
        if (settings.pinColor) css += '\n:root{--ws-pin-color:' + settings.pinColor + ';}'
        // 红色标记开关：关闭时把变量覆盖掉，等于不生效
        if (!settings.titleRed) {
          css += '\n[data-row-key^="session:"][aria-selected="true"] > span:nth-child(2){color:inherit !important;}'
        }
        tag.textContent = css
        try {
          window.__wsColorPalette = {
            lightBgHue,
            darkBgHue,
            hues: palette.hues.map((h) => Math.round(h)),
            light: palette.light,
            dark: palette.dark,
            settings,
          }
        } catch (e) {
          /* 诊断字段非必需 */
        }
      }

      /**
       * 给 DOM 打标签：
       *  - 文件夹行 → data-ws-row=<调色板槽位>
       *  - 其 groupSection → data-ws-section=<槽位> + data-ws-depth=<嵌套深度>
       * 深度从内联 --dsh-workspace-indent（depth * 12px）换算，和官方缩进同源。
       *
       * 配色规则：颜色由「根工作区 + 嵌套深度」决定 ——
       *   同一根分支内，同层同色、隔层换色（兄弟节点同色，父子节点不同色）；
       *   根工作区按自身 id 选起始色，步进量也由根 id 决定，不同分支色序错开。
       */
      function retag() {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          if (!settings.enabled) {
            clearTags()
            return
          }
          const rows = document.querySelectorAll(
            '[data-row-key^="workspace:"]:not([data-row-key="workspace:"])',
          )
          const now = new Set()
          /** groupSection → 它所属的根工作区 id（决定整条分支的色序）。 */
          const sectionRoots = new Map()
          for (const row of rows) {
            const key = row.getAttribute('data-row-key')
            const id = key.slice('workspace:'.length)
            const section = sectionOf(row)
            let rootId = id
            if (section) {
              const parentSection = sectionOfSection(section)
              const parentRoot = parentSection ? sectionRoots.get(parentSection) : undefined
              if (parentRoot) rootId = parentRoot
              sectionRoots.set(section, rootId)
            }
            const depth = section ? sectionDepth(section) : 0
            const base = paletteIndex(rootId)
            const step = PALETTE_STEPS[base % PALETTE_STEPS.length]
            const pos = String((base + depth * step) % PALETTE)
            if (row.getAttribute('data-ws-row') !== pos) row.setAttribute('data-ws-row', pos)
            now.add(row)
            // 手动挑过颜色：解析成内联变量覆盖属性映射；没挑过则清掉覆盖回自动。
            const override = settings.overrides ? settings.overrides[id] : ''
            const resolved = resolveOverride(override)
            setInlineColor(row, resolved)
            if (section) {
              setInlineColor(section, resolved)
              if (section.getAttribute('data-ws-section') !== pos) section.setAttribute('data-ws-section', pos)
              const depthText = String(depth)
              if (section.getAttribute('data-ws-depth') !== depthText) section.setAttribute('data-ws-depth', depthText)
              now.add(section)
            }
            ensureColorButton(row, id)
          }
          // 清掉不再被选中的元素上的旧标签（行/组被移除或切换分组模式时）。
          for (const el of tagged) {
            if (!now.has(el)) {
              for (const attr of ['data-ws-row', 'data-ws-section', 'data-ws-depth']) {
                if (el.hasAttribute(attr)) el.removeAttribute(attr)
              }
            }
          }
          tagged.clear()
          for (const el of now) tagged.add(el)
          // 设置页可能在任何时刻打开/重渲染，顺手把导航图标补成颜料板。
          patchSettingsNav()
        })
      }

      let raf = 0
      /** 当前携带 data-ws-* 的元素集合，卸载/重打时清理用。 */
      const tagged = new Set()

      /** 清掉所有打过的标签与取色按钮（停用/卸载时恢复原生）。 */
      function clearTags() {
        for (const el of document.querySelectorAll('[data-ws-color-host]')) el.remove()
        for (const el of document.querySelectorAll('[data-ws-nav-palette]')) {
          el.removeAttribute('data-ws-nav-palette')
        }
        for (const el of tagged) {
          for (const attr of ['data-ws-row', 'data-ws-section', 'data-ws-depth']) {
            if (el.hasAttribute(attr)) el.removeAttribute(attr)
          }
          for (const prop of ['--ws-color', '--ws-accent', '--ws-weight']) {
            if (el.style.getPropertyValue(prop)) el.style.removeProperty(prop)
          }
        }
        tagged.clear()
      }

      /** 色相 → 当前设置、当前主题下的实色。 */
      function hueColorNow(H) {
        return toneHex(settings, H)
      }

      /**
       * 把 overrides 里存的值解析成一组内联变量：
       *  { color 铺块色, accent 图标/标题色, weight 浓度倍率 }；无法解析返回 null。
       *  - 色相预设 → 由 TONE 实时生成（切换主题自动跟随）；
       *  - 无彩色预设 → 固定 tint + 主题各自的文字色；
       *  - 自定义 hex → 默认「协调化」：只取色相 H，明暗/饱和度用 TONE 重算；
       *    关掉 harmonizeCustom 或颜色接近无彩色时保留原色。
       */
      function resolveOverride(override) {
        if (!override) return null
        const value = String(override)
        if (!value.startsWith('#')) {
          const huePreset = HUE_PRESETS.find((p) => p.id === value)
          if (huePreset) {
            const c = hueColorNow(huePreset.H)
            return { color: c, accent: c, weight: '' }
          }
          const neutral = NEUTRAL_PRESETS.find((p) => p.id === value)
          if (neutral) {
            return {
              color: neutral.tint,
              accent: isDarkThemeNow() ? neutral.accentDark : neutral.accentLight,
              weight: String(neutral.weight),
            }
          }
          return null
        }
        const hex = normalizeHex(value)
        if (!hex) return null
        if (settings.harmonizeCustom !== false) {
          const oklch = hexToOklch(hex)
          // 黑/白/灰没有色相可借，保留原色，否则会被 TONE 推成某个彩色。
          if (oklch && oklch.C >= 0.02) {
            const c = hueColorNow(oklch.H)
            return { color: c, accent: c, weight: '' }
          }
        }
        return { color: hex, accent: hex, weight: '' }
      }

      /** 手动颜色用内联变量覆盖该工作区；resolved 为 null 则移除覆盖、回到层级自动。 */
      function setInlineColor(el, resolved) {
        if (!el) return
        const style = el.style
        const set = (name, value) => {
          if (value) {
            if (style.getPropertyValue(name) !== value) style.setProperty(name, value)
          } else if (style.getPropertyValue(name)) {
            style.removeProperty(name)
          }
        }
        set('--ws-color', resolved ? resolved.color : '')
        set('--ws-accent', resolved ? resolved.accent : '')
        set('--ws-weight', resolved ? resolved.weight : '')
      }

      /** 颜料板线稿图标（中性色，不吃 --ws-color）。 */
      const PALETTE_ICON_SVG =
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 2-.9 2-1.9 0-1-.8-1.5-.8-2.4 0-.9.7-1.5 1.7-1.5h1.8a4.3 4.3 0 0 0 4.3-4.3c0-3.9-3.9-6.9-9-6.9z"/>' +
        '<circle cx="7.6" cy="11.4" r="1.05" fill="currentColor" stroke="none"/>' +
        '<circle cx="9.7" cy="7.4" r="1.05" fill="currentColor" stroke="none"/>' +
        '<circle cx="14.1" cy="6.9" r="1.05" fill="currentColor" stroke="none"/>' +
        '<circle cx="17.2" cy="9.6" r="1.05" fill="currentColor" stroke="none"/>' +
        '</svg>'

      /** 给工作区行末尾补一个颜料板图标（悬浮才显示；同一行只加一次）。 */
      function ensureColorButton(row, id) {
        const existing = row.querySelector(':scope > [data-ws-color-host]')
        if (existing) {
          const btn = existing.querySelector('[data-ws-color-btn]')
          if (btn && btn.dataset.wsId !== id) btn.dataset.wsId = id
          return
        }
        const host = document.createElement('span')
        host.setAttribute('data-ws-color-host', '1')
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.setAttribute('data-ws-color-btn', '1')
        btn.setAttribute('aria-label', '选择工作区颜色')
        btn.title = '工作区颜色'
        btn.dataset.wsId = id
        btn.innerHTML = PALETTE_ICON_SVG
        // 悬浮动作按钮别让行点击/拖拽事件接走（DSH 行有自己的一套 handler）。
        btn.addEventListener('mousedown', (e) => e.stopPropagation())
        btn.addEventListener('pointerdown', (e) => e.stopPropagation())
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          openColorPicker(btn, btn.dataset.wsId)
        })
        host.appendChild(btn)
        // 放在行尾动作按钮（⋯ / ⊕）左侧；找不到动作容器时退回追加到行尾。
        const actions = row.querySelector(':scope > [class*="rowActions"]')
        if (actions) row.insertBefore(host, actions)
        else row.appendChild(host)
      }

      /** 设置页导航里的分区标题（与 settings.section 注册的 label 保持一致）。 */
      function patchSettingsNav() {
        const labels = document.querySelectorAll('span[class*="navLabel"]')
        for (const label of labels) {
          if (!label.textContent || label.textContent.trim() !== SECTION_LABEL) continue
          const btn = label.closest('button')
          if (!btn || btn.getAttribute('data-ws-nav-palette') === '1') continue
          // 官方对未知分区回退齿轮图标；打标记后由 CSS mask 换成颜料板。
          btn.setAttribute('data-ws-nav-palette', '1')
        }
      }

      /* ---- 预设色板浮层（原生 DOM，独立于 React 树） ---- */
      let picker = null
      let pickerCleanup = null

      function closeColorPicker() {
        if (pickerCleanup) {
          pickerCleanup()
          pickerCleanup = null
        }
        if (picker) {
          picker.remove()
          picker = null
        }
      }

      /**
       * 点颜料板图标后弹出圆点面板：
       *   11 个圆点 = 固定预设色（再点一次已选色 = 取消手动颜色、回到层级自动）；
       *   彩虹点 = 里面藏一个原生 <input type="color">，点开系统取色器挑任意颜色。
       * 选中后写进 settings.overrides（workspaceId → #rrggbb）并持久化。
       */
      function openColorPicker(anchor, id) {
        closeColorPicker()
        if (!id) return
        const row = anchor.closest('[data-row-key^="workspace:"]')
        const section = row ? sectionOf(row) : null
        const probe = row || section
        const override = settings.overrides ? settings.overrides[id] : ''
        // 系统取色器的初值优先用手动选的「身份色」；没选过则读当前生效的层级色。
        let currentHex = normalizeHex(override)
        if (!currentHex && probe) {
          const raw = getComputedStyle(probe).getPropertyValue('--ws-color').trim()
          currentHex = normalizeHex(raw)
          if (!currentHex) {
            const parsed = parseCssColor(raw)
            currentHex = parsed ? normalizeHex(parsed) : ''
          }
        }
        if (!currentHex) currentHex = AUTO_DOT_COLOR
        const pick = (hex) => {
          settings.overrides = { ...(settings.overrides || {}) }
          if (hex) settings.overrides[id] = hex
          else delete settings.overrides[id]
          saveSettings(settings)
          retag()
        }

        const box = document.createElement('div')
        box.setAttribute('data-ws-picker', '1')
        box.setAttribute('role', 'dialog')
        box.setAttribute('aria-label', '工作区颜色')
        box.style.cssText = [
          'position:fixed',
          'z-index:2147483000',
          // 13 个圆点 = 12 个预设（9 彩色 + 3 无彩色）+ 彩虹点 → 两排 7 + 6。
          'display:grid',
          'grid-template-columns:repeat(7,22px)',
          'gap:8px',
          'padding:10px',
          'background:var(--dsw-alias-bg-layer-2,#2b2b2c)',
          'border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.22))',
          'border-radius:14px',
          'box-shadow:0 10px 30px rgba(0,0,0,.28)',
        ].join(';')

        /** 圆点样式：22px 实心圆，选中项外加描边。 */
        const dotCss = (color, selected) =>
          [
            'width:22px',
            'height:22px',
            'padding:0',
            'border:0',
            'border-radius:50%',
            'background:' + color,
            'cursor:pointer',
            'box-shadow:0 0 0 1px rgba(127,127,127,.35)',
            selected
              ? 'outline:2px solid var(--dsw-alias-label-primary,#111);outline-offset:2px'
              : 'outline:2px solid transparent;outline-offset:2px',
          ].join(';')

        // ① 预设圆点：9 个色相锚点（颜色由 TONE 实时生成）+ 白/灰/黑，共 12 个。
        //    再点一次已选中的预设 = 取消手动颜色、回到层级自动（不额外放「自动」圆点）。
        const presetDots = [
          ...HUE_PRESETS.map((p) => ({ id: p.id, label: p.label, color: hueColorNow(p.H) })),
          ...NEUTRAL_PRESETS.map((p) => ({ id: p.id, label: p.label, color: p.tint })),
        ]
        for (const dot of presetDots) {
          const selected = override === dot.id
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.title = selected ? dot.label + '（再点一次恢复层级自动）' : dot.label
          btn.setAttribute('data-ws-dot', dot.id)
          btn.style.cssText = dotCss(dot.color, selected)
          btn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            pick(selected ? '' : dot.id)
            closeColorPicker()
          })
          box.appendChild(btn)
        }

        // ③ 彩虹点：包一个透明的原生 color input，点开系统取色器
        // ③ 彩虹点：包一个透明的原生 color input，点开系统取色器（选了自定义色时高亮）
        const customSelected = typeof override === 'string' && override.startsWith('#')
        const custom = document.createElement('label')
        custom.title = '自定义颜色'
        custom.setAttribute('data-ws-dot', 'custom')
        custom.style.cssText = [
          'position:relative',
          'width:22px',
          'height:22px',
          'border-radius:50%',
          'cursor:pointer',
          'background:conic-gradient(from 90deg,#ff5f5f,#ffd166,#8bd17c,#5cc8ff,#c58cff,#ff5f5f)',
          'box-shadow:0 0 0 1px rgba(127,127,127,.35)',
          customSelected
            ? 'outline:2px solid var(--dsw-alias-label-primary,#111);outline-offset:2px'
            : 'outline:2px solid transparent;outline-offset:2px',
        ].join(';')
        const input = document.createElement('input')
        input.type = 'color'
        input.value = currentHex
        input.setAttribute('aria-label', '自定义颜色')
        input.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;opacity:0;cursor:pointer;'
        input.addEventListener('input', () => {
          const hex = normalizeHex(input.value)
          if (hex) pick(hex)
        })
        input.addEventListener('change', () => closeColorPicker())
        custom.appendChild(input)
        box.appendChild(custom)

        document.body.appendChild(box)
        picker = box

        const rect = anchor.getBoundingClientRect()
        const w = box.offsetWidth || 260
        const h = box.offsetHeight || 40
        const left = Math.max(8, Math.min(rect.right - w, window.innerWidth - w - 8))
        let top = rect.bottom + 6
        if (top + h > window.innerHeight - 8) top = Math.max(8, rect.top - h - 6)
        box.style.left = left + 'px'
        box.style.top = top + 'px'

        const onDown = (ev) => {
          if (!picker) return
          if (box.contains(ev.target) || anchor.contains(ev.target)) return
          closeColorPicker()
        }
        const onKey = (ev) => {
          if (ev.key === 'Escape') closeColorPicker()
        }
        const onScroll = (ev) => {
          if (box.contains(ev.target)) return
          closeColorPicker()
        }
        document.addEventListener('mousedown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll, true)
        pickerCleanup = () => {
          document.removeEventListener('mousedown', onDown, true)
          document.removeEventListener('keydown', onKey, true)
          window.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('resize', onScroll, true)
        }
      }

      /** 从行向上找「最近带 --dsh-workspace-indent 内联样式的祖先」= groupSection。 */
      function sectionOf(row) {
        let el = row.parentElement
        while (el && el !== document.body && el !== document.documentElement) {
          if (el.style && el.style.getPropertyValue('--dsh-workspace-indent') !== '') return el
          el = el.parentElement
        }
        return null
      }

      /** 从某层 groupSection 向上找它所属的父 groupSection；根工作区返回 null。 */
      function sectionOfSection(section) {
        let el = section.parentElement
        while (el && el !== document.body && el !== document.documentElement) {
          if (el.style && el.style.getPropertyValue('--dsh-workspace-indent') !== '') return el
          el = el.parentElement
        }
        return null
      }

      /** 嵌套深度：--dsh-workspace-indent 是 depth * 12px。 */
      function sectionDepth(section) {
        const raw = section.style.getPropertyValue('--dsh-workspace-indent')
        const n = parseInt(raw, 10)
        return Number.isFinite(n) && n >= 0 ? Math.round(n / 12) : 0
      }

      ctx.effect(() => {
        tag = document.createElement('style')
        tag.id = STYLE_ID
        document.head.appendChild(tag)

        // 背景色相只在插件挂载时测一次；主题切换会改变背景，故浅/深各测一次。
        const wasDark = document.body && document.body.hasAttribute('data-ds-dark-theme')
        lightBgHue = (() => {
          if (wasDark && document.body) document.body.removeAttribute('data-ds-dark-theme')
          const h = pageBackgroundHue()
          if (wasDark && document.body) document.body.setAttribute('data-ds-dark-theme', '')
          return Number.isFinite(h) ? h : null
        })()
        if (document.body) {
          document.body.setAttribute('data-ds-dark-theme', '')
          const h = pageBackgroundHue()
          darkBgHue = Number.isFinite(h) ? h : null
          if (!wasDark) document.body.removeAttribute('data-ds-dark-theme')
        }

        rebuild()

        const obs = new MutationObserver(retag)
        // 主题切换（body[data-ds-dark-theme]）后，手动预设色要按新主题重算 → 由 retag 处理。
        obs.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-ds-dark-theme'],
        })
        retag()

        return () => {
          if (raf) cancelAnimationFrame(raf)
          obs.disconnect()
          closeColorPicker()
          clearTags()
          tag.remove()
          tag = null
        }
      }, 'sidebar-color: style + observer')

      // 设置页：注册一个独立分区（官方槽 settings.section）。
      try {
        const Section = buildSettingsSection({
          snapshot: () => ({
            ...settings,
            overrides: { ...settings.overrides },
            tone: {
              light: { ...settings.tone.light },
              dark: { ...settings.tone.dark },
            },
          }),
          update: (patch) => {
            Object.assign(settings, patch)
            saveSettings(settings)
            rebuild()
            retag()
          },
          getPalette: () => palette,
        })
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: SECTION_ID,
              order: 32,
              label: SECTION_LABEL,
            },
            Section,
          ),
        )
      } catch (e) {
        console.warn('[dsh-workspace-color] 设置页分区注册失败：', e)
      }
    }

    exports.name = name
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
