;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function ErrorView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Section, { title: "Library Error", fill: true },
			h(SUI.NoticeBox, { danger: true }, data.error),
			h(SUI.Button, { onClick: function () { act("reset_error") } }, "Reset")
		)
	}

	function BookView(props) {
		var data = props.data
		var act = props.act
		var book = data.current_book || {}
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: book.title || "Book" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("close_book") } }, "Close"),
					h(SUI.Button, { onClick: function () { act("print_book") } }, "Print")
				),
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Author" }, book.author || "Unknown"),
					h(SUI.LabeledList.Item, { label: "USBN" }, String(book.id || ""))
				)
			),
			h(SUI.Section, { title: "Contents", fill: true, scrollable: true, style: { backgroundColor: "#ffffff", color: "#000000" } },
				h("div", { dangerouslySetInnerHTML: { __html: book.content || "" } })
			)
		)
	}

	function BrowserView(props) {
		var data = props.data
		var act = props.act
		var books = data.book_list || []
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Archive Controls" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Scanner" }, data.scanner ? "Connected" : "Not Connected"),
					h(SUI.LabeledList.Item, { label: "Sort" }, data.sort_by || "id")
				),
				h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
					h(SUI.Button, { onClick: function () { act("view_id") } }, "View By USBN"),
					h(SUI.Button, { onClick: function () { act("upload_book") } }, "Upload From Scanner"),
					h(SUI.Button, { onClick: function () { act("connect_scanner") } }, "Connect Scanner"),
					h(SUI.Button, { selected: data.sort_by === "title", onClick: function () { act("sort_by", { sort: "title" }) } }, "Title"),
					h(SUI.Button, { selected: data.sort_by === "author", onClick: function () { act("sort_by", { sort: "author" }) } }, "Author"),
					h(SUI.Button, { selected: data.sort_by === "category", onClick: function () { act("sort_by", { sort: "category" }) } }, "Category"),
					h(SUI.Button, { selected: data.sort_by === "id", onClick: function () { act("sort_by", { sort: "id" }) } }, "USBN")
				)
			),
			h(SUI.Section, { title: "External Archives", fill: true, scrollable: true },
				books.length ? h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { width: "80px", fontWeight: "bold" } }, "Action"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Title"),
						h(SUI.Table.Cell, { style: { width: "160px", fontWeight: "bold" } }, "Author"),
						h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold" } }, "Category"),
						h(SUI.Table.Cell, { style: { width: "80px", fontWeight: "bold" } }, "USBN")
					),
					books.map(function (book) {
						return h(SUI.Table.Row, { key: book.id },
							h(SUI.Table.Cell, null,
								h(SUI.Button, { onClick: function () { act("view_book", { id: String(book.id) }) } }, "View")
							),
							h(SUI.Table.Cell, null, book.title),
							h(SUI.Table.Cell, null, book.author),
							h(SUI.Table.Cell, null, book.category),
							h(SUI.Table.Cell, null, String(book.id))
						)
					})
				) : h(SUI.NoticeBox, null, "No books found.")
			)
		)
	}

	function Library() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		if (data.error) return h(ErrorView, { data: data, act: act })
		if (data.current_book) return h(BookView, { data: data, act: act })
		return h(BrowserView, { data: data, act: act })
	}

	SUI.registerInterface("Library", Library)
})()
