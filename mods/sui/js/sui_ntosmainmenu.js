;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var NTOS = SUI.NTOS
	NTOS.ensureStyles()
	var EmptyState = NTOS.EmptyState
	var StatePanel = NTOS.StatePanel

	var THEME = {
		pageBackground: "#1a1d24",
		panelBackground: "#1c1c1d",
		cardBackground: "#121820",
		cardBackgroundActive: "#16202b",
		cardBorder: "#223244",
		cardBorderActive: "#314a66",
		softBorder: "#374151",
		primary: "#234a77",
		primaryHover: "#2e5f97",
		primaryText: "#f8fbff",
		secondaryText: "#9aa8b8",
		mutedText: "#7f8b99",
		headingText: "#f3f4f6",
		sectionTitle: "#8cb8ea",
		statusIdle: "#6b7280",
		statusActive: "#60a5fa"
	}

	function getProgramIcon(programName) {
		var name = String(programName || "").toLowerCase()
		if (name === "compconfig") return "gear"
		if (name === "ntdownloader") return "search"
		if (name === "filemanager") return "folder-open"
		if (name === "cammon") return "video"
		if (name === "records") return "person"
		return "document-b"
	}

	function BaseButton(props) {
		var variant = props.variant || "ghost"
		var disabled = !!props.disabled
		var style = {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "6px",
			minHeight: "28px",
			padding: "0 10px",
			borderRadius: "2px",
			border: "1px solid " + THEME.softBorder,
			background: "transparent",
			color: THEME.secondaryText,
			fontSize: "10px",
			fontWeight: "700",
			letterSpacing: "0.08em",
			textTransform: "uppercase",
			fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
			opacity: disabled ? "0.38" : "1",
			cursor: disabled ? "default" : "pointer",
			boxShadow: "none"
		}

		if (variant === "primary") {
			style.border = "none"
			style.background = THEME.primary
			style.color = THEME.primaryText
		} else if (variant === "secondary") {
			style.border = "1px solid " + THEME.softBorder
			style.background = "transparent"
			style.color = THEME.secondaryText
		}

		return h("button", {
			type: "button",
			disabled: disabled,
			onClick: function (event) {
				event.preventDefault()
				if (!disabled && props.onClick) {
					props.onClick(event)
				}
			},
			style: style
		},
			props.icon ? h("span", {
				class: "uiIcon16 icon-" + props.icon,
				style: { margin: "0", opacity: disabled ? "0.7" : "0.95" }
			}) : null,
			h("span", null, props.children)
		)
	}

	function MenuIcon(props) {
		var icon = props.icon || "newwin"
		return h("div", {
			style: {
				width: "40px",
				height: "40px",
				borderRadius: "0",
				border: "1px solid " + THEME.softBorder,
				background: THEME.cardBackground,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flex: "0 0 auto"
			}
		}, h("span", {
			class: "uiIcon16 icon-" + icon,
			style: {
				margin: "0"
			}
		}))
	}

	function SectionBlock(props) {
		return h("section", {
			style: {
				background: THEME.panelBackground,
				border: "1px solid " + THEME.softBorder,
				borderRadius: "0",
				padding: "10px 12px"
			}
		},
			h("div", {
				style: {
					marginBottom: "10px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					color: THEME.sectionTitle,
					fontSize: "11px",
					fontWeight: "600",
					letterSpacing: "0.12em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			},
				h("div", {
					style: {
						height: "1px",
						flex: "1 1 auto",
						background: THEME.softBorder
					}
				}),
				h("div", {
					style: {
						flex: "0 0 auto",
						textAlign: "center"
					}
				}, props.title),
				h("div", {
					style: {
						height: "1px",
						flex: "1 1 auto",
						background: THEME.softBorder
					}
				})
			),
			props.children
		)
	}

	function StatusChip(props) {
		return h("div", {
			style: {
				minWidth: "0",
				padding: "7px 9px",
				borderRadius: "0",
				background: "transparent",
				border: "1px solid #335a87",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: "4px",
				flex: "1 1 0"
			}
		},
			h("span", {
				style: {
					color: THEME.mutedText,
					fontSize: "10px",
					fontWeight: "600",
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, props.label),
			h("span", {
				style: {
					color: THEME.headingText,
					fontSize: "10px",
					fontWeight: "700",
					lineHeight: "12px",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "clip"
				}
			}, props.value)
		)
	}

	function StatusIndicator(props) {
		var active = !!props.active
		return h("div", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				flex: "0 0 auto"
			}
		},
			h("span", {
				style: {
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					background: active ? THEME.statusActive : THEME.statusIdle
				}
			}),
			h("span", {
				style: {
					color: active ? "#bfd5ec" : "#8598ad",
					fontSize: "11px",
					fontWeight: "600",
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, active ? "Running" : "Idle")
		)
	}

	function ProgramCard(props) {
		var program = props.program
		var act = props.act
		var allowMultipleWindows = !!props.allowMultipleWindows
		var isRunning = !!program.running
		var desc = program.desc || program.name

		return h("div", {
			key: program.name,
			style: {
				display: "flex",
				gap: "12px",
				padding: "10px",
				borderRadius: "0",
				border: "1px solid " + (isRunning ? THEME.cardBorderActive : THEME.cardBorder),
				background: isRunning ? THEME.cardBackgroundActive : THEME.cardBackground
			}
		},
			h(MenuIcon, { icon: getProgramIcon(program.name) }),
			h("div", {
				style: {
					flex: "1 1 auto",
					minWidth: "0",
					display: "flex",
					flexDirection: "column",
					gap: "10px",
					justifyContent: "center"
				}
			},
				h("div", {
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "12px"
					}
				},
					h("div", {
						style: {
							minWidth: "0"
						}
					},
						h("div", {
							style: {
								color: THEME.headingText,
								fontSize: "14px",
								fontWeight: "700",
								lineHeight: "16px",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, desc),
						h("div", {
							style: {
								marginTop: "2px",
								color: "#89a1bb",
								fontSize: "11px",
								lineHeight: "13px",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, program.name)
					),
					h(StatusIndicator, { active: isRunning })
				),
				h("div", {
					style: {
						display: "flex",
						gap: "8px",
						flexWrap: "wrap"
					}
				},
					h(BaseButton, {
						variant: "primary",
						icon: "newwin",
						onClick: function () { act("run_program", { program: program.name }) }
					}, "Open"),
					allowMultipleWindows ? h(BaseButton, {
						variant: "secondary",
						onClick: function () { act("run_program_new_window", { program: program.name }) }
					}, program.extra_window ? "Minimize" : "Window") : null,
					h(BaseButton, {
						variant: program.autorun ? "secondary" : "ghost",
						onClick: function () { act("toggle_autorun", { program: program.name }) }
					}, "Autorun")
					,
					h(BaseButton, {
						disabled: !isRunning,
						onClick: function () { act("kill_program", { program: program.name }) }
					}, "Kill")
				)
			)
		)
	}

	function StatusView(props) {
		var data = props.data

			return h(SectionBlock, { title: "System Status" },
			h("div", {
				style: {
					display: "flex",
					gap: "8px",
					flexWrap: "nowrap"
				}
			},
				h(StatusChip, { label: "TIME:", value: data.PC_stationtime || "Unknown" }),
				h(StatusChip, { label: "BATTERY:", value: data.PC_batterypercent || "N/C" }),
				h(StatusChip, {
					label: "NETWORK:",
					value: data.PC_ntneticon ? String(data.PC_ntneticon).replace(".gif", "").replace("sig_", "").toUpperCase() : "Offline"
				})
			)
		)
	}

	function UpdatingView(props) {
		var data = props.data

		return h(SectionBlock, { title: "System Update" },
			h(StatePanel, {
				eyebrow: "Maintenance Mode",
				title: "Applying NTOS update",
				message: "Please do not power off or disconnect this terminal while program files are being updated.",
				compact: true
			}),
			h("div", {
				style: {
					marginTop: "10px"
				}
			},
				h(SUI.ProgressBar, {
					value: Number(data.update_progress) || 0,
					max: Number(data.updates) || 1,
					showText: String(data.update_progress || 0) + " / " + String(data.updates || 0)
				})
			)
		)
	}

	function NoProgramsView() {
		return h(EmptyState, {
			title: "No installed programs",
			message: "This NTOS installation does not currently expose any runnable program modules.",
			compact: true
		})
	}

	function MainMenuView(props) {
		var data = props.data
		var act = props.act
		var programs = data.programs || []

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
			h(StatusView, { data: data }),
			h(SectionBlock, { title: "Actions" },
				h("div", {
					style: {
						display: "flex",
						gap: "6px",
						flexWrap: "wrap"
					}
				},
					h(BaseButton, { variant: "primary", icon: "script", onClick: function () { act("terminal") } }, "Terminal"),
					data.in_camera_mode ? h(BaseButton, {
						variant: "secondary",
						icon: "video",
						onClick: function () { act("camera") }
					}, "Camera Mode") : null,
					h(BaseButton, { variant: "secondary", icon: "power", onClick: function () { act("shutdown") } }, "Shutdown")
				)
			),
			h(SectionBlock, { title: "Installed Programs" },
				programs.length ? h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						maxHeight: "100%",
						overflowY: "auto",
						paddingRight: "2px"
					}
				},
					programs.map(function (program) {
						return h(ProgramCard, {
							key: program.name,
							program: program,
							act: act,
							allowMultipleWindows: data.allow_multiple_windows
						})
					})
				) : h(NoProgramsView, null)
			)
		)
	}

	function NTOSMainMenu() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.updating) {
			return h(UpdatingView, { data: data })
		}

		return h(MainMenuView, { data: data, act: act })
	}

	SUI.registerInterface("NTOSMainMenu", NTOSMainMenu)
})()
