;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var useState = SUI.useState
	var useEffect = SUI.useEffect
	var NTOS = SUI.NTOS
	var THEME = NTOS.theme
	var SectionBlock = NTOS.SectionBlock
	var Button = NTOS.Button
	var KeyValueRow = NTOS.KeyValueRow
	var StatusBadge = NTOS.StatusBadge
	var StatePanel = NTOS.StatePanel
	var EmptyState = NTOS.EmptyState
	var ErrorState = NTOS.ErrorState

	var SCREEN_NONE = 0
	var SCREEN_SECURITY = 1
	var SCREEN_TRANSFER = 2
	var SCREEN_LOGS = 3

	function ensureATMStyles() {
		NTOS.ensureStyles()
		if (typeof document === "undefined" || document.getElementById("sui-atm-ntos-styles")) {
			return
		}

		var style = document.createElement("style")
		style.id = "sui-atm-ntos-styles"
		style.type = "text/css"
		style.appendChild(document.createTextNode("" +
			".suiAtmDenseRow{transition:background-color 0.16s ease,border-color 0.16s ease;}" +
			".suiAtmDenseRow:hover{background:" + THEME.rowHover + ";}" +
			".suiAtmRowTitle{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;}" +
			".suiAtmShellGhost:hover{border-color:#475569 !important;background:rgba(51,65,85,0.22) !important;color:#ffffff !important;}" +
			".suiAtmShellDanger:hover{border-color:#b91c1c !important;background:rgba(127,29,29,0.32) !important;color:#fecaca !important;}"
		))
		document.getElementsByTagName("head")[0].appendChild(style)
	}

	function formatMoney(currency, amount) {
		var value = Number(amount)
		if (isNaN(value)) {
			return currency + "0"
		}
		return currency + value.toFixed(2)
	}

	function securityLabel(level) {
		return Number(level) === 0 ? "Minimum" : Number(level) === 1 ? "Moderate" : "Maximum"
	}

	function currentScreenLabel(screen) {
		if (screen === SCREEN_SECURITY) {
			return "Security"
		}
		if (screen === SCREEN_TRANSFER) {
			return "Transfer"
		}
		if (screen === SCREEN_LOGS) {
			return "Ledger"
		}
		return "Overview"
	}

	function shellButtonStyle() {
		return {
			minHeight: "24px",
			padding: "0 8px",
			fontSize: "10px"
		}
	}

	function shellTagStyle() {
		return {
			display: "inline-flex",
			alignItems: "center",
			minHeight: "24px",
			padding: "0 8px",
			border: "1px solid " + THEME.panelBorder,
			background: "transparent",
			color: THEME.muted,
			fontSize: "10px",
			fontWeight: "700",
			letterSpacing: "0.08em",
			textTransform: "uppercase",
			fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
			whiteSpace: "nowrap"
		}
	}

	function fieldLabel(text) {
		return h("div", {
			style: {
				marginBottom: "4px",
				color: THEME.subtle,
				fontSize: "10px",
				fontWeight: "600",
				letterSpacing: "0.12em",
				textTransform: "uppercase",
				fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
			}
		}, text)
	}

	function ShellTag(props) {
		return h("div", { style: shellTagStyle() }, props.children)
	}

	function ShellHeader(props) {
		return h("div", {
			style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "10px",
				padding: "10px 12px 8px",
				border: "1px solid " + THEME.panelBorder,
				background: THEME.panelBackground
			}
		},
			h("div", {
				style: {
					width: "32px",
					height: "32px",
					border: "1px solid " + THEME.panelBorder,
					background: THEME.cardBackground,
					color: THEME.text,
					fontSize: "14px",
					fontWeight: "700",
					lineHeight: "30px",
					textAlign: "center",
					flex: "0 0 auto",
					fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
				}
			}, "N"),
			h("div", {
				style: {
					minWidth: "0",
					flex: "1 1 auto"
				}
			},
				h("div", {
					style: {
						color: THEME.text,
						fontSize: "13px",
						fontWeight: "700",
						lineHeight: "16px",
						fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
					}
				}, "NanoTrasen Financial Services"),
				h("div", {
					style: {
						marginTop: "2px",
						color: THEME.muted,
						fontSize: "10px",
						lineHeight: "12px",
						fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis"
					}
				}, props.meta)
			),
			h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: "6px",
					flexWrap: "wrap",
					justifyContent: "flex-end",
					flex: "0 0 auto"
				}
			},
				h(ShellTag, null, props.sessionTag),
				props.showMain
					? h(Button, {
						ghost: true,
						style: shellButtonStyle(),
						onClick: props.onMain
					}, "Main")
					: null,
				props.showLogout
					? h(Button, {
						ghost: true,
						danger: true,
						style: shellButtonStyle(),
						onClick: props.onLogout
					}, "End Session")
					: null
			)
		)
	}

	function DenseRow(props) {
		return h("div", {
			class: "suiAtmDenseRow",
			style: {
				padding: "8px 10px",
				border: "1px solid " + THEME.rowBorder,
				background: THEME.cardBackground
			}
		}, props.children)
	}

	function KeypadButton(props) {
		return h(Button, {
			ghost: props.kind !== "primary",
			danger: props.kind === "danger",
			style: {
				width: "100%",
				minHeight: "32px",
				padding: "0",
				borderRadius: "0",
				justifyContent: "center",
				fontSize: "11px"
			},
			onClick: props.onClick,
			disabled: !!props.disabled
		}, props.children)
	}

	function NumericPad(props) {
		var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "ENT"]
		return h("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
				gap: "6px"
			}
		},
			keys.map(function (key) {
				var kind = key === "ENT" ? "primary" : key === "CLR" ? "danger" : "ghost"
				return h(KeypadButton, {
					key: key,
					kind: kind,
					disabled: !!props.disabled,
					onClick: function () {
						if (key === "CLR") {
							props.onClear()
							return
						}
						if (key === "ENT") {
							props.onConfirm()
							return
						}
						props.onDigit(key)
					}
				}, key)
			})
		)
	}

	function ServiceRow(props) {
		return h(DenseRow, null,
			h("div", {
				style: {
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: "10px"
				}
			},
				h("div", {
					style: {
						minWidth: "0",
						flex: "1 1 auto",
						display: "flex",
						alignItems: "flex-start",
						gap: "8px"
					}
				},
					h("span", {
						class: "uiIcon16 icon-" + props.icon,
						style: {
							margin: "0",
							flex: "0 0 auto",
							opacity: "0.9"
						}
					}),
					h("div", { style: { minWidth: "0", flex: "1 1 auto" } },
						h("div", {
							class: "suiAtmRowTitle",
							style: {
								color: THEME.text,
								fontSize: "13px",
								fontWeight: "700",
								lineHeight: "15px",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, props.title),
						h("div", {
							style: {
								marginTop: "2px",
								color: THEME.muted,
								fontSize: "11px",
								lineHeight: "13px",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, props.description)
					)
				),
				h(Button, {
					ghost: !props.primary,
					style: {
						flex: "0 0 auto"
					},
					disabled: !!props.disabled,
					onClick: props.onClick
				}, props.actionLabel)
			)
		)
	}

	function CredentialPanel(props) {
		var data = props.data
		var act = props.act
		return h(SectionBlock, { title: "Credential Reader" },
			h(KeyValueRow, { label: "Terminal", first: true }, data.machine_id || "UNKNOWN"),
			h(KeyValueRow, { label: "Reader" }, data.has_card ? "Occupied" : "Empty"),
			h(KeyValueRow, { label: "Credential" }, data.has_card ? (data.held_card_name || "Inserted Card") : "No credential inserted"),
			h("div", {
				style: {
					marginTop: "8px"
				}
			},
				h(Button, {
					onClick: function () { act("insert_card") }
				}, data.has_card ? "Eject Credential" : "Insert Credential")
			)
		)
	}

	function StatusPanel(props) {
		var data = props.data
		return h(SectionBlock, { title: "Terminal Status" },
			h(KeyValueRow, { label: "Network", first: true },
				h(StatusBadge, {
					active: !data.emagged,
					activeLabel: "Online",
					inactiveLabel: "Compromised",
					activeColor: THEME.good,
					inactiveColor: THEME.bad,
					activeTextColor: THEME.text
				})
			),
			h(KeyValueRow, { label: "Reader Rail" },
				h(StatusBadge, {
					active: !!data.has_card,
					activeLabel: "Occupied",
					inactiveLabel: "Idle",
					activeColor: THEME.warn,
					inactiveColor: THEME.subtle,
					activeTextColor: THEME.text
				})
			),
			h(KeyValueRow, { label: "Session Bus" },
				h(StatusBadge, {
					active: !!data.authenticated,
					activeLabel: "Open",
					inactiveLabel: "Standby",
					activeColor: THEME.good,
					inactiveColor: THEME.subtle,
					activeTextColor: THEME.text
				})
			),
			h(KeyValueRow, { label: "Lock State" },
				h(StatusBadge, {
					active: !!data.locked_down,
					activeLabel: "Locked",
					inactiveLabel: "Nominal",
					activeColor: THEME.bad,
					inactiveColor: THEME.good,
					activeTextColor: THEME.text
				})
			)
		)
	}

	function SessionPanel(props) {
		var data = props.data
		var act = props.act
		return h(SectionBlock, { title: "Session Controls" },
			data.authenticated
				? h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "6px"
					}
				},
					data.view_screen !== SCREEN_NONE
						? h(Button, {
							ghost: true,
							onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
						}, "Return To Main")
						: null,
					h(Button, {
						ghost: true,
						onClick: function () { act("balance_statement") }
					}, "Print Balance"),
					data.view_screen === SCREEN_LOGS
						? h(Button, {
							ghost: true,
							onClick: function () { act("print_transaction") }
						}, "Print Ledger")
						: null,
					h(Button, {
						ghost: true,
						danger: true,
						onClick: function () { act("logout") }
					}, "End Session")
				)
				: h(StatePanel, {
					compact: true,
					eyebrow: "Session State",
					title: "No active session",
					message: "Authenticate with an account number and optional PIN to unlock account operations."
				})
		)
	}

	function LoginView(props) {
		var data = props.data
		var act = props.act
		var formState = useState({
			account_num: "",
			account_pin: ""
		})
		var form = formState[0]
		var setForm = formState[1]
		var activeFieldState = useState("account_num")
		var activeField = activeFieldState[0]
		var setActiveField = activeFieldState[1]

		useEffect(function () {
			setForm({ account_num: "", account_pin: "" })
			setActiveField("account_num")
		}, [data.locked_down, data.account_security_level, data.has_card])

		function setField(key, value) {
			setForm({
				account_num: key === "account_num" ? value : form.account_num,
				account_pin: key === "account_pin" ? value : form.account_pin
			})
		}

		function appendDigit(digit) {
			var key = data.account_security_level ? activeField : "account_num"
			setField(key, String(form[key] || "") + digit)
		}

		function clearField() {
			var key = data.account_security_level ? activeField : "account_num"
			setField(key, "")
		}

		function submit() {
			act("attempt_auth", {
				account_num: form.account_num,
				account_pin: form.account_pin
			})
		}

		if (data.emagged) {
			return h(SectionBlock, { title: "Access Control" },
				h(ErrorState, {
					title: "Unauthorized terminal state",
					message: "This ATM has been forced into a lockdown condition and will not open a banking session."
				})
			)
		}

		if (data.locked_down) {
			return h(SectionBlock, { title: "Access Control" },
				h(ErrorState, {
					title: "PIN retry limit reached",
					message: "Local authentication is temporarily disabled on this unit after repeated failed access attempts."
				})
			)
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px"
			}
		},
			h(SectionBlock, { title: "Session Access" },
				h("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) 162px",
						gap: "10px",
						alignItems: "start"
					}
				},
					h("div", null,
						h(KeyValueRow, { label: "Reader", first: true }, data.has_card ? "Bound credential detected" : "Reader empty"),
						h(KeyValueRow, { label: "Protocol" }, securityLabel(data.account_security_level)),
						h(KeyValueRow, { label: "Requirements" },
							data.account_security_level === 0
								? "Account number or bound credential"
								: data.account_security_level === 1
									? "Account number and PIN"
									: "Account number, PIN, and bound credential"
						),
						h("div", { style: { marginTop: "10px" } },
							h("label", { style: { display: "block" } },
								fieldLabel("Account Number"),
								h(SUI.Input, {
									fluid: true,
									value: form.account_num,
									onChange: function (value) { setField("account_num", value) },
									onEnter: submit
								})
							),
							data.account_security_level
								? h("label", { style: { display: "block", marginTop: "8px" } },
									fieldLabel("PIN"),
									h(SUI.Input, {
										fluid: true,
										value: form.account_pin,
										onChange: function (value) { setField("account_pin", value) },
										onEnter: submit
									})
								)
								: null,
							h("div", {
								style: {
									display: "flex",
									gap: "6px",
									flexWrap: "wrap",
									marginTop: "8px"
								}
							},
								h(Button, {
									ghost: true,
									ghostFill: activeField === "account_num",
									onClick: function () { setActiveField("account_num") }
								}, "Account"),
								data.account_security_level
									? h(Button, {
										ghost: true,
										ghostFill: activeField === "account_pin",
										onClick: function () { setActiveField("account_pin") }
									}, "PIN")
									: null,
								h(Button, {
									onClick: submit
								}, "Authorize")
							)
						)
					),
					h("div", null,
						fieldLabel("Numeric Keypad"),
						h(NumericPad, {
							onDigit: appendDigit,
							onClear: clearField,
							onConfirm: submit
						})
					)
				)
			),
			h(SectionBlock, { title: "Authorization Notes" },
				h(KeyValueRow, { label: "Guidance", first: true },
					data.account_security_level === 0
						? "Scan a bound ID or enter an account number manually."
						: data.account_security_level === 1
							? "Manual access requires both account number and PIN."
							: "Maximum security requires a bound credential in the reader."
				)
			)
		)
	}

	function OverviewView(props) {
		var data = props.data
		var act = props.act
		var amountState = useState("")
		var amount = amountState[0]
		var setAmount = amountState[1]
		var modeState = useState("withdrawal")
		var withdrawMode = modeState[0]
		var setWithdrawMode = modeState[1]
		var presets = ["20", "50", "100", "200"]

		function submitWithdraw() {
			act(withdrawMode, { funds_amount: amount })
			setAmount("")
		}

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px"
			}
		},
			data.account_suspended
				? h(SectionBlock, { title: "Account Hold" },
					h(StatePanel, {
						tone: "danger",
						compact: true,
						eyebrow: "Account Status",
						title: "Funds access suspended",
						message: "This account is frozen and cannot be used for withdrawals or transfers from this terminal."
					})
				)
				: null,
			h(SectionBlock, { title: "Account Summary" },
				h("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) 180px",
						gap: "10px",
						alignItems: "start"
					}
				},
					h("div", null,
						h(KeyValueRow, { label: "Holder", first: true }, data.owner_name || "Unknown"),
						h(KeyValueRow, { label: "Account" }, "#" + (data.account_number || "----")),
						h(KeyValueRow, { label: "Security" }, securityLabel(data.authenticated_security_level)),
						h(KeyValueRow, { label: "Session" },
							h(StatusBadge, {
								active: !data.account_suspended,
								activeLabel: "Active",
								inactiveLabel: "Suspended",
								activeColor: THEME.good,
								inactiveColor: THEME.bad,
								activeTextColor: THEME.text
							})
						)
					),
					h(DenseRow, null,
						h("div", {
							style: {
								color: THEME.subtle,
								fontSize: "10px",
								fontWeight: "600",
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, "Available Balance"),
						h("div", {
							style: {
								marginTop: "6px",
								color: THEME.text,
								fontSize: "22px",
								fontWeight: "700",
								lineHeight: "24px",
								fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
							}
						}, formatMoney(data.currency, data.balance))
					)
				)
			),
			h(SectionBlock, { title: "Available Services" },
				h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "6px"
					}
				},
					h(ServiceRow, {
						icon: "locked",
						title: "Security Profile",
						description: "Adjust authentication requirements for this account.",
						actionLabel: "Open",
						disabled: data.account_suspended,
						onClick: function () { act("view_screen", { view_screen: SCREEN_SECURITY }) }
					}),
					h(ServiceRow, {
						icon: "arrowthick-1-e",
						title: "Funds Transfer",
						description: "Route funds to another account on the banking network.",
						actionLabel: "Open",
						disabled: data.account_suspended,
						onClick: function () { act("view_screen", { view_screen: SCREEN_TRANSFER }) }
					}),
					h(ServiceRow, {
						icon: "document",
						title: "Transaction Ledger",
						description: "Inspect locally available account transaction records.",
						actionLabel: "View",
						onClick: function () { act("view_screen", { view_screen: SCREEN_LOGS }) }
					}),
					h(ServiceRow, {
						icon: "print",
						title: "Balance Statement",
						description: "Print a compact paper balance report for the current session.",
						actionLabel: "Print",
						primary: true,
						onClick: function () { act("balance_statement") }
					})
				)
			),
			h(SectionBlock, { title: "Cash Dispenser" },
				h(KeyValueRow, { label: "Mode", first: true }, withdrawMode === "withdrawal" ? "Physical Cash" : "Chargecard"),
				h("div", {
					style: {
						display: "flex",
						gap: "6px",
						flexWrap: "wrap",
						marginTop: "8px"
					}
				},
					h(Button, {
						ghost: true,
						ghostFill: withdrawMode === "withdrawal",
						onClick: function () { setWithdrawMode("withdrawal") }
					}, "Physical Cash"),
					h(Button, {
						ghost: true,
						ghostFill: withdrawMode === "e_withdrawal",
						onClick: function () { setWithdrawMode("e_withdrawal") }
					}, "Chargecard")
				),
				h("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
						gap: "6px",
						marginTop: "8px"
					}
				},
					presets.map(function (value) {
						return h(Button, {
							key: value,
							ghost: true,
							style: { width: "100%", justifyContent: "center", padding: "0 6px" },
							disabled: data.account_suspended,
							onClick: function () { act(withdrawMode, { funds_amount: value }) }
						}, formatMoney(data.currency, value))
					})
				),
				h("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) auto",
						gap: "6px",
						alignItems: "end",
						marginTop: "8px"
					}
				},
					h("label", { style: { display: "block" } },
						fieldLabel("Manual Amount"),
						h(SUI.Input, {
							fluid: true,
							value: amount,
							onChange: setAmount,
							onEnter: submitWithdraw
						})
					),
					h(Button, {
						disabled: data.account_suspended,
						onClick: submitWithdraw
					}, "Dispense")
				)
			)
		)
	}

	function SecurityView(props) {
		var data = props.data
		var act = props.act
		var current = Number(data.authenticated_security_level || 0)
		var items = [
			{
				level: 0,
				title: "Minimum Security",
				description: "Account number or a bound credential can be used."
			},
			{
				level: 1,
				title: "Moderate Security",
				description: "Manual account number and PIN entry are required."
			},
			{
				level: 2,
				title: "Maximum Security",
				description: "Account number, PIN, and the bound credential are all required."
			}
		]

		return h(SectionBlock, { title: "Security Profiles" },
			h("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "6px"
				}
			},
				items.map(function (item) {
					return h(DenseRow, { key: item.level },
						h("div", {
							style: {
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "space-between",
								gap: "10px"
							}
						},
							h("div", { style: { minWidth: "0", flex: "1 1 auto" } },
								h("div", {
									style: {
										color: THEME.text,
										fontSize: "13px",
										fontWeight: "700",
										lineHeight: "15px",
										fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
									}
								}, item.title),
								h("div", {
									style: {
										marginTop: "2px",
										color: THEME.muted,
										fontSize: "11px",
										lineHeight: "13px",
										fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
									}
								}, item.description)
							),
							current === item.level
								? h(StatusBadge, {
									active: true,
									activeLabel: "Active",
									activeColor: THEME.good,
									activeTextColor: THEME.text
								})
								: h(Button, {
									disabled: data.account_suspended,
									onClick: function () {
										act("change_security_level", { new_security_level: item.level })
									}
								}, "Select")
						)
					)
				})
			),
			h("div", { style: { marginTop: "8px" } },
				h(Button, {
					ghost: true,
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			)
		)
	}

	function TransferView(props) {
		var data = props.data
		var act = props.act
		var formState = useState({
			target_acc_number: "",
			funds_amount: "",
			purpose: "Funds transfer"
		})
		var form = formState[0]
		var setForm = formState[1]

		function updateField(key, value) {
			var next = {
				target_acc_number: form.target_acc_number,
				funds_amount: form.funds_amount,
				purpose: form.purpose
			}
			next[key] = value
			setForm(next)
		}

		function submit() {
			act("transfer", form)
		}

		return h(SectionBlock, { title: "Transfer Routing" },
			h(KeyValueRow, { label: "Available", first: true }, formatMoney(data.currency, data.balance)),
			h("div", { style: { marginTop: "8px" } },
				h("label", { style: { display: "block" } },
					fieldLabel("Target Account"),
					h(SUI.Input, {
						fluid: true,
						value: form.target_acc_number,
						onChange: function (value) { updateField("target_acc_number", value) }
					})
				),
				h("label", { style: { display: "block", marginTop: "8px" } },
					fieldLabel("Amount"),
					h(SUI.Input, {
						fluid: true,
						value: form.funds_amount,
						onChange: function (value) { updateField("funds_amount", value) }
					})
				),
				h("label", { style: { display: "block", marginTop: "8px" } },
					fieldLabel("Purpose"),
					h(SUI.Input, {
						fluid: true,
						value: form.purpose,
						onChange: function (value) { updateField("purpose", value) },
						onEnter: submit
					})
				)
			),
			h("div", {
				style: {
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					marginTop: "8px"
				}
			},
				h(Button, {
					disabled: data.account_suspended,
					onClick: submit
				}, "Transfer Funds"),
				h(Button, {
					ghost: true,
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			)
		)
	}

	function LedgerView(props) {
		var data = props.data
		var act = props.act
		var rows = data.transaction_logs || []

		return h(SectionBlock, { title: "Transaction Ledger" },
			h("div", {
				style: {
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					marginBottom: "10px"
				}
			},
				h(Button, {
					onClick: function () { act("print_transaction") }
				}, "Print Ledger"),
				h(Button, {
					ghost: true,
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			),
			rows.length
				? h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "0"
					}
				},
					h("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "minmax(0, 1.6fr) 96px 86px",
							columnGap: "10px",
							padding: "0 6px 8px",
							borderBottom: "1px solid " + THEME.rowBorder
						}
					},
						["Entry", "When", "Value"].map(function (label) {
							return h("div", {
								key: label,
								style: {
									color: THEME.subtle,
									fontSize: "10px",
									fontWeight: "500",
									letterSpacing: "0.12em",
									textTransform: "uppercase",
									fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
								}
							}, label)
						})
					),
					rows.map(function (row, index) {
						return h("div", {
							key: row.date + "_" + row.time + "_" + index,
							class: "suiAtmDenseRow",
							style: {
								display: "grid",
								gridTemplateColumns: "minmax(0, 1.6fr) 96px 86px",
								columnGap: "10px",
								alignItems: "center",
								padding: "8px 6px",
								borderTop: index ? "1px solid " + THEME.rowBorder : "none",
								background: THEME.cardBackground
							}
						},
							h("div", { style: { minWidth: "0" } },
								h("div", {
									style: {
										color: THEME.text,
										fontSize: "13px",
										fontWeight: "700",
										lineHeight: "15px",
										fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
									}
								}, row.purpose || "Transaction"),
								h("div", {
									style: {
										marginTop: "2px",
										color: THEME.muted,
										fontSize: "11px",
										lineHeight: "13px",
										fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
										wordBreak: "break-word"
									}
								},
									"Target: " + (row.target || "-") + " | Terminal: " + (row.source_terminal || "-")
								)
							),
							h("div", {
								style: {
									color: THEME.muted,
									fontSize: "11px",
									lineHeight: "13px",
									fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
								}
							},
								h("div", null, row.date || "--"),
								h("div", null, row.time || "--")
							),
							h("div", {
								style: {
									color: THEME.text,
									fontSize: "12px",
									fontWeight: "700",
									fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
								}
							}, row.value || "-")
						)
					})
				)
				: h(EmptyState, {
					title: "No ledger records",
					message: "This account does not currently expose any transaction rows to the local ATM cache.",
					compact: true
				})
		)
	}

	function MainView(props) {
		var data = props.data
		var act = props.act
		if (data.view_screen === SCREEN_SECURITY) {
			return h(SecurityView, { data: data, act: act })
		}
		if (data.view_screen === SCREEN_TRANSFER) {
			return h(TransferView, { data: data, act: act })
		}
		if (data.view_screen === SCREEN_LOGS) {
			return h(LedgerView, { data: data, act: act })
		}
		return h(OverviewView, { data: data, act: act })
	}

	function ATM() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		ensureATMStyles()

		return h("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				minHeight: "100%",
				padding: "8px",
				background: THEME.pageBackground,
				fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
				boxSizing: "border-box"
			}
		},
			h(ShellHeader, {
				meta: "Machine: " + (data.machine_id || "UNKNOWN") + " | Screen: " + (data.authenticated ? currentScreenLabel(data.view_screen) : "Login"),
				sessionTag: data.authenticated ? "Session: Open" : "Session: Standby",
				showMain: !!data.authenticated && data.view_screen !== SCREEN_NONE,
				showLogout: !!data.authenticated,
				onMain: function () { act("view_screen", { view_screen: SCREEN_NONE }) },
				onLogout: function () { act("logout") }
			}),
			h("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "minmax(0, 1fr) 220px",
					gap: "8px",
					alignItems: "start"
				}
			},
				h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						minWidth: "0"
					}
				},
					data.authenticated
						? h(MainView, { data: data, act: act })
						: h(LoginView, { data: data, act: act })
				),
				h("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						minWidth: "0"
					}
				},
					h(CredentialPanel, { data: data, act: act }),
					h(StatusPanel, { data: data }),
					h(SessionPanel, { data: data, act: act })
				)
			)
		)
	}

	SUI.registerInterface("ATM", ATM)
})()
