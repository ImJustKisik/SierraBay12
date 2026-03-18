;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function Tabs(data, act) {
		return h(SUI.Stack, { gap: "6px", wrap: true },
			h(SUI.Button, { selected: data.screen === 1, onClick: function () { act("set_screen", { set_screen: "1" }) } }, "Browse Goods"),
			h(SUI.Button, { selected: data.screen === 2, onClick: function () { act("set_screen", { set_screen: "2" }) } }, "Statistics"),
			h(SUI.Button, { selected: data.screen === 3, onClick: function () { act("set_screen", { set_screen: "3" }) } }, "Controls"),
			h(SUI.Button, { selected: data.screen === 4, onClick: function () { act("set_screen", { set_screen: "4" }) } }, "Orders")
		)
	}

	function OrdersTable(props) {
		var title = props.title
		var orders = props.orders || []
		var data = props.data
		var act = props.act
		var actions = props.actions
		return h(SUI.Section, { title: title, scrollable: true },
			orders.length ? h(SUI.Table, { style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { width: "50px", fontWeight: "bold" } }, "ID"),
					h(SUI.Table.Cell, { style: { width: "100px", fontWeight: "bold" } }, "Time"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Item"),
					h(SUI.Table.Cell, { style: { width: "130px", fontWeight: "bold" } }, "Requested By"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Reason"),
					h(SUI.Table.Cell, { style: { width: "90px", fontWeight: "bold" } }, "Cost"),
					h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "Paid By"),
					h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold", textAlign: "right" } }, "Actions")
				),
				orders.map(function (order) {
					return h(SUI.Table.Row, { key: title + "_" + order.id },
						h(SUI.Table.Cell, null, String(order.id)),
						h(SUI.Table.Cell, null, order.time),
						h(SUI.Table.Cell, null, order.object),
						h(SUI.Table.Cell, null, order.orderer),
						h(SUI.Table.Cell, null, order.reason || "No reason provided."),
						h(SUI.Table.Cell, null, String(order.cost) + " " + (data.currency_short || "")),
						h(SUI.Table.Cell, null, order.payer || ""),
						h(SUI.Table.Cell, { style: { textAlign: "right" } },
							h(SUI.Stack, { gap: "4px", wrap: true, style: { justifyContent: "flex-end" } },
								actions(order, data, act)
							)
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No orders.")
		)
	}

	function BrowseGoodsView(props) {
		var data = props.data
		var act = props.act
		var purchases = data.possible_purchases || []
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Categories" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					(data.categories || []).map(function (category) {
						return h(SUI.Button, {
							key: category,
							selected: data.category === category,
							onClick: function () { act("select_category", { select_category: category }) }
						}, category)
					})
				)
			),
			data.card_inserted ? h(SUI.Section, { title: "Payment" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Card Balance" }, String(data.money || 0) + " " + (data.currency || "")),
					h(SUI.LabeledList.Item, { label: "Card Payment" },
						h(SUI.Button, { selected: !!data.card_use, onClick: function () { act("use_card") } }, data.card_use ? "Enabled" : "Disabled")
					)
				)
			) : null,
			data.category ? h(SUI.Section, { title: data.category, fill: true, scrollable: true },
				purchases.length ? h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Item"),
						h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "Cost"),
						h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold", textAlign: "right" } }, "Options")
					),
					purchases.map(function (item) {
						var open = data.showing_contents_of === item.ref
						return h(SUI.Table.Row, { key: item.ref },
							h(SUI.Table.Cell, null,
								item.name,
								open && data.contents_of_order ? h("div", { style: { marginTop: "6px" } },
									(data.contents_of_order || []).map(function (content, index) {
										return h("div", { key: item.ref + "_" + String(index), style: { color: "#bbbbbb" } }, content.name + " x " + String(content.amount))
									})
								) : null
							),
							h(SUI.Table.Cell, null, String(item.cost) + " " + (data.currency || "")),
							h(SUI.Table.Cell, { style: { textAlign: "right" } },
								h(SUI.Stack, { gap: "4px", wrap: true, style: { justifyContent: "flex-end" } },
									h(SUI.Button, { onClick: function () { act("order", { order: item.ref }) } }, "Order"),
									open
										? h(SUI.Button, { onClick: function () { act("hide_contents") } }, "Close")
										: h(SUI.Button, { onClick: function () { act("show_contents", { show_contents: item.ref }) } }, "Contents")
								)
							)
						)
					})
				) : h(SUI.NoticeBox, null, "No purchasable packs in this category.")
			) : h(SUI.NoticeBox, null, "Select a category to browse goods.")
		)
	}

	function StatisticsView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Section, { title: "Statistics", fill: true, scrollable: true },
			(data.point_breakdown || []).map(function (entry, index) {
				return h(SUI.LabeledList, { key: String(index) },
					h(SUI.LabeledList.Item, { label: entry.desc }, String(entry.points) + " " + (data.currency_short || ""))
				)
			}),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { disabled: !data.can_print, onClick: function () { act("print_summary") } }, "Print Summary")
			)
		)
	}

	function ShuttleView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Section, { title: "Shuttle Control" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Shuttle" }, data.shuttle_name || "Unknown"),
				h(SUI.LabeledList.Item, { label: "Location" }, data.shuttle_location || "Unknown"),
				h(SUI.LabeledList.Item, { label: "Status" }, data.shuttle_status || "Unknown")
			),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, {
					disabled: !data.is_admin || !data.shuttle_can_control,
					onClick: function () { act("launch_shuttle") }
				}, "Launch")
			)
		)
	}

	function OrdersView(props) {
		var data = props.data
		var act = props.act
		if (!data.is_admin) {
			return h(SUI.NoticeBox, { danger: true }, "Access denied: Missing identification or insufficient permissions.")
		}
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			data.is_NTOS ? h(SUI.Section, { title: "Notifications" },
				h(SUI.Button, { selected: !!data.notifications_enabled, onClick: function () { act("toggle_notifications") } }, data.notifications_enabled ? "Enabled" : "Disabled")
			) : null,
			h(OrdersTable, {
				title: "Pending Orders",
				orders: data.requests,
				data: data,
				act: act,
				actions: function (order, state, backendAct) {
					return [
						h(SUI.Button, { key: "approve", disabled: Number(order.cost) > Number(state.credits || 0), onClick: function () { backendAct("approve_order", { approve_order: String(order.id) }) } }, "Approve"),
						h(SUI.Button, { key: "deny", onClick: function () { backendAct("deny_order", { deny_order: String(order.id) }) } }, "Deny"),
						h(SUI.Button, { key: "print", disabled: !state.can_print, onClick: function () { backendAct("print_receipt", { print_receipt: String(order.id), list_id: String(order.list_id) }) } }, "Print")
					]
				}
			}),
			h(OrdersTable, {
				title: "Approved Orders",
				orders: data.cart,
				data: data,
				act: act,
				actions: function (order, state, backendAct) {
					return [
						h(SUI.Button, { key: "cancel", onClick: function () { backendAct("cancel_order", { cancel_order: String(order.id) }) } }, "Cancel"),
						h(SUI.Button, { key: "pending", onClick: function () { backendAct("order_back_to_pending", { order_back_to_pending: String(order.id) }) } }, "Pending"),
						h(SUI.Button, { key: "print", disabled: !state.can_print, onClick: function () { backendAct("print_receipt", { print_receipt: String(order.id), list_id: String(order.list_id) }) } }, "Print")
					]
				}
			}),
			h(OrdersTable, {
				title: "Filled Orders",
				orders: data.done,
				data: data,
				act: act,
				actions: function (order, state, backendAct) {
					return [
						h(SUI.Button, { key: "delete", onClick: function () { backendAct("delete_order", { delete_order: String(order.id) }) } }, "Delete"),
						h(SUI.Button, { key: "print", disabled: !state.can_print, onClick: function () { backendAct("print_receipt", { print_receipt: String(order.id), list_id: String(order.list_id) }) } }, "Print")
					]
				}
			})
		)
	}

	function Supply() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var body = null
		if (data.screen === 2) body = h(StatisticsView, { data: data, act: act })
		else if (data.screen === 3) body = h(ShuttleView, { data: data, act: act })
		else if (data.screen === 4) body = h(OrdersView, { data: data, act: act })
		else body = h(BrowseGoodsView, { data: data, act: act })

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.NoticeBox, null, data.is_admin ? "You are authenticated. You may access all functions of this program." : "You are unauthenticated. Some functions may be unavailable."),
			h(SUI.Section, { title: "Navigation" }, Tabs(data, act)),
			h(SUI.Section, { title: "Balance" },
				"Current balance: " + String(data.credits || 0) + " " + String(data.currency || "")
			),
			h(SUI.Stack.Item, { grow: true }, body)
		)
	}

	SUI.registerInterface("Supply", Supply)
})()
