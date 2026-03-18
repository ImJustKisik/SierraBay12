;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var NTOS = SUI.NTOS
	var THEME = NTOS.theme
	var SectionBlock = NTOS.SectionBlock
	var Button = NTOS.Button
	var IconButton = NTOS.IconButton
	var EmptyState = NTOS.EmptyState
	var ErrorState = NTOS.ErrorState

	function ensureFileManagerStyles() {
		NTOS.ensureStyles()
		if (typeof document === "undefined" || document.getElementById("sui-filemanager-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-filemanager-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiFileManagerRow{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiFileManagerRow:hover{background:" + THEME.rowHover + ";}" +
			".suiFileManagerFileIcon .uiIcon16{margin:0;}" +
			".suiFileManagerTitle{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;}" +
			".suiNtosShell .suiFileManagerTitle{white-space:normal !important;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function getFileIcon(fileType) {
		var type = String(fileType || "").toUpperCase()
		if (type === "PRG") return "gear"
		if (type === "CFG") return "document"
		return "document-b"
	}

	function FileNameCell(props) {
		return h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: "8px",
					minWidth: "0"
				}
			},
			h("div", {
				class: "suiFileManagerFileIcon",
				style: {
					width: "18px",
					height: "18px",
					borderRadius: "0",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "transparent",
					boxShadow: "none"
				}
			}, h("span", { class: "uiIcon16 icon-" + getFileIcon(props.type) })),
			h("span", {
				style: {
					display: "block",
					flex: "1 1 auto",
					minWidth: "0",
					color: THEME.text,
					fontSize: "13px",
					fontWeight: "600",
					lineHeight: "16px",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
					whiteSpace: "normal",
					overflow: "hidden",
					textOverflow: "ellipsis",
					wordBreak: "break-word",
					maxHeight: "32px"
				}
			}, props.name)
		)
	}

	function FileTable(props) {
		var title = props.title
		var files = props.files || []
		var act = props.act
		var usb = props.usb
		var showTransfer = !!props.showTransfer
		var columnTemplate = "minmax(170px, 2.2fr) 54px 66px minmax(0, 182px)"

		return h(SectionBlock, { title: title },
			files.length ? h("div", {
				style: {
					borderRadius: "0",
					overflow: "hidden",
					background: "transparent"
				}
			},
				h("div", {
					style: {
						display: "grid",
						gridTemplateColumns: columnTemplate,
						columnGap: "10px",
						padding: "0 6px 8px",
						borderBottom: "1px solid " + THEME.rowBorder
					}
				},
					["Name", "Type", "Size", "Actions"].map(function (label, index) {
						return h("div", {
							key: label,
							style: {
								textAlign: index > 0 ? "left" : "left",
								color: THEME.subtle,
								fontSize: "10px",
								fontWeight: "500",
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, label)
					})
				),
				files.map(function (file, index) {
					return h("div", {
						key: file.name + "_" + file.type + "_" + index,
						class: "suiFileManagerRow",
						style: {
							display: "grid",
							gridTemplateColumns: columnTemplate,
							columnGap: "10px",
							alignItems: "center",
							padding: "8px 6px",
							borderTop: index ? "1px solid " + THEME.rowBorder : "none",
							background: THEME.cardBackground
						}
					},
						h(FileNameCell, { name: file.name, type: file.type }),
						h("div", {
							style: {
								color: THEME.muted,
								fontSize: "12px",
								fontWeight: "500",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, "." + file.type),
						h("div", {
							style: {
								color: THEME.muted,
								fontSize: "12px",
								fontWeight: "500",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, String(file.size) + " GQ"),
						h("div", {
							style: {
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-end",
								gap: "4px",
								minWidth: "0"
							}
						},
							!usb ? h(Button, {
								icon: "search",
								style: {
									minHeight: "26px",
									padding: "0 8px",
									fontSize: "10px",
									gap: "4px",
									flex: "0 1 auto"
								},
								onClick: function () { act("open_file", { filename: file.name }) }
							}, "View") : null,
							!usb ? h(IconButton, {
								icon: "pencil",
								size: "26px",
								title: "Rename",
								disabled: !!file.undeletable,
								onClick: function () { act("rename_file", { filename: file.name }) }
							}) : null,
							!usb ? h(IconButton, {
								icon: "copy",
								size: "26px",
								title: "Clone",
								disabled: !!file.undeletable,
								onClick: function () { act("clone_file", { filename: file.name }) }
							}) : null,
							!usb ? h(IconButton, {
								icon: "trash",
								size: "26px",
								title: "Delete",
								danger: true,
								disabled: !!file.undeletable,
								onClick: function () { act("delete_file", { filename: file.name }) }
							}) : null,
							usb ? h(IconButton, {
								icon: "trash",
								size: "26px",
								title: "Delete",
								danger: true,
								disabled: !!file.undeletable,
								onClick: function () { act("usb_delete_file", { filename: file.name }) }
							}) : null,
							showTransfer ? h(IconButton, {
								icon: usb ? "arrowthick-1-w" : "arrowthick-1-e",
								size: "26px",
								title: usb ? "Import" : "Export",
								disabled: !!file.undeletable,
								onClick: function () { act(usb ? "copy_from_usb" : "copy_to_usb", { filename: file.name }) }
							}) : null
						)
					)
				})
			) : h(EmptyState, {
				title: "No files found",
				message: "This storage target does not currently contain any accessible files.",
				compact: true
			})
		)
	}

	function ErrorView(props) {
		var data = props.data
		var act = props.act

		return h(SectionBlock, { title: "File Manager" },
			h(ErrorState, {
				title: "File manager fault",
				message: data.error,
				compact: true
			}),
			h("div", { style: { marginTop: "10px" } },
				h(Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("close_file") } }, "Back To Menu")
			)
		)
	}

	function ViewerView(props) {
		var data = props.data
		var act = props.act

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "12px"
			}
		},
			h(SectionBlock, { title: "Viewing " + data.filename },
				h("div", {
					style: {
						display: "flex",
						gap: "6px",
						flexWrap: "wrap"
					}
				},
					h(Button, { icon: "close", ghost: true, ghostFill: true, onClick: function () { act("close_file") } }, "Close"),
					h(Button, { icon: "pencil", onClick: function () { act("edit") } }, "Edit"),
					h(Button, { icon: "print", ghost: true, ghostFill: true, onClick: function () { act("print_file") } }, "Print")
				)
			),
			h(SectionBlock, { title: "Contents" },
				data.photodata ? h("div", {
					style: {
						padding: "8px",
						border: "1px solid " + THEME.rowBorder,
						background: THEME.cardBackground
					},
					dangerouslySetInnerHTML: { __html: data.photodata }
				}) : null,
				data.filedata ? h("div", {
					style: {
						padding: "8px",
						border: "1px solid " + THEME.rowBorder,
						background: THEME.cardBackground
					},
					dangerouslySetInnerHTML: { __html: data.filedata }
				}) : null,
				!data.photodata && !data.filedata ? h(EmptyState, {
					title: "No preview available",
					message: "This file type does not expose a renderable preview in the current NTOS build.",
					compact: true
				}) : null
			)
		)
	}

	function BrowserView(props) {
		var data = props.data
		var act = props.act

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				minHeight: "100%",
				padding: "0",
				background: THEME.pageBackground,
				fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
			}
		},
			h(SectionBlock, { title: "Actions" },
				h(Button, { icon: "document", ghost: true, ghostFill: true, fullWidth: true, onClick: function () { act("new_text_file") } }, "New Data File")
			),
			h(FileTable, {
				title: "Available Files (Local)",
				files: data.files || [],
				act: act,
				showTransfer: !!data.usbconnected
			}),
			data.usbconnected ? h(FileTable, {
				title: "Available Files (Portable Device)",
				files: data.usbfiles || [],
				act: act,
				usb: true,
				showTransfer: true
			}) : null
		)
	}

	function FileManager() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		ensureFileManagerStyles()

		if (data.error) {
			return h(ErrorView, { data: data, act: act })
		}
		if (data.filename) {
			return h(ViewerView, { data: data, act: act })
		}
		return h(BrowserView, { data: data, act: act })
	}

	SUI.registerInterface("FileManager", FileManager)
})()
