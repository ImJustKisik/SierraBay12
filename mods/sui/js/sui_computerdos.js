;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function ComputerDos() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var relays = data.relays || []
		var strings = data.dos_strings || []

		if (data.error) {
			return h(SUI.Section, { title: "System Error", fill: true },
				h(SUI.NoticeBox, { danger: true }, data.error),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("reset") } }, "Reset")
				)
			)
		}

		if (data.target) {
			return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
				h(SUI.Section, { title: "Flood In Progress" },
					h(SUI.LabeledList, null,
						h(SUI.LabeledList.Item, { label: "Throughput" }, String(data.speed || 0) + " GQ/s")
					),
					h("div", { style: { marginTop: "8px" } },
						h(SUI.Button, { icon: "close", onClick: function () { act("reset") } }, "Abort")
					)
				),
				h(SUI.Stack.Item, { grow: true },
					h(SUI.Section, { title: "Traffic Pattern", fill: true, scrollable: true },
						h("pre", {
							style: {
								margin: "0",
								fontFamily: "Consolas, monospace",
								fontSize: "12px",
								lineHeight: "1.4",
								color: "#ff7777"
							}
						}, strings.join("\n"))
					)
				)
			)
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Target Selection" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Focused relay" }, data.focus || "None")
				),
				h(SUI.Button, {
					icon: "warning",
					disabled: !data.focus,
					onClick: function () { act("execute") }
				}, "Execute Flood")
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Detected Quantum Relays", fill: true, scrollable: true },
					relays.length
						? relays.map(function (relayId) {
							return h(SUI.ActionLink, {
								key: relayId,
								fluid: true,
								selected: data.focus === relayId,
								style: { marginBottom: "4px" },
								onClick: function () { act("target_relay", { relay_id: relayId }) }
							}, relayId)
						})
						: h(SUI.NoticeBox, { danger: true }, "No relays are currently reachable.")
				)
			)
		)
	}

	SUI.registerInterface("ComputerDos", ComputerDos)
})()
