/**
 * SUI Components - Base UI component library
 * Styled to match NanoUI dark theme
 *
 * Usage: var h = SUI.h
 *   h(SUI.Button, { onClick: function() { ... } }, 'Click me')
 *   h(SUI.Section, { title: 'Controls' }, children)
 *   h(SUI.ProgressBar, { value: 50, max: 100, color: 'good' })
 */
; (function () {
    'use strict'

    var h = SUI.h
    var useEffect = SUI.useEffect
    var useRef = SUI.useRef
    var useState = SUI.useState
    var NTOS_COMPAT_THEME = {
        pageBackground: '#151b23',
        panelBackground: '#1b1b1c',
        cardBackground: '#10161d',
        panelBorder: '#374151',
        rowBorder: '#243142',
        rowHover: '#1f2937',
        text: '#f8fafc',
        muted: '#94a3b8',
        subtle: '#7c8a9d',
        title: '#93c5fd',
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        primaryText: '#f8fbff',
        good: '#4ade80',
        warn: '#fbbf24',
        bad: '#f87171'
    }

    function getNtosCompatTheme() {
        return SUI.NTOS && SUI.NTOS.theme ? SUI.NTOS.theme : NTOS_COMPAT_THEME
    }

    function isNtosCompatMode() {
        var state = typeof SUI !== 'undefined' && SUI.getState ? SUI.getState() : null
        var data = state && state.data
        return !!(data && data.PC_hasheader && typeof data.PC_showexitprogram !== 'undefined')
    }

    function mergeStyles(baseStyle, overrideStyle) {
        var merged = {}
        var key
        for (key in (baseStyle || {})) merged[key] = baseStyle[key]
        for (key in (overrideStyle || {})) merged[key] = overrideStyle[key]
        return merged
    }

    function ensureNtosCompatStyles() {
        if (!isNtosCompatMode()) {
            return
        }
        if (SUI.NTOS && SUI.NTOS.ensureStyles) {
            SUI.NTOS.ensureStyles()
        }
        if (typeof document === 'undefined' || document.getElementById('sui-ntos-compat-styles')) {
            return
        }

        var theme = getNtosCompatTheme()
        var style = document.createElement('style')
        style.id = 'sui-ntos-compat-styles'
        style.type = 'text/css'
        style.appendChild(document.createTextNode(''
            + '.suiNtosCompatButton:hover{background:' + theme.primaryHover + ' !important;}'
            + '.suiNtosCompatButtonGhost:hover,.suiNtosCompatActionLink:hover{border-color:#475569 !important;background:rgba(51,65,85,0.22) !important;color:#ffffff !important;}'
            + '.suiNtosCompatButtonDanger:hover{border-color:#b91c1c !important;background:rgba(127,29,29,0.32) !important;color:#fecaca !important;}'
            + '.suiNtosCompatTable td{padding:8px 6px;color:' + theme.text + ';vertical-align:top;}'
            + '.suiNtosCompatTable tr + tr td{border-top:1px solid ' + theme.rowBorder + ';}'
            + '.suiNtosCompatTable tr:first-child td{border-top:none;color:' + theme.muted + ';text-transform:uppercase;font-size:10px;letter-spacing:0.12em;font-weight:600;}'
            + '.suiNtosCompatTableRow:hover td{background:' + theme.rowHover + ';}'
            + '.suiNtosCompatActionLink .uiIcon16,.suiNtosCompatButton .uiIcon16,.suiNtosCompatButtonGhost .uiIcon16{margin:0;}'
        ))
        document.getElementsByTagName('head')[0].appendChild(style)
    }

    // ============================================================
    // Button
    // ============================================================
    function Button(props) {
        var children = props.children || props.content
        var icon = props.icon
        var selected = props.selected
        var disabled = props.disabled
        var onClick = props.onClick
        var fluid = props.fluid
        var isNtos = isNtosCompatMode()

        var iconHtml = ''
        var iconClass = 'noIcon'
        if (icon) {
            iconHtml = h('div', { class: 'uiIcon16 icon-' + icon })
            iconClass = 'hasIcon'
        }

        var style = {}
        if (fluid) {
            style.display = 'block'
            style.width = '100%'
            style.boxSizing = 'border-box'
        }
        if (props.style) {
            for (var styleKey in props.style) style[styleKey] = props.style[styleKey]
        }

        if (isNtos) {
            ensureNtosCompatStyles()
            var theme = getNtosCompatTheme()
            var isDanger = (props.className || '').indexOf('linkDanger') !== -1 || (props.class || '').indexOf('linkDanger') !== -1
            var ntosGhost = !!selected || !!props.ghost || isDanger
            var ntosStyle = {
                display: fluid ? 'flex' : 'inline-flex',
                width: fluid ? '100%' : 'auto',
                boxSizing: 'border-box',
                alignItems: 'center',
                justifyContent: fluid ? 'flex-start' : 'center',
                gap: '6px',
                minHeight: '28px',
                padding: fluid ? '0 12px' : '0 10px',
                borderRadius: '2px',
                border: ntosGhost ? '1px solid ' + (isDanger ? '#7f1d1d' : theme.panelBorder) : 'none',
                background: ntosGhost ? (selected ? 'rgba(30,58,138,0.22)' : 'transparent') : theme.primary,
                color: disabled ? '#67788b' : (isDanger ? '#fca5a5' : (ntosGhost ? theme.muted : theme.primaryText)),
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? '0.45' : '1',
                whiteSpace: fluid ? 'normal' : 'nowrap',
                textAlign: fluid ? 'left' : 'center',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
            }

            return h('button', {
                type: 'button',
                disabled: !!disabled,
                class: 'suiNtosCompatButton' + (ntosGhost ? ' suiNtosCompatButtonGhost' : '') + (isDanger ? ' suiNtosCompatButtonDanger' : ''),
                onClick: function (e) {
                    e.preventDefault()
                    if (!disabled && onClick) onClick(e)
                },
                style: mergeStyles(ntosStyle, style)
            },
                icon ? h('span', { class: 'uiIcon16 icon-' + icon, style: { margin: '0' } }) : null,
                h('span', null, children || '')
            )
        }

        var classes = 'link ' + iconClass
        if (selected) classes += ' selected'
        if (props.className) classes += ' ' + props.className
        if (props.class) classes += ' ' + props.class

        if (disabled) {
            classes += ' disabled'
            return h('div', {
                class: classes,
                unselectable: 'on',
                style: style
            }, iconHtml, children || '')
        }

        return h('div', {
            class: classes.replace('link ', 'linkActive '),
            unselectable: 'on',
            onClick: function (e) {
                e.preventDefault()
                if (onClick) onClick(e)
            },
            style: style
        }, iconHtml, children || '')
    }

    // ============================================================
    // ActionLink - NanoUI helper.link replacement for SUI
    // ============================================================
    function ActionLink(props) {
        var children = props.children || props.content || props.text
        var icon = props.icon
        var selected = props.selected
        var disabled = props.disabled
        var onClick = props.onClick
        var fluid = props.fluid
        var isNtos = isNtosCompatMode()
        var style = {}

        if (fluid) {
            style.display = 'block'
            style.width = '100%'
            style.boxSizing = 'border-box'
        }
        if (props.style) {
            for (var styleKey in props.style) style[styleKey] = props.style[styleKey]
        }

        if (isNtos) {
            ensureNtosCompatStyles()
            var theme = getNtosCompatTheme()
            return h('button', {
                type: 'button',
                disabled: !!disabled,
                class: 'suiNtosCompatActionLink',
                id: props.id || null,
                title: props.title || null,
                onClick: disabled ? null : function (e) {
                    e.preventDefault()
                    if (onClick) onClick(e)
                },
                style: mergeStyles({
                    display: fluid ? 'flex' : 'inline-flex',
                    width: fluid ? '100%' : 'auto',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyContent: fluid ? 'flex-start' : 'center',
                    gap: '6px',
                    minHeight: '28px',
                    padding: fluid ? '0 12px' : '0 10px',
                    borderRadius: '2px',
                    border: '1px solid ' + (selected ? '#475569' : theme.panelBorder),
                    background: selected ? 'rgba(30,58,138,0.22)' : 'transparent',
                    color: disabled ? '#67788b' : theme.muted,
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? '0.45' : '1',
                    whiteSpace: fluid ? 'normal' : 'nowrap',
                    textAlign: fluid ? 'left' : 'center',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                }, style)
            },
                icon ? h('span', { class: 'uiIcon16 icon-' + icon, style: { margin: '0' } }) : null,
                h('span', null, children || '')
            )
        }

        var iconHtml = ''
        var iconClass = 'noIcon'
        if (icon) {
            iconHtml = [
                h('div', { class: 'uiLinkPendingIcon' }),
                h('div', { class: 'uiIcon16 icon-' + icon })
            ]
            iconClass = 'hasIcon'
        }

        var classes = 'link ' + iconClass
        if (!disabled) classes = classes.replace('link ', 'linkActive ')
        if (selected) classes += ' selected'
        if (disabled) classes += ' disabled'
        if (props.className) classes += ' ' + props.className
        if (props.class) classes += ' ' + props.class

        return h('div', {
            class: classes,
            id: props.id || null,
            title: props.title || null,
            unselectable: 'on',
            onClick: disabled ? null : function (e) {
                e.preventDefault()
                if (onClick) onClick(e)
            },
            style: style
        }, iconHtml, children || '')
    }

    // ============================================================
    // Section (fieldset with legend)
    // ============================================================
    function Section(props) {
        var title = props.title
        var children = props.children
        var style = props.style || {}
        var fill = props.fill
        var scrollable = props.scrollable
        var isNtos = isNtosCompatMode()

        if (isNtos) {
            ensureNtosCompatStyles()
            var theme = getNtosCompatTheme()
            var sectionStyle = mergeStyles({
                background: theme.panelBackground,
                border: '1px solid ' + theme.panelBorder,
                borderRadius: '0',
                padding: '10px 12px',
                boxSizing: 'border-box'
            }, style)
            if (fill) {
                sectionStyle.display = 'flex'
                sectionStyle.flexDirection = 'column'
                sectionStyle.width = '100%'
                sectionStyle.height = '100%'
                sectionStyle.minHeight = '0'
            }
            var ntosContentStyle = null
            if (fill || scrollable) {
                ntosContentStyle = {
                    minHeight: '0',
                    overflowY: scrollable ? 'auto' : null,
                    overflowX: scrollable ? 'hidden' : null
                }
                if (fill) ntosContentStyle.flex = '1 1 auto'
            }

            return h('section', {
                style: sectionStyle,
                class: props.className || props.class || null
            },
                title ? h('div', {
                    style: {
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: theme.title,
                        fontSize: '11px',
                        fontWeight: '500',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                    }
                },
                    h('div', { style: { height: '1px', flex: '1 1 auto', background: theme.panelBorder } }),
                    h('div', { style: { flex: '0 0 auto', textAlign: 'center' } }, title),
                    h('div', { style: { height: '1px', flex: '1 1 auto', background: theme.panelBorder } })
                ) : null,
                ntosContentStyle ? h('div', { style: ntosContentStyle }, children) : children
            )
        }

        var fieldsetStyle = {
            backgroundColor: '#202020',
            borderColor: 'rgb(117, 117, 117)',
            boxSizing: 'border-box'
        }
        if (fill) {
            fieldsetStyle.display = 'flex'
            fieldsetStyle.flexDirection = 'column'
            fieldsetStyle.width = '100%'
            fieldsetStyle.height = '100%'
            fieldsetStyle.minHeight = '0'
        }
        for (var k in style) fieldsetStyle[k] = style[k]

        var contentStyle = null
        if (fill || scrollable) {
            contentStyle = {
                minHeight: '0',
                overflowY: scrollable ? 'auto' : null,
                overflowX: scrollable ? 'hidden' : null
            }
            if (fill) contentStyle.flex = '1 1 auto'
        }

        return h('fieldset', {
            style: fieldsetStyle,
            class: props.className || props.class || null
        },
            title ? h('legend', { style: { textAlign: 'center' } }, title) : null,
            contentStyle ? h('div', { style: contentStyle }, children) : children
        )
    }

    // ============================================================
    // MapPanel - reusable shell for DM-managed map windows
    // ============================================================
    function MapPanel(props) {
        var viewportRef = useRef(null)
        var lastRectRef = useRef(null)
        var active = !!props.active
        var toolbar = props.toolbar
        var activeMessage = props.activeMessage || 'Map feed active.'
        var inactiveMessage = props.inactiveMessage || 'Map feed inactive.'
        var hint = typeof props.hint === 'undefined'
            ? 'Map viewport is managed by DM via set_show_map(...).'
            : props.hint
        var style = {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            height: props.height || '100%',
            minHeight: props.minHeight || '260px',
            boxSizing: 'border-box'
        }
        if (props.style) {
            for (var styleKey in props.style) style[styleKey] = props.style[styleKey]
        }

        var viewportStyle = {
            flex: '1 1 auto',
            minHeight: '120px',
            border: '1px dashed #40628a',
            backgroundColor: active ? 'rgba(64,98,138,0.16)' : 'rgba(0,0,0,0.25)',
            color: active ? '#dbe9f8' : '#888888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }
        var viewportChildren = active
            ? (props.activeContent || activeMessage)
            : (props.inactiveContent || inactiveMessage)

        function getUiPixelScale() {
            if (typeof window.devicePixelRatio === 'number' && window.devicePixelRatio > 0.5) {
                return window.devicePixelRatio
            }

            if (window.screen && window.screen.deviceXDPI && window.screen.logicalXDPI) {
                var legacyRatio = window.screen.deviceXDPI / window.screen.logicalXDPI
                if (legacyRatio > 0.5) {
                    return legacyRatio
                }
            }

            return 1
        }

        function syncBounds() {
            if (props.syncBounds === false || !viewportRef.current || typeof SUI.act !== 'function') {
                return
            }

            var rect = viewportRef.current.getBoundingClientRect()
            var scale = getUiPixelScale()
            var documentElement = document.documentElement || {}
            var body = document.body || {}
            var viewportWidth = window.innerWidth || documentElement.clientWidth || body.clientWidth || rect.right
            var viewportHeight = window.innerHeight || documentElement.clientHeight || body.clientHeight || rect.bottom
            var nextRect = {
                x: Math.round(rect.left * scale),
                y: Math.round(rect.top * scale),
                width: Math.ceil(rect.width * scale),
                height: Math.ceil(rect.height * scale),
                window_width: Math.ceil(viewportWidth * scale),
                window_height: Math.ceil(viewportHeight * scale)
            }

            if (nextRect.width <= 0 || nextRect.height <= 0) {
                return
            }

            var lastRect = lastRectRef.current
            if (lastRect
                && lastRect.x === nextRect.x
                && lastRect.y === nextRect.y
                && lastRect.width === nextRect.width
                && lastRect.height === nextRect.height
                && lastRect.window_width === nextRect.window_width
                && lastRect.window_height === nextRect.window_height) {
                return
            }

            lastRectRef.current = nextRect
            SUI.act('__sync_map_panel', nextRect)
        }

        useEffect(function () {
            var scheduledSync = 0
            function requestSync() {
                if (scheduledSync) {
                    return
                }
                if (window.requestAnimationFrame) {
                    scheduledSync = window.requestAnimationFrame(function () {
                        scheduledSync = 0
                        syncBounds()
                    })
                    return
                }
                scheduledSync = window.setTimeout(function () {
                    scheduledSync = 0
                    syncBounds()
                }, 0)
            }

            var firstTimer = window.setTimeout(requestSync, 0)
            var secondTimer = window.setTimeout(requestSync, 100)
            var interval = window.setInterval(syncBounds, 500)

            function handleResize() {
                requestSync()
            }

            function handleScroll() {
                requestSync()
            }

            window.addEventListener('resize', handleResize)
            document.addEventListener('scroll', handleScroll, true)

            return function () {
                window.clearTimeout(firstTimer)
                window.clearTimeout(secondTimer)
                window.clearInterval(interval)
                window.removeEventListener('resize', handleResize)
                document.removeEventListener('scroll', handleScroll, true)
                if (scheduledSync) {
                    if (window.cancelAnimationFrame && window.requestAnimationFrame) {
                        window.cancelAnimationFrame(scheduledSync)
                    } else {
                        window.clearTimeout(scheduledSync)
                    }
                }
            }
        }, [])

        return h('div', {
            class: props.className || props.class || null,
            style: style
        },
            toolbar ? h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    flexWrap: 'wrap'
                }
            }, toolbar) : null,
            h('div', {
                ref: viewportRef,
                style: viewportStyle,
                'data-sui-map-panel': 'true'
            }, viewportChildren),
            props.children || null,
            hint ? h('div', {
                style: {
                    color: '#8ba5c4',
                    fontSize: '11px',
                    lineHeight: '1.35'
                }
            }, hint) : null
        )
    }

    // ============================================================
    // LabeledList - list of label: value pairs
    // ============================================================
    function LabeledList(props) {
        if (isNtosCompatMode()) {
            ensureNtosCompatStyles()
        }
        return h('div', null, props.children)
    }

    LabeledList.Item = function LabeledListItem(props) {
        if (isNtosCompatMode()) {
            var theme = getNtosCompatTheme()
            return h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '110px minmax(0, 1fr)',
                    columnGap: '10px',
                    alignItems: 'start',
                    padding: '6px 0',
                    borderTop: props.first ? 'none' : '1px solid ' + theme.rowBorder
                }
            },
                h('div', {
                    style: {
                        color: theme.subtle,
                        fontSize: '10px',
                        fontWeight: '500',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                    }
                }, props.label),
                h('div', {
                    style: {
                        color: theme.text,
                        fontSize: '12px',
                        lineHeight: '14px',
                        fontWeight: '600',
                        minWidth: '0',
                        wordBreak: 'break-word',
                        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                    }
                }, props.children)
            )
        }
        return h('div', { class: 'item' },
            h('div', { class: 'itemLabel' }, props.label),
            h('div', { class: 'itemContent' }, props.children)
        )
    }

    // ============================================================
    // ProgressBar
    // ============================================================
    function ProgressBar(props) {
        var value = props.value || 0
        var min = typeof props.minValue !== 'undefined' ? props.minValue : (props.min || 0)
        var max = typeof props.maxValue !== 'undefined' ? props.maxValue : (props.max || 100)
        var color = props.color || ''
        var showText = props.showText || ''

        // Clamp value
        if (value < min) value = min
        if (value > max) value = max

        var percentage = Math.round((value - min) / (max - min) * 100)

        return h('div', { class: 'displayBar ' + color },
            h('div', {
                class: 'displayBarFill ' + color,
                style: { width: percentage + '%' }
            }),
            showText ? h('div', { class: 'displayBarText ' + color }, showText) : null
        )
    }

    // ============================================================
    // Table
    // ============================================================
    function Table(props) {
        if (isNtosCompatMode()) {
            ensureNtosCompatStyles()
            var theme = getNtosCompatTheme()
            return h('table', {
                class: 'suiNtosCompatTable' + (props.class ? ' ' + props.class : ''),
                style: mergeStyles({
                    width: '100%',
                    borderCollapse: 'collapse',
                    borderSpacing: '0',
                    background: 'transparent'
                }, props.style || null)
            }, props.children)
        }
        return h('table', { class: props.class || '', style: props.style || null }, props.children)
    }

    Table.Row = function TableRow(props) {
        if (isNtosCompatMode()) {
            return h('tr', {
                class: 'suiNtosCompatTableRow',
                style: props.style || null
            }, props.children)
        }
        return h('tr', { style: props.style || null }, props.children)
    }

    Table.Cell = function TableCell(props) {
        if (isNtosCompatMode()) {
            var theme = getNtosCompatTheme()
            return h('td', {
                style: mergeStyles({
                    fontSize: '12px',
                    lineHeight: '14px',
                    verticalAlign: 'top'
                }, props.style || null)
            }, props.children)
        }
        return h('td', { style: props.style || null }, props.children)
    }

    // ============================================================
    // NoticeBox - warning/info banners
    // ============================================================
    function NoticeBox(props) {
        var danger = props.danger
        if (isNtosCompatMode()) {
            ensureNtosCompatStyles()
            var theme = getNtosCompatTheme()
            return h('div', {
                class: 'notice',
                style: {
                    textAlign: 'left',
                    marginBottom: '10px',
                    padding: '10px 12px',
                    border: '1px solid ' + (danger ? '#6a2d2d' : theme.panelBorder),
                    background: danger ? '#261414' : theme.cardBackground,
                    color: danger ? '#f1c1c1' : theme.text,
                    fontSize: '11px',
                    lineHeight: '15px'
                }
            }, props.children)
        }
        var style = {
            textAlign: 'center',
            marginBottom: '15px',
            padding: '10px'
        }

        if (danger) {
            style.backgroundColor = '#5c0f0f'
            style.borderColor = '#ff3333'
            style.color = '#ffcccc'
        }

        return h('div', { class: 'notice', style: style }, props.children)
    }

    // ============================================================
    // WindowChrome - immersive draggable in-page titlebar for frameless SUI windows
    // ============================================================

    // Drag state (module-level, shared by all WindowChrome instances)
    var _drag = { active: false, moved: false, lastX: 0, lastY: 0, winX: 0, winY: 0, captureTarget: null }

    function _readWindowCoord(primaryKey, fallbackKey) {
        var primary = window[primaryKey]
        if (typeof primary === 'number' && !isNaN(primary)) {
            return primary
        }

        var fallback = window[fallbackKey]
        if (typeof fallback === 'number' && !isNaN(fallback)) {
            return fallback
        }

        return 0
    }

    function _initDrag(e) {
        if (e.button !== 0) return // left button only
        e.preventDefault()
        _drag.active = true
        _drag.moved = false
        _drag.lastX = e.screenX
        _drag.lastY = e.screenY

        // In BYOND/IE, screenLeft/Top gives the absolute monitor position
        _drag.winX = _readWindowCoord('screenLeft', 'screenX')
        _drag.winY = _readWindowCoord('screenTop', 'screenY')
        _drag.captureTarget = e.currentTarget || e.target || null

        if (_drag.captureTarget && _drag.captureTarget.setCapture) {
            _drag.captureTarget.setCapture()
        }

        document.addEventListener('mousemove', _onDragMove, true)
        document.addEventListener('mouseup', _onDragEnd, true)
    }

    function _onDragMove(e) {
        if (!_drag.active) return
        e.preventDefault()
        var dx = e.screenX - _drag.lastX
        var dy = e.screenY - _drag.lastY
        if (!_drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
            return
        }
        _drag.moved = true
        _drag.lastX = e.screenX
        _drag.lastY = e.screenY
        _drag.winX += dx
        _drag.winY += dy

        var state = typeof SUI !== 'undefined' ? SUI.getState() : null
        var winId = (state && state.config && state.config.window_id) || window.name || ''

        if (winId) {
            window.location.href = 'byond://winset?id=' + encodeURIComponent(winId) + ';pos=' + _drag.winX + ',' + _drag.winY
        }
    }

    function _onDragEnd(e) {
        _drag.active = false
        _drag.moved = false
        if (_drag.captureTarget && _drag.captureTarget.releaseCapture) {
            _drag.captureTarget.releaseCapture()
        }
        _drag.captureTarget = null
        document.removeEventListener('mousemove', _onDragMove, true)
        document.removeEventListener('mouseup', _onDragEnd, true)
    }

    function _getWindowId() {
        var state = typeof SUI !== 'undefined' ? SUI.getState() : null
        return (state && state.config && state.config.window_id) || window.name || ''
    }

    function _sendWinset(command) {
        var winId = _getWindowId()
        if (!winId) return
        window.location.href = 'byond://winset?id=' + encodeURIComponent(winId) + ';' + command
    }

    function _getCurrentWindowSize() {
        return {
            width: window.innerWidth || document.documentElement.clientWidth || 520,
            height: window.innerHeight || document.documentElement.clientHeight || 680
        }
    }

    function WindowChrome(props) {
        var accent = props.accent || '#40628a'
        var subtitle = props.subtitle
        var badgeText = props.badgeText || ((props.title || 'UI').charAt(0).toUpperCase())
        var onClose = props.onClose || function () { SUI.act('__close') }
        var draggable = props.draggable !== false // default: draggable

        return h('div', {
            onMouseDown: draggable ? _initDrag : null,
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: '#1a1a1a',
                borderBottom: '1px solid #40628a',
                cursor: draggable ? 'move' : 'default',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MsUserSelect: 'none'
            }
        },
            // Badge
            h('div', {
                style: {
                    width: '28px',
                    height: '28px',
                    lineHeight: '28px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: '#ffffff',
                    background: accent,
                    flexShrink: '0'
                }
            }, badgeText),
            // Title + subtitle
            h('div', {
                style: { flex: '1 1 auto', minWidth: '0', overflow: 'hidden' }
            },
                h('div', {
                    style: {
                        fontSize: '13px',
                        fontWeight: 'bold',
                        lineHeight: '16px',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                }, props.title || 'Interface'),
                subtitle ? h('div', {
                    style: {
                        fontSize: '10px',
                        lineHeight: '13px',
                        color: '#e9c183',
                        marginTop: '1px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                }, subtitle) : null
            ),
            // Right side (badges + close)
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '0 0 auto'
                },
                onMouseDown: function (e) { e.stopPropagation() }
            },
                props.children,
                props.allowClose === false ? null : h('div', {
                    title: 'Close',
                    onClick: function (e) {
                        e.preventDefault()
                        e.stopPropagation()
                        onClose()
                    },
                    unselectable: 'on',
                    style: {
                        width: '22px',
                        height: '22px',
                        lineHeight: '20px',
                        textAlign: 'center',
                        border: '1px solid #666666',
                        background: '#40628a',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }
                }, '\u00D7')))
    }

    // ============================================================
    // SystemTopBar - reusable frameless pseudo-window controls bar
    // ============================================================
    function SystemTopBar(props) {
        var onClose = props.onClose || function () { SUI.act('__close') }
        var badge = props.badge
        var draggable = props.draggable !== false
        var _useState = useState(false)
        var isMaximized = _useState[0]
        var setIsMaximized = _useState[1]
        var _useState2 = useState(false)
        var isMinimized = _useState2[0]
        var setIsMinimized = _useState2[1]
        var lastNormalSizeRef = useRef(_getCurrentWindowSize())

        function sendWindowSize(width, height) {
            _sendWinset('size=' + Math.max(1, Math.round(width)) + 'x' + Math.max(1, Math.round(height)))
        }

        useEffect(function () {
            function rememberWindowSize() {
                if (isMaximized || isMinimized) return
                lastNormalSizeRef.current = _getCurrentWindowSize()
            }

            rememberWindowSize()
            window.addEventListener('resize', rememberWindowSize)
            return function () {
                window.removeEventListener('resize', rememberWindowSize)
            }
        }, [isMaximized, isMinimized])

        function handleMinimize() {
            if (props.onMinimize) {
                props.onMinimize(isMinimized)
                return
            }
            if (!isMinimized) {
                lastNormalSizeRef.current = _getCurrentWindowSize()
                if (isMaximized) {
                    _sendWinset('is-maximized=false')
                    setIsMaximized(false)
                }
                sendWindowSize(lastNormalSizeRef.current.width, props.minimizedHeight || 36)
                setIsMinimized(true)
                return
            }

            var restoreSize = lastNormalSizeRef.current || {
                width: props.restoreWidth || 520,
                height: props.restoreHeight || 680
            }
            sendWindowSize(restoreSize.width, restoreSize.height)
            setIsMinimized(false)
        }

        function handleMaximize() {
            if (props.onMaximize) {
                props.onMaximize(isMaximized)
                return
            }
            if (isMinimized) {
                var restoreSize = lastNormalSizeRef.current || {
                    width: props.restoreWidth || 520,
                    height: props.restoreHeight || 680
                }
                sendWindowSize(restoreSize.width, restoreSize.height)
                setIsMinimized(false)
            }
            var nextValue = !isMaximized
            if (nextValue) {
                lastNormalSizeRef.current = _getCurrentWindowSize()
                _sendWinset('is-maximized=true')
                setIsMaximized(true)
                return
            }
            _sendWinset('is-maximized=' + (nextValue ? 'true' : 'false'))
            setIsMaximized(false)
            window.setTimeout(function () {
                var restoreSize = lastNormalSizeRef.current || {
                    width: props.restoreWidth || 520,
                    height: props.restoreHeight || 680
                }
                sendWindowSize(restoreSize.width, restoreSize.height)
            }, 30)
        }

        return h('div', {
            class: props.className || props.class || null,
            onMouseDown: draggable ? _initDrag : null,
            style: props.style || {
                height: '28px',
                background: '#dce9e2',
                color: '#0f172a',
                borderBottom: '1px solid rgba(15,23,42,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                boxSizing: 'border-box',
                cursor: draggable ? 'move' : 'default'
            }
        },
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }
            },
                badge || h('div', {
                    style: {
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #fde68a, #f97316 72%)',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.42)'
                    }
                })
            ),
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                },
                onMouseDown: function (e) { e.stopPropagation() }
            },
                h(SystemTopBar.Button, {
                    label: '\u2013',
                    title: isMinimized ? 'Restore' : 'Minimize',
                    onClick: handleMinimize
                }),
                h(SystemTopBar.Button, {
                    label: isMaximized ? '\u2752' : '\u25A1',
                    title: isMaximized ? 'Restore' : 'Maximize',
                    onClick: handleMaximize
                }),
                h(SystemTopBar.Button, {
                    label: '\u00D7',
                    title: 'Close',
                    danger: true,
                    onClick: onClose
                })
            )
        )
    }

    SystemTopBar.Button = function SystemTopBarButton(props) {
        return h('div', {
            title: props.title,
            onClick: function (e) {
                e.preventDefault()
                e.stopPropagation()
                if (props.onClick) props.onClick(e)
            },
            style: {
                width: '26px',
                height: '20px',
                lineHeight: '18px',
                textAlign: 'center',
                color: props.danger ? '#7f1d1d' : '#0f172a',
                background: 'transparent',
                border: '1px solid transparent',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none'
            },
            onMouseEnter: function (e) {
                e.currentTarget.style.background = props.danger ? 'rgba(127,29,29,0.22)' : 'rgba(15,23,42,0.08)'
                e.currentTarget.style.borderColor = props.danger ? 'rgba(127,29,29,0.22)' : 'rgba(15,23,42,0.12)'
            },
            onMouseLeave: function (e) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
            }
        }, props.label)
    }

    function WindowResizeHandle(props) {
        var dragRef = useRef(null)

        function onMouseDown(e) {
            if (e.button !== 0) return
            e.preventDefault()
            e.stopPropagation()

            dragRef.current = {
                lastX: e.screenX,
                lastY: e.screenY,
                width: _getCurrentWindowSize().width,
                height: _getCurrentWindowSize().height,
                captureTarget: e.currentTarget || e.target || null
            }

            if (dragRef.current.captureTarget && dragRef.current.captureTarget.setCapture) {
                dragRef.current.captureTarget.setCapture()
            }

            document.addEventListener('mousemove', onMouseMove, true)
            document.addEventListener('mouseup', onMouseUp, true)
        }

        function onMouseMove(e) {
            if (!dragRef.current) return
            e.preventDefault()

            var dx = e.screenX - dragRef.current.lastX
            var dy = e.screenY - dragRef.current.lastY
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                return
            }
            dragRef.current.lastX = e.screenX
            dragRef.current.lastY = e.screenY
            dragRef.current.width = Math.max(props.minWidth || 420, dragRef.current.width + dx)
            dragRef.current.height = Math.max(props.minHeight || 320, dragRef.current.height + dy)
            var nextWidth = dragRef.current.width
            var nextHeight = dragRef.current.height
            _sendWinset('is-maximized=false;size=' + Math.round(nextWidth) + 'x' + Math.round(nextHeight))
        }

        function onMouseUp() {
            if (dragRef.current && dragRef.current.captureTarget && dragRef.current.captureTarget.releaseCapture) {
                dragRef.current.captureTarget.releaseCapture()
            }
            dragRef.current = null
            document.removeEventListener('mousemove', onMouseMove, true)
            document.removeEventListener('mouseup', onMouseUp, true)
        }

        useEffect(function () {
            return function () {
                document.removeEventListener('mousemove', onMouseMove, true)
                document.removeEventListener('mouseup', onMouseUp, true)
            }
        }, [])

        return h('div', {
            class: props.className || props.class || null,
            title: props.title || 'Resize',
            onMouseDown: onMouseDown,
            style: props.style || {
                position: 'absolute',
                right: '2px',
                bottom: '2px',
                width: '14px',
                height: '14px',
                cursor: 'nwse-resize',
                zIndex: 6
            }
        }, props.children)
    }

    // ============================================================
    // Tabs - tabbed navigation
    // ============================================================
    function Tabs(props) {
        var vertical = props.vertical
        var style = {
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            flexWrap: vertical ? 'nowrap' : 'wrap',
            borderBottom: vertical ? 'none' : '2px solid #40628a',
            borderRight: vertical ? '2px solid #40628a' : 'none',
            gap: '0',
            padding: '0',
            margin: vertical ? '0 0 0 0' : '0 0 4px 0'
        }
        return h('div', { style: style }, props.children)
    }

    Tabs.Tab = function Tab(props) {
        var selected = props.selected
        var onClick = props.onClick
        var icon = props.icon

        return h('div', {
            onClick: function (e) {
                e.preventDefault()
                if (onClick) onClick(e)
            },
            unselectable: 'on',
            style: {
                padding: '6px 14px',
                cursor: 'pointer',
                color: selected ? '#ffffff' : '#aaaaaa',
                backgroundColor: selected ? '#40628a' : 'transparent',
                borderBottom: selected ? '2px solid #6699cc' : '2px solid transparent',
                marginBottom: '-2px',
                fontSize: '12px',
                fontWeight: selected ? 'bold' : 'normal',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s, color 0.15s'
            }
        },
            icon ? h('span', { class: 'uiIcon16 icon-' + icon, style: { marginRight: '4px' } }) : null,
            props.children
        )
    }

    // ============================================================
    // NumberInput - clickable number with +/- buttons, wheel support
    // ============================================================
    function NumberInput(props) {
        var value = typeof props.value === 'number' ? props.value : 0
        var step = props.step || 1
        var minVal = typeof props.minValue === 'number' ? props.minValue : -Infinity
        var maxVal = typeof props.maxValue === 'number' ? props.maxValue : Infinity
        var onChange = props.onChange
        var disabled = props.disabled
        var unit = props.unit || ''
        var width = props.width || 'auto'

        function clamp(v) {
            return Math.max(minVal, Math.min(maxVal, v))
        }

        function change(delta) {
            if (disabled) return
            var nv = clamp(value + delta)
            if (onChange) onChange(nv)
        }

        return h('div', {
            style: {
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid #666',
                backgroundColor: '#1a1a1a',
                width: width,
                opacity: disabled ? '0.5' : '1'
            },
            onWheel: function (e) {
                e.preventDefault()
                change(e.deltaY < 0 ? step : -step)
            }
        },
            h('div', {
                onClick: function () { change(-step) },
                unselectable: 'on',
                style: {
                    padding: '2px 6px',
                    cursor: disabled ? 'default' : 'pointer',
                    color: '#aaa',
                    userSelect: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            }, '\u2212'),
            h('div', {
                style: {
                    flex: '1',
                    textAlign: 'center',
                    padding: '2px 4px',
                    minWidth: '30px',
                    fontSize: '12px',
                    color: '#ffffff'
                }
            }, value + (unit ? ' ' + unit : '')),
            h('div', {
                onClick: function () { change(step) },
                unselectable: 'on',
                style: {
                    padding: '2px 6px',
                    cursor: disabled ? 'default' : 'pointer',
                    color: '#aaa',
                    userSelect: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            }, '+')
        )
    }

    // ============================================================
    // Dropdown - select from a list
    // ============================================================
    function Dropdown(props) {
        var selected = props.selected || ''
        var options = props.options || []
        var onSelected = props.onSelected
        var disabled = props.disabled
        var width = props.width || '150px'
        var placeholder = props.placeholder || 'Select...'

        var isOpen = SUI.useState(false)
        var open = isOpen[0]
        var setOpen = isOpen[1]

        var display = selected || placeholder

        return h('div', {
            style: { position: 'relative', display: 'inline-block', width: width }
        },
            h('div', {
                onClick: function () { if (!disabled) setOpen(!open) },
                style: {
                    padding: '4px 8px',
                    border: '1px solid #666',
                    backgroundColor: '#1a1a1a',
                    color: selected ? '#ffffff' : '#888',
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: disabled ? '0.5' : '1'
                }
            },
                h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, display),
                h('span', { style: { marginLeft: '6px', fontSize: '8px' } }, open ? '\u25B2' : '\u25BC')
            ),
            open ? h('div', {
                style: {
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    zIndex: '1000',
                    backgroundColor: '#252525',
                    border: '1px solid #666',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }
            }, options.map(function (opt) {
                var optValue = typeof opt === 'object' ? opt.value : opt
                var optLabel = typeof opt === 'object' ? (opt.label || opt.value) : opt
                var isSel = optValue === selected

                return h('div', {
                    key: optValue,
                    onClick: function () {
                        setOpen(false)
                        if (onSelected) onSelected(optValue)
                    },
                    style: {
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: isSel ? '#ffffff' : '#cccccc',
                        backgroundColor: isSel ? '#40628a' : 'transparent',
                        fontSize: '12px'
                    }
                }, optLabel)
            })) : null
        )
    }

    // ============================================================
    // Input - text input with optional debounce
    // ============================================================
    function Input(props) {
        var value = props.value || ''
        var onChange = props.onChange
        var onEnter = props.onEnter
        var placeholder = props.placeholder || ''
        var disabled = props.disabled
        var width = props.width || '100%'
        var fluid = props.fluid

        var localVal = SUI.useState(value)
        var local = localVal[0]
        var setLocal = localVal[1]

        // Sync external value changes
        SUI.useEffect(function () {
            setLocal(value)
        }, [value])

        return h('input', {
            type: 'text',
            value: local,
            placeholder: placeholder,
            disabled: disabled,
            onInput: function (e) {
                setLocal(e.target.value)
                if (onChange) onChange(e.target.value)
            },
            onKeyDown: function (e) {
                if (e.keyCode === 13 && onEnter) {
                    onEnter(local)
                }
            },
            style: {
                width: fluid ? '100%' : width,
                padding: '4px 8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #666',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                opacity: disabled ? '0.5' : '1'
            }
        })
    }

    // ============================================================
    // Slider - drag to select a value from a range
    // ============================================================
    function Slider(props) {
        var value = typeof props.value === 'number' ? props.value : 0
        var minVal = typeof props.minValue === 'number' ? props.minValue : 0
        var maxVal = typeof props.maxValue === 'number' ? props.maxValue : 100
        var step = props.step || 1
        var onChange = props.onChange
        var disabled = props.disabled
        var color = props.color || '#40628a'
        var showValue = props.showValue !== false
        var unit = props.unit || ''

        var fraction = maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0
        var pct = Math.round(fraction * 100)

        function handleClick(e) {
            if (disabled) return
            var rect = e.currentTarget.getBoundingClientRect()
            var x = e.clientX - rect.left
            var frac = x / rect.width
            var raw = minVal + frac * (maxVal - minVal)
            var stepped = Math.round(raw / step) * step
            var clamped = Math.max(minVal, Math.min(maxVal, stepped))
            if (onChange) onChange(clamped)
        }

        return h('div', {
            onClick: handleClick,
            onWheel: function (e) {
                if (disabled) return
                e.preventDefault()
                var delta = e.deltaY < 0 ? step : -step
                var nv = Math.max(minVal, Math.min(maxVal, value + delta))
                if (onChange) onChange(nv)
            },
            style: {
                position: 'relative',
                height: '20px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #666',
                cursor: disabled ? 'default' : 'pointer',
                overflow: 'hidden',
                opacity: disabled ? '0.5' : '1'
            }
        },
            h('div', {
                style: {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    bottom: '0',
                    width: pct + '%',
                    backgroundColor: color,
                    transition: 'width 0.1s'
                }
            }),
            showValue ? h('div', {
                style: {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: '#ffffff',
                    textShadow: '0 0 3px #000',
                    pointerEvents: 'none'
                }
            }, value + (unit ? ' ' + unit : '')) : null
        )
    }

    // ============================================================
    // Collapsible - section that can be toggled open/closed
    // ============================================================
    function Collapsible(props) {
        var title = props.title || 'Details'
        var defaultOpen = props.open !== false
        var icon = props.icon

        var isOpen = SUI.useState(defaultOpen)
        var open = isOpen[0]
        var setOpen = isOpen[1]

        return h('div', { style: { marginBottom: '4px' } },
            h('div', {
                onClick: function () { setOpen(!open) },
                unselectable: 'on',
                style: {
                    padding: '4px 8px',
                    cursor: 'pointer',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #555',
                    color: '#cccccc',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }
            },
                h('span', { style: { fontSize: '8px', width: '10px' } }, open ? '\u25BC' : '\u25B6'),
                icon ? h('span', { class: 'uiIcon16 icon-' + icon }) : null,
                title
            ),
            open ? h('div', {
                style: {
                    padding: '6px 8px',
                    border: '1px solid #555',
                    borderTop: 'none',
                    backgroundColor: '#1e1e1e'
                }
            }, props.children) : null
        )
    }

    // ============================================================
    // Modal - centered overlay dialog
    // ============================================================
    function Modal(props) {
        if (!props.open) return null

        var title = props.title
        var onClose = props.onClose
        var width = props.width || '300px'

        return h('div', {
            style: {
                position: 'fixed',
                top: '0', left: '0', right: '0', bottom: '0',
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000'
            },
            onClick: function (e) {
                if (e.target === e.currentTarget && onClose) onClose()
            }
        },
            h('div', {
                style: {
                    backgroundColor: '#252525',
                    border: '1px solid #40628a',
                    width: width,
                    maxHeight: '80%',
                    overflowY: 'auto'
                }
            },
                title ? h('div', {
                    style: {
                        padding: '8px 12px',
                        borderBottom: '1px solid #40628a',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }
                },
                    h('span', null, title),
                    onClose ? h('span', {
                        onClick: onClose,
                        style: { cursor: 'pointer', color: '#aaa', fontSize: '16px' }
                    }, '\u00D7') : null
                ) : null,
                h('div', { style: { padding: '12px' } }, props.children)
            )
        )
    }

    // ============================================================
    // Stack - flexbox layout helper
    // ============================================================
    function Stack(props) {
        var vertical = props.vertical
        var gap = props.gap || '8px'
        var fill = props.fill
        var align = props.align || (vertical ? 'stretch' : 'center')
        var justify = props.justify || 'flex-start'
        var wrap = props.wrap
        var style = {
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            gap: gap,
            alignItems: align,
            justifyContent: justify,
            flexWrap: wrap ? 'wrap' : 'nowrap',
            width: fill ? '100%' : 'auto',
            boxSizing: 'border-box'
        }

        if (props.style) {
            for (var styleKey in props.style) style[styleKey] = props.style[styleKey]
        }

        return h('div', {
            style: style,
            class: props.className || null
        }, props.children)
    }

    Stack.Item = function StackItem(props) {
        var grow = props.grow
        var shrink = props.shrink
        var basis = props.basis
        var width = props.width
        var height = props.height
        var style = {
            flexGrow: grow ? '1' : '0',
            flexShrink: typeof shrink !== 'undefined' ? (shrink ? '1' : '0') : null,
            flexBasis: basis || 'auto',
            minWidth: '0',
            minHeight: '0'
        }

        if (width) {
            style.width = width
            if (!basis) style.flexBasis = width
        }
        if (height) style.height = height
        if (props.style) {
            for (var styleKey in props.style) style[styleKey] = props.style[styleKey]
        }

        return h('div', {
            style: style,
            class: props.className || props.class || null
        }, props.children)
    }

    // ============================================================
    // Icon - font-awesome icon from NanoUI icon set
    // ============================================================
    function Icon(props) {
        var name = props.name
        var spin = props.spin
        var size = props.size || '16'

        var cls = 'uiIcon' + size + ' icon-' + name
        if (spin) cls += ' icon-spin'

        return h('span', {
            class: cls,
            style: props.style || null,
            title: props.title || null
        })
    }

    // ============================================================
    // Tooltip - hover text
    // ============================================================
    function Tooltip(props) {
        var text = props.text
        var position = props.position || 'top'
        var hovered = SUI.useState(false)
        var isHovered = hovered[0]
        var setHovered = hovered[1]

        var tipStyle = {
            position: 'absolute',
            padding: '4px 8px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #666',
            color: '#ffffff',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            zIndex: '9999',
            pointerEvents: 'none'
        }

        if (position === 'top') {
            tipStyle.bottom = '100%'
            tipStyle.left = '50%'
            tipStyle.transform = 'translateX(-50%)'
            tipStyle.marginBottom = '4px'
        } else if (position === 'bottom') {
            tipStyle.top = '100%'
            tipStyle.left = '50%'
            tipStyle.transform = 'translateX(-50%)'
            tipStyle.marginTop = '4px'
        } else if (position === 'right') {
            tipStyle.left = '100%'
            tipStyle.top = '50%'
            tipStyle.transform = 'translateY(-50%)'
            tipStyle.marginLeft = '4px'
        } else {
            tipStyle.right = '100%'
            tipStyle.top = '50%'
            tipStyle.transform = 'translateY(-50%)'
            tipStyle.marginRight = '4px'
        }

        return h('div', {
            style: { position: 'relative', display: 'inline-block' },
            onMouseEnter: function () { setHovered(true) },
            onMouseLeave: function () { setHovered(false) }
        },
            props.children,
            isHovered && text ? h('div', { style: tipStyle }, text) : null
        )
    }

    // ============================================================
    // Register components on SUI namespace
    // ============================================================
    SUI.Button = Button
    SUI.ActionLink = ActionLink
    SUI.Section = Section
    SUI.MapPanel = MapPanel
    SUI.LabeledList = LabeledList
    SUI.ProgressBar = ProgressBar
    SUI.Table = Table
    SUI.NoticeBox = NoticeBox
    SUI.WindowChrome = WindowChrome
    SUI.SystemTopBar = SystemTopBar
    SUI.WindowResizeHandle = WindowResizeHandle
    SUI.Tabs = Tabs
    SUI.NumberInput = NumberInput
    SUI.Dropdown = Dropdown
    SUI.Input = Input
    SUI.Slider = Slider
    SUI.Collapsible = Collapsible
    SUI.Modal = Modal
    SUI.Stack = Stack
    SUI.Icon = Icon
    SUI.Tooltip = Tooltip
})()
