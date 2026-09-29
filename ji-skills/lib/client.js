window.__ModuleLoader__.load({
  id: "ji-skills",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let React = require("react");

    const CSS = ".skv-root{container:skv/inline-size;display:flex;flex-direction:column;gap:14px;width:100%;max-width:760px;margin:0 auto;color:var(--dsw-alias-label-primary)}.skv-heading{margin:0;font-size:18px;font-weight:600}.skv-intro{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}.skv-catalog{display:flex;flex-direction:column;gap:12px}.skv-controls{display:flex;align-items:center;gap:10px}.skv-search{position:relative;display:flex;align-items:center;flex:1;min-width:0;color:var(--dsw-alias-label-tertiary)}.skv-searchIcon{position:absolute;left:12px;pointer-events:none}.skv-search input{box-sizing:border-box;width:100%;height:36px;border:0.5px solid var(--dsw-alias-border-l4);border-radius:10px;padding:0 12px 0 36px;outline:none;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}.skv-search input::placeholder{color:var(--dsw-alias-label-tertiary)}.skv-search input:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}.skv-filterWrap{position:relative;flex:none}.skv-filter{display:inline-flex;align-items:center;gap:12px;height:36px;border:0;border-radius:18px;padding:0 14px;background-color:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;white-space:nowrap;cursor:pointer}.skv-filterLabel{max-width:240px;overflow:hidden;text-overflow:ellipsis}.skv-filter:hover{background-color:var(--dsw-alias-interactive-bg-hover)}.skv-filter:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.skv-catalogHeading{display:flex;align-items:baseline;gap:7px;padding:0 2px}.skv-catalogHeading h3{margin:0;font-size:13px;line-height:20px;font-weight:600}.skv-catalogHeading span{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.skv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}.skv-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:0.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill)}.skv-card[data-open='true']{border-color:var(--dsw-alias-border-l3)}.skv-card:nth-child(odd)[data-open='true'] + .skv-card,.skv-card:nth-child(odd):has(+ .skv-card[data-open='true']){align-self:start}.skv-header{box-sizing:border-box;display:flex;flex:1 1 auto;flex-direction:column;align-items:stretch;gap:2px;width:100%;min-height:52px;border:0;padding:12px 14px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.skv-header:hover,.skv-card[data-open='true'] > .skv-header{background:var(--dsw-alias-interactive-bg-hover)}.skv-header:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.skv-mainRow{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}.skv-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;font-weight:500}.skv-identity{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;width:100%;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-wrap:pretty}.skv-card[data-open='true'] .skv-identity{display:block}.skv-trailing{display:inline-flex;flex:none;align-items:center;gap:7px;color:var(--dsw-alias-label-tertiary)}.skv-chip{display:inline-flex;align-items:center;gap:6px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}.skv-dot{display:inline-block;flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#22c55e)}.skv-chevron{flex:none;color:var(--dsw-alias-label-tertiary)}.skv-card[data-open='true'] .skv-chevron{transform:rotate(180deg)}.skv-details{border-top:0.5px solid var(--dsw-alias-border-l2);padding:10px 14px 12px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:18px;overflow-wrap:anywhere;white-space:pre-line}.skv-empty{margin:0;font-size:13px;color:var(--dsw-alias-label-tertiary)}.skv-error{color:var(--dsw-alias-state-error-primary)}.skv-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:30;min-width:200px;max-height:320px;overflow:auto;margin:0;padding:6px;list-style:none;border:0.5px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-elevation-panel)}.skv-menuItem{display:flex;align-items:center;gap:10px;width:100%;border:0;border-radius:10px;padding:8px 10px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;text-align:left;cursor:pointer}.skv-menuItem:hover{background:var(--dsw-alias-interactive-bg-hover)}.skv-menuItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.skv-menuItem[aria-checked=true]{font-weight:600}.skv-menuLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.skv-menuCheckSlot{display:inline-flex;flex:none;align-items:center;justify-content:center;width:14px}.skv-menuCheck{color:var(--dsw-alias-label-primary)}@media (prefers-reduced-motion:no-preference){.skv-chevron{transition:transform 140ms var(--ds-ease-in-out)}}@container skv (max-width:520px){.skv-grid{grid-template-columns:minmax(0,1fr)}}";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"ji-skills/skills.css\"]") === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "ji-skills";
      tag.dataset.pluginCss = "ji-skills/skills.css";
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ── settings navigation icon ─────────────────────────────────────────
    // DSH 0.1.x projects only id/order/label from a settings.section
    // registration and picks nav glyphs from a closed list of built-in ids, so
    // an external section falls back to the shell's gear. Until that public
    // contract grows an icon field, mark only this plugin's own localized row
    // and let this stylesheet replace the glyph — no host source change.
    const NAV_MARKER = "data-ji-skills-settings-nav";
    const NAV_ICON_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>"
      + "<path fill='black' d='M12.5113 15.4067C12.4395 15.6249 12.1308 15.6249 12.059 15.4067L11.643 14.1416C11.454 13.567 11.0033 13.1164 10.4288 12.9274L9.16369 12.5113C8.94544 12.4395 8.94544 12.1308 9.16369 12.059L10.4288 11.643C11.0033 11.454 11.454 11.0033 11.643 10.4288L12.059 9.16369C12.1308 8.94544 12.4395 8.94544 12.5113 9.16369L12.9274 10.4288C13.1164 11.0033 13.567 11.454 14.1416 11.643L15.4067 12.059C15.6249 12.1308 15.6249 12.4395 15.4067 12.5113L14.1416 12.9274C13.567 13.1164 13.1164 13.567 12.9274 14.1416L12.5113 15.4067Z'/>"
      + "<path fill='black' d='M9.02246 0.546878C9.9822 0.546878 10.7564 0.545403 11.374 0.612307C12.0042 0.680586 12.5515 0.826244 13.0273 1.17188C13.3052 1.37376 13.5501 1.61868 13.752 1.89649C14.0975 2.37225 14.2432 2.91984 14.3115 3.54981C14.3784 4.16727 14.377 4.94206 14.377 5.90137V8.51367C13.9611 8.29533 13.5071 8.13985 13.0273 8.06055V5.90137C13.0273 4.9121 13.0259 4.22322 12.9688 3.69532C12.9129 3.18044 12.8098 2.89782 12.6592 2.69043C12.5406 2.52724 12.3966 2.38326 12.2334 2.26465C12.026 2.11404 11.7437 2.0109 11.2285 1.95508C10.7005 1.89789 10.0122 1.89649 9.02246 1.89649H6.55371C5.56395 1.89649 4.87569 1.89787 4.34766 1.95508C3.83242 2.01092 3.55022 2.11398 3.34278 2.26465C3.17953 2.38329 3.03564 2.52719 2.91699 2.69043C2.76642 2.89782 2.66325 3.18042 2.60742 3.69532C2.55027 4.22322 2.54883 4.9121 2.54883 5.90137V10.0986C2.54883 11.0878 2.55031 11.7768 2.60742 12.3047C2.66326 12.8196 2.76642 13.1032 2.91699 13.3105C3.03558 13.4736 3.17966 13.6178 3.34278 13.7363C3.5502 13.8869 3.83265 13.9901 4.34766 14.0459C4.87568 14.1031 5.56398 14.1035 6.55371 14.1035H8.08399C8.27443 14.6025 8.55077 15.0585 8.89551 15.4541H6.55371C5.59402 15.4541 4.81976 15.4546 4.20215 15.3877C3.57204 15.3194 3.02468 15.1738 2.54883 14.8281C2.27111 14.6263 2.02606 14.3813 1.82422 14.1035C1.47883 13.6278 1.33293 13.08 1.26465 12.4502C1.19783 11.8327 1.19922 11.0579 1.19922 10.0986V5.90137C1.19922 4.94206 1.1978 4.16727 1.26465 3.54981C1.33295 2.91984 1.47867 2.37225 1.82422 1.89649C2.02613 1.61864 2.27098 1.37379 2.54883 1.17188C3.02472 0.826181 3.57197 0.6806 4.20215 0.612307C4.81976 0.545393 5.594 0.546877 6.55371 0.546878H9.02246ZM9.19629 9.14649H4.5459V7.84571H9.19629V9.14649ZM11.0303 6.10645H4.5459V4.80567H11.0303V6.10645Z'/>"
      + "</svg>";
    const NAV_MASK = "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(NAV_ICON_SVG) + "\")";
    const NAV_CSS = "[" + NAV_MARKER + "]>svg:first-child{display:none}"
      + "[" + NAV_MARKER + "]::before{content:'';flex:none;width:16px;height:16px;background:currentColor;"
      + "-webkit-mask:" + NAV_MASK + " center/contain no-repeat;mask:" + NAV_MASK + " center/contain no-repeat}";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"ji-skills/nav-icon.css\"]") === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "ji-skills";
      tag.dataset.pluginCss = "ji-skills/nav-icon.css";
      tag.textContent = NAV_CSS;
      document.head.appendChild(tag);
    }

    /**
     * Keep the marker on the settings-nav button whose visible text is this
     * plugin's current section label.
     * @param label - the same resolver handed to the section registration.
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
    /** Check mark marking the selected option in the source menu. */
    function CheckIcon() {
      return React.createElement("svg", {
        className: "skv-menuCheck", width: 14, height: 14, viewBox: "0 0 14 14",
        fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true,
      },
        React.createElement("path", { d: "M3 7.4L5.8 10.2L11 4.6", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
    }
    /** Downward chevron for one skill card's disclosure affordance. */
    function ChevronIcon() {
      return React.createElement("svg", {
        className: "skv-chevron", width: 12, height: 12, viewBox: "0 0 14 14",
        fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true,
      },
        React.createElement("path", { d: "M3.5 5.25L7 8.75L10.5 5.25", stroke: "currentColor", "stroke-width": "1.4", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
    }
    function SearchIcon() {
      return React.createElement("svg", {
        className: "skv-searchIcon", width: 16, height: 16, viewBox: "0 0 16 16",
        fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true,
      },
        React.createElement("path", { d: "M11.894845 6.647401C11.894845 3.725463 9.534486 1.356779 6.623219 1.35657C3.711786 1.35657 1.351635 3.725338 1.351635 6.647401C1.351843 9.569296 3.711911 11.938273 6.623219 11.938273C9.534361 11.938064 11.894637 9.569171 11.894845 6.647401ZM13.245462 6.647401C13.245254 10.317935 10.280401 13.293613 6.623219 13.293821C2.965871 13.293821 0.000204 10.31806 0 6.647401C0 2.976574 2.965746 0 6.623219 0C10.280526 0.000205 13.245462 2.9767 13.245462 6.647401Z", fill: "currentColor" }),
        React.createElement("path", { d: "M16.000417 15.041079L15.044449 16.000433L11.530434 12.473588L12.486298 11.514234L16.000417 15.041079Z", fill: "currentColor" }),
      );
    }

    function SkillsSection() {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [open, setOpen] = React.useState(null);
      const [query, setQuery] = React.useState("");
      const [group, setGroup] = React.useState("all");
      const [menuOpen, setMenuOpen] = React.useState(false);
      const wrapRef = React.useRef(null);

      React.useEffect(() => {
        let alive = true;
        fetch("/api/skills-settings/list")
          .then((r) => r.json())
          .then((res) => { if (alive) setData(res); })
          .catch((e) => { if (alive) setError(String((e && e.message) || e)); });
        return () => { alive = false; };
      }, []);

      React.useEffect(() => {
        if (!menuOpen) return;
        const onDown = (event) => {
          const wrap = wrapRef.current;
          if (wrap && !wrap.contains(event.target)) setMenuOpen(false);
        };
        const onKey = (event) => { if (event.key === "Escape") setMenuOpen(false); };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
          document.removeEventListener("pointerdown", onDown);
          document.removeEventListener("keydown", onKey);
        };
      }, [menuOpen]);

      if (error) return React.createElement("div", { className: "skv-root skv-error" }, "Error: " + error);
      if (!data) return React.createElement("div", { className: "skv-root" }, "Loading...");

      const groups = data.groups.map((g) => ({ id: g.id, label: g.id === "global" ? "全局技能" : String(g.label || g.id) }));
      const options = [{ id: "all", label: "全部技能" }].concat(groups);
      const current = options.filter((o) => o.id === group)[0] || options[0];

      const cards = [];
      for (const g of data.groups) {
        if (group !== "all" && g.id !== group) continue;
        const label = g.id === "global" ? "全局技能" : String(g.label || g.id);
        for (const s of g.skills) {
          const id = String(s.id || s.name);
          cards.push({ key: g.id + ":" + id, title: String(s.name), identity: (g.id === "global" ? "skills:" : g.id + ":") + id, group: label, description: s.description ? String(s.description) : "" });
        }
      }
      const q = query.trim().toLocaleLowerCase();
      const visible = q
        ? cards.filter((c) => (c.title + " " + c.identity + " " + c.description).toLocaleLowerCase().includes(q))
        : cards;

      return React.createElement("div", { className: "skv-root" },
        React.createElement("h2", { className: "skv-heading" }, "技能"),
        React.createElement("p", { className: "skv-intro" }, "查看本部署已安装的技能。"),
        React.createElement("div", { className: "skv-catalog" },
          React.createElement("div", { className: "skv-controls" },
            React.createElement("label", { className: "skv-search" },
              SearchIcon(),
              React.createElement("input", { type: "search", value: query, placeholder: "搜索技能", "aria-label": "搜索技能", onChange: (event) => setQuery(event.currentTarget.value) }),
            ),
            React.createElement("div", { className: "skv-filterWrap", ref: wrapRef },
              React.createElement("button", { type: "button", className: "skv-filter", "aria-haspopup": "menu", "aria-expanded": menuOpen, "aria-label": "筛选技能来源", onClick: () => setMenuOpen(!menuOpen) },
                React.createElement("span", { className: "skv-filterLabel" }, current.label),
                ChevronIcon(),
              ),
              menuOpen
                ? React.createElement("ul", { className: "skv-menu", role: "menu" },
                    options.map((o) => React.createElement("li", { key: o.id, role: "none" },
                      React.createElement("button", { type: "button", role: "menuitemradio", "aria-checked": group === o.id, className: "skv-menuItem", onClick: () => { setGroup(o.id); setMenuOpen(false); setOpen(null); } },
                        React.createElement("span", { className: "skv-menuLabel" }, o.label),
                        React.createElement("span", { className: "skv-menuCheckSlot" }, group === o.id ? CheckIcon() : null),
                      ),
                    )),
                  )
                : null,
            ),
          ),
          React.createElement("div", { className: "skv-catalogHeading" },
            React.createElement("h3", null, "技能列表"),
            React.createElement("span", null, String(visible.length)),
          ),
          visible.length === 0
            ? React.createElement("p", { className: "skv-empty" }, "没有匹配的技能。")
            : React.createElement("ul", { className: "skv-grid" },
                visible.map((c) => React.createElement("li", { key: c.key, className: "skv-card", "data-open": open === c.key ? "true" : undefined },
                  React.createElement("button", { type: "button", className: "skv-header", "aria-expanded": open === c.key, onClick: () => setOpen(open === c.key ? null : c.key) },
                    React.createElement("span", { className: "skv-mainRow" },
                      React.createElement("strong", { className: "skv-title", title: c.title }, c.title),
                      React.createElement("span", { className: "skv-trailing" },
                        React.createElement("span", { className: "skv-chip" }, React.createElement("span", { className: "skv-dot" }), c.group),
                        ChevronIcon(),
                      ),
                    ),
                    React.createElement("span", { className: "skv-identity", title: c.description === "" ? c.identity : c.description }, c.description === "" ? c.identity : c.description),
                  ),
                  open === c.key ? React.createElement("div", { className: "skv-details" }, c.description === "" ? "SKILL.md 未提供描述。" : c.description) : null,
                )),
              ),
        ),
      );
    }
    const inject = ["slots"];

    function apply(ctx) {
      const registration = { name: "settings.section", id: "skills", order: 12, label: () => "技能" };
      ctx.effect(() => registerSettingsNavIcon(registration.label), "ji-skills: settings navigation icon");
      ctx.slots.inject("settings.section", () => ctx.slots.register(registration, SkillsSection));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
