;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function ErrorView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "Email Administration", fill: true },
			h(SUI.NoticeBox, { danger: true }, data.error),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("back") } }, "Return")
			)
		)
	}

	function SkillFailView(props) {
		var data = props.data
		var act = props.act
		var entries = data.skill_fail || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Unreadable Output", fill: true, scrollable: true },
				entries.map(function (entry, index) {
					return h("div", {
						key: index,
						style: {
							display: "flex",
							gap: "8px",
							padding: "6px 0",
							borderBottom: "1px solid rgba(64,98,138,0.2)"
						}
					},
						h("div", { style: { minWidth: "180px", fontWeight: "bold" } }, entry.key),
						h("div", null, entry.value)
					)
				})
			),
			data.terminal ? h(SUI.Button, { icon: "console", onClick: function () { act("terminal") } }, "Activate Terminal") : null
		)
	}

	function MessageView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "Message", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Title" }, data.msg_title),
				h(SUI.LabeledList.Item, { label: "Source" }, data.msg_source),
				h(SUI.LabeledList.Item, { label: "Recipient" }, data.msg_recipient),
				h(SUI.LabeledList.Item, { label: "Received At" }, data.msg_timestamp),
				h(SUI.LabeledList.Item, { label: "Message" },
					h("div", { dangerouslySetInnerHTML: { __html: data.msg_body || "" } })
				)
			),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("back") } }, "Return")
			)
		)
	}

	function AccountView(props) {
		var data = props.data
		var act = props.act
		var messages = data.messages || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Account " + data.current_account },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Status" }, data.cur_suspended ? "Suspended" : "Normal")
				),
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "warning", onClick: function () { act("ban") } }, data.cur_suspended ? "Unsuspend" : "Suspend"),
					h(SUI.Button, { icon: "key", onClick: function () { act("changepass") } }, "Set Password"),
					h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("back") } }, "Return")
				)
			),
			h(SUI.Section, { title: "Messages", fill: true, scrollable: true },
				messages.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Source"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Recipient"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Title"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Received At"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Action")
					),
					messages.map(function (message) {
						return h(SUI.Table.Row, { key: message.uid },
							h(SUI.Table.Cell, null, message.source),
							h(SUI.Table.Cell, null, message.recipient),
							h(SUI.Table.Cell, null, message.title),
							h(SUI.Table.Cell, null, message.timestamp),
							h(SUI.Table.Cell, null,
								h(SUI.Button, { icon: "folder-open", onClick: function () { act("viewmail", { id: message.uid }) } }, "View")
							)
						)
					})
				) : h(SUI.NoticeBox, null, "No messages found in selected account.")
			)
		)
	}

	function HomeView(props) {
		var data = props.data
		var act = props.act
		var accounts = data.accounts || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "NTNet Email Administration System" },
				h("div", null, "SECURE SYSTEM - Have your identification ready"),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "mail-open", onClick: function () { act("newaccount") } }, "Create New Account")
				)
			),
			h(SUI.Section, { title: "Accounts", fill: true, scrollable: true },
				accounts.length ? accounts.map(function (account) {
					return h("div", { key: account.uid, style: { marginBottom: "6px" } },
						h(SUI.ActionLink, {
							icon: "newwin",
							onClick: function () { act("viewaccount", { id: account.uid }) }
						}, account.login)
					)
				}) : h(SUI.NoticeBox, null, "No administrable accounts found.")
			),
			data.terminal ? h(SUI.Button, { icon: "console", onClick: function () { act("terminal") } }, "Activate Terminal") : null
		)
	}

	function EmailAdministration() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.error) {
			return h(ErrorView, { data: data, act: act })
		}
		if (data.skill_fail) {
			return h(SkillFailView, { data: data, act: act })
		}
		if (data.msg_title) {
			return h(MessageView, { data: data, act: act })
		}
		if (data.current_account) {
			return h(AccountView, { data: data, act: act })
		}
		return h(HomeView, { data: data, act: act })
	}

	SUI.registerInterface("EmailAdministration", EmailAdministration)
})()
