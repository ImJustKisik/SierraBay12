/**
 * SUI ShipSensors interface.
 */
;(function () {
    'use strict'

    var h = SUI.h
    var Fragment = SUI.Fragment
    var useBackend = SUI.useBackend
    var useEffect = SUI.useEffect

    var STYLES_INJECTED = false

    function injectStyles() {
        if (STYLES_INJECTED) return
        STYLES_INJECTED = true

        var css = [
            'body { background: #151b23 !important; margin: 0; padding: 10px; color: #f8fafc; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; }',
            '.sensor-shell { display: grid; gap: 10px; }',
            '.sensor-panel { position: relative; margin: 0; padding: 10px 12px; background: #1b1b1c; border: 1px solid #374151; }',
            '.sensor-panel__title { margin: 0 0 10px; color: #93c5fd; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }',
            '.sensor-panel__title::before, .sensor-panel__title::after { content: ""; height: 1px; flex: 1 1 auto; background: #374151; }',
            '.sensor-status { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #10161d; border: 1px solid #243142; }',
            '.sensor-status__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }',
            '.sensor-status__dot--on { color: #2f943c; background: #2f943c; }',
            '.sensor-status__dot--off { color: #ee0000; background: #ee0000; }',
            '.sensor-status__dot--warn { color: #cd6500; background: #cd6500; }',
            '.sensor-status__label { flex: 1; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }',
            '.sensor-status__detail { color: #94a3b8; font-size: 11px; }',
            '.sensor-row { display: flex; align-items: center; padding: 3px 0; min-height: 22px; }',
            '.sensor-row__label { width: 110px; flex-shrink: 0; color: #7c8a9d; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }',
            '.sensor-row__value { flex: 1; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }',
            '.sensor-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 28px; padding: 0 10px; color: #f8fbff; background: #2563eb; border: none; cursor: pointer; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; transition: background 0.15s ease; }',
            '.sensor-btn:hover { background: #1d4ed8; }',
            '.sensor-btn--active { background: transparent !important; border: 1px solid #374151 !important; color: #94a3b8 !important; }',
            '.sensor-btn--disabled { background: #1d232b !important; border: 1px solid #303846 !important; color: #67788b !important; opacity: 0.5; cursor: default; pointer-events: none; }',
            '.sensor-bar { position: relative; height: 16px; flex: 1; background: #000000; border: 1px solid #666666; overflow: hidden; }',
            '.sensor-bar__fill { height: 100%; transition: width 0.5s ease, background 0.3s ease; }',
            '.sensor-bar__fill--good { background: #4f7529; }',
            '.sensor-bar__fill--average { background: #cd6500; }',
            '.sensor-bar__fill--bad { background: #ee0000; animation: sensorPulse 1.2s ease-in-out infinite; }',
            '.sensor-bar__text { position: absolute; inset: 0 5px; display: flex; align-items: center; color: #ffffff; font-size: 10px; pointer-events: none; }',
            '.sensor-warn { padding-top: 2px; color: #cd6500; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-align: right; }',
            '.sensor-warn--critical { color: #ee0000; animation: sensorPulse 1s infinite; }',
            '.sensor-contact { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #243142; }',
            '.sensor-contact__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }',
            '.sensor-contact__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }',
            '.sensor-contact__bearing { color: #94a3b8; font-size: 11px; font-variant-numeric: tabular-nums; }',
            '.sensor-contact__compass { position: relative; width: 16px; height: 16px; flex-shrink: 0; }',
            '.sensor-contact__compass::before { content: ""; position: absolute; inset: 0; border: 1px solid #374151; border-radius: 50%; }',
            '.sensor-contact__needle { position: absolute; top: 2px; left: 7px; width: 2px; height: 7px; background: #8ba5c4; transform-origin: bottom center; }',
            '.sensor-trace { padding: 4px 0; border-bottom: 1px solid #243142; }',
            '.sensor-trace__header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }',
            '.sensor-trace__id { color: #f8fafc; font-size: 11px; font-style: italic; }',
            '.sensor-trace__bearing { color: #94a3b8; font-size: 10px; }',
            '.sensor-trace__pct { margin-left: auto; color: #8ba5c4; font-size: 10px; }',
            '.sensor-scan { font-size: 11px; line-height: 1.5; color: #ffffff; }',
            '.sensor-scan__header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #243142; }',
            '.sensor-scan__name { color: #f8fafc; font-weight: 700; }',
            '.sensor-scan__loc { color: #94a3b8; font-size: 10px; }',
            '.sensor-scan__body { padding: 6px 8px; background: #10161d; border: 1px solid #374151; }',
            '.sensor-scan__divider { height: 1px; margin: 4px 0; background: #243142; }',
            '.sensor-empty { padding: 12px; color: rgba(255,255,255,0.3); font-size: 11px; font-style: italic; text-align: center; letter-spacing: 0.1em; }',
            '.sensor-missing { padding: 10px; border: 1px dashed rgba(238,0,0,0.3); background: rgba(238,0,0,0.05); text-align: center; }',
            '.sensor-missing__text { margin-bottom: 8px; color: #ee0000; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }',
            '.sensor-subtitle { margin-top: 6px; padding-top: 5px; border-top: 1px solid #243142; color: #93c5fd; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }',
            '@keyframes sensorPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }'
        ].join('\n')

        var style = document.createElement('style')
        style.textContent = css
        document.head.appendChild(style)
    }

    function bearingToDeg(bearing) {
        var n = parseInt(bearing, 10)
        return isNaN(n) ? 0 : n
    }

    function StatusHeader(props) {
        var data = props.data
        var act = props.act
        var allowChange = data.allow_change !== false
        var isOn = !!data.on
        var dotClass = 'sensor-status__dot '

        if (data.status === 'MISSING' || data.status === 'DESTROYED') dotClass += 'sensor-status__dot--off'
        else if (data.status === 'OK' && isOn) dotClass += 'sensor-status__dot--on'
        else if (data.status === 'OK' && !isOn) dotClass += 'sensor-status__dot--off'
        else dotClass += 'sensor-status__dot--warn'

        var statusLabel = 'SENSORS '
        if (data.status === 'MISSING') statusLabel += 'NOT FOUND'
        else if (data.status === 'DESTROYED') statusLabel += 'DESTROYED'
        else if (data.status === 'NO POWER') statusLabel += 'NO POWER'
        else if (data.status === 'VACUUM SEAL BROKEN') statusLabel += 'SEAL BREACH'
        else if (isOn) statusLabel += 'ONLINE'
        else statusLabel += 'OFFLINE'

        return h('div', { className: 'sensor-status' },
            h('div', { className: dotClass }),
            h('div', { className: 'sensor-status__label' }, statusLabel),
            data.status !== 'MISSING' ? h('div', { className: 'sensor-status__detail' }, 'RNG ' + data.range) : null,
            allowChange && data.status !== 'MISSING' ? h('div', {
                className: 'sensor-btn' + (isOn ? ' sensor-btn--active' : ''),
                onClick: function () { act('toggle') }
            }, isOn ? 'ON' : 'OFF') : null
        )
    }

    function ControlsPanel(props) {
        var data = props.data
        var act = props.act
        var allowChange = data.allow_change !== false

        return h('div', { className: 'sensor-panel' },
            h('div', { className: 'sensor-panel__title' }, 'Controls'),
            allowChange ? h('div', { className: 'sensor-row' },
                h('div', { className: 'sensor-row__label' }, 'Range'),
                h('div', { className: 'sensor-row__value' },
                    h('div', {
                        className: 'sensor-btn' + (!data.on ? ' sensor-btn--disabled' : ''),
                        onClick: function () { if (data.on) act('range') }
                    }, String(data.range))
                )
            ) : null,
            h('div', { className: 'sensor-row' },
                h('div', { className: 'sensor-row__label' }, 'Map View'),
                h('div', { className: 'sensor-row__value' },
                    h('div', {
                        className: 'sensor-btn' + (data.viewing ? ' sensor-btn--active' : ''),
                        onClick: function () { act('viewing') }
                    }, data.viewing ? 'Engaged' : 'Disengaged')
                )
            ),
            h('div', { className: 'sensor-row' },
                h('div', { className: 'sensor-row__label' }, 'Audio'),
                h('div', { className: 'sensor-row__value' },
                    h('div', {
                        className: 'sensor-btn' + (!data.muted ? ' sensor-btn--active' : ''),
                        onClick: function () { act('mute') }
                    }, data.muted ? 'Muted' : 'Active'),
                    h('div', {
                        className: 'sensor-btn' + (data.sound_off ? ' sensor-btn--active' : ''),
                        onClick: function () { act('sound_off') }
                    }, 'SFX ' + (data.sound_off ? 'OFF' : 'ON'))
                )
            )
        )
    }

    function HeatPanel(props) {
        var data = props.data
        var heat = data.heat || 0
        var critHeat = data.critical_heat || 100
        var ratio = critHeat > 0 ? heat / critHeat : 0
        var pct = Math.min(100, Math.round(ratio * 100))
        var fillClass = 'sensor-bar__fill '

        if (ratio < 0.5) fillClass += 'sensor-bar__fill--good'
        else if (ratio < 0.75) fillClass += 'sensor-bar__fill--average'
        else fillClass += 'sensor-bar__fill--bad'

        var warnText = ''
        if (ratio >= 0.75) warnText = 'CRITICAL - REDUCE POWER'
        else if (ratio >= 0.5) warnText = 'CAUTION - HIGH TEMP'

        var hp = data.health || 0
        var maxHp = data.max_health || 100
        var hpPct = maxHp > 0 ? Math.round(hp / maxHp * 100) : 0
        var hpFill = hpPct > 60 ? 'sensor-bar__fill--good' : (hpPct > 30 ? 'sensor-bar__fill--average' : 'sensor-bar__fill--bad')

        return h('div', { className: 'sensor-panel' },
            h('div', { className: 'sensor-panel__title' }, 'Diagnostics'),
            h('div', { className: 'sensor-row' },
                h('div', { className: 'sensor-row__label' }, 'Temp'),
                h('div', { className: 'sensor-row__value' },
                    h('div', { className: 'sensor-bar' },
                        h('div', { className: fillClass, style: { width: pct + '%' } }),
                        h('div', { className: 'sensor-bar__text' }, pct + '%')
                    )
                )
            ),
            warnText ? h('div', {
                className: 'sensor-warn' + (ratio >= 0.75 ? ' sensor-warn--critical' : '')
            }, warnText) : null,
            h('div', { className: 'sensor-row' },
                h('div', { className: 'sensor-row__label' }, 'Hull'),
                h('div', { className: 'sensor-row__value' },
                    h('div', { className: 'sensor-bar' },
                        h('div', { className: 'sensor-bar__fill ' + hpFill, style: { width: hpPct + '%' } }),
                        h('div', { className: 'sensor-bar__text' }, hpPct + '%')
                    )
                )
            )
        )
    }

    function ContactRow(props) {
        var contact = props.contact
        var act = props.act
        var deg = bearingToDeg(contact.bearing)

        return h('div', { className: 'sensor-contact' },
            h('div', {
                className: 'sensor-contact__dot',
                style: { color: contact.color, background: contact.color }
            }),
            h('div', { className: 'sensor-contact__name', style: { color: contact.color } }, contact.name),
            h('div', { className: 'sensor-contact__compass' },
                h('div', {
                    className: 'sensor-contact__needle',
                    style: { transform: 'rotate(' + deg + 'deg)' }
                })
            ),
            h('div', { className: 'sensor-contact__bearing' }, contact.bearing + ' deg'),
            h('div', {
                className: 'sensor-btn',
                onClick: function () { act('scan', { scan: contact.ref }) }
            }, 'Scan')
        )
    }

    function TraceRow(props) {
        var contact = props.contact
        var pct = Math.min(100, Math.round(contact.progress || 0))

        return h('div', { className: 'sensor-trace' },
            h('div', { className: 'sensor-trace__header' },
                h('span', { className: 'sensor-trace__id' }, contact.name),
                h('span', { className: 'sensor-trace__bearing' }, 'BRG ' + contact.bearing + ' +/-' + contact.variability),
                h('span', { className: 'sensor-trace__pct' }, pct + '%')
            ),
            h('div', { className: 'sensor-bar' },
                h('div', {
                    className: 'sensor-bar__fill sensor-bar__fill--good',
                    style: { width: pct + '%' }
                })
            )
        )
    }

    function ContactsPanel(props) {
        var data = props.data
        var act = props.act
        var known = data.known_contacts || []
        var unknown = data.unknown_contacts || []
        var hasContacts = known.length > 0 || unknown.length > 0

        return h('div', { className: 'sensor-panel' },
            h('div', { className: 'sensor-panel__title' }, 'Contacts'),
            hasContacts
                ? h(Fragment, null,
                    known.map(function (contact, index) {
                        return h(ContactRow, { key: 'k' + index, contact: contact, act: act })
                    }),
                    unknown.length > 0 ? h('div', { className: 'sensor-subtitle' }, '- Tracing -') : null,
                    unknown.map(function (contact, index) {
                        return h(TraceRow, { key: 'u' + index, contact: contact })
                    })
                )
                : h('div', { className: 'sensor-empty' }, 'No contacts detected')
        )
    }

    function ScanDataPanel(props) {
        var data = props.data
        var act = props.act
        var lastScan = data.last_scan

        return h('div', { className: 'sensor-panel' },
            h('div', { className: 'sensor-panel__title' }, 'Scan Data'),
            lastScan
                ? h('div', { className: 'sensor-scan' },
                    h('div', { className: 'sensor-scan__header' },
                        h('span', { className: 'sensor-scan__name' }, lastScan.name),
                        h('span', { className: 'sensor-scan__loc' }, '@ ' + lastScan.location),
                        h('div', {
                            className: 'sensor-btn',
                            onClick: function () { act('print') },
                            style: { marginLeft: 'auto' }
                        }, 'Print')
                    ),
                    h('div', { className: 'sensor-scan__body' },
                        (lastScan.data || []).map(function (item, index) {
                            return h(Fragment, { key: index },
                                index > 0 ? h('div', { className: 'sensor-scan__divider' }) : null,
                                h('div', { dangerouslySetInnerHTML: { __html: item } })
                            )
                        })
                    )
                )
                : h('div', { className: 'sensor-empty' }, 'No scan data available')
        )
    }

    function MissingPanel(props) {
        return h('div', { className: 'sensor-panel sensor-missing' },
            h('div', { className: 'sensor-missing__text' }, 'Sensor suite not linked'),
            h('div', {
                className: 'sensor-btn',
                onClick: function () { props.act('link') }
            }, 'Establish Link')
        )
    }

    function ShipSensors() {
        var backend = useBackend()
        var data = backend.data || {}
        var act = backend.act

        useEffect(function () { injectStyles() }, [])

        return h('div', { className: 'sensor-shell' },
            h(StatusHeader, { data: data, act: act }),
            data.status === 'MISSING'
                ? h(MissingPanel, { act: act })
                : h(Fragment, null,
                    h(ControlsPanel, { data: data, act: act }),
                    !data.viewing_silicon ? h(HeatPanel, { data: data }) : null,
                    h(ContactsPanel, { data: data, act: act }),
                    h(ScanDataPanel, { data: data, act: act })
                )
        )
    }

    SUI.registerInterface('ShipSensors', ShipSensors)
})()
