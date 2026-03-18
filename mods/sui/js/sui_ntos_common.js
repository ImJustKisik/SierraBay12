;(function () {
	var h = SUI.h

	var theme = {
		pageBackground: "#151b23",
		panelBackground: "#1b1b1c",
		cardBackground: "#10161d",
		panelBorder: "#374151",
		rowBorder: "#243142",
		rowHover: "#1f2937",
		text: "#f8fafc",
		muted: "#94a3b8",
		subtle: "#7c8a9d",
		title: "#93c5fd",
		primary: "#2563eb",
		primaryHover: "#1d4ed8",
		primaryText: "#f8fbff",
		good: "#4ade80",
		warn: "#fbbf24",
		bad: "#f87171"
	}

	function meterColor(percent) {
		if (percent <= 25) return theme.bad
		if (percent <= 50) return theme.warn
		return theme.good
	}

	function ensureStyles() {
		if (typeof document === "undefined" || document.getElementById("sui-ntos-common-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-ntos-common-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiNtosPrimary:hover{background:" + theme.primaryHover + " !important;}" +
			".suiNtosGhost:hover{border-color:#475569 !important;background:rgba(51,65,85,0.22) !important;color:#ffffff !important;}" +
			".suiNtosDanger:hover{border-color:#b91c1c !important;background:rgba(127,29,29,0.32) !important;color:#fecaca !important;}" +
			".suiNtosRow:hover{background:" + theme.rowHover + ";}" +
			".suiNtosIconAction:hover{color:#ffffff !important;border-color:#475569 !important;background:rgba(51,65,85,0.22) !important;}" +
			".suiNtosIconActionDanger:hover{color:#fecaca !important;border-color:#b91c1c !important;background:rgba(127,29,29,0.32) !important;box-shadow:inset 0 0 0 1px rgba(239,68,68,0.12) !important;}" +
			".suiNtosIconAction .uiIcon16{margin:0;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function SectionBlock(props) {
		var localTheme = props.theme || theme
		return h("section", {
			style: {
				background: localTheme.panelBackground,
				border: "1px solid " + localTheme.panelBorder,
				borderRadius: "0",
				padding: props.compact ? "8px 10px" : "10px 12px"
			}
		},
			h("div", {
				style: {
					marginBottom: props.noTitleSpacing ? "0" : "10px",
					display: "flex",
					alignItems: "center",
					gap: "10px",
					color: localTheme.title,
					fontSize: "11px",
					fontWeight: "500",
					letterSpacing: "0.16em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			},
				h("div", { style: { height: "1px", flex: "1 1 auto", background: localTheme.panelBorder } }),
				h("div", { style: { flex: "0 0 auto", textAlign: "center" } }, props.title),
				h("div", { style: { height: "1px", flex: "1 1 auto", background: localTheme.panelBorder } })
			),
			props.children
		)
	}

	function Button(props) {
		var localTheme = props.theme || theme
		var disabled = !!props.disabled
		var ghost = !!props.ghost
		var danger = !!props.danger
		var style = {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: props.fullWidth ? "flex-start" : "center",
			gap: "6px",
			minHeight: props.tall ? "30px" : "28px",
			padding: props.fullWidth ? "0 12px" : "0 10px",
			borderRadius: "2px",
			fontSize: "10px",
			fontWeight: "700",
			letterSpacing: "0.08em",
			textTransform: "uppercase",
			fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
			cursor: disabled ? "default" : "pointer",
			opacity: disabled ? "0.45" : "1",
			width: props.fullWidth ? "100%" : "auto",
			whiteSpace: "nowrap"
		}

		if (ghost) {
			style.border = "1px solid " + (danger ? "#7f1d1d" : localTheme.panelBorder)
			style.background = props.ghostFill ? "rgba(30,58,138,0.22)" : "transparent"
			style.color = danger ? "#fca5a5" : localTheme.muted
		} else {
			style.border = "none"
			style.background = localTheme.primary
			style.color = localTheme.primaryText
		}

		var styleKey
		for (styleKey in (props.style || {})) {
			style[styleKey] = props.style[styleKey]
		}

		return h("button", {
			type: "button",
			disabled: disabled,
			class: ghost ? "suiNtosGhost" + (danger ? " suiNtosDanger" : "") : "suiNtosPrimary",
			onClick: function (event) {
				event.preventDefault()
				if (!disabled && props.onClick) {
					props.onClick(event)
				}
			},
			style: style
		},
			props.icon ? h("span", { class: "uiIcon16 icon-" + props.icon, style: { margin: "0" } }) : null,
			h("span", null, props.children)
		)
	}

	function IconButton(props) {
		var localTheme = props.theme || theme
		var disabled = !!props.disabled
		return h("button", {
			type: "button",
			disabled: disabled,
			class: "suiNtosIconAction" + (props.danger ? " suiNtosIconActionDanger" : ""),
			onClick: function (event) {
				event.preventDefault()
				if (!disabled && props.onClick) {
					props.onClick(event)
				}
			},
			title: props.title,
			style: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: props.size || "28px",
				height: props.size || "28px",
				padding: "0",
				borderRadius: "2px",
				border: "1px solid " + localTheme.panelBorder,
				background: "transparent",
				color: disabled ? "rgba(126,144,164,0.38)" : localTheme.muted,
				cursor: disabled ? "default" : "pointer",
				opacity: disabled ? "0.5" : "1"
			}
		}, h("span", { class: "uiIcon16 icon-" + props.icon }))
	}

	function KeyValueRow(props) {
		var localTheme = props.theme || theme
		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: (props.labelWidth || "110px") + " minmax(0, 1fr)",
				columnGap: "10px",
				alignItems: "start",
				padding: "6px 0",
				borderTop: props.first ? "none" : "1px solid " + localTheme.rowBorder
			}
		},
			h("div", {
				style: {
					color: localTheme.subtle,
					fontSize: "10px",
					fontWeight: "500",
					letterSpacing: "0.12em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, props.label),
			h("div", {
				style: {
					color: localTheme.text,
					fontSize: "12px",
					lineHeight: "14px",
					fontWeight: "600",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
					minWidth: "0",
					wordBreak: "break-word"
				}
			}, props.children)
		)
	}

	function StatusBadge(props) {
		var localTheme = props.theme || theme
		return h("div", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				gap: "6px"
			}
		},
			h("span", {
				style: {
					width: "7px",
					height: "7px",
					borderRadius: "50%",
					background: props.active ? (props.activeColor || localTheme.good) : (props.inactiveColor || localTheme.subtle)
				}
			}),
			h("span", {
				style: {
					color: props.active ? (props.activeTextColor || "#d1fae5") : localTheme.muted,
					fontSize: "11px",
					fontWeight: "600",
					letterSpacing: "0.08em",
					textTransform: "uppercase"
				}
			}, props.active ? (props.activeLabel || "Enabled") : (props.inactiveLabel || "Disabled"))
		)
	}

	function CircularMeter(props) {
		var localTheme = props.theme || theme
		var percent = Math.max(0, Math.min(100, Number(props.percent) || 0))
		var color = props.color || meterColor(percent)
		var outerSize = parseInt(props.size, 10) || 44
		var innerSize = parseInt(props.innerSize, 10) || 30
		var strokeWidth = Math.max(4, Math.round((outerSize - innerSize) / 2))
		var radius = Math.max(0, (outerSize / 2) - (strokeWidth / 2))
		var circumference = 2 * Math.PI * radius
		var dashOffset = circumference * (1 - (percent / 100))
		return h("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: "10px"
			}
		},
			h("div", {
				style: {
					width: outerSize + "px",
					height: outerSize + "px",
					borderRadius: "50%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					flex: "0 0 auto"
				}
			},
				h("svg", {
					style: {
						position: "absolute",
						left: "0",
						top: "0",
						width: outerSize + "px",
						height: outerSize + "px",
						transform: "rotate(-90deg)"
					}
				},
					h("circle", {
						cx: outerSize / 2,
						cy: outerSize / 2,
						r: radius,
						style: {
							fill: "none",
							stroke: localTheme.rowBorder,
							strokeWidth: strokeWidth + "px"
						}
					}),
					h("circle", {
						cx: outerSize / 2,
						cy: outerSize / 2,
						r: radius,
						style: {
							fill: "none",
							stroke: color,
							strokeWidth: strokeWidth + "px",
							strokeLinecap: "butt",
							strokeDasharray: circumference + "px",
							strokeDashoffset: dashOffset + "px"
						}
					})
				),
				h("div", {
					style: {
						width: innerSize + "px",
						height: innerSize + "px",
						borderRadius: "50%",
						border: "1px solid " + localTheme.panelBorder,
						background: localTheme.panelBackground,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: localTheme.text,
						fontSize: "10px",
						fontWeight: "700"
					}
				}, percent + "%")
			),
			h("div", {
				style: {
					minWidth: "0",
					flex: "1 1 auto"
				}
			},
				h("div", {
					style: {
						color: localTheme.subtle,
						fontSize: "10px",
						fontWeight: "500",
						letterSpacing: "0.12em",
						textTransform: "uppercase"
					}
				}, props.label),
				h("div", {
					style: {
						marginTop: "2px",
						color: localTheme.text,
						fontSize: "11px",
						fontWeight: "700",
						lineHeight: "13px",
						wordBreak: "break-word"
					}
				}, props.text)
			)
		)
	}

	function StatePanel(props) {
		var localTheme = props.theme || theme
		var tone = props.tone || "info"
		var accent = localTheme.title
		var border = localTheme.panelBorder
		var background = localTheme.cardBackground
		var titleColor = localTheme.text

		if (tone === "danger") {
			accent = localTheme.bad
			border = "#6a2d2d"
			background = "#261414"
			titleColor = "#ffe4e6"
		} else if (tone === "warning") {
			accent = localTheme.warn
			border = "#66521c"
			background = "#221b0e"
			titleColor = "#fef3c7"
		}

		return h("div", {
			style: {
				border: "1px solid " + border,
				background: background,
				padding: props.compact ? "10px 12px" : "14px 16px",
				position: "relative"
			}
		},
			h("div", {
				style: {
					position: "absolute",
					left: "0",
					top: "0",
					bottom: "0",
					width: "3px",
					background: accent
				}
			}),
			h("div", {
				style: {
					paddingLeft: "8px"
				}
			},
				h("div", {
					style: {
						color: accent,
						fontSize: "10px",
						fontWeight: "600",
						letterSpacing: "0.18em",
						textTransform: "uppercase"
					}
				}, props.eyebrow || "System State"),
				h("div", {
					style: {
						marginTop: "6px",
						color: titleColor,
						fontSize: "14px",
						fontWeight: "700",
						lineHeight: "16px"
					}
				}, props.title || "Status"),
				props.message ? h("div", {
					style: {
						marginTop: "6px",
						color: localTheme.muted,
						fontSize: "11px",
						lineHeight: "15px"
					}
				}, props.message) : null,
				props.actions ? h("div", {
					style: {
						marginTop: "10px",
						display: "flex",
						gap: "6px",
						flexWrap: "wrap"
					}
				}, props.actions) : null
			)
		)
	}

	function EmptyState(props) {
		return h(StatePanel, {
			theme: props.theme,
			compact: props.compact,
			eyebrow: props.eyebrow || "No Data",
			title: props.title || "Nothing to display",
			message: props.message || "No records are currently available."
		})
	}

	function ErrorState(props) {
		return h(StatePanel, {
			theme: props.theme,
			compact: props.compact,
			tone: "danger",
			eyebrow: props.eyebrow || "System Fault",
			title: props.title || "Operation failed",
			message: props.message || "The requested operation could not be completed.",
			actions: props.actions
		})
	}

	function themeWith(overrides) {
		var merged = {}
		var key
		for (key in theme) merged[key] = theme[key]
		for (key in (overrides || {})) merged[key] = overrides[key]
		return merged
	}

	SUI.NTOS = {
		theme: theme,
		themeWith: themeWith,
		ensureStyles: ensureStyles,
		meterColor: meterColor,
		SectionBlock: SectionBlock,
		Button: Button,
		IconButton: IconButton,
		KeyValueRow: KeyValueRow,
		StatusBadge: StatusBadge,
		CircularMeter: CircularMeter,
		StatePanel: StatePanel,
		EmptyState: EmptyState,
		ErrorState: ErrorState
	}
})()
