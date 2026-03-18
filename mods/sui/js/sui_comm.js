;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	var STATE_DEFAULT = 1
	var STATE_MESSAGELIST = 2
	var STATE_VIEWMESSAGE = 3
	var STATE_STATUSDISPLAY = 4
	var STATE_ALERT_LEVEL = 5

	function MainMenu(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Command" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, {
						onClick: function () { act("announce") },
						disabled: data.isAI || !data.net_comms
					}, "Make An Announcement"),
					h(SUI.Button, {
						onClick: function () { act("sw_menu", { target: STATE_ALERT_LEVEL }) },
						disabled: data.isAI || !data.net_syscont || !data.net_comms
					}, "Change Alert Level"),
					h(SUI.Button, {
						onClick: function () { act("sw_menu", { target: STATE_STATUSDISPLAY }) },
						disabled: !data.net_syscont
					}, "Set Status Display")
				)
			),
			h(SUI.Section, { title: "Communications" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, {
						onClick: function () { act("sw_menu", { target: STATE_MESSAGELIST }) },
						disabled: !data.net_comms
					}, "Message List"),
					h(SUI.Button, {
						onClick: function () { act("message", { target: data.emagged ? "emagged" : "regular" }) },
						disabled: data.isAI || !data.net_comms
					}, data.emagged ? "Send Emergency Message To [UNKNOWN]" : "Send Emergency Message To " + (data.boss_short || "Central Command"))
				)
			),
			h(SUI.Section, { title: "Additional", fill: true, scrollable: true },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("unbolt_doors") } }, "Unbolt Saferoom Doors"),
					h(SUI.Button, { onClick: function () { act("bolt_doors") } }, "Bolt Saferoom Doors")
				),
				h("div", { style: { marginTop: "8px", fontWeight: "bold" } }, "Evacuation"),
				h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "6px" } },
					(data.evac_options || []).length ? (data.evac_options || []).map(function (option) {
						return h(SUI.Button, {
							key: option.option_target,
							onClick: function () { act("evac", { target: option.option_target }) },
							disabled: (option.needs_syscontrol && !data.net_syscont) || (!option.silicon_allowed && data.isAI)
						}, option.option_text)
					}) : h(SUI.NoticeBox, { danger: true }, "No further options currently available.")
				)
			)
		)
	}

	function MessageList(props) {
		var data = props.data
		var act = props.act
		var messages = data.messages || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Messages", fill: true, scrollable: true },
				messages.length ? messages.map(function (message) {
					return h("div", { key: message.id, style: { marginBottom: "6px" } },
						h(SUI.ActionLink, {
							onClick: function () { act("viewmessage", { target: message.id }) }
						}, message.title)
					)
				}) : h(SUI.NoticeBox, null, "There are no messages.")
			),
			h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("sw_menu", { target: STATE_DEFAULT }) } }, "Back")
		)
	}

	function MessageView(props) {
		var data = props.data
		var act = props.act
		var current = data.message_current || {}

		return h(SUI.Section, { title: current.title || "Message", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Title" }, current.title || "Unknown"),
				h(SUI.LabeledList.Item, { label: "Contents" }, current.contents || "")
			),
			h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
				data.have_printer ? h(SUI.Button, { icon: "print", onClick: function () { act("printmessage") } }, "Print") : null,
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("sw_menu", { target: STATE_MESSAGELIST }) } }, "Back")
			)
		)
	}

	function StatusDisplayView(props) {
		var data = props.data
		var act = props.act
		var imageActions = [
			{ label: "EC Logo", image: "default" },
			{ label: "Current Security Level", target: "alert" },
			{ label: "EVA Ban", image: "eva_ban" },
			{ label: "Lockdown", image: "lockdown" },
			{ label: "Medical", image: "medical" },
			{ label: "Biohazard", image: "biohazard" },
			{ label: "Radiation", image: "radiation" },
			{ label: "Internals", image: "internals" },
			{ label: "Evacuation", image: "evacuation" }
		]

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "General" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("setstatus", { target: "blank" }) } }, "Clear"),
					h(SUI.Button, { onClick: function () { act("setstatus", { target: "time" }) } }, "Local Time"),
					h(SUI.Button, { onClick: function () { act("setstatus", { target: "shuttle" }) } }, "Evacuation ETA"),
					h(SUI.Button, { onClick: function () { act("setstatus", { target: "message" }) } }, "Message")
				)
			),
			h(SUI.Section, { title: "Message" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Line 1" },
						h(SUI.ActionLink, { onClick: function () { act("setstatus", { target: "line1" }) } }, data.message_line1 || "(none)")
					),
					h(SUI.LabeledList.Item, { label: "Line 2" },
						h(SUI.ActionLink, { onClick: function () { act("setstatus", { target: "line2" }) } }, data.message_line2 || "(none)")
					)
				)
			),
			h(SUI.Section, { title: "Alert" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					imageActions.map(function (entry) {
						return h(SUI.Button, {
							key: entry.label,
							onClick: function () {
								act("setstatus", entry.target ? { target: entry.target } : { target: "image", image: entry.image })
							}
						}, entry.label)
					})
				)
			),
			h(SUI.Section, { title: "Border" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("toggle_alert_border") } }, "Toggle"),
					h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("sw_menu", { target: STATE_DEFAULT }) } }, "Back")
				)
			)
		)
	}

	function AlertLevelView(props) {
		var data = props.data
		var act = props.act
		var levels = data.security_levels || []

		return h(SUI.Section, { title: "Security Level", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Current" }, data.current_security_level_title || "Unknown")
			),
			data.cannot_change_security_level
				? h(SUI.NoticeBox, { danger: true }, "The self-destruct mechanism is active! Find a way to deactivate the mechanism, or evacuate.")
				: data.current_security_level_is_high_security_level
					? h(SUI.NoticeBox, { danger: true }, "This emergency may not be resolved from this system! Utilise the authentication devices.")
					: h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
						levels.map(function (level) {
							return h(SUI.Button, {
								key: level.ref,
								onClick: function () { act("setalert", { target: level.ref }) },
								disabled: data.current_security_level_ref === level.ref || data.isAI
							}, level.title)
						})
					),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("sw_menu", { target: STATE_DEFAULT }) } }, "Back")
			)
		)
	}

	function Comm() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (!data.authenticated) {
			return h(SUI.Section, { title: "Command Console", fill: true },
				h(SUI.NoticeBox, { danger: true }, "You are unauthorised.")
			)
		}

		if (data.state === STATE_MESSAGELIST) {
			return h(MessageList, { data: data, act: act })
		}
		if (data.state === STATE_VIEWMESSAGE) {
			return h(MessageView, { data: data, act: act })
		}
		if (data.state === STATE_STATUSDISPLAY) {
			return h(StatusDisplayView, { data: data, act: act })
		}
		if (data.state === STATE_ALERT_LEVEL) {
			return h(AlertLevelView, { data: data, act: act })
		}
		return h(MainMenu, { data: data, act: act })
	}

	SUI.registerInterface("Comm", Comm)
})()
