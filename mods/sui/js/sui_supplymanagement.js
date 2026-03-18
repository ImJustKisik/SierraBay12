;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var NTOS = SUI.NTOS
	var THEME = NTOS.theme
	var SectionBlock = NTOS.SectionBlock
	var Button = NTOS.Button
	var IconButton = NTOS.IconButton
	var KeyValueRow = NTOS.KeyValueRow
	var StatusBadge = NTOS.StatusBadge
	var EmptyState = NTOS.EmptyState
	var ErrorState = NTOS.ErrorState

	function ensureSupplyStyles() {
		NTOS.ensureStyles()
		if (typeof document === "undefined" || document.getElementById("sui-supply-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-supply-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiSupplyRow{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiSupplyRow:hover{background:" + THEME.rowHover + ";}" +
			".suiSupplyTitle{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;}" +
			".suiSupplyWrap{word-break:break-word;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function formatMoney(value, currencyShort) {
		return String(value || "0") + " " + String(currencyShort || "CR")
	}

	function NavTabs(props) {
		var items = props.items || []
		var current = Number(props.current) || 1
		var act = props.act

		return h("div", {
			style: {
				display: "flex",
				gap: "6px",
				flexWrap: "wrap"
			}
		}, items.map(function (item) {
			return h(Button, {
				key: item.id,
				ghost: true,
				ghostFill: current === item.id,
				onClick: function () { act("set_screen", { screen: String(item.id) }) }
			}, item.label)
		}))
	}

	function SummaryStrip(props) {
		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
				gap: "8px"
			}
		},
			h("div", {
				style: {
					border: "1px solid " + THEME.panelBorder,
					padding: "8px 10px",
					background: THEME.cardBackground
				}
			},
				h("div", { style: { color: THEME.subtle, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Cargo Balance"),
				h("div", { style: { marginTop: "3px", color: THEME.text, fontSize: "14px", fontWeight: "700" } }, formatMoney(props.credits, props.currencyShort))
			),
			h("div", {
				style: {
					border: "1px solid " + THEME.panelBorder,
					padding: "8px 10px",
					background: THEME.cardBackground
				}
			},
				h("div", { style: { color: THEME.subtle, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Pending Requests"),
				h("div", { style: { marginTop: "3px", color: THEME.text, fontSize: "14px", fontWeight: "700" } }, String(props.requestCount || 0))
			),
			h("div", {
				style: {
					border: "1px solid " + THEME.panelBorder,
					padding: "8px 10px",
					background: THEME.cardBackground
				}
			},
				h("div", { style: { color: THEME.subtle, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Approved Orders"),
				h("div", { style: { marginTop: "3px", color: THEME.text, fontSize: "14px", fontWeight: "700" } }, String(props.cartCount || 0))
			)
		)
	}

	function PurchaseRow(props) {
		var item = props.item
		var act = props.act
		var currentRef = props.currentRef
		var isSelected = currentRef && currentRef === item.ref

		return h("div", {
			class: "suiSupplyRow",
			style: {
				display: "grid",
				gridTemplateColumns: "minmax(0, 1fr) 110px 120px",
				gap: "8px",
				alignItems: "center",
				padding: "8px 10px",
				borderTop: props.first ? "none" : "1px solid " + THEME.rowBorder,
				background: isSelected ? THEME.rowHover : THEME.cardBackground
			}
		},
			h("div", { style: { minWidth: "0" } },
				h("div", { class: "suiSupplyTitle", style: { color: THEME.text, fontSize: "13px", fontWeight: "700", lineHeight: "15px" } }, item.name),
				h("div", { style: { marginTop: "2px", color: THEME.subtle, fontSize: "11px" } }, "Supply package")
			),
			h("div", { style: { color: THEME.muted, fontSize: "12px", fontWeight: "600" } }, formatMoney(item.cost, props.currencyShort)),
			h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "6px" } },
				h(IconButton, {
					icon: "search",
					title: "Contents",
					onClick: function () { act(isSelected ? "hide_contents" : "show_contents", { ref: item.ref }) }
				}),
				h(Button, {
					icon: "cart",
					onClick: function () { act("order", { ref: item.ref }) }
				}, "Order")
			)
		)
	}

	function OrderList(props) {
		var orders = props.orders || []
		var act = props.act
		var actions = props.actions || []

		return h(SectionBlock, { title: props.title },
			orders.length ? h("div", null,
				orders.map(function (order, index) {
					return h("div", {
						key: props.title + "_" + order.id,
						class: "suiSupplyRow",
						style: {
							padding: "9px 10px",
							borderTop: index ? "1px solid " + THEME.rowBorder : "none",
							background: THEME.cardBackground
						}
					},
						h("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								gap: "10px",
								alignItems: "flex-start"
							}
						},
							h("div", { style: { minWidth: "0", flex: "1 1 auto" } },
								h("div", { class: "suiSupplyTitle", style: { color: THEME.text, fontSize: "13px", fontWeight: "700" } }, order.object),
								h("div", { style: { marginTop: "2px", color: THEME.muted, fontSize: "11px" } }, "#" + order.id + " • " + order.time + " • " + order.orderer),
								h("div", { class: "suiSupplyWrap", style: { marginTop: "5px", color: THEME.subtle, fontSize: "11px", lineHeight: "14px" } }, order.reason || "No reason provided.")
							),
							h("div", { style: { flex: "0 0 auto", color: THEME.text, fontSize: "12px", fontWeight: "700" } }, formatMoney(order.cost, props.currencyShort))
						),
						h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" } },
							actions.map(function (action) {
								return h(Button, {
									key: action.id,
									ghost: !action.primary,
									danger: !!action.danger,
									icon: action.icon,
									onClick: function () {
										act(action.id, { id: String(order.id), list_id: String(order.list_id) })
									}
								}, action.label)
							})
						)
					)
				})
			) : h(EmptyState, {
				title: "No orders in this queue",
				message: "This processing list is currently empty.",
				compact: true
			})
		)
	}

	function CatalogView(props) {
		var data = props.data
		var act = props.act
		var categories = data.categories || []
		var purchases = data.possible_purchases || []
		var contents = data.contents_of_order || []

		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "240px minmax(0, 1fr) 280px",
				gap: "8px",
				alignItems: "start"
			}
		},
			h(SectionBlock, { title: "Categories" },
				h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
					categories.map(function (category) {
						return h(Button, {
							key: category,
							ghost: true,
							ghostFill: data.category === category,
							fullWidth: true,
							onClick: function () { act("select_category", { category: category }) }
						}, category)
					})
				)
			),
			h(SectionBlock, { title: data.category ? "Available Packs" : "Catalog" },
				data.category
					? purchases.length
						? h("div", null, purchases.map(function (item, index) {
							return h(PurchaseRow, {
								key: item.ref,
								item: item,
								act: act,
								first: index === 0,
								currentRef: data.showing_contents_of,
								currencyShort: data.currency_short
							})
						}))
						: h(EmptyState, {
							title: "No supply packs available",
							message: "The selected category does not currently expose any orderable supply packages.",
							compact: true
						})
					: h(EmptyState, {
						title: "No category selected",
						message: "Select a supply category to browse available cargo packs.",
						compact: true
					})
			),
			h(SectionBlock, { title: "Package Manifest" },
				data.showing_contents_of
					? contents.length
						? h("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "6px"
							}
						}, contents.map(function (entry, index) {
							return h(KeyValueRow, {
								key: entry.name + "_" + index,
								label: "Item",
								first: index === 0
							}, entry.name + " x" + entry.amount)
						}))
						: h(EmptyState, {
							title: "Manifest unavailable",
							message: "This package does not provide a readable manifest in the current database entry.",
							compact: true
						})
					: h(EmptyState, {
						title: "No package selected",
						message: "Use the inspect action to view crate contents before ordering.",
						compact: true
					})
			)
		)
	}

	function FinanceView(props) {
		var data = props.data
		var act = props.act
		var breakdown = data.point_breakdown || []

		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "minmax(0, 1fr) 240px",
				gap: "8px",
				alignItems: "start"
			}
		},
			h(SectionBlock, { title: "Point Breakdown" },
				breakdown.length ? h("div", null,
					breakdown.map(function (entry, index) {
						return h(KeyValueRow, { key: entry.desc + "_" + index, label: "Source", first: index === 0 }, entry.desc + " • " + formatMoney(entry.points, data.currency_short))
					})
				) : h(EmptyState, {
					title: "No point history available",
					message: "No supply accounting events are currently recorded for this session.",
					compact: true
				})
			),
			h(SectionBlock, { title: "Actions" },
				h(KeyValueRow, { label: "Printer", first: true }, data.can_print ? "Connected" : "Not installed"),
				h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" } },
					h(Button, {
						icon: "print",
						disabled: !data.can_print,
						onClick: function () { act("print_summary") }
					}, "Print Summary")
				)
			)
		)
	}

	function ShuttleView(props) {
		var data = props.data
		var act = props.act

		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "minmax(0, 1fr) 260px",
				gap: "8px",
				alignItems: "start"
			}
		},
			h(SectionBlock, { title: "Shuttle Status" },
				h(KeyValueRow, { label: "Shuttle", first: true }, data.shuttle_name || "Supply Shuttle"),
				h(KeyValueRow, { label: "Location" }, data.shuttle_location || "No Connection"),
				h(KeyValueRow, { label: "Status" }, data.shuttle_status || "Unknown")
			),
			h(SectionBlock, { title: "Control" },
				h("div", { style: { marginBottom: "8px" } },
					h(StatusBadge, {
						active: !!data.shuttle_can_control,
						activeLabel: "Control Ready",
						inactiveLabel: "Control Locked"
					})
				),
				h(Button, {
					icon: "cart",
					disabled: !data.shuttle_can_control,
					onClick: function () { act("launch_shuttle") }
				}, "Launch Shuttle")
			)
		)
	}

	function OrdersView(props) {
		var data = props.data
		var act = props.act

		if (!data.is_admin) {
			return h(ErrorState, {
				title: "Cargo access required",
				message: "Order processing controls are restricted to authorized cargo personnel.",
				compact: true
			})
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px"
			}
		},
			h(SectionBlock, { title: "Order Controls" },
				h(KeyValueRow, { label: "Notifications", first: true }, data.notifications_enabled ? "Enabled" : "Disabled"),
				h(KeyValueRow, { label: "Printer" }, data.can_print ? "Connected" : "Not installed"),
				h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" } },
					h(Button, {
						ghost: true,
						ghostFill: true,
						icon: "alert",
						onClick: function () { act("toggle_notifications") }
					}, data.notifications_enabled ? "Disable Alerts" : "Enable Alerts")
				)
			),
			h(OrderList, {
				title: "Pending Requests",
				orders: data.requests || [],
				act: act,
				currencyShort: data.currency_short,
				actions: [
					{ id: "approve_order", label: "Approve", icon: "check", primary: true },
					{ id: "deny_order", label: "Deny", icon: "close", danger: true }
				]
			}),
			h(OrderList, {
				title: "Approved Cart",
				orders: data.cart || [],
				act: act,
				currencyShort: data.currency_short,
				actions: [
					{ id: "order_back_to_pending", label: "Return", icon: "arrowreturnthick-1-w" },
					{ id: "cancel_order", label: "Cancel", icon: "close", danger: true },
					{ id: "print_receipt", label: "Receipt", icon: "print" }
				]
			}),
			h(OrderList, {
				title: "Completed Orders",
				orders: data.done || [],
				act: act,
				currencyShort: data.currency_short,
				actions: [
					{ id: "print_receipt", label: "Receipt", icon: "print" },
					{ id: "delete_order", label: "Delete", icon: "trash", danger: true }
				]
			})
		)
	}

	function SupplyManagement() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var screen = Number(data.screen) || 1

		ensureSupplyStyles()

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				minHeight: "100%",
				background: THEME.pageBackground,
				fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
			}
		},
			h(SectionBlock, { title: "Operations" },
				h(NavTabs, {
					current: screen,
					act: act,
					items: [
						{ id: 1, label: "Catalog" },
						{ id: 2, label: "Finance" },
						{ id: 3, label: "Shuttle" },
						{ id: 4, label: "Orders" }
					]
				}),
				h("div", { style: { marginTop: "10px" } },
					h(SummaryStrip, {
						credits: data.credits,
						currencyShort: data.currency_short,
						requestCount: data.request_length,
						cartCount: data.shopping_cart_length
					})
				),
				data.card_inserted ? h("div", {
					style: {
						marginTop: "10px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "10px",
						padding: "8px 10px",
						border: "1px solid " + THEME.panelBorder,
						background: THEME.cardBackground
					}
				},
					h("div", { style: { minWidth: "0" } },
						h("div", { style: { color: THEME.subtle, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Payment Card"),
						h("div", { style: { marginTop: "3px", color: THEME.text, fontSize: "12px", fontWeight: "700" } },
							data.card_use
								? "Card billing enabled" + (data.money ? " | " + formatMoney(data.money, data.currency_short) : "")
								: "Department account billing"
						)
					),
					h(Button, {
						ghost: true,
						ghostFill: true,
						icon: "note",
						onClick: function () { act("use_card") }
					}, data.card_use ? "Use Department Funds" : "Use Inserted Card")
				) : null
			),
			screen === 1 ? h(CatalogView, { data: data, act: act }) : null,
			screen === 2 ? h(FinanceView, { data: data, act: act }) : null,
			screen === 3 ? h(ShuttleView, { data: data, act: act }) : null,
			screen === 4 ? h(OrdersView, { data: data, act: act }) : null
		)
	}

	SUI.registerInterface("SupplyManagement", SupplyManagement)
})()
