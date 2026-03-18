;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function JobSection(props) {
		var title = props.title
		var jobs = props.jobs || []
		var data = props.data
		var act = props.act
		if (!jobs.length) return null
		return h(SUI.Section, { title: title },
			h(SUI.Stack, { gap: "4px", wrap: true },
				jobs.map(function (job) {
					return h(SUI.Button, {
						key: job.job,
						disabled: data.id_rank === job.job,
						onClick: function () { act("assign", { assign_target: job.job }) }
					}, job.job)
				})
			)
		)
	}

	function CardMod() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var jobSections = [
			["Command", data.command_jobs],
			["Support", data.support_jobs],
			["Engineering", data.engineering_jobs],
			["Medical", data.medical_jobs],
			["Science", data.science_jobs],
			["Security", data.security_jobs],
			["Supply", data.supply_jobs],
			["Exploration", data.exploration_jobs],
			["Service", data.service_jobs],
			["Civilian", data.civilian_jobs]
		]

		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Mode" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					data.have_id_slot ? h(SUI.Button, { selected: !!data.mmode, onClick: function () { act("switchm", { target: "mod" }) } }, "Access Modification") : null,
					h(SUI.Button, { selected: !data.mmode, onClick: function () { act("switchm", { target: "manifest" }) } }, "Crew Manifest"),
					data.have_printer ? h(SUI.Button, { disabled: data.mmode && !data.has_id, onClick: function () { act("print") } }, "Print") : null
				)
			),
			!data.mmode ? h(SUI.Section, { title: "Crew Manifest", fill: true, scrollable: true },
				h("div", { dangerouslySetInnerHTML: { __html: data.manifest || "" } })
			) : null,
			data.mmode ? h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
				!data.has_id ? h(SUI.NoticeBox, null, "Please insert the ID into the terminal to proceed.") : null,
				h(SUI.Section, { title: "Target Identity" },
					h(SUI.LabeledList, null,
						h(SUI.LabeledList.Item, { label: "Card" },
							h(SUI.Button, { onClick: function () { act("eject") } }, data.id_name || "Insert/Eject")
						)
					)
				),
				data.authenticated && data.has_id ? h(SUI.Section, { title: "Details" },
					h(SUI.LabeledList, null,
						h(SUI.LabeledList.Item, { label: "Registered Name" },
							h(SUI.Button, { onClick: function () { act("edit", { name: "1" }) } }, data.id_owner || "-----")
						),
						h(SUI.LabeledList.Item, { label: "Account Number" },
							h(SUI.Button, { onClick: function () { act("edit", { account: "1" }) } }, String(data.id_account_number || ""))
						),
						h(SUI.LabeledList.Item, { label: "Email Login" },
							h(SUI.Button, { onClick: function () { act("edit", { elogin: "1" }) } }, data.id_email_login || "")
						),
						h(SUI.LabeledList.Item, { label: "Email Password" },
							h(SUI.Button, { onClick: function () { act("edit", { epswd: "1" }) } }, data.id_email_password || "")
						),
						h(SUI.LabeledList.Item, { label: "Branch" }, data.id_military_branch || "Unset"),
						h(SUI.LabeledList.Item, { label: "Rank" }, data.id_military_rank || "Unset")
					),
					h("div", { style: { marginTop: "8px" } },
						h(SUI.Button, { disabled: data.id_rank === "Terminated", className: "linkDanger", onClick: function () { act("terminate") } }, "Terminate " + (data.id_owner || "Employee"))
					)
				) : h(SUI.NoticeBox, { danger: true }, "Access denied or no ID inserted."),
				data.authenticated && data.has_id ? h(SUI.Section, { title: "Assignments" },
					h(SUI.Stack, { gap: "6px", wrap: true },
						h(SUI.Button, { selected: !!data.assignments, onClick: function () { act("togglea") } }, data.assignments ? "Hide Assignments" : "Show Assignments"),
						h(SUI.Button, { onClick: function () { act("assign", { assign_target: "Custom" }) } }, "Custom")
					),
					data.assignments ? h(SUI.Stack, { vertical: true, gap: "8px", style: { marginTop: "8px" } },
						jobSections.map(function (section) {
							return h(JobSection, { key: section[0], title: section[0], jobs: section[1], data: data, act: act })
						}),
						data.centcom_access ? h(JobSection, { title: "CentCom", jobs: data.centcom_jobs || [], data: data, act: act }) : null
					) : null
				) : null,
				data.authenticated && data.has_id ? h(SUI.Section, { title: "Military Branches" },
					h(SUI.Stack, { gap: "4px", wrap: true },
						(data.military_branches || []).map(function (branch) {
							return h(SUI.Button, {
								key: branch.branch,
								disabled: data.id_military_branch === branch.branch,
								onClick: function () { act("set_military_branch", { branch_target: branch.branch }) }
							}, branch.branch)
						})
					),
					(data.military_ranks || []).length ? h("div", { style: { marginTop: "8px" } },
						h(SUI.Stack, { gap: "4px", wrap: true },
							(data.military_ranks || []).map(function (rank) {
								return h(SUI.Button, {
									key: rank.rank,
									disabled: data.id_military_rank === rank.rank,
									onClick: function () { act("set_military_rank", { rank_target: rank.rank }) }
								}, rank.rank)
							})
						)
					) : null
				) : null,
				data.authenticated && data.has_id ? h(SUI.Section, { title: data.centcom_access ? "Central Command Access" : (data.station_name || "Station Access"), fill: true, scrollable: true },
					data.centcom_access
						? h(SUI.Stack, { gap: "4px", wrap: true },
							(data.all_centcom_access || []).map(function (access) {
								return h(SUI.Button, {
									key: String(access.ref),
									selected: !!access.allowed,
									onClick: function () { act("access", { access_target: String(access.ref), allowed: String(access.allowed ? 1 : 0) }) }
								}, access.desc)
							})
						)
						: (data.regions || []).map(function (region) {
							return h(SUI.Section, { key: region.name, title: region.name },
								h(SUI.Stack, { gap: "4px", wrap: true },
									(region.accesses || []).map(function (access) {
										return h(SUI.Button, {
											key: String(access.ref),
											selected: !!access.allowed,
											onClick: function () { act("access", { access_target: String(access.ref), allowed: String(access.allowed ? 1 : 0) }) }
										}, access.desc)
									})
								)
							)
						})
				) : null
			) : null
		)
	}

	SUI.registerInterface("CardMod", CardMod)
})()
