;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function SkillFail(props) {
		var rows = props.rows || []
		return h(SUI.Section, { title: "Diagnostic Noise", fill: true, scrollable: true },
			rows.map(function (entry, index) {
				return h("div", { key: index, style: { marginBottom: "6px" } },
					h("b", null, entry.key),
					h("div", null, entry.value)
				)
			})
		)
	}

	function AIDiag() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var laws = data.ai_laws || []

		if (data.error) {
			return h(SUI.Section, { title: "AI Link Error", fill: true },
				h(SUI.NoticeBox, { danger: true }, data.error)
			)
		}

		if (data.skill_fail) {
			return h(SkillFail, { rows: data.skill_fail })
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "System Status" },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Current AI" }, data.ai_name || "Unknown"),
					h(SUI.LabeledList.Item, { label: "Status" }, data.ai_isdead ? "Nonfunctional" : "Functional"),
					h(SUI.LabeledList.Item, { label: "System integrity" },
						h(SUI.ProgressBar, {
							value: Number(data.ai_integrity) || 0,
							min: 0,
							max: 100,
							color: data.ai_integrity === 100 ? "good" : (data.ai_integrity >= 50 ? "average" : "bad"),
							showText: String(data.ai_integrity || 0) + "%"
						})
					),
					h(SUI.LabeledList.Item, { label: "Capacitor status" },
						h(SUI.ProgressBar, {
							value: Number(data.ai_capacitor) || 0,
							min: 0,
							max: 100,
							color: data.ai_capacitor === 100 ? "good" : (data.ai_capacitor >= 50 ? "average" : "bad"),
							showText: String(data.ai_capacitor || 0) + "%"
						})
					)
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Active Laws", fill: true, scrollable: true },
					laws.length
						? laws.map(function (law) {
							return h("div", { key: String(law.index) + "_" + law.text, style: { marginBottom: "6px" } },
								h("b", null, String(law.index) + ": "),
								h("span", null, law.text)
							)
						})
						: h(SUI.NoticeBox, null, "No laws available.")
				)
			),
			h(SUI.Section, { title: "Operations" },
				h(SUI.Stack, { gap: "8px", wrap: true },
					h(SUI.Button, {
						icon: "wrench",
						disabled: !data.ai_isdamaged,
						onClick: function () { act("beginReconstruction") }
					}, "Reconstruct"),
					h(SUI.Button, {
						icon: "refresh",
						onClick: function () { act("resetLaws") }
					}, "Reset Laws"),
					h(SUI.Button, {
						icon: "document",
						onClick: function () { act("addCustomSuppliedLaw") }
					}, "Add Freeform Law"),
					h(SUI.Button, {
						icon: "home",
						onClick: function () { act("uploadDefault") }
					}, "Upload Default"),
					h(SUI.Button, {
						icon: "warning",
						onClick: function () { act("purgeAiLaws") }
					}, "Purge Laws")
				)
			)
		)
	}

	SUI.registerInterface("AIDiag", AIDiag)
})()
