;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function AccessRegion(props) {
		var region = props.region
		var act = props.act
		var entries = region.accesses || []

		return h("div", { style: { marginBottom: "10px" } },
			h("div", {
				style: {
					marginBottom: "6px",
					color: "#e9c183",
					fontWeight: "bold",
					letterSpacing: "0.06em"
				}
			}, region.name),
			h(SUI.Table, { style: { width: "100%" } },
				entries.map(function (entry) {
					var label = String(entry.desc || "").replace(/&nbsp/g, " ")
					return h(SUI.Table.Row, { key: entry.ref },
						h(SUI.Table.Cell, null, label),
						h(SUI.Table.Cell, { style: { width: "130px", textAlign: "right" } },
							h(SUI.Button, {
								icon: entry.allowed ? "check" : "unlock",
								selected: !!entry.allowed,
								disabled: !!entry.allowed || !!entry.blocked,
								onClick: function () { act("execute", { access: entry.ref }) }
							}, entry.allowed ? "Owned" : (entry.blocked ? "Blocked" : "Decrypt"))
						)
					)
				})
			)
		)
	}

	function ProgressView(props) {
		var data = props.data
		var act = props.act
		var strings = data.dos_strings || []

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Decryption Runtime" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Status" }, "Decrypting primary keycode database"),
					h(SUI.LabeledList.Item, { label: "Rate" }, String(data.rate || 0) + " PHash/s")
				),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, {
						icon: "close",
						onClick: function () { act("reset") }
					}, "Abort")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Signal Trace", fill: true, scrollable: true },
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

	function ReadyView(props) {
		var data = props.data
		var act = props.act
		var regions = data.regions || []

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Session Status" },
				h(SUI.NoticeBox, null, "Select an access code to begin decryption.")
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Available Access Codes", fill: true, scrollable: true },
					regions.length
						? regions.map(function (region) {
							return h(AccessRegion, { key: region.name, region: region, act: act })
						})
						: h(SUI.NoticeBox, { danger: true }, "No RFID card detected in the host device.")
				)
			)
		)
	}

	function AccessDecrypter() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.message) {
			return h(SUI.Section, { title: "Operation Complete", fill: true },
				h(SUI.NoticeBox, null, data.message),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("reset") } }, "Reset")
				)
			)
		}

		if (data.running) {
			return h(ProgressView, { data: data, act: act })
		}

		return h(ReadyView, { data: data, act: act })
	}

	SUI.registerInterface("AccessDecrypter", AccessDecrypter)
})()
