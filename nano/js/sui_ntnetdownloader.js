;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function DownloadStatus(props) {
		var data = props.data
		var hasDownload = !!data.downloadname
		var maxSize = hasDownload ? Number(data.downloadsize) || 0 : 0
		var progress = hasDownload ? Number(data.downloadcompletion) || 0 : 0

		return h(SUI.Section, { title: hasDownload ? "Download Running" : "No Downloads In Progress" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "File name" }, hasDownload ? data.downloadname : "N/A"),
				h(SUI.LabeledList.Item, { label: "Description" }, hasDownload ? data.downloaddesc : "N/A"),
				h(SUI.LabeledList.Item, { label: "File size" }, hasDownload ? (progress + " / " + maxSize + " GQ") : "N/A"),
				h(SUI.LabeledList.Item, { label: "Transfer rate" }, (hasDownload ? data.downloadspeed : 0) + " GQ/s"),
				h(SUI.LabeledList.Item, { label: "Progress" },
					h(SUI.ProgressBar, {
						value: progress,
						min: 0,
						max: maxSize || 1,
						color: "good",
						showText: maxSize ? (Math.round((progress / maxSize) * 100) + "%") : "0%"
					})
				)
			)
		)
	}

	function DownloadQueue(props) {
		var queue = props.data.downloads_queue || []
		var act = props.act

		return h(SUI.Section, { title: "Downloads Queue" },
			queue.length
				? h(SUI.Table, { fill: true, style: { width: "100%" } },
					queue.map(function (filename, index) {
						return h(SUI.Table.Row, { key: filename + "_" + index },
							h(SUI.Table.Cell, { style: { width: "28px", color: "#8ba5c4" } }, String(index + 1)),
							h(SUI.Table.Cell, null, filename),
							h(SUI.Table.Cell, { style: { width: "110px", textAlign: "right" } },
								h(SUI.Button, {
									icon: "close",
									onClick: function () { act("remove_queued", { filename: filename }) }
								}, "Remove")
							)
						)
					})
				)
				: h(SUI.NoticeBox, null, "The queue is currently empty.")
		)
	}

	function ProgramTable(props) {
		var programs = props.programs || []
		var act = props.act

		if (!programs.length) {
			return h(SUI.NoticeBox, null, "No available software in this category.")
		}

		return h(SUI.Table, { fill: true, style: { width: "100%" } },
			h(SUI.Table.Row, null,
				h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold" } }, "Program"),
				h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Description"),
				h(SUI.Table.Cell, { style: { width: "90px", fontWeight: "bold", textAlign: "right" } }, "Size"),
				h(SUI.Table.Cell, { style: { width: "120px", fontWeight: "bold", textAlign: "right" } }, "Action")
			),
			programs.map(function (prog) {
				return h(SUI.Table.Row, { key: prog.filename },
					h(SUI.Table.Cell, null, prog.filedesc),
					h(SUI.Table.Cell, null, prog.fileinfo),
					h(SUI.Table.Cell, { style: { textAlign: "right" } }, String(prog.size) + " GQ"),
					h(SUI.Table.Cell, { style: { textAlign: "right" } },
						h(SUI.Button, {
							icon: prog.icon || "arrowthickstop-1-s",
							onClick: function () { act("download_file", { filename: prog.filename }) }
						}, "Download")
					)
				)
			})
		)
	}

	function RepositorySection(props) {
		var data = props.data
		var act = props.act
		var categories = data.downloadable_programs || []
		var hackedPrograms = data.hackedavailable ? (data.hacked_programs || []) : []
		var diskSize = Number(data.disk_size) || 0
		var diskUsed = Number(data.disk_used) || 0

		return h(SUI.Section, { title: "Repositories", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Hard drive" },
					h(SUI.ProgressBar, {
						value: diskUsed,
						min: 0,
						max: diskSize || 1,
						color: "good",
						showText: diskUsed + " / " + diskSize + " GQ"
					})
				)
			),
			categories.map(function (entry) {
				return h("div", { key: entry.category, style: { marginTop: "10px" } },
					h("div", { style: { marginBottom: "6px", color: "#e9c183", fontWeight: "bold", letterSpacing: "0.06em" } }, entry.category),
					h(ProgramTable, { programs: entry.programs, act: act })
				)
			}),
			data.hackedavailable ? h("div", { style: { marginTop: "12px" } },
				h("div", { style: { marginBottom: "6px", color: "#cd6500", fontWeight: "bold", letterSpacing: "0.06em" } }, "*UNKNOWN* Repository"),
				h(SUI.NoticeBox, null, "NanoTrasen does not recommend downloading software from non-official servers."),
				h(ProgramTable, { programs: hackedPrograms, act: act })
			) : null
		)
	}

	function NTNetDownloader() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			data.error ? h(SUI.Section, { title: "Download Error" },
				h(SUI.NoticeBox, { danger: true }, data.error),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("reset_error") } }, "Reset Program")
				)
			) : null,
			h(DownloadStatus, { data: data }),
			h(DownloadQueue, { data: data, act: act }),
			h(SUI.Stack.Item, { grow: true },
				h(RepositorySection, { data: data, act: act })
			)
		)
	}

	SUI.registerInterface("NTNetDownloader", NTNetDownloader)
})()
