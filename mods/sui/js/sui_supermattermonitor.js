;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function colorFromLabel(label) {
		if (label === "bad") return "bad"
		if (label === "average") return "average"
		return "good"
	}

	function SummaryList(props) {
		var supermatters = props.supermatters || []
		var act = props.act

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Crystal Network" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Connected crystals" }, String(supermatters.length))
				),
				h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh")
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Crystal Summary", fill: true, scrollable: true },
					supermatters.length
						? h(SUI.Table, { style: { width: "100%" } },
							h(SUI.Table.Row, null,
								h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Area"),
								h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "Integrity"),
								h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "View")
							),
							supermatters.map(function (entry) {
								var integrity = Number(entry.integrity) || 0
								return h(SUI.Table.Row, { key: entry.ref },
									h(SUI.Table.Cell, null, entry.area_name),
									h(SUI.Table.Cell, null,
										h(SUI.ProgressBar, {
											value: integrity,
											min: 0,
											max: 100,
											color: integrity >= 75 ? "good" : (integrity >= 45 ? "average" : "bad"),
											showText: String(Math.round(integrity)) + "%"
										})
									),
									h(SUI.Table.Cell, { style: { textAlign: "right" } },
										h(SUI.Button, {
											icon: "search",
											onClick: function () { act("select_supermatter", { ref: entry.ref }) }
										}, "Inspect")
									)
								)
							})
						)
						: h(SUI.NoticeBox, null, "No operational supermatter crystals detected.")
				)
			)
		)
	}

	function GasTable(props) {
		var data = props.data

		return h(SUI.Table, { style: { width: "100%" } },
			h(SUI.Table.Row, null,
				h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Gas"),
				h(SUI.Table.Cell, null, "Mix")
			),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "O2"), h(SUI.Table.Cell, null, String(data.SM_gas_O2) + "%")),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "N2"), h(SUI.Table.Cell, null, String(data.SM_gas_N2) + "%")),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "CO2"), h(SUI.Table.Cell, null, String(data.SM_gas_CO2) + "%")),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "Phoron"), h(SUI.Table.Cell, null, String(data.SM_gas_PH) + "%")),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "N2O"), h(SUI.Table.Cell, null, String(data.SM_gas_N2O) + "%")),
			h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "H2"), h(SUI.Table.Cell, null, String(data.SM_gas_H2) + "%"))
		)
	}

	function Thresholds(props) {
		var thresholds = props.thresholds || []
		var act = props.act

		return h(SUI.Section, { title: "Threshold Matrix", fill: true, scrollable: true },
			thresholds.length
				? thresholds.map(function (entry, index) {
					return h("div", {
						key: (entry.name || "threshold") + "_" + index,
						style: {
							padding: "8px 10px",
							marginBottom: "8px",
							border: "1px solid rgba(64,98,138,0.25)",
							background: "rgba(0,0,0,0.18)"
						}
					},
						h("div", { style: { marginBottom: "6px", fontWeight: "bold", color: "#e9c183" } }, entry.name),
						h(SUI.Stack, { gap: "8px", wrap: true },
							["min_h", "min_l", "max_l", "max_h"].map(function (field) {
								return h("div", { key: field },
									h("div", { style: { marginBottom: "4px", fontSize: "11px", color: "#aaaaaa" } }, field),
									h(SUI.NumberInput, {
										value: Number(entry[field]) || 0,
										step: 1,
										width: "110px",
										onChange: function (value) {
											act("set_threshhold", {
												threshhold: entry.name,
												category: field,
												value: value
											})
										}
									})
								)
							})
						)
					)
				})
				: h(SUI.NoticeBox, null, "No threshold data available.")
		)
	}

	function SupermatterDetail(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Crystal Status" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "left", onClick: function () { act("clear") } }, "Back"),
					h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh")
				),
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Integrity" },
						h(SUI.ProgressBar, {
							value: Number(data.SM_integrity) || 0,
							min: 0,
							max: 100,
							color: (Number(data.SM_integrity) || 0) >= 75 ? "good" : ((Number(data.SM_integrity) || 0) >= 45 ? "average" : "bad"),
							showText: String(Math.round(Number(data.SM_integrity) || 0)) + "%"
						})
					),
					h(SUI.LabeledList.Item, { label: "Power" },
						h(SUI.ProgressBar, {
							value: Number(data.SM_power) || 0,
							min: 0,
							max: Math.max(Number(data.SM_power) || 1, 1),
							color: colorFromLabel(data.SM_power_label),
							showText: String(Math.round(Number(data.SM_power) || 0))
						})
					),
					h(SUI.LabeledList.Item, { label: "Ambient Temperature" }, String(Math.round(Number(data.SM_ambienttemp) || 0)) + " K"),
					h(SUI.LabeledList.Item, { label: "Ambient Pressure" }, String(Math.round(Number(data.SM_ambientpressure) || 0)) + " kPa"),
					h(SUI.LabeledList.Item, { label: "EPR" }, String(Math.round(Number(data.SM_EPR) || 0)))
				)
			),
			h(SUI.Tabs, null,
				h(SUI.Tabs.Tab, {
					selected: data.screen === "main",
					onClick: function () { act("screen", { screen: "main" }) }
				}, "Diagnostics"),
				h(SUI.Tabs.Tab, {
					selected: data.screen === "threshholds",
					onClick: function () { act("screen", { screen: "threshholds" }) }
				}, "Thresholds")
			),
			h(SUI.Stack.Item, { grow: true },
				data.screen === "threshholds"
					? h(Thresholds, { thresholds: data.threshholds, act: act })
					: h(SUI.Section, { title: "Atmospheric Mix", fill: true, scrollable: true }, h(GasTable, { data: data }))
			)
		)
	}

	function SupermatterMonitor() {
		var backend = useBackend()
		var data = backend.data || {}

		return data.active
			? h(SupermatterDetail, { data: data, act: backend.act })
			: h(SummaryList, { supermatters: data.supermatters, act: backend.act })
	}

	SUI.registerInterface("SupermatterMonitor", SupermatterMonitor)
})()
