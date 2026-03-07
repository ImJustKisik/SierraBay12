/**
 * SUI Vending Machine Interface
 * NanoUI color scheme, frameless with draggable WindowChrome
 */
; (function () {
    'use strict'

    var h = SUI.h
    var Fragment = SUI.Fragment
    var useBackend = SUI.useBackend
    var useEffect = SUI.useEffect

    // ============================================================
    // Styles
    // ============================================================
    var STYLES_INJECTED = false
    function injectStyles() {
        if (STYLES_INJECTED) return
        STYLES_INJECTED = true

        var css = [
            // Base
            'body { background: #272727 url(uiBackground.png) 50% 0 repeat-x !important; margin: 0; padding: 0; }',

            // Container
            '.vm-container { padding: 0; }',

            // Banner messages
            '.vm-notice {',
            '  padding: 8px 10px;',
            '  margin: 8px 10px;',
            '  border: 1px solid #40628a;',
            '  background: #202020;',
            '  color: #ffffff;',
            '  font-size: 12px;',
            '  font-style: italic;',
            '}',
            '.vm-notice--danger {',
            '  border-color: #ee0000;',
            '  background: #3a0808;',
            '  color: #ffcccc;',
            '}',

            // Section header
            '.vm-section {',
            '  margin: 8px 10px;',
            '  border: 1px solid rgb(117,117,117);',
            '  background: #202020;',
            '  padding: 8px 10px;',
            '}',
            '.vm-section__title {',
            '  font-size: 11px;',
            '  color: #e9c183;',
            '  text-transform: uppercase;',
            '  letter-spacing: 0.1em;',
            '  margin-bottom: 8px;',
            '  padding-bottom: 4px;',
            '  border-bottom: 1px solid rgba(64,98,138,0.3);',
            '}',

            // Product row
            '.vm-product {',
            '  display: flex;',
            '  align-items: center;',
            '  gap: 8px;',
            '  padding: 6px 8px;',
            '  margin-bottom: 4px;',
            '  border: 1px solid #161616;',
            '  background: #1a1a1a;',
            '  transition: background 0.15s;',
            '}',
            '.vm-product:hover { background: #252525; }',
            '.vm-product--oos {',
            '  opacity: 0.4;',
            '  pointer-events: none;',
            '}',

            // Product icon placeholder
            '.vm-product__icon {',
            '  width: 32px;',
            '  height: 32px;',
            '  flex-shrink: 0;',
            '  display: flex;',
            '  align-items: center;',
            '  justify-content: center;',
            '}',
            '.vm-product__icon img {',
            '  max-width: 32px;',
            '  max-height: 32px;',
            '  image-rendering: pixelated;',
            '}',

            // Product info
            '.vm-product__info { flex: 1; min-width: 0; overflow: hidden; }',
            '.vm-product__name {',
            '  font-size: 12px;',
            '  font-weight: bold;',
            '  color: #ffffff;',
            '  white-space: nowrap;',
            '  overflow: hidden;',
            '  text-overflow: ellipsis;',
            '}',
            '.vm-product__stock {',
            '  font-size: 10px;',
            '  color: #8BA5C4;',
            '  margin-top: 1px;',
            '}',

            // Buy button
            '.vm-buy {',
            '  flex-shrink: 0;',
            '  height: 24px;',
            '  padding: 0 10px;',
            '  border: 1px solid #161616;',
            '  font-size: 11px;',
            '  font-weight: bold;',
            '  color: #ffffff;',
            '  cursor: pointer;',
            '  text-transform: uppercase;',
            '  letter-spacing: 0.03em;',
            '  transition: background 0.15s, box-shadow 0.15s;',
            '}',
            '.vm-buy--free { background: #2f943c; }',
            '.vm-buy--free:hover { background: #3aaf4a; box-shadow: 0 0 6px rgba(47,148,60,0.3); }',
            '.vm-buy--paid { background: #40628a; }',
            '.vm-buy--paid:hover { background: #507aac; box-shadow: 0 0 6px rgba(64,98,138,0.3); }',
            '.vm-buy--disabled {',
            '  background: #999999 !important;',
            '  border-color: #666666 !important;',
            '  opacity: 0.5;',
            '  cursor: default;',
            '  pointer-events: none;',
            '}',

            // Status pill
            '.vm-pill {',
            '  display: inline-block;',
            '  height: 18px;',
            '  line-height: 18px;',
            '  padding: 0 8px;',
            '  font-size: 10px;',
            '  font-weight: bold;',
            '  text-transform: uppercase;',
            '  letter-spacing: 0.04em;',
            '  border: 1px solid;',
            '}',
            '.vm-pill--busy { background: rgba(205,101,0,0.2); border-color: #cd6500; color: #e9c183; }',
            '.vm-pill--coin { background: rgba(64,98,138,0.2); border-color: #40628a; color: #8BA5C4; }',
            '.vm-pill--panel { background: rgba(47,148,60,0.15); border-color: #2f943c; color: #88cc88; }',

            // Purchase panel
            '.vm-purchase {',
            '  margin: 8px 10px;',
            '  padding: 12px;',
            '  border: 1px solid #cd6500;',
            '  background: rgba(205,101,0,0.08);',
            '}',
            '.vm-purchase__label {',
            '  font-size: 10px;',
            '  color: #cd6500;',
            '  text-transform: uppercase;',
            '  letter-spacing: 0.1em;',
            '  margin-bottom: 6px;',
            '}',
            '.vm-purchase__name {',
            '  font-size: 16px;',
            '  font-weight: bold;',
            '  color: #ffffff;',
            '}',
            '.vm-purchase__price {',
            '  font-size: 12px;',
            '  color: #e9c183;',
            '  margin-top: 4px;',
            '}',
            '.vm-purchase__help {',
            '  font-size: 11px;',
            '  color: #8BA5C4;',
            '  margin-top: 8px;',
            '  line-height: 1.4;',
            '}',

            // Maintenance
            '.vm-maint {',
            '  margin: 8px 10px;',
            '  padding: 8px 10px;',
            '  border: 1px solid rgb(117,117,117);',
            '  background: #181818;',
            '}',
            '.vm-maint__coin {',
            '  font-size: 12px;',
            '  color: #8BA5C4;',
            '  margin-bottom: 6px;',
            '}',

            // Inline button (used in panels)
            '.vm-ibtn {',
            '  display: inline-block;',
            '  height: 22px;',
            '  line-height: 22px;',
            '  padding: 0 10px;',
            '  border: 1px solid #161616;',
            '  background: #40628a;',
            '  color: #ffffff;',
            '  font-size: 11px;',
            '  font-weight: bold;',
            '  cursor: pointer;',
            '  margin: 4px 4px 0 0;',
            '  text-transform: uppercase;',
            '  transition: background 0.15s;',
            '}',
            '.vm-ibtn:hover { background: #507aac; }',
            '.vm-ibtn--active { background: #2f943c !important; }',
            '.vm-ibtn--danger { background: #aa0000 !important; }',
            '.vm-ibtn--danger:hover { background: #cc2222 !important; }'
        ].join('\n')

        var style = document.createElement('style')
        style.textContent = css
        document.head.appendChild(style)
    }

    // ============================================================
    // Helpers
    // ============================================================
    function formatPrice(price, currency) {
        if (!price) return 'FREE'
        return price + ' ' + (currency || 'cr')
    }

    // ============================================================
    // Sub-components
    // ============================================================

    function ProductRow(props) {
        var product = props.product
        var disabled = !!props.disabled || (product.amount || 0) <= 0
        var isFree = !product.price || product.price <= 0

        var rowClass = 'vm-product' + (disabled ? ' vm-product--oos' : '')
        var btnClass = 'vm-buy' + (disabled ? ' vm-buy--disabled' : (isFree ? ' vm-buy--free' : ' vm-buy--paid'))

        return h('div', { className: rowClass },
            // Icon (if present)
            product.icon ? h('div', { className: 'vm-product__icon' },
                h('img', { src: product.icon })
            ) : null,
            // Info
            h('div', { className: 'vm-product__info' },
                h('div', {
                    className: 'vm-product__name',
                    style: product.color ? { color: product.color } : null
                }, product.name),
                h('div', { className: 'vm-product__stock' },
                    'Stock: ' + (product.amount || 0)
                )
            ),
            // Buy button
            h('div', {
                className: btnClass,
                onClick: function () {
                    if (!disabled) props.act('vend', { vend: product.key })
                }
            }, formatPrice(product.price, props.currency))
        )
    }

    function PurchasePanel(props) {
        return h('div', { className: 'vm-purchase' },
            h('div', { className: 'vm-purchase__label' }, 'Awaiting Payment'),
            h('div', { className: 'vm-purchase__name' }, props.product || 'Unknown'),
            h('div', { className: 'vm-purchase__price' },
                'Charge: ' + formatPrice(props.price, props.currency)
            ),
            h('div', { className: 'vm-purchase__help' },
                'Swipe an ID, use a chargecard, or insert cash to authorize.'
            ),
            h('div', { style: { marginTop: '10px' } },
                h('div', {
                    className: 'vm-ibtn',
                    onClick: function () { props.act('cancelpurchase') }
                }, 'Cancel')
            )
        )
    }

    function MaintenancePanel(props) {
        if (!props.panel && !props.coin) return null

        return h('div', { className: 'vm-maint' },
            h('div', { className: 'vm-section__title' }, 'Service'),
            props.coin ? h('div', { className: 'vm-maint__coin' },
                'Coin: ', h('b', null, props.coin)
            ) : null,
            props.panel ? h('div', null,
                h('div', {
                    className: 'vm-ibtn' + (props.speaker ? ' vm-ibtn--active' : ''),
                    onClick: function () { props.act('togglevoice') }
                }, props.speaker ? 'Voice On' : 'Voice Off')
            ) : null,
            props.coin ? h('div', null,
                h('div', {
                    className: 'vm-ibtn vm-ibtn--danger',
                    onClick: function () { props.act('remove_coin') }
                }, 'Eject Coin')
            ) : null
        )
    }

    // ============================================================
    // Main Interface
    // ============================================================
    function VendingMachine() {
        var backend = useBackend()
        var data = backend.data || {}
        var config = backend.config || {}
        var act = backend.act
        var products = data.products || []

        useEffect(function () { injectStyles() }, [])

        var subtitle = data.mode
            ? 'Payment pending'
            : (products.length + ' items available')

        // Chrome badges
        var badges = []
        if (data.busy) {
            badges.push(h('div', { key: 'busy', className: 'vm-pill vm-pill--busy' }, 'Vending'))
        }
        if (data.coin) {
            badges.push(h('div', { key: 'coin', className: 'vm-pill vm-pill--coin' }, 'Coin'))
        }
        if (data.panel) {
            badges.push(h('div', { key: 'panel', className: 'vm-pill vm-pill--panel' }, 'Panel'))
        }

        return h('div', { className: 'vm-container' },
            // Draggable titlebar
            h(SUI.WindowChrome, {
                title: config.title || 'Vendomat',
                subtitle: subtitle,
                badgeText: 'V',
                accent: '#40628a'
            }, badges),

            // Status message
            data.message ? h('div', {
                className: 'vm-notice' + (data.message_err ? ' vm-notice--danger' : '')
            }, data.message) : null,

            // Purchase panel
            data.mode ? h(PurchasePanel, {
                product: data.product,
                price: data.price,
                currency: config.currency,
                act: act
            }) : null,

            // Product list
            h('div', { className: 'vm-section' },
                h('div', { className: 'vm-section__title' },
                    data.mode ? 'Inventory' : 'Products'
                ),
                products.length > 0
                    ? products.map(function (product, i) {
                        return h(ProductRow, {
                            key: i,
                            product: product,
                            currency: config.currency,
                            disabled: data.busy || data.mode,
                            act: act
                        })
                    })
                    : h('div', {
                        style: {
                            textAlign: 'center',
                            padding: '16px',
                            color: '#8BA5C4',
                            fontStyle: 'italic'
                        }
                    }, 'No products available.')
            ),

            // Maintenance
            h(MaintenancePanel, {
                panel: data.panel,
                speaker: data.speaker,
                coin: data.coin,
                act: act
            })
        )
    }

    SUI.registerInterface('VendingMachine', VendingMachine)
})()
