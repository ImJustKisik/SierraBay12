;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function DocumentTable(props) {
		var title = props.title
		var files = props.files || []
		var act = props.act

		return h(SUI.Section, { title: title, fill: true, scrollable: true },
			files.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Name"),
					h(SUI.Table.Cell, { style: { width: "90px", textAlign: "right", fontWeight: "bold" } }, "Size"),
					h(SUI.Table.Cell, { style: { width: "110px", textAlign: "right", fontWeight: "bold" } }, "Action")
				),
				files.map(function (file) {
					return h(SUI.Table.Row, { key: file.name + "_" + file.size },
						h(SUI.Table.Cell, null, file.name),
						h(SUI.Table.Cell, { style: { textAlign: "right" } }, String(file.size) + " GQ"),
						h(SUI.Table.Cell, { style: { textAlign: "right" } },
							h(SUI.Button, {
								icon: "folder-open",
								onClick: function () { act("open_file", { filename: file.name }) }
							}, "Open")
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No text documents found.")
		)
	}

	function BrowserView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h("div", null,
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("close_browser") } }, "Back To Editor")
			),
			h(SUI.Stack.Item, { grow: true },
				h(DocumentTable, { title: "Available Documents (Local)", files: data.files, act: act })
			),
			data.usbconnected ? h(SUI.Stack.Item, { grow: true },
				h(DocumentTable, { title: "Available Documents (Portable Device)", files: data.usbfiles, act: act })
			) : null
		)
	}

	function EditorView(props) {
		var data = props.data
		var act = props.act
		var hasContent = !!data.filedata

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Document: " + (data.filename || "UNNAMED") },
				h(SUI.Stack, { vertical: false, gap: "6px", wrap: true },
					h(SUI.Button, { icon: "document", onClick: function () { act("new_file") } }, "New"),
					h(SUI.Button, { icon: "folder-open", onClick: function () { act("load_menu") } }, "Load"),
					h(SUI.Button, { icon: "save", onClick: function () { act("save_file") } }, "Save"),
					h(SUI.Button, { icon: "copy", onClick: function () { act("save_as_file") } }, "Save As"),
					h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_file") } }, "Edit"),
					h(SUI.Button, {
						icon: "search",
						disabled: !hasContent,
						onClick: function () { act("preview_text") }
					}, "Preview"),
					h(SUI.Button, { icon: "help", onClick: function () { act("tag_help") } }, "Formatting Help"),
					h(SUI.Button, { icon: "print", onClick: function () { act("print_file") } }, "Print")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Rendered Document", fill: true, scrollable: true },
					h("div", {
						className: "block",
						dangerouslySetInnerHTML: { __html: data.filedata || "<i>Document is empty.</i>" }
					})
				)
			)
		)
	}

	function WordProcessor() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.error) {
			return h(SUI.Section, { title: "Document Error", fill: true },
				h(SUI.NoticeBox, { danger: true }, data.error),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("back_to_menu") } }, "Back To Menu")
				)
			)
		}

		if (data.browsing) {
			return h(BrowserView, { data: data, act: act })
		}

		return h(EditorView, { data: data, act: act })
	}

	SUI.registerInterface("WordProcessor", WordProcessor)
})()
