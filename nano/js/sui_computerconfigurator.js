;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function powerColor(percent) {
		if (percent <= 25) return "bad"
		if (percent <= 50) return "average"
		return "good"
	}

	function HardwareRow(props) {
		var item = props.item
		var act = props.act

		return h("div", {
			style: {
				padding: "8px 10px",
				marginBottom: "8px",
				border: "1px solid rgba(64,98,138,0.25)",
				background: "rgba(0,0,0,0.18)"
			}
		},
			h("div", { style: { marginBottom: "4px", fontWeight: "bold", color: "#e9c183" } }, item.name),
			h("div", { style: { marginBottom: "6px", fontSize: "11px", color: "#aaaaaa" } }, item.desc),
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "State" }, item.enabled ? "Enabled" : "Disabled"),
				h(SUI.LabeledList.Item, { label: "Power usage" }, String(item.powerusage || 0) + " W")
			),
			!item.critical ? h(SUI.Stack, { gap: "6px", wrap: true },
				h(SUI.Button, {
					icon: "power",
					selected: !!item.enabled,
					disabled: !!item.enabled,
					onClick: function () { act("set_component", { ref: item.ref, enabled: 1 }) }
				}, "Enable"),
				h(SUI.Button, {
					icon: "circle-minus",
					disabled: !item.enabled,
					onClick: function () { act("set_component", { ref: item.ref, enabled: 0 }) }
				}, "Disable")
			) : null
		)
	}

	function ComputerConfigurator() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var hardware = data.hardware || []
		var batteryPercent = Number(data.battery_percent) || 0
		var diskUsed = Number(data.disk_used) || 0
		var diskSize = Number(data.disk_size) || 0

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Power Supply" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Battery status" }, data.battery_exists ? "Active" : "Not available"),
					data.battery_exists ? h(SUI.LabeledList.Item, { label: "Battery rating" }, String(data.battery_rating || 0)) : null,
					data.battery_exists ? h(SUI.LabeledList.Item, { label: "Battery charge" },
						h(SUI.ProgressBar, {
							value: batteryPercent,
							min: 0,
							max: 100,
							color: powerColor(batteryPercent),
							showText: batteryPercent + "%"
						})
					) : null,
					h(SUI.LabeledList.Item, { label: "Power usage" }, String(data.power_usage || 0) + " W")
				)
			),
			h(SUI.Section, { title: "File System" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Used capacity" },
						h(SUI.ProgressBar, {
							value: diskUsed,
							min: 0,
							max: diskSize || 1,
							color: "good",
							showText: diskUsed + " / " + diskSize + " GQ"
						})
					)
				)
			),
			h(SUI.Section, { title: "System Configuration" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Print language" },
						data.print_language
							? h(SUI.Button, {
								icon: "pencil",
								onClick: function () { act("edit_language") }
							}, data.print_language)
							: h("span", { className: "bad" }, "No printer installed")
					),
					h(SUI.LabeledList.Item, { label: "Auto-updater" }, data.receives_updates ? "Enabled" : "Disabled")
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, {
						icon: "check",
						disabled: !!data.receives_updates,
						onClick: function () { act("set_updates", { enabled: 1 }) }
					}, "Enable Updates"),
					h(SUI.Button, {
						icon: "close",
						disabled: !data.receives_updates,
						onClick: function () { act("set_updates", { enabled: 0 }) }
					}, "Disable Updates")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Computer Components", fill: true, scrollable: true },
					hardware.length
						? hardware.map(function (item) {
							return h(HardwareRow, { key: item.ref, item: item, act: act })
						})
						: h(SUI.NoticeBox, null, "No components detected.")
				)
			)
		)
	}

	SUI.registerInterface("ComputerConfigurator", ComputerConfigurator)
})()
