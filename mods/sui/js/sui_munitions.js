;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function BayTable(props) {
		var title = props.title
		var bays = props.bays || []
		var act = props.act
		var allowFire = !!props.allowFire
		return h(SUI.Section, { title: title, scrollable: true },
			bays.length ? h(SUI.Table, { style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Bay"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Payload"),
					h(SUI.Table.Cell, { style: { width: "220px", textAlign: "right", fontWeight: "bold" } }, "Controls")
				),
				bays.map(function (bay) {
					return h(SUI.Table.Row, { key: bay.ref },
						h(SUI.Table.Cell, null, bay.display_name),
						h(SUI.Table.Cell, null,
							h(SUI.ActionLink, {
								disabled: !bay.has_payload || !!bay.arming,
								onClick: function () { act("configure", { target: bay.ref }) }
							}, bay.has_payload ? bay.payload_data : "Empty")
						),
						h(SUI.Table.Cell, { style: { textAlign: "right" } },
							h(SUI.Stack, { gap: "4px", wrap: true, style: { justifyContent: "flex-end" } },
								h(SUI.Button, {
									selected: !!bay.loading,
									onClick: function () { act("load", { target: bay.ref }) }
								}, "Load"),
								allowFire ? h(SUI.Button, {
									className: bay.arming && !bay.firing ? "linkDanger" : "",
									disabled: !bay.has_payload || !!bay.firing,
									onClick: function () { act(bay.arming ? "fire" : "arm", { target: bay.ref }) }
								}, bay.arming ? "FIRE" : "ARM") : null
							)
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No bays detected in this category.")
		)
	}

	function Munitions() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		if (!data.authenticated) {
			return h(SUI.Section, { title: "Munitions Control", fill: true },
				h(SUI.NoticeBox, { danger: true }, "ACCESS DENIED")
			)
		}
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(BayTable, { title: "Firing Bays", bays: data.armers, act: act, allowFire: true }),
			h(BayTable, { title: "Loading Bays", bays: data.loaders, act: act })
		)
	}

	SUI.registerInterface("Munitions", Munitions)
})()
