;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function ShieldList(props) {
		var data = props.data
		var shields = data.shields || []
		var act = props.act

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Shield Network" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Generators" }, String(shields.length))
				),
				h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh")
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Generators", fill: true, scrollable: true },
					shields.length
						? h(SUI.Table, { style: { width: "100%" } },
							h(SUI.Table.Row, null,
								h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Area"),
								h(SUI.Table.Cell, { style: { width: "110px", fontWeight: "bold" } }, "State"),
								h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "View")
							),
							shields.map(function (shield) {
								return h(SUI.Table.Row, { key: shield.shield_ref },
									h(SUI.Table.Cell, null, shield.area),
									h(SUI.Table.Cell, null, shield.shield_status ? "Running" : "Offline"),
									h(SUI.Table.Cell, { style: { textAlign: "right" } },
										h(SUI.Button, {
											icon: "search",
											onClick: function () { act("select_shield", { shield: shield.shield_ref }) }
										}, "Inspect")
									)
								)
							})
						)
						: h(SUI.NoticeBox, null, "No shield generators detected on connected z-levels.")
				)
			)
		)
	}

	function ShieldDetail(props) {
		var data = props.data
		var act = props.act
		var energy = Number(data.percentage_energy) || 0
		var integrity = Number(data.field_integrity) || 0

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Generator Status" },
				data.overloaded ? h(SUI.NoticeBox, { danger: true }, "Generator overloaded.") : null,
				data.hacked ? h(SUI.NoticeBox, { danger: true }, "Unauthorized control signatures detected.") : null,
				!data.running ? h(SUI.NoticeBox, null, "Shield field currently offline.") : null,
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "State" }, data.running ? "Running" : "Offline"),
					h(SUI.LabeledList.Item, { label: "Integrity" },
						h(SUI.ProgressBar, {
							value: integrity,
							min: 0,
							max: 100,
							color: integrity >= 70 ? "good" : (integrity >= 40 ? "average" : "bad"),
							showText: String(integrity) + "%"
						})
					),
					h(SUI.LabeledList.Item, { label: "Stored Energy" },
						h(SUI.ProgressBar, {
							value: energy,
							min: 0,
							max: 100,
							color: energy >= 60 ? "good" : (energy >= 30 ? "average" : "bad"),
							showText: String(data.current_energy) + " / " + String(data.max_energy) + " MJ"
						})
					),
					h(SUI.LabeledList.Item, { label: "Field Radius" }, String(data.field_radius)),
					h(SUI.LabeledList.Item, { label: "Segments" }, String(data.functional_segments) + " / " + String(data.total_segments))
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "left", onClick: function () { act("clear") } }, "Back"),
					h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh")
				)
			),
			h(SUI.Collapsible, { title: "Mitigation Profile", icon: "shield" },
				h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Type"),
						h(SUI.Table.Cell, null, "Value")
					),
					h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "Physical"), h(SUI.Table.Cell, null, String(data.mitigation_physical) + " / " + String(data.mitigation_max))),
					h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "EM"), h(SUI.Table.Cell, null, String(data.mitigation_em) + " / " + String(data.mitigation_max))),
					h(SUI.Table.Row, null, h(SUI.Table.Cell, null, "Heat"), h(SUI.Table.Cell, null, String(data.mitigation_heat) + " / " + String(data.mitigation_max)))
				)
			),
			h(SUI.Collapsible, { title: "Power Draw", icon: "bolt" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Input Cap" }, String(data.input_cap_kw) + " kW"),
					h(SUI.LabeledList.Item, { label: "Upkeep" }, String(data.upkeep_power_usage) + " kW"),
					h(SUI.LabeledList.Item, { label: "Current Draw" }, String(data.power_usage) + " kW"),
					h(SUI.LabeledList.Item, { label: "Offline For" }, String(data.offline_for) + " s")
				)
			)
		)
	}

	function ShieldsMonitor() {
		var backend = useBackend()
		var data = backend.data || {}

		return data.active
			? h(ShieldDetail, { data: data, act: backend.act })
			: h(ShieldList, { data: data, act: backend.act })
	}

	SUI.registerInterface("ShieldsMonitor", ShieldsMonitor)
})()
