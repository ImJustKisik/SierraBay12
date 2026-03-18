;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	var REPORTS_VIEW = 1
	var REPORTS_DOWNLOAD = 2

	function ReportField(props) {
		var field = props.field
		var data = props.data
		var act = props.act

		if (field.ignore_value) {
			return h("div", {
				style: { marginBottom: "8px" },
				dangerouslySetInnerHTML: { __html: field.name || "" }
			})
		}

		return h("div", {
			style: {
				marginBottom: "8px",
				padding: "8px",
				border: "1px solid rgba(64,98,138,0.25)"
			}
		},
			h(SUI.Stack, { vertical: false, gap: "8px", align: "center" },
				h("div", { style: { fontWeight: "bold", minWidth: "180px" } },
					field.can_edit && field.access_edit && !data.view_only
						? h(SUI.ActionLink, {
							icon: "pencil",
							onClick: function () { act("edit", { ID: field.ID }) }
						}, field.name + ":")
						: field.name + ":"
				),
				h("div", {
					style: { flex: 1 },
					dangerouslySetInnerHTML: {
						__html: field.access
							? (field.value || (field.needs_big_box ? "<i>Empty field.</i>" : "&nbsp;"))
							: "Access Denied."
					}
				})
			)
		)
	}

	function ReportsView(props) {
		var data = props.data
		var act = props.act
		var report = data.report_data
		var fields = report ? (report.fields || []) : []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Actions" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "folder-open", onClick: function () { act("load") } }, "Load Report"),
					h(SUI.Button, {
						icon: "save",
						disabled: !report || data.view_only,
						onClick: function () { act("save", { save_as: 0 }) }
					}, "Save Report"),
					h(SUI.Button, {
						icon: "copy",
						disabled: !report || data.view_only,
						onClick: function () { act("save", { save_as: 1 }) }
					}, "Save Copy"),
					h(SUI.Button, { icon: "document", onClick: function () { act("download") } }, "New Report")
				)
			),
			report ? h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: report.name || "Report", fill: true, scrollable: true },
					fields.map(function (field, index) {
						return h(ReportField, { key: field.ID || index, field: field, data: data, act: act })
					}),
					h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
						h(SUI.Button, {
							icon: "print",
							disabled: !data.printer,
							onClick: function () { act("print", { print_mode: 0 }) }
						}, "Print Copy"),
						h(SUI.Button, {
							icon: "print",
							disabled: !data.printer,
							onClick: function () { act("print", { print_mode: 1 }) }
						}, "Print With Fields"),
						h(SUI.Button, { icon: "download", onClick: function () { act("export") } }, "Export To Text")
					),
					h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
						data.view_only
							? h(SUI.Button, { icon: "close", onClick: function () { act("discard") } }, "Close Report")
							: [
								h(SUI.Button, {
									key: "submit",
									icon: "check",
									disabled: !report.access_edit,
									onClick: function () { act("submit") }
								}, "Submit Report"),
								h(SUI.Button, {
									key: "discard",
									icon: "trash",
									disabled: !report.access_edit,
									onClick: function () { act("discard") }
								}, "Discard Changes")
							]
					)
				)
			) : h(SUI.Section, { title: "Report Editor", fill: true },
				h(SUI.NoticeBox, null, "No report is currently loaded.")
			)
		)
	}

	function ReportDownloadView(props) {
		var data = props.data
		var act = props.act
		var reports = data.reports || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h("div", null,
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("home") } }, "Back")
			),
			h(SUI.Section, { title: "Report Download", fill: true, scrollable: true },
				reports.length
					? reports.map(function (report) {
						return h("div", { key: report.uid, style: { marginBottom: "6px" } },
							h(SUI.ActionLink, {
								icon: "document",
								onClick: function () { act("get_report", { report: report.uid }) }
							}, report.name)
						)
					})
					: h(SUI.NoticeBox, null, "There are no reports available for downloading.")
			)
		)
	}

	function Reports() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.prog_state === REPORTS_DOWNLOAD) {
			return h(ReportDownloadView, { data: data, act: act })
		}

		return h(ReportsView, { data: data, act: act })
	}

	SUI.registerInterface("Reports", Reports)
})()
