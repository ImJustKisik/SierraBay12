;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function AlarmCategory(props) {
		var category = props.category
		var alarms = category.alarms || []
		var act = props.act

		return h(SUI.Section, { title: category.category || "Alarms", fill: true, scrollable: true },
			alarms.length
				? alarms.map(function (alarm, index) {
					return h("div", {
						key: (alarm.name || "alarm") + "_" + index,
						style: {
							padding: "8px 10px",
							marginBottom: "8px",
							border: "1px solid rgba(64,98,138,0.25)",
							background: "rgba(0,0,0,0.18)"
						}
					},
						h(SUI.Stack, { gap: "8px", justify: "space-between", wrap: true },
							h("div", null,
								h("div", { style: { fontWeight: "bold", color: "#e9c183" } }, alarm.name),
								alarm.origin_lost
									? h(SUI.NoticeBox, { danger: true }, "Primary origin lost")
									: null,
								alarm.lost_sources
									? h(SUI.NoticeBox, null, "Lost sources: " + alarm.lost_sources)
									: null
							),
							alarm.has_cameras
								? h(SUI.Stack, { gap: "4px", wrap: true },
									(alarm.cameras || []).map(function (camera, cameraIndex) {
										return h(SUI.Tooltip, {
											key: (camera.name || "cam") + "_" + cameraIndex,
											text: "Jump to camera feed."
										},
											h(SUI.Button, {
												icon: "search",
												onClick: function () { act("switch_camera", { camera: camera.camera || camera.ref }) }
											}, camera.name || "Camera")
										)
									})
								)
								: h("span", { className: "average" }, "No camera links")
						)
					)
				})
				: h(SUI.NoticeBox, null, "No active alarms in this category.")
		)
	}

	function AlarmMonitor() {
		var backend = useBackend()
		var data = backend.data || {}
		var categories = data.categories || []
		var stateHook = SUI.useState(categories.length ? categories[0].category : null)
		var activeCategory = stateHook[0]
		var setActiveCategory = stateHook[1]
		var current = null

		categories.forEach(function (entry) {
			if (entry.category === activeCategory || (!activeCategory && !current)) current = entry
		})

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Alarm Classes" },
				h(SUI.Tabs, null,
					categories.map(function (entry) {
						return h(SUI.Tabs.Tab, {
							key: entry.category,
							selected: entry.category === activeCategory,
							onClick: function () { setActiveCategory(entry.category) }
						}, entry.category + " (" + (entry.alarms || []).length + ")")
					})
				)
			),
			h(SUI.Stack.Item, { grow: true },
				current
					? h(AlarmCategory, { category: current, act: backend.act })
					: h(SUI.Section, { title: "Alarm Feed", fill: true },
						h(SUI.NoticeBox, null, "No alarm handlers configured for this monitor.")
					)
			)
		)
	}

	SUI.registerInterface("AlarmMonitor", AlarmMonitor)
})()
