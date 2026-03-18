/**
 * SUI (Sierra UI) - Lightweight UI framework for SierraBay12
 * Built on Preact, inspired by TGUI (/tg/station)
 *
 * This file provides:
 * - Transport layer (BYOND <-> JS communication)
 * - useBackend() hook for accessing data and sending actions
 * - SUI.render() entry point for mounting interfaces
 * - SUI.act() for sending actions to DM
 */
var SUI = (function () {
    'use strict'

    var h = preact.h
    var render = preact.render
    var Fragment = preact.Fragment
    var useState = preactHooks.useState
    var useEffect = preactHooks.useEffect
    var useMemo = preactHooks.useMemo
    var useCallback = preactHooks.useCallback
    var useRef = preactHooks.useRef

    // ============================================================
    // State Store
    // ============================================================
    var _state = {
        config: {},
        data: {},
        static_data: {}
    }
    var _listeners = []
    var _interfaces = {}
    var _loadingHidden = false
    var _shellActionPending = null

    // ============================================================
    // Compatibility Helpers (NanoUI-like DX layer)
    // ============================================================
    var _themeStyles = {
        'default': {
            backgroundColor: '',
            backgroundImage: '',
            backgroundPosition: '',
            backgroundRepeat: '',
            fluffBackgroundImage: '',
            fluffBackgroundPosition: '',
            fluffBackgroundRepeat: ''
        },
        'syndicate': {
            backgroundColor: '#8f1414',
            backgroundImage: "url('uiBackground-Syndicate.png')",
            backgroundPosition: '50% 0',
            backgroundRepeat: 'repeat-x',
            fluffBackgroundImage: "url('uiTitleFluff-Syndicate.png')",
            fluffBackgroundPosition: '50% 50%',
            fluffBackgroundRepeat: 'no-repeat'
        },
        'ntscie': {
            backgroundColor: '#502a42',
            backgroundImage: "url('uiBackground-NTsci.png')",
            backgroundPosition: '50% 0',
            backgroundRepeat: 'repeat-x',
            fluffBackgroundImage: "url('uiTitleFluff.png')",
            fluffBackgroundPosition: '50% 50%',
            fluffBackgroundRepeat: 'no-repeat'
        },
        'dais': {
            backgroundColor: '#382d1c',
            backgroundImage: "url('_inf.uiBackground-DAIS.png')",
            backgroundPosition: '50% 0',
            backgroundRepeat: 'repeat-x',
            fluffBackgroundImage: "url('_inf.uiTitleFluffDAIS.png')",
            fluffBackgroundPosition: '50% 50%',
            fluffBackgroundRepeat: 'no-repeat'
        },
        'tech': {
            backgroundColor: '#111111',
            backgroundImage: "url('_inf.uiBackground-Tech.png')",
            backgroundPosition: '0 0',
            backgroundRepeat: 'repeat',
            fluffBackgroundImage: 'none',
            fluffBackgroundPosition: '50% 50%',
            fluffBackgroundRepeat: 'no-repeat'
        }
    }

    function round(number) {
        var numeric = Number(number)
        return isNaN(numeric) ? 0 : Math.round(numeric)
    }

    function fixed(number) {
        var numeric = Number(number)
        return isNaN(numeric) ? 0 : Math.round(numeric * 10) / 10
    }

    function formatNumber(value) {
        if (value === null || typeof value === 'undefined') {
            return '0'
        }
        var text = String(value)
        var parts = text.split('.')
        var integerPart = parts[0]
        var sign = ''
        if (integerPart.charAt(0) === '-') {
            sign = '-'
            integerPart = integerPart.slice(1)
        }
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        if (parts.length === 1) {
            return sign + integerPart
        }
        return sign + integerPart + '.' + parts.slice(1).join('.')
    }

    function capitalizeFirstLetter(text) {
        var stringValue = String(text || '')
        if (!stringValue.length) {
            return ''
        }
        return stringValue.charAt(0).toUpperCase() + stringValue.slice(1)
    }

    function applyThemeMode(modeName) {
        var resolvedMode = String(modeName || 'default').toLowerCase()
        var theme = _themeStyles[resolvedMode] || _themeStyles['default']

        if (document && document.body) {
            var body = document.body
            body.style.backgroundColor = theme.backgroundColor || ''
            body.style.backgroundImage = theme.backgroundImage || ''
            body.style.backgroundPosition = theme.backgroundPosition || ''
            body.style.backgroundRepeat = theme.backgroundRepeat || ''
        }

        var fluff = document && document.getElementById ? document.getElementById('uiTitleFluff') : null
        if (fluff) {
            fluff.style.backgroundImage = theme.fluffBackgroundImage || ''
            fluff.style.backgroundPosition = theme.fluffBackgroundPosition || ''
            fluff.style.backgroundRepeat = theme.fluffBackgroundRepeat || ''
        }

        _state.config = _state.config || {}
        _state.config.theme_mode = resolvedMode
        return ''
    }

    function getThemeMode() {
        return (_state.config && _state.config.theme_mode) || 'default'
    }

    var helpers = {
        round: round,
        fixed: fixed,
        formatNumber: formatNumber,
        capitalizeFirstLetter: capitalizeFirstLetter,
        themeMode: function (modeName) { return applyThemeMode(modeName) },
        setThemeMode: function (modeName) { return applyThemeMode(modeName) },
        getThemeMode: getThemeMode,
        syndicateMode: function () { return applyThemeMode('syndicate') },
        ntscieMode: function () { return applyThemeMode('ntscie') },
        DAISMode: function () { return applyThemeMode('dais') },
        TechMode: function () { return applyThemeMode('tech') }
    }

    function getState() {
        return _state
    }

    function setState(newState) {
        if (newState.config) {
            _state.config = newState.config
            if (newState.config.theme_mode) {
                applyThemeMode(newState.config.theme_mode)
            }
        }
        if (newState.data) _state.data = newState.data
        if (newState.static_data) {
            // Merge static data (it doesn't change often)
            for (var key in newState.static_data) {
                _state.static_data[key] = newState.static_data[key]
            }
        }
        // Notify all listeners
        for (var i = 0; i < _listeners.length; i++) {
            try { _listeners[i](_state) } catch (e) { /* ignore */ }
        }
    }

    function subscribe(fn) {
        _listeners.push(fn)
        return function unsubscribe() {
            var idx = _listeners.indexOf(fn)
            if (idx >= 0) _listeners.splice(idx, 1)
        }
    }

    // ============================================================
    // Transport: BYOND <-> JS
    // ============================================================

    // Get URL parameters embedded in the page by DM
    function getUrlParams() {
        var body = document.body
        if (body && body.getAttribute) {
            try {
                return JSON.parse(body.getAttribute('data-url-parameters') || '{}')
            } catch (e) { return {} }
        }
        return {}
    }

    var _transitionActions = {
        run_program: 'Launching program...',
        open_file: 'Opening file...',
        close_file: 'Returning to browser...',
        edit: 'Opening editor...',
        shutdown: 'Shutting down...',
        edit_language: 'Opening configuration...'
    }

    function ensureTransitionStyles() {
        if (typeof document === 'undefined' || document.getElementById('sui-transition-styles')) {
            return
        }

        var style = document.createElement('style')
        style.id = 'sui-transition-styles'
        style.type = 'text/css'
        style.appendChild(document.createTextNode('' +
            '.suiTransitionOverlay{' +
                'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;' +
                'background:rgba(8,12,18,0.34);opacity:0;pointer-events:none;transition:opacity 0.12s ease;' +
            '}' +
            '.suiTransitionOverlay--active{opacity:1;pointer-events:auto;}' +
            '.suiTransitionOverlay__panel{' +
                'min-width:240px;max-width:min(420px, calc(100vw - 48px));padding:10px 14px;border:1px solid rgba(110,146,190,0.26);' +
                'background:linear-gradient(180deg, rgba(13,19,28,0.97) 0%, rgba(9,14,21,0.97) 100%);' +
                'box-shadow:0 14px 36px rgba(0,0,0,0.32);font:600 11px/1.2 Consolas, "Courier New", monospace;' +
                'letter-spacing:0.12em;text-transform:uppercase;color:#d5e7fb;' +
            '}' +
            '.suiTransitionOverlay__row{display:flex;align-items:center;justify-content:space-between;gap:16px;}' +
            '.suiTransitionOverlay__label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.suiTransitionOverlay__pulse{' +
                'width:42px;height:6px;border:1px solid rgba(110,146,190,0.22);background:rgba(74,128,194,0.14);position:relative;overflow:hidden;flex:0 0 auto;' +
            '}' +
            '.suiTransitionOverlay__pulse::after{' +
                'content:"";position:absolute;inset:0 auto 0 -30%;width:30%;background:linear-gradient(90deg, rgba(128,188,255,0.08) 0%, rgba(128,188,255,0.82) 100%);' +
                'animation:suiTransitionPulse 0.7s linear infinite;' +
            '}' +
            '@keyframes suiTransitionPulse{' +
                '0%{left:-34%;}100%{left:100%;}' +
            '}'
        ))
        document.getElementsByTagName('head')[0].appendChild(style)
    }

    function showTransitionOverlay(message) {
        if (typeof document === 'undefined' || !document.body) {
            return
        }

        ensureTransitionStyles()

        var overlay = document.getElementById('suiTransitionOverlay')
        if (!overlay) {
            overlay = document.createElement('div')
            overlay.id = 'suiTransitionOverlay'
            overlay.className = 'suiTransitionOverlay'
            overlay.innerHTML =
                "<div class='suiTransitionOverlay__panel'>" +
                    "<div class='suiTransitionOverlay__row'>" +
                        "<span id='suiTransitionLabel' class='suiTransitionOverlay__label'></span>" +
                        "<span class='suiTransitionOverlay__pulse'></span>" +
                    "</div>" +
                "</div>"
            document.body.appendChild(overlay)
        }

        var label = document.getElementById('suiTransitionLabel')
        if (label) {
            label.textContent = String(message || 'Switching interface...')
        }
        overlay.className = 'suiTransitionOverlay suiTransitionOverlay--active'
    }

    function hideTransitionOverlay() {
        if (typeof document === 'undefined') {
            return
        }

        var overlay = document.getElementById('suiTransitionOverlay')
        if (!overlay) {
            return
        }

        overlay.className = 'suiTransitionOverlay'
    }

    function beginShellAction(actionKey, message) {
        _shellActionPending = {
            action: actionKey,
            message: message || 'Processing...'
        }
        for (var i = 0; i < _listeners.length; i++) {
            try { _listeners[i](_state) } catch (e) { /* ignore */ }
        }
        window.setTimeout(function () {
            if (_shellActionPending && _shellActionPending.action === actionKey) {
                _shellActionPending = null
                for (var j = 0; j < _listeners.length; j++) {
                    try { _listeners[j](_state) } catch (e) { /* ignore */ }
                }
            }
        }, 1800)
    }

    function hideUiLoadingSafe() {
        if (_loadingHidden) {
            return
        }
        _loadingHidden = true
        if (window.hideUiLoading) {
            window.hideUiLoading()
        }
    }

    /**
     * Send an action to the DM backend via window.location.href
     * This is the same mechanism NanoUI uses.
     *
     * @param {string} action - Action name (maps to ui_act in DM)
     * @param {object} params - Parameters to send
     */
    function act(action, params) {
        var urlParams = getUrlParams()
        var queryString = '?'

        // Add base URL params (src ref)
        for (var key in urlParams) {
            if (urlParams.hasOwnProperty(key)) {
                if (queryString !== '?') queryString += ';'
                queryString += key + '=' + urlParams[key]
            }
        }

        // Add action
        queryString += ';sui_action=' + encodeURIComponent(action)

        // Add action params
        if (params) {
            for (var pkey in params) {
                if (params.hasOwnProperty(pkey)) {
                    queryString += ';' + pkey + '=' + encodeURIComponent(params[pkey])
                }
            }
        }
        if (_transitionActions[action]) {
            showTransitionOverlay(_transitionActions[action])
            window.setTimeout(function () {
                window.location.href = queryString
            }, 140)
            return
        }

        window.location.href = queryString
    }

    // ============================================================
    // useBackend() Hook
    // ============================================================

    /**
     * Preact hook for accessing backend data and sending actions.
     * Usage:
     *   var backend = SUI.useBackend()
     *   var data = backend.data
     *   backend.act('toggle', { value: 1 })
     *
     * @returns {{ data: object, config: object, staticData: object, act: function }}
     */
    function useBackend() {
        var stateRef = useRef(_state)
        var update = useState(0)[1]

        useEffect(function () {
            return subscribe(function (newState) {
                stateRef.current = newState
                update(function (n) { return n + 1 })
            })
        }, [])

        return {
            data: stateRef.current.data || {},
            config: stateRef.current.config || {},
            staticData: stateRef.current.static_data || {},
            act: act
        }
    }

    // ============================================================
    // Global receiver (called from DM via output())
    // ============================================================

    /**
     * Called by the DM backend to push data updates.
     * DM calls: output(json, "[window_id].browser:receiveSuiData")
     */
    window.receiveSuiData = function (jsonString) {
        try {
            var updateData = JSON.parse(jsonString)
            setState(updateData)
            hideTransitionOverlay()
        } catch (e) {
            // Silently fail on bad JSON
        }
    }

    // ============================================================
    // Interface Registry & Rendering
    // ============================================================

    /**
     * Register an interface component for SUI.
     *
     * @param {string} name - Interface name (must match DM-side interface param)
     * @param {function} component - Preact component function
     */
    function registerInterface(name, component) {
        _interfaces[name] = component
    }

    function waitForIconAssets(callback, attempt) {
        attempt = attempt || 0

        if (typeof document === 'undefined') {
            callback()
            return
        }

        var probe = document.createElement('span')
        probe.className = 'uiIcon16 icon-search'
        probe.style.position = 'absolute'
        probe.style.left = '-9999px'
        probe.style.top = '-9999px'
        probe.style.visibility = 'hidden'
        document.body.appendChild(probe)

        var computedStyle = window.getComputedStyle ? window.getComputedStyle(probe) : null
        var backgroundImage = computedStyle ? computedStyle.backgroundImage : ''
        document.body.removeChild(probe)

        if (!backgroundImage || backgroundImage === 'none') {
            if (attempt < 20) {
                setTimeout(function () {
                    waitForIconAssets(callback, attempt + 1)
                }, 50)
                return
            }
            callback()
            return
        }

        var match = backgroundImage.match(/url\(["']?(.+?)["']?\)/)
        if (!match || !match[1]) {
            callback()
            return
        }

        var img = new Image()
        var finished = false

        function done() {
            if (finished) {
                return
            }
            finished = true
            callback()
        }

        img.onload = done
        img.onerror = done
        img.src = match[1]

        if (img.complete) {
            done()
            return
        }

        setTimeout(done, 300)
    }

    function preloadBootAsset(url, callback) {
        if (!url) {
            callback()
            return
        }

        var normalizedUrl = String(url)
        var lowerUrl = normalizedUrl.toLowerCase()
        var completed = false

        function done() {
            if (completed) {
                return
            }
            completed = true
            callback()
        }

        if (lowerUrl.indexOf('.js') !== -1) {
            var scripts = document.getElementsByTagName('script')
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].src === normalizedUrl) {
                    done()
                    return
                }
            }

            var script = document.createElement('script')
            script.type = 'text/javascript'
            script.async = true
            script.onload = done
            script.onerror = done
            script.src = normalizedUrl
            document.getElementsByTagName('head')[0].appendChild(script)
            setTimeout(done, 600)
            return
        }

        var image = new Image()
        image.onload = done
        image.onerror = done
        image.src = normalizedUrl
        if (image.complete) {
            done()
            return
        }
        setTimeout(done, 450)
    }

    function runBootSequence(callback) {
        var bootConfig = window.suiBootConfig
        if (!bootConfig || !bootConfig.enabled) {
            callback()
            return
        }

        var preloadUrls = bootConfig.preloadUrls || []
        var minDuration = Number(bootConfig.minDuration) || 0
        var startTime = Date.now()
        var index = 0

        function setMessage(text) {
            if (window.setUiLoadingMessage) {
                window.setUiLoadingMessage(text)
            }
        }

        function appendLog(text, muted) {
            if (window.appendUiBootLog) {
                window.appendUiBootLog(text, muted)
            }
        }

        function setProgress(value, total) {
            if (window.setUiBootProgress) {
                window.setUiBootProgress(value, total)
            }
        }

        function prettifyAssetName(url) {
            var text = String(url || '')
            var clean = text.split('?')[0]
            var parts = clean.split('/')
            return parts.length ? parts[parts.length - 1] : clean
        }

        function finish() {
            var remaining = Math.max(0, minDuration - (Date.now() - startTime))
            setMessage(bootConfig.completeMessage || 'Boot complete.')
            appendLog('BOOT: interface asset stream complete', false)
            appendLog('BOOT: transferring control to NTOS main menu', true)
            setProgress(preloadUrls.length, preloadUrls.length)
            bootConfig.enabled = false
            setTimeout(callback, remaining)
        }

        function step() {
            if (index >= preloadUrls.length) {
                finish()
                return
            }

            var currentUrl = preloadUrls[index]
            var assetName = prettifyAssetName(currentUrl)
            var currentStep = index + 1
            setMessage('Loading ' + assetName + '...')
            appendLog('LOAD [' + currentStep + '/' + preloadUrls.length + '] ' + assetName, false)
            setProgress(index, preloadUrls.length)

            preloadBootAsset(currentUrl, function () {
                index++
                setProgress(index, preloadUrls.length)
                setTimeout(step, 65)
            })
        }

        appendLog('BOOT: POST complete, reactive control bus online', false)
        appendLog('BOOT: requesting verified NTOS asset stream', false)
        appendLog('BOOT: preload queue length ' + preloadUrls.length, true)
        setProgress(0, preloadUrls.length)

        if (!preloadUrls.length) {
            finish()
            return
        }

        step()
    }

    function isComputerProgramShell(data) {
        return !!(data && data.PC_hasheader && typeof data.PC_showexitprogram !== 'undefined')
    }

    function applyShellScrollMode(lockShellScroll) {
        var shouldLock = !!lockShellScroll
        var html = document.documentElement
        var body = document.body
        var root = document.getElementById('sui-root')

        if (html) {
            html.style.width = '100%'
            html.style.height = '100%'
            html.style.overflow = shouldLock ? 'hidden' : 'auto'
        }

        if (body) {
            body.style.margin = '0'
            body.style.width = '100%'
            body.style.minHeight = '100%'
            body.style.height = shouldLock ? '100%' : 'auto'
            body.style.overflow = shouldLock ? 'hidden' : 'auto'
            body.style.boxSizing = 'border-box'
        }

        if (!root) {
            return
        }

        root.style.width = '100%'
        root.style.minHeight = '100%'
        root.style.boxSizing = 'border-box'

        if (shouldLock) {
            root.style.height = '100%'
            root.style.position = 'fixed'
            root.style.left = '0'
            root.style.top = '0'
            root.style.right = '0'
            root.style.bottom = '0'
            root.style.overflow = 'hidden'
            return
        }

        root.style.height = 'auto'
        root.style.position = 'relative'
        root.style.left = ''
        root.style.top = ''
        root.style.right = ''
        root.style.bottom = ''
        root.style.overflow = 'visible'
    }

    function ensureNtosShellStyles() {
        if (document.getElementById('sui-ntos-shell-styles')) {
            return
        }

        var cssText = ''
            + '.suiNtosShell{background:#151b23;color:#f8fafc;font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;}'
            + '.suiNtosShell .suiNtosContent{background:#151b23;}'
            + '.suiNtosShell fieldset,.suiNtosShell section{margin:0;}'
            + '.suiNtosShell table{border-collapse:collapse;border-spacing:0;width:100%;}'
            + '.suiNtosShell tr:first-child td{border-top:none;color:#94a3b8;text-transform:uppercase;font-size:10px;letter-spacing:0.12em;font-weight:600;}'
            + '.suiNtosShell td{border-top:1px solid #243142;padding:8px 6px;color:#f8fafc;vertical-align:top;}'
            + '.suiNtosShell .item:first-child,.suiNtosShell .item:first-of-type{border-top:none;}'
            + '.suiNtosShell input,.suiNtosShell textarea,.suiNtosShell select{background:#0d1116;border:1px solid #324050;color:#dbe9f8;border-radius:0;box-shadow:none;}'
            + '.suiNtosShell hr{border-color:#24303c;}'
            + '.suiNtosShell button{border-radius:0;box-shadow:none;}'
            + '.suiNtosShell .suiProgramChromeButton{transition:border-color 0.14s ease,background-color 0.14s ease,color 0.14s ease;}'
            + '.suiNtosShell .suiProgramChromeButton:hover{border-color:#475569;background:rgba(51,65,85,0.22);color:#ffffff;}'
            + '.suiNtosShell .suiProgramChromeButton.suiProgramChromeButtonDanger:hover{border-color:#b91c1c;background:rgba(127,29,29,0.32);color:#fecaca;}'

        var style = document.createElement('style')
        style.id = 'sui-ntos-shell-styles'
        style.type = 'text/css'
        style.styleSheet
            ? (style.styleSheet.cssText = cssText)
            : (style.appendChild(document.createTextNode(cssText)))
        document.getElementsByTagName('head')[0].appendChild(style)
    }

    function ProgramChromeButton(props) {
        var style = {
            minWidth: '86px',
            padding: '6px 10px',
            border: '1px solid ' + (props.danger ? '#7f1d1d' : '#374151'),
            backgroundColor: props.disabled ? '#1d232b' : 'transparent',
            color: props.disabled ? '#67788b' : (props.danger ? '#fca5a5' : '#94a3b8'),
            cursor: props.disabled ? 'default' : 'pointer',
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            boxShadow: 'none',
            borderRadius: '0',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
            lineHeight: '12px'
        }
        var key
        for (key in (props.style || {})) {
            style[key] = props.style[key]
        }
        return h('button', {
            type: 'button',
            disabled: !!props.disabled,
            class: 'suiProgramChromeButton' + (props.danger ? ' suiProgramChromeButtonDanger' : ''),
            onClick: function (event) {
                event.preventDefault()
                if (props.disabled || !props.onClick) {
                    return
                }
                props.onClick(event)
            },
            style: style
        }, props.children)
    }

    function ShellStateOverlay(props) {
        return h('div', {
            style: {
                position: 'absolute',
                inset: '0',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: props.blocking ? 'rgba(7,10,14,0.72)' : 'rgba(7,10,14,0.42)',
                pointerEvents: props.blocking ? 'auto' : 'none'
            }
        },
            h('div', {
                style: {
                    minWidth: '260px',
                    maxWidth: '420px',
                    border: '1px solid ' + (props.danger ? '#6a2d2d' : '#324050'),
                    background: props.danger ? '#221315' : '#111821',
                    padding: '12px 14px',
                    position: 'relative'
                }
            },
                h('div', {
                    style: {
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        bottom: '0',
                        width: '3px',
                        background: props.danger ? '#f87171' : '#60a5fa'
                    }
                }),
                h('div', {
                    style: {
                        paddingLeft: '8px'
                    }
                },
                    h('div', {
                        style: {
                            color: props.danger ? '#fca5a5' : '#93c5fd',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            fontWeight: '600'
                        }
                    }, props.eyebrow),
                    h('div', {
                        style: {
                            marginTop: '6px',
                            color: '#eef6ff',
                            fontSize: '14px',
                            fontWeight: '700',
                            lineHeight: '16px'
                        }
                    }, props.title),
                    props.message ? h('div', {
                        style: {
                            marginTop: '6px',
                            color: '#9fb1c6',
                            fontSize: '11px',
                            lineHeight: '15px'
                        }
                    }, props.message) : null
                )
            )
        )
    }

    function ProgramChrome(props) {
        var data = props.data || {}
        var config = props.config || {}
        var title = config.title || data.PC_activeprogram || 'NTOS Program'
        var metaItems = []
        var statusItems = []
        var badgeText = title.charAt(0).toUpperCase()

        var shellPending = props.shellPending
        var shellPendingAction = shellPending && shellPending.action

        if (data.PC_showbatteryicon && data.PC_batterypercent) {
            statusItems.push({
                label: 'POWER',
                value: data.PC_batterypercent
            })
        }
        if (data.PC_ntneticon) {
            statusItems.push({
                label: 'NTNET',
                value: String(data.PC_ntneticon).replace('.gif', '').replace('sig_', '').toUpperCase()
            })
        }
        if (data.PC_apclinkicon) {
            statusItems.push({
                label: 'LINK',
                value: 'CHARGING'
            })
        }
        if (data.PC_stationtime) {
            metaItems.push('Time: ' + data.PC_stationtime)
        }

        return h('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 12px 8px',
                borderBottom: '1px solid #374151',
                background: '#1b1b1c'
            }
        },
            h('div', {
                style: {
                    width: '32px',
                    height: '32px',
                    border: '1px solid #374151',
                    borderRadius: '0',
                    textAlign: 'center',
                    lineHeight: '30px',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: '#ffffff',
                    background: '#10161d',
                    flex: '0 0 auto'
                }
            }, badgeText),
            h('div', {
                style: {
                    minWidth: '0',
                    flex: '1 1 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignSelf: 'center'
                }
            },
                h('div', {
                    style: {
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700',
                        lineHeight: '16px',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        wordBreak: 'break-word'
                    }
                }, title),
                metaItems.length ? h('div', {
                    style: {
                        marginTop: '2px',
                        color: '#94a3b8',
                        fontSize: '10px',
                        lineHeight: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                }, metaItems.join('  |  ')) : null
            ),
            statusItems.length ? h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'nowrap',
                    justifyContent: 'flex-end',
                    minWidth: '0',
                    flex: '0 1 auto'
                }
            },
                statusItems.map(function (item) {
                    return h(ProgramChromeButton, {
                        key: item.label,
                        disabled: true,
                        style: {
                            minWidth: '0',
                            padding: '4px 8px',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap'
                        }
                    }, item.label + ': ' + item.value)
                })
            ) : null,
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '0 0 auto'
                }
            },
                h(ProgramChromeButton, {
                    disabled: !data.PC_activeprogram || !!shellPendingAction,
                    onClick: function () {
                        beginShellAction('__pc_minimize', 'Minimizing window...')
                        act('__pc_minimize')
                    }
                }, 'Minimize'),
                data.PC_showexitprogram ? h(ProgramChromeButton, {
                    danger: true,
                    disabled: !data.PC_activeprogram || !!shellPendingAction,
                    onClick: function () {
                        beginShellAction('__pc_exit', 'Closing program...')
                        act('__pc_exit')
                    }
                }, 'Exit') : null
            )
        )
    }

    function AppRoot(props) {
        var backend = useBackend()
        var status = backend.config.status !== undefined ? backend.config.status : 2 // 2 = INTERACTIVE
        var hasProgramChrome = isComputerProgramShell(backend.data)
        var shellLockScroll = !!backend.config.shell_lock_scroll
        var shellPending = _shellActionPending
        var contentStyle = hasProgramChrome
            ? {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: shellLockScroll ? '100%' : 'auto',
                minHeight: '100%',
                position: 'relative',
                boxSizing: 'border-box',
                overflow: shellLockScroll ? 'hidden' : 'visible'
            }
            : {
                width: '100%',
                height: shellLockScroll ? '100%' : 'auto',
                minHeight: '100%',
                position: 'relative',
                boxSizing: 'border-box',
                overflow: shellLockScroll ? 'hidden' : 'visible'
            }

        useEffect(function () {
            applyShellScrollMode(shellLockScroll)
        }, [shellLockScroll])

        useEffect(function () {
            if (!hasProgramChrome) {
                return
            }

            ensureNtosShellStyles()
        }, [hasProgramChrome])

        return h('div', {
            style: contentStyle,
            class: hasProgramChrome ? 'suiNtosShell' : null
        },
            hasProgramChrome ? h(ProgramChrome, {
                data: backend.data,
                config: backend.config,
                shellPending: shellPending
            }) : null,
            h('div', {
                class: hasProgramChrome ? 'suiNtosContent' : null,
                style: hasProgramChrome
                    ? { flex: '1 1 auto', minHeight: '0', overflow: shellLockScroll ? 'hidden' : 'visible', padding: '10px' }
                    : null
            }, h(props.Component, null)),
            shellPending ? h(ShellStateOverlay, {
                eyebrow: 'NT Shell',
                title: shellPending.message || 'Processing shell action',
                message: 'Stand by while the terminal updates the active program window.',
                blocking: false
            }) : null,
            status < 2 ? h(ShellStateOverlay, {
                eyebrow: status === 1 ? 'Restricted Link' : 'Connection Lost',
                title: status === 1 ? 'Read-only control state' : 'Out of range',
                message: status === 1
                    ? 'The terminal link is degraded. Viewing may continue, but control actions are disabled.'
                    : 'The terminal is no longer within valid interaction range. Reconnect to regain control.',
                blocking: true,
                danger: status === 0
            }) : null
        )
    }

    /**
     * Mount and render the SUI app.
     * Called automatically on page load.
     */
    function mount(attempt) {
        attempt = attempt || 0
        var body = document.body
        var interfaceName = body.getAttribute('data-sui-interface')
        var initialDataStr = body.getAttribute('data-initial-data')
        _loadingHidden = false

        function suppressSecondaryInput(event) {
            if (!event) {
                return false
            }
            if (event.preventDefault) {
                event.preventDefault()
            }
            if (event.stopPropagation) {
                event.stopPropagation()
            }
            event.returnValue = false
            return false
        }

        if (!window.__suiInputGuardsInstalled) {
            window.__suiInputGuardsInstalled = true
            document.addEventListener('contextmenu', suppressSecondaryInput, true)
            document.addEventListener('mousedown', function (event) {
                if (event && event.button === 2) {
                    suppressSecondaryInput(event)
                }
            }, true)
        }

        // Parse initial data
        if (initialDataStr) {
            try {
                var initialData = JSON.parse(initialDataStr.replace(/&#34;/g, '"').replace(/&#39;/g, "'"))
                setState(initialData)
            } catch (e) { /* ignore */ }
        }

        // Find the root element
        var root = document.getElementById('sui-root')
        if (!root) {
            root = document.createElement('div')
            root.id = 'sui-root'
            body.appendChild(root)
        }
        applyShellScrollMode(!!(_state.config && _state.config.shell_lock_scroll))

        // Find and render the interface
        var InterfaceComponent = _interfaces[interfaceName]
        if (!InterfaceComponent) {
            if (attempt < 20) {
                setTimeout(function () {
                    mount(attempt + 1)
                }, 50)
                return
            }
            if (window.setUiLoadingError)
                window.setUiLoadingError('Interface module "' + interfaceName + '" not found.')
            return
        }

        // Render with Preact
        render(h(AppRoot, { Component: InterfaceComponent }), root)
        hideTransitionOverlay()
        window.setTimeout(function () {
            hideUiLoadingSafe()
        }, 2200)
        runBootSequence(function () {
            waitForIconAssets(function () {
                hideUiLoadingSafe()
            })
        })
    }

    // Auto-mount when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount)
    } else {
        // setTimeout to ensure all interface scripts are loaded
        setTimeout(mount, 0)
    }

    // ============================================================
    // Public API
    // ============================================================
    return {
        // Preact re-exports
        h: h,
        render: render,
        Fragment: Fragment,
        useState: useState,
        useEffect: useEffect,
        useMemo: useMemo,
        useCallback: useCallback,
        useRef: useRef,

        // SUI core
        act: act,
        useBackend: useBackend,
        registerInterface: registerInterface,
        getState: getState,
        subscribe: subscribe,

        // Compatibility helpers
        round: round,
        fixed: fixed,
        formatNumber: formatNumber,
        capitalizeFirstLetter: capitalizeFirstLetter,
        applyThemeMode: applyThemeMode,
        getThemeMode: getThemeMode,
        helpers: helpers
    }
})()
