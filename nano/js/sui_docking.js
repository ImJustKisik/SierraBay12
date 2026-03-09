;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function Docking() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var docks = data.docks || []

		return h(SUI.Section, { title: "Docking Ports", fill: true, scrollable: true },
			docks.length
				? h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Location"),
						h(SUI.Table.Cell, { style: { width: "150px", fontWeight: "bold" } }, "Status"),
						h(SUI.Table.Cell, { style: { width: "130px", fontWeight: "bold" } }, "Codes"),
						h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "Control")
					),
					docks.map(function (dock) {
						return h(SUI.Table.Row, { key: dock.tag },
							h(SUI.Table.Cell, null, dock.location),
							h(SUI.Table.Cell, null, dock.status),
							h(SUI.Table.Cell, null,
								h(SUI.Button, {
									icon: "pencil",
									onClick: function () { act("edit_code", { tag: dock.tag }) }
								}, dock.codes)
							),
							h(SUI.Table.Cell, { style: { textAlign: "right" } },
								dock.docking_attempt
									? h(SUI.Button, {
										icon: "arrowthickstop-1-s",
										onClick: function () { act("dock", { tag: dock.tag }) }
									}, "Grant Dock")
									: dock.docked
										? h(SUI.Button, {
											icon: "eject",
											onClick: function () { act("undock", { tag: dock.tag }) }
										}, "Undock")
										: "-"
							)
						)
					})
				)
				: h(SUI.NoticeBox, null, "No docking controllers detected on connected z-levels.")
		)
	}

	SUI.registerInterface("Docking", Docking)
})()
