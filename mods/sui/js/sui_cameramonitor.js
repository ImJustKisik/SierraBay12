;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var useState = SUI.useState
	var useEffect = SUI.useEffect
	var useRef = SUI.useRef
	var NTOS = SUI.NTOS
	var THEME = NTOS.themeWith({
		cardBackgroundActive: "#16202b",
		cardBorderActive: "#314a66",
		feedBackground: "#0e141b"
	})
	var SectionBlock = NTOS.SectionBlock
	var Button = NTOS.Button
	var KeyValueRow = NTOS.KeyValueRow
	var StatusBadge = NTOS.StatusBadge
	var EmptyState = NTOS.EmptyState

	function ensureCameraMonitorStyles() {
		NTOS.ensureStyles()
		if (typeof document === "undefined" || document.getElementById("sui-cameramonitor-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-cameramonitor-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiCameraMonitorRow{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiCameraMonitorRow:hover{background:" + THEME.rowHover + ";}" +
			".suiCameraMonitorLabel{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
			".suiCameraMonitorMeta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function FillSection(props) {
		return h("section", {
			style: {
				background: THEME.panelBackground,
				border: "1px solid " + THEME.panelBorder,
				padding: "10px 12px",
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
				height: "100%",
				boxSizing: "border-box"
			}
		},
			h("div", {
				style: {
					marginBottom: "10px",
					display: "flex",
					alignItems: "center",
					gap: "10px",
					color: THEME.title,
					fontSize: "11px",
					fontWeight: "500",
					letterSpacing: "0.16em",
					textTransform: "uppercase",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			},
				h("div", { style: { height: "1px", flex: "1 1 auto", background: THEME.panelBorder } }),
				h("div", { style: { flex: "0 0 auto", textAlign: "center" } }, props.title),
				h("div", { style: { height: "1px", flex: "1 1 auto", background: THEME.panelBorder } })
			),
			h("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					minHeight: "0",
					flex: "1 1 auto"
				}
			}, props.children)
		)
	}

	function ViewModeBar(props) {
		var page = props.page
		var setPage = props.setPage
		var camerasLocked = props.camerasLocked
		return h("div", {
			style: {
				display: "flex",
				gap: "6px",
				flexWrap: "wrap"
			}
		},
			h(Button, {
				ghost: page !== "networks",
				onClick: function () { setPage("networks") }
			}, "Networks"),
			h(Button, {
				ghost: page !== "cameras",
				disabled: camerasLocked,
				onClick: function () { setPage("cameras") }
			}, "Cameras")
		)
	}

	function RowLabel(props) {
		return h("div", {
			style: {
				minWidth: "0",
				display: "flex",
				flexDirection: "column",
				gap: "4px"
			}
		},
			h("div", {
				class: "suiCameraMonitorLabel",
				style: {
					color: THEME.text,
					fontSize: "13px",
					fontWeight: "600",
					lineHeight: "16px",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, props.title),
			props.meta ? h("div", {
				class: "suiCameraMonitorMeta",
				style: {
					color: THEME.muted,
					fontSize: "11px",
					lineHeight: "14px",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, props.meta) : null
		)
	}

	function NetworkRows(props) {
		var networks = props.networks || []
		var currentNetwork = props.currentNetwork
		var act = props.act
		var setPage = props.setPage

		if (!networks.length) {
			return h(EmptyState, {
				title: "No networks found",
				message: "This device cannot see any camera networks right now.",
				compact: true
			})
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
				overflowY: "auto",
				border: "1px solid " + THEME.rowBorder,
				background: "transparent"
			}
		},
			networks.map(function (net, index) {
				var selected = net.tag === currentNetwork
				var accessible = !!net.has_access
				return h("div", {
					key: net.tag,
					class: "suiCameraMonitorRow",
					style: {
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) 100px 86px",
						columnGap: "10px",
						alignItems: "center",
						padding: "8px 10px",
						borderTop: index ? "1px solid " + THEME.rowBorder : "none",
						borderLeft: "2px solid " + (selected ? THEME.title : "transparent"),
						background: selected ? THEME.cardBackgroundActive : THEME.cardBackground
					}
				},
					h(RowLabel, {
						title: net.tag,
						meta: accessible ? "Accessible network" : "Access restricted"
					}),
					h("div", {
						style: {
							display: "flex",
							justifyContent: "flex-start"
						}
					},
						h(StatusBadge, {
							active: accessible,
							activeLabel: "Access",
							inactiveLabel: "Locked",
							activeColor: THEME.good,
							inactiveColor: THEME.bad,
							activeTextColor: "#d1fae5"
						})
					),
					h("div", {
						style: {
							display: "flex",
							justifyContent: "flex-end"
						}
					},
						h(Button, {
							ghost: !selected,
							disabled: !accessible,
							onClick: function () {
								if (!accessible) {
									return
								}
								act("switch_network", { switch_network: net.tag })
								setPage("cameras")
							}
						}, selected ? "Active" : "Open")
					)
				)
			})
		)
	}

	function CameraRows(props) {
		var currentNetwork = props.currentNetwork
		var cameras = props.cameras || []
		var currentCamera = props.currentCamera
		var act = props.act

		if (!currentNetwork) {
			return h(EmptyState, {
				title: "No network selected",
				message: "Choose a camera network first, then open the camera list.",
				compact: true
			})
		}

		if (!cameras.length) {
			return h(EmptyState, {
				title: "No cameras found",
				message: "This network does not currently expose any reachable cameras.",
				compact: true
			})
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
				overflowY: "auto",
				border: "1px solid " + THEME.rowBorder,
				background: "transparent"
			}
		},
			cameras.map(function (cam, index) {
				var selected = currentCamera && currentCamera.name === cam.name
				return h("div", {
					key: (cam.camera || cam.ref || cam.name || "camera") + "_" + index,
					class: "suiCameraMonitorRow",
					style: {
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) 86px",
						columnGap: "10px",
						alignItems: "center",
						padding: "8px 10px",
						borderTop: index ? "1px solid " + THEME.rowBorder : "none",
						borderLeft: "2px solid " + (selected ? THEME.title : "transparent"),
						background: selected ? THEME.cardBackgroundActive : THEME.cardBackground
					}
				},
					h(RowLabel, {
						title: cam.name || "Unknown Camera",
						meta: selected ? "Live feed selected" : ("Network: " + currentNetwork)
					}),
					h("div", {
						style: {
							display: "flex",
							justifyContent: "flex-end"
						}
					},
						h(Button, {
							ghost: !selected,
							onClick: function () {
								act("switch_camera", { switch_camera: cam.camera || cam.ref })
							}
						}, selected ? "Live" : "View")
					)
				)
			})
		)
	}

	function ConnectionPanel(props) {
		var currentNetwork = props.currentNetwork
		var currentCamera = props.currentCamera
		var cameras = props.cameras || []
		var act = props.act
		var networkTitle = currentNetwork || "No network selected"
		var cameraTitle = currentCamera ? currentCamera.name : "No active feed"

		return h(SectionBlock, { title: "Connection" },
			h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "10px",
					marginBottom: "8px",
					flexWrap: "wrap"
				}
			},
				h(StatusBadge, {
					active: !!currentCamera,
					activeLabel: "Live feed",
					inactiveLabel: "Standby",
					activeColor: THEME.good,
					inactiveColor: THEME.subtle,
					activeTextColor: "#d1fae5"
				}),
				currentCamera ? h(Button, {
					ghost: true,
					danger: true,
					icon: "power-button",
					onClick: function () { act("reset") }
				}, "Disconnect") : null
			),
			h(KeyValueRow, { label: "Network", first: true }, networkTitle),
			h(KeyValueRow, { label: "Camera" }, cameraTitle),
			h(KeyValueRow, { label: "Visible" }, String(cameras.length || 0))
		)
	}

	function EmbeddedFeedViewport(props) {
		var viewportRef = useRef(null)
		var lastRectRef = useRef(null)
		var act = props.act
		var mapRef = props.mapRef || ""
		var visible = !!(props.visible && mapRef)

		function getUiPixelScale() {
			if (typeof window.devicePixelRatio === "number" && window.devicePixelRatio > 0.5) {
				return window.devicePixelRatio
			}

			if (window.screen && window.screen.deviceXDPI && window.screen.logicalXDPI) {
				var legacyRatio = window.screen.deviceXDPI / window.screen.logicalXDPI
				if (legacyRatio > 0.5) {
					return legacyRatio
				}
			}

			return 1
		}

		function syncBounds() {
			if (!viewportRef.current || typeof act !== "function") {
				return
			}

			var rect = viewportRef.current.getBoundingClientRect()
			var scale = getUiPixelScale()
			var documentElement = document.documentElement || {}
			var body = document.body || {}
			var viewportWidth = window.innerWidth || documentElement.clientWidth || body.clientWidth || rect.right
			var viewportHeight = window.innerHeight || documentElement.clientHeight || body.clientHeight || rect.bottom
			var nextRect = {
				map_ref: mapRef,
				visible: visible ? 1 : 0,
				x: Math.round(rect.left * scale),
				y: Math.round(rect.top * scale),
				width: Math.ceil(rect.width * scale),
				height: Math.ceil(rect.height * scale),
				window_width: Math.ceil(viewportWidth * scale),
				window_height: Math.ceil(viewportHeight * scale)
			}

			if (nextRect.width <= 0 || nextRect.height <= 0) {
				return
			}

			var lastRect = lastRectRef.current
			if (lastRect
				&& lastRect.map_ref === nextRect.map_ref
				&& lastRect.visible === nextRect.visible
				&& lastRect.x === nextRect.x
				&& lastRect.y === nextRect.y
				&& lastRect.width === nextRect.width
				&& lastRect.height === nextRect.height
				&& lastRect.window_width === nextRect.window_width
				&& lastRect.window_height === nextRect.window_height) {
				return
			}

			lastRectRef.current = nextRect
			act("sync_feed_map", nextRect)
		}

		useEffect(function () {
			var scheduledSync = 0

			function requestSync() {
				if (scheduledSync) {
					return
				}
				if (window.requestAnimationFrame) {
					scheduledSync = window.requestAnimationFrame(function () {
						scheduledSync = 0
						syncBounds()
					})
					return
				}
				scheduledSync = window.setTimeout(function () {
					scheduledSync = 0
					syncBounds()
				}, 0)
			}

			var firstTimer = window.setTimeout(requestSync, 0)
			var secondTimer = window.setTimeout(requestSync, 100)
			var interval = window.setInterval(syncBounds, 500)

			function handleResize() {
				requestSync()
			}

			function handleScroll() {
				requestSync()
			}

			window.addEventListener("resize", handleResize)
			document.addEventListener("scroll", handleScroll, true)

			return function () {
				window.clearTimeout(firstTimer)
				window.clearTimeout(secondTimer)
				window.clearInterval(interval)
				window.removeEventListener("resize", handleResize)
				document.removeEventListener("scroll", handleScroll, true)
				if (scheduledSync) {
					if (window.cancelAnimationFrame && window.requestAnimationFrame) {
						window.cancelAnimationFrame(scheduledSync)
					} else {
						window.clearTimeout(scheduledSync)
					}
				}
			}
		}, [act, mapRef, visible])

		return h("div", {
			ref: viewportRef,
			style: {
				position: "relative",
				width: "100%",
				height: "100%",
				minHeight: "220px",
				overflow: "hidden"
			},
			"data-camera-map-ref": mapRef || null
		},
			visible ? null : h("div", {
				style: {
					position: "absolute",
					inset: "0",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "12px",
					boxSizing: "border-box",
					textAlign: "center",
					color: THEME.muted,
					fontSize: "12px",
					lineHeight: "18px",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, props.inactiveMessage || "No camera selected. Choose a network and camera to begin.")
		)
	}

	function FeedPanel(props) {
		var currentNetwork = props.currentNetwork
		var currentCamera = props.currentCamera
		var mapActive = props.mapActive
		var mapRef = props.mapRef
		var act = props.act

		return h(FillSection, { title: "Camera Feed" },
			h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "10px",
					marginBottom: "10px",
					flexWrap: "wrap"
				}
			},
				h("div", {
					style: {
						color: THEME.subtle,
						fontSize: "10px",
						fontWeight: "500",
						letterSpacing: "0.12em",
						textTransform: "uppercase",
						fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
					}
				}, "Network: " + (currentNetwork || "Offline")),
				h("div", {
					style: {
						color: currentCamera ? THEME.text : THEME.muted,
						fontSize: "11px",
						fontWeight: "600",
						fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
					}
				}, currentCamera ? currentCamera.name : "No active camera")
			),
			h("div", {
				style: {
					border: "1px solid " + THEME.rowBorder,
					background: THEME.feedBackground,
					minHeight: "0",
					flex: "1 1 auto"
				}
			},
				h(EmbeddedFeedViewport, {
					act: act,
					mapRef: mapRef,
					visible: mapActive,
					inactiveMessage: "No camera selected. Choose a network and camera to begin."
				})
			)
		)
	}

	function CameraMonitor() {
		ensureCameraMonitorStyles()

		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var networks = data.networks || []
		var cameras = data.cameras || []
		var currentNetwork = data.current_network
		var currentCamera = data.current_camera
		var mapRef = data.map_ref
		var mapActive = !!currentCamera
		var pageState = useState(currentNetwork ? "cameras" : "networks")
		var page = pageState[0]
		var setPage = pageState[1]

		useEffect(function () {
			if (!currentNetwork && page === "cameras") {
				setPage("networks")
			}
		}, [currentNetwork, page])

		return h("div", {
			style: {
				height: "100%",
				minHeight: "0",
				padding: "8px",
				boxSizing: "border-box",
				background: THEME.pageBackground,
				overflow: "hidden"
			}
		},
			h("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "320px minmax(0, 1fr)",
					gap: "12px",
					height: "100%",
					minHeight: "0"
				}
			},
				h("div", {
					style: {
						display: "grid",
						gridTemplateRows: "auto minmax(0, 1fr)",
						gap: "12px",
						minHeight: "0"
					}
				},
					h(SectionBlock, { title: "Navigator" },
						h(ViewModeBar, {
							page: page,
							setPage: setPage,
							camerasLocked: !currentNetwork
						}),
						h("div", { style: { marginTop: "10px" } },
							h(KeyValueRow, { label: "Network", first: true }, currentNetwork || "Not selected"),
							h(KeyValueRow, { label: "Cameras" }, String(cameras.length || 0))
						)
					),
					h(FillSection, { title: page === "networks" ? "Networks" : "Cameras" },
						page === "networks"
							? h(NetworkRows, {
								networks: networks,
								currentNetwork: currentNetwork,
								act: act,
								setPage: setPage
							})
							: h(CameraRows, {
								currentNetwork: currentNetwork,
								cameras: cameras,
								currentCamera: currentCamera,
								act: act
							})
					)
				),
				h("div", {
					style: {
						display: "grid",
						gridTemplateRows: "auto minmax(0, 1fr)",
						gap: "12px",
						minHeight: "0"
					}
				},
					h(ConnectionPanel, {
						currentNetwork: currentNetwork,
						currentCamera: currentCamera,
						cameras: cameras,
						act: act
					}),
					h(FeedPanel, {
						currentNetwork: currentNetwork,
						currentCamera: currentCamera,
						mapActive: mapActive,
						mapRef: mapRef,
						act: act
					})
				)
			)
		)
	}

	SUI.registerInterface("CameraMonitor", CameraMonitor)
})()
