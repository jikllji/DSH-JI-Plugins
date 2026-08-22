// JI-Theme — browser half (client plugin bundle).
window.__ModuleLoader__.load({
  id: "ji-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let React = require("react");

    const SETTINGS_NS = "settings.ji-theme";
    const STORAGE_SKIN = "ji-theme:skin";
    const STORAGE_THEMES = "ji-theme:themes";
    const STORAGE_LEGACY_CUSTOM = "ji-theme:custom";
    const STORAGE_MIGRATED = "ji-theme:wallpapers-migrated-v1";
    // The wallpaper contract (C1 / Q3-B) is fetched at runtime from the host —
    // the browser half never mirrors media types, size caps, or URL rules.
    const CONTRACT_URL = "/ji-theme/wallpapers/contract";
    const DEFAULT_SKIN = "system";
    const DEFAULT_BG_OPACITY = 0.5;
    const DEFAULT_BG_BLUR = 0;
    const OVERRIDE_SOURCE = "ji-theme:background";
    const BUILTIN_BASE = { light: "rgb(255, 255, 255)", dark: "rgb(21, 21, 23)" };

    // Built-in skins as the first-run seed (5-field model).
    const SEED_THEMES = [
      { id: "ocean", name: "ocean", colorScheme: "dark", baseColor: "#0a101f", surfaceColor: "#101a30", textColor: "#e9eef9", mutedColor: "#a5b3cc", accentColor: "#4d86f8", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0 },
      { id: "forest", name: "forest", colorScheme: "dark", baseColor: "#0a120d", surfaceColor: "#101a13", textColor: "#e7f5eb", mutedColor: "#9dc4a9", accentColor: "#34d37b", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0 },
      { id: "sunset", name: "sunset", colorScheme: "dark", baseColor: "#150f1f", surfaceColor: "#1d152b", textColor: "#f4edfc", mutedColor: "#c2aee0", accentColor: "#c084fc", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0 },
      { id: "paper", name: "paper", colorScheme: "light", baseColor: "#faf7f1", surfaceColor: "#ffffff", textColor: "#2e2a22", mutedColor: "#6f675a", accentColor: "#b45309", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0 },
      { id: "sakura", name: "sakura", colorScheme: "light", baseColor: "#fdf5f7", surfaceColor: "#ffffff", textColor: "#3b2530", mutedColor: "#8b6576", accentColor: "#db2777", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0 },
    ];

    const zh = {
      "ji-theme.title": "主题", "ji-theme.default": "跟随系统",
      "ji-theme.ocean": "深海蓝", "ji-theme.forest": "森林绿", "ji-theme.sunset": "落日紫",
      "ji-theme.paper": "暖纸", "ji-theme.sakura": "樱花粉",      "ji-theme.new": "新建", "ji-theme.edit": "编辑", "ji-theme.import": "导入",
      "ji-theme.editor.name": "名称", "ji-theme.editor.scheme": "明暗", "ji-theme.editor.light": "浅色", "ji-theme.editor.dark": "深色",
      "ji-theme.editor.baseColor": "会话背景", "ji-theme.editor.surfaceColor": "表面 / 导航栏", "ji-theme.editor.textColor": "主文字",
      "ji-theme.editor.mutedColor": "次文字", "ji-theme.editor.accentColor": "强调色", "ji-theme.editor.panelAlt": "次级表面", "ji-theme.editor.accentAlt": "强调色·浅", "ji-theme.editor.secondary": "次要色", "ji-theme.editor.highlight": "高亮色", "ji-theme.editor.line": "边框", "ji-theme.editor.opacity": "主区透明度",
      "ji-theme.editor.background": "背景图", "ji-theme.editor.chooseImage": "选择图片", "ji-theme.editor.removeImage": "移除图片",
      "ji-theme.editor.zoom": "缩放", "ji-theme.editor.x": "横向", "ji-theme.editor.y": "纵向", "ji-theme.editor.blur": "模糊", "ji-theme.editor.surfaceOpacity": "表面透明度", "ji-theme.editor.backgroundOpacity": "背景图透明度", "ji-theme.editor.maskOpacity": "遮罩透明度", "ji-theme.preview.chat": "对话", "ji-theme.preview.settings": "设置",
      "ji-theme.editor.save": "保存", "ji-theme.editor.delete": "删除", "ji-theme.editor.cancel": "取消",
      "ji-theme.missing": "壁纸缺失", "ji-theme.storagePath": "壁纸存储", "ji-theme.uploadError": "上传失败", "ji-theme.tooLarge": "壁纸超过 50MB 上限",
    };
    const en = {
      "ji-theme.title": "Theme", "ji-theme.default": "System",
      "ji-theme.ocean": "Ocean", "ji-theme.forest": "Forest", "ji-theme.sunset": "Sunset",
      "ji-theme.paper": "Paper", "ji-theme.sakura": "Sakura",      "ji-theme.new": "New", "ji-theme.edit": "Edit", "ji-theme.import": "Import",
      "ji-theme.editor.name": "Name", "ji-theme.editor.scheme": "Scheme", "ji-theme.editor.light": "Light", "ji-theme.editor.dark": "Dark",
      "ji-theme.editor.baseColor": "Session background", "ji-theme.editor.surfaceColor": "Surface / sidebar", "ji-theme.editor.textColor": "Primary text",
      "ji-theme.editor.mutedColor": "Secondary text", "ji-theme.editor.accentColor": "Accent", "ji-theme.editor.panelAlt": "Surface (alt)", "ji-theme.editor.accentAlt": "Accent (hover)", "ji-theme.editor.secondary": "Secondary", "ji-theme.editor.highlight": "Highlight", "ji-theme.editor.line": "Border", "ji-theme.editor.opacity": "Main opacity",
      "ji-theme.editor.background": "Background image", "ji-theme.editor.chooseImage": "Choose image", "ji-theme.editor.removeImage": "Remove image",
      "ji-theme.editor.zoom": "Zoom", "ji-theme.editor.x": "Horizontal", "ji-theme.editor.y": "Vertical", "ji-theme.editor.blur": "Blur", "ji-theme.editor.surfaceOpacity": "Surface opacity", "ji-theme.editor.backgroundOpacity": "Background opacity", "ji-theme.editor.maskOpacity": "Mask opacity", "ji-theme.preview.chat": "Chat", "ji-theme.preview.settings": "Settings",
      "ji-theme.editor.save": "Save", "ji-theme.editor.delete": "Delete", "ji-theme.editor.cancel": "Cancel",
      "ji-theme.missing": "wallpaper missing", "ji-theme.storagePath": "Wallpaper storage", "ji-theme.uploadError": "Upload failed", "ji-theme.tooLarge": "Wallpaper exceeds 50MB limit",
    };

    function readStorage(key) { try { const v = window.localStorage.getItem(key); return typeof v === "string" ? v : null; } catch { return null; } }
    function writeStorage(key, value) { try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch {} }
    function readSavedSkin() { return readStorage(STORAGE_SKIN); }
    function writeSavedSkin(id) { writeStorage(STORAGE_SKIN, id === DEFAULT_SKIN ? null : id); }

    // ---- wallpaper contract (C1 / Q3-B) ----
    // Fetched at runtime from the host; the browser half mirrors nothing.
    let contract = null;
    let contractPromise = null;
    const contractListeners = new Set();
    function getContract() { return contract; }
    function subscribeContract(fn) { contractListeners.add(fn); return () => contractListeners.delete(fn); }
    function notifyContract() { contractListeners.forEach((fn) => { try { fn(); } catch {} }); }
    async function loadContract() {
      if (contractPromise === null) {
        contractPromise = (async () => {
          // Q6-A: retry with backoff until the host answers.
          for (let attempt = 0; attempt < 20; attempt++) {
            try {
              const res = await fetch(CONTRACT_URL);
              if (!res.ok) throw new Error("HTTP " + res.status);
              const j = await res.json();
              if (!j || !Array.isArray(j.mediaTypes) || typeof j.maxImageBytes !== "number" || typeof j.urlPrefix !== "string") throw new Error("bad contract");
              contract = j;
              notifyContract();
              return j;
            } catch (err) {
              await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
          }
          throw new Error("contract unavailable");
        })().catch((err) => { contractPromise = null; throw err; });
      }
      return contractPromise;
    }
    function requireContract() {
      if (contract === null) throw new Error("contract not loaded");
      return contract;
    }
    function wallpaperNameFromUrl(url) {
      if (contract === null) return null;
      const prefix = contract.urlPrefix + "/";
      if (typeof url !== "string" || !url.startsWith(prefix)) return null;
      const name = url.slice(prefix.length);
      return name && !name.includes("/") ? name : null;
    }
    async function uploadWallpaper(mediaType, base64Data) {
      const c = requireContract();
      const res = await fetch(c.urlPrefix, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaType, dataBase64: base64Data }) });
      if (!res.ok) {
        // Q4-A: host errors are { code, message }; code is the contract, message
        // is the fallback shown only when the locale has no mapping for the code.
        let code = null; let message = null;
        try { const j = await res.json(); if (j) { code = j.code || null; message = j.message || null; } } catch {}
        const err = new Error(message || ("HTTP " + res.status));
        err.code = code;
        throw err;
      }
      const j = await res.json();
      if (!j || typeof j.url !== "string") throw new Error("no url in response");
      return j.url;
    }
    async function deleteWallpaperFile(url) {
      const name = wallpaperNameFromUrl(url);
      if (name === null) return;
      try { await fetch(requireContract().urlPrefix + "/" + encodeURIComponent(name), { method: "DELETE" }); } catch {}
    }
    // Q4-A: map a host error code to a locale string; unknown codes fall back
    // to the host-supplied message.
    function describeWallpaperError(err, t) {
      if (err && err.code === "TOO_LARGE") return t("ji-theme.tooLarge");
      const message = err && err.message ? err.message : String(err);
      return (t("ji-theme.uploadError") + ": ") + message;
    }
    function dataUrlToBase64(dataUrl) {
      const comma = dataUrl.indexOf(",");
      return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
    }
    function dataUrlMediaType(dataUrl) {
      const m = /^data:([^;,]+)/.exec(String(dataUrl));
      return m ? m[1] : "image/png";
    }
    // One-time migration (spec Q3-A / Q4-C): any stored `background` that is a
    // data: URL gets uploaded to the host and replaced with its file URL; a
    // failed migration clears the wallpaper but keeps the theme's colors.
    async function migrateLegacyWallpapers() {
      if (readStorage(STORAGE_MIGRATED) === "1") return;
      const themes = loadThemes();
      let changed = false;
      let failures = 0;
      for (const theme of themes) {
        const bg = theme.background;
        if (typeof bg !== "string" || !bg.startsWith("data:")) continue;
        try {
          const url = await uploadWallpaper(dataUrlMediaType(bg), dataUrlToBase64(bg));
          theme.background = url;
          changed = true;
        } catch (err) {
          failures++;
          console.warn("[ji-theme] wallpaper migration failed, clearing background:", err && err.message ? err.message : err);
          theme.background = null; // Q4-C: keep colors, drop wallpaper, no retry
          changed = true;
        }
      }
      if (changed) saveThemes(themes);
      writeStorage(STORAGE_MIGRATED, "1");
      if (failures > 0) console.warn("[ji-theme] wallpaper migration cleared " + failures + " wallpaper(s) (keep colors)");
      return changed;
    }
    // ---- end wallpaper file API ----

    function normalizeTheme(t) {
      return Object.assign({}, t, {
        panelAltColor: t.panelAltColor ?? t.surfaceColor,
        accentAltColor: t.accentAltColor ?? t.accentColor,
        secondaryColor: t.secondaryColor ?? t.accentColor,
        highlightColor: t.highlightColor ?? t.accentColor,
        lineColor: t.lineColor ?? t.textColor,
        surfaceOpacity: t.surfaceOpacity ?? 1,
        maskOpacity: t.maskOpacity ?? 0.3,
      });
    }
    function loadThemes() {
      const raw = readStorage(STORAGE_THEMES);
      if (raw !== null) {
        try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.map(normalizeTheme); } catch {}
      }
      // First run: seed from built-in skins + migrate legacy custom themes.
      const themes = SEED_THEMES.map((t) => normalizeTheme(Object.assign({}, t)));
      const legacy = readStorage(STORAGE_LEGACY_CUSTOM);
      if (legacy !== null) {
        try {
          const old = JSON.parse(legacy);
          if (Array.isArray(old)) {
            for (const c of old) {
              if (c && typeof c.id === "string") themes.push(normalizeTheme(Object.assign({}, c, { id: "custom-" + c.id })));
            }
          }
        } catch {}
        writeStorage(STORAGE_LEGACY_CUSTOM, null);
      }
      writeStorage(STORAGE_THEMES, JSON.stringify(themes));
      return themes;
    }
    function saveThemes(themes) { writeStorage(STORAGE_THEMES, JSON.stringify(themes)); }

    function toRgba(color, alpha) {
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
      if (hex !== null) { let d = hex[1]; if (d.length === 3) d = d.split("").map((c) => c + c).join(""); const n = parseInt(d, 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`; }
      const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(String(color).trim());
      if (rgb !== null) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
      return String(color);
    }
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function toAlpha(v, dflt) { const n = Number(v); return clamp01(Number.isFinite(n) ? n : dflt); }

    function newCustomTheme() {
      return { id: "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: "", colorScheme: "dark", baseColor: "#0a1020", surfaceColor: "#16233e", textColor: "#e9eef9", mutedColor: "#a5b3cc", accentColor: "#4d86f8", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0, panelAltColor: "#16233e", accentAltColor: "#4d86f8", secondaryColor: "#4d86f8", highlightColor: "#4d86f8", lineColor: "#e9eef9", surfaceOpacity: 1, maskOpacity: 0.3 };
    }
    function buildCustomTokens(t) {
      const sa = toAlpha(t.surfaceOpacity, 1);
      const maskA = toAlpha(t.maskOpacity, 0.3);
      const surface = toRgba(t.surfaceColor, sa); const base = t.baseColor; const muted = toRgba(t.mutedColor, sa);
      const panelAlt = t.panelAltColor ?? t.surfaceColor;
      const accentAlt = t.accentAltColor ?? t.accentColor;
      const secondary = t.secondaryColor ?? t.accentColor;
      const highlight = t.highlightColor ?? t.accentColor;
      const line = t.lineColor ?? t.textColor;
      return {
        "--dsw-alias-bg-base": base, "--dsw-alias-bg-layer-1": surface, "--dsw-alias-bg-layer-2": toRgba(panelAlt, sa), "--dsw-alias-bg-overlay": toRgba(t.surfaceColor, clamp01(sa + 0.1)),
        "--dsw-alias-bg-mask-1": "rgba(0, 0, 0, " + maskA + ")", "--dsw-alias-bg-mask-2": "rgba(0, 0, 0, " + clamp01(maskA * 0.5) + ")", "--dsw-alias-bg-mask-3": "rgba(0, 0, 0, " + clamp01(maskA * 2) + ")",
        "--dsw-alias-border-l1": toRgba(line, 0.1), "--dsw-alias-border-l2": toRgba(line, 0.18),
        "--dsw-alias-brand-primary": t.accentColor, "--dsw-alias-label-primary": t.textColor, "--dsw-alias-label-secondary": t.mutedColor, "--dsw-alias-label-tertiary": toRgba(t.mutedColor, 0.85),
        "--dsw-alias-interactive-bg-hover": toRgba(t.accentColor, 0.14), "--dsw-alias-interactive-bg-active": highlight,
        "--dsw-alias-button-primary-hover": accentAlt,
        "--dsw-alias-state-business-primary": secondary,
        "--dsw-alias-markdown-code-block": muted, "--dsw-alias-markdown-inline-code": surface,
        "--dsw-specific-sidebar-fill": toRgba(t.baseColor, sa), "--dsw-specific-sidebar-nav-item-active": surface, "--dsw-specific-sidebar-nav-item-hover": toRgba(t.surfaceColor, clamp01(sa * 0.8)),
        "--dsw-specific-bubble": surface, "--dsw-specific-bubble-highlight": toRgba(t.surfaceColor, clamp01(sa + 0.1)),
        "--dsw-alias-scrollbar-bg-l1": toRgba(t.mutedColor, 0.3), "--dsw-alias-scrollbar-hover-l1": toRgba(t.mutedColor, 0.5),
      };
    }

    function resolveBase(scheme, active) { if (active.colorScheme === scheme && typeof active.tokens["--dsw-alias-bg-base"] === "string") return active.tokens["--dsw-alias-bg-base"]; return BUILTIN_BASE[scheme]; }
    function resolveBackground(pref, themes) {
      if (pref === "system" || pref === "light" || pref === "dark") return null;
      const theme = themes.find((x) => x.id === pref);
      if (theme && theme.background) {
        return { url: theme.background, opacity: theme.backgroundOpacity ?? DEFAULT_BG_OPACITY, blur: theme.backgroundBlur ?? DEFAULT_BG_BLUR, zoom: theme.backgroundZoom ?? 1, x: theme.backgroundX ?? 0, y: theme.backgroundY ?? 0 };
      }
      return null;
    }

    const S = {
      group: { borderBottom: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0" },
      title: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", lineHeight: "22px", fontWeight: 400 },
      grid: { display: "flex", flexWrap: "wrap", gap: "10px" },
      card: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "96px", padding: "3px", borderRadius: "10px", border: "2px solid transparent", background: "transparent", cursor: "pointer", font: "inherit", boxSizing: "border-box" },
      cardSelected: { boxShadow: "0 0 0 2px var(--dsw-alias-brand-primary)", background: "var(--dsw-alias-interactive-bg-hover)" },
      cardLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", lineHeight: "16px", whiteSpace: "nowrap" },
      cardLabelSelected: { color: "var(--dsw-alias-label-primary)" },
      swatch: { position: "relative", width: "100%", height: "52px", borderRadius: "8px", boxSizing: "border-box", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px", backgroundSize: "cover", backgroundPosition: "center" },
      swatchLine: { height: "7px", borderRadius: "4px" },
      button: { height: "32px", padding: "0 14px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-button-elevated-fill)", color: "var(--dsw-alias-label-primary)", cursor: "pointer", fontSize: "13px", font: "inherit", boxSizing: "border-box" },
      buttonDanger: { color: "var(--dsw-alias-state-error-primary)" },
      input: { height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", fontSize: "13px", font: "inherit", boxSizing: "border-box" },
      colorInput: { width: "36px", height: "30px", padding: "0", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", background: "var(--dsw-alias-bg-layer-1)", cursor: "pointer" },
      fieldRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
      fieldLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px", whiteSpace: "nowrap", width: "96px" },
      sliderRow: { display: "flex", alignItems: "center", gap: "10px", minWidth: "240px" },
      slider: { flex: 1, accentColor: "var(--dsw-alias-brand-primary)" },
      sliderValue: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", whiteSpace: "nowrap", width: "44px", textAlign: "right" },
      actionRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
      editor: { display: "flex", flexDirection: "column", gap: "10px", paddingTop: "4px" },
      check: { position: "absolute", top: "3px", right: "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#3b82f6", color: "#ffffff", fontSize: "11px", lineHeight: "16px", textAlign: "center" },
    };

    function Swatch({ face, t }) {
      const [missing, setMissing] = React.useState(false);
      React.useEffect(() => {
        if (!face.background || String(face.background).startsWith("data:")) { setMissing(false); return; }
        let cancelled = false;
        let timer = null;
        const probe = () => {
          const img = new Image();
          img.onload = () => { if (!cancelled) { setMissing(false); if (timer !== null) { clearInterval(timer); timer = null; } } };
          img.onerror = () => { if (!cancelled) setMissing(true); };
          img.src = face.background;
        };
        probe();
        // Re-probe periodically so an externally restored file clears the badge
        // without remounting (ticket 05: "文件恢复后角标消失").
        timer = setInterval(probe, 5000);
        return () => { cancelled = true; if (timer !== null) clearInterval(timer); };
      }, [face.background]);
      const badge = missing ? React.createElement("span", { style: { position: "absolute", top: "2px", right: "2px", fontSize: "10px", lineHeight: "14px", padding: "0 4px", borderRadius: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", zIndex: 2 } }, t("ji-theme.missing")) : null;
      return React.createElement("div", { style: Object.assign({}, S.swatch, { background: face.background && !missing ? undefined : face.bg, backgroundImage: face.background && !missing ? "url(\"" + face.background + "\")" : undefined, border: "1px solid " + (face.border || "transparent") }) },
        badge,
        React.createElement("div", { style: Object.assign({}, S.swatchLine, { width: "70%", background: face.text, opacity: 0.9 }) }),
        React.createElement("div", { style: Object.assign({}, S.swatchLine, { width: "45%", background: face.accent }) }),
      );
    }
    function DefaultSwatch() { return React.createElement("div", { style: { width: "100%", height: "52px", borderRadius: "8px", display: "flex", overflow: "hidden", border: "1px solid var(--dsw-alias-border-l2)", boxSizing: "border-box" } }, React.createElement("div", { style: { flex: 1, background: "#f4f4f5" } }), React.createElement("div", { style: { flex: 1, background: "#1c1c20" } })); }
    function NewSwatch() { return React.createElement("div", { style: { width: "100%", height: "52px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--dsw-alias-border-l2)", boxSizing: "border-box", color: "var(--dsw-alias-label-secondary)", fontSize: "22px" } }, "+"); }
    function EditSwatch() { return React.createElement("div", { style: { width: "100%", height: "52px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--dsw-alias-border-l2)", boxSizing: "border-box", color: "var(--dsw-alias-label-secondary)", fontSize: "16px" } }, "✎"); }
    function ImportSwatch() { return React.createElement("div", { style: { width: "100%", height: "52px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--dsw-alias-border-l2)", boxSizing: "border-box", color: "var(--dsw-alias-label-secondary)", fontSize: "18px" } }, "⬆"); }
    function Card(props) {
      const selected = props.selected;
      return React.createElement("button", { type: "button", onClick: props.onSelect, "aria-pressed": selected, style: Object.assign({}, S.card, selected ? S.cardSelected : {}) },
        props.children,
        React.createElement("span", { style: Object.assign({}, S.cardLabel, selected ? S.cardLabelSelected : {}) }, props.label),
      );
    }

    function PreviewBar({ w, h, bg, r }) { return React.createElement("div", { style: { width: w, height: h, borderRadius: r ?? 4, background: bg } }); }
    function ThemePreview({ draft, scene }) {
      const sa = toAlpha(draft.surfaceOpacity, 1);
      const bgOp = toAlpha(draft.backgroundOpacity, DEFAULT_BG_OPACITY);
      const maskA = toAlpha(draft.maskOpacity, 0.3);
      const hasBg = !!draft.background;
      const text = draft.textColor; const muted = draft.mutedColor; const accent = draft.accentColor;
      const accentAlt = draft.accentAltColor ?? draft.accentColor;
      const secondary = draft.secondaryColor ?? draft.accentColor;
      const highlight = draft.highlightColor ?? draft.accentColor;
      const panelAlt = draft.panelAltColor ?? draft.surfaceColor;
      const line = draft.lineColor ?? draft.textColor;
      const border = toRgba(line, 0.18);
      const mainBg = hasBg ? toRgba(draft.baseColor, bgOp) : draft.baseColor;
      const sidebarFill = hasBg ? toRgba(draft.baseColor, Math.min(1, bgOp + 0.1)) : toRgba(draft.baseColor, sa);
      const surface = toRgba(draft.surfaceColor, sa);
      const box = { border: "1px solid " + border };
      const transform = "translate(" + (draft.backgroundX ?? 0) + "px, " + (draft.backgroundY ?? 0) + "px) scale(" + (draft.backgroundZoom ?? 1) + ")";
      const filter = (draft.backgroundBlur ?? 0) > 0 ? "blur(" + draft.backgroundBlur + "px)" : "none";
      const shell = { width: "320px", height: "190px", borderRadius: "10px", overflow: "hidden", display: "flex", position: "relative", boxShadow: "0 0 0 1px " + border, flexShrink: 0, background: draft.baseColor };
      const wash = React.createElement("div", { style: { position: "absolute", inset: "0", background: mainBg } });
      const maskLayer = scene === "settings" ? React.createElement("div", { style: { position: "absolute", inset: "0", background: "rgba(0, 0, 0, " + maskA + ")", backdropFilter: "blur(2px)" } }) : null;
      const bgImage = hasBg ? React.createElement("div", { style: { position: "absolute", inset: "0", backgroundImage: "url(\"" + draft.background + "\")", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", transform: transform, transformOrigin: "center", filter: filter } }) : null;
      const sidebar = React.createElement("div", { style: { width: "56px", background: sidebarFill, display: "flex", flexDirection: "column", gap: "8px", padding: "10px 8px", position: "relative", zIndex: 1 } },
        scene === "chat" ? React.createElement(PreviewBar, { w: "40px", h: "8px", bg: accent, r: 4 }) : null,
        React.createElement("div", { style: { width: "40px", height: "18px", borderRadius: "5px", background: highlight } }),
        React.createElement(PreviewBar, { w: "36px", h: "6px", bg: muted, r: 3 }),
        React.createElement(PreviewBar, { w: "36px", h: "6px", bg: muted, r: 3 }),
        React.createElement(PreviewBar, { w: "36px", h: "6px", bg: muted, r: 3 }),
      );
      let main = null;
      if (scene === "settings") {
        main = React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px", position: "relative", zIndex: 1 } },
          React.createElement("div", { style: Object.assign({ width: "100%", padding: "10px", borderRadius: "8px", background: surface, display: "flex", flexDirection: "column", gap: "8px" }, box) },
            React.createElement(PreviewBar, { w: "90px", h: "8px", bg: text, r: 4 }),
            React.createElement("div", { style: { display: "flex", gap: "8px" } },
              React.createElement(PreviewBar, { w: "50%", h: "6px", bg: muted, r: 3 }),
              React.createElement("div", { style: { width: "18px", height: "18px", borderRadius: "5px", background: highlight, marginLeft: "auto" } }),
            ),
            React.createElement("div", { style: Object.assign({ height: "16px", borderRadius: "5px", background: toRgba(draft.surfaceColor, sa), border: "1px solid " + border, display: "flex", alignItems: "center", padding: "0 6px" }, box) },
              React.createElement(PreviewBar, { w: "50%", h: "4px", bg: muted, r: 2 }),
            ),
            React.createElement("div", { style: { display: "flex", gap: "6px" } },
              React.createElement("div", { style: { flex: 1, height: "22px", borderRadius: "6px", background: accent, display: "flex", alignItems: "center", justifyContent: "center" } },
                React.createElement(PreviewBar, { w: "40%", h: "5px", bg: text, r: 2 }),
              ),
              React.createElement("div", { style: { flex: 1, height: "22px", borderRadius: "6px", background: accentAlt, display: "flex", alignItems: "center", justifyContent: "center" } },
                React.createElement(PreviewBar, { w: "40%", h: "5px", bg: text, r: 2 }),
              ),
            ),
          ),
        );
      } else {
        main = React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "12px", position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" } },
            React.createElement("div", { style: Object.assign({ alignSelf: "flex-start", width: "100%", padding: "8px 10px", borderRadius: "10px", background: surface }, box) },
              React.createElement(PreviewBar, { w: "90%", h: "6px", bg: text, r: 3 }),
              React.createElement("div", { style: { height: "6px" } }),
              React.createElement(PreviewBar, { w: "60%", h: "6px", bg: muted, r: 3 }),
              React.createElement("div", { style: { height: "16px", borderRadius: "5px", background: toRgba(panelAlt, sa), display: "flex", alignItems: "center", padding: "0 6px", marginTop: "6px" } },
                React.createElement(PreviewBar, { w: "50%", h: "4px", bg: accent, r: 2 }),
              ),
            ),
            React.createElement("div", { style: Object.assign({ alignSelf: "flex-start", width: "82%", padding: "8px 10px", borderRadius: "10px", background: surface }, box) },
              React.createElement(PreviewBar, { w: "78%", h: "6px", bg: text, r: 3 }),
              React.createElement("div", { style: { alignSelf: "flex-start", height: "14px", borderRadius: "7px", background: secondary, padding: "0 8px", display: "flex", alignItems: "center", marginTop: "6px" } },
                React.createElement(PreviewBar, { w: "24px", h: "4px", bg: text, r: 2 }),
              ),
            ),
            React.createElement("div", { style: Object.assign({ alignSelf: "flex-start", width: "70%", padding: "8px 10px", borderRadius: "10px", background: surface }, box) },
              React.createElement(PreviewBar, { w: "85%", h: "6px", bg: text, r: 3 }),
            ),
          ),
          React.createElement("div", { style: Object.assign({ height: "28px", marginTop: "10px", borderRadius: "8px", background: surface, display: "flex", alignItems: "center", padding: "0 8px", gap: "6px" }, box) },
            React.createElement(PreviewBar, { w: "80px", h: "5px", bg: muted, r: 2 }),
            React.createElement("div", { style: { width: "20px", height: "20px", borderRadius: "6px", background: accentAlt, marginLeft: "auto" } }),
          ),
        );
      }
      return React.createElement("div", { style: shell },
        bgImage,
        wash,
        maskLayer,
        scene === "chat" ? sidebar : null,
        main,
      );
    }

    // No compression (spec Q7-B): read the picked file's raw bytes as base64
    // and hand them to the host file store.
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read failed"));
        reader.onload = () => resolve(dataUrlToBase64(String(reader.result)));
        reader.readAsDataURL(file);
      });
    }
    async function uploadWallpaperFile(file) {
      // Q5-B: no local pre-checking — the host is the single authority; a
      // too-large file comes back as a 413 with { code: "TOO_LARGE" }.
      const base64 = await fileToBase64(file);
      const mediaType = file.type || imageMime(file.name);
      return uploadWallpaper(mediaType, base64);
    }

    //#region zip import (DreamSkin .zip -> theme)
    async function parseZip(arrayBuffer) {
      const bytes = new Uint8Array(arrayBuffer);
      const view = new DataView(arrayBuffer);
      let eocd = -1;
      const min = Math.max(0, bytes.length - 22 - 65535);
      for (let i = bytes.length - 22; i >= min; i--) {
        if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      }
      if (eocd === -1) throw new Error('not a zip file');
      const count = view.getUint16(eocd + 10, true);
      let cd = view.getUint32(eocd + 16, true);
      const files = {};
      for (let i = 0; i < count; i++) {
        if (view.getUint32(cd, true) !== 0x02014b50) break;
        const method = view.getUint16(cd + 10, true);
        const csize = view.getUint32(cd + 20, true);
        const nameLen = view.getUint16(cd + 28, true);
        const extraLen = view.getUint16(cd + 30, true);
        const commentLen = view.getUint16(cd + 32, true);
        const localOffset = view.getUint32(cd + 42, true);
        const name = new TextDecoder().decode(bytes.slice(cd + 46, cd + 46 + nameLen));
        const lnameLen = view.getUint16(localOffset + 26, true);
        const lextraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + lnameLen + lextraLen;
        const compressed = bytes.slice(dataStart, dataStart + csize);
        let data;
        if (method === 0) data = compressed;
        else if (method === 8) data = await decompressDeflate(compressed);
        else throw new Error('unsupported zip method ' + method);
        files[name] = data;
        cd += 46 + nameLen + extraLen + commentLen;
      }
      return files;
    }
    async function decompressDeflate(compressed) {
      const buf = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      return new Uint8Array(buf);
    }
    function toBase64(bytes) {
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    }
    function hexFromColor(color) {
      if (!color) return null;
      const s = String(color).trim();
      const hex = /^#?([0-9a-f]{6})/i.exec(s);
      if (hex) return '#' + hex[1];
      const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
      if (rgb) return '#' + ((1 << 24) + (Number(rgb[1]) << 16) + (Number(rgb[2]) << 8) + Number(rgb[3])).toString(16).slice(1);
      return null;
    }
    function extractPart(css, part) {
      const key = '[data-ds-part="' + part + '"]';
      const start = (css || '').indexOf(key);
      if (start === -1) return null;
      const open = css.indexOf('{', start);
      const close = css.indexOf('}', open);
      if (open === -1 || close === -1) return null;
      return css.slice(open + 1, close);
    }
    // DreamSkin packages rarely declare alpha in their css; fall back to a
    // nearly transparent wash (1%) instead of an opaque 100% one, so the
    // wallpaper shows through by default on import (user-chosen default).
    const IMPORT_DEFAULT_OPACITY = 0.01;
    function parseThemeCss(css) {
      const text = css || '';
      const out = [];
      const prop = (body, name) => {
        const i = body.indexOf(name);
        if (i === -1) return null;
        const semi = body.indexOf(';', i);
        return body.slice(i + name.length, semi === -1 ? body.length : semi).trim();
      };
      const root = extractPart(text, 'root');
      if (root) {
        const font = prop(root, 'font-family:');
        // letter-spacing is deliberately NOT imported: dsh's composer renders
        // the visible glyphs on a backdrop layer while the native caret lives
        // in the textarea, and Chromium's UA sheet resets form controls to
        // letter-spacing: normal. Any non-zero spacing inherited from body
        // therefore makes the glyphs advance faster than the caret, so the
        // caret lags behind the typed letters. Dropping it keeps every
        // imported theme caret-safe (applies to any DreamSkin package, not
        // just this one).
        if (font) out.push('font-family:' + font);
      }
      const alphaOf = (part) => {
        const body = extractPart(text, part);
        if (!body) return null;
        const bgIdx = body.indexOf('background-color:');
        if (bgIdx !== -1) {
          const bgVal = body.slice(bgIdx + 'background-color:'.length).split(';')[0].trim();
          if (bgVal === 'transparent') return 0;
        }
        const rgba = body.indexOf('rgba(');
        if (rgba === -1) return null;
        const p1 = body.indexOf(',', rgba);
        const p2 = body.indexOf(',', p1 + 1);
        const p3 = body.indexOf(',', p2 + 1);
        const end = body.indexOf(')', p3);
        if (p1 === -1 || p2 === -1 || p3 === -1 || end === -1) return null;
        const alpha = Number(body.slice(p3 + 1, end).trim());
        return Number.isFinite(alpha) ? clamp01(alpha) : null;
      };
      return {
        css: out.length ? 'body{' + out.join(';') + '}' : '',
        backgroundOpacity: alphaOf('main') ?? alphaOf('thread') ?? IMPORT_DEFAULT_OPACITY,
        surfaceOpacity: alphaOf('message') ?? alphaOf('composer') ?? alphaOf('panel') ?? IMPORT_DEFAULT_OPACITY,
      };
    }
    function imageMime(name) {
      const ext = String(name || '').split('.').pop().toLowerCase();
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'gif') return 'image/gif';
      return 'image/webp';
    }
    // No compression on import either (spec Q7-B): wallpaper bytes from the zip
    // are uploaded as-is; a wallpaper over the cap rejects the whole zip (Q9-C).
    function mapDreamSkin(themeJson, cssText, imageDataUrl) {
      const c = themeJson.colors || {};
      const art = themeJson.art || {};
      const parsed = parseThemeCss(cssText);
      return {
        id: 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: themeJson.name || themeJson.id || '导入主题',
        colorScheme: themeJson.appearance === 'light' ? 'light' : 'dark',
        baseColor: c.background || '#000000',
        surfaceColor: c.panel || c.background || '#000000',
        textColor: c.text || '#ffffff',
        mutedColor: c.muted || c.text || '#aaaaaa',
        accentColor: c.accent || '#ffffff',
        panelAltColor: c.panelAlt || c.panel || c.background || '#000000',
        accentAltColor: c.accentAlt || c.accent || '#ffffff',
        secondaryColor: c.secondary || c.accent || '#ffffff',
        highlightColor: c.highlight || c.accent || '#ffffff',
        lineColor: hexFromColor(c.line) || c.text || '#ffffff',
        opacity: 1,
        surfaceOpacity: parsed.surfaceOpacity,
        background: imageDataUrl || null,
        backgroundOpacity: parsed.backgroundOpacity,
        backgroundBlur: DEFAULT_BG_BLUR,
        backgroundZoom: 1,
        backgroundX: art.focusX != null ? Math.round((art.focusX - 0.5) * 200) : 0,
        backgroundY: art.focusY != null ? Math.round((art.focusY - 0.5) * 200) : 0,
        css: parsed.css,
      };
    }
    //#endregion

    function Slider(props) { return React.createElement("div", { style: S.sliderRow }, React.createElement("span", { style: S.fieldLabel }, props.label), React.createElement("input", { type: "range", min: props.min, max: props.max, step: props.step, value: props.value, style: S.slider, onChange: (event) => props.onChange(Number(event.target.value)) }), React.createElement("span", { style: S.sliderValue }, props.format(props.value))); }
    function ColorField(props) { return React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, props.label), React.createElement("input", { type: "color", value: props.value, style: S.colorInput, onChange: (event) => props.onChange(event.target.value) })); }

    function ThemeRow(props) {
      const t = props.t;
      const [pref, setPref] = React.useState(() => props.getSnapshot().preference);
      const [themes, setThemes] = React.useState(() => props.loadThemes());
      const [editing, setEditing] = React.useState(null);
      const [actionError, setActionError] = React.useState(null);
      const [storagePath, setStoragePath] = React.useState(null);
      const [contractReady, setContractReady] = React.useState(getContract() !== null);
      const bgInputRef = React.useRef(null);

      // Q6-A: uploads stay disabled until the wallpaper contract is fetched
      // (the client mirrors nothing, so it cannot act before the contract).
      React.useEffect(() => {
        let off = subscribeContract(() => setContractReady(true));
        loadContract().then(() => setContractReady(true)).catch(() => {});
        return off;
      }, []);

      // Q11-B: show the host-side wallpaper storage path as a small line.
      // Runs only after the contract is ready (urlPrefix comes from it).
      React.useEffect(() => {
        if (!contractReady) return;
        let cancelled = false;
        fetch(requireContract().urlPrefix).then((r) => r.ok ? r.json() : null).then((j) => { if (!cancelled && j && typeof j.path === "string") setStoragePath(j.path); }).catch(() => {});
        return () => { cancelled = true; };
      }, [contractReady]);

      React.useEffect(() => {
        let last = props.getSnapshot().revision;
        const refresh = () => { const snap = props.getSnapshot(); if (snap.revision === last) return; last = snap.revision; setPref(snap.preference); setThemes(props.loadThemes()); };
        const off = props.subscribe(refresh);
        const id = setInterval(refresh, 250);
        return () => { off(); clearInterval(id); };
      }, []);

      const select = (id) => {
        props.setSkin(id);
        setPref(id);
        if (editing !== null) {
          cleanupUnsavedBackground(editing.draft);
          if (id === DEFAULT_SKIN) { setEditing(null); }
          else { const index = themes.findIndex((x) => x.id === id); if (index >= 0) setEditing({ mode: "edit", index, draft: Object.assign({}, themes[index]) }); }
        }
      };
      const refreshThemes = () => setThemes(props.loadThemes());
      const startNew = () => { if (editing !== null) cleanupUnsavedBackground(editing.draft); setEditing({ mode: "new", index: -1, draft: newCustomTheme() }); };
      const zipRef = React.useRef(null);
      const onZipFile = (event) => {
        const file = event.target.files?.[0];
        if (file === undefined) return;
        const reader = new FileReader();
        reader.onerror = () => { event.target.value = ""; };
        reader.onload = async () => {
          try {
            const files = await parseZip(reader.result);
            const themeJsonText = files["theme.json"] ? new TextDecoder().decode(files["theme.json"]) : null;
            if (!themeJsonText) throw new Error("zip missing theme.json");
            const themeJson = JSON.parse(themeJsonText);
            const cssText = files["theme.css"] ? new TextDecoder().decode(files["theme.css"]) : "";
            const imageName = themeJson.image || "background.webp";
            let backgroundUrl = null;
            if (files[imageName]) {
              const bytes = files[imageName];
              // Q9-C: a wallpaper over the cap rejects the ENTIRE zip. The cap
              // comes from the fetched contract (Q3-B), never mirrored.
              if (bytes.length > requireContract().maxImageBytes) throw new Error(t("ji-theme.tooLarge") + " (zip rejected)");
              backgroundUrl = await uploadWallpaper(imageMime(imageName), toBase64(bytes));
            }
            const theme = mapDreamSkin(themeJson, cssText, backgroundUrl);
            props.addTheme(theme);
            refreshThemes();
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            setActionError(msg);
            console.error("[ji-theme] import failed:", err);
          }
          event.target.value = "";
        };
        reader.readAsArrayBuffer(file);
      };
      const startEditSelected = () => {
        if (pref === "system" || pref === "light" || pref === "dark") return;
        if (editing !== null) cleanupUnsavedBackground(editing.draft);
        const index = themes.findIndex((x) => x.id === pref);
        if (index >= 0) { setEditing({ mode: "edit", index, draft: Object.assign({}, themes[index]) }); }
      };
      const patch = (field, value) => setEditing((e) => e === null ? e : { mode: e.mode, index: e.index, draft: Object.assign({}, e.draft, { [field]: value }) });
      // The draft may carry a file URL that was uploaded but never saved (e.g.
      // the user picked an image then cancelled). Only that unsaved URL is
      // garbage: a saved theme's background must stay until saveTheme replaces
      // or the theme is deleted (Q5-A: delete when the reference is gone).
      const savedBackgroundOf = (d) => {
        if (d === null) return null;
        const idx = themes.findIndex((x) => x.id === d.id);
        return idx >= 0 ? themes[idx].background : null;
      };
      const cleanupUnsavedBackground = (d) => {
        if (d === null || d.background === null) return;
        const saved = savedBackgroundOf(d);
        if (d.background !== saved) deleteWallpaperFile(d.background);
      };
      const discardDraft = () => { if (editing !== null) { cleanupUnsavedBackground(editing.draft); setEditing(null); } };
      const save = () => {
        if (editing === null) return;
        props.saveTheme(editing.draft);
        setEditing(null);
        refreshThemes();
      };
      const remove = () => {
        if (editing === null) return;
        props.deleteTheme(editing.draft.id);
        setEditing(null);
        refreshThemes();
      };
      const onBgFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file === undefined) return;
        try {
          // If the draft already holds an unsaved wallpaper URL, it becomes an
          // orphan the moment we replace it — clean it up first (Q5-A).
          cleanupUnsavedBackground(editing === null ? null : editing.draft);
          const url = await uploadWallpaperFile(file);
          patch("background", url);
          setActionError(null);
        } catch (err) {
          setActionError(describeWallpaperError(err, t));
          console.error("[ji-theme] wallpaper upload failed:", err);
        }
      };

      const faces = themes.map((c) => ({
        id: c.id,
        label: c.name === "" ? "自定义" : (SEED_THEMES.some((s) => s.id === c.id) ? t("ji-theme." + c.id) : c.name),
        bg: toRgba(c.baseColor, clamp01(c.opacity || 1)), text: c.textColor, accent: c.accentColor,
        border: toRgba(c.textColor, 0.18), background: c.background || null,
      }));

      const draft = editing ? editing.draft : null;

      return React.createElement("div", { style: S.group },
        React.createElement("div", { style: S.title }, t("ji-theme.title")),
        storagePath ? React.createElement("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px", lineHeight: "16px", paddingBottom: "4px", wordBreak: "break-all" } }, t("ji-theme.storagePath") + "：" + storagePath) : null,
        actionError ? React.createElement("div", { style: { color: "var(--dsw-alias-state-error-primary)", fontSize: "12px", lineHeight: "16px", paddingBottom: "4px" } }, actionError) : null,
        React.createElement("div", { style: S.grid },
          React.createElement(Card, { key: "system", selected: pref === "system" && (editing === null || editing.mode === "edit"), onSelect: () => select(DEFAULT_SKIN), label: t("ji-theme.default") }, React.createElement(DefaultSwatch, {})),
          faces.map((f) => React.createElement(Card, { key: f.id, selected: pref === f.id && (editing === null || editing.mode === "edit"), onSelect: () => select(f.id), label: f.label }, React.createElement(Swatch, { face: f, t: t }))),
          React.createElement(Card, { key: "__edit__", selected: editing !== null && editing.mode === "edit", onSelect: startEditSelected, label: t("ji-theme.edit") }, React.createElement(EditSwatch, {})),
          React.createElement(Card, { key: "__new__", selected: editing !== null && editing.mode === "new", onSelect: startNew, label: t("ji-theme.new") }, React.createElement(NewSwatch, {})),
          React.createElement(Card, { key: "__import__", selected: false, onSelect: () => zipRef.current?.click(), label: t("ji-theme.import") }, React.createElement(ImportSwatch, {})),
        ),
        React.createElement("input", { ref: zipRef, type: "file", accept: ".zip,application/zip", style: { display: "none" }, onChange: onZipFile }),
        draft === null ? null : React.createElement("div", { style: S.editor },
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
            React.createElement("div", { style: { flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "10px" } },
              React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.name")), React.createElement("input", { type: "text", style: S.input, value: draft.name, placeholder: "My theme", onChange: (event) => patch("name", event.target.value) })),
              React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.scheme")), React.createElement("button", { type: "button", style: S.button, onClick: () => patch("colorScheme", draft.colorScheme === "light" ? "dark" : "light") }, draft.colorScheme === "light" ? t("ji-theme.editor.light") : t("ji-theme.editor.dark"))),
              React.createElement(ColorField, { label: t("ji-theme.editor.baseColor"), value: draft.baseColor, onChange: (v) => patch("baseColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.surfaceColor"), value: draft.surfaceColor, onChange: (v) => patch("surfaceColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.textColor"), value: draft.textColor, onChange: (v) => patch("textColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.mutedColor"), value: draft.mutedColor, onChange: (v) => patch("mutedColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.accentColor"), value: draft.accentColor, onChange: (v) => patch("accentColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.panelAlt"), value: draft.panelAltColor, onChange: (v) => patch("panelAltColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.accentAlt"), value: draft.accentAltColor, onChange: (v) => patch("accentAltColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.secondary"), value: draft.secondaryColor, onChange: (v) => patch("secondaryColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.highlight"), value: draft.highlightColor, onChange: (v) => patch("highlightColor", v) }),
              React.createElement(ColorField, { label: t("ji-theme.editor.line"), value: draft.lineColor, onChange: (v) => patch("lineColor", v) }),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
                React.createElement("div", { style: S.fieldLabel }, t("ji-theme.preview.chat")),
                React.createElement(ThemePreview, { draft: draft, scene: "chat" }),
              ),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
                React.createElement("div", { style: S.fieldLabel }, t("ji-theme.preview.settings")),
                React.createElement(ThemePreview, { draft: draft, scene: "settings" }),
              ),
              React.createElement(Slider, { label: t("ji-theme.editor.surfaceOpacity"), value: Math.round((draft.surfaceOpacity ?? 1) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("surfaceOpacity", v / 100) }),
              React.createElement(Slider, { label: t("ji-theme.editor.backgroundOpacity"), value: Math.round((draft.backgroundOpacity ?? DEFAULT_BG_OPACITY) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("backgroundOpacity", v / 100) }),
              React.createElement(Slider, { label: t("ji-theme.editor.maskOpacity"), value: Math.round((draft.maskOpacity ?? 0.3) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("maskOpacity", v / 100) }),
              React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.background")), React.createElement("button", { type: "button", disabled: !contractReady, style: Object.assign({}, S.button, contractReady ? {} : { opacity: 0.5, cursor: "not-allowed" }), onClick: () => { if (contractReady) bgInputRef.current?.click(); } }, t("ji-theme.editor.chooseImage")), draft.background ? React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: () => { cleanupUnsavedBackground(draft); patch("background", null); } }, t("ji-theme.editor.removeImage")) : null, React.createElement("input", { ref: bgInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onBgFile })),
              draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.zoom"), value: Math.round((draft.backgroundZoom ?? 1) * 100), min: 100, max: 300, step: 1, format: (v) => v + "%", onChange: (v) => patch("backgroundZoom", v / 100) }) : null,
              draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.x"), value: Math.round(draft.backgroundX ?? 0), min: -150, max: 150, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundX", v) }) : null,
              draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.y"), value: Math.round(draft.backgroundY ?? 0), min: -150, max: 150, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundY", v) }) : null,
              draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.blur"), value: Math.round(draft.backgroundBlur ?? 0), min: 0, max: 60, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundBlur", v) }) : null,
              React.createElement("div", { style: S.actionRow },
                React.createElement("button", { type: "button", style: S.button, onClick: save }, t("ji-theme.editor.save")),
                React.createElement("button", { type: "button", style: S.button, onClick: discardDraft }, t("ji-theme.editor.cancel")),
                React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: remove }, t("ji-theme.editor.delete")),
              ),
            ),
          ),
        ),
      );
    }

    const inject = ["slots", "locale", "theme"];

    function apply(ctx) {
      let backgroundEl = null;
      let backgroundOverrideDispose = null;
      let themeDisposers = [];
      let shading = false;

      const registerThemes = () => {
        const current = ctx.theme.getTheme().preference;
        themeDisposers.forEach((d) => d());
        themeDisposers = [];
        for (const theme of loadThemes()) {
          themeDisposers.push(ctx.theme.register({ id: theme.id, colorScheme: theme.colorScheme === "light" ? "light" : "dark", tokens: buildCustomTokens(theme) }));
        }
        if (current !== "system" && current !== "light" && current !== "dark") {
          const stillThere = loadThemes().some((x) => x.id === current);
          if (stillThere) ctx.theme.setTheme(current);
        }
      };
      registerThemes();
      ctx.effect(() => () => { themeDisposers.forEach((d) => d()); themeDisposers = []; }, "ji-theme: unregister themes");
      // Q3-A: migrate any legacy data: wallpapers to the host file store once.
      // The contract must be fetched first — migration uploads through it.
      loadContract().then(() => migrateLegacyWallpapers()).then((changed) => {
        if (changed) {
          registerThemes();
          applyBackground();
          applyThemeCss();
          reassertSavedSkin();
        }
      }).catch((err) => console.error("[ji-theme] wallpaper migration failed:", err));

      const saved = readSavedSkin();
      if (typeof saved === "string" && saved !== DEFAULT_SKIN) { const registered = ctx.theme.getTheme().themes.some((x) => x.id === saved); if (registered && ctx.theme.getTheme().preference !== saved) ctx.theme.setTheme(saved); }

      const shadeTokens = (alpha) => {
        if (shading) return;
        const snapshot = ctx.theme.getTheme();
        // Idempotence: skip the republish once the DOM already carries the
        // target value. Without this guard every re-shade publishes again,
        // which re-schedules the deferred listener and loops forever.
        const target = toRgba(resolveBase(snapshot.active.colorScheme, snapshot.active), alpha);
        if (document.body.style.getPropertyValue("--dsw-alias-bg-base") === target) return;
        shading = true;
        try {
          const sidebarAlpha = Math.min(1, alpha + 0.1);
          const overrides = {
            "--dsw-alias-bg-base": { light: toRgba(resolveBase("light", snapshot.active), alpha), dark: toRgba(resolveBase("dark", snapshot.active), alpha) },
            "--dsw-specific-sidebar-fill": { light: toRgba(resolveBase("light", snapshot.active), sidebarAlpha), dark: toRgba(resolveBase("dark", snapshot.active), sidebarAlpha) },
          };
          console.log("[ji-theme] shadeTokens", alpha, snapshot.active.colorScheme, overrides["--dsw-alias-bg-base"].dark);
          if (backgroundOverrideDispose !== null) backgroundOverrideDispose();
          backgroundOverrideDispose = ctx.theme.overrideTokens(OVERRIDE_SOURCE, overrides);
        } finally { shading = false; }
      };
      const applyBackground = () => {
        const pref = ctx.theme.getTheme().preference;
        const bg = resolveBackground(pref, loadThemes());
        console.log("[ji-theme] applyBackground", pref, bg ? { opacity: bg.opacity, zoom: bg.zoom, blur: bg.blur, urlLen: bg.url.length } : "no-bg");
        if (!bg) { if (backgroundEl !== null) backgroundEl.remove(); backgroundEl = null; if (backgroundOverrideDispose !== null) backgroundOverrideDispose(); backgroundOverrideDispose = null; return; }
        if (backgroundEl === null || !document.body.contains(backgroundEl)) { backgroundEl = document.createElement("div"); backgroundEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;background-repeat:no-repeat;"; document.body.prepend(backgroundEl); }
        backgroundEl.style.backgroundImage = "url(\"" + bg.url + "\")";
        backgroundEl.style.backgroundSize = "contain";
        backgroundEl.style.backgroundPosition = "center";
        backgroundEl.style.transform = "translate(" + bg.x + "px, " + bg.y + "px) scale(" + bg.zoom + ")";
        backgroundEl.style.filter = bg.blur > 0 ? "blur(" + bg.blur + "px)" : "none";
        shadeTokens(bg.opacity);
      };
      applyBackground();
      ctx.effect(() => () => { if (backgroundEl !== null) backgroundEl.remove(); backgroundEl = null; if (backgroundOverrideDispose !== null) backgroundOverrideDispose(); backgroundOverrideDispose = null; }, "ji-theme: background cleanup");

      let cssEl = null;
      const applyThemeCss = () => {
        const theme = loadThemes().find((x) => x.id === ctx.theme.getTheme().preference);
        const css = theme && theme.css;
        if (!css) { if (cssEl !== null) { cssEl.remove(); cssEl = null; } return; }
        if (cssEl === null) { cssEl = document.createElement('style'); cssEl.dataset.plugin = 'ji-theme'; document.head.appendChild(cssEl); }
        // Strip any letter-spacing declarations from the imported css (see
        // parseThemeCss): the composer's glyph backdrop inherits body
        // letter-spacing while the textarea caret is UA-reset to normal, so
        // non-zero spacing makes the caret lag behind the typed letters. This
        // also heals themes imported before the sanitization existed.
        const sanitized = String(css).replace(/letter-spacing\s*:[^;{}]+;?/gi, '');
        cssEl.textContent = sanitized + '\ninput, textarea, [contenteditable] { letter-spacing: normal; }';
      };
      applyThemeCss();
      ctx.effect(() => () => { if (cssEl !== null) { cssEl.remove(); cssEl = null; } }, "ji-theme: css cleanup");

      ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "ji-theme: settings row dictionaries");
      // Re-assert the saved skin when the runtime preference falls back to a
      // built-in: custom theme ids are not persistable in the Host settings
      // scope, so ThemeRuntime.adopt() resets the preference to its durable
      // built-in value asynchronously after boot. Only fights real reverts —
      // a deliberate "follow system" choice clears the saved skin first.
      const reassertSavedSkin = () => {
        try {
          const saved = readSavedSkin();
          const pref = ctx.theme.getTheme().preference;
          if (typeof saved === "string" && saved !== DEFAULT_SKIN && (pref === "system" || pref === "light" || pref === "dark")) {
            const registered = ctx.theme.getTheme().themes.some((x) => x.id === saved);
            if (registered) { ctx.theme.setTheme(saved); writeSavedSkin(saved); }
          }
        } catch (err) {
          console.error("[ji-theme] reassert saved skin failed:", err);
        }
      };
      // Deferred re-application: theme/change emits synchronously, and the
      // presenter (ui-layout) may receive the SAME emit's stale snapshot after
      // our nested overrideTokens publish — its late write then clobbers the
      // translucent base with the opaque theme color. Deferring to a microtask
      // lets the whole synchronous chain settle first, so our re-shade always
      // lands last and wins. shadeTokens' DOM-convergence guard keeps the
      // publish → listener → microtask cycle from looping.
      let pendingReapply = false;
      ctx.on("theme/change", () => {
        if (pendingReapply) return;
        pendingReapply = true;
        queueMicrotask(() => {
          pendingReapply = false;
          try {
            applyBackground();
            applyThemeCss();
            reassertSavedSkin();
          } catch (err) {
            console.error("[ji-theme] deferred reapply failed:", err);
          }
        });
      });
      // Belt-and-braces for the boot-order case: if the Host settings scope
      // reverts the preference BEFORE this listener exists, one delayed
      // re-assert still restores the saved custom skin.
      const bootReassert = setTimeout(reassertSavedSkin, 500);
      ctx.effect(() => () => clearTimeout(bootReassert), "ji-theme: boot reassert timer");

      const themeActions = {
        getSnapshot: () => ctx.theme.getTheme(),
        subscribe: (fn) => ctx.on("theme/change", fn),
        setSkin: (id) => { ctx.theme.setTheme(id); writeSavedSkin(id); },
        loadThemes: () => loadThemes(),
        saveTheme: (theme) => { const themes = loadThemes(); const index = themes.findIndex((x) => x.id === theme.id); const old = index >= 0 ? themes[index] : null; if (index >= 0) themes[index] = theme; else themes.push(theme); saveThemes(themes); registerThemes(); if (old && old.background && old.background !== theme.background) deleteWallpaperFile(old.background); },
        addTheme: (theme) => { const themes = loadThemes(); themes.push(normalizeTheme(theme)); saveThemes(themes); registerThemes(); ctx.theme.setTheme(theme.id); writeSavedSkin(theme.id); },
        deleteTheme: (id) => { const themes = loadThemes(); const victim = themes.find((x) => x.id === id); const wasActive = ctx.theme.getTheme().preference === id; saveThemes(themes.filter((x) => x.id !== id)); registerThemes(); if (victim && victim.background) deleteWallpaperFile(victim.background); if (wasActive) { ctx.theme.setTheme(DEFAULT_SKIN); writeSavedSkin(DEFAULT_SKIN); } },
      };
      const ThemeSection = () => React.createElement(ThemeRow, Object.assign({ t: ctx.locale.bind(SETTINGS_NS) }, themeActions));
      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "ji-theme",
        order: 11,
        label: () => ctx.locale.bind(SETTINGS_NS)("ji-theme.title"),
        locale: SETTINGS_NS,
      }, ThemeSection));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
