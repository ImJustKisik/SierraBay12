;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var useState = SUI.useState
	var useEffect = SUI.useEffect

	var SCREEN_NONE = 0
	var SCREEN_SECURITY = 1
	var SCREEN_TRANSFER = 2
	var SCREEN_LOGS = 3

	function formatMoney(currency, amount) {
		var value = Number(amount)
		if (isNaN(value)) {
			return currency + "0"
		}
		return currency + value.toFixed(2)
	}

	function Section(props) {
		return h(SUI.Section, {
			title: props.title,
			fill: props.fill,
			scrollable: props.scrollable,
			style: props.style
		}, props.children)
	}

	function ActionRow(props) {
		return h(SUI.Stack, {
			gap: "6px",
			wrap: true,
			style: props.style || null
		}, props.children)
	}

	function StatusBox(props) {
		return h(SUI.NoticeBox, {
			danger: !!props.danger
		}, props.children)
	}

	function CardPanel(props) {
		var data = props.data
		var act = props.act
		return h(Section, { title: "Card Reader" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Terminal" }, data.machine_id),
				h(SUI.LabeledList.Item, { label: "Card" }, data.held_card_name)
			),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: function () { act("insert_card") }
				}, data.has_card ? "Eject Card" : "Insert Card")
			)
		)
	}

	function LoginPanel(props) {
		var data = props.data
		var act = props.act
		var formState = useState({
			account_num: "",
			account_pin: ""
		})
		var form = formState[0]
		var setForm = formState[1]

		useEffect(function () {
			setForm({ account_num: "", account_pin: "" })
		}, [data.locked_down, data.account_security_level, data.has_card])

		function submit() {
			act("attempt_auth", {
				account_num: form.account_num,
				account_pin: form.account_pin
			})
		}

		return h(Section, { title: "Account Access", fill: true },
			data.emagged ? h(StatusBox, { danger: true },
				"LOCKED. Unauthorized terminal access detected. This ATM has been locked down."
			) : null,
			!data.emagged && data.locked_down ? h(StatusBox, { danger: true },
				"Maximum number of PIN attempts exceeded. Access to this ATM is temporarily disabled."
			) : null,
			!data.emagged && !data.locked_down ? h(StatusBox, null,
				data.account_security_level === 0
					? "Submit with a scanned ID, or enter an account number manually to access another account."
					: data.account_security_level === 1
						? "This account requires a PIN. Re-enter the account number or rescan an ID linked to the account."
						: "Maximum security requires account number, PIN, and the bound ID card in the reader."
			) : null,
			!data.emagged && !data.locked_down ? h(SUI.Stack, {
				vertical: true,
				gap: "8px",
				style: { marginTop: "8px" }
			},
				h("label", null,
					h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "Account Number"),
					h(SUI.Input, {
						fluid: true,
						value: form.account_num,
						onChange: function (value) {
							setForm({
								account_num: value,
								account_pin: form.account_pin
							})
						},
						onEnter: submit
					})
				),
				data.account_security_level
					? h("label", null,
						h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "PIN"),
						h(SUI.Input, {
							fluid: true,
							value: form.account_pin,
							onChange: function (value) {
								setForm({
									account_num: form.account_num,
									account_pin: value
								})
							},
							onEnter: submit
						})
					)
					: null,
				h(ActionRow, null,
					h(SUI.Button, {
						onClick: submit
					}, "Submit")
				)
			) : null
		)
	}

	function OverviewPanel(props) {
		var data = props.data
		var act = props.act
		return h(Section, { title: "Account Overview" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Account Holder" }, data.owner_name),
				h(SUI.LabeledList.Item, { label: "Account Number" }, "#" + data.account_number),
				h(SUI.LabeledList.Item, { label: "Balance" }, formatMoney(data.currency, data.balance)),
				h(SUI.LabeledList.Item, { label: "Security" },
					data.authenticated_security_level === 0 ? "Minimum" : data.authenticated_security_level === 1 ? "Moderate" : "Maximum"
				)
			),
			data.account_suspended ? h(StatusBox, { danger: true },
				"Access to this account has been suspended, and the funds within frozen."
			) : null,
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_SECURITY }) },
					disabled: data.account_suspended
				}, "Security"),
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_TRANSFER }) },
					disabled: data.account_suspended
				}, "Transfer"),
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_LOGS }) }
				}, "Transaction Log"),
				h(SUI.Button, {
					onClick: function () { act("balance_statement") }
				}, "Print Balance"),
				h(SUI.Button, {
					onClick: function () { act("logout") }
				}, "Logout")
			)
		)
	}

	function WithdrawPanel(props) {
		var data = props.data
		var act = props.act
		var amountState = useState("")
		var withdrawModeState = useState("withdrawal")
		var amount = amountState[0]
		var setAmount = amountState[1]
		var withdrawMode = withdrawModeState[0]
		var setWithdrawMode = withdrawModeState[1]

		function submit() {
			act(withdrawMode, { funds_amount: amount })
			setAmount("")
		}

		return h(Section, { title: "Withdraw Funds" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Available Funds" }, formatMoney(data.currency, data.balance))
			),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					selected: withdrawMode === "withdrawal",
					onClick: function () { setWithdrawMode("withdrawal") }
				}, "Cash"),
				h(SUI.Button, {
					selected: withdrawMode === "e_withdrawal",
					onClick: function () { setWithdrawMode("e_withdrawal") }
				}, "Chargecard")
			),
			h("label", { style: { display: "block", marginTop: "8px" } },
				h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "Amount"),
				h(SUI.Input, {
					fluid: true,
					value: amount,
					onChange: setAmount,
					onEnter: submit
				})
			),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: submit,
					disabled: data.account_suspended
				}, "Withdraw")
			)
		)
	}

	function SecurityPanel(props) {
		var data = props.data
		var act = props.act
		var current = Number(data.authenticated_security_level || 0)
		var items = [
			{
				level: 0,
				title: "Minimum Security",
				description: "Account number or a bound card can be used. EFTPOS requires a card and prompts for a PIN without strict validation."
			},
			{
				level: 1,
				title: "Moderate Security",
				description: "Manual account number and PIN entry are required to access and process transactions."
			},
			{
				level: 2,
				title: "Maximum Security",
				description: "Account number, PIN, and the bound card are all required to access and process transactions."
			}
		]

		return h(Section, { title: "Account Security", fill: true, scrollable: true },
			items.map(function (item, index) {
				return h("div", {
					key: item.level,
					style: {
						padding: "8px 0",
						borderTop: index ? "1px solid #444" : "none"
					}
				},
					h("div", { style: { fontWeight: "bold", marginBottom: "4px" } }, item.title),
					h("div", { style: { fontSize: "11px", opacity: "0.85", marginBottom: "6px" } }, item.description),
					current === item.level
						? h(StatusBox, null, "Current security level")
						: h(SUI.Button, {
							onClick: function () {
								act("change_security_level", { new_security_level: item.level })
							},
							disabled: data.account_suspended
						}, "Select")
				)
			}),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			)
		)
	}

	function TransferPanel(props) {
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

		return h(Section, { title: "Funds Transfer" },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Available Funds" }, formatMoney(data.currency, data.balance))
			),
			h(SUI.Stack, { vertical: true, gap: "8px", style: { marginTop: "8px" } },
				h("label", null,
					h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "Target Account Number"),
					h(SUI.Input, {
						fluid: true,
						value: form.target_acc_number,
						onChange: function (value) { updateField("target_acc_number", value) }
					})
				),
				h("label", null,
					h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "Funds To Transfer"),
					h(SUI.Input, {
						fluid: true,
						value: form.funds_amount,
						onChange: function (value) { updateField("funds_amount", value) }
					})
				),
				h("label", null,
					h("div", { style: { marginBottom: "4px", fontSize: "11px" } }, "Purpose"),
					h(SUI.Input, {
						fluid: true,
						value: form.purpose,
						onChange: function (value) { updateField("purpose", value) },
						onEnter: submit
					})
				)
			),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: submit,
					disabled: data.account_suspended
				}, "Transfer Funds"),
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			)
		)
	}

	function TransactionLogsPanel(props) {
		var data = props.data
		var act = props.act
		var rows = data.transaction_logs || []
		return h(Section, { title: "Transaction Logs", fill: true, scrollable: true },
			rows.length
				? h(SUI.Table, { style: { width: "100%" } },
					h(SUI.Table.Row, null,
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Date"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Time"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Target"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Purpose"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Value"),
						h(SUI.Table.Cell, { style: { fontWeight: "bold" } }, "Terminal")
					),
					rows.map(function (row, index) {
						return h(SUI.Table.Row, { key: row.date + "_" + row.time + "_" + index },
							h(SUI.Table.Cell, null, row.date),
							h(SUI.Table.Cell, null, row.time),
							h(SUI.Table.Cell, null, row.target),
							h(SUI.Table.Cell, null, row.purpose),
							h(SUI.Table.Cell, null, row.value),
							h(SUI.Table.Cell, null, row.source_terminal)
						)
					})
				)
				: h(StatusBox, null, "No transaction logs available."),
			h(ActionRow, { style: { marginTop: "8px" } },
				h(SUI.Button, {
					onClick: function () { act("print_transaction") }
				}, "Print"),
				h(SUI.Button, {
					onClick: function () { act("view_screen", { view_screen: SCREEN_NONE }) }
				}, "Back")
			)
		)
	}

	function AuthenticatedView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(OverviewPanel, { data: data, act: act }),
			data.view_screen === SCREEN_SECURITY
				? h(SecurityPanel, { data: data, act: act })
				: data.view_screen === SCREEN_TRANSFER
					? h(TransferPanel, { data: data, act: act })
					: data.view_screen === SCREEN_LOGS
						? h(TransactionLogsPanel, { data: data, act: act })
						: h(WithdrawPanel, { data: data, act: act })
		)
	}

	function ATM() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			h(CardPanel, { data: data, act: act }),
			data.authenticated
				? h(AuthenticatedView, { data: data, act: act })
				: h(LoginPanel, { data: data, act: act })
		)
	}

	SUI.registerInterface("ATM", ATM)
})()
