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
    const STORAGE_PACKAGE = "ji-theme:package";
    const STORAGE_TRUSTED_HOOKS = "ji-theme:trusted-hooks";
    const STORAGE_STYLE_CLIP = "ji-theme:style-clip";
    const STORAGE_STYLE_PRESETS = "ji-theme:style-presets";
    const PACKAGES_URL = "/ji-theme/packages";
    // The wallpaper contract (C1 / Q3-B) is fetched at runtime from the host —
    // the browser half never mirrors media types, size caps, or URL rules.
    const CONTRACT_URL = "/ji-theme/wallpapers/contract";
    const DEFAULT_SKIN = "system";
    const DEFAULT_BG_OPACITY = 0.5;
    const DEFAULT_BG_BLUR = 0;
    const OVERRIDE_SOURCE = "ji-theme:background";
    const BUILTIN_BASE = { light: "rgb(255, 255, 255)", dark: "rgb(21, 21, 23)" };

    // Built-in skins as the first-run seed (5-field model).
    const COLOR_KEYS = ["baseColor", "surfaceColor", "textColor", "mutedColor", "accentColor", "panelAltColor", "accentAltColor", "secondaryColor", "highlightColor", "lineColor", "errorColor", "successColor", "warnColor", "linkColor", "codeBlockColor", "codeBannerColor", "shadowColor", "borderColor"];
    const PART_KEYS = ["sidebar", "panel", "composer", "dialog", "message", "menu", "tool"];
    // Non-color half of a theme: borders / opacity / effects / font. The palette is
    // deliberately excluded — a snippet borrows another theme's shape, not its
    // colors. The background image is theme identity too, so only its opacity travels.
    const STYLE_KEYS = ["fontFamily", "radius", "surfaceBlur", "density", "motion", "shadowStrength", "borderWidth", "borderStyle", "borderOpacity", "themeOpacity", "surfaceOpacity", "maskOpacity", "backgroundOpacity"];
    const STYLE_DEFAULTS = { fontFamily: "", radius: 12, surfaceBlur: 12, density: 1, motion: 1, shadowStrength: 35, borderWidth: 1, borderStyle: "solid", borderOpacity: 24, themeOpacity: 100, surfaceOpacity: 1, maskOpacity: 0.3, backgroundOpacity: DEFAULT_BG_OPACITY };
    const COLOR_LABELS = { baseColor: "baseColor", surfaceColor: "surfaceColor", textColor: "textColor", mutedColor: "mutedColor", accentColor: "accentColor", panelAltColor: "panelAlt", accentAltColor: "accentAlt", secondaryColor: "secondary", highlightColor: "highlight", lineColor: "line", errorColor: "errorColor", successColor: "successColor", warnColor: "warnColor", linkColor: "linkColor", codeBlockColor: "codeBlockColor", codeBannerColor: "codeBannerColor", shadowColor: "shadowColor", borderColor: "borderColor" };
    const DEFAULT_COLOR_ALPHA = Object.fromEntries(COLOR_KEYS.map((key) => [key, 1]));
    const DEFAULT_COLOR_ENABLED = Object.fromEntries(COLOR_KEYS.map((key) => [key, true]));
    const DEFAULT_PART_OPACITY = Object.fromEntries(PART_KEYS.map((key) => [key, 100]));

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
      "ji-theme.editor.fontFamily": "字体", "ji-theme.editor.errorColor": "错误色", "ji-theme.editor.successColor": "成功色", "ji-theme.editor.warnColor": "警告色", "ji-theme.editor.linkColor": "链接色", "ji-theme.editor.codeBlockColor": "代码块", "ji-theme.editor.codeBannerColor": "代码栏", "ji-theme.editor.shadowColor": "阴影色", "ji-theme.editor.shadowStrength": "阴影强度", "ji-theme.editor.radius": "圆角", "ji-theme.editor.surfaceBlur": "表面模糊", "ji-theme.editor.density": "密度", "ji-theme.editor.motion": "动效",
      "ji-theme.editor.borderColor": "边框色", "ji-theme.editor.borderWidth": "边框宽", "ji-theme.editor.borderStyle": "边框样式", "ji-theme.editor.borderOpacity": "边框透明", "ji-theme.editor.themeOpacity": "整体透明", "ji-theme.editor.panelOpacity": "面板透明", "ji-theme.editor.composerOpacity": "输入框透明", "ji-theme.editor.dialogOpacity": "对话框透明",
      "ji-theme.editor.part.sidebar": "侧栏透明", "ji-theme.editor.part.panel": "面板透明", "ji-theme.editor.part.composer": "输入框透明", "ji-theme.editor.part.dialog": "对话框透明", "ji-theme.editor.part.message": "消息透明", "ji-theme.editor.part.menu": "菜单透明",
      "ji-theme.editor.part.tool": "工具行透明",
      "ji-theme.editor.mutedColor": "次文字", "ji-theme.editor.accentColor": "强调色", "ji-theme.editor.panelAlt": "次级表面", "ji-theme.editor.accentAlt": "强调色·浅", "ji-theme.editor.secondary": "次要色", "ji-theme.editor.highlight": "高亮色", "ji-theme.editor.line": "边框", "ji-theme.editor.opacity": "主区透明度",
      "ji-theme.editor.background": "背景图", "ji-theme.editor.chooseImage": "选择图片", "ji-theme.editor.removeImage": "移除图片",
      "ji-theme.editor.zoom": "缩放", "ji-theme.editor.x": "横向", "ji-theme.editor.y": "纵向", "ji-theme.editor.blur": "模糊", "ji-theme.editor.surfaceOpacity": "表面透明度", "ji-theme.editor.backgroundOpacity": "背景图透明度", "ji-theme.editor.maskOpacity": "遮罩透明度", "ji-theme.preview.chat": "对话", "ji-theme.preview.settings": "设置",
      "ji-theme.editor.save": "保存", "ji-theme.editor.delete": "删除", "ji-theme.editor.cancel": "取消",
      "ji-theme.editor.done": "完成", "ji-theme.editor.resetTheme": "重置本主题",
      "ji-theme.missing": "壁纸缺失", "ji-theme.packageStoragePath": "主题包存储", "ji-theme.uploadError": "上传失败", "ji-theme.tooLarge": "壁纸超过 50MB 上限",
      "ji-theme.packages": "已导入主题包", "ji-theme.packagesEmpty": "暂无主题包", "ji-theme.select": "选择", "ji-theme.selected": "已选", "ji-theme.export": "导出", "ji-theme.delete": "删除", "ji-theme.packageReadonly": "主题包由包管理区维护，请用选择/导出/删除操作",
      "ji-theme.editPackage": "编辑", "ji-theme.cssEdit": "CSS 覆盖编辑", "ji-theme.cssSave": "保存覆盖", "ji-theme.cssReset": "恢复原始",
      "ji-theme.style.title": "样式片段", "ji-theme.style.copy": "复制样式", "ji-theme.style.paste": "粘贴样式", "ji-theme.style.save": "存为预设",
      "ji-theme.style.promptName": "预设名称", "ji-theme.style.defaultName": "样式", "ji-theme.style.apply": "应用", "ji-theme.style.remove": "删除", "ji-theme.style.confirm": "确定",
      "ji-theme.style.copied": "已复制当前样式", "ji-theme.style.applied": "已应用样式", "ji-theme.style.saved": "已保存预设",
      "ji-theme.style.presetsEmpty": "暂无预设：点「存为预设」保存当前样式，之后在任意主题里点「应用」即可套用。",
    };
    const en = {
      "ji-theme.title": "Theme", "ji-theme.default": "System",
      "ji-theme.ocean": "Ocean", "ji-theme.forest": "Forest", "ji-theme.sunset": "Sunset",
      "ji-theme.paper": "Paper", "ji-theme.sakura": "Sakura",      "ji-theme.new": "New", "ji-theme.edit": "Edit", "ji-theme.import": "Import",
      "ji-theme.editor.name": "Name", "ji-theme.editor.scheme": "Scheme", "ji-theme.editor.light": "Light", "ji-theme.editor.dark": "Dark",
      "ji-theme.editor.baseColor": "Session background", "ji-theme.editor.surfaceColor": "Surface / sidebar", "ji-theme.editor.textColor": "Primary text",
      "ji-theme.editor.fontFamily": "Font", "ji-theme.editor.errorColor": "Error", "ji-theme.editor.successColor": "Success", "ji-theme.editor.warnColor": "Warning", "ji-theme.editor.linkColor": "Link", "ji-theme.editor.codeBlockColor": "Code block", "ji-theme.editor.codeBannerColor": "Code banner", "ji-theme.editor.shadowColor": "Shadow color", "ji-theme.editor.shadowStrength": "Shadow strength", "ji-theme.editor.radius": "Radius", "ji-theme.editor.surfaceBlur": "Surface blur", "ji-theme.editor.density": "Density", "ji-theme.editor.motion": "Motion",
      "ji-theme.editor.borderColor": "Border color", "ji-theme.editor.borderWidth": "Border width", "ji-theme.editor.borderStyle": "Border style", "ji-theme.editor.borderOpacity": "Border opacity", "ji-theme.editor.themeOpacity": "Theme opacity", "ji-theme.editor.panelOpacity": "Panel opacity", "ji-theme.editor.composerOpacity": "Composer opacity", "ji-theme.editor.dialogOpacity": "Dialog opacity",
      "ji-theme.editor.part.sidebar": "Sidebar opacity", "ji-theme.editor.part.panel": "Panel opacity", "ji-theme.editor.part.composer": "Composer opacity", "ji-theme.editor.part.dialog": "Dialog opacity", "ji-theme.editor.part.message": "Message opacity", "ji-theme.editor.part.menu": "Menu opacity",
      "ji-theme.editor.part.tool": "Tool row opacity",
      "ji-theme.editor.mutedColor": "Secondary text", "ji-theme.editor.accentColor": "Accent", "ji-theme.editor.panelAlt": "Surface (alt)", "ji-theme.editor.accentAlt": "Accent (hover)", "ji-theme.editor.secondary": "Secondary", "ji-theme.editor.highlight": "Highlight", "ji-theme.editor.line": "Border", "ji-theme.editor.opacity": "Main opacity",
      "ji-theme.editor.background": "Background image", "ji-theme.editor.chooseImage": "Choose image", "ji-theme.editor.removeImage": "Remove image",
      "ji-theme.editor.zoom": "Zoom", "ji-theme.editor.x": "Horizontal", "ji-theme.editor.y": "Vertical", "ji-theme.editor.blur": "Blur", "ji-theme.editor.surfaceOpacity": "Surface opacity", "ji-theme.editor.backgroundOpacity": "Background opacity", "ji-theme.editor.maskOpacity": "Mask opacity", "ji-theme.preview.chat": "Chat", "ji-theme.preview.settings": "Settings",
      "ji-theme.editor.save": "Save", "ji-theme.editor.delete": "Delete", "ji-theme.editor.cancel": "Cancel",
      "ji-theme.editor.done": "Done", "ji-theme.editor.resetTheme": "Reset theme",
      "ji-theme.missing": "wallpaper missing", "ji-theme.packageStoragePath": "Package storage", "ji-theme.uploadError": "Upload failed", "ji-theme.tooLarge": "Wallpaper exceeds 50MB limit",
      "ji-theme.packages": "Imported packages", "ji-theme.packagesEmpty": "No packages", "ji-theme.select": "Select", "ji-theme.selected": "Selected", "ji-theme.export": "Export", "ji-theme.delete": "Delete", "ji-theme.packageReadonly": "Package themes are managed in the package list",
      "ji-theme.editPackage": "Edit", "ji-theme.cssEdit": "CSS override", "ji-theme.cssSave": "Save override", "ji-theme.cssReset": "Reset",
      "ji-theme.style.title": "Style snippet", "ji-theme.style.copy": "Copy style", "ji-theme.style.paste": "Paste style", "ji-theme.style.save": "Save preset",
      "ji-theme.style.promptName": "Preset name", "ji-theme.style.defaultName": "Style", "ji-theme.style.apply": "Apply", "ji-theme.style.remove": "Delete", "ji-theme.style.confirm": "OK",
      "ji-theme.style.copied": "Style copied", "ji-theme.style.applied": "Style applied", "ji-theme.style.saved": "Preset saved",
      "ji-theme.style.presetsEmpty": "No presets yet: use Save preset to store this style, then Apply it in any other theme.",
    };

    function readStorage(key) { try { const v = window.localStorage.getItem(key); return typeof v === "string" ? v : null; } catch { return null; } }
    function writeStorage(key, value) { try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch {} }
    function readSavedSkin() { return readStorage(STORAGE_SKIN); }
    function writeSavedSkin(id) { writeStorage(STORAGE_SKIN, id === DEFAULT_SKIN ? null : id); }

    let packagesState = { list: [], themes: [], revision: 0, loaded: false };
    const packageListeners = new Set();
    function notifyPackages() { for (const fn of packageListeners) { try { fn(); } catch {} } }
    function subscribePackages(fn) { packageListeners.add(fn); return () => packageListeners.delete(fn); }
    function getPackagesState() { return packagesState; }
    function readSelectedPackage() { return readStorage(STORAGE_PACKAGE); }
    function writeSelectedPackage(id) { writeStorage(STORAGE_PACKAGE, id === null || id === undefined ? null : id); }

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
        borderColor: t.borderColor ?? t.lineColor ?? t.textColor,
        borderWidth: t.borderWidth ?? 1,
        borderStyle: t.borderStyle ?? "solid",
        borderOpacity: t.borderOpacity ?? 24,
        themeOpacity: t.themeOpacity ?? 100,
        panelOpacity: t.panelOpacity ?? 100,
        composerOpacity: t.composerOpacity ?? 100,
        dialogOpacity: t.dialogOpacity ?? 100,
        colorAlpha: Object.assign({}, DEFAULT_COLOR_ALPHA, t.colorAlpha || {}),
        colorEnabled: Object.assign({}, DEFAULT_COLOR_ENABLED, t.colorEnabled || {}),
        partOpacity: Object.assign({}, DEFAULT_PART_OPACITY, t.partOpacity || {}),
        surfaceOpacity: t.surfaceOpacity ?? 1,
        maskOpacity: t.maskOpacity ?? 0.3,
        fontFamily: t.fontFamily ?? "",
        radius: t.radius ?? 12,
        surfaceBlur: t.surfaceBlur ?? 12,
        density: t.density ?? 1,
        motion: t.motion ?? 1,
        shadowColor: t.shadowColor ?? t.baseColor,
        shadowStrength: t.shadowStrength ?? 35,
        errorColor: t.errorColor ?? "#ec1313",
        successColor: t.successColor ?? "#22c55e",
        warnColor: t.warnColor ?? "#f59e0b",
        linkColor: t.linkColor ?? t.accentColor,
        codeBlockColor: t.codeBlockColor ?? t.surfaceColor,
        codeBannerColor: t.codeBannerColor ?? (t.panelAltColor ?? t.surfaceColor),
      });
    }
    function loadThemes() {
      const raw = readStorage(STORAGE_THEMES);
      if (raw !== null) {
        try { const p = JSON.parse(raw); if (Array.isArray(p)) return mergePackageThemes(p.map(normalizeTheme)); } catch {}
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
      return mergePackageThemes(themes);
    }
    function saveThemes(themes) { writeStorage(STORAGE_THEMES, JSON.stringify(themes)); }
    function mergePackageThemes(localThemes) {
      const merged = localThemes.slice();
      for (const theme of packagesState.themes) {
        if (!merged.some((entry) => entry.id === theme.id)) merged.push(theme);
      }
      return merged;
    }

    function toRgba(color, alpha) {
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
      if (hex !== null) { let d = hex[1]; if (d.length === 3) d = d.split("").map((c) => c + c).join(""); const n = parseInt(d, 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`; }
      const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(String(color).trim());
      if (rgb !== null) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
      return String(color);
    }
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function toAlpha(v, dflt) { const n = Number(v); return clamp01(Number.isFinite(n) ? n : dflt); }
    function colorEnabledOf(t, key) { return !(t.colorEnabled && t.colorEnabled[key] === false); }
    function colorAlphaOf(t, key) { return clamp01(t.colorAlpha && typeof t.colorAlpha[key] === "number" ? t.colorAlpha[key] : 1); }
    function effectiveColor(t, key) { return colorEnabledOf(t, key) ? toRgba(t[key], colorAlphaOf(t, key)) : "rgba(0, 0, 0, 0)"; }

    function newCustomTheme() {
      return { id: "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: "", colorScheme: "dark", baseColor: "#0a1020", surfaceColor: "#16233e", textColor: "#e9eef9", mutedColor: "#a5b3cc", accentColor: "#4d86f8", opacity: 1, background: null, backgroundOpacity: DEFAULT_BG_OPACITY, backgroundBlur: DEFAULT_BG_BLUR, backgroundZoom: 1, backgroundX: 0, backgroundY: 0, panelAltColor: "#16233e", accentAltColor: "#4d86f8", secondaryColor: "#4d86f8", highlightColor: "#4d86f8", lineColor: "#e9eef9", borderColor: "#e9eef9", borderWidth: 1, borderStyle: "solid", borderOpacity: 24, themeOpacity: 100, panelOpacity: 100, composerOpacity: 100, dialogOpacity: 100, surfaceOpacity: 1, maskOpacity: 0.3, fontFamily: "", radius: 12, surfaceBlur: 12, density: 1, motion: 1, shadowColor: "#000000", shadowStrength: 35, errorColor: "#ec1313", successColor: "#22c55e", warnColor: "#f59e0b", linkColor: "#4d86f8", codeBlockColor: "#16233e", codeBannerColor: "#16233e" };
    }
    // ---- style snippets: copy the non-color config between themes ----
    function styleSnapshotOf(theme) {
      const fields = {};
      for (const key of STYLE_KEYS) fields[key] = theme[key] ?? STYLE_DEFAULTS[key];
      const partOpacity = {};
      for (const key of PART_KEYS) partOpacity[key] = Math.round((theme.partOpacity && theme.partOpacity[key]) ?? 100);
      return { v: 1, name: theme.name || "", at: Date.now(), fields: fields, partOpacity: partOpacity };
    }
    // Foreign or stale JSON must never leak unknown keys into a draft: the snapshot
    // is re-projected onto the known field list and the opacities are clamped.
    function stylePatchOf(snapshot) {
      if (snapshot === null || typeof snapshot !== "object" || !snapshot.fields) return null;
      const fields = {};
      let seen = false;
      for (const key of STYLE_KEYS) {
        const value = snapshot.fields[key];
        if (value === undefined || value === null) continue;
        fields[key] = value;
        seen = true;
      }
      if (!seen) return null;
      const partOpacity = {};
      for (const key of PART_KEYS) {
        const value = Number(snapshot.partOpacity ? snapshot.partOpacity[key] : NaN);
        if (Number.isFinite(value)) partOpacity[key] = Math.min(100, Math.max(0, value));
      }
      fields.partOpacity = Object.assign({}, DEFAULT_PART_OPACITY, partOpacity);
      return fields;
    }
    function readStyleSnapshot() { try { const p = JSON.parse(readStorage(STORAGE_STYLE_CLIP) || "null"); return p !== null && typeof p === "object" && p.fields ? p : null; } catch { return null; } }
    function readStylePresets() { try { const p = JSON.parse(readStorage(STORAGE_STYLE_PRESETS) || "[]"); return Array.isArray(p) ? p.filter((x) => x !== null && typeof x === "object" && x.fields) : []; } catch { return []; } }
    function writeStylePresets(list) { writeStorage(STORAGE_STYLE_PRESETS, JSON.stringify(list)); }
    // ---- end style snippets ----
    // Guarded self-check (tools/check-client.mjs flips the flag): the snippet
    // parser re-reads localStorage JSON, so its shape rules must hold.
    if (globalThis.__JI_THEME_SELFTEST__ === true) {
      const snap = styleSnapshotOf({ name: "selftest", radius: 4, borderWidth: 3, partOpacity: { tool: 0 } });
      const back = stylePatchOf(snap);
      if (!(back.radius === 4 && back.borderWidth === 3 && back.partOpacity.tool === 0 && back.partOpacity.sidebar === 100)) throw new Error("style snippet roundtrip failed");
      if (stylePatchOf({ fields: { junk: 1 } }) !== null) throw new Error("style snippet must reject unknown keys");
      if ("baseColor" in back || "colorAlpha" in back || "background" in back) throw new Error("style snippet must not carry palette or wallpaper");
      if (readStylePresets().length !== 0) throw new Error("preset store must start empty");
      writeStylePresets([snap]);
      if (readStylePresets().length !== 1 || stylePatchOf(readStylePresets()[0]).radius !== 4) throw new Error("preset roundtrip failed");
      writeStylePresets([]);
    }
    function buildCustomTokens(t) {
      const globalAlpha = clamp01((t.themeOpacity ?? 100) / 100);
      const surfaceAlpha = clamp01(toAlpha(t.surfaceOpacity, 1) * globalAlpha);
      const maskA = toAlpha(t.maskOpacity, 0.3);
      const alphaOf = (key) => (colorEnabledOf(t, key) ? clamp01(colorAlphaOf(t, key) * globalAlpha) : 0);
      const col = (key, extra) => toRgba(t[key], clamp01(alphaOf(key) * (extra === undefined ? 1 : extra)));
      const base = col("baseColor");
      const surface = toRgba(t.surfaceColor, clamp01(surfaceAlpha * (colorEnabledOf(t, "surfaceColor") ? colorAlphaOf(t, "surfaceColor") : 0)));
      const muted = col("mutedColor");
      const panelAltColor = col("panelAltColor");
      const surfaceAlt = toRgba(t.surfaceColor, clamp01(surfaceAlpha + 0.08));
      const accent = col("accentColor");
      const accentAlt = col("accentAltColor");
      const secondary = col("secondaryColor");
      const highlight = col("highlightColor");
      const line = col("lineColor");
      const border = col("borderColor");
      const borderAlpha = clamp01(((t.borderOpacity ?? 24) / 100) * (colorEnabledOf(t, "borderColor") ? colorAlphaOf(t, "borderColor") : 0) * globalAlpha);
      const labelDimmed = col("mutedColor", 0.55);
      const foregroundOnAccent = t.colorScheme === "light" ? "#ffffff" : "#0f1115";
      return {
        "--dsw-alias-bg-base": base, "--dsw-alias-bg-layer-1": surface, "--dsw-alias-bg-layer-2": panelAltColor, "--dsw-alias-bg-layer-3": panelAltColor,
        "--dsw-alias-bg-overlay": surfaceAlt, "--dsw-alias-bg-module-platform": panelAltColor, "--dsw-alias-bg-multi-select": panelAltColor, "--dsw-alias-bg-skeleton": col("textColor", 0.08),
        "--dsw-alias-bg-mask-1": "rgba(0, 0, 0, " + maskA + ")", "--dsw-alias-bg-mask-2": "rgba(0, 0, 0, " + clamp01(maskA * 0.5) + ")", "--dsw-alias-bg-mask-3": "rgba(0, 0, 0, " + clamp01(maskA * 2) + ")",
        "--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, " + clamp01(maskA * 2.8) + ")", "--dsw-alias-bg-mask-drop": toRgba(t.surfaceColor, 0.7),
        "--dsw-alias-border-inverted": col("textColor", 0.06), "--dsw-alias-border-inverted2": col("textColor", 0.08),
        "--dsw-alias-border-l1": toRgba(border, clamp01(borderAlpha * 0.35)), "--dsw-alias-border-l2": toRgba(border, clamp01(borderAlpha * 0.6)), "--dsw-alias-border-l2-darkmode-thin": toRgba(border, clamp01(borderAlpha * 0.45)), "--dsw-alias-border-l3": toRgba(border, clamp01(borderAlpha * 0.85)), "--dsw-alias-border-l4": toRgba(border, borderAlpha),
        "--dsw-alias-brand-primary": accent, "--dsw-alias-brand-primary-invert": base, "--dsw-alias-brand-text": accent,
        "--dsw-alias-label-primary": col("textColor"), "--dsw-alias-label-primary-dimmed": col("textColor", 0.8), "--dsw-alias-label-primary-foreground": foregroundOnAccent,
        "--dsw-alias-label-secondary": col("mutedColor"), "--dsw-alias-label-tertiary": col("mutedColor", 0.85), "--dsw-alias-label-caption": col("mutedColor", 0.7), "--dsw-alias-label-dimmed": labelDimmed,
        "--dsw-alias-interactive-bg-hover": col("accentColor", 0.12), "--dsw-alias-interactive-bg-hover-accent": col("accentColor", 0.2), "--dsw-alias-interactive-bg-hover-solid": panelAltColor,
        "--dsw-alias-interactive-bg-hover-danger": "rgba(236, 19, 19, 0.08)", "--dsw-alias-interactive-bg-active": highlight,
        "--dsw-alias-button-contrast-fill": col("textColor"), "--dsw-alias-button-elevated-fill": surface, "--dsw-alias-button-floating-fill": surface, "--dsw-alias-button-floating-hover": panelAltColor,
        "--dsw-alias-button-primary-dimmed": col("accentColor", 0.5), "--dsw-alias-button-primary-fill": accent, "--dsw-alias-button-primary-hover": accentAlt,
        "--dsw-alias-button-info-fill": accent, "--dsw-alias-button-info-hover": accentAlt,
        "--dsw-alias-state-business-primary": secondary, "--dsw-alias-state-business-tertiary": col("secondaryColor", 0.16),
        "--dsw-alias-state-error-primary": col("errorColor"), "--dsw-alias-state-error-secondary": col("errorColor", 0.75),
        "--dsw-alias-state-success-primary": col("successColor"), "--dsw-alias-state-success-secondary": col("successColor", 0.75), "--dsw-alias-state-success-tertiary": col("successColor", 0.16),
        "--dsw-alias-state-warn-primary": col("warnColor"), "--dsw-alias-state-warn-secondary": col("warnColor", 0.75), "--dsw-alias-state-warn-label": col("warnColor", 0.9), "--dsw-alias-state-warn-tertiary": col("warnColor", 0.16),
        "--dsw-alias-link": col("linkColor"),
        "--dsw-alias-markdown-code-block": col("codeBlockColor"), "--dsw-alias-markdown-code-block-banner": col("codeBannerColor"), "--dsw-alias-markdown-inline-code": surface,
        "--dsw-shadow-lv1": "0 1px 3px " + col("shadowColor", (t.shadowStrength ?? 35) / 100 * 0.18), "--dsw-shadow-lv2": "0 4px 14px " + col("shadowColor", (t.shadowStrength ?? 35) / 100 * 0.24), "--dsw-shadow-lv3": "0 12px 32px " + col("shadowColor", (t.shadowStrength ?? 35) / 100 * 0.32),
        "--dsw-alias-markdown-code-segment-selected": surfaceAlt, "--dsw-alias-markdown-code-segment-unselected": base, "--dsw-alias-markdown-placeholder": panelAltColor, "--dsw-alias-markdown-tag": panelAltColor,
        "--dsw-alias-scrollbar-bg-l1": col("mutedColor", 0.3), "--dsw-alias-scrollbar-bg-l2": col("mutedColor", 0.35), "--dsw-alias-scrollbar-hover-l1": col("mutedColor", 0.5), "--dsw-alias-scrollbar-hover-l2": col("mutedColor", 0.55),
        "--dsw-alias-toast-bg": panelAltColor, "--dsw-alias-tooltip-bg": panelAltColor,
        "--dsw-specific-bubble": surface, "--dsw-specific-bubble-highlight": surfaceAlt,
        "--dsw-specific-input-major": surface, "--dsw-specific-login-input": surface, "--dsw-specific-menu": panelAltColor, "--dsw-specific-selector": panelAltColor, "--dsw-specific-tip": panelAltColor,
        "--dsw-specific-sidebar-fill": base, "--dsw-specific-sidebar-nav-item-active": surface, "--dsw-specific-sidebar-nav-item-active-accent": accent, "--dsw-specific-sidebar-nav-item-hover": toRgba(t.surfaceColor, clamp01(surfaceAlpha * 0.8)),
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
      textarea: { minHeight: "160px", padding: "10px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", fontSize: "12px", fontFamily: "ui-monospace, monospace", lineHeight: "18px", resize: "vertical", boxSizing: "border-box" },
      colorInput: { width: "36px", height: "30px", padding: "0", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", background: "var(--dsw-alias-bg-layer-1)", cursor: "pointer" },
      fieldRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
      fieldLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px", whiteSpace: "nowrap", width: "96px" },
      sliderRow: { display: "flex", alignItems: "center", gap: "10px", minWidth: "240px" },
      slider: { flex: 1, accentColor: "var(--dsw-alias-brand-primary)" },
      sliderValue: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", whiteSpace: "nowrap", width: "44px", textAlign: "right" },
      actionRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
      editor: { display: "flex", flexDirection: "column", gap: "10px", paddingTop: "4px" },
      editorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", paddingTop: "4px" },
      colorItem: { display: "flex", flexDirection: "column", gap: "6px", padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)" },
      colorHead: { display: "flex", alignItems: "center", gap: "6px" },
      arrowButton: { width: "22px", height: "22px", padding: "0", border: "0", background: "transparent", color: "var(--dsw-alias-label-secondary)", cursor: "pointer", fontSize: "12px", lineHeight: "22px", borderRadius: "5px" },
      colorBody: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
      colorSwatch: { width: "34px", height: "26px", padding: "0", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", cursor: "pointer" },
      pickerPop: { position: "relative", zIndex: 2, width: "100%", marginTop: "8px", padding: "10px", borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" },
      pickerSquare: { position: "relative", width: "100%", height: "140px", borderRadius: "6px", cursor: "crosshair", touchAction: "none" },
      pickerHue: { height: "14px", marginTop: "8px", borderRadius: "7px", cursor: "pointer", touchAction: "none", background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" },
      pickerAlpha: { height: "14px", marginTop: "8px", borderRadius: "7px", cursor: "pointer", touchAction: "none" },
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

    function hexToRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "")); if (m === null) return { r: 0, g: 0, b: 0 }; const n = parseInt(m[1], 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
    function rgbToHex(r, g, b) { const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); return "#" + c(r) + c(g) + c(b); }
    function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0; if (d !== 0) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return { h, s: max === 0 ? 0 : d / max, v: max }; }
    function hsvToRgb(h, s, v) { const c = v * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = v - c; let r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }; }

    function ColorPicker({ value, alpha, onChange, onClose }) {
      const initial = hexToRgb(value); const start = rgbToHsv(initial.r, initial.g, initial.b);
      const [h, setH] = React.useState(start.h); const [s, setS] = React.useState(start.s); const [v, setV] = React.useState(start.v); const [a, setA] = React.useState(alpha);
      React.useEffect(() => { const rgb = hexToRgb(value); const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b); setH(hsv.h); setS(hsv.s); setV(hsv.v); }, [value]);
      React.useEffect(() => { setA(alpha); }, [alpha]);
      const squareRef = React.useRef(null); const hueRef = React.useRef(null); const alphaRef = React.useRef(null);
      const emit = (nh, ns, nv, na) => { const rgb = hsvToRgb(nh, ns, nv); onChange(rgbToHex(rgb.r, rgb.g, rgb.b), na); };
      const point = (event, el) => { const rect = el.getBoundingClientRect(); return { x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01((event.clientY - rect.top) / rect.height) }; };
      const onSquare = (event) => { if (squareRef.current === null) return; const p = point(event, squareRef.current); const ns = p.x; const nv = 1 - p.y; setS(ns); setV(nv); emit(h, ns, nv, a); };
      const onHue = (event) => { if (hueRef.current === null) return; const nh = point(event, hueRef.current).x * 360; setH(nh); emit(nh, s, v, a); };
      const onAlpha = (event) => { if (alphaRef.current === null) return; const na = point(event, alphaRef.current).x; setA(na); emit(h, s, v, na); };
      const popStyle = S.pickerPop;
      return React.createElement("div", { style: popStyle },
        React.createElement("div", { ref: squareRef, style: Object.assign({}, S.pickerSquare, { background: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(" + h + ", 100%, 50%)" }), onPointerDown: (event) => { event.currentTarget.setPointerCapture(event.pointerId); onSquare(event); }, onPointerMove: (event) => { if (event.buttons === 1) onSquare(event); } }),
        React.createElement("div", { ref: hueRef, style: S.pickerHue, onPointerDown: (event) => { event.currentTarget.setPointerCapture(event.pointerId); onHue(event); }, onPointerMove: (event) => { if (event.buttons === 1) onHue(event); } }),
        React.createElement("div", { ref: alphaRef, style: Object.assign({}, S.pickerAlpha, { background: "linear-gradient(to right, transparent, " + value + "), repeating-conic-gradient(#808080 0 25%, #fff 0 50%) 0 0 / 8px 8px" }), onPointerDown: (event) => { event.currentTarget.setPointerCapture(event.pointerId); onAlpha(event); }, onPointerMove: (event) => { if (event.buttons === 1) onAlpha(event); } }),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" } },
          React.createElement("input", { type: "text", style: S.input, value: value, onChange: (event) => { const raw = event.target.value; if (/^#?[0-9a-f]{6}$/i.test(raw)) onChange(raw.startsWith("#") ? raw : "#" + raw, a); } }),
          React.createElement("span", { style: S.sliderValue }, Math.round(a * 100) + "%"),
          React.createElement("button", { type: "button", style: S.button, onClick: onClose }, "OK"),
        ),
      );
    }

    function ColorControl({ label, colorKey, draft, onPatchFields, onReset }) {
      const [open, setOpen] = React.useState(false); const [picker, setPicker] = React.useState(false); const swatchRef = React.useRef(null);
      const value = draft[colorKey] ?? "#000000"; const enabled = colorEnabledOf(draft, colorKey); const alpha = colorAlphaOf(draft, colorKey);
      const setColor = (hex, na) => onPatchFields({ [colorKey]: hex, colorAlpha: Object.assign({}, draft.colorAlpha, { [colorKey]: na }), colorEnabled: Object.assign({}, draft.colorEnabled, { [colorKey]: true }) });
      return React.createElement("div", { style: S.colorItem },
        React.createElement("div", { style: S.colorHead },
          React.createElement("span", { style: S.fieldLabel }, label),
          React.createElement("button", { type: "button", style: S.arrowButton, onClick: () => setOpen(!open), "aria-expanded": open }, open ? "▾" : "▸"),
          React.createElement("input", { type: "checkbox", checked: enabled, style: { marginLeft: "auto", accentColor: "var(--dsw-alias-brand-primary)" }, onChange: (event) => onPatchFields({ colorEnabled: Object.assign({}, draft.colorEnabled, { [colorKey]: event.target.checked }) }) }),
        ),
        open ? React.createElement("div", { style: S.colorBody },
          React.createElement("button", { ref: swatchRef, type: "button", style: Object.assign({}, S.colorSwatch, { background: enabled ? toRgba(value, alpha) : "rgba(0,0,0,0)" }), onClick: () => setPicker(true) }),
          React.createElement(Slider, { label: "透明度", value: Math.round(alpha * 100), min: 0, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => onPatchFields({ colorAlpha: Object.assign({}, draft.colorAlpha, { [colorKey]: v / 100 }) }) }),
          React.createElement("button", { type: "button", style: S.button, onClick: () => onReset(colorKey) }, "重置"),
          picker ? React.createElement(ColorPicker, { value, alpha, onChange: setColor, onClose: () => setPicker(false) }) : null,
        ) : null,
      );
    }

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

    // ---- theme package API (host-side package store) ----
    async function fetchPackageList() {
      const res = await fetch(PACKAGES_URL);
      if (!res.ok) throw new Error("packages HTTP " + res.status);
      const json = await res.json();
      return Array.isArray(json.packages) ? json.packages : [];
    }
    async function uploadPackageFile(file) {
      const res = await fetch(PACKAGES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/zip", "X-JI-Filename": encodeURIComponent(file.name) },
        body: file,
      });
      if (!res.ok) {
        let message = res.status === 405
          ? "HTTP 405: host \u7aef\u672a\u52a0\u8f7d ji-theme \u65b0\u7248\u672c\uff0c\u8bf7\u91cd\u542f dsh web"
          : "HTTP " + res.status;
        try { const json = await res.json(); if (json && json.message && !String(message).startsWith("HTTP 405")) message = json.message; } catch {}
        throw new Error(message);
      }
      const json = await res.json();
      return json.package;
    }
    async function deletePackageRemote(id) {
      const res = await fetch(PACKAGES_URL + "/" + encodeURIComponent(id), { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error("HTTP " + res.status);
    }
    function packageFileUrl(id, rel) {
      const encoded = String(rel || "").split("/").map((part) => encodeURIComponent(part)).join("/");
      return PACKAGES_URL + "/" + encodeURIComponent(id) + "/files/" + encoded;
    }
    async function fetchPackageText(id, rel) {
      const res = await fetch(packageFileUrl(id, rel));
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }
    async function fetchPackageOverrides(id) {
      const res = await fetch(PACKAGES_URL + "/" + encodeURIComponent(id) + "/overrides");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      return json.overrides || null;
    }
    async function savePackageOverridesRemote(id, payload) {
      const res = await fetch(PACKAGES_URL + "/" + encodeURIComponent(id) + "/overrides", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("HTTP " + res.status);
    }
    async function resetPackageOverridesRemote(id) {
      const res = await fetch(PACKAGES_URL + "/" + encodeURIComponent(id) + "/overrides", { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error("HTTP " + res.status);
    }
    async function loadPackages() {
      const list = await fetchPackageList();
      const themes = [];
      for (const pkg of list) {
        if (pkg.format !== "dreamskin-v1") continue;
        try { themes.push(await fetchDreamSkinTheme(pkg)); }
        catch (err) { console.warn("[ji-theme] package theme load failed:", pkg.id, err); }
      }
      packagesState = { list, themes, revision: packagesState.revision + 1, loaded: true };
      notifyPackages();
      return packagesState;
    }
    async function fetchDreamSkinTheme(pkg) {
      const themeJson = JSON.parse(await fetchPackageText(pkg.id, "theme.json"));
      const cssText = await fetchPackageText(pkg.id, "theme.css").catch(() => "");
      const imageName = themeJson.image || pkg.background || null;
      const backgroundUrl = imageName ? packageFileUrl(pkg.id, imageName) : null;
      const theme = mapDreamSkin(themeJson, cssText, backgroundUrl, pkg.id);
      theme.packageId = pkg.id;
      theme.name = pkg.name || theme.name;
      const overrides = await fetchPackageOverrides(pkg.id).catch(() => null);
      if (overrides && overrides.theme) {
        Object.assign(theme, overrides.theme);
        theme.hasOverrides = true;
      }
      theme.id = pkg.id;
      theme.packageId = pkg.id;
      theme.name = (overrides && overrides.theme && overrides.theme.name) || pkg.name || theme.name;
      theme.colorAlpha = Object.assign({}, DEFAULT_COLOR_ALPHA, theme.colorAlpha || {});
      theme.colorEnabled = Object.assign({}, DEFAULT_COLOR_ENABLED, theme.colorEnabled || {});
      theme.partOpacity = Object.assign({}, DEFAULT_PART_OPACITY, theme.partOpacity || {});
      theme.css = mapDreamSkinCss(cssText, theme);
      return theme;
    }

    //#region zip import (DreamSkin .zip -> theme)
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
    function cssProp(body, name) {
      const i = body.indexOf(name);
      if (i === -1) return null;
      const semi = body.indexOf(';', i);
      return body.slice(i + name.length, semi === -1 ? body.length : semi).trim();
    }
    const DS_PART_MAP = {
      root: ':root, body',
      sidebar: '[data-slot="sidebar"], [data-pane="sidebar"]',
      main: '[data-slot="main"]',
      header: '[data-slot="main"] header, header',
      home: '[data-slot="main"], [role="main"]',
      'home-hero': '[data-slot="main"] h1, [data-slot="main"]',
      'project-list': '[data-slot="sidebar"] [role="list"], [data-slot="main"] [role="list"], [data-slot="sidebar"]',
      thread: '[data-slot="conversation.session"], [data-slot="main.conversation"]',
      message: '[data-chat-flow-kind], [data-message-author-role]',
      composer: '[data-slot="conversation.composer"], [data-composer-card], [data-composer-seat]',
      'composer-toolbar': '[data-slot="conversation.composer"] footer, [data-slot="conversation.input.dock"], [data-composer-card] footer',
      dialog: '[role="dialog"], [role="menu"]',
    };
    function parseThemeAlphas(css) {
      const text = css || '';
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
        backgroundOpacity: alphaOf('main') ?? alphaOf('thread') ?? IMPORT_DEFAULT_OPACITY,
        surfaceOpacity: alphaOf('message') ?? alphaOf('composer') ?? alphaOf('panel') ?? IMPORT_DEFAULT_OPACITY,
      };
    }
    function dsThemeVars(t) {
      const sa = toAlpha(t.surfaceOpacity, 1);
      const line = t.lineColor ?? t.textColor;
      return {
        '--ds-theme-color-background': t.baseColor,
        '--ds-theme-color-panel': toRgba(t.surfaceColor, sa),
        '--ds-theme-color-panel-alt': toRgba(t.panelAltColor ?? t.surfaceColor, sa),
        '--ds-theme-color-accent': t.accentColor,
        '--ds-theme-color-accent-alt': t.accentAltColor ?? t.accentColor,
        '--ds-theme-color-secondary': t.secondaryColor ?? t.accentColor,
        '--ds-theme-color-highlight': t.highlightColor ?? t.accentColor,
        '--ds-theme-color-text': t.textColor,
        '--ds-theme-color-muted': t.mutedColor,
        '--ds-theme-color-line': line,
        '--ds-theme-font-family': t.fontFamily || 'inherit',
        '--ds-theme-font-scale': '1',
        '--ds-theme-surface-opacity': String(sa),
        '--ds-theme-surface-blur': String(t.surfaceBlur ?? 12) + 'px',
        '--ds-theme-surface-radius': String(t.radius ?? 12) + 'px',
        '--ds-theme-surface-border-alpha': '0.24',
        '--ds-theme-surface-shadow': '0 10px 30px ' + toRgba(t.shadowColor ?? '#000000', (t.shadowStrength ?? 35) / 100 * 0.28),
        '--ds-theme-image-focus-x': String(t.backgroundX ?? 0),
        '--ds-theme-image-focus-y': String(t.backgroundY ?? 0),
        '--ds-theme-image-zoom': String(t.backgroundZoom ?? 1),
        '--ds-theme-image-dim': String(toAlpha(t.backgroundOpacity, DEFAULT_BG_OPACITY)),
        '--ds-theme-image-task-intensity': '1',
        '--ds-theme-density-scale': String(t.density ?? 1),
        '--ds-theme-motion-level': String(t.motion ?? 1),
      };
    }
    function mapDreamSkinCss(css, draft) {
      const text = String(css || '');
      const out = [];
      const vars = dsThemeVars(draft);
      out.push('body{' + Object.entries(vars).map(([k, v]) => k + ':' + v).join(';') + '}');
      const root = extractPart(text, 'root');
      if (root) {
        const font = cssProp(root, 'font-family:');
        if (font) out.push('body{font-family:' + font + '}');
      }
      const ruleRe = /\[data-ds-part="([^"]+)"\]((?::[a-z-]+)*)\s*\{([^{}]*)\}/gi;
      let match;
      let matched = 0;
      while ((match = ruleRe.exec(text)) !== null) {
        matched += 1;
        const part = match[1];
        const state = match[2] || '';
        const body = match[3].replace(/letter-spacing\s*:[^;{}]+;?/gi, '');
        const mapped = DS_PART_MAP[part] || '[data-ds-part="' + part + '"]';
        const selectors = mapped.split(',').map((selector) => selector.trim() + state).join(', ');
        if (body.trim().length > 0) out.push(selectors + '{' + body + '}');
      }
      if (matched === 0) out.push('body{font-family:' + (draft.fontFamily || 'inherit') + '}');
      const applyExtra = !draft.packageId || draft.hasOverrides === true;
      if (applyExtra) {
        const borderPaint = toRgba(draft.borderColor ?? draft.lineColor ?? draft.textColor, clamp01((draft.borderOpacity ?? 24) / 100));
        const part = (key, dflt) => (draft.partOpacity && typeof draft.partOpacity[key] === "number") ? draft.partOpacity[key] : (dflt === undefined ? 100 : dflt);
        out.push('[data-slot="conversation.composer"],[data-composer-card],[data-composer-seat],[role="dialog"],[role="menu"]{border:' + (draft.borderWidth ?? 1) + 'px ' + (draft.borderStyle ?? 'solid') + ' ' + borderPaint + ' !important}');
        out.push('[data-slot="conversation.composer"],[data-composer-card],[data-composer-seat]{background-color:color-mix(in srgb, var(--ds-theme-color-panel) ' + part("composer") + '%, transparent) !important}');
        out.push('[role="dialog"],[role="menu"]{background-color:color-mix(in srgb, var(--ds-theme-color-panel-alt) ' + part("dialog") + '%, transparent) !important}');
        out.push('[data-slot="sidebar"],[data-pane="sidebar"]{background-color:color-mix(in srgb, var(--ds-theme-color-background) ' + part("sidebar") + '%, transparent) !important}');
        out.push('[data-chat-flow-kind],[data-message-author-role]{background-color:color-mix(in srgb, var(--ds-theme-color-panel) ' + part("message") + '%, transparent) !important}');
        out.push('[data-chat-flow-kind]:has([data-disclosure-row]),[data-chat-flow-kind]:has([data-turn-process]),[data-slot="main.conversation"] [class*="callRow"],[data-slot="main.conversation"] [class*="toolRow"],[data-disclosure-row],[data-turn-process]{background-color:color-mix(in srgb, var(--ds-theme-color-panel) ' + part("tool") + '%, transparent) !important;background-image:none !important;box-shadow:none !important}');
        out.push('[data-slot="rightbar"]{background-color:color-mix(in srgb, var(--ds-theme-color-panel) ' + part("panel") + '%, transparent) !important}');
        out.push('[data-slot="conversation.composer"],[data-composer-card],[data-composer-seat],[role="dialog"],[role="menu"],[data-slot="sidebar"]{border-radius:var(--ds-theme-surface-radius,12px)}');
        const blurParts = '[data-slot="conversation.composer"],[data-composer-card],[data-composer-seat],[role="dialog"],[role="menu"],[data-slot="sidebar"],[data-pane="sidebar"],[data-slot="main"],[data-slot="main.conversation"],[data-slot="conversation.session"],header,[data-chat-flow-kind]';
        if ((draft.surfaceBlur ?? 12) <= 0) out.push(blurParts + '{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}');
        else out.push(blurParts + '{backdrop-filter:blur(var(--ds-theme-surface-blur,12px));-webkit-backdrop-filter:blur(var(--ds-theme-surface-blur,12px))}');
        out.push('body{--ds-transition-duration:calc(var(--ds-theme-motion-level,1) * 0.2s);--ds-transition-duration-fast:calc(var(--ds-theme-motion-level,1) * 0.1s);--ds-transition-duration-slow:calc(var(--ds-theme-motion-level,1) * 0.3s)}');
      }
      return out.join('\n') + '\ninput, textarea, [contenteditable] { letter-spacing: normal; }';
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
    function mapDreamSkin(themeJson, cssText, imageDataUrl, forcedId) {
      const c = themeJson.colors || {};
      const art = themeJson.art || {};
      const parsed = parseThemeAlphas(cssText);
      const root = extractPart(cssText, 'root');
      const theme = {
        id: forcedId || 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: themeJson.name || themeJson.id || 'Imported theme',
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
        fontFamily: root ? cssProp(root, 'font-family:') : null,
        borderColor: hexFromColor(c.line) || c.text || '#ffffff',
        borderWidth: 1,
        borderStyle: "solid",
        borderOpacity: 24,
        themeOpacity: 100,
        panelOpacity: 100,
        composerOpacity: 100,
        dialogOpacity: 100,
        radius: 12,
        surfaceBlur: 12,
        density: 1,
        motion: 1,
        shadowColor: c.background || '#000000',
        shadowStrength: 35,
        errorColor: '#ec1313',
        successColor: '#22c55e',
        warnColor: '#f59e0b',
        linkColor: c.accent || '#ffffff',
        codeBlockColor: c.panel || c.background || '#000000',
        codeBannerColor: c.panelAlt || c.panel || c.background || '#000000',
        opacity: 1,
        surfaceOpacity: parsed.surfaceOpacity,
        background: imageDataUrl || null,
        backgroundOpacity: parsed.backgroundOpacity,
        backgroundBlur: DEFAULT_BG_BLUR,
        backgroundZoom: 1,
        backgroundX: art.focusX != null ? Math.round((art.focusX - 0.5) * 200) : 0,
        backgroundY: art.focusY != null ? Math.round((art.focusY - 0.5) * 200) : 0,
        css: ''
      };
      theme.css = mapDreamSkinCss(cssText, theme);
      return theme;
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
      const dirtyRef = React.useRef(false);
      const [styleClip, setStyleClip] = React.useState(readStyleSnapshot);
      const [stylePresets, setStylePresets] = React.useState(readStylePresets);
      const [styleNote, setStyleNote] = React.useState(null);
      const [presetName, setPresetName] = React.useState(null);
      const noteTimer = React.useRef(null);

      // Q6-A: uploads stay disabled until the wallpaper contract is fetched
      // (the client mirrors nothing, so it cannot act before the contract).
      React.useEffect(() => {
        let off = subscribeContract(() => setContractReady(true));
        loadContract().then(() => setContractReady(true)).catch(() => {});
        return off;
      }, []);

      const [packages, setPackages] = React.useState(() => getPackagesState().list);
      const [activePackageId, setActivePackageId] = React.useState(() => props.getActivePackage());
      React.useEffect(() => {
        const off = props.subscribePackages(() => {
          setPackages(getPackagesState().list);
          setActivePackageId(props.getActivePackage());
          setThemes(props.loadThemes());
        });
        props.loadPackages().catch(() => {});
        return off;
      }, []);

      // Q11-B: show the host-side wallpaper storage path as a small line.
      // Runs only after the contract is ready (urlPrefix comes from it).
      React.useEffect(() => {
        if (!contractReady) return;
        let cancelled = false;
        fetch(PACKAGES_URL).then((r) => r.ok ? r.json() : null).then((j) => { if (!cancelled && j && typeof j.path === "string") setStoragePath(j.path); }).catch(() => {});
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
        setActivePackageId(getPackagesState().list.some((entry) => entry.id === id) ? id : null);
        if (editing !== null) {
          cleanupUnsavedBackground(editing.draft);
          if (id === DEFAULT_SKIN) { setEditing(null); }
          else { const index = themes.findIndex((x) => x.id === id); if (index >= 0) { dirtyRef.current = false; setEditing({ mode: "edit", index, baseline: Object.assign({}, themes[index]), draft: Object.assign({}, themes[index]) }); } }
        }
      };
      const refreshThemes = () => setThemes(props.loadThemes());
      const startNew = () => { if (editing !== null) cleanupUnsavedBackground(editing.draft); const fresh = newCustomTheme(); dirtyRef.current = false; setEditing({ mode: "new", index: -1, baseline: Object.assign({}, fresh), draft: fresh }); };
      const zipRef = React.useRef(null);
      const onZipFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file === undefined) return;
        setActionError(null);
        try {
          const meta = await uploadPackageFile(file);
          const state = await props.loadPackages();
          refreshThemes();
          const pkg = state.list.find((entry) => entry.id === (meta && meta.id)) || state.list[0];
          if (pkg !== undefined) {
            props.selectPackage(pkg);
            setActivePackageId(pkg.id);
            if (pkg.format === "dreamskin-v1") setPref(pkg.id);
          }
        } catch (err) {
          setActionError(err && err.message ? err.message : String(err));
          console.error("[ji-theme] import failed:", err);
        }
      };
      const selectPackage = (pkg) => {
        props.selectPackage(pkg);
        setActivePackageId(pkg.id);
        if (pkg.format === "dreamskin-v1") setPref(pkg.id);
        else setPref(props.getSnapshot().preference);
      };
      const removePackage = async (pkg) => {
        try {
          await props.deletePackage(pkg);
          const state = getPackagesState();
          setPackages(state.list);
          setActivePackageId(props.getActivePackage());
          refreshThemes();
        } catch (err) { setActionError(err && err.message ? err.message : String(err)); }
      };
      const [cssEdit, setCssEdit] = React.useState(null);
      const [cssBusy, setCssBusy] = React.useState(false);
      const beginCssEdit = async (pkg) => {
        try {
          const overrides = await fetchPackageOverrides(pkg.id);
          setCssEdit({ id: pkg.id, text: overrides && typeof overrides.css === "string" ? overrides.css : "" });
        } catch (err) { setActionError(err && err.message ? err.message : String(err)); }
      };
      const saveCssEdit = async () => {
        if (cssEdit === null) return;
        setCssBusy(true);
        try {
          await savePackageOverridesRemote(cssEdit.id, { css: cssEdit.text });
          const pkg = packages.find((entry) => entry.id === cssEdit.id);
          setCssEdit(null);
          await props.loadPackages();
          if (pkg) props.selectPackage(pkg);
          refreshThemes();
        } catch (err) { setActionError(err && err.message ? err.message : String(err)); }
        finally { setCssBusy(false); }
      };
      const resetCssEdit = async () => {
        if (cssEdit === null) return;
        setCssBusy(true);
        try {
          await resetPackageOverridesRemote(cssEdit.id);
          const pkg = packages.find((entry) => entry.id === cssEdit.id);
          setCssEdit({ id: cssEdit.id, text: "" });
          await props.loadPackages();
          if (pkg) props.selectPackage(pkg);
        } catch (err) { setActionError(err && err.message ? err.message : String(err)); }
        finally { setCssBusy(false); }
      };
      const editPackage = (pkg) => {
        if (pkg.format === "dsh-v2") { beginCssEdit(pkg); return; }
        const theme = themes.find((entry) => entry.packageId === pkg.id);
        selectPackage(pkg);
        if (theme) { dirtyRef.current = false; setEditing({ mode: "edit", index: -1, baseline: Object.assign({}, theme), draft: Object.assign({}, theme) }); }
      };
      const startEditSelected = () => {
        if (pref === "system" || pref === "light" || pref === "dark") return;
        if (editing !== null) cleanupUnsavedBackground(editing.draft);
        const index = themes.findIndex((x) => x.id === pref);
        if (index >= 0) { dirtyRef.current = false; setEditing({ mode: "edit", index, baseline: Object.assign({}, themes[index]), draft: Object.assign({}, themes[index]) }); }
      };
      const patchFields = (fields) => setEditing((e) => {
        if (e === null) return e;
        dirtyRef.current = true;
        return { mode: e.mode, index: e.index, baseline: e.baseline, draft: Object.assign({}, e.draft, fields) };
      });
      const patch = (field, value) => patchFields({ [field]: value });
      const flash = (text) => { setStyleNote(text); if (noteTimer.current !== null) clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setStyleNote(null), 2000); };
      const copyStyle = () => { const snap = styleSnapshotOf(editing === null ? {} : editing.draft); writeStorage(STORAGE_STYLE_CLIP, JSON.stringify(snap)); setStyleClip(snap); flash(t("ji-theme.style.copied")); };
      const pasteStyle = () => { const fields = stylePatchOf(styleClip); if (fields === null) return; patchFields(fields); flash(t("ji-theme.style.applied")); };
      // window.prompt is blocked in the DSH web surface, so the name is typed
      // inline: the button reveals the field, Enter commits, Escape cancels.
      const beginSavePreset = () => { if (editing === null) return; setPresetName(editing.draft.name || t("ji-theme.style.defaultName")); };
      const commitSavePreset = () => {
        if (editing === null || presetName === null) return;
        const name = presetName.trim() === "" ? t("ji-theme.style.defaultName") : presetName.trim();
        const snap = Object.assign(styleSnapshotOf(editing.draft), { name: name });
        const list = readStylePresets();
        const index = list.findIndex((x) => x.name === name);
        if (index >= 0) list[index] = snap; else list.push(snap);
        writeStylePresets(list);
        setStylePresets(list);
        setPresetName(null);
        flash(t("ji-theme.style.saved"));
      };
      const applyStylePreset = (snap) => { const fields = stylePatchOf(snap); if (fields === null) return; patchFields(fields); flash(t("ji-theme.style.applied")); };
      const removeStylePreset = (name) => { const list = readStylePresets().filter((x) => x.name !== name); writeStylePresets(list); setStylePresets(list); };
      const resetColor = (key) => {
        if (editing === null || editing.baseline === undefined) return;
        const base = editing.baseline;
        patchFields({ [key]: base[key], colorAlpha: Object.assign({}, editing.draft.colorAlpha, { [key]: (base.colorAlpha && base.colorAlpha[key]) ?? 1 }), colorEnabled: Object.assign({}, editing.draft.colorEnabled, { [key]: (base.colorEnabled && base.colorEnabled[key]) !== false }) });
      };
      const resetTheme = () => {
        if (editing === null) return;
        if (editing.draft.packageId) {
          props.resetPackageOverrides(editing.draft.packageId).then(() => { setEditing(null); refreshThemes(); }).catch((err) => setActionError(err && err.message ? err.message : String(err)));
          return;
        }
        dirtyRef.current = true;
        setEditing({ mode: editing.mode, index: editing.index, baseline: editing.baseline, draft: Object.assign({}, editing.baseline) });
      };
      React.useEffect(() => {
        if (editing === null || editing.draft === undefined || dirtyRef.current !== true) return;
        const draft = editing.draft;
        props.applyDraft(draft);
        const timer = setTimeout(() => { props.commitDraft(draft).catch((err) => setActionError(err && err.message ? err.message : String(err))); }, 300);
        return () => clearTimeout(timer);
      }, [editing]);
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
        const draft = editing.draft;
        const done = () => { setEditing(null); refreshThemes(); };
        if (draft.packageId) {
          props.savePackageOverrides(draft.packageId, draft).then(done).catch((err) => setActionError(err && err.message ? err.message : String(err)));
          return;
        }
        props.saveTheme(draft);
        setEditing(null);
        refreshThemes();
      };
      const remove = () => {
        if (editing === null) return;
        const draft = editing.draft;
        if (draft.packageId) {
          props.resetPackageOverrides(draft.packageId).then(() => { setEditing(null); refreshThemes(); }).catch((err) => setActionError(err && err.message ? err.message : String(err)));
          return;
        }
        props.deleteTheme(draft.id);
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
        storagePath ? React.createElement("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px", lineHeight: "16px", paddingBottom: "4px", wordBreak: "break-all" } }, t("ji-theme.packageStoragePath") + "：" + storagePath) : null,
        actionError ? React.createElement("div", { style: { color: "var(--dsw-alias-state-error-primary)", fontSize: "12px", lineHeight: "16px", paddingBottom: "4px" } }, actionError) : null,
        React.createElement("div", { style: S.grid },
          React.createElement(Card, { key: "system", selected: pref === "system" && (editing === null || editing.mode === "edit"), onSelect: () => select(DEFAULT_SKIN), label: t("ji-theme.default") }, React.createElement(DefaultSwatch, {})),
          faces.map((f) => React.createElement(Card, { key: f.id, selected: pref === f.id && (editing === null || editing.mode === "edit"), onSelect: () => select(f.id), label: f.label }, React.createElement(Swatch, { face: f, t: t }))),
          React.createElement(Card, { key: "__edit__", selected: editing !== null && editing.mode === "edit", onSelect: startEditSelected, label: t("ji-theme.edit") }, React.createElement(EditSwatch, {})),
          React.createElement(Card, { key: "__new__", selected: editing !== null && editing.mode === "new", onSelect: startNew, label: t("ji-theme.new") }, React.createElement(NewSwatch, {})),
          React.createElement(Card, { key: "__import__", selected: false, onSelect: () => zipRef.current?.click(), label: t("ji-theme.import") }, React.createElement(ImportSwatch, {})),
        ),
        React.createElement("input", { ref: zipRef, type: "file", accept: ".zip,application/zip", style: { display: "none" }, onChange: onZipFile }),
        React.createElement("div", { style: S.title }, t("ji-theme.packages")),
        packages.length === 0
          ? React.createElement("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px" } }, t("ji-theme.packagesEmpty"))
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
            packages.map((pkg) => React.createElement("div", { key: pkg.id, style: { display: "flex", alignItems: "center", gap: "8px" } },
              React.createElement("div", { style: { width: "44px", height: "30px", borderRadius: "6px", flex: "none", background: pkg.accent || "var(--dsw-alias-bg-layer-2)", backgroundImage: pkg.background ? 'url("' + packageFileUrl(pkg.id, pkg.background) + '")' : undefined, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid var(--dsw-alias-border-l2)" } }),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "var(--dsw-alias-label-primary)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, pkg.name || pkg.id),
                React.createElement("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px" } }, (pkg.format === "dsh-v2" ? "DSH v2" : "DreamSkin") + (pkg.version ? " · " + pkg.version : "")),
              ),
              React.createElement("button", { type: "button", style: S.button, onClick: () => selectPackage(pkg) }, activePackageId === pkg.id ? t("ji-theme.selected") : t("ji-theme.select")),
              React.createElement("button", { type: "button", style: S.button, onClick: () => editPackage(pkg) }, t("ji-theme.editPackage")),
              React.createElement("a", { href: PACKAGES_URL + "/" + encodeURIComponent(pkg.id) + "/export", download: pkg.id + ".zip", style: Object.assign({}, S.button, { textDecoration: "none", lineHeight: "30px" }) }, t("ji-theme.export")),
              React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: () => { removePackage(pkg); } }, t("ji-theme.delete")),
            )),
          ),
        cssEdit === null ? null : React.createElement("div", { style: S.editor },
          React.createElement("div", { style: S.title }, t("ji-theme.cssEdit")),
          React.createElement("textarea", { value: cssEdit.text, style: S.textarea, onChange: (event) => setCssEdit({ id: cssEdit.id, text: event.target.value }) }),
          React.createElement("div", { style: S.actionRow },
            React.createElement("button", { type: "button", disabled: cssBusy, style: S.button, onClick: saveCssEdit }, t("ji-theme.cssSave")),
            React.createElement("button", { type: "button", disabled: cssBusy, style: Object.assign({}, S.button, S.buttonDanger), onClick: resetCssEdit }, t("ji-theme.cssReset")),
            React.createElement("button", { type: "button", disabled: cssBusy, style: S.button, onClick: () => setCssEdit(null) }, t("ji-theme.editor.cancel")),
          ),
        ),
        draft === null ? null : React.createElement("div", { style: S.editor },
          React.createElement("div", { style: S.editorGrid },
            React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.name")), React.createElement("input", { type: "text", style: S.input, value: draft.name, placeholder: "My theme", onChange: (event) => patch("name", event.target.value) })),
            React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.scheme")), React.createElement("button", { type: "button", style: S.button, onClick: () => patch("colorScheme", draft.colorScheme === "light" ? "dark" : "light") }, draft.colorScheme === "light" ? t("ji-theme.editor.light") : t("ji-theme.editor.dark"))),
            React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.fontFamily")), React.createElement("input", { type: "text", style: S.input, value: draft.fontFamily ?? "", placeholder: "ui-rounded, system-ui", onChange: (event) => patch("fontFamily", event.target.value) })),
            COLOR_KEYS.map((key) => React.createElement(ColorControl, { key, colorKey: key, label: t("ji-theme.editor." + COLOR_LABELS[key]), draft, onPatchFields: patchFields, onReset: resetColor })),
          ),
          React.createElement("div", { style: S.editorGrid },
            React.createElement(Slider, { label: t("ji-theme.editor.surfaceOpacity"), value: Math.round((draft.surfaceOpacity ?? 1) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("surfaceOpacity", v / 100) }),
            React.createElement(Slider, { label: t("ji-theme.editor.backgroundOpacity"), value: Math.round((draft.backgroundOpacity ?? DEFAULT_BG_OPACITY) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("backgroundOpacity", v / 100) }),
            React.createElement(Slider, { label: t("ji-theme.editor.maskOpacity"), value: Math.round((draft.maskOpacity ?? 0.3) * 100), min: 1, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("maskOpacity", v / 100) }),
            React.createElement(Slider, { label: t("ji-theme.editor.radius"), value: Number(draft.radius ?? 12), min: 0, max: 32, step: 1, format: (v) => v + "px", onChange: (v) => patch("radius", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.surfaceBlur"), value: Number(draft.surfaceBlur ?? 12), min: 0, max: 40, step: 1, format: (v) => v + "px", onChange: (v) => patch("surfaceBlur", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.shadowStrength"), value: Math.round(Number(draft.shadowStrength ?? 35)), min: 0, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("shadowStrength", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.density"), value: Number(draft.density ?? 1), min: 0.8, max: 1.4, step: 0.05, format: (v) => Number(v).toFixed(2) + "x", onChange: (v) => patch("density", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.motion"), value: Number(draft.motion ?? 1), min: 0, max: 1, step: 0.05, format: (v) => Math.round(Number(v) * 100) + "%", onChange: (v) => patch("motion", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.borderWidth"), value: Number(draft.borderWidth ?? 1), min: 0, max: 6, step: 1, format: (v) => v + "px", onChange: (v) => patch("borderWidth", v) }),
            React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.borderStyle")), React.createElement("button", { type: "button", style: S.button, onClick: () => { const styles = ["solid", "dashed", "dotted", "none"]; const current = draft.borderStyle ?? "solid"; patch("borderStyle", styles[(styles.indexOf(current) + 1) % styles.length]); } }, draft.borderStyle ?? "solid")),
            React.createElement(Slider, { label: t("ji-theme.editor.borderOpacity"), value: Math.round(Number(draft.borderOpacity ?? 24)), min: 0, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("borderOpacity", v) }),
            React.createElement(Slider, { label: t("ji-theme.editor.themeOpacity"), value: Math.round(Number(draft.themeOpacity ?? 100)), min: 0, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patch("themeOpacity", v) }),
            PART_KEYS.map((key) => React.createElement(Slider, { key, label: t("ji-theme.editor.part." + key), value: Math.round((draft.partOpacity && draft.partOpacity[key]) ?? 100), min: 0, max: 100, step: 1, format: (v) => v + "%", onChange: (v) => patchFields({ partOpacity: Object.assign({}, draft.partOpacity, { [key]: v }) }) })),
            React.createElement("div", { style: S.fieldRow }, React.createElement("span", { style: S.fieldLabel }, t("ji-theme.editor.background")), React.createElement("button", { type: "button", disabled: !contractReady, style: Object.assign({}, S.button, contractReady ? {} : { opacity: 0.5, cursor: "not-allowed" }), onClick: () => { if (contractReady) bgInputRef.current?.click(); } }, t("ji-theme.editor.chooseImage")), draft.background ? React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: () => { cleanupUnsavedBackground(draft); patch("background", null); } }, t("ji-theme.editor.removeImage")) : null, React.createElement("input", { ref: bgInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onBgFile })),
            draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.zoom"), value: Math.round((draft.backgroundZoom ?? 1) * 100), min: 100, max: 300, step: 1, format: (v) => v + "%", onChange: (v) => patch("backgroundZoom", v / 100) }) : null,
            draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.x"), value: Math.round(draft.backgroundX ?? 0), min: -150, max: 150, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundX", v) }) : null,
            draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.y"), value: Math.round(draft.backgroundY ?? 0), min: -150, max: 150, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundY", v) }) : null,
            draft.background ? React.createElement(Slider, { label: t("ji-theme.editor.blur"), value: Math.round(draft.backgroundBlur ?? 0), min: 0, max: 60, step: 1, format: (v) => v + "px", onChange: (v) => patch("backgroundBlur", v) }) : null,
          ),
          React.createElement("div", { style: S.group },
            React.createElement("div", { style: S.title }, t("ji-theme.style.title")),
            React.createElement("div", { style: S.actionRow },
              React.createElement("button", { type: "button", style: S.button, onClick: copyStyle }, t("ji-theme.style.copy")),
              React.createElement("button", { type: "button", disabled: styleClip === null, style: styleClip === null ? Object.assign({}, S.button, { opacity: 0.5, cursor: "not-allowed" }) : S.button, onClick: pasteStyle }, t("ji-theme.style.paste")),
              React.createElement("button", { type: "button", style: S.button, onClick: beginSavePreset }, t("ji-theme.style.save")),
              styleNote === null ? null : React.createElement("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px" } }, styleNote),
            ),
            presetName === null ? null : React.createElement("div", { style: S.actionRow },
              React.createElement("input", { type: "text", autoFocus: true, style: S.input, value: presetName, placeholder: t("ji-theme.style.promptName"), onChange: (event) => setPresetName(event.target.value), onKeyDown: (event) => { if (event.key === "Enter") commitSavePreset(); else if (event.key === "Escape") setPresetName(null); } }),
              React.createElement("button", { type: "button", style: S.button, onClick: commitSavePreset }, t("ji-theme.style.confirm")),
              React.createElement("button", { type: "button", style: S.button, onClick: () => setPresetName(null) }, t("ji-theme.editor.cancel")),
            ),
            stylePresets.length === 0
              ? React.createElement("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px" } }, t("ji-theme.style.presetsEmpty"))
              : React.createElement("div", { style: S.actionRow },
              stylePresets.map((snap, index) => React.createElement("div", { key: "preset-" + index + "-" + snap.name, style: S.fieldRow },
                React.createElement("span", { style: Object.assign({}, S.fieldLabel, { width: "auto" }) }, snap.name || t("ji-theme.style.defaultName")),
                React.createElement("button", { type: "button", style: S.button, onClick: () => applyStylePreset(snap) }, t("ji-theme.style.apply")),
                React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: () => removeStylePreset(snap.name) }, t("ji-theme.style.remove")),
              )),
            ),
          ),
          React.createElement("div", { style: S.actionRow },
            React.createElement("button", { type: "button", style: S.button, onClick: () => setEditing(null) }, t("ji-theme.editor.done")),
            React.createElement("button", { type: "button", style: S.button, onClick: resetTheme }, t("ji-theme.editor.resetTheme")),
            React.createElement("button", { type: "button", style: Object.assign({}, S.button, S.buttonDanger), onClick: remove }, draft.packageId ? t("ji-theme.cssReset") : t("ji-theme.editor.delete")),
          ),
        ),
      );
    }

    const inject = ["slots", "locale", "theme"];
    // ── settings navigation icon ─────────────────────────────────────────
    // DSH 0.1.x projects only id/order/label from a settings.section
    // registration and picks nav glyphs from a closed list of built-in ids, so
    // an external section falls back to the shell's gear. Until that public
    // contract grows an icon field, mark only this plugin's own localized row
    // and let this stylesheet replace the glyph — no host source change.
    const NAV_MARKER = "data-ji-theme-settings-nav";
    const NAV_ICON_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>"
      + "<path fill='black' d='M11.3496 8C11.3496 6.14985 9.85015 4.65039 8 4.65039C6.14985 4.65039 4.65039 6.14985 4.65039 8C4.65039 9.85015 6.14985 11.3496 8 11.3496C9.85015 11.3496 11.3496 9.85015 11.3496 8ZM12.6504 8C12.6504 10.5681 10.5681 12.6504 8 12.6504C5.43188 12.6504 3.34961 10.5681 3.34961 8C3.34961 5.43188 5.43188 3.34961 8 3.34961C10.5681 3.34961 12.6504 5.43188 12.6504 8Z'/>"
      + "<path fill='black' d='M8.65039 0.5V2.5H7.34961V0.5H8.65039Z'/>"
      + "<path fill='black' d='M8.65039 13.5V15.5H7.34961V13.5H8.65039Z'/>"
      + "<path fill='black' d='M3.15808 2.24035L4.57229 3.65456L3.6525 4.57435L2.23829 3.16014L3.15808 2.24035Z'/>"
      + "<path fill='black' d='M12.3505 11.4327L13.7647 12.8469L12.8449 13.7667L11.4307 12.3525L12.3505 11.4327Z'/>"
      + "<path fill='black' d='M2.24537 12.8469L3.65958 11.4327L4.57937 12.3525L3.16516 13.7667L2.24537 12.8469Z'/>"
      + "<path fill='black' d='M11.4377 3.65455L12.852 2.24033L13.7718 3.16012L12.3575 4.57434L11.4377 3.65455Z'/>"
      + "<path fill='black' d='M0.5 7.35461H2.5V8.6554H0.5L0.5 7.35461Z'/>"
      + "<path fill='black' d='M13.5 7.35461H15.5V8.6554H13.5V7.35461Z'/>"
      + "</svg>";
    const NAV_MASK = "url(\"data:image/svg+xml," + encodeURIComponent(NAV_ICON_SVG) + "\")";
    const NAV_CSS = "[" + NAV_MARKER + "]>svg:first-child{display:none}"
      + "[" + NAV_MARKER + "]::before{content:'';flex:none;width:16px;height:16px;background:currentColor;"
      + "-webkit-mask:" + NAV_MASK + " center/contain no-repeat;mask:" + NAV_MASK + " center/contain no-repeat}";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"ji-theme/nav-icon.css\"]") === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "ji-theme";
      tag.dataset.pluginCss = "ji-theme/nav-icon.css";
      tag.textContent = NAV_CSS;
      document.head.appendChild(tag);
    }

    /**
     * Keep the marker on the settings-nav button whose visible text is this
     * plugin's current localized section label.
     * @param label - the same locale-aware resolver used by the registration.
     * @returns disposer that disconnects observation and removes the marker.
     */
    function registerSettingsNavIcon(label) {
      if (typeof document === "undefined" || document.body === null) return () => {};
      let disposed = false;
      const sync = () => {
        if (disposed) return;
        const current = String(label() ?? "").trim();
        for (const button of document.querySelectorAll("[role=\"dialog\"] nav button")) {
          if (current.length > 0 && (button.textContent ?? "").trim() === current) button.setAttribute(NAV_MARKER, "");
          else button.removeAttribute(NAV_MARKER);
        }
      };
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return () => {
        disposed = true;
        observer.disconnect();
        for (const element of document.querySelectorAll("[" + NAV_MARKER + "]")) element.removeAttribute(NAV_MARKER);
      };
    }


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

      let packageStyles = [];
      let packageBgEl = null;
      let packageLayersEl = null;
      let packageHooksCleanup = null;
      let activePackageId = readSelectedPackage();

      const removePackageStyles = () => { packageStyles.forEach((el) => el.remove()); packageStyles = []; };
      const removePackageBackground = () => { if (packageBgEl !== null) { packageBgEl.remove(); packageBgEl = null; } };
      const removePackageLayers = () => { if (packageLayersEl !== null) { packageLayersEl.remove(); packageLayersEl = null; } };
      const removePackageHooks = () => { if (packageHooksCleanup !== null) { try { packageHooksCleanup(); } catch {} packageHooksCleanup = null; } };
      const cleanupPackage = () => {
        removePackageStyles();
        removePackageBackground();
        removePackageHooks();
        removePackageLayers();
        if (document.documentElement.dataset.dshSkin) delete document.documentElement.dataset.dshSkin;
      };
      ctx.effect(() => () => cleanupPackage(), "ji-theme: package cleanup");


      const installPackageStyle = (label, css) => {
        const el = document.createElement("style");
        el.dataset.jiPackage = activePackageId || "";
        el.dataset.jiPart = label;
        el.textContent = css;
        document.head.appendChild(el);
        packageStyles.push(el);
      };
      const prepareV2Css = (css, id) => {
        const assetBase = PACKAGES_URL + "/" + encodeURIComponent(id) + "/files";
        let text = String(css || "");
        text = text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, raw) => {
          const value = String(raw).trim();
          if (value.length === 0 || /^(?:data:|https?:|\/\/|\/|#)/i.test(value) || value.startsWith("var(")) return match;
          return "url(" + quote + assetBase + "/" + value.replace(/^\.\//, "") + quote + ")";
        });
        const clones = [];
        text = text.replace(/(^|\})\s*(:root|html)\s*\{([^{}]*)\}/g, (match, prefix, selector, body) => {
          const declarations = body.match(/--dsw-[\w-]+\s*:[^;]+;?/g) || [];
          if (declarations.length > 0) clones.push(declarations.join("\n"));
          return match;
        });
        if (clones.length > 0) text += "\nbody {\n" + clones.join("\n") + "\n}";
        return text;
      };
      const installPackageBackground = (pkg) => {
        const media = pkg.backgroundMedia;
        if (!media) return;
        const variant = document.body.hasAttribute("data-ds-dark-theme") ? (media.dark || media.light) : (media.light || media.dark);
        if (!variant || typeof variant.src !== "string") return;
        packageBgEl = document.createElement("div");
        packageBgEl.style.cssText = "position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;";
        let node;
        if (variant.type === "video") { node = document.createElement("video"); node.autoplay = true; node.muted = true; node.loop = true; node.playsInline = true; }
        else node = document.createElement("img");
        node.src = packageFileUrl(pkg.id, variant.src);
        node.style.cssText = "width:100%;height:100%;object-fit:cover;";
        packageBgEl.appendChild(node);
        if (typeof variant.scrim === "string" && variant.scrim.length > 0) {
          const scrim = document.createElement("div");
          scrim.style.cssText = "position:absolute;inset:0;background:" + variant.scrim;
          packageBgEl.appendChild(scrim);
        }
        document.body.prepend(packageBgEl);
      };
      const hooksTrusted = (id) => { try { const list = JSON.parse(readStorage(STORAGE_TRUSTED_HOOKS) || "[]"); return Array.isArray(list) && list.includes(id); } catch { return false; } };
      const trustHooks = (id) => {
        let list = [];
        try { const parsed = JSON.parse(readStorage(STORAGE_TRUSTED_HOOKS) || "[]"); if (Array.isArray(parsed)) list = parsed; } catch {}
        if (!list.includes(id)) list.push(id);
        writeStorage(STORAGE_TRUSTED_HOOKS, JSON.stringify(list));
      };
      const installPackageHooks = async (pkg) => {
        if (!pkg.hooksEntry) return;
        if (!hooksTrusted(pkg.id)) {
          const allowed = typeof window !== "undefined" && typeof window.confirm === "function"
            ? window.confirm("主题包 " + (pkg.name || pkg.id) + " 包含 hooks.mjs，是否信任并执行？")
            : false;
          if (!allowed) return;
          trustHooks(pkg.id);
        }
        const layersRoot = document.createElement("div");
        layersRoot.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:-2;";
        const background = document.createElement("div");
        background.style.cssText = "position:absolute;inset:0;";
        const decoration = document.createElement("div");
        decoration.style.cssText = "position:absolute;inset:0;z-index:1;";
        layersRoot.append(background, decoration);
        document.body.prepend(layersRoot);
        packageLayersEl = layersRoot;
        const cleanups = [];
        const ctxHooks = {
          skinId: pkg.id,
          scopeAttr: pkg.id,
          assetBase: packageFileUrl(pkg.id, "").replace(/\/$/, ""),
          layers: { background, decoration },
          theme: {
            get: () => document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light",
            subscribe: (fn) => { const observer = new MutationObserver(() => fn(document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light")); observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] }); return () => observer.disconnect(); },
          },
          onCleanup: (fn) => { if (typeof fn === "function") cleanups.push(fn); },
        };
        try {
          const mod = await import(/* @vite-ignore */ packageFileUrl(pkg.id, pkg.hooksEntry));
          const hooks = typeof mod.default === "function" ? mod.default() : mod;
          if (hooks && typeof hooks.apply === "function") hooks.apply(ctxHooks);
          packageHooksCleanup = () => {
            try { if (hooks && typeof hooks.dispose === "function") hooks.dispose(); } catch (err) { console.warn("[ji-theme] hooks dispose failed:", err); }
            for (const cleanup of cleanups.reverse()) { try { cleanup(); } catch (err) { console.warn("[ji-theme] hooks cleanup failed:", err); } }
          };
        } catch (err) { console.warn("[ji-theme] hooks import failed; static skin stays active:", err); }
      };
      const applyPackage = async (pkg) => {
        cleanupPackage();
        activePackageId = pkg ? pkg.id : null;
        writeSelectedPackage(activePackageId);
        if (!pkg) { applyBackground(); applyThemeCss(); return; }
        if (pkg.format === "dreamskin-v1") {
          registerThemes();
          const theme = loadThemes().find((entry) => entry.id === pkg.id);
          if (theme) { ctx.theme.setTheme(theme.id); writeSavedSkin(theme.id); applyBackground(); applyThemeCss(); }
          return;
        }
        const current = ctx.theme.getTheme().preference;
        if (current !== "system" && current !== "light" && current !== "dark") { ctx.theme.setTheme(DEFAULT_SKIN); writeSavedSkin(DEFAULT_SKIN); }
        else writeSavedSkin(DEFAULT_SKIN);
        document.documentElement.dataset.dshSkin = pkg.id;
        const stylesheet = pkg.stylesheet || "skin.css";
        try { installPackageStyle("skin.css", prepareV2Css(await fetchPackageText(pkg.id, stylesheet), pkg.id)); }
        catch (err) { console.warn("[ji-theme] skin.css load failed:", err); }
        if (pkg.patches) {
          try { installPackageStyle("patches.css", prepareV2Css(await fetchPackageText(pkg.id, pkg.patches), pkg.id)); }
          catch (err) { console.warn("[ji-theme] patches.css load failed:", err); }
        }
        try {
          const overrides = await fetchPackageOverrides(pkg.id);
          if (overrides && typeof overrides.css === "string" && overrides.css.length > 0) installPackageStyle("overrides.css", prepareV2Css(overrides.css, pkg.id));
        } catch (err) { console.warn("[ji-theme] override css load failed:", err); }
        installPackageBackground(pkg);
        await installPackageHooks(pkg);
        applyBackground();
        applyThemeCss();
      };
      loadPackages().then((state) => {
        registerThemes();
        const savedPackage = state.list.find((entry) => entry.id === readSelectedPackage());
        if (savedPackage) return applyPackage(savedPackage);
        return null;
      }).catch((err) => console.warn("[ji-theme] package load failed:", err));

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
            if (activePackageId !== null) {
              const pkg = packagesState.list.find((entry) => entry.id === activePackageId);
              if (pkg && pkg.format === "dsh-v2") { removePackageBackground(); installPackageBackground(pkg); }
            }
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

      const applyDraft = (theme) => {
        if (theme.packageId) {
          const list = packagesState.themes;
          const index = list.findIndex((entry) => entry.id === theme.packageId);
          if (index >= 0) list[index] = normalizeTheme(Object.assign({}, theme, { id: theme.packageId, packageId: theme.packageId, hasOverrides: true }));
          registerThemes(); applyBackground(); applyThemeCss();
        } else {
          const themes = loadThemes().filter((entry) => entry.packageId === undefined);
          const index = themes.findIndex((entry) => entry.id === theme.id);
          if (index >= 0) themes[index] = normalizeTheme(theme); else themes.push(normalizeTheme(theme));
          saveThemes(themes); registerThemes(); applyBackground(); applyThemeCss();
        }
      };
      const commitDraft = async (theme) => {
        if (!theme.packageId) return;
        const payload = Object.assign({}, theme);
        delete payload.packageId;
        delete payload.hasOverrides;
        await savePackageOverridesRemote(theme.packageId, { theme: payload });
        await loadPackages();
        registerThemes(); applyBackground(); applyThemeCss();
      };

      const themeActions = {
        getSnapshot: () => ctx.theme.getTheme(),
        subscribe: (fn) => ctx.on("theme/change", fn),
        setSkin: (id) => {
          const pkg = packagesState.list.find((entry) => entry.id === id);
          if (pkg && pkg.format === "dreamskin-v1") {
            if (activePackageId !== id) cleanupPackage();
            activePackageId = id;
            writeSelectedPackage(id);
            registerThemes();
            ctx.theme.setTheme(id);
            writeSavedSkin(id);
            applyBackground();
            applyThemeCss();
            return;
          }
          cleanupPackage();
          activePackageId = null;
          writeSelectedPackage(null);
          ctx.theme.setTheme(id);
          writeSavedSkin(id);
          applyBackground();
          applyThemeCss();
        },
        loadThemes: () => loadThemes(),
        saveTheme: (theme) => { const themes = loadThemes().filter((entry) => entry.packageId === undefined); const index = themes.findIndex((x) => x.id === theme.id); const old = index >= 0 ? themes[index] : null; if (index >= 0) themes[index] = theme; else themes.push(theme); saveThemes(themes); registerThemes(); if (old && old.background && old.background !== theme.background) deleteWallpaperFile(old.background); },
        deleteTheme: (id) => { const themes = loadThemes(); const victim = themes.find((x) => x.id === id); const wasActive = ctx.theme.getTheme().preference === id; saveThemes(themes.filter((x) => x.id !== id && x.packageId === undefined)); registerThemes(); if (victim && victim.background && victim.packageId === undefined) deleteWallpaperFile(victim.background); if (wasActive) { ctx.theme.setTheme(DEFAULT_SKIN); writeSavedSkin(DEFAULT_SKIN); } },
        selectPackage: (pkg) => { applyPackage(pkg).catch((err) => console.error("[ji-theme] package apply failed:", err)); },
        savePackageOverrides: async (id, theme) => {
          const payload = Object.assign({}, theme);
          delete payload.packageId;
          delete payload.hasOverrides;
          await savePackageOverridesRemote(id, { theme: payload });
          await loadPackages();
          registerThemes();
          applyBackground();
          applyThemeCss();
        },
        resetPackageOverrides: async (id) => {
          const previous = await fetchPackageOverrides(id).catch(() => null);
          if (previous && previous.theme && typeof previous.theme.background === "string") deleteWallpaperFile(previous.theme.background);
          await resetPackageOverridesRemote(id);
          await loadPackages();
          registerThemes();
          applyBackground();
          applyThemeCss();
        },
        deletePackage: async (pkg) => {
          await deletePackageRemote(pkg.id);
          await loadPackages();
          registerThemes();
          if (activePackageId === pkg.id) await applyPackage(null);
        },
        loadPackages: () => loadPackages(),
        getPackages: () => getPackagesState(),
        subscribePackages: (fn) => subscribePackages(fn),
        getActivePackage: () => activePackageId,
        applyDraft: (theme) => applyDraft(theme),
        commitDraft: (theme) => commitDraft(theme),
      };
      const ThemeSection = () => React.createElement(ThemeRow, Object.assign({ t: ctx.locale.bind(SETTINGS_NS) }, themeActions));
      ctx.effect(() => registerSettingsNavIcon(() => ctx.locale.bind(SETTINGS_NS)("ji-theme.title")), "ji-theme: settings navigation icon");
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
