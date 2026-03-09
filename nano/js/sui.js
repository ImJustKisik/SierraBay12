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

    function ProgramChromeButton(props) {
        return h('button', {
            type: 'button',
            disabled: !!props.disabled,
            onClick: function (event) {
                event.preventDefault()
                if (props.disabled || !props.onClick) {
                    return
                }
                props.onClick(event)
            },
            style: {
                minWidth: '78px',
                padding: '4px 10px',
                border: '1px solid #40628a',
                backgroundColor: props.disabled ? '#2b2b2b' : '#1d3552',
                color: props.disabled ? '#777777' : '#dbe9f8',
                cursor: props.disabled ? 'default' : 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        }, props.children)
    }

    function ProgramChrome(props) {
        var data = props.data || {}
        var config = props.config || {}
        var metaItems = []

        if (data.PC_stationtime) {
            metaItems.push('Time: ' + data.PC_stationtime)
        }
        if (data.PC_showbatteryicon && data.PC_batterypercent) {
            metaItems.push('Battery: ' + data.PC_batterypercent)
        }

        return h('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '8px 10px',
                borderBottom: '1px solid #40628a',
                backgroundColor: '#141414'
            }
        },
            h('div', {
                style: {
                    minWidth: '0',
                    flex: '1 1 auto'
                }
            },
                h('div', {
                    style: {
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        lineHeight: '16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                }, config.title || 'Program'),
                metaItems.length ? h('div', {
                    style: {
                        marginTop: '2px',
                        color: '#8ba5c4',
                        fontSize: '10px',
                        lineHeight: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }
                }, metaItems.join('  |  ')) : null
            ),
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '0 0 auto'
                }
            },
                h(ProgramChromeButton, {
                    disabled: !data.PC_activeprogram,
                    onClick: function () { act('__pc_minimize') }
                }, 'Minimize'),
                data.PC_showexitprogram ? h(ProgramChromeButton, {
                    disabled: !data.PC_activeprogram,
                    onClick: function () { act('__pc_exit') }
                }, 'Exit') : null
            )
        )
    }

    function AppRoot(props) {
        var backend = useBackend()
        var status = backend.config.status !== undefined ? backend.config.status : 2 // 2 = INTERACTIVE
        var hasProgramChrome = isComputerProgramShell(backend.data)
        var shellLockScroll = !!backend.config.shell_lock_scroll
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

        return h('div', { style: contentStyle },
            hasProgramChrome ? h(ProgramChrome, {
                data: backend.data,
                config: backend.config
            }) : null,
            h('div', {
                style: hasProgramChrome
                    ? { flex: '1 1 auto', minHeight: '0', overflow: shellLockScroll ? 'hidden' : 'visible' }
                    : null
            }, h(props.Component, null)),
            status < 2 ? h('div', {
                style: {
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff5555',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    fontFamily: 'sans-serif',
                    letterSpacing: '2px',
                    textShadow: '0 0 10px #000',
                    pointerEvents: 'auto' // block clicks
                }
            }, "OUT OF RANGE") : null
        )
    }

    /**
     * Mount and render the SUI app.
     * Called automatically on page load.
     */
    function mount() {
        var body = document.body
        var interfaceName = body.getAttribute('data-sui-interface')
        var initialDataStr = body.getAttribute('data-initial-data')

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
            root.innerHTML = '<h2>SUI Error: Interface "' + interfaceName + '" not found</h2>'
            if (window.setUiLoadingError)
                window.setUiLoadingError('Interface module not found.')
            if (window.hideUiLoading)
                window.hideUiLoading()
            return
        }

        // Render with Preact
        render(h(AppRoot, { Component: InterfaceComponent }), root)
        if (window.hideUiLoading)
            window.hideUiLoading()
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
