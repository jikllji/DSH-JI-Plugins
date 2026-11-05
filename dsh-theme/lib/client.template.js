window.__ModuleLoader__.load({
  id: "dsh-theme",
  factory: (require) => {
    "use strict";

    const React = require("react");
    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const h = React.createElement;

    // ── kernel (inlined at build time from lib/kernel.js) ──────────────────
    /*__KERNEL__*/
    // ── end kernel ─────────────────────────────────────────────────────────

    const NS = "dsh-theme";
    const API = "/dsh-theme/packages";
    const THEME_PREFIX = "dsh-theme/";
    const PREF_KEY = "dsh-theme:skin";
    const ALPHA_KEY = "dsh-theme:content-alpha";
    const BLUR_KEY = "dsh-theme:wall-blur";
    const ZOOM_KEY = "dsh-theme:wall-zoom";
    const SECTION_ID = "dsh-theme";

    const zh = {
      "dsh-theme.title": "主题",
      "dsh-theme.subtitle": "皮肤来自 DreamSkin 包，导入后在本机完成映射",
      "dsh-theme.import": "导入皮肤包",
      "dsh-theme.importing": "正在导入…",
      "dsh-theme.drop": "把 .zip 拖到这里可以直接试穿",
      "dsh-theme.empty": "还没有皮肤，导入一个 DreamSkin 包试试",
      "dsh-theme.apply": "应用",
      "dsh-theme.applied": "使用中",
      "dsh-theme.reset": "恢复默认外观",
      "dsh-theme.delete": "删除",
      "dsh-theme.confirmDelete": "再点一次确认删除",
      "dsh-theme.count": "个已安装",
      "dsh-theme.chat": "对话",
      "dsh-theme.settings": "设置面板",
      "dsh-theme.opaque": "不透明",
      "dsh-theme.contrast": "正文对比度",
      "dsh-theme.dialogContrast": "设置面板对比度",
      "dsh-theme.coverage": "token 覆盖",
      "dsh-theme.alpha": "内容区不透明度",
      "dsh-theme.alphaHint": "100% 完全遮住壁纸（最清晰），越低壁纸越明显；设置面板始终不透明",
      "dsh-theme.blur": "毛玻璃",
      "dsh-theme.blurOff": "关",
      "dsh-theme.blurLight": "轻",
      "dsh-theme.blurMid": "中",
      "dsh-theme.blurHeavy": "重",
      "dsh-theme.zoom": "壁纸缩放",
      "dsh-theme.on": "开",
      "dsh-theme.off": "关",
      "dsh-theme.light": "浅色",
      "dsh-theme.dark": "深色",
      "dsh-theme.auto": "随壁纸",
      "dsh-theme.taskFull": "铺满",
      "dsh-theme.taskAmbient": "氛围",
      "dsh-theme.failed": "操作失败",
      "dsh-theme.noPreview": "选择左侧任意皮肤查看实时映射",
      "dsh-theme.loaded": "已生成",
      "dsh-theme.tokens": "个 token",
    };
    const en = {
      "dsh-theme.title": "Themes",
      "dsh-theme.subtitle": "Skins come from DreamSkin packages and are mapped locally",
      "dsh-theme.import": "Import skin",
      "dsh-theme.importing": "Importing…",
      "dsh-theme.drop": "Drop a .zip here to try it on",
      "dsh-theme.empty": "No skins yet — import a DreamSkin package",
      "dsh-theme.apply": "Apply",
      "dsh-theme.applied": "Active",
      "dsh-theme.reset": "Reset to default look",
      "dsh-theme.delete": "Delete",
      "dsh-theme.confirmDelete": "Click again to delete",
      "dsh-theme.count": "installed",
      "dsh-theme.chat": "Chat",
      "dsh-theme.settings": "Settings",
      "dsh-theme.opaque": "Opaque",
      "dsh-theme.contrast": "Body contrast",
      "dsh-theme.dialogContrast": "Settings contrast",
      "dsh-theme.coverage": "Token coverage",
      "dsh-theme.alpha": "Content opacity",
      "dsh-theme.alphaHint": "100% hides the wallpaper completely (sharpest); lower values show more of it. Settings stay opaque",
      "dsh-theme.blur": "Frosted glass",
      "dsh-theme.blurOff": "Off",
      "dsh-theme.blurLight": "Light",
      "dsh-theme.blurMid": "Medium",
      "dsh-theme.blurHeavy": "Heavy",
      "dsh-theme.zoom": "Wallpaper zoom",
      "dsh-theme.on": "On",
      "dsh-theme.off": "Off",
      "dsh-theme.light": "Light",
      "dsh-theme.dark": "Dark",
      "dsh-theme.auto": "Auto",
      "dsh-theme.taskFull": "Full",
      "dsh-theme.taskAmbient": "Ambient",
      "dsh-theme.failed": "Failed",
      "dsh-theme.noPreview": "Pick a skin on the left to see the live mapping",
      "dsh-theme.loaded": "Generated",
      "dsh-theme.tokens": "tokens",
    };

    const FALLBACK = {
      bg: "#1b1c20", surface: "#232529", layer: "#2a2d31", text: "#eceef1",
      muted: "#9aa0a8", accent: "#5b7cfa", line: "rgba(255,255,255,.10)",
    };

    const esc = (value) => String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const pct = (value) => Math.round(value * 100) + "%";
    const ratio = (value) => (Number.isFinite(value) ? value.toFixed(1) : "–") + ":1";

    const readJson = async (response) => {
      const text = await response.text();
      let body = null;
      try { body = text.length > 0 ? JSON.parse(text) : null; } catch { body = null; }
      if (!response.ok) throw new Error((body && (body.error || body.message)) || ("HTTP " + response.status));
      return body;
    };

    const listPackages = () => fetch(API, { headers: { accept: "application/json" } }).then(readJson);

    // derive 一次约 250 次色算（约 22 次二分）；拖动不透明度滑杆时别把 11 个包全重算一遍。
    const deriveCache = new WeakMap();
    /** Token map of a package, derived once and cached by theme identity. */
    const deriveFor = (pkg) => {
      if (!pkg || !pkg.theme) return null;
      const cached = deriveCache.get(pkg.theme);
      if (cached !== undefined) return cached;
      let result = null;
      try { result = derive(pkg.theme); } catch (error) { console.warn("[dsh-theme] derive failed", pkg.id, error); }
      deriveCache.set(pkg.theme, result);
      return result;
    };

    const palette = (tokens) => {
      const get = (name, fallback) => (tokens && tokens[name]) || fallback;
      return {
        bg: get("--dsw-alias-bg-base", FALLBACK.bg),
        surface: get("--dsw-alias-bg-layer-1", FALLBACK.surface),
        layer: get("--dsw-alias-bg-layer-2", FALLBACK.layer),
        text: get("--dsw-alias-label-primary", FALLBACK.text),
        muted: get("--dsw-alias-label-secondary", FALLBACK.muted),
        accent: get("--dsw-alias-brand-primary", FALLBACK.accent),
        line: get("--dsw-alias-border-l1", FALLBACK.line),
      };
    };

    const chatMarkup = (name) => [
      '<div class="jit-mini-bar"><span class="jit-dot"></span><span class="jit-mini-name">DeepSeek</span>',
      '<span class="jit-mini-tag">', esc(name), "</span></div>",
      '<div class="jit-mini-flow">',
      '<div class="jit-m jit-m-u">把 DreamSkin 的 10 个颜色映射成 dsh 的一整套设计 token。</div>',
      '<div class="jit-m jit-m-a"><p>拆成三层：表面阶梯、语义角色、对比度守卫。</p>',
      '<ul><li>表面按 OKLCH 明度阶梯生成</li><li>文本梯度跟着背景，不跟包</li></ul></div>',
      '<div class="jit-code"><div class="jit-code-bar">derive.ts</div><pre>// 10 个 → 119 token\nconst t = derive(pkg.theme);</pre></div>',
      '<div class="jit-tool"><span class="jit-ok">✓</span>已生成全部 token</div>',
      "</div>",
      '<div class="jit-composer">继续输入…<span class="jit-send"></span></div>',
    ].join("");

    const settingsMarkup = (name, labels, stats) => [
      '<div class="jit-mini-bar"><span class="jit-dot"></span><span class="jit-mini-name">设置</span>',
      '<span class="jit-mini-tag">', esc(labels.opaque), "</span></div>",
      '<div class="jit-set-body">',
      '<div class="jit-set-h">外观</div>',
      '<div class="jit-set-row"><span class="k">皮肤</span><span class="v">', esc(name), "</span></div>",
      '<div class="jit-set-row"><span class="k">', esc(labels.settings), '</span><span class="v">',
      esc(labels.opaque), '</span></div>',
      '<div class="jit-set-row"><span class="k">', esc(labels.alpha), '</span><span class="v">88%</span></div>',
      '<div class="jit-set-row"><span class="k">毛玻璃</span><span class="jit-toggle on"></span></div>',
      '<div class="jit-set-row"><span class="k">', esc(labels.coverage), '</span><span class="v">', esc(stats.tokens), ' / ', esc(stats.total), '</span></div>',
      '<div class="jit-note">设置面板不吃壁纸透明度，任何皮肤下都保持可读；内容区仍按皮肤包的透明度明示。</div>',
      "</div>",
    ].join("");

    const STYLE_ID = "dsh-theme/section.css";
    const CSS = `
.jit-root{display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;container-type:inline-size;container-name:jit}
.jit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.jit-head h2{margin:0;font-size:17px;font-weight:600;letter-spacing:.01em}
.jit-head p{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.jit-actions{display:flex;gap:8px;align-items:center;flex:none}
.jit-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 12px;font-size:12.5px;cursor:pointer;transition:background .15s,border-color .15s}
.jit-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.jit-btn:disabled{opacity:.5;cursor:not-allowed}
.jit-btn.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-label-primary-inverted,#fff);font-weight:500}
.jit-btn.primary:hover{filter:brightness(1.06)}
.jit-btn.ghost{background:transparent}
.jit-btn.danger{color:var(--dsw-alias-state-error-primary,#e5484d);border-color:transparent;background:transparent}
.jit-btn.danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 12%,transparent)}
.jit-body{display:grid;grid-template-columns:minmax(220px,1fr) minmax(360px,1.35fr);gap:14px;align-items:start}
.jit-panel{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.jit-list{display:flex;flex-direction:column;padding:6px;gap:2px;max-height:430px;overflow:auto}
.jit-item{display:flex;gap:10px;align-items:center;padding:8px;border-radius:9px;cursor:pointer;border:1px solid transparent;background:transparent;text-align:left;width:100%;font:inherit;color:inherit}
.jit-item:hover{background:var(--dsw-alias-bg-layer-2)}
.jit-item.sel{border-color:var(--dsw-alias-border-l2,rgba(127,127,127,.35));background:var(--dsw-alias-bg-layer-2)}
.jit-thumb{width:46px;height:32px;border-radius:6px;flex:none;background-size:cover;background-position:center;border:1px solid var(--dsw-alias-border-l1)}
.jit-meta{min-width:0;flex:1}
.jit-name{display:block;font-size:12.5px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.jit-sub{display:flex;gap:6px;align-items:center;margin-top:3px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.jit-chip{border-radius:5px;padding:0 5px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);font-size:10.5px;line-height:16px}
.jit-check{flex:none;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-brand-primary);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-primary-inverted,#fff);font-size:10px}
.jit-drop{margin:0 6px 6px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.35));border-radius:9px;padding:14px 10px;text-align:center;font-size:11.5px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.jit-drop.on{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.jit-stage{display:flex;flex-direction:column;gap:10px;padding:12px}
.jit-stage-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.jit-stage-head b{font-weight:600;font-size:13px}
.jit-stage-head span{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.jit-duet{display:grid;grid-template-columns:1.25fr 1fr;gap:10px;align-items:stretch}
.jit-frame{--m-bg:${FALLBACK.bg};--m-surface:${FALLBACK.surface};--m-layer:${FALLBACK.layer};--m-text:${FALLBACK.text};--m-muted:${FALLBACK.muted};--m-accent:${FALLBACK.accent};--m-line:${FALLBACK.line};position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);background:var(--m-bg)}
.jit-col{display:flex;flex-direction:column;gap:6px;min-width:0}
.jit-cap{font-size:10.5px;color:var(--dsw-alias-label-secondary);padding-left:2px}
.jit-frame-tag{position:absolute;top:7px;right:8px;z-index:2;font-size:10px;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 88%,transparent);border-radius:5px;padding:1px 5px}
.jit-mini{position:relative;display:flex;flex-direction:column;height:100%;min-height:200px;background:var(--m-bg);color:var(--m-text);overflow:hidden}
.jit-mini-bar{display:flex;align-items:center;gap:6px;padding:8px 9px;border-bottom:1px solid var(--m-line);background:var(--m-surface);font-size:10.5px}
.jit-dot{width:9px;height:9px;border-radius:50%;background:var(--m-accent);flex:none}
.jit-mini-name{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:44%}
.jit-mini-tag{margin-left:auto;color:var(--m-muted);font-size:9.5px;white-space:nowrap}
.jit-mini-flow{flex:1;display:flex;flex-direction:column;gap:7px;padding:9px;font-size:11px;line-height:1.5}
.jit-m-u{align-self:flex-end;max-width:88%;background:var(--m-layer);border:1px solid var(--m-line);border-radius:8px;padding:6px 8px}
.jit-m-a p{margin:0 0 4px}
.jit-m-a ul{margin:0;padding-left:14px;color:var(--m-muted);font-size:10.5px}
.jit-m-a li{margin:1px 0}
.jit-code{border:1px solid var(--m-line);border-radius:7px;background:var(--m-layer);overflow:hidden}
.jit-code-bar{padding:4px 7px;font-size:9.5px;color:var(--m-muted);border-bottom:1px solid var(--m-line)}
.jit-code pre{margin:0;padding:6px 7px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;line-height:1.6;color:var(--m-text);white-space:pre-wrap;word-break:break-word}
.jit-tool{display:flex;gap:5px;align-items:center;font-size:10px;color:var(--m-muted);border:1px solid var(--m-line);border-radius:7px;padding:4px 7px;background:var(--m-surface)}
.jit-ok{color:var(--m-accent)}
.jit-composer{display:flex;align-items:center;gap:6px;margin:0 9px 9px;padding:7px 8px;border:1px solid var(--m-line);border-radius:8px;background:var(--m-surface);color:var(--m-muted);font-size:10.5px}
.jit-send{margin-left:auto;width:14px;height:14px;border-radius:50%;background:var(--m-accent)}
.jit-set-body{flex:1;display:flex;flex-direction:column;gap:6px;padding:9px;font-size:10.5px}
.jit-set-h{font-size:9.5px;letter-spacing:.06em;color:var(--m-muted);text-transform:uppercase;margin-bottom:1px}
.jit-set-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--m-surface);border:1px solid var(--m-line);border-radius:7px;padding:6px 8px}
.jit-set-row .k{color:var(--m-text)}
.jit-set-row .v{color:var(--m-muted);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:58%}
.jit-toggle{width:22px;height:12px;border-radius:999px;background:var(--m-accent);position:relative;flex:none}
.jit-toggle.on::after{content:"";position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:#fff}
.jit-note{margin-top:auto;border:1px dashed var(--m-line);border-radius:7px;padding:6px 8px;color:var(--m-muted);font-size:9.5px;line-height:1.55}
.jit-metrics{display:flex;gap:8px;flex-wrap:wrap}
.jit-metric{flex:1;min-width:96px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:7px 9px;background:var(--dsw-alias-bg-layer-2)}
.jit-metric b{display:block;font-size:15px;font-weight:600;line-height:1.25}
.jit-metric span{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.jit-good{color:var(--dsw-alias-state-success-primary,#3fb950)}
.jit-warn{color:var(--dsw-alias-state-warn-primary,#d29922)}
.jit-slider{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.jit-slider input{flex:1;accent-color:var(--dsw-alias-brand-primary)}
.jit-blur{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.jit-blur-label{flex:none}
.jit-seg{display:flex;flex:1;gap:4px}
.jit-seg-btn{flex:1;padding:5px 6px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}
.jit-seg-btn:hover{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary)}
.jit-seg-btn.on{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-label-primary-inverted,#fff);font-weight:600}
.jit-mini-wall{position:absolute;inset:-10%;z-index:0;background-size:cover;background-position:center}
.jit-mini-veil{position:absolute;inset:0;z-index:1}
.jit-mini-inner{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;min-height:0}
.jit-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:12px}
.jit-err{color:var(--dsw-alias-state-error-primary,#e5484d);font-size:12px}
.jit-empty{padding:26px 12px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px}
@container jit (max-width:760px){.jit-body{grid-template-columns:1fr}.jit-duet{grid-template-columns:1fr}}
@media (max-width:900px){.jit-body{grid-template-columns:1fr}.jit-duet{grid-template-columns:1fr}}
`;

    const ensureStyle = () => {
      if (typeof document === "undefined") return;
      let tag = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]');
      if (tag === null) {
        tag = document.createElement("style");
        tag.dataset.plugin = NS;
        tag.dataset.pluginCss = STYLE_ID;
        document.head.appendChild(tag);
      }
      // 热重载后旧 CSS 会残留，这里每次无条件覆盖。
      if (tag.textContent !== CSS) tag.textContent = CSS;
    };

    // ── theme registration / wallpaper ─────────────────────────────────────
    const themeIdOf = (pkg) => THEME_PREFIX + pkg.id;

    function createRuntime(ctx, t) {
      const state = { packages: [], wall: null, disposers: [], registered: new Map(), alpha: null };

      const unregisterAll = () => {
        while (state.disposers.length > 0) {
          const dispose = state.disposers.pop();
          try { dispose(); } catch (error) { console.warn("[dsh-theme] dispose failed", error); }
        }
        state.registered.clear();
        state.alpha = null;
      };

      const register = (packages) => {
        const alpha = readAlpha();
        // 换皮肤或换不透明度都要重发 token；只是打开设置页则要保持现有主题不动，
        // 否则 unregister 掉正在使用的主题会让 DSH 把 preference 打回 system。
        const alphaChanged = state.alpha !== alpha;
        state.alpha = alpha;
        const wanted = new Set();
        for (const pkg of packages) {
          const result = deriveFor(pkg);
          if (result === null) continue;
          wanted.add(pkg.id);
          const existing = state.registered.get(pkg.id);
          if (existing !== undefined && !alphaChanged) continue;
          if (existing !== undefined) {
            try { existing(); } catch (error) { console.warn("[dsh-theme] dispose failed", error); }
            state.registered.delete(pkg.id);
          }
          // Content opacity is a user dial: fold it into the base surface only.
          const tokens = Object.assign({}, result.tokens);
          tokens["--dsw-alias-bg-base"] = toCss(withAlpha(parseColor(tokens["--dsw-alias-bg-base"]), alpha));
          tokens["--dsw-specific-sidebar-fill"] = toCss(withAlpha(parseColor(tokens["--dsw-specific-sidebar-fill"]), Math.min(1, alpha + 0.08)));
          try {
            const dispose = ctx.theme.register({
              id: themeIdOf(pkg),
              colorScheme: result.mode === "light" ? "light" : "dark",
              tokens,
            });
            state.registered.set(pkg.id, dispose);
            state.disposers.push(dispose);
          } catch (error) {
            console.warn("[dsh-theme] register failed", pkg.id, error);
          }
        }
        for (const [id, dispose] of Array.from(state.registered)) {
          if (wanted.has(id)) continue;
          try { dispose(); } catch (error) { console.warn("[dsh-theme] dispose failed", error); }
          state.registered.delete(id);
        }
      };

      const applyWall = (pkg) => {
        if (state.wall !== null) { state.wall.remove(); state.wall = null; }
        if (!pkg || !pkg.imageUrl) return;
        const mode = (pkg.theme && pkg.theme.art && pkg.theme.art.taskMode) || "ambient";
        const result = deriveFor(pkg);
        const meta = result ? result.meta : { backgroundX: 0, backgroundY: 0 };
        // 壁纸层自己负责“磨砂”：图先模糊再放大一点，避免模糊后边缘露白。
        // 强度可调（0 / 6 / 14 / 26 px），0 就是原图。
        const blurPx = readBlur();
        const zoomPct = readZoom();
        const el = document.createElement("div");
        el.dataset.plugin = NS;
        el.dataset.part = "wallpaper";
        el.style.cssText = [
          "position:fixed", "inset:0", "z-index:-1", "pointer-events:none",
          "background-image:url(\"" + pkg.imageUrl + "\")",
          mode === "full" ? "background-size:cover" : "background-size:contain",
          "background-repeat:no-repeat",
          mode === "full" ? "background-position:center" : "background-position:calc(50% + " + meta.backgroundX + "px) calc(50% + " + meta.backgroundY + "px)",
          blurPx > 0 ? "filter:blur(" + blurPx + "px) saturate(1.05)" : "filter:none",
          "transform:scale(" + ((zoomPct / 100) * (1 + blurPx / 260)).toFixed(3) + ")",
          "transform-origin:center",
        ].join(";");
        document.body.prepend(el);
        state.wall = el;
      };

      const apply = (pkg) => {
        if (!pkg) return;
        if (deriveFor(pkg) === null) return;
        ctx.theme.setTheme(themeIdOf(pkg));
        localStorage.setItem(PREF_KEY, pkg.id);
        applyWall(pkg);
      };

      const reset = () => {
        ctx.theme.setTheme("system");
        localStorage.removeItem(PREF_KEY);
        if (state.wall !== null) { state.wall.remove(); state.wall = null; }
      };

      const restore = () => {
        const saved = localStorage.getItem(PREF_KEY);
        if (saved === null) return false;
        const pkg = state.packages.find((x) => x.id === saved);
        if (!pkg) return false;
        if (ctx.theme.getTheme().themes.some((x) => x.id === themeIdOf(pkg))) { apply(pkg); return true; }
        return false;
      };

      return { state, register, apply, reset, restore, unregisterAll };
    }

    const readAlpha = () => {
      const raw = localStorage.getItem(ALPHA_KEY);
      if (raw === null || raw === "") return 0.70;
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0.3, Math.min(1, value)) : 0.70;
    };

    // 毛玻璃强度（px）。兼容旧值 "on"/"off"。
    const BLUR_LEVELS = [0, 6, 14, 26];
    const readBlur = () => {
      const raw = localStorage.getItem(BLUR_KEY);
      if (raw === null || raw === "") return 14;
      if (raw === "off") return 0;
      if (raw === "on") return 14;
      const value = Number(raw);
      if (!Number.isFinite(value)) return 14;
      return BLUR_LEVELS.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best), 0);
    };

    // 壁纸缩放（%）。100 = cover 原样，往上放大做局部特写。
    const readZoom = () => {
      const raw = localStorage.getItem(ZOOM_KEY);
      const value = raw === null ? 100 : Number(raw);
      if (!Number.isFinite(value)) return 100;
      return Math.max(100, Math.min(250, Math.round(value)));
    };

    // ── UI ─────────────────────────────────────────────────────────────────
    function Section(props) {
      const { t, runtime } = props;
      const [packages, setPackages] = useState([]);
      const [selected, setSelected] = useState(null);
      const [activeId, setActiveId] = useState(localStorage.getItem(PREF_KEY));
      const [alpha, setAlpha] = useState(readAlpha());
      const [blur, setBlur] = useState(readBlur());
      const [zoom, setZoom] = useState(readZoom());
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);
      const [dragging, setDragging] = useState(false);
      const [pendingDelete, setPendingDelete] = useState(null);
      const fileRef = useRef(null);

      const reload = useCallback(async () => {
        try {
          const list = await listPackages();
          // 宿主返回 { version, packages: [...] }；兼容早期只回数组的形态。
          const items = Array.isArray(list) ? list : (list && Array.isArray(list.packages) ? list.packages : []);
          setPackages(items);
          runtime.state.packages = items;
          runtime.register(items);
          if (selected === null && items.length > 0) {
            // 优先停在“正在使用”的皮肤上，而不是列表第一行。
            const saved = localStorage.getItem(PREF_KEY);
            const match = saved ? items.find((item) => item.id === saved) : null;
            setSelected(match ? match.id : items[0].id);
          }
          return items;
        } catch (err) {
          setError(String(err.message || err));
          return [];
        }
      }, [selected, runtime]);

      useEffect(() => { void reload(); }, []);

      const packageById = (id) => packages.find((p) => p.id === id) || null;
      const current = packageById(selected) || packages[0] || null;
      const derived = useMemo(() => deriveFor(current), [current]);
      const colors = useMemo(() => {
        if (!derived) return FALLBACK;
        const base = palette(derived.tokens);
        base.onAccent = derived.tokens["--dsw-alias-label-primary-inverted"] || "#fff";
        return base;
      }, [derived]);

      const importFiles = async (files) => {
        const list = Array.from(files || []).filter((file) => /\.zip$/i.test(file.name));
        if (list.length === 0) return;
        setBusy(true); setError(null);
        const failures = [];
        try {
          for (const file of list) {
            try {
              const response = await fetch(API, {
                method: "POST",
                headers: { "content-type": "application/zip", "x-ji-filename": encodeURIComponent(file.name) },
                body: file,
              });
              await readJson(response);
            } catch (err) {
              failures.push(file.name + ": " + String(err.message || err));
            }
          }
        } finally {
          // 中途失败也要刷新，否则已成功落盘的包在列表里看不见。
          try { await reload(); } catch (err) { failures.push(String(err.message || err)); }
          if (failures.length > 0) setError(failures.join(" · "));
          setBusy(false);
        }
      };

      const applySkin = (pkg) => {
        runtime.apply(pkg);
        setActiveId(pkg.id);
        setPendingDelete(null);
      };

      const resetSkin = () => {
        runtime.reset();
        setActiveId(null);
      };

      const removePackage = async (pkg) => {
        if (pendingDelete !== pkg.id) { setPendingDelete(pkg.id); return; }
        setBusy(true);
        try {
          await readJson(await fetch(API + "/" + encodeURIComponent(pkg.id), { method: "DELETE" }));
          if (activeId === pkg.id) resetSkin();
          setPendingDelete(null);
          setSelected(null);
          await reload();
        } catch (err) {
          setError(String(err.message || err));
        } finally {
          setBusy(false);
        }
      };

      const changeAlpha = (value) => {
        const next = Math.max(0.3, Math.min(1, value / 100));
        setAlpha(next);
        localStorage.setItem(ALPHA_KEY, String(next));
        runtime.register(packages);
        const active = packageById(activeId);
        if (active) runtime.apply(active);
      };

      const changeBlur = (px) => {
        setBlur(px);
        localStorage.setItem(BLUR_KEY, String(px));
        const active = packageById(activeId);
        if (active) runtime.apply(active);
      };

      const changeZoom = (value) => {
        const next = Math.max(100, Math.min(250, Math.round(value)));
        setZoom(next);
        localStorage.setItem(ZOOM_KEY, String(next));
        const active = packageById(activeId);
        if (active) runtime.apply(active);
      };

      const modeLabel = (pkg, result) => {
        const declared = (pkg.theme && pkg.theme.appearance) || pkg.appearance || "dark";
        const resolved = result ? result.mode : "dark";
        if (declared === "auto") return t("dsh-theme.auto") + " → " + t("dsh-theme." + resolved);
        return t("dsh-theme." + resolved);
      };

      const meta = derived ? derived.meta : null;
      const bodyCheck = derived ? (derived.checks.find((c) => c.fg === "label-primary" && c.bg === "bg-base") || derived.checks[0]) : null;
      const dialogCheck = derived ? (derived.checks.find((c) => c.bg === "bg-layer-2") || null) : null;

      const list = packages.length === 0
        ? h("div", { className: "jit-empty" }, t("dsh-theme.empty"))
        : packages.map((pkg) => {
          const result = deriveFor(pkg);
          const isActive = activeId === pkg.id;
          const isSel = current !== null && current.id === pkg.id;
          const thumb = pkg.imageUrl
            ? h("div", { className: "jit-thumb", style: { backgroundImage: "url(\"" + pkg.imageUrl + "\")" } })
            : h("div", { className: "jit-thumb" });
          return h("button", {
            key: pkg.id,
            type: "button",
            className: "jit-item" + (isSel ? " sel" : ""),
            onClick: () => { setSelected(pkg.id); setPendingDelete(null); },
            onDoubleClick: () => applySkin(pkg),
          },
            thumb,
            h("span", { className: "jit-meta" },
              h("span", { className: "jit-name" }, pkg.name || pkg.id),
              h("span", { className: "jit-sub" },
                h("span", { className: "jit-chip" }, modeLabel(pkg, result)),
                h("span", null, pkg.format === "dreamskin-v1" ? "DreamSkin" : (pkg.format || "DreamSkin")))),
            isActive ? h("span", { className: "jit-check" }, "✓") : null,
          );
        });

      const skinVars = {
        "--m-bg": colors.bg, "--m-surface": colors.surface, "--m-layer": colors.layer,
        "--m-text": colors.text, "--m-muted": colors.muted, "--m-accent": colors.accent,
        "--m-line": colors.line, "--m-on-accent": colors.onAccent || "#fff",
      };
      // 预览必须如实反映真实管线：同样的 alpha、同样的毛玻璃强度。
      // 否则用户调滑杆时看着预览“没反应”，就会以为开关失灵。
      const veil = toCss(withAlpha(parseColor(colors.bg), alpha));
      const previewBlur = blur > 0 ? Math.max(2, Math.round(blur * 0.55)) : 0;
      const previewZoom = Math.min(1.6, Math.max(1, zoom / 100));
      const chatMini = current === null ? null : (current.imageUrl
        ? h("div", { className: "jit-mini" }, [
            h("div", { className: "jit-mini-wall", style: {
              backgroundImage: "url(\"" + current.imageUrl + "\")",
              filter: previewBlur > 0 ? "blur(" + previewBlur + "px)" : "none",
              transform: previewZoom !== 1 ? "scale(" + previewZoom.toFixed(3) + ")" : "none",
            } }),
            h("div", { className: "jit-mini-veil", style: { background: veil } }),
            h("div", { className: "jit-mini-inner", dangerouslySetInnerHTML: { __html: chatMarkup(current.name || current.id) } }),
          ])
        : h("div", { className: "jit-mini", dangerouslySetInnerHTML: { __html: chatMarkup(current.name || current.id) } }));
      const duet = current === null || derived === null
        ? h("div", { className: "jit-empty" }, t("dsh-theme.noPreview"))
        : h("div", { className: "jit-duet" },
          h("div", { className: "jit-col" },
            h("div", { className: "jit-frame", style: skinVars }, chatMini),
            h("div", { className: "jit-cap" }, t("dsh-theme.chat"))),
          h("div", { className: "jit-col" },
            h("div", { className: "jit-frame", style: skinVars },
              h("div", { className: "jit-mini", dangerouslySetInnerHTML: {
                __html: settingsMarkup(current.name || current.id, { settings: t("dsh-theme.settings"), opaque: t("dsh-theme.opaque"), alpha: t("dsh-theme.alpha"), coverage: t("dsh-theme.coverage") }, { tokens: Object.keys(derived.tokens).length, total: derived.meta.coverageTotal }),
              } })),
            h("div", { className: "jit-cap" }, t("dsh-theme.settings"))),
        );

      const head = h("div", { className: "jit-head" }, [
        h("div", null, [
          h("h2", null, t("dsh-theme.title")),
          h("p", null, t("dsh-theme.subtitle") + " · " + packages.length + " " + t("dsh-theme.count")),
        ]),
        h("div", { className: "jit-actions" }, [
          busy ? h("span", { className: "jit-sub" }, t("dsh-theme.importing")) : null,
          h("button", {
            type: "button", className: "jit-btn", disabled: busy,
            onClick: () => { if (fileRef.current !== null) fileRef.current.click(); },
          }, t("dsh-theme.import")),
          h("input", {
            ref: fileRef, type: "file", accept: ".zip,application/zip", multiple: true,
            style: { display: "none" },
            onChange: (event) => { void importFiles(event.target.files); event.target.value = ""; },
          }),
        ]),
      ]);

      const listPanel = h("div", { className: "jit-panel" }, [
        h("div", { className: "jit-list" }, list),
        h("div", { className: "jit-drop" + (dragging ? " on" : "") }, t("dsh-theme.drop")),
      ]);

      const metric = (value, label, tone) => h("div", { className: "jit-metric" }, [
        h("b", { className: tone || "" }, value),
        h("span", null, label),
      ]);

      const stage = h("div", { className: "jit-panel jit-stage" }, [
        h("div", { className: "jit-stage-head" }, [
          h("b", null, current ? current.name || current.id : "—"),
          h("span", null, meta === null ? "" : (meta.taskMode === "full" ? t("dsh-theme.taskFull") : t("dsh-theme.taskAmbient"))),
        ]),
        duet,
        h("div", { className: "jit-metrics" }, [
          metric(bodyCheck ? ratio(bodyCheck.ratio) : "—", t("dsh-theme.contrast"), bodyCheck && bodyCheck.pass ? "jit-good" : "jit-warn"),
          metric(dialogCheck ? ratio(dialogCheck.ratio) : "—", t("dsh-theme.dialogContrast"), dialogCheck && dialogCheck.pass ? "jit-good" : "jit-warn"),
          metric(meta ? meta.coverage + " / " + meta.coverageTotal : "—", t("dsh-theme.coverage"), ""),
        ]),
        h("label", { className: "jit-slider" }, [
          h("span", null, t("dsh-theme.alpha") + " " + pct(alpha)),
          h("input", {
            type: "range", min: 30, max: 100, step: 1,
            value: Math.round(alpha * 100),
            onChange: (event) => changeAlpha(Number(event.target.value)),
          }),
        ]),
        h("div", { className: "jit-blur" }, [
          h("span", { className: "jit-blur-label" }, t("dsh-theme.blur")),
          h("div", { className: "jit-seg" }, [
            [0, t("dsh-theme.blurOff")],
            [6, t("dsh-theme.blurLight")],
            [14, t("dsh-theme.blurMid")],
            [26, t("dsh-theme.blurHeavy")],
          ].map(([px, label]) => h("button", {
            key: String(px),
            type: "button",
            className: "jit-seg-btn" + (blur === px ? " on" : ""),
            onClick: () => changeBlur(px),
          }, label))),
        ]),
        h("label", { className: "jit-slider" }, [
          h("span", null, t("dsh-theme.zoom") + " " + zoom + "%"),
          h("input", {
            type: "range", min: 100, max: 250, step: 5,
            value: zoom,
            onChange: (event) => changeZoom(Number(event.target.value)),
          }),
        ]),
      ]);

      const body = h("div", { className: "jit-body" }, [listPanel, stage]);

      const foot = h("div", { className: "jit-foot" }, [
        h("div", { className: "jit-slider" }, h("span", null, t("dsh-theme.alphaHint"))),
        h("div", { className: "jit-actions" }, [
          current === null ? null : h("button", {
            type: "button", className: "jit-btn danger", disabled: busy,
            onClick: () => { void removePackage(current); },
          }, pendingDelete === current.id ? t("dsh-theme.confirmDelete") : t("dsh-theme.delete")),
          h("button", { type: "button", className: "jit-btn ghost", onClick: resetSkin }, t("dsh-theme.reset")),
          current === null ? null : h("button", {
            type: "button", className: "jit-btn primary", disabled: busy,
            onClick: () => applySkin(current),
          }, activeId === current.id ? t("dsh-theme.applied") : t("dsh-theme.apply")),
        ]),
      ]);

      return h("div", {
        className: "jit-root",
        onDragOver: (event) => { event.preventDefault(); setDragging(true); },
        onDragLeave: () => setDragging(false),
        onDrop: (event) => { event.preventDefault(); setDragging(false); void importFiles(event.dataTransfer.files); },
      }, [head, error === null ? null : h("div", { className: "jit-err" }, t("dsh-theme.failed") + ": " + error), body, foot]);
    }

    // ── plugin entry ───────────────────────────────────────────────────────
    const inject = ["slots", "locale", "theme"];

    function apply(ctx) {
      ensureStyle();
      const t = ctx.locale.bind(NS);
      const runtime = createRuntime(ctx, t);
      if (typeof window !== "undefined") window.__jiTheme = { runtime, ctx, themeIdOf, listPackages };
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-theme: dictionaries");
      ctx.effect(() => () => { runtime.unregisterAll(); if (runtime.state.wall !== null) runtime.state.wall.remove(); }, "dsh-theme: cleanup");

      void listPackages().then((result) => {
        // 宿主返回 { version, packages: [...] }；早期版本只回数组。
        const list = Array.isArray(result) ? result : (result && Array.isArray(result.packages) ? result.packages : []);
        runtime.state.packages = list;
        runtime.register(list);
        if (!runtime.restore()) return;
        // 宿主自己的外观偏好在插件之后才落地（实测重启后会被打回 dark），
        // 所以启动后的头几秒再补几次；用户手动切走之后不再干预。
        [250, 700, 1400, 2600].forEach((delay) => {
          window.setTimeout(() => {
            const saved = localStorage.getItem(PREF_KEY);
            if (saved === null) return;
            const wanted = THEME_PREFIX + saved;
            if (ctx.theme.getTheme().preference === wanted) return;
            const pkg = runtime.state.packages.find((x) => x.id === saved);
            if (pkg) runtime.apply(pkg);
          }, delay);
        });
      }).catch((error) => console.warn("[dsh-theme] packages unavailable", error));

      ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: SECTION_ID,
        order: 11,
        label: () => ctx.locale.bind(NS)("dsh-theme.title"),
        locale: NS,
      }, () => h(Section, { t: ctx.locale.bind(NS), runtime }))), "dsh-theme: settings section");
    }

    const exports = {
      apply,
      inject,
      __selftest: {
        derive, deriveLegacy, parseThemeCss, surfaceAlpha, contrastRatio,
        chatMarkup, settingsMarkup, palette, CSS,
      },
    };
    return exports;
  },
});
