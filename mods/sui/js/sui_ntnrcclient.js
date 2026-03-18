;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var useState = SUI.useState
	var useEffect = SUI.useEffect
	var useRef = SUI.useRef
	var NtosErrorState = SUI.NTOS && SUI.NTOS.ErrorState

	var THEME = {
		pageBackground: "#121922",
		surface: "#18212b",
		surfaceAlt: "#111821",
		sidebar: "#141c25",
		border: "#2a3644",
		borderSoft: "#223040",
		hover: "#1d2a39",
		primary: "#2b6de0",
		primaryHover: "#245fc5",
		text: "#edf4fb",
		muted: "#8ea0b5",
		subtle: "#708195",
		status: "#4da3ff",
		selfBubble: "#214772",
		otherBubble: "#1c2632",
		systemBubble: "#161d26",
		systemText: "#9db2c9"
	}

	function ensureChatStyles() {
		if (typeof document === "undefined" || document.getElementById("sui-ntnrc-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-ntnrc-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiNtnrcSidebarItem{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiNtnrcSidebarItem:hover{background:" + THEME.hover + ";}" +
			".suiNtnrcGhost:hover{background:" + THEME.hover + " !important;border-color:#425469 !important;color:#ffffff !important;}" +
			".suiNtnrcPrimary:hover{background:" + THEME.primaryHover + " !important;}" +
			".suiNtnrcDanger:hover{background:rgba(127,29,29,0.3) !important;border-color:#b91c1c !important;color:#fecaca !important;}" +
			".suiNtnrcMessages::-webkit-scrollbar{width:8px;}" +
			".suiNtnrcMessages::-webkit-scrollbar-thumb{background:#2d3b4a;}" +
			".suiNtnrcMessages::-webkit-scrollbar-track{background:#121922;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function Button(props) {
		var ghost = !!props.ghost
		var danger = !!props.danger
		var style = {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "6px",
			minHeight: "28px",
			padding: "0 10px",
			borderRadius: "2px",
			fontSize: "10px",
			fontWeight: "700",
			letterSpacing: "0.08em",
			textTransform: "uppercase",
			fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
			cursor: props.disabled ? "default" : "pointer",
			opacity: props.disabled ? "0.45" : "1",
			whiteSpace: "nowrap"
		}

		if (ghost) {
			style.background = "transparent"
			style.border = "1px solid " + (danger ? "#7f1d1d" : THEME.border)
			style.color = danger ? "#fca5a5" : THEME.muted
		} else {
			style.background = THEME.primary
			style.border = "none"
			style.color = "#ffffff"
		}

		return h("button", {
			type: "button",
			class: ghost ? "suiNtnrcGhost" + (danger ? " suiNtnrcDanger" : "") : "suiNtnrcPrimary",
			disabled: !!props.disabled,
			onClick: function (event) {
				event.preventDefault()
				if (!props.disabled && props.onClick) {
					props.onClick(event)
				}
			},
			style: style
		},
			props.icon ? h("span", { class: "uiIcon16 icon-" + props.icon, style: { margin: "0" } }) : null,
			h("span", null, props.children)
		)
	}

	function IconBadge(props) {
		return h("div", {
			style: {
				width: "28px",
				height: "28px",
				border: "1px solid #45678d",
				background: "linear-gradient(180deg, #3a608d 0%, #294561 100%)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "#ffffff",
				fontSize: "11px",
				fontWeight: "700",
				flex: "0 0 auto"
			}
		}, props.children)
	}

	function SectionLabel(props) {
		return h("div", {
			style: {
				color: THEME.subtle,
				fontSize: "10px",
				fontWeight: "600",
				letterSpacing: "0.12em",
				textTransform: "uppercase",
				fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
			}
		}, props.children)
	}

	function parseMessage(raw, currentUser) {
		var text = String(raw || "")
		var statusMatch = text.match(/^(\S+)\s-\!-\s(.+)$/)
		if (statusMatch) {
			return {
				type: "system",
				time: statusMatch[1],
				body: statusMatch[2]
			}
		}

		var userMatch = text.match(/^(\S+)\s([^:]+):\s([\s\S]+)$/)
		if (userMatch) {
			return {
				type: userMatch[2] === currentUser ? "self" : "other",
				time: userMatch[1],
				author: userMatch[2],
				body: userMatch[3]
			}
		}

		return {
			type: "system",
			time: "",
			body: text
		}
	}

	function SidebarShell(props) {
		return h("div", {
			style: {
				width: "188px",
				background: THEME.sidebar,
				borderRight: "1px solid " + THEME.border,
				display: "flex",
				flexDirection: "column",
				minHeight: "0"
			}
		}, props.children)
	}

	function SidebarHeader(props) {
		return h("div", {
			style: {
				padding: "10px",
				borderBottom: "1px solid " + THEME.border
			}
		}, props.children)
	}

	function SidebarItem(props) {
		return h("button", {
			type: "button",
			class: "suiNtnrcSidebarItem",
			onClick: function (event) {
				event.preventDefault()
				if (props.onClick) {
					props.onClick(event)
				}
			},
			style: {
				width: "100%",
				padding: "9px 10px",
				border: "none",
				borderBottom: "1px solid " + THEME.borderSoft,
				background: props.active ? THEME.hover : "transparent",
				color: THEME.text,
				textAlign: "left",
				cursor: "pointer"
			}
		},
			h("div", {
				style: {
					display: "flex",
					alignItems: "flex-start",
					gap: "8px"
				}
			},
				h(IconBadge, null, props.badge),
				h("div", {
					style: {
						minWidth: "0",
						flex: "1 1 auto"
					}
				},
					h("div", {
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: "6px"
						}
					},
						h("div", {
							style: {
								color: THEME.text,
								fontSize: "12px",
								fontWeight: "700",
								lineHeight: "14px",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								minWidth: "0",
								flex: "1 1 auto"
							}
						}, props.title),
						props.unread ? h("div", {
							style: {
								minWidth: "16px",
								height: "16px",
								padding: "0 4px",
								background: THEME.primary,
								color: "#ffffff",
								fontSize: "10px",
								fontWeight: "700",
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								flex: "0 0 auto"
							}
						}, String(props.unread)) : null
					),
					props.subtitle ? h("div", {
						style: {
							marginTop: "2px",
							color: THEME.muted,
							fontSize: "10px",
							lineHeight: "12px",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis"
						}
					}, props.subtitle) : null
				)
			)
		)
	}

	function compactPreview(text) {
		var preview = String(text || "")
		var statusMatch = preview.match(/^\S+\s-\!-\s(.+)$/)
		if (statusMatch) {
			return statusMatch[1]
		}
		var userMatch = preview.match(/^\S+\s([^:]+):\s([\s\S]+)$/)
		if (userMatch) {
			return userMatch[1] + ": " + userMatch[2]
		}
		return preview
	}

	function ChannelList(props) {
		var channels = props.channels || []
		return h("div", {
			style: {
				flex: "1 1 auto",
				minHeight: "0",
				overflowY: "auto"
			}
		},
			channels.length ? channels.map(function (channel) {
				return h(SidebarItem, {
					key: channel.id,
					active: String(props.activeId || "") === String(channel.id),
					badge: "#",
					title: channel.chan,
					subtitle: compactPreview(channel.preview) || "No messages yet",
					unread: props.unreadMap && props.unreadMap[channel.id] ? props.unreadMap[channel.id] : 0,
					onClick: function () { props.onJoin(channel.id) }
				})
			}) : h(EmptyState, null, "No channels are currently available.")
		)
	}

	function EmptyState(props) {
		return h("div", {
			style: {
				flex: "1 1 auto",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "20px",
				color: THEME.muted,
				fontSize: "12px",
				textAlign: "center"
			}
		}, props.children)
	}

	function ErrorPanel(props) {
		if (NtosErrorState) {
			return h(NtosErrorState, {
				title: props.title,
				message: props.message,
				compact: true
			})
		}
		return h(EmptyState, null, props.message)
	}

	function ChatHeader(props) {
		return h("div", {
			style: {
				padding: "10px 12px",
				borderBottom: "1px solid " + THEME.border,
				background: THEME.surface,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "10px"
			}
		},
			h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: "10px",
					minWidth: "0"
				}
			},
				h(IconBadge, null, "#"),
				h("div", {
					style: {
						minWidth: "0"
					}
				},
					h("div", {
						style: {
							color: THEME.text,
							fontSize: "13px",
							fontWeight: "700",
							lineHeight: "15px",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis"
						}
					}, props.title),
					h("div", {
						style: {
							marginTop: "2px",
							color: THEME.muted,
							fontSize: "10px",
							lineHeight: "12px"
						}
					}, props.subtitle)
				)
			),
			h("div", {
				style: {
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					justifyContent: "flex-end"
				}
			}, props.actions)
		)
	}

	function MessageBubble(props) {
		var message = props.message
		var isSelf = message.type === "self"
		var isSystem = message.type === "system"

		return h("div", {
			style: {
				display: "flex",
				justifyContent: isSystem ? "center" : (isSelf ? "flex-end" : "flex-start")
			}
		},
			h("div", {
				style: {
					maxWidth: isSystem ? "84%" : "72%",
					padding: isSystem ? "6px 8px" : "8px 10px",
					background: isSystem ? THEME.systemBubble : (isSelf ? THEME.selfBubble : THEME.otherBubble),
					border: "1px solid " + (isSystem ? THEME.borderSoft : (isSelf ? "#35608f" : THEME.borderSoft)),
					color: isSystem ? THEME.systemText : THEME.text
				}
			},
				!isSystem ? h("div", {
					style: {
						marginBottom: "4px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "8px"
					}
				},
					h("span", {
						style: {
							color: isSelf ? "#dbeafe" : "#9cc0e7",
							fontSize: "10px",
							fontWeight: "700",
							letterSpacing: "0.04em"
						}
					}, message.author || "Unknown"),
					h("span", {
						style: {
							color: THEME.muted,
							fontSize: "10px",
							flex: "0 0 auto"
						}
					}, message.time || "")
				) : null,
				isSystem ? h("div", {
					style: {
						color: THEME.systemText,
						fontSize: "10px",
						fontWeight: "600",
						textAlign: "center"
					}
				}, (message.time ? message.time + "  " : "") + message.body) : null,
				!isSystem ? h("div", {
					style: {
						color: THEME.text,
						fontSize: "12px",
						lineHeight: "16px",
						wordBreak: "break-word"
					}
				}, message.body) : null
			)
		)
	}

	function LobbyView(props) {
		var data = props.data
		var act = props.act
		var channels = data.all_channels || []

		return h("div", {
			style: {
				display: "flex",
				minHeight: "100%",
				background: THEME.pageBackground
			}
		},
			h(SidebarShell, null,
				h(SidebarHeader, null,
					h(SectionLabel, null, data.adminmode ? "Administrative Mode" : "Channel Lobby"),
					h("div", {
						style: {
							marginTop: "8px",
							color: THEME.text,
							fontSize: "13px",
							fontWeight: "700",
							lineHeight: "15px"
						}
					}, data.username || "Unknown User"),
					h("div", {
						style: {
							marginTop: "2px",
							color: THEME.muted,
							fontSize: "10px",
							lineHeight: "12px"
						}
					}, data.adminmode ? "Admin privileges enabled" : "Local NTNet relay access")
				),
				h("div", {
					style: {
						padding: "8px 10px",
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						borderBottom: "1px solid " + THEME.border
					}
				},
					h(Button, { icon: "person", ghost: true, onClick: function () { act("change_name") } }, "Change Nickname"),
					h(Button, { icon: "plus", onClick: function () { act("new_channel") } }, "New Channel"),
					h(Button, { icon: "locked", ghost: !data.adminmode, onClick: function () { act("toggle_admin") } }, "Admin Mode")
				),
				h(ChannelList, {
					channels: channels,
					unreadMap: props.unreadMap,
					onJoin: function (id) { act("join_channel", { id: String(id) }) }
				})
			),
			h("div", {
				style: {
					flex: "1 1 auto",
					display: "flex",
					flexDirection: "column",
					minHeight: "0",
					background: THEME.surfaceAlt
				}
			},
				h(ChatHeader, {
					title: "NTNet Relay Chat",
					subtitle: channels.length ? (channels.length + " channels in local range") : "No active channels discovered",
					actions: h(Button, { icon: "plus", onClick: function () { act("new_channel") } }, "Start Chat")
				}),
				h(EmptyState, null, "Select a channel from the left sidebar or create a new one to begin messaging.")
			)
		)
	}

	function ChannelView(props) {
		var data = props.data
		var act = props.act
		var channels = data.all_channels || []
		var statePair = useState("")
		var draft = statePair[0]
		var setDraft = statePair[1]
		var listRef = useRef(null)
		var textareaRef = useRef(null)
		var messages = (data.messages || []).map(function (message) {
			return parseMessage(message.msg, data.username || "")
		})
		var clients = data.clients || []
		var messageCount = (data.messages || []).length

		useEffect(function () {
			setDraft("")
		}, [data.title])

		useEffect(function () {
			var node = listRef.current
			if (!node) {
				return
			}
			node.scrollTop = node.scrollHeight
		}, [messageCount, data.channel_id])

		useEffect(function () {
			var node = textareaRef.current
			if (!node) {
				return
			}
			node.style.height = "36px"
			node.style.height = Math.min(node.scrollHeight, 84) + "px"
		}, [draft])

		function sendDraft() {
			var trimmed = String(draft || "").replace(/^\s+|\s+$/g, "")
			if (!trimmed) {
				return
			}
			act("send_text", { message: trimmed })
			setDraft("")
		}

		return h("div", {
			style: {
				display: "flex",
				minHeight: "100%",
				background: THEME.pageBackground
			}
		},
			h(SidebarShell, null,
				h(SidebarHeader, null,
					h(SectionLabel, null, "Channel Info"),
					h("div", {
						style: {
							marginTop: "8px",
							color: THEME.text,
							fontSize: "13px",
							fontWeight: "700",
							lineHeight: "15px"
						}
					}, data.title || "Channel"),
					h("div", {
						style: {
							marginTop: "2px",
							color: THEME.muted,
							fontSize: "10px",
							lineHeight: "12px"
						}
					}, clients.length + " connected  |  " + (data.muted ? "Muted" : "Notifications on"))
				),
				h("div", {
					style: {
						padding: "8px 10px",
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						borderBottom: "1px solid " + THEME.border
					}
				},
					h(Button, { icon: "comment", onClick: function () { act("speak") } }, "Send Message"),
					h(Button, { icon: "person", ghost: true, onClick: function () { act("change_name") } }, "Change Nickname"),
					h(Button, { icon: data.muted ? "volume-on" : "volume-off", ghost: true, onClick: function () { act("toggle_notifications") } }, data.muted ? "Unmute" : "Mute"),
					h(Button, { icon: "disk", ghost: true, onClick: function () { act("save_log") } }, "Save Log"),
					h(Button, { icon: "arrowreturnthick-1-w", ghost: true, onClick: function () { act("leave_channel") } }, "Leave")
				),
				data.is_operator ? h("div", {
					style: {
						padding: "8px 10px",
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						borderBottom: "1px solid " + THEME.border
					}
				},
					h(Button, { icon: "pencil", ghost: true, onClick: function () { act("rename_channel") } }, "Rename"),
					h(Button, { icon: "locked", ghost: true, onClick: function () { act("set_password") } }, "Password"),
					h(Button, { icon: "trash", ghost: true, danger: true, onClick: function () { act("delete_channel") } }, "Delete")
				) : null,
				h("div", {
					style: {
						padding: "8px 10px 6px",
						borderBottom: "1px solid " + THEME.border
					}
				}, h(SectionLabel, null, "Channels")),
				h(ChannelList, {
					channels: channels,
					activeId: data.channel_id,
					unreadMap: props.unreadMap,
					onJoin: function (id) { act("join_channel", { id: String(id) }) }
				}),
				h("div", {
					style: {
						padding: "8px 10px 6px",
						borderTop: "1px solid " + THEME.border,
						borderBottom: "1px solid " + THEME.border
					}
				}, h(SectionLabel, null, "Participants")),
				h("div", {
					style: {
						maxHeight: "130px",
						overflowY: "auto"
					}
				},
					clients.length ? clients.map(function (client, index) {
						var isSelf = client.name === data.username
						return h(SidebarItem, {
							key: client.name + "_" + String(index),
							active: isSelf,
							badge: (client.name || "?").charAt(0).toUpperCase(),
							title: client.name,
							subtitle: isSelf ? "You" : "Connected"
						})
					}) : h(EmptyState, null, "No users connected.")
				)
			),
			h("div", {
				style: {
					flex: "1 1 auto",
					display: "flex",
					flexDirection: "column",
					minHeight: "0",
					background: THEME.surfaceAlt
				}
			},
				h(ChatHeader, {
					title: data.title || "Channel",
					subtitle: data.is_operator ? "Operator controls available" : "NTNet relay conversation",
					actions: h("div", {
						style: {
							display: "flex",
							gap: "6px",
							flexWrap: "wrap"
						}
					},
						h(Button, { icon: "locked", ghost: !data.adminmode, onClick: function () { act("toggle_admin") } }, "Admin")
					)
				}),
				h("div", {
					class: "suiNtnrcMessages",
					ref: listRef,
					style: {
						flex: "1 1 auto",
						minHeight: "0",
						overflowY: "auto",
						padding: "12px",
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						background: "linear-gradient(180deg, #111821 0%, #121922 100%)"
					}
				},
					messages.length ? messages.map(function (message, index) {
						return h(MessageBubble, { key: String(index), message: message })
					}) : h(EmptyState, null, "No messages yet.")
				),
				h("div", {
					style: {
						padding: "10px 12px",
						borderTop: "1px solid " + THEME.border,
						background: THEME.surface,
						display: "flex",
						alignItems: "center",
						gap: "10px"
					}
				},
					h("textarea", {
						ref: textareaRef,
						style: {
							flex: "1 1 auto",
							height: "36px",
							minHeight: "36px",
							maxHeight: "84px",
							padding: "8px 10px",
							border: "1px solid " + THEME.border,
							background: THEME.surfaceAlt,
							color: THEME.text,
							fontSize: "11px",
							lineHeight: "14px",
							fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
							resize: "none",
							outline: "none"
						}
						,
						value: draft,
						placeholder: "Write a message...",
						onInput: function (event) { setDraft(event.target.value) },
						onKeyDown: function (event) {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault()
								sendDraft()
							}
						}
					}),
					h(Button, { icon: "comment", disabled: !String(draft || "").replace(/^\s+|\s+$/g, ""), onClick: sendDraft }, "Send")
				)
			)
		)
	}

	function NTNRCClient() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var unreadPair = useState({})
		var unreadMap = unreadPair[0]
		var setUnreadMap = unreadPair[1]
		var countsRef = useRef({})

		ensureChatStyles()

		if (data.error) {
			return h("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					minHeight: "100%",
					background: THEME.pageBackground,
					padding: "8px"
				}
			}, h(ErrorPanel, {
				title: "Relay client fault",
				message: data.error
			}))
		}

		useEffect(function () {
			var channels = data.all_channels || []
			var activeId = data.channel_id
			var nextCounts = {}
			var updates = {}
			var changed = false

			channels.forEach(function (channel) {
				var id = String(channel.id)
				var count = Number(channel.message_count) || 0
				nextCounts[id] = count
				var prev = countsRef.current[id]
				if (typeof prev === "number" && count > prev && String(activeId || "") !== id) {
					updates[id] = (unreadMap[id] || 0) + (count - prev)
					changed = true
				}
			})

			if (activeId) {
				var activeKey = String(activeId)
				if (unreadMap[activeKey]) {
					updates[activeKey] = 0
					changed = true
				}
			}

			countsRef.current = nextCounts

			if (changed) {
				setUnreadMap(function (current) {
					var merged = {}
					var key
					for (key in current) merged[key] = current[key]
					for (key in updates) merged[key] = updates[key]
					return merged
				})
			}
		}, [data.all_channels, data.channel_id, unreadMap])

		if (data.title) return h(ChannelView, { data: data, act: act, unreadMap: unreadMap })
		return h(LobbyView, { data: data, act: act, unreadMap: unreadMap })
	}

	SUI.registerInterface("NTNRCClient", NTNRCClient)
})()
