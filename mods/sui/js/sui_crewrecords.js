;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function RecordListView(props) {
		var data = props.data
		var act = props.act
		var records = data.all_records || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			data.message ? h(SUI.NoticeBox, { danger: true },
				h(SUI.Stack, { vertical: false, gap: "8px", align: "center" },
					h("span", { style: { flex: 1 } }, data.message),
					h(SUI.Button, { icon: "close", onClick: function () { act("clear_message") } }, "Dismiss")
				)
			) : null,
			h(SUI.Section, { title: "Actions" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					data.creation ? h(SUI.Button, { icon: "document", onClick: function () { act("new_record") } }, "New Record") : null,
					h(SUI.Button, { icon: "search", onClick: function () { act("search", { field: "Name" }) } }, "Name Search"),
					data.dnasearch ? h(SUI.Button, { icon: "search", onClick: function () { act("search", { field: "DNA" }) } }, "DNA Search") : null,
					data.fingersearch ? h(SUI.Button, { icon: "search", onClick: function () { act("search", { field: "Fingerprint" }) } }, "Fingerprint Search") : null
				)
			),
			h(SUI.Section, { title: "Available Records", fill: true, scrollable: true },
				h(SUI.Table, { fill: true, style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Name"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Position"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Rank")
					),
					records.map(function (record) {
						return h(SUI.Table.Row, { key: record.id },
							h(SUI.Table.Cell, null,
								h(SUI.ActionLink, {
									onClick: function () { act("set_active", { id: record.id }) }
								}, record.name)
							),
							h(SUI.Table.Cell, null, record.rank),
							h(SUI.Table.Cell, null, record.milrank)
						)
					})
				)
			)
		)
	}

	function RecordDetailView(props) {
		var data = props.data
		var act = props.act
		var fields = data.fields || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Stack, { gap: "6px", wrap: true },
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("clear_active") } }, "Back"),
				h(SUI.Button, { icon: "print", onClick: function () { act("print_active") } }, "Print")
			),
			h(SUI.Section, { title: "Generic Information", fill: true, scrollable: true },
				h("div", { style: { textAlign: "center", marginBottom: "10px" } },
					h("img", { src: "front_" + data.uid + ".png", width: "128", style: { marginRight: "8px" } }),
					h("img", { src: "side_" + data.uid + ".png", width: "128" })
				),
				data.pic_edit ? h(SUI.Stack, { gap: "6px", wrap: true, style: { marginBottom: "10px" } },
					h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_photo_front") } }, "Edit Front"),
					h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_photo_side") } }, "Edit Side")
				) : null,
				fields.filter(function (field) { return field.access }).map(function (field, index) {
					return h("div", {
						key: field.ID || index,
						style: {
							marginBottom: "8px",
							padding: "8px",
							border: "1px solid rgba(64,98,138,0.25)"
						}
					},
						h("div", { style: { fontWeight: "bold", marginBottom: "4px" } },
							field.access_edit
								? h(SUI.ActionLink, {
									icon: "pencil",
									onClick: function () { act("edit_field", { id: field.ID }) }
								}, field.name)
								: field.name + ":"
						),
						h("div", { dangerouslySetInnerHTML: { __html: field.value || "&nbsp;" } })
					)
				})
			)
		)
	}

	function CrewRecords() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.uid) {
			return h(RecordDetailView, { data: data, act: act })
		}

		return h(RecordListView, { data: data, act: act })
	}

	SUI.registerInterface("CrewRecords", CrewRecords)
})()
