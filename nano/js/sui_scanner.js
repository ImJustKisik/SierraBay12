;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function Scanner() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (!data.scanner_name) {
			return h(SUI.Section, { title: "Scanner", fill: true },
				h(SUI.NoticeBox, { danger: true }, "There is no scanner attached.")
			)
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Attached Hardware" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Scanner" }, data.scanner_name),
					h(SUI.LabeledList.Item, { label: "Driver status" }, data.using_scanner ? "Installed" : "Uninstalled"),
					h(SUI.LabeledList.Item, { label: "Hardware state" }, data.scanner_enabled ? "Enabled" : "Disabled")
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, {
						icon: "check",
						selected: !!data.using_scanner,
						onClick: function () { act("connect_scanner", { connect: 1 }) }
					}, "Install Driver"),
					h(SUI.Button, {
						icon: "close",
						disabled: !data.using_scanner,
						onClick: function () { act("connect_scanner", { connect: 0 }) }
					}, "Remove Driver"),
					h(SUI.Button, {
						icon: "search",
						disabled: !data.check_scanning,
						onClick: function () { act("scan") }
					}, "Perform Scan"),
					h(SUI.Button, {
						icon: "save",
						disabled: !data.can_save_scan,
						onClick: function () { act("save") }
					}, "Save Scan")
				)
			),
			data.can_view_scan ? h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Scan Preview", fill: true, scrollable: true },
					h("div", { dangerouslySetInnerHTML: { __html: data.data_buffer || "<i>No data.</i>" } })
				)
			) : null
		)
	}

	SUI.registerInterface("Scanner", Scanner)
})()
