;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function StatCard(props) {
		var title = props.title
		var health = Number(props.health) || 0
		var mana = Number(props.mana) || 0
		var maxHealth = props.maxHealth
		var maxMana = props.maxMana

		return h(SUI.Section, { title: title },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Health" },
					h(SUI.ProgressBar, {
						value: health,
						min: 0,
						max: maxHealth,
						color: health > maxHealth * 0.5 ? "good" : (health > maxHealth * 0.25 ? "average" : "bad"),
						showText: String(health)
					})
				),
				h(SUI.LabeledList.Item, { label: "Energy" },
					h(SUI.ProgressBar, {
						value: mana,
						min: 0,
						max: maxMana,
						color: mana > maxMana * 0.4 ? "good" : "average",
						showText: String(mana)
					})
				)
			)
		)
	}

	function ArcadeClassic() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var gameover = !!data.gameover

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(SUI.Section, { title: "Battle Feed" },
				h(SUI.NoticeBox, { danger: gameover }, data.information || "A new game has started!"),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("new_game") } }, "New Game")
				)
			),
			h(SUI.Stack, { gap: "8px", wrap: true, fill: true },
				h(SUI.Stack.Item, { grow: true },
					h(StatCard, {
						title: "Player",
						health: data.player_health,
						mana: data.player_mana,
						maxHealth: 30,
						maxMana: 20
					})
				),
				h(SUI.Stack.Item, { grow: true },
					h(StatCard, {
						title: data.enemy_name || "Enemy",
						health: data.enemy_health,
						mana: data.enemy_mana,
						maxHealth: 45,
						maxMana: 20
					})
				)
			),
			h(SUI.Section, { title: "Actions" },
				h(SUI.Stack, { gap: "8px", wrap: true },
					h(SUI.Button, {
						icon: "target",
						disabled: gameover,
						onClick: function () { act("attack") }
					}, "Attack"),
					h(SUI.Button, {
						icon: "heart",
						disabled: gameover,
						onClick: function () { act("heal") }
					}, "Heal"),
					h(SUI.Button, {
						icon: "bolt",
						disabled: gameover,
						onClick: function () { act("regain_mana") }
					}, "Regain Energy")
				)
			)
		)
	}

	SUI.registerInterface("ArcadeClassic", ArcadeClassic)
})()
