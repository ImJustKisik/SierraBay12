;(function () {
	var h = SUI.h
	var useState = SUI.useState
	var useBackend = SUI.useBackend

	// ── Icon badge for app cards ──────────────────────────────────
	function AppIcon(props) {
		var icon = props.icon || "gear"
		var accent = props.accent || "#40628a"
		var size = props.size || 36

		return h("div", {
			style: {
				width: size + "px",
				height: size + "px",
				lineHeight: size + "px",
				textAlign: "center",
				background: "linear-gradient(135deg, " + accent + ", " + shadeColor(accent, -30) + ")",
				border: "1px solid " + shadeColor(accent, 20),
				flexShrink: "0"
			}
		}, h("span", { class: "uiIcon16 icon-" + icon }))
	}

	function shadeColor(hex, percent) {
		var num = parseInt(hex.replace("#", ""), 16)
		var r = Math.min(255, Math.max(0, (num >> 16) + percent))
		var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
		var b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
	}

	// ── Category icon mapping ─────────────────────────────────────
	function getCategoryIcon(name) {
		var lower = (name || "").toLowerCase()
		if (lower.indexOf("engineer") !== -1) return "wrench"
		if (lower.indexOf("medic") !== -1 || lower.indexOf("health") !== -1) return "heart"
		if (lower.indexOf("secur") !== -1) return "locked"
		if (lower.indexOf("supply") !== -1 || lower.indexOf("cargo") !== -1) return "cart"
		if (lower.indexOf("command") !== -1) return "flag"
		if (lower.indexOf("research") !== -1 || lower.indexOf("scien") !== -1) return "search"
		if (lower.indexOf("ship") !== -1 || lower.indexOf("pilot") !== -1) return "eject"
		return "folder-collapsed"
	}

	function getCategoryAccent(name) {
		var lower = (name || "").toLowerCase()
		if (lower.indexOf("engineer") !== -1) return "#b8860b"
		if (lower.indexOf("medic") !== -1 || lower.indexOf("health") !== -1) return "#2e8b57"
		if (lower.indexOf("secur") !== -1) return "#8b2500"
		if (lower.indexOf("supply") !== -1 || lower.indexOf("cargo") !== -1) return "#8b6914"
		if (lower.indexOf("command") !== -1) return "#22548a"
		if (lower.indexOf("research") !== -1 || lower.indexOf("scien") !== -1) return "#6a2c8b"
		if (lower.indexOf("ship") !== -1 || lower.indexOf("pilot") !== -1) return "#2d6987"
		return "#40628a"
	}

	// ── Storage bar (compact header widget) ───────────────────────
	function StorageBar(props) {
		var used = Number(props.used) || 0
		var total = Number(props.total) || 1
		var pct = Math.round((used / total) * 100)
		var color = pct > 90 ? "#a83232" : pct > 70 ? "#b8860b" : "#355c35"

		return h("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "6px 10px",
				background: "#161616",
				border: "1px solid #333"
			}
		},
			h("span", { class: "uiIcon16 icon-disk", style: { color: "#8ba5c4", flexShrink: "0" } }),
			h("div", { style: { flex: "1", minWidth: "0" } },
				h("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						fontSize: "10px",
						color: "#8ba5c4",
						marginBottom: "3px"
					}
				},
					h("span", null, "STORAGE"),
					h("span", null, used + " / " + total + " GQ  (" + pct + "%)")
				),
				h("div", {
					style: {
						height: "4px",
						background: "#0a0a0a",
						border: "1px solid #333",
						overflow: "hidden"
					}
				},
					h("div", {
						style: {
							height: "100%",
							width: pct + "%",
							background: color,
							transition: "width 0.3s"
						}
					})
				)
			)
		)
	}

	// ── Active download banner ────────────────────────────────────
	function DownloadBanner(props) {
		var data = props.data
		if (!data.downloadname) return null

		var maxSize = Number(data.downloadsize) || 1
		var progress = Number(data.downloadcompletion) || 0
		var pct = Math.round((progress / maxSize) * 100)

		return h("div", {
			style: {
				padding: "8px 10px",
				background: "linear-gradient(90deg, rgba(53,92,53,0.3), rgba(53,92,53,0.05))",
				borderLeft: "3px solid #4a8c4a",
				borderBottom: "1px solid #333"
			}
		},
			h("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "4px"
				}
			},
				h("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
					h("span", { class: "uiIcon16 icon-arrowthickstop-1-s", style: { color: "#4a8c4a" } }),
					h("span", { style: { fontSize: "11px", color: "#cccccc" } }, data.downloadname),
					h("span", {
						style: {
							fontSize: "9px",
							color: "#666",
							padding: "1px 5px",
							border: "1px solid #444",
							background: "#1a1a1a"
						}
					}, data.downloaddesc || "")
				),
				h("span", { style: { fontSize: "10px", color: "#8ba5c4" } }, data.downloadspeed + " GQ/s")
			),
			h("div", {
				style: {
					height: "6px",
					background: "#0a0a0a",
					border: "1px solid #333",
					overflow: "hidden"
				}
			},
				h("div", {
					style: {
						height: "100%",
						width: pct + "%",
						background: "linear-gradient(90deg, #2d5a2d, #4a8c4a)",
						transition: "width 0.5s"
					}
				})
			),
			h("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					marginTop: "3px",
					fontSize: "9px",
					color: "#666"
				}
			},
				h("span", null, progress + " / " + maxSize + " GQ"),
				h("span", null, pct + "%")
			)
		)
	}

	// ── Download queue (collapsible) ──────────────────────────────
	function DownloadQueue(props) {
		var queue = props.queue || []
		var act = props.act
		if (!queue.length) return null

		return h("div", {
			style: {
				borderBottom: "1px solid #333",
				background: "#161616"
			}
		},
			h("div", {
				style: {
					padding: "5px 10px",
					fontSize: "10px",
					color: "#8ba5c4",
					letterSpacing: "0.08em",
					borderBottom: "1px solid #252525",
					display: "flex",
					justifyContent: "space-between"
				}
			},
				h("span", null, "QUEUE"),
				h("span", null, queue.length + " pending")
			),
			queue.map(function (filename, index) {
				return h("div", {
					key: filename + "_" + index,
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "3px 10px",
						fontSize: "11px",
						color: "#999",
						borderBottom: "1px solid #1a1a1a"
					}
				},
					h("span", null,
						h("span", { style: { color: "#555", marginRight: "6px" } }, String(index + 1) + "."),
						filename
					),
					h("div", {
						onClick: function () { act("remove_queued", { filename: filename }) },
						style: {
							cursor: "pointer",
							color: "#664444",
							fontSize: "10px",
							padding: "1px 6px",
							border: "1px solid #333",
							background: "rgba(100,40,40,0.15)"
						}
					}, "\u00D7")
				)
			})
		)
	}

	// ── App card ──────────────────────────────────────────────────
	function AppCard(props) {
		var prog = props.prog
		var act = props.act
		var accent = props.accent || "#40628a"
		var onSelect = props.onSelect

		return h("div", {
			onClick: function () { if (onSelect) onSelect(prog) },
			style: {
				display: "flex",
				alignItems: "flex-start",
				gap: "10px",
				padding: "8px 10px",
				background: "rgba(0,0,0,0.2)",
				border: "1px solid rgba(64,98,138,0.2)",
				cursor: "pointer",
				transition: "border-color 0.15s, background 0.15s"
			},
			onMouseOver: function (e) {
				e.currentTarget.style.borderColor = "rgba(64,98,138,0.6)"
				e.currentTarget.style.background = "rgba(64,98,138,0.08)"
			},
			onMouseOut: function (e) {
				e.currentTarget.style.borderColor = "rgba(64,98,138,0.2)"
				e.currentTarget.style.background = "rgba(0,0,0,0.2)"
			}
		},
			h(AppIcon, { icon: prog.icon || "gear", accent: accent }),
			h("div", { style: { flex: "1", minWidth: "0", overflow: "hidden" } },
				h("div", {
					style: {
						fontSize: "12px",
						fontWeight: "bold",
						color: "#dbe9f8",
						marginBottom: "2px",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis"
					}
				}, prog.filedesc),
				h("div", {
					style: {
						fontSize: "10px",
						color: "#888",
						lineHeight: "1.3",
						display: "-webkit-box",
						WebkitLineClamp: "2",
						WebkitBoxOrient: "vertical",
						overflow: "hidden"
					}
				}, prog.fileinfo || "No description available.")
			),
			h("div", {
				style: {
					flexShrink: "0",
					textAlign: "right",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					gap: "4px"
				}
			},
				h("span", {
					style: {
						fontSize: "9px",
						color: "#666",
						padding: "1px 6px",
						border: "1px solid #333",
						background: "#1a1a1a"
					}
				}, prog.size + " GQ"),
				h("div", {
					onClick: function (e) {
						e.stopPropagation()
						act("download_file", { filename: prog.filename })
					},
					style: {
						fontSize: "10px",
						fontWeight: "bold",
						color: "#4a8c4a",
						padding: "2px 10px",
						border: "1px solid #355c35",
						background: "rgba(53,92,53,0.15)",
						cursor: "pointer",
						letterSpacing: "0.05em",
						textTransform: "uppercase"
					},
					onMouseOver: function (e) {
						e.currentTarget.style.background = "rgba(53,92,53,0.35)"
					},
					onMouseOut: function (e) {
						e.currentTarget.style.background = "rgba(53,92,53,0.15)"
					}
				}, "GET")
			)
		)
	}

	// ── App detail modal ──────────────────────────────────────────
	function AppDetail(props) {
		var prog = props.prog
		var act = props.act
		var accent = props.accent || "#40628a"
		var onClose = props.onClose

		if (!prog) return null

		return h(SUI.Modal, {
			open: true,
			title: prog.filedesc,
			onClose: onClose,
			width: "380px"
		},
			h("div", { style: { display: "flex", gap: "12px", marginBottom: "12px" } },
				h(AppIcon, { icon: prog.icon || "gear", accent: accent, size: 48 }),
				h("div", null,
					h("div", {
						style: { fontWeight: "bold", fontSize: "14px", color: "#dbe9f8", marginBottom: "4px" }
					}, prog.filedesc),
					h("div", { style: { fontSize: "10px", color: "#666" } }, prog.filename + ".prg")
				)
			),
			h("div", {
				style: {
					padding: "10px",
					background: "#1a1a1a",
					border: "1px solid #333",
					marginBottom: "12px",
					fontSize: "11px",
					lineHeight: "1.5",
					color: "#aaa"
				}
			}, prog.fileinfo || "No description available."),
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Size" }, prog.size + " GQ"),
				h(SUI.LabeledList.Item, { label: "Source" }, "NTNet Software Repository")
			),
			h("div", { style: { marginTop: "12px", display: "flex", gap: "8px" } },
				h(SUI.Button, {
					icon: "arrowthickstop-1-s",
					fluid: true,
					onClick: function () {
						act("download_file", { filename: prog.filename })
						onClose()
					},
					style: { background: "rgba(53,92,53,0.3)", borderColor: "#355c35" }
				}, "Install"),
				h(SUI.Button, {
					fluid: true,
					onClick: onClose
				}, "Cancel")
			)
		)
	}

	// ── Hacked app card (distinct styling) ────────────────────────
	function HackedAppCard(props) {
		var prog = props.prog
		var act = props.act
		var onSelect = props.onSelect

		return h("div", {
			onClick: function () { if (onSelect) onSelect(prog) },
			style: {
				display: "flex",
				alignItems: "flex-start",
				gap: "10px",
				padding: "8px 10px",
				background: "rgba(100,30,0,0.1)",
				border: "1px solid rgba(180,80,0,0.25)",
				cursor: "pointer",
				transition: "border-color 0.15s, background 0.15s"
			},
			onMouseOver: function (e) {
				e.currentTarget.style.borderColor = "rgba(180,80,0,0.6)"
				e.currentTarget.style.background = "rgba(100,30,0,0.2)"
			},
			onMouseOut: function (e) {
				e.currentTarget.style.borderColor = "rgba(180,80,0,0.25)"
				e.currentTarget.style.background = "rgba(100,30,0,0.1)"
			}
		},
			h(AppIcon, { icon: prog.icon || "notice", accent: "#8b3a00" }),
			h("div", { style: { flex: "1", minWidth: "0", overflow: "hidden" } },
				h("div", {
					style: {
						fontSize: "12px",
						fontWeight: "bold",
						color: "#e9a060",
						marginBottom: "2px",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis"
					}
				}, prog.filedesc),
				h("div", {
					style: {
						fontSize: "10px",
						color: "#886644",
						lineHeight: "1.3",
						display: "-webkit-box",
						WebkitLineClamp: "2",
						WebkitBoxOrient: "vertical",
						overflow: "hidden"
					}
				}, prog.fileinfo || "Unknown program.")
			),
			h("div", {
				style: {
					flexShrink: "0",
					textAlign: "right",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					gap: "4px"
				}
			},
				h("span", {
					style: {
						fontSize: "9px",
						color: "#886644",
						padding: "1px 6px",
						border: "1px solid #553320",
						background: "rgba(80,30,0,0.3)"
					}
				}, prog.size + " GQ"),
				h("div", {
					onClick: function (e) {
						e.stopPropagation()
						act("download_file", { filename: prog.filename })
					},
					style: {
						fontSize: "10px",
						fontWeight: "bold",
						color: "#cd6500",
						padding: "2px 10px",
						border: "1px solid #553320",
						background: "rgba(80,30,0,0.2)",
						cursor: "pointer",
						letterSpacing: "0.05em",
						textTransform: "uppercase"
					},
					onMouseOver: function (e) {
						e.currentTarget.style.background = "rgba(80,30,0,0.4)"
					},
					onMouseOut: function (e) {
						e.currentTarget.style.background = "rgba(80,30,0,0.2)"
					}
				}, "GET")
			)
		)
	}

	// ── Category tab bar ──────────────────────────────────────────
	function CategoryTabs(props) {
		var categories = props.categories || []
		var selected = props.selected
		var onSelect = props.onSelect
		var hasHacked = props.hasHacked

		var allTabs = []

		// "All" tab
		allTabs.push({ key: "__all", label: "All", icon: "folder-collapsed" })

		for (var i = 0; i < categories.length; i++) {
			var cat = categories[i]
			allTabs.push({
				key: cat.category,
				label: cat.category,
				icon: getCategoryIcon(cat.category)
			})
		}

		if (hasHacked) {
			allTabs.push({ key: "__hacked", label: "???", icon: "notice" })
		}

		return h("div", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				gap: "0",
				borderBottom: "1px solid #333",
				background: "#141414"
			}
		},
			allTabs.map(function (tab) {
				var isSel = tab.key === selected
				return h("div", {
					key: tab.key,
					onClick: function () { onSelect(tab.key) },
					style: {
						padding: "6px 12px",
						cursor: "pointer",
						fontSize: "11px",
						color: isSel ? "#ffffff" : "#777",
						background: isSel ? "#252525" : "transparent",
						borderBottom: isSel ? "2px solid #40628a" : "2px solid transparent",
						display: "flex",
						alignItems: "center",
						gap: "4px",
						transition: "color 0.15s, background 0.15s",
						userSelect: "none"
					},
					onMouseOver: function (e) {
						if (!isSel) e.currentTarget.style.color = "#aaa"
					},
					onMouseOut: function (e) {
						if (!isSel) e.currentTarget.style.color = "#777"
					}
				},
					h("span", { class: "uiIcon16 icon-" + tab.icon, style: { opacity: isSel ? "1" : "0.5" } }),
					tab.label
				)
			})
		)
	}

	// ── Main component ────────────────────────────────────────────
	function NTNetDownloader() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		var tabState = useState("__all")
		var selectedTab = tabState[0]
		var setSelectedTab = tabState[1]

		var detailState = useState(null)
		var detailProg = detailState[0]
		var setDetailProg = detailState[1]

		var categories = data.downloadable_programs || []
		var hackedPrograms = data.hackedavailable ? (data.hacked_programs || []) : []
		var diskSize = Number(data.disk_size) || 0
		var diskUsed = Number(data.disk_used) || 0
		var queue = data.downloads_queue || []

		// Error overlay
		if (data.error) {
			return h("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					padding: "40px 20px",
					textAlign: "center"
				}
			},
				h("div", {
					style: {
						width: "48px",
						height: "48px",
						lineHeight: "48px",
						textAlign: "center",
						border: "2px solid #a83232",
						color: "#ff5555",
						fontSize: "24px",
						fontWeight: "bold",
						marginBottom: "16px"
					}
				}, "!"),
				h("div", {
					style: {
						fontSize: "14px",
						fontWeight: "bold",
						color: "#ff5555",
						marginBottom: "8px",
						letterSpacing: "0.1em",
						textTransform: "uppercase"
					}
				}, "Download Error"),
				h("div", {
					style: {
						fontSize: "11px",
						color: "#aa8888",
						maxWidth: "400px",
						lineHeight: "1.5",
						marginBottom: "20px"
					}
				}, data.error),
				h(SUI.Button, {
					icon: "refresh",
					onClick: function () { act("reset_error") }
				}, "Reset Program")
			)
		}

		// Build filtered program list
		var displayPrograms = []
		var displayAccent = "#40628a"
		var showHacked = false

		if (selectedTab === "__all") {
			for (var ci = 0; ci < categories.length; ci++) {
				var catEntry = categories[ci]
				var progs = catEntry.programs || []
				for (var pi = 0; pi < progs.length; pi++) {
					displayPrograms.push({
						prog: progs[pi],
						accent: getCategoryAccent(catEntry.category)
					})
				}
			}
		} else if (selectedTab === "__hacked") {
			showHacked = true
		} else {
			for (var ci2 = 0; ci2 < categories.length; ci2++) {
				if (categories[ci2].category === selectedTab) {
					displayAccent = getCategoryAccent(selectedTab)
					var catProgs = categories[ci2].programs || []
					for (var pi2 = 0; pi2 < catProgs.length; pi2++) {
						displayPrograms.push({
							prog: catProgs[pi2],
							accent: displayAccent
						})
					}
					break
				}
			}
		}

		// Count total programs
		var totalCount = 0
		for (var ti = 0; ti < categories.length; ti++) {
			totalCount += (categories[ti].programs || []).length
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden"
			}
		},
			// Storage bar
			h(StorageBar, { used: diskUsed, total: diskSize }),

			// Active download
			h(DownloadBanner, { data: data }),

			// Download queue
			h(DownloadQueue, { queue: queue, act: act }),

			// Category tabs
			h(CategoryTabs, {
				categories: categories,
				selected: selectedTab,
				onSelect: setSelectedTab,
				hasHacked: data.hackedavailable
			}),

			// Category header
			h("div", {
				style: {
					padding: "6px 10px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: "1px solid #252525",
					background: "#1a1a1a"
				}
			},
				h("span", {
					style: {
						fontSize: "10px",
						color: "#8ba5c4",
						letterSpacing: "0.08em",
						textTransform: "uppercase"
					}
				}, selectedTab === "__all" ? "All Programs"
					: selectedTab === "__hacked" ? "Unknown Repository"
					: selectedTab),
				h("span", {
					style: { fontSize: "10px", color: "#555" }
				}, showHacked
					? hackedPrograms.length + " available"
					: (selectedTab === "__all" ? totalCount : displayPrograms.length) + " available"
				)
			),

			// App list (scrollable)
			h("div", {
				style: {
					flex: "1",
					overflowY: "auto",
					overflowX: "hidden"
				}
			},
				showHacked ? (
					hackedPrograms.length
						? h("div", null,
							h("div", {
								style: {
									padding: "6px 10px",
									fontSize: "10px",
									color: "#886644",
									background: "rgba(80,30,0,0.15)",
									borderBottom: "1px solid #553320"
								}
							}, "\u26A0 NanoTrasen does not endorse software from unverified sources. Install at your own risk."),
							h("div", {
								style: { display: "flex", flexDirection: "column", gap: "1px" }
							},
								hackedPrograms.map(function (prog) {
									return h(HackedAppCard, {
										key: prog.filename,
										prog: prog,
										act: act,
										onSelect: function (p) { setDetailProg({ prog: p, accent: "#8b3a00" }) }
									})
								})
							)
						)
						: h("div", {
							style: {
								padding: "40px 20px",
								textAlign: "center",
								color: "#555",
								fontSize: "11px"
							}
						}, "No software available from unknown sources.")
				) : (
					displayPrograms.length
						? h("div", {
							style: { display: "flex", flexDirection: "column", gap: "1px" }
						},
							displayPrograms.map(function (item) {
								return h(AppCard, {
									key: item.prog.filename,
									prog: item.prog,
									act: act,
									accent: item.accent,
									onSelect: function (p) { setDetailProg({ prog: p, accent: item.accent }) }
								})
							})
						)
						: h("div", {
							style: {
								padding: "40px 20px",
								textAlign: "center",
								color: "#555",
								fontSize: "11px"
							}
						}, "No software available in this category.")
				)
			),

			// Detail modal
			detailProg ? h(AppDetail, {
				prog: detailProg.prog,
				act: act,
				accent: detailProg.accent,
				onClose: function () { setDetailProg(null) }
			}) : null
		)
	}

	SUI.registerInterface("NTNetDownloader", NTNetDownloader)
})()
