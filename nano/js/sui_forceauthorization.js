;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function WeaponCard(props) {
		var weapon = props.weapon
		var act = props.act
		var modes = weapon.modes || []

		return h("div", {
			style: {
				padding: "8px 10px",
				marginBottom: "8px",
				border: "1px solid rgba(64,98,138,0.25)",
				background: "rgba(0,0,0,0.18)"
			}
		},
			h("div", { style: { marginBottom: "4px", fontWeight: "bold", color: "#e9c183" } },
				weapon.name + (weapon.owner ? " registered to " + weapon.owner : "")
			),
			h("div", { style: { marginBottom: "6px", fontSize: "11px", color: weapon.out_of_range ? "#cc9090" : "#aaaaaa" } },
				weapon.area
			),
			modes.length
				? h(SUI.Stack, { gap: "6px", wrap: true },
					modes.map(function (mode) {
						return h(SUI.Button, {
							key: String(mode.index),
							icon: mode.authorized ? "lock" : "unlock",
							disabled: !!weapon.out_of_range,
							selected: !!mode.authorized,
							onClick: function () {
								act("authorize", {
									gun: weapon.ref,
									mode: mode.index,
									authorize: mode.authorized ? 0 : 1
								})
							}
						}, (mode.authorized ? "Unauthorize " : "Authorize ") + mode.mode_name)
					})
				)
				: h(SUI.NoticeBox, null, "No configurable firemodes.")
		)
	}

	function ForceAuthorization() {
		var backend = useBackend()
		var data = backend.data || {}
		var registered = data.registered_guns || []
		var unregistered = data.unregistered_guns || []

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Registered Weapons", fill: true, scrollable: true },
					registered.length
						? registered.map(function (weapon) {
							return h(WeaponCard, { key: weapon.ref, weapon: weapon, act: backend.act })
						})
						: h(SUI.NoticeBox, null, "No registered weapons found.")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Unregistered Weapons", fill: true, scrollable: true },
					unregistered.length
						? unregistered.map(function (weapon) {
							return h(WeaponCard, { key: weapon.ref, weapon: weapon, act: backend.act })
						})
						: h(SUI.NoticeBox, null, "No unregistered weapons found.")
				)
			)
		)
	}

	SUI.registerInterface("ForceAuthorization", ForceAuthorization)
})()
