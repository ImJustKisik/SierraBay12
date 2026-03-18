;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function ErrorView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "Email Client", fill: true },
			h(SUI.NoticeBox, { danger: true }, data.error),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "refresh", onClick: function () { act("reset") } }, "Return")
			)
		)
	}

	function DownloadView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "Downloading Attachment", fill: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "File name" }, data.down_filename || "Unknown"),
				h(SUI.LabeledList.Item, { label: "Progress" },
					h(SUI.ProgressBar, {
						value: Number(data.down_progress) || 0,
						max: Number(data.down_size) || 1,
						showText: String(data.down_progress || 0) + " / " + String(data.down_size || 0) + " GQ"
					})
				),
				h(SUI.LabeledList.Item, { label: "Download rate" }, String(data.down_speed || 0) + " GQ/s")
			),
			h("div", { style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "close", onClick: function () { act("canceldownload") } }, "Cancel Download")
			)
		)
	}

	function AddressBookView(props) {
		var data = props.data
		var act = props.act
		var accounts = data.accounts || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Address Book" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("close_addressbook") } }, "Back"),
					h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_recipient") } }, "Enter Email")
				)
			),
			h(SUI.Section, { title: "Accounts", fill: true, scrollable: true },
				accounts.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Name"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Job"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Address")
					),
					accounts.map(function (account) {
						return h(SUI.Table.Row, { key: account.login },
							h(SUI.Table.Cell, null, account.name),
							h(SUI.Table.Cell, null, account.job),
							h(SUI.Table.Cell, null,
								h(SUI.ActionLink, {
									onClick: function () { act("set_recipient", { recipient: account.login }) }
								}, account.login)
							)
						)
					})
				) : h(SUI.NoticeBox, null, "No accounts available.")
			)
		)
	}

	function ComposeView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Compose Message" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_title") } }, "Edit Title"),
					h(SUI.Button, { icon: "plusthick", onClick: function () { act("addressbook") } }, "Address Book"),
					h(SUI.Button, { icon: "mail-open", onClick: function () { act("edit_recipient") } }, "Edit Recipient"),
					h(SUI.Button, { icon: "document", onClick: function () { act("edit_body") } }, "Edit Body")
				)
			),
			h(SUI.Section, { title: "Draft", fill: true, scrollable: true },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Title" }, data.msg_title || "(No subject)"),
					h(SUI.LabeledList.Item, { label: "Recipient" }, data.msg_recipient || "(No recipient)"),
					h(SUI.LabeledList.Item, { label: "Message" },
						h("div", { dangerouslySetInnerHTML: { __html: data.msg_body || "<i>Empty message.</i>" } })
					),
					data.msg_hasattachment ? h(SUI.LabeledList.Item, { label: "Attachment" },
						(data.msg_attachment_filename || "Unknown") + " (" + String(data.msg_attachment_size || 0) + " GQ)"
					) : null
				),
				h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "upload", onClick: function () { act("addattachment") } }, "Add Attachment"),
					data.msg_hasattachment ? h(SUI.Button, { icon: "close", onClick: function () { act("remove_attachment") } }, "Remove Attachment") : null,
					h(SUI.Button, { icon: "mail-open", onClick: function () { act("send") } }, "Send"),
					h(SUI.Button, { icon: "trash", onClick: function () { act("cancel") } }, "Cancel")
				)
			)
		)
	}

	function MessageView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: data.cur_title || "Message", fill: true, scrollable: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Title" }, data.cur_title),
				h(SUI.LabeledList.Item, { label: "Origin" }, data.cur_source),
				h(SUI.LabeledList.Item, { label: "Received at" }, data.cur_timestamp),
				h(SUI.LabeledList.Item, { label: "Message" },
					h("div", { dangerouslySetInnerHTML: { __html: data.cur_body || "" } })
				),
				data.cur_hasattachment ? h(SUI.LabeledList.Item, { label: "Attachment" },
					(data.cur_attachment_filename || "Unknown") + " (" + String(data.cur_attachment_size || 0) + " GQ)"
				) : null
			),
			h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("reply", { uid: data.cur_uid }) } }, "Reply"),
				h(SUI.Button, { icon: "arrowreturnthick-1-e", onClick: function () { act("forward", { uid: data.cur_uid }) } }, "Forward"),
				h(SUI.Button, { icon: "trash", onClick: function () { act("delete", { uid: data.cur_uid }) } }, "Delete"),
				h(SUI.Button, { icon: "download", onClick: function () { act("save", { uid: data.cur_uid }) } }, "Save To Disk"),
				data.cur_hasattachment ? h(SUI.Button, { icon: "download", onClick: function () { act("downloadattachment") } }, "Save Attachment") : null,
				h(SUI.Button, { icon: "close", onClick: function () { act("cancel") } }, "Close")
			)
		)
	}

	function FolderView(props) {
		var data = props.data
		var act = props.act
		var messages = data.messages || []

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Account " + data.current_account },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "mail-closed", onClick: function () { act("new_message") } }, "New Message"),
					h(SUI.Button, { icon: "locked", onClick: function () { act("changepassword") } }, "Change Password"),
					h(SUI.Button, { icon: "alert", onClick: function () { act("set_notification") } }, "Set Notification"),
					h(SUI.Button, { icon: data.notification_mute ? "volume-on" : "volume-off", onClick: function () { act("mute") } }, data.notification_mute ? "Unmute" : "Mute"),
					h(SUI.Button, { icon: "key", onClick: function () { act("logout") } }, "Log Out")
				)
			),
			h(SUI.Section, { title: "Folders" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { icon: "mail-closed", onClick: function () { act("set_folder", { folder: "Inbox" }) } }, data.label_inbox || "Inbox"),
					h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("set_folder", { folder: "Sent" }) } }, data.label_outbox || "Sent"),
					h(SUI.Button, { icon: "cancel", onClick: function () { act("set_folder", { folder: "Spam" }) } }, data.label_spam || "Spam"),
					h(SUI.Button, { icon: "trash", onClick: function () { act("set_folder", { folder: "Deleted" }) } }, data.label_deleted || "Deleted")
				)
			),
			h(SUI.Section, { title: data.folder || "Messages", fill: true, scrollable: true },
				messages.length ? h(SUI.Table, { fill: true, style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, data.source_label || "Source"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Title"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Received at"),
						h(SUI.Table.Cell, { style: { width: "220px", fontWeight: "bold", textAlign: "right" } }, "Actions")
					),
					messages.map(function (message) {
						return h(SUI.Table.Row, { key: message.uid },
							h(SUI.Table.Cell, null, message.source),
							h(SUI.Table.Cell, null, message.title),
							h(SUI.Table.Cell, null, message.timestamp),
							h(SUI.Table.Cell, { style: { textAlign: "right" } },
								h(SUI.Stack, { gap: "4px", wrap: true, style: { justifyContent: "flex-end" } },
									h(SUI.Button, { icon: "trash", onClick: function () { act("delete", { uid: message.uid }) } }, "Delete"),
									h(SUI.Button, { icon: "arrowreturnthick-1-w", onClick: function () { act("reply", { uid: message.uid }) } }, "Reply"),
									h(SUI.Button, { icon: "arrowreturnthick-1-e", onClick: function () { act("forward", { uid: message.uid }) } }, "Forward"),
									h(SUI.Button, { icon: "search", onClick: function () { act("view", { uid: message.uid }) } }, "Open")
								)
							)
						)
					})
				) : h(SUI.NoticeBox, null, "No messages found in selected folder.")
			)
		)
	}

	function LoginView(props) {
		var data = props.data
		var act = props.act

		return h(SUI.Section, { title: "NTNet Email System", fill: true },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Email address" }, data.stored_login || ""),
				h(SUI.LabeledList.Item, { label: "Password" }, data.stored_password || "")
			),
			h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
				h(SUI.Button, { icon: "pencil", onClick: function () { act("edit_login") } }, "Enter Login"),
				h(SUI.Button, { icon: "locked", onClick: function () { act("edit_password") } }, "Enter Password"),
				h(SUI.Button, { icon: "key", onClick: function () { act("login") } }, "Log In")
			)
		)
	}

	function EmailClient() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		if (data.error) {
			return h(ErrorView, { data: data, act: act })
		}
		if (data.downloading) {
			return h(DownloadView, { data: data, act: act })
		}
		if (data.current_account) {
			if (data.addressbook) {
				return h(AddressBookView, { data: data, act: act })
			}
			if (data.new_message) {
				return h(ComposeView, { data: data, act: act })
			}
			if (data.cur_title) {
				return h(MessageView, { data: data, act: act })
			}
			return h(FolderView, { data: data, act: act })
		}
		return h(LoginView, { data: data, act: act })
	}

	SUI.registerInterface("EmailClient", EmailClient)
})()
