;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function DownloadPane(props) {
		var data = props.data
		var act = props.act
		var size = Number(data.download_size) || 0
		var progress = Number(data.download_progress) || 0

		return h(SUI.Section, { title: "Download In Progress", fill: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Downloaded file" }, data.download_name || "Unknown"),
				h(SUI.LabeledList.Item, { label: "Progress" },
					h(SUI.ProgressBar, {
						value: progress,
						min: 0,
						max: size || 1,
						color: "good",
						showText: progress + " / " + size + " GQ"
					})
				),
				h(SUI.LabeledList.Item, { label: "Transfer speed" }, (data.download_netspeed || 0) + " GQ/s"),
				h(SUI.LabeledList.Item, { label: "Controls" },
					h(SUI.Button, {
						icon: "close",
						onClick: function () { act("reset") }
					}, "Abort Download")
				)
			)
		)
	}

	function UploadServerPane(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "Server Enabled", fill: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Server UID" }, String(data.upload_uid || "N/A")),
				h(SUI.LabeledList.Item, { label: "Connected clients" }, String(data.upload_clients || 0)),
				h(SUI.LabeledList.Item, { label: "Provided file" }, data.upload_filename || "N/A"),
				h(SUI.LabeledList.Item, { label: "Password" }, data.upload_haspassword ? "Enabled" : "Disabled")
			),
			h(SUI.Stack, { vertical: false, gap: "8px", style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "locked", onClick: function () { act("set_password") } }, "Set Password"),
				h(SUI.Button, { icon: "close", onClick: function () { act("reset") } }, "Exit Server")
			)
		)
	}

	function UploadSelectPane(props) {
		var files = props.data.upload_filelist || []
		var act = props.act

		return h(SUI.Section, { title: "Select File To Upload", fill: true, scrollable: true },
			files.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "File"),
					h(SUI.Table.Cell, { style: { width: "90px", textAlign: "right", fontWeight: "bold" } }, "Size"),
					h(SUI.Table.Cell, { style: { width: "120px", textAlign: "right", fontWeight: "bold" } }, "Action")
				),
				files.map(function (file) {
					return h(SUI.Table.Row, { key: file.uid },
						h(SUI.Table.Cell, null, file.filename),
						h(SUI.Table.Cell, { style: { textAlign: "right" } }, String(file.size) + " GQ"),
						h(SUI.Table.Cell, { style: { textAlign: "right" } },
							h(SUI.Button, {
								icon: "upload",
								onClick: function () { act("upload_file", { uid: file.uid }) }
							}, "Select")
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No files available on local drive."),
			h(SUI.Stack, { vertical: false, gap: "8px", style: { marginTop: "10px" } },
				h(SUI.Button, { icon: "locked", onClick: function () { act("set_password") } }, "Set Password"),
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("reset") } }, "Return")
			)
		)
	}

	function ServerListPane(props) {
		var servers = props.data.servers || []
		var act = props.act

		return h(SUI.Section, { title: "Available Servers", fill: true, scrollable: true },
			servers.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
				h(SUI.Table.Row, null,
					h(SUI.Table.Cell, { style: { width: "70px", fontWeight: "bold" } }, "UID"),
					h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "File"),
					h(SUI.Table.Cell, { style: { width: "80px", textAlign: "right", fontWeight: "bold" } }, "Size"),
					h(SUI.Table.Cell, { style: { width: "110px", fontWeight: "bold" } }, "Password"),
					h(SUI.Table.Cell, { style: { width: "120px", textAlign: "right", fontWeight: "bold" } }, "Action")
				),
				servers.map(function (server) {
					return h(SUI.Table.Row, { key: server.uid },
						h(SUI.Table.Cell, null, String(server.uid)),
						h(SUI.Table.Cell, null, server.filename),
						h(SUI.Table.Cell, { style: { textAlign: "right" } }, String(server.size) + " GQ"),
						h(SUI.Table.Cell, null, server.haspassword ? "Enabled" : "Disabled"),
						h(SUI.Table.Cell, { style: { textAlign: "right" } },
							h(SUI.Button, {
								icon: "arrowthickstop-1-s",
								onClick: function () { act("download_file", { uid: server.uid }) }
							}, "Download")
						)
					)
				})
			) : h(SUI.NoticeBox, null, "No active file servers found."),
			h("div", { style: { marginTop: "10px" } },
				h(SUI.Button, {
					icon: "upload",
					onClick: function () { act("upload_menu") }
				}, "Send File")
			)
		)
	}

	function NTTransfer() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.error) {
			return h(SUI.Section, { title: "Transfer Error", fill: true },
				h(SUI.NoticeBox, { danger: true }, data.error),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("reset") } }, "Clear")
				)
			)
		}

		if (data.downloading) {
			return h(DownloadPane, { data: data, act: act })
		}

		if (data.uploading) {
			return h(UploadServerPane, { data: data, act: act })
		}

		if (data.upload_filelist) {
			return h(UploadSelectPane, { data: data, act: act })
		}

		return h(ServerListPane, { data: data, act: act })
	}

	SUI.registerInterface("NTTransfer", NTTransfer)
})()
