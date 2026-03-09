;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function AlarmTable(props) {
		var rows = props.rows || []
		var title = props.title
		var icon = props.icon
		var act = props.act

		return h(SUI.Section, { title: title, fill: true, scrollable: true },
			rows.length
				? h(SUI.Table, { style: { width: "100%" } },
					rows.map(function (alarm) {
						return h(SUI.Table.Row, { key: alarm.ref },
							h(SUI.Table.Cell, null,
								h(SUI.Tooltip, { text: "Open remote air alarm controls." },
									h(SUI.ActionLink, {
										icon: icon,
										onClick: function () { act("open_alarm", { alarm: alarm.ref }) }
									}, alarm.name)
								)
							)
						)
					})
				)
				: h(SUI.NoticeBox, null, "No entries in this tier.")
		)
	}

	function AtmosControl() {
		var backend = useBackend()
		var data = backend.data || {}
		var alertRows = data.alarmsAlert || []
		var dangerRows = data.alarmsDanger || []
		var nominalRows = data.alarms || []

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Network Summary" },
				alertRows.length
					? h(SUI.NoticeBox, { danger: true }, String(alertRows.length) + " critical atmospheric alarm(s) require immediate attention.")
					: null,
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Critical" }, String(alertRows.length)),
					h(SUI.LabeledList.Item, { label: "Warning" }, String(dangerRows.length)),
					h(SUI.LabeledList.Item, { label: "Stable" }, String(nominalRows.length))
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Stack, { gap: "8px", fill: true },
					h(SUI.Stack.Item, { grow: true }, h(AlarmTable, { title: "Critical", rows: alertRows, icon: "warning", act: backend.act })),
					h(SUI.Stack.Item, { grow: true }, h(AlarmTable, { title: "Warning", rows: dangerRows, icon: "alert", act: backend.act })),
					h(SUI.Stack.Item, { grow: true }, h(AlarmTable, { title: "Stable", rows: nominalRows, icon: "script", act: backend.act }))
				)
			)
		)
	}

	SUI.registerInterface("AtmosControl", AtmosControl)
})()
