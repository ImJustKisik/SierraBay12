;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function EngineRow(props) {
		var engine = props.engine
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
					h("div", { style: { fontWeight: "bold", color: "#e9c183" } }, engine.eng_type),
					h("div", { style: { fontSize: "11px", color: "#aaaaaa" } }, engine.eng_status)
				),
				h(SUI.Button, {
					icon: "power",
					selected: !!engine.eng_on,
					onClick: function () { act("engine_toggle", { engine: engine.eng_reference }) }
				}, engine.eng_on ? "Shutdown" : "Power Up")
			),
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Current thrust" }, String(engine.eng_thrust || 0)),
				h(SUI.LabeledList.Item, { label: "Thrust limit" }, String(engine.eng_thrust_limiter || 0) + "%")
			),
			h(SUI.Stack, { gap: "6px", wrap: true },
				h(SUI.Button, {
					icon: "circle-plus",
					onClick: function () { act("engine_limit", { engine: engine.eng_reference, delta: 0.1 }) }
				}, "+10%"),
				h(SUI.Button, {
					icon: "pencil",
					onClick: function () { act("engine_set_limit", { engine: engine.eng_reference }) }
				}, "Set Limit"),
				h(SUI.Button, {
					icon: "circle-minus",
					onClick: function () { act("engine_limit", { engine: engine.eng_reference, delta: -0.1 }) }
				}, "-10%")
			)
		)
	}

	function SummaryView(props) {
		var data = props.data
		var act = props.act
		var engines = data.engines_info || []

		return h(SUI.Stack, { vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Global Controls" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Engine state" }, data.global_state ? "Online" : "Offline"),
					h(SUI.LabeledList.Item, { label: "Thrust limit" }, String(data.global_limit || 0) + "%"),
					h(SUI.LabeledList.Item, { label: "Total thrust" }, String(data.total_thrust || 0))
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, {
						icon: "power",
						selected: !!data.global_state,
						onClick: function () { act("global_toggle") }
					}, data.global_state ? "Shutdown All" : "Power Up All"),
					h(SUI.Button, {
						icon: "circle-plus",
						onClick: function () { act("global_limit", { delta: 0.1 }) }
					}, "+10%"),
					h(SUI.Button, {
						icon: "pencil",
						onClick: function () { act("set_global_limit") }
					}, "Set Global Limit"),
					h(SUI.Button, {
						icon: "circle-minus",
						onClick: function () { act("global_limit", { delta: -0.1 }) }
					}, "-10%")
				)
			),
			h(SUI.Section, { title: "Engine Summary", fill: true, scrollable: true },
				engines.length
					? h(SUI.Table, { style: { width: "100%" } },
						h(SUI.Table.Row, null,
							h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Engine"),
							h(SUI.Table.Cell, { style: { width: "100px", fontWeight: "bold" } }, "Thrust"),
							h(SUI.Table.Cell, { style: { width: "100px", fontWeight: "bold" } }, "Limit"),
							h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "Control")
						),
						engines.map(function (engine) {
							return h(SUI.Table.Row, { key: engine.eng_reference },
								h(SUI.Table.Cell, null, engine.eng_type),
								h(SUI.Table.Cell, null, String(engine.eng_thrust || 0)),
								h(SUI.Table.Cell, null, String(engine.eng_thrust_limiter || 0) + "%"),
								h(SUI.Table.Cell, { style: { textAlign: "right" } },
									h(SUI.Button, {
										icon: "power",
										selected: !!engine.eng_on,
										onClick: function () { act("engine_toggle", { engine: engine.eng_reference }) }
									}, engine.eng_on ? "Shutdown" : "Power Up")
								)
							)
						})
					)
					: h(SUI.NoticeBox, null, "No engines reported.")
			)
		)
	}

	function DetailView(props) {
		var data = props.data
		var act = props.act
		var engines = data.engines_info || []

		return h(SUI.Section, { title: "Engine Details", fill: true, scrollable: true },
			engines.length
				? engines.map(function (engine) {
					return h(EngineRow, { key: engine.eng_reference, engine: engine, act: act })
				})
				: h(SUI.NoticeBox, null, "No engines reported.")
		)
	}

	function EngineControl() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var state = data.state || "status"

		if (!data.synced) {
			return h(SUI.Section, { title: "Engine Control", fill: true },
				h(SUI.NoticeBox, { danger: true }, "Unable to connect to engine control systems."),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("sync") } }, "Reconnect")
				)
			)
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Tabs, null,
				h(SUI.Tabs.Tab, {
					selected: state === "status",
					onClick: function () { act("state", { state: "status" }) }
				}, "Overall Info"),
				h(SUI.Tabs.Tab, {
					selected: state === "engines",
					onClick: function () { act("state", { state: "engines" }) }
				}, "Details")
			),
			h(SUI.Stack.Item, { grow: true },
				state === "engines"
					? h(DetailView, { data: data, act: act })
					: h(SummaryView, { data: data, act: act })
			)
		)
	}

	SUI.registerInterface("EngineControl", EngineControl)
})()
