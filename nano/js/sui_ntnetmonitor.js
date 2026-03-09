;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function SkillFail(props) {
		var rows = props.rows || []
		return h(SUI.Section, { title: "Diagnostic Noise", fill: true, scrollable: true },
			rows.map(function (entry, index) {
				return h("div", { key: index, style: { marginBottom: "6px" } },
					h("b", null, entry.key),
					h("div", null, entry.value)
				)
			})
		)
	}

	function ToggleRow(props) {
		var label = props.label
		var enabled = props.enabled
		var action = props.action
		return h(SUI.Table.Row, null,
			h(SUI.Table.Cell, null, label),
			h(SUI.Table.Cell, { style: { width: "100px" } }, enabled ? "ENABLED" : "DISABLED"),
			h(SUI.Table.Cell, { style: { width: "110px", textAlign: "right" } },
				h(SUI.Button, { icon: "refresh", onClick: action }, "Toggle")
			)
		)
	}

	function NTNetMonitor() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var logs = data.ntnetlogs || []
		var banned = data.banned_nids || []

		if (data.skill_fail) {
			return h(SkillFail, { rows: data.skill_fail })
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Wireless Connectivity" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Active relays" }, String(data.ntnetrelays || 0)),
					h(SUI.LabeledList.Item, { label: "System status" }, data.ntnetstatus ? "ENABLED" : "DISABLED")
				),
				h(SUI.Button, {
					icon: "signal",
					disabled: !data.ntnetrelays,
					onClick: function () { act("toggleWireless") }
				}, "Toggle Wireless")
			),
			h(SUI.Section, { title: "Firewall Configuration" },
				h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Protocol"),
						h(SUI.Table.Cell, { style: { width: "100px", fontWeight: "bold" } }, "Status"),
						h(SUI.Table.Cell, { style: { width: "110px", fontWeight: "bold", textAlign: "right" } }, "Control")
					),
					h(ToggleRow, {
						label: "Software Downloads",
						enabled: !!data.config_softwaredownload,
						action: function () { act("toggle_function", { "function": 1 }) }
					}),
					h(ToggleRow, {
						label: "Peer to Peer Traffic",
						enabled: !!data.config_peertopeer,
						action: function () { act("toggle_function", { "function": 2 }) }
					}),
					h(ToggleRow, {
						label: "Communication Systems",
						enabled: !!data.config_communication,
						action: function () { act("toggle_function", { "function": 3 }) }
					}),
					h(ToggleRow, {
						label: "Remote System Control",
						enabled: !!data.config_systemcontrol,
						action: function () { act("toggle_function", { "function": 4 }) }
					})
				)
			),
			h(SUI.Section, { title: "Security Systems" },
				data.idsalarm ? h(SUI.NoticeBox, { danger: true }, "Network incursion detected.") : null,
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Intrusion detection" }, data.idsstatus ? "ENABLED" : "DISABLED"),
					h(SUI.LabeledList.Item, { label: "Max log count" }, String(data.ntnetmaxlogs || 0)),
					h(SUI.LabeledList.Item, { label: "Blacklisted NIDs" },
						Array.isArray(banned) && banned.length ? banned.join(", ") : "None"
					)
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("resetIDS") } }, "Reset IDS"),
					h(SUI.Button, { icon: "warning", onClick: function () { act("toggleIDS") } }, "Toggle IDS"),
					h(SUI.Button, { icon: "pencil", onClick: function () { act("updatemaxlogs") } }, "Set Log Limit"),
					h(SUI.Button, { icon: "trash", onClick: function () { act("purgelogs") } }, "Purge Logs"),
					h(SUI.Button, { icon: "plus", onClick: function () { act("ban_nid") } }, "Add Blacklist"),
					h(SUI.Button, { icon: "minus", onClick: function () { act("unban_nid") } }, "Remove Blacklist")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "System Logs", fill: true, scrollable: true },
					logs.length
						? logs.map(function (line, index) {
							return h("div", {
								key: index,
								style: {
									marginBottom: "4px",
									fontFamily: "Consolas, monospace",
									fontSize: "12px"
								}
							}, line)
						})
						: h(SUI.NoticeBox, null, "No logs in memory.")
				)
			)
		)
	}

	SUI.registerInterface("NTNetMonitor", NTNetMonitor)
})()
