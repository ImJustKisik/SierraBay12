;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var NTOS = SUI.NTOS
	var THEME = NTOS.theme
	var SectionBlock = NTOS.SectionBlock
	var Button = NTOS.Button
	var KeyValueRow = NTOS.KeyValueRow
	var StatusBadge = NTOS.StatusBadge
	var CircularMeter = NTOS.CircularMeter
	var meterColor = NTOS.meterColor
	var EmptyState = NTOS.EmptyState

	function ensureConfiguratorStyles() {
		NTOS.ensureStyles()
		if (typeof document === "undefined" || document.getElementById("sui-computerconfig-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-computerconfig-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiConfiguratorComponent{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiConfiguratorComponent:hover{background:" + THEME.rowHover + ";}" +
			".suiConfiguratorGhost:hover{border-color:#475569 !important;background:rgba(51,65,85,0.22) !important;color:#ffffff !important;}" +
			".suiConfiguratorPrimary:hover{background:" + THEME.primaryHover + " !important;}" +
			".suiConfiguratorDanger:hover{border-color:#b91c1c !important;background:rgba(127,29,29,0.32) !important;color:#fecaca !important;}" +
			".suiConfiguratorTitle{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function HardwareRow(props) {
		var item = props.item
		var act = props.act

		return h("div", {
			class: "suiConfiguratorComponent",
			style: {
				padding: "8px 10px",
				border: "1px solid " + THEME.rowBorder,
				background: THEME.cardBackground
			}
		},
			h("div", {
				style: {
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: "10px"
				}
			},
				h("div", { style: { minWidth: "0", flex: "1 1 auto" } },
					h("div", {
						style: {
							color: THEME.text,
							fontSize: "13px",
							fontWeight: "700",
							lineHeight: "15px",
							fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
						}
					}, item.name),
					h("div", {
						style: {
							marginTop: "2px",
							color: THEME.muted,
							fontSize: "11px",
							lineHeight: "13px",
							fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
						}
					}, item.desc)
				),
				h(StatusBadge, { active: !!item.enabled })
			),
			h("div", { style: { marginTop: "8px" } },
				h(KeyValueRow, { label: "State", first: true }, item.enabled ? "Enabled" : "Disabled"),
				h(KeyValueRow, { label: "Power Usage" }, String(item.powerusage || 0) + " W")
			),
			!item.critical ? h("div", {
				style: {
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					marginTop: "8px"
				}
			},
				h(Button, {
					icon: "power",
					disabled: !!item.enabled,
					onClick: function () { act("set_component", { ref: item.ref, enabled: 1 }) }
				}, "Enable"),
				h(Button, {
					ghost: true,
					danger: true,
					disabled: !item.enabled,
					onClick: function () { act("set_component", { ref: item.ref, enabled: 0 }) }
				}, "Disable")
			) : null
		)
	}

	function SummaryPanel(props) {
		return h(SectionBlock, { title: props.title }, props.children)
	}

	function ComputerConfigurator() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var hardware = data.hardware || []
		var batteryPercent = Number(data.battery_percent) || 0
		var diskUsed = Number(data.disk_used) || 0
		var diskSize = Number(data.disk_size) || 0
		var diskPercent = diskSize ? Math.round((diskUsed / diskSize) * 100) : 0

		ensureConfiguratorStyles()

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
			h("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "8px"
				}
			},
				h(SummaryPanel, { title: "Power Supply" },
					h(CircularMeter, {
						label: "Battery Charge",
						percent: data.battery_exists ? batteryPercent : 0,
						text: data.battery_exists ? "Battery online" : "Not available",
						color: data.battery_exists ? meterColor(batteryPercent) : THEME.subtle
					}),
					h("div", { style: { marginTop: "8px" } },
						h(KeyValueRow, { label: "Battery", first: true }, data.battery_exists ? "Installed" : "N/A"),
						h(KeyValueRow, { label: "Rating" }, data.battery_exists ? String(data.battery_rating || 0) : "N/A"),
						h(KeyValueRow, { label: "Usage" }, String(data.power_usage || 0) + " W")
					)
				),
				h(SummaryPanel, { title: "File System" },
					h(CircularMeter, {
						label: "Used Capacity",
						percent: diskPercent,
						color: THEME.good,
						text: diskUsed + " / " + diskSize + " GQ"
					}),
					h("div", { style: { marginTop: "8px" } },
						h(KeyValueRow, { label: "Used", first: true }, diskUsed + " GQ"),
						h(KeyValueRow, { label: "Total" }, diskSize + " GQ"),
						h(KeyValueRow, { label: "Load" }, diskPercent + "%")
					)
				)
			),
			h(SectionBlock, { title: "System Configuration" },
				h(KeyValueRow, { label: "Print Language", first: true },
					data.print_language
						? h(Button, {
							ghost: true,
							icon: "pencil",
							onClick: function () { act("edit_language") }
						}, data.print_language)
						: h("span", { style: { color: THEME.bad, fontWeight: "700" } }, "No Printer Installed")
				),
				h(KeyValueRow, { label: "Auto-Updater" }, data.receives_updates ? "Enabled" : "Disabled"),
				h("div", {
					style: {
						display: "flex",
						gap: "6px",
						flexWrap: "wrap",
						marginTop: "8px"
					}
				},
					h(Button, {
						icon: "check",
						disabled: !!data.receives_updates,
						onClick: function () { act("set_updates", { enabled: 1 }) }
					}, "Enable Updates"),
					h(Button, {
						ghost: true,
						danger: true,
						disabled: !data.receives_updates,
						onClick: function () { act("set_updates", { enabled: 0 }) }
					}, "Disable Updates")
				)
			),
			h(SectionBlock, { title: "Computer Components" },
				hardware.length
					? h("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							maxHeight: "100%",
							overflowY: "auto"
						}
					},
						hardware.map(function (item) {
							return h(HardwareRow, { key: item.ref, item: item, act: act })
						})
					)
					: h(EmptyState, {
						title: "No components detected",
						message: "The configurator did not find any controllable computer hardware in this device.",
						compact: true
					})
			)
		)
	}

	SUI.registerInterface("ComputerConfigurator", ComputerConfigurator)
})()
