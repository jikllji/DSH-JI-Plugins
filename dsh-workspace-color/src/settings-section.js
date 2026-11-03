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
