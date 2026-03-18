/**
 * SUI Vending Machine Interface
 * Clean-room Preact/SUI port inspired by tgui vending flow.
 */
; (function () {
    'use strict'

    var h = SUI.h
    var useBackend = SUI.useBackend
    var useEffect = SUI.useEffect
    var useState = SUI.useState
    var useRef = SUI.useRef

    var THEME = {
        page: '#151b23',
        window: '#1b1b1c',
        panel: '#1f1f20',
        card: '#10161d',
        cardAlt: '#16202b',
        line: '#374151',
        row: '#243142',
        rowHover: '#1f2937',
        text: '#f8fafc',
        muted: '#94a3b8',
        subtle: '#7c8a9d',
        title: '#93c5fd',
        blue: '#2563eb',
        blueHover: '#1d4ed8',
        blueText: '#dbeafe',
        warn: '#fbbf24',
        bad: '#f87171',
        good: '#4ade80',
        topbar: '#dce9e2',
        topbarText: '#0f172a',
        primaryText: '#f8fbff'
    }

    var STYLES_INJECTED = false

    function injectStyles() {
        if (STYLES_INJECTED) return
        STYLES_INJECTED = true

        var css = [
            'html, body, #sui-root {',
            '  width: 100%;',
            '  max-width: 100%;',
            '  height: 100%;',
            '  margin: 0;',
            '  padding: 0;',
            '  overflow: hidden !important;',
            '  box-sizing: border-box;',
            '}',
            'body {',
            '  background: ' + THEME.page + ' !important;',
            '  color: ' + THEME.text + ';',
            '  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;',
            '}',
            '.vm-shell {',
            '  height: 100vh;',
            '  padding: 0;',
            '  box-sizing: border-box;',
            '  background: ' + THEME.page + ';',
            '  width: 100%;',
            '  max-width: 100%;',
            '  overflow: hidden;',
            '}',
            '.vm-window {',
            '  border: 0;',
            '  background: ' + THEME.window + ';',
            '  overflow: hidden;',
            '  position: relative;',
            '  width: 100%;',
            '  max-width: 100%;',
            '  height: 100%;',
            '  display: flex;',
            '  flex-direction: column;',
            '  box-sizing: border-box;',
            '  animation: vm-window-enter 0.24s ease-out;',
            '}',
            '@keyframes vm-window-enter {',
            '  from { opacity: 0; transform: scale(0.96); }',
            '  to { opacity: 1; transform: scale(1); }',
            '}',
            '.vm-topbar {',
            '  height: 28px;',
            '  background: ' + THEME.topbar + ';',
            '  color: ' + THEME.topbarText + ';',
            '  border-bottom: 1px solid rgba(15,23,42,0.28);',
            '  display: flex;',
            '  align-items: center;',
            '  justify-content: space-between;',
            '  padding: 0 8px;',
            '  box-sizing: border-box;',
            '  cursor: move;',
            '}',
            '.vm-topbar__left { display: flex; align-items: center; gap: 6px; }',
            '.vm-topbar__badge {',
            '  width: 14px;',
            '  height: 14px;',
            '  border-radius: 50%;',
            '  background: radial-gradient(circle at 35% 35%, #fde68a, #f97316 72%);',
            '  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.42);',
            '}',
            '.vm-topbar__actions { display: flex; align-items: center; gap: 2px; }',
            '.vm-topbar__btn {',
            '  width: 26px;',
            '  height: 20px;',
            '  line-height: 18px;',
            '  text-align: center;',
            '  color: ' + THEME.topbarText + ';',
            '  background: transparent;',
            '  border: 1px solid transparent;',
            '  font-size: 12px;',
            '  cursor: pointer;',
            '}',
            '.vm-topbar__btn:hover { background: rgba(15,23,42,0.08); border-color: rgba(15,23,42,0.12); }',
            '.vm-topbar__btn--close:hover { background: rgba(127,29,29,0.22); color: #7f1d1d; border-color: rgba(127,29,29,0.22); }',
            '.vm-header {',
            '  display: flex;',
            '  align-items: center;',
            '  justify-content: space-between;',
            '  gap: 10px;',
            '  padding: 10px 12px;',
            '  border-bottom: 1px solid ' + THEME.line + ';',
            '  background: #2b2a2b;',
            '  flex: 0 0 auto;',
            '}',
            '.vm-header__left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 auto; }',
            '.vm-header__icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #65a30d; font-size: 13px; flex: 0 0 auto; }',
            '.vm-header__title { color: ' + THEME.text + '; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.vm-header__brand { color: rgba(255,255,255,0.2); font-size: 20px; font-weight: 700; letter-spacing: -0.08em; flex: 0 0 auto; }',
            '.vm-scroll {',
            '  flex: 1 1 auto;',
            '  min-height: 0;',
            '  overflow: hidden;',
            '  width: 100%;',
            '  max-width: 100%;',
            '  scrollbar-color: #6b7280 #20262e;',
            '  scrollbar-width: auto;',
            '}',
            '.vm-scroll::-webkit-scrollbar { width: 12px; background: #20262e; }',
            '.vm-scroll::-webkit-scrollbar-track { background: #20262e; border-left: 1px solid ' + THEME.line + '; }',
            '.vm-scroll::-webkit-scrollbar-thumb { background: #6b7280; border: 2px solid #20262e; border-radius: 8px; }',
            '.vm-scroll::-webkit-scrollbar-thumb:hover { background: #818b98; }',
            '.vm-scroll::-webkit-scrollbar-corner { background: #20262e; }',
            '.vm-scroll::-webkit-scrollbar-button { background-color: #20262e; border-left: 1px solid ' + THEME.line + '; background-repeat: no-repeat; background-position: center; background-size: 8px 8px; height: 14px; }',
            '.vm-scroll::-webkit-scrollbar-button:vertical:decrement { background-image: linear-gradient(135deg, transparent 50%, #94a3b8 50%), linear-gradient(225deg, transparent 50%, #94a3b8 50%); background-size: 6px 6px; background-position: calc(50% - 2px) 7px, calc(50% + 2px) 7px; }',
            '.vm-scroll::-webkit-scrollbar-button:vertical:increment { background-image: linear-gradient(315deg, transparent 50%, #94a3b8 50%), linear-gradient(45deg, transparent 50%, #94a3b8 50%); background-size: 6px 6px; background-position: calc(50% - 2px) 4px, calc(50% + 2px) 4px; }',
            '.vm-scroll::-webkit-scrollbar-button:hover { background-color: #2a3340; }',
            '.vm-body { padding: 8px; position: relative; overflow: hidden; box-sizing: border-box; width: 100%; max-width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; }',
            '.vm-resize { position: absolute; right: 3px; bottom: 3px; width: 14px; height: 14px; cursor: nwse-resize; z-index: 6; }',
            '.vm-resize::before { content: ""; position: absolute; right: 1px; bottom: 1px; width: 9px; height: 9px; background: linear-gradient(135deg, transparent 0 42%, rgba(148,163,184,0.75) 42% 52%, transparent 52% 68%, rgba(148,163,184,0.45) 68% 78%, transparent 78% 100%); opacity: 0.9; }',
            '.vm-section { border: 1px solid ' + THEME.line + '; background: ' + THEME.panel + '; padding: 10px 12px; box-sizing: border-box; width: 100%; max-width: 100%; overflow: hidden; display: flex; flex-direction: column; min-height: 0; flex: 1 1 auto; }',
            '.vm-section + .vm-section { margin-top: 8px; }',
            '.vm-section__title { margin-bottom: 10px; display: flex; align-items: center; gap: 10px; color: ' + THEME.title + '; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }',
            '.vm-section__line { height: 1px; flex: 1 1 auto; background: ' + THEME.line + '; }',
            '.vm-section__label { flex: 0 0 auto; }',
            '.vm-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; width: 100%; max-width: 100%; box-sizing: border-box; }',
            '.vm-toolbar__spacer { flex: 1 1 auto; }',
            '.vm-notice { padding: 8px 10px; border: 1px solid ' + THEME.line + '; background: ' + THEME.card + '; color: ' + THEME.text + '; }',
            '.vm-notice--danger { border-color: rgba(248,113,113,0.5); background: rgba(69,10,10,0.32); color: #fecaca; }',
            '.vm-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 26px; padding: 0 10px; border: 1px solid ' + THEME.line + '; background: transparent; color: ' + THEME.muted + '; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; box-sizing: border-box; }',
            '.vm-btn:hover { background: rgba(51,65,85,0.22); border-color: #475569; color: #ffffff; }',
            '.vm-btn--primary { border-color: rgba(104,154,214,0.65); background: linear-gradient(180deg, ' + THEME.blueHover + ' 0%, ' + THEME.blue + ' 100%); color: ' + THEME.blueText + '; }',
            '.vm-btn--primary:hover { background: linear-gradient(180deg, #2f65bd 0%, ' + THEME.blueHover + ' 100%); color: #f8fbff; }',
            '.vm-btn--danger:hover { color: #fecaca !important; border-color: #b91c1c !important; background: rgba(127,29,29,0.32) !important; }',
            '.vm-btn--selected { color: ' + THEME.good + '; border-color: #335a87; }',
            '.vm-input { width: 156px; max-width: 100%; height: 26px; border: 1px solid ' + THEME.line + ' !important; background: #0d1116 !important; color: ' + THEME.text + ' !important; padding: 0 8px; box-sizing: border-box; font-size: 11px; outline: none; box-shadow: none; }',
            '.vm-input::placeholder { color: ' + THEME.subtle + '; opacity: 1; }',
            '.vm-console { display: grid; grid-template-columns: minmax(260px, 1fr) 372px; gap: 12px; align-items: start; min-height: 0; flex: 1 1 auto; }',
            '.vm-console__left { min-width: 0; }',
            '.vm-console__leftSticky { display: flex; flex-direction: column; gap: 8px; }',
            '.vm-console__right { min-width: 372px; width: 372px; justify-self: end; align-self: start; height: calc(100vh - 178px); max-height: calc(100vh - 178px); overflow-y: auto; overflow-x: hidden; padding-right: 4px; scrollbar-color: #6b7280 #20262e; scrollbar-width: auto; }',
            '.vm-console__right::-webkit-scrollbar { width: 10px; background: #20262e; }',
            '.vm-console__right::-webkit-scrollbar-track { background: #20262e; border-left: 1px solid ' + THEME.line + '; }',
            '.vm-console__right::-webkit-scrollbar-thumb { background: #6b7280; border: 2px solid #20262e; border-radius: 8px; }',
            '.vm-console__right::-webkit-scrollbar-thumb:hover { background: #818b98; }',
            '.vm-preview { border: 1px solid ' + THEME.row + '; background: ' + THEME.card + '; padding: 10px; display: flex; flex-direction: column; gap: 10px; min-height: 372px; }',
            '.vm-preview__statusbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 16px; }',
            '.vm-preview__statusLeft { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }',
            '.vm-preview__dot { width: 7px; height: 7px; background: #64748b; border-radius: 50%; flex: 0 0 auto; }',
            '.vm-preview__dot--active { background: #60a5fa; box-shadow: 0 0 8px rgba(96,165,250,0.35); }',
            '.vm-preview__dot--dispense { background: #4ade80; box-shadow: 0 0 10px rgba(74,222,128,0.42); animation: vm-dot-pulse 0.6s ease-in-out infinite; }',
            '@keyframes vm-dot-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }',
            '.vm-preview__statusText { color: ' + THEME.subtle + '; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.vm-preview__statusCode { color: ' + THEME.muted + '; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; flex: 0 0 auto; }',
            '.vm-preview__screen { position: relative; min-height: 186px; border: 1px solid #213141; background: radial-gradient(circle at 50% 35%, rgba(96,165,250,0.08), transparent 48%), linear-gradient(180deg, #0d141b 0%, #101922 100%); display: flex; align-items: center; justify-content: center; overflow: hidden; }',
            '.vm-preview__screen::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, rgba(147,197,253,0.04) 48%, transparent 100%); opacity: 0.65; animation: vm-screen-sweep 2.8s linear infinite; pointer-events: none; }',
            '@keyframes vm-screen-sweep { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }',
            '.vm-preview__scanline { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px); opacity: 0.22; pointer-events: none; }',
            '.vm-preview__sprite { position: relative; z-index: 1; width: 96px; height: 96px; object-fit: contain; image-rendering: pixelated; -ms-interpolation-mode: nearest-neighbor; transition: transform 0.18s ease, opacity 0.18s ease; }',
            '.vm-preview__sprite--armed { animation: vm-sprite-idle 1.8s ease-in-out infinite; }',
            '@keyframes vm-sprite-idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }',
            '.vm-preview__sprite--drop { animation: vm-drop-item 0.7s cubic-bezier(0.2, 0.7, 0.2, 1); }',
            '@keyframes vm-drop-item { 0% { transform: translateY(-24px) scale(1.02); opacity: 0.0; } 18% { opacity: 1; } 72% { transform: translateY(52px) scale(1); opacity: 1; } 100% { transform: translateY(108px) scale(0.96); opacity: 0.0; } }',
            '.vm-preview__chute { height: 18px; border: 1px solid #25384d; background: linear-gradient(180deg, #111720 0%, #0b1118 100%); position: relative; overflow: hidden; }',
            '.vm-preview__chute::before { content: ""; position: absolute; left: 12px; right: 12px; top: 4px; height: 2px; background: rgba(147,197,253,0.16); }',
            '.vm-preview__chute::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.18) 50%, transparent 100%); opacity: 0; transform: translateX(-100%); }',
            '.vm-preview__chute--active::after { opacity: 1; animation: vm-chute-flash 0.72s ease-out; }',
            '@keyframes vm-chute-flash { 0% { transform: translateX(-100%); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }',
            '.vm-preview__title { color: ' + THEME.text + '; font-size: 13px; font-weight: 700; line-height: 1.25; }',
            '.vm-preview__subtitle { color: ' + THEME.subtle + '; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }',
            '.vm-preview__meta { display: grid; grid-template-columns: minmax(0, 1fr) auto; row-gap: 6px; column-gap: 8px; align-items: center; }',
            '.vm-preview__metaLabel { color: ' + THEME.subtle + '; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }',
            '.vm-preview__metaValue { color: ' + THEME.muted + '; font-size: 11px; text-align: right; }',
            '.vm-preview__metaValue--warn { color: ' + THEME.warn + '; font-weight: 700; }',
            '.vm-preview__controls { display: flex; flex-direction: column; gap: 6px; margin-top: auto; }',
            '.vm-preview__ticker { min-height: 24px; border: 1px solid #25384d; background: #0d131a; display: flex; align-items: center; padding: 0 8px; color: #8fb6e0; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.vm-selectorGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }',
            '.vm-selectorGrid--dense { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }',
            '.vm-productCard { position: relative; min-height: 0; height: 220px; padding: 8px; border: 1px solid ' + THEME.row + '; background: ' + THEME.card + '; transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease; display: flex; flex-direction: column; min-width: 0; box-sizing: border-box; }',
            '.vm-productCard:hover { background: ' + THEME.rowHover + '; border-color: #314a66; transform: translateY(-1px); }',
            '.vm-productCard--disabled { opacity: 0.45; cursor: default; }',
            '.vm-productCard--selected { border-color: #4b76a6; background: ' + THEME.cardAlt + '; }',
            '.vm-productCard--armed { box-shadow: inset 0 0 0 1px rgba(143,182,224,0.18); }',
            '.vm-productCard--contraband { border-color: rgba(245,158,11,0.52); }',
            '.vm-productCard--premium { border-color: rgba(74,222,128,0.52); }',
            '.vm-productCard--dispensing { animation: vm-dispense-card 0.42s ease-out; }',
            '@keyframes vm-dispense-card { 0% { background: ' + THEME.card + '; } 40% { background: rgba(37,99,235,0.18); } 75% { background: rgba(74,222,128,0.14); } 100% { background: ' + THEME.card + '; } }',
            '.vm-productCard__index { position: absolute; top: 6px; left: 6px; min-width: 20px; height: 18px; padding: 0 4px; border: 1px solid #335a87; background: rgba(19,34,52,0.92); color: #a9c4df; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; }',
            '.vm-productCard__index--active { color: #eef6ff; border-color: #5b87b8; background: linear-gradient(180deg, #31557b 0%, #20354b 100%); animation: vm-slot-blink 1.2s steps(1, end) infinite; }',
            '@keyframes vm-slot-blink { 0%, 50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); } 51%, 100% { box-shadow: 0 0 10px rgba(96,165,250,0.14); } }',
            '.vm-productCard__imageWrap { height: 44px; display: flex; align-items: center; justify-content: center; margin: 4px 0 6px; flex: 0 0 auto; }',
            '.vm-productCard__image { max-width: 34px; max-height: 34px; image-rendering: pixelated; -ms-interpolation-mode: nearest-neighbor; }',
            '.vm-productCard__name { color: ' + THEME.text + '; font-size: 10px; font-weight: 700; line-height: 1.15; text-align: left; min-height: 36px; max-height: 36px; overflow: hidden; flex: 0 0 auto; padding-right: 0; }',
            '.vm-productCard__meta { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }',
            '.vm-productCard__metaRow { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 14px; }',
            '.vm-productCard__metaLabel { color: ' + THEME.subtle + '; font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; }',
            '.vm-productCard__metaValue { color: ' + THEME.muted + '; font-size: 9px; text-align: right; }',
            '.vm-productCard__metaValue--warn { color: ' + THEME.warn + '; font-weight: 700; }',
            '.vm-productCard__metaValue--premium { color: #dcfce7; }',
            '.vm-productCard__metaValue--contraband { color: #fef3c7; }',
            '.vm-productCard__action { margin-top: 5px; width: 100%; min-width: 0; align-self: stretch; min-height: 22px; font-size: 8px; }',
            '.vm-productCard__action.vm-btn { color: ' + THEME.blueText + '; border-color: rgba(104,154,214,0.65); }',
            '.vm-productCard__action.vm-btn--primary { color: ' + THEME.primaryText + '; }',
            '.vm-productCard--dense { height: 220px; padding: 8px; }',
            '.vm-productCard--dense .vm-productCard__index { top: 5px; left: 5px; min-width: 18px; height: 16px; font-size: 9px; }',
            '.vm-productCard--dense .vm-productCard__imageWrap { height: 40px; margin: 4px 0 6px; }',
            '.vm-productCard--dense .vm-productCard__image { max-width: 30px; max-height: 30px; }',
            '.vm-productCard--dense .vm-productCard__name { font-size: 11px; line-height: 1.15; padding-right: 0; min-height: 54px; max-height: 54px; }',
            '.vm-productCard--dense .vm-productCard__meta { margin-top: 6px; gap: 4px; }',
            '.vm-productCard--dense .vm-productCard__metaLabel { font-size: 9px; }',
            '.vm-productCard--dense .vm-productCard__metaValue { font-size: 9px; }',
            '.vm-productCard--dense .vm-productCard__action { min-width: 0; width: 100%; min-height: 24px; margin-top: 5px; font-size: 9px; }',
            '.vm-overlay { position: absolute; inset: 8px; display: flex; align-items: center; justify-content: center; background: rgba(21,27,35,0.88); border: 1px solid rgba(55,65,81,0.6); z-index: 3; }',
            '.vm-overlay__panel { width: 332px; max-width: 100%; padding: 12px; border: 1px solid ' + THEME.line + '; background: ' + THEME.panel + '; box-sizing: border-box; }',
            '.vm-overlay__notice { margin-bottom: 10px; }',
            '.vm-overlay__titleA { color: ' + THEME.title + '; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; text-align: left; }',
            '.vm-overlay__titleB { color: ' + THEME.text + '; font-size: 17px; font-weight: 700; text-align: left; margin-top: 4px; line-height: 1.25; }',
            '.vm-overlay__body { display: flex; flex-direction: column; gap: 10px; }',
            '.vm-overlay__summary { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 10px; align-items: center; }',
            '.vm-overlay__imageWrap { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border: 1px solid ' + THEME.row + '; background: ' + THEME.card + '; }',
            '.vm-overlay__image { max-width: 40px; max-height: 40px; image-rendering: pixelated; -ms-interpolation-mode: nearest-neighbor; }',
            '.vm-overlay__meta { display: flex; flex-direction: column; gap: 6px; }',
            '.vm-overlay__metaRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 14px; }',
            '.vm-overlay__metaLabel { color: ' + THEME.subtle + '; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }',
            '.vm-overlay__metaValue { color: ' + THEME.text + '; font-size: 11px; text-align: right; }',
            '.vm-overlay__metaValue--price { color: ' + THEME.warn + '; font-weight: 700; }',
            '.vm-overlay__copy { color: ' + THEME.muted + '; font-size: 11px; line-height: 1.35; }',
            '.vm-overlay__actions { margin-top: 2px; }',
            '.vm-overlay__actions .vm-btn { width: 100%; min-height: 28px; }',
            '.vm-empty { padding: 22px 10px 8px; text-align: center; color: ' + THEME.muted + '; font-style: italic; }'
        ].join('\n')

        var style = document.createElement('style')
        style.textContent = css
        document.head.appendChild(style)
    }

    function SectionTitle(props) {
        return h('div', { className: 'vm-section__title' },
            h('div', { className: 'vm-section__line' }),
            h('div', { className: 'vm-section__label' }, props.children),
            h('div', { className: 'vm-section__line' })
        )
    }

    function formatTitle(name) {
        var text = String(name || '')
        return text.replace(/\b([a-z])/g, function (match, letter) { return letter.toUpperCase() })
    }

    function formatPrice(product, currency) {
        if ((product.amount || 0) <= 0) return 'Empty'
        if (product.price > 0) return product.price + ' ' + (currency || 'cr')
        return 'Free'
    }

    function getCategoryClass(product) {
        var category = Number(product.category || 0)
        if (category === 2) return ' vm-productCard--contraband'
        if (category === 4) return ' vm-productCard--premium'
        return ''
    }

    function getPriceClass(product) {
        var category = Number(product.category || 0)
        if ((product.amount || 0) <= 0) return ''
        if (category === 2) return ' vm-productCard__metaValue--contraband'
        if (category === 4) return ' vm-productCard__metaValue--premium'
        return ''
    }

    function HeaderBar(props) {
        return h('div', { className: 'vm-header' },
            h('div', { className: 'vm-header__left' },
                h('div', { className: 'vm-header__icon' }, h(SUI.Icon, { name: 'eye' })),
                h('div', { className: 'vm-header__title' }, props.title || 'Coffee Dispenser')
            ),
            h('div', { className: 'vm-header__brand' }, 'NL')
        )
    }

    function ProductCard(props) {
        var product = props.product
        var disabled = (product.amount || 0) <= 0
        var cardClass = 'vm-productCard' + (props.dense ? ' vm-productCard--dense' : '') + (disabled ? ' vm-productCard--disabled' : '') + (props.selected ? ' vm-productCard--selected vm-productCard--armed' : '') + getCategoryClass(product)
        var priceClass = 'vm-productCard__metaValue' + getPriceClass(product)
        var stockClass = 'vm-productCard__metaValue' + ((product.amount || 0) < 5 ? ' vm-productCard__metaValue--warn' : '')
        var actionClass = 'vm-btn vm-productCard__action' + (props.selected ? ' vm-btn--primary' : '')
        var indexClass = 'vm-productCard__index' + (props.selected ? ' vm-productCard__index--active' : '')
        var nameStyle = product.color ? { color: product.color } : null

        function handleSelect(e) {
            if (e) {
                e.preventDefault()
                e.stopPropagation()
            }
            if (props.onSelect) props.onSelect(product)
        }

        return h(SUI.Tooltip, {
            text: formatTitle(product.name) + ' | In stock: ' + (product.amount || 0)
        },
        h('div', {
            className: cardClass
        },
        h('div', { className: indexClass }, String(props.index + 1).padStart(2, '0')),
        h('div', { className: 'vm-productCard__imageWrap' },
            product.icon
                ? h('img', {
                    className: 'vm-productCard__image',
                    src: product.icon,
                    alt: ''
                })
                : h(SUI.Icon, { name: 'coffee', style: { color: THEME.muted } })
        ),
        h('div', { className: 'vm-productCard__name', style: nameStyle }, formatTitle(product.name)),
        h('div', { className: 'vm-productCard__meta' },
            h('div', { className: 'vm-productCard__metaRow' },
                h('div', { className: 'vm-productCard__metaLabel' }, 'Stock'),
                h('div', { className: stockClass }, product.amount || 0)
            ),
            h('div', { className: 'vm-productCard__metaRow' },
                h('div', { className: 'vm-productCard__metaLabel' }, 'Price'),
                h('div', { className: priceClass }, formatPrice(product, props.currency))
            ),
            h('div', {
                className: actionClass,
                onClick: handleSelect
            }, disabled ? 'Empty' : (props.selected ? 'Selected' : 'Select'))
        )))
    }

    function ProductPreview(props) {
        var product = props.product
        var disabled = !product || (product.amount || 0) <= 0
        var stockClass = 'vm-preview__metaValue' + (product && (product.amount || 0) < 5 ? ' vm-preview__metaValue--warn' : '')
        var dotClass = 'vm-preview__dot'
        if (props.machineState === 'dispensing') dotClass += ' vm-preview__dot--dispense'
        else if (props.machineState === 'armed') dotClass += ' vm-preview__dot--active'
        var spriteClass = 'vm-preview__sprite'
        if (props.dropping) spriteClass += ' vm-preview__sprite--drop'
        else if (!disabled) spriteClass += ' vm-preview__sprite--armed'
        var chuteClass = 'vm-preview__chute' + (props.dropping ? ' vm-preview__chute--active' : '')

        return h('div', { className: 'vm-preview' },
            h('div', { className: 'vm-preview__statusbar' },
                h('div', { className: 'vm-preview__statusLeft' },
                    h('div', { className: dotClass }),
                    h('div', { className: 'vm-preview__statusText' }, props.statusText || 'Idle')
                ),
                h('div', { className: 'vm-preview__statusCode' }, props.statusCode || 'STBY')
            ),
            h('div', { className: 'vm-preview__subtitle' }, 'Dispense Chamber'),
            h('div', { className: 'vm-preview__screen' },
                h('div', { className: 'vm-preview__scanline' }),
                product && product.icon
                    ? h('img', {
                        className: spriteClass,
                        src: product.icon,
                        alt: ''
                    })
                    : h(SUI.Icon, { name: 'coffee', style: { color: THEME.muted, position: 'relative', zIndex: 1 } })
            ),
            h('div', { className: chuteClass }),
            h('div', { className: 'vm-preview__title' }, product ? formatTitle(product.name) : 'No Selection'),
            h('div', { className: 'vm-preview__meta' },
                h('div', { className: 'vm-preview__metaLabel' }, 'Selection'),
                h('div', { className: 'vm-preview__metaValue' }, props.slotLabel || '--'),
                h('div', { className: 'vm-preview__metaLabel' }, 'Stock'),
                h('div', { className: stockClass }, product ? (product.amount || 0) : '--'),
                h('div', { className: 'vm-preview__metaLabel' }, 'Price'),
                h('div', { className: 'vm-preview__metaValue' }, product ? formatPrice(product, props.currency) : '--')
            ),
            h('div', { className: 'vm-preview__controls' },
                h('div', {
                    className: 'vm-btn vm-btn--primary',
                    style: disabled ? { opacity: 0.5, cursor: 'default' } : null,
                    onClick: disabled ? null : props.onVend
                }, disabled ? 'Unavailable' : 'Dispense'),
                h('div', { className: 'vm-btn', style: { cursor: 'default' } }, disabled ? 'Select a slot' : 'Slot ' + (props.slotLabel || '--'))
            ),
            h('div', { className: 'vm-preview__ticker' }, props.tickerText || 'Awaiting slot selection')
        )
    }

    function VendOverlay() {
        var backend = useBackend()
        var data = backend.data || {}
        var act = backend.act
        var products = data.products || []
        var overlayWidth = products.length > 25 ? '352px' : '332px'
        var overlayRef = useRef(null)
        var currency = (backend.config && backend.config.currency) || 'cr'

        useEffect(function () {
            if (overlayRef.current && overlayRef.current.scrollIntoView) {
                overlayRef.current.scrollIntoView({
                    block: 'start',
                    inline: 'nearest',
                    behavior: 'smooth'
                })
            }
        }, [])

        return h('div', { className: 'vm-overlay' },
            h('div', {
                ref: overlayRef,
                className: 'vm-overlay__panel',
                style: { width: overlayWidth }
            },
                h('div', { className: 'vm-overlay__notice' },
                    h(SUI.NoticeBox, {
                        danger: !!data.message_err
                    }, data.message_err ? data.message : 'Swipe a card or insert cash to pay for the item.')
                ),
                h('div', { className: 'vm-overlay__body' },
                    h('div', { className: 'vm-overlay__titleA' }, 'Awaiting Payment'),
                    h('div', { className: 'vm-overlay__titleB' }, formatTitle(data.product)),
                    h('div', { className: 'vm-overlay__summary' },
                        h('div', { className: 'vm-overlay__imageWrap' },
                            data.image
                                ? h('img', {
                                    className: 'vm-overlay__image',
                                    src: data.image,
                                    alt: ''
                                })
                                : h(SUI.Icon, { name: 'coffee', style: { color: THEME.muted } })
                        ),
                        h('div', { className: 'vm-overlay__meta' },
                            h('div', { className: 'vm-overlay__metaRow' },
                                h('div', { className: 'vm-overlay__metaLabel' }, 'Item'),
                                h('div', { className: 'vm-overlay__metaValue' }, formatTitle(data.product))
                            ),
                            h('div', { className: 'vm-overlay__metaRow' },
                                h('div', { className: 'vm-overlay__metaLabel' }, 'Charge'),
                                h('div', { className: 'vm-overlay__metaValue vm-overlay__metaValue--price' }, data.price + ' ' + currency)
                            )
                        )
                    ),
                    h('div', { className: 'vm-overlay__copy' }, 'Present an ID, chargecard, or insert cash to authorize this vend.')
                ),
                h('div', { className: 'vm-overlay__actions' },
                    h('div', {
                        className: 'vm-btn',
                        onClick: function () { act('cancelpurchase') }
                    }, 'Cancel')
                )
            )
        )
    }

    function VendingMaint() {
        var backend = useBackend()
        var data = backend.data || {}
        var act = backend.act

        return h('div', { className: 'vm-section' },
            h(SectionTitle, null, 'Maintenance'),
            h(SUI.NoticeBox, null, 'Maintenance panel is open. Technical servicing in progress.'),
            h('div', { className: 'vm-toolbar', style: { marginTop: '10px', marginBottom: '0' } },
                data.coin ? h('div', {
                    className: 'vm-btn',
                    onClick: function () { act('remove_coin') }
                }, 'Eject Coin') : null,
                h('div', { className: 'vm-toolbar__spacer' }),
                h('div', {
                    className: 'vm-btn' + (data.speaker ? ' vm-btn--selected' : ''),
                    onClick: function () { act('togglevoice') }
                }, data.speaker ? 'Speaker On' : 'Speaker Off')
            )
        )
    }

    function VendingMain() {
        var backend = useBackend()
        var data = backend.data || {}
        var act = backend.act
        var products = data.products || []
        var searchState = useState('')
        var searchText = searchState[0]
        var setSearchText = searchState[1]
        var selectedState = useState(null)
        var selectedKey = selectedState[0]
        var setSelectedKey = selectedState[1]
        var dropState = useState(false)
        var isDropping = dropState[0]
        var setIsDropping = dropState[1]
        var machineStateHook = useState('idle')
        var machineState = machineStateHook[0]
        var setMachineState = machineStateHook[1]
        var machineTextHook = useState('Awaiting slot selection')
        var machineText = machineTextHook[0]
        var setMachineText = machineTextHook[1]
        var prevBusyRef = useRef(!!data.busy)

        var filteredProducts = products.filter(function (product) {
            return String(product.name || '').toLowerCase().indexOf(String(searchText || '').toLowerCase()) !== -1
        })
        var denseGrid = filteredProducts.length >= 16
        var selectorGridClass = 'vm-selectorGrid' + (denseGrid ? ' vm-selectorGrid--dense' : '')
        var selectedProduct = null
        for (var i = 0; i < filteredProducts.length; i++) {
            if (String(filteredProducts[i].key) === String(selectedKey)) {
                selectedProduct = filteredProducts[i]
                break
            }
        }
        if (!selectedProduct && filteredProducts.length) {
            selectedProduct = filteredProducts[0]
        }

        useEffect(function () {
            if (!filteredProducts.length) {
                if (selectedKey !== null) setSelectedKey(null)
                return
            }
            var hasSelected = false
            for (var i = 0; i < filteredProducts.length; i++) {
                if (String(filteredProducts[i].key) === String(selectedKey)) {
                    hasSelected = true
                    break
                }
            }
            if (!hasSelected) {
                setSelectedKey(filteredProducts[0].key)
            }
        }, [searchText, products.length, filteredProducts.length])

        useEffect(function () {
            var wasBusy = prevBusyRef.current
            var isBusy = !!data.busy
            prevBusyRef.current = isBusy
            if (isBusy && !wasBusy) {
                setIsDropping(true)
            } else if (!isBusy && wasBusy) {
                setIsDropping(false)
            }
        }, [data.busy])

        useEffect(function () {
            if (!selectedProduct) {
                setMachineState('idle')
                setMachineText('Awaiting slot selection')
                return
            }
            if (data.busy) {
                setMachineState('dispensing')
                setMachineText(data.message || 'Dispensing item')
                return
            }
            if (data.mode) {
                setMachineState('idle')
                setMachineText(data.message || 'Awaiting payment authorization')
                return
            }
            if ((selectedProduct.amount || 0) > 0) {
                setMachineState('armed')
                setMachineText('Slot ' + String(filteredProducts.indexOf(selectedProduct) + 1).padStart(2, '0') + ' armed for dispense')
            } else {
                setMachineState('idle')
                setMachineText('Selected slot is empty')
            }
        }, [selectedProduct ? selectedProduct.key : null, selectedProduct ? selectedProduct.amount : null, filteredProducts.length, data.busy, data.mode, data.message])

        function handleSelect(product) {
            setSelectedKey(product.key)
            if (data.busy) {
                setMachineState('dispensing')
                setMachineText(data.message || 'Dispensing item')
                return
            }
            if (data.mode) {
                setMachineState('idle')
                setMachineText(data.message || 'Awaiting payment authorization')
                return
            }
            setMachineState((product.amount || 0) > 0 ? 'armed' : 'idle')
            setMachineText((product.amount || 0) > 0
                ? 'Slot ' + String(filteredProducts.indexOf(product) + 1).padStart(2, '0') + ' armed for dispense'
                : 'Selected slot is empty')
        }

        function handleVendSelected() {
            if (!selectedProduct || (selectedProduct.amount || 0) <= 0 || isDropping || data.busy || data.mode) return
            setMachineText(selectedProduct.price > 0
                ? 'Awaiting payment authorization'
                : 'Submitting dispense request')
            act('vend', { vend: selectedProduct.key })
        }

        return h('div', null,
            data.mode ? h(VendOverlay) : null,
            h('div', { className: 'vm-section' },
                h(SectionTitle, null, 'Products'),
                data.message && !data.mode && !data.busy ? h('div', { className: 'vm-toolbar' },
                    h(SUI.NoticeBox, {
                        danger: !!data.message_err
                    }, data.message)
                ) : null,
                h('div', { className: 'vm-toolbar' },
                    data.coin ? h('div', {
                        className: 'vm-btn',
                        onClick: function () { act('remove_coin') }
                    }, 'Eject Coin') : null,
                    h('div', { className: 'vm-toolbar__spacer' }),
                    h('input', {
                        className: 'vm-input',
                        type: 'text',
                        placeholder: 'Search...',
                        value: searchText,
                        onInput: function (e) { setSearchText(e.target.value) }
                    })
                ),
                filteredProducts.length
                    ? h('div', { className: 'vm-console' },
                        h('div', { className: 'vm-console__left' },
                            h('div', { className: 'vm-console__leftSticky' },
                                h(ProductPreview, {
                                    product: selectedProduct,
                                    slotLabel: selectedProduct ? String(filteredProducts.indexOf(selectedProduct) + 1).padStart(2, '0') : '--',
                                    currency: backend.config && backend.config.currency,
                                    dropping: isDropping,
                                    onVend: handleVendSelected,
                                    machineState: machineState,
                                    statusText: machineState === 'dispensing'
                                        ? (data.message || 'Dispense cycle active')
                                        : (selectedProduct && (selectedProduct.amount || 0) > 0 ? 'Selection armed' : 'Idle'),
                                    statusCode: machineState === 'dispensing'
                                        ? 'DROP'
                                        : data.mode
                                            ? 'PAY'
                                        : (selectedProduct && (selectedProduct.amount || 0) > 0 ? 'ARMD' : 'STBY'),
                                    tickerText: machineText
                                })
                            )
                        ),
                        h('div', { className: 'vm-console__right' },
                            h('div', { className: selectorGridClass },
                                filteredProducts.map(function (product, index) {
                                    return h(ProductCard, {
                                        key: product.key || index,
                                        index: index,
                                        dense: denseGrid,
                                        product: product,
                                        selected: selectedProduct && String(selectedProduct.key) === String(product.key),
                                        currency: backend.config && backend.config.currency,
                                        onSelect: handleSelect
                                    })
                                })
                            )
                        )
                    )
                    : h('div', { className: 'vm-empty' }, 'No products found.')
            )
        )
    }

    function VendingMachine() {
        var backend = useBackend()
        var data = backend.data || {}
        var config = backend.config || {}

        useEffect(function () { injectStyles() }, [])

        return h('div', { className: 'vm-shell' },
            h('div', { className: 'vm-window' },
                h(SUI.SystemTopBar, {
                    className: 'vm-topbar',
                    badge: h('div', { className: 'vm-topbar__badge' }),
                    restoreWidth: 520,
                    restoreHeight: 680,
                    minimizedHeight: 36
                }),
                h(HeaderBar, { title: config.title || 'Coffee Dispenser' }),
                h('div', { className: 'vm-scroll' },
                    h('div', { className: 'vm-body' },
                        data.panel ? h(VendingMaint) : h(VendingMain)
                    )
                ),
                h(SUI.WindowResizeHandle, {
                    className: 'vm-resize',
                    minWidth: 440,
                    minHeight: 420
                })
            )
        )
    }

    SUI.registerInterface('VendingMachine', VendingMachine)
})()
