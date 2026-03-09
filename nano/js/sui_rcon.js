;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function SmesCard(props) {
		var smes = props.smes
		var act = props.act

		return h("div", {
			style: {
				padding: "8px 10px",
				marginBottom: "8px",
				border: "1px solid rgba(64,98,138,0.25)",
				background: "rgba(0,0,0,0.18)"
			}
		},
			h(SUI.Stack, { gap: "8px", justify: "space-between", wrap: true },
				h("div", null,
					h("div", { style: { fontWeight: "bold", color: "#e9c183" } }, smes.RCON_tag),
					h("div", { style: { fontSize: "11px", color: "#aaaaaa" } }, "Input load " + smes.input_load + " kW, output load " + smes.output_load + " kW")
				),
				h(SUI.ProgressBar, {
					value: Number(smes.charge) || 0,
					min: 0,
					max: 100,
					color: smes.charge >= 65 ? "good" : (smes.charge >= 30 ? "average" : "bad"),
					showText: String(smes.charge) + "%"
				})
			),
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Input" }, smes.input_set ? "Enabled" : "Disabled"),
				h(SUI.LabeledList.Item, { label: "Output" }, smes.output_set ? "Enabled" : "Disabled")
			),
			h(SUI.Stack, { gap: "8px", wrap: true },
				h(SUI.Button, {
					icon: "refresh",
					onClick: function () { act("smes_input_toggle", { tag: smes.RCON_tag }) }
				}, smes.input_set ? "Disable Input" : "Enable Input"),
				h(SUI.NumberInput, {
					value: Number(smes.input_val) || 0,
					minValue: 0,
					maxValue: Number(smes.input_max) || 0,
					step: 10,
					unit: "kW",
					width: "120px",
					onChange: function (value) { act("smes_input_set", { tag: smes.RCON_tag, value: value }) }
				}),
				h(SUI.Button, {
					icon: "refresh",
					onClick: function () { act("smes_output_toggle", { tag: smes.RCON_tag }) }
				}, smes.output_set ? "Disable Output" : "Enable Output"),
				h(SUI.NumberInput, {
					value: Number(smes.output_val) || 0,
					minValue: 0,
					maxValue: Number(smes.output_max) || 0,
					step: 10,
					unit: "kW",
					width: "120px",
					onChange: function (value) { act("smes_output_set", { tag: smes.RCON_tag, value: value }) }
				})
			)
		)
	}

	function BreakerTable(props) {
		var breakers = props.breakers || []
		var act = props.act

		return h(SUI.Section, { title: "Breakers", fill: true, scrollable: true },
			breakers.length
				? h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Tag"),
						h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "State"),
						h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "Control")
					),
					breakers.map(function (breaker) {
						return h(SUI.Table.Row, { key: breaker.RCON_tag },
							h(SUI.Table.Cell, null, breaker.RCON_tag),
							h(SUI.Table.Cell, null, breaker.enabled ? "Enabled" : "Disabled"),
							h(SUI.Table.Cell, { style: { textAlign: "right" } },
								h(SUI.Button, {
									icon: "power",
									onClick: function () { act("toggle_breaker", { tag: breaker.RCON_tag }) }
								}, "Toggle")
							)
						)
					})
				)
				: h(SUI.NoticeBox, null, "No breaker boxes available through RCON.")
		)
	}

	function Rcon() {
		var backend = useBackend()
		var data = backend.data || {}
		var tabHook = SUI.useState("smes")
		var tab = tabHook[0]
		var setTab = tabHook[1]
		var smes = data.smes_info || []
		var breakers = data.breaker_info || []

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "RCON Summary" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "SMES Units" }, String(smes.length)),
					h(SUI.LabeledList.Item, { label: "Breakers" }, String(breakers.length))
				),
				h(SUI.Tabs, null,
					h(SUI.Tabs.Tab, { selected: tab === "smes", onClick: function () { setTab("smes") } }, "SMES"),
					h(SUI.Tabs.Tab, { selected: tab === "breakers", onClick: function () { setTab("breakers") } }, "Breakers")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				tab === "breakers"
					? h(BreakerTable, { breakers: breakers, act: backend.act })
					: h(SUI.Section, { title: "SMES Units", fill: true, scrollable: true },
						smes.length
							? smes.map(function (entry) {
								return h(SmesCard, { key: entry.RCON_tag, smes: entry, act: backend.act })
							})
							: h(SUI.NoticeBox, null, "No SMES units available through RCON.")
					)
			)
		)
	}

	SUI.registerInterface("Rcon", Rcon)
})()
