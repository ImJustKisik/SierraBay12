;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function SensorList(props) {
		var sensors = props.sensors || []
		var act = props.act
		var alertCount = 0

		sensors.forEach(function (sensor) {
			if (sensor.alarm) alertCount++
		})

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Grid Summary" },
				alertCount
					? h(SUI.NoticeBox, { danger: true }, String(alertCount) + " sensor(s) reporting abnormal grid activity.")
					: h(SUI.NoticeBox, null, "No active grid alarms detected."),
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Connected sensors" }, String(sensors.length)),
					h(SUI.LabeledList.Item, { label: "Alarming sensors" }, String(alertCount))
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh Cache")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Sensors", fill: true, scrollable: true },
					sensors.length
						? h(SUI.Table, { style: { width: "100%" } },
							h(SUI.Table.Row, null,
								h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Sensor"),
								h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "State"),
								h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "View")
							),
							sensors.map(function (sensor) {
								return h(SUI.Table.Row, { key: sensor.name },
									h(SUI.Table.Cell, null, sensor.name),
									h(SUI.Table.Cell, null,
										sensor.alarm
											? h(SUI.Tooltip, { text: "Sensor detected abnormal load or availability." },
												h("span", { className: "bad" },
													h(SUI.Icon, { name: "warning", style: { marginRight: "4px" } }),
													"Alert"
												)
											)
											: h("span", { className: "good" }, "Nominal")
									),
									h(SUI.Table.Cell, { style: { textAlign: "right" } },
										h(SUI.Button, {
											icon: "search",
											onClick: function () { act("select_sensor", { sensor: sensor.name }) }
										}, "Inspect")
									)
								)
							})
						)
						: h(SUI.NoticeBox, null, "No grid sensors were discovered on connected z-levels.")
				)
			)
		)
	}

	function FocusView(props) {
		var focus = props.focus || {}
		var act = props.act
		var apcs = focus.apc_data || []
		var load = Number(focus.load_percentage) || 0

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Grid Summary" },
				focus.error ? h(SUI.NoticeBox, { danger: true }, focus.error) : null,
				focus.alarm ? h(SUI.NoticeBox, { danger: true }, "Abnormal grid activity detected on this network.") : null,
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Sensor" }, focus.name || "Unknown"),
					h(SUI.LabeledList.Item, { label: "Availability" }, focus.total_avail || "0 W"),
					h(SUI.LabeledList.Item, { label: "APC Load" }, focus.total_used_apc || "0 W"),
					h(SUI.LabeledList.Item, { label: "Other Load" }, focus.total_used_other || "0 W"),
					h(SUI.LabeledList.Item, { label: "Total Load" }, focus.total_used_all || "0 W"),
					h(SUI.LabeledList.Item, { label: "Load Factor" },
						h(SUI.ProgressBar, {
							value: load,
							min: 0,
							max: 100,
							color: load >= 95 ? "bad" : (load >= 75 ? "average" : "good"),
							showText: String(load) + "%"
						})
					)
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "left", onClick: function () { act("clear") } }, "Back to Sensors"),
					h(SUI.Button, { icon: "refresh", onClick: function () { act("refresh") } }, "Refresh Cache")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Collapsible, { title: "APC Breakdown", icon: "bolt", open: true },
					apcs.length
						? h(SUI.Table, { style: { width: "100%" } },
							h(SUI.Table.Row, null,
								h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Area"),
								h(SUI.Table.Cell, { style: { width: "80px", fontWeight: "bold" } }, "Equip"),
								h(SUI.Table.Cell, { style: { width: "80px", fontWeight: "bold" } }, "Light"),
								h(SUI.Table.Cell, { style: { width: "80px", fontWeight: "bold" } }, "Env"),
								h(SUI.Table.Cell, { style: { width: "90px", fontWeight: "bold" } }, "Cell"),
								h(SUI.Table.Cell, { style: { width: "110px", fontWeight: "bold" } }, "Load")
							),
							apcs.map(function (apc, index) {
								return h(SUI.Table.Row, { key: apc.name + "_" + index },
									h(SUI.Table.Cell, null, apc.name),
									h(SUI.Table.Cell, null, apc.s_equipment),
									h(SUI.Table.Cell, null, apc.s_lighting),
									h(SUI.Table.Cell, null, apc.s_environment),
									h(SUI.Table.Cell, null, String(apc.cell_charge) + "% / " + apc.cell_status),
									h(SUI.Table.Cell, null, apc.total_load)
								)
							})
						)
						: h(SUI.NoticeBox, null, "No APC telemetry available for this grid.")
				)
			)
		)
	}

	function PowerMonitor() {
		var backend = useBackend()
		var data = backend.data || {}

		return data.focus
			? h(FocusView, { focus: data.focus, act: backend.act })
			: h(SensorList, { sensors: data.all_sensors, act: backend.act })
	}

	SUI.registerInterface("PowerMonitor", PowerMonitor)
})()
