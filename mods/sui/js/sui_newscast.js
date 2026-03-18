;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	var NEWSCAST_HOME = 1
	var NEWSCAST_VIEW_CHANNEL = 2

	function HomeView(props) {
		var data = props.data
		var act = props.act
		var channels = data.channels || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Network Status" },
				h(SUI.NoticeBox, null, "Interface and networks operational."),
				h("div", { dangerouslySetInnerHTML: { __html: data.time_blurb || "" } }),
				h(SUI.Stack, { vertical: false, gap: "8px", style: { marginTop: "8px", alignItems: "center" } },
					h("div", { dangerouslySetInnerHTML: { __html: data.notifs_blurb || "" } }),
					h(SUI.Button, {
						icon: data.notifs_enabled ? "volume-off" : "volume-on",
						selected: data.notifs_enabled,
						onClick: function () { act("toggle_notifs") }
					}, data.notifs_enabled ? "Disable" : "Enable")
				)
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: "Connected Channels", fill: true, scrollable: true },
					channels.length
						? channels.map(function (channel) {
							return h(SUI.ActionLink, {
								key: channel.ref,
								fluid: true,
								icon: channel.admin ? "star" : "newwin",
								style: {
									marginBottom: "4px",
									color: channel.censored ? "#d88b8b" : null
								},
								onClick: function () { act("view_channel", { channel_ref: channel.ref }) }
							}, channel.name + (channel.censored ? " ***" : ""))
						})
						: h(SUI.NoticeBox, { danger: true }, "No channels found on the local NTNet instance.")
				)
			)
		)
	}

	function StoryEntry(props) {
		var story = props.story
		var act = props.act

		return h("div", {
			style: {
				padding: "8px 10px",
				marginBottom: "8px",
				border: "1px solid rgba(64,98,138,0.35)",
				background: "rgba(0,0,0,0.2)"
			}
		},
			h("div", { style: { fontStyle: "italic", marginBottom: "4px" } }, "\"" + (story.body || "") + "\""),
			story.has_photo ? h("div", { style: { marginBottom: "4px" } },
				h("div", { dangerouslySetInnerHTML: { __html: story.photo_dat || "" } }),
				h(SUI.Button, {
					icon: "image",
					onClick: function () { act("view_photo", { story_ref: story.story_ref }) }
				}, "View Photo")
			) : null,
			h("div", { style: { fontSize: "11px", color: "#cc9090" } }, "Story by " + (story.author || "Unknown") + " at " + (story.timestamp || "Unknown"))
		)
	}

	function ChannelView(props) {
		var data = props.data
		var act = props.act
		var activeChannels = data.active_channels || []
		var stories = data.active_stories || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h("div", null,
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("return_to_home") } }, "Return")
			),
			h(SUI.Stack.Item, { grow: true },
				h(SUI.Section, { title: activeChannels.length ? activeChannels[0].name : "Channel", fill: true, scrollable: true },
					activeChannels.length ? h("div", { style: { marginBottom: "8px", fontSize: "11px", color: "#cc9090" } },
						"Created by " + (activeChannels[0].author || "Unknown")
					) : null,
					activeChannels.length && activeChannels[0].censored
						? h("div", { dangerouslySetInnerHTML: { __html: data.dnotice_blurb || "" } })
						: stories.length
							? stories.map(function (story) {
								return h(StoryEntry, { key: story.story_ref, story: story, act: act })
							})
							: h(SUI.NoticeBox, null, "No stories in this channel for the current time slot.")
				)
			)
		)
	}

	function Newscast() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (!data.has_network) {
			return h(SUI.Section, { title: "Network Error", fill: true },
				h(SUI.NoticeBox, { danger: true },
					"Couldn't fetch feed network data. Ensure NTNet connectivity and a broadcaster in your sector."
				)
			)
		}

		if (data.prog_state === NEWSCAST_VIEW_CHANNEL) {
			return h(ChannelView, { data: data, act: act })
		}

		return h(HomeView, { data: data, act: act })
	}

	SUI.registerInterface("Newscast", Newscast)
})()
