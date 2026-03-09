;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function Revelation() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var armed = !!data.armed

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Payload Status" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Current state" }, armed ? "ARMED" : "DISARMED")
				)
			),
			h(SUI.Section, { title: "Controls", fill: true },
				h(SUI.Stack, { vertical: true, gap: "8px" },
					h(SUI.Button, {
						icon: "pencil",
						onClick: function () { act("obfuscate") }
					}, "Obfuscate Program Name"),
					h(SUI.Button, {
						icon: armed ? "shield" : "warning",
						selected: armed,
						onClick: function () { act("arm") }
					}, armed ? "Disarm" : "Arm"),
					h(SUI.Button, {
						icon: "radiation",
						disabled: !armed,
						onClick: function () { act("activate") }
					}, "Activate")
				)
			)
		)
	}

	SUI.registerInterface("Revelation", Revelation)
})()
