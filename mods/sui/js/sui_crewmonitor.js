;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function buildStatus(member) {
		if (member.sensor_type >= 2) {
			var pulse = member.pulse !== "N/A" ? String(member.pulse) + (member.true_pulse === -1 ? "" : " bpm") : "N/A"
			return pulse + " / " + (member.pressure || "N/A") + " / " + (member.bodytemp || "N/A") + " C"
		}
		return member.alert ? "Medical issue detected" : "No issues detected"
	}

	function buildLocation(member) {
		if (member.sensor_type >= 3) {
			return member.area + " (" + member.x + ", " + member.y + ", " + member.z + ")"
		}
		if (member.sensor_type >= 2) return "Not available"
		return "Unavailable"
	}

	function CrewMonitor() {
		var backend = useBackend()
		var data = backend.data || {}
		var crew = data.crewmembers || []
		var zLevels = data.map_z_levels || []
		var act = backend.act

		return h(SUI.Stack, { gap: "8px", fill: true },
			h(SUI.Stack.Item, { width: "56%" },
				h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
					h(SUI.Section, { title: "Monitor Summary" },
						data.alert_count
							? h(SUI.NoticeBox, { danger: true }, String(data.alert_count) + " crewmember(s) reporting medical issues.")
							: h(SUI.NoticeBox, null, "No active crew health alerts."),
						h(SUI.LabeledList, null,
							h(SUI.LabeledList.Item, { label: "Tracked crew" }, String(data.total_count || 0)),
							h(SUI.LabeledList.Item, { label: "Tracking-enabled" }, String(data.tracking_count || 0)),
							h(SUI.LabeledList.Item, { label: "Map feed" }, data.map_enabled ? "Enabled" : "Hidden")
						)
					),
					h(SUI.Stack.Item, { grow: true },
						h(SUI.Section, { title: "Crew Readout", fill: true, scrollable: true },
							crew.length
								? h(SUI.Table, { style: { width: "100%" } },
									h(SUI.Table.Row, null,
										h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Crewmember"),
										h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold" } }, "Vitals"),
										h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold" } }, "Location"),
										data.isAI ? h(SUI.Table.Cell, { style: { width: "90px", fontWeight: "bold", textAlign: "right" } }, "Track") : null
									),
									crew.map(function (member) {
										return h(SUI.Table.Row, { key: member.ref },
											h(SUI.Table.Cell, null,
												h("div", { style: { fontWeight: "bold" } }, member.name + " (" + member.assignment + ")"),
												member.alert ? h("div", { className: "bad" }, "Alert") : h("div", { className: "good" }, "Stable")
											),
											h(SUI.Table.Cell, null, buildStatus(member)),
											h(SUI.Table.Cell, null, buildLocation(member)),
											data.isAI ? h(SUI.Table.Cell, { style: { textAlign: "right" } },
												h(SUI.Button, {
													icon: "pin-s",
													disabled: member.sensor_type < 3,
													onClick: function () { act("track", { track: member.ref }) }
												}, "Track")
											) : null
										)
									})
								)
								: h(SUI.NoticeBox, null, "No crew telemetry available.")
						)
					)
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Tracking Map", fill: true },
					h(SUI.MapPanel, {
						active: !!data.map_enabled,
						hint: "Map viewport is controlled by DM through set_show_map(...).",
						activeMessage: "Crew monitor map feed active on z-level " + data.map_z_level + ".",
						inactiveMessage: "Enable the map feed to display the current z-level.",
						toolbar: [
							h(SUI.Button, {
								key: "toggle",
								icon: data.map_enabled ? "power-button" : "map",
								onClick: function () { act("toggle_map") }
							}, data.map_enabled ? "Hide Map" : "Show Map"),
							h(SUI.Dropdown, {
								key: "zlevel",
								width: "120px",
								selected: String(data.map_z_level || ""),
								options: zLevels.map(function (z) {
									return { value: String(z), label: "Z " + z }
								}),
								onSelected: function (value) { act("set_map_z", { z_level: value }) }
							})
						]
					})
				)
			)
		)
	}

	SUI.registerInterface("CrewMonitor", CrewMonitor)
})()
