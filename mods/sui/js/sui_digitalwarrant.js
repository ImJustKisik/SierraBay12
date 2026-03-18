;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function WarrantTable(props) {
		var title = props.title
		var rows = props.rows || []
		var act = props.act
		var archiveAction = props.archiveAction

		return h(SUI.Section, { title: title, fill: true, scrollable: true },
			props.addKind ? h("div", { style: { marginBottom: "8px" } },
				h(SUI.Button, {
					icon: "document",
					onClick: function () { act("addwarrant", { kind: props.addKind }) }
				}, "Add A Warrant")
			) : null,
			rows.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Target"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Reason"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Authorized By"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold", width: "180px" } }, "Actions")
				),
				rows.map(function (row) {
					return h(SUI.Table.Row, { key: row.id },
						h(SUI.Table.Cell, null, row.warrantname),
						h(SUI.Table.Cell, null, row.charges),
						h(SUI.Table.Cell, null, row.auth),
						h(SUI.Table.Cell, null,
							h(SUI.Stack, { gap: "4px", wrap: true },
								h(SUI.Button, { icon: "pencil", onClick: function () { act("editwarrant", { id: row.id }) } }, "Edit"),
								h(SUI.Button, { icon: "folder-open", onClick: function () { act(archiveAction, { id: row.id }) } }, archiveAction === "restore" ? "Restore" : "Archive"),
								h(SUI.Button, { icon: "trash", onClick: function () { act("deletewarrant", { id: row.id }) } }, "Delete")
							)
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No warrants in this category.")
		)
	}

	function WarrantDetails(props) {
		var data = props.data
		var act = props.act
		var isArrest = data.type === "arrest"

		return h(SUI.Section, { title: "Warrant", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: isArrest ? "Name" : "Location" }, data.warrantname),
				isArrest ? h(SUI.LabeledList.Item, { label: "Job" }, data.warrantjob) : null,
				h(SUI.LabeledList.Item, { label: isArrest ? "Charges" : "Reason" }, data.warrantcharges),
				h(SUI.LabeledList.Item, { label: "Authorized By" }, data.warrantauth),
				isArrest ? h(SUI.LabeledList.Item, { label: "Access Authorized By" }, data.warrantidauth) : null
			),
			h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "pencil", onClick: function () { act("editwarrantname") } }, isArrest ? "Edit Name/Job" : "Edit Location"),
				h(SUI.Button, { icon: "pencil", onClick: function () { act("editwarrantnamecustom") } }, isArrest ? "Custom Name/Job" : "Custom Location"),
				h(SUI.Button, { icon: "document", onClick: function () { act("editwarrantcharges") } }, isArrest ? "Edit Charges" : "Edit Reason"),
				h(SUI.Button, { icon: "check", onClick: function () { act("editwarrantauth") } }, "Authorize"),
				isArrest ? h(SUI.Button, { icon: "lock", onClick: function () { act("editwarrantidauth") } }, "Authorize Access") : null,
				h(SUI.Button, { icon: "save", onClick: function () { act("savewarrant") } }, "Save"),
				h(SUI.Button, {
					icon: "print",
					disabled: !data.has_printer,
					onClick: function () { act("printwarrant") }
				}, "Print"),
				h(SUI.Button, { icon: "trash", onClick: function () { act("deletewarrant") } }, "Delete"),
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("back") } }, "Back To Menu")
			)
		)
	}

	function DigitalWarrant() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.warrantauth) {
			return h(WarrantDetails, { data: data, act: act })
		}

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(WarrantTable, {
				title: "Arrest Warrants",
				rows: data.arrestwarrants || [],
				act: act,
				addKind: "arrest",
				archiveAction: "sendtoarchive"
			}),
			h(WarrantTable, {
				title: "Search Warrants",
				rows: data.searchwarrants || [],
				act: act,
				addKind: "search",
				archiveAction: "sendtoarchive"
			}),
			h(WarrantTable, {
				title: "Archived",
				rows: data.archivedwarrants || [],
				act: act,
				archiveAction: "restore"
			})
		)
	}

	SUI.registerInterface("DigitalWarrant", DigitalWarrant)
})()
