;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend

	function renderField(field, allowEdit, act) {
		if (field.ignore_value) {
			return h("h3", { key: field.name }, field.name)
		}
		return h(SUI.LabeledList.Item, { key: String(field.ID || field.name), label: field.name },
			h(SUI.Stack, { vertical: true, gap: "6px", fill: true },
				field.access ? h("div", {
					className: field.needs_big_box ? "block" : null,
					dangerouslySetInnerHTML: { __html: field.value || "" }
				}) : h("div", null, "Access Denied."),
				allowEdit && field.can_edit && field.access_edit
					? h(SUI.Button, { onClick: function () { act("edit", { ID: String(field.ID) }) } }, "Edit")
					: null
			)
		)
	}

	function MissionCard(props) {
		var mission = props.mission
		var act = props.act
		var shuttle = props.shuttle
		var shuttleAccess = !!props.shuttleAccess
		var queued = !!props.queued
		return h(SUI.Section, { title: mission.name + (mission.is_current ? " (ACTIVE)" : "") },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Status" }, mission.status),
				h(SUI.LabeledList.Item, { label: "Departure" }, mission.departure),
				h(SUI.LabeledList.Item, { label: "Return" }, mission.return_time)
			),
			h(SUI.Stack, { gap: "6px", wrap: true },
				h(SUI.Button, { onClick: function () { act("details", { shuttle: shuttle, mission: String(mission.ID) }) } }, "View Details"),
				queued ? h(SUI.Button, { disabled: !shuttleAccess, onClick: function () { act("modify", { modify: "move_up", shuttle: shuttle, mission: String(mission.ID) }) } }, "Move Up") : null,
				queued ? h(SUI.Button, { disabled: !shuttleAccess, onClick: function () { act("modify", { modify: "move_down", shuttle: shuttle, mission: String(mission.ID) }) } }, "Move Down") : null
			)
		)
	}

	function HomeView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			(data.shuttles || []).length ? (data.shuttles || []).map(function (shuttle) {
				return h(SUI.Section, { key: shuttle.name, title: shuttle.name },
					h(SUI.LabeledList, null,
						h(SUI.LabeledList.Item, { label: "Current Mission" }, shuttle.mission ? shuttle.mission_name : "None Planned."),
						shuttle.mission ? h(SUI.LabeledList.Item, { label: "Mission Status" }, shuttle.status) : null,
						shuttle.mission ? h(SUI.LabeledList.Item, { label: "Departure Time" }, shuttle.departure) : null
					),
					h(SUI.Stack, { gap: "6px", wrap: true },
						h(SUI.Button, { disabled: !shuttle.access, onClick: function () { act("new_mission", { shuttle: shuttle.name }) } }, "Create Mission"),
						h(SUI.Button, { disabled: !shuttle.mission, onClick: function () { act("details", { shuttle: shuttle.name, mission: String(shuttle.mission_ID) }) } }, "Mission Details"),
						h(SUI.Button, { onClick: function () { act("history", { shuttle: shuttle.name }) } }, "All Missions"),
						h(SUI.Button, { disabled: !shuttle.access || !shuttle.mission, onClick: function () { act("report", { shuttle: shuttle.name, mission: String(shuttle.mission_ID), flight_plan: "1" }) } }, shuttle.flight_plan ? "Edit Flight Plan" : "Create Flight Plan")
					)
				)
			}) : h(SUI.NoticeBox, null, "There are no shuttles in the system.")
		)
	}

	function AllMissionsView(props) {
		var data = props.data
		var act = props.act
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Navigation" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("home") } }, "Home"),
					h(SUI.Button, { disabled: !data.shuttle_access, onClick: function () { act("new_mission", { shuttle: data.shuttle_name }) } }, "Create Mission")
				)
			),
			h(SUI.Section, { title: "Mission History: " + data.shuttle_name },
				(data.mission_data || []).length ? (data.mission_data || []).map(function (mission) {
					return h(MissionCard, { key: "m_" + String(mission.ID), mission: mission, act: act, shuttle: data.shuttle_name, shuttleAccess: data.shuttle_access })
				}) : h(SUI.NoticeBox, null, "No past missions logged.")
			),
			h(SUI.Section, { title: "Scheduled Missions" },
				(data.queued_data || []).length ? (data.queued_data || []).map(function (mission) {
					return h(MissionCard, { key: "q_" + String(mission.ID), mission: mission, act: act, shuttle: data.shuttle_name, shuttleAccess: data.shuttle_access, queued: true })
				}) : h(SUI.NoticeBox, null, "No missions scheduled.")
			)
		)
	}

	function MissionDetailsView(props) {
		var data = props.data
		var act = props.act
		var mission = data.mission_data || {}
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Navigation" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("home") } }, "Home"),
					h(SUI.Button, { onClick: function () { act("history", { shuttle: data.shuttle_name }) } }, "All Missions")
				)
			),
			h(SUI.Section, { title: "Mission: " + mission.name + (mission.is_current ? " (ACTIVE)" : "") },
				h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Shuttle" }, data.shuttle_name || ""),
					h(SUI.LabeledList.Item, { label: "Status" }, mission.status || ""),
					h(SUI.LabeledList.Item, { label: "Departure" }, mission.departure || ""),
					h(SUI.LabeledList.Item, { label: "Return" }, mission.return_time || "")
				),
				h(SUI.Stack, { gap: "6px", wrap: true, style: { marginTop: "8px" } },
					h(SUI.Button, { disabled: !data.shuttle_access, onClick: function () { act("modify", { modify: "rename", shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "Rename Mission"),
					h(SUI.Button, { disabled: !data.shuttle_access || !mission.queued, onClick: function () { act("modify", { modify: "delete", shuttle: data.shuttle_name, mission: String(mission.ID), warning: "1" }) } }, "Delete Mission"),
					h(SUI.Button, { disabled: !data.shuttle_access, onClick: function () { act("report", { shuttle: data.shuttle_name, mission: String(mission.ID), flight_plan: "1" }) } }, data.flight_plan ? "Edit Flight Plan" : "Create Flight Plan"),
					h(SUI.Button, { disabled: !data.shuttle_access || !data.crew, onClick: function () { act("summon_crew", { shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "Summon Crew"),
					h(SUI.Button, { disabled: !data.crew, onClick: function () { act("email_crew", { shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "Email Crew")
				)
			),
			h(SUI.Section, { title: "Flight Plan", scrollable: true },
				data.flight_plan ? h(SUI.LabeledList, null,
					h(SUI.LabeledList.Item, { label: "Submitted By" }, data.flight_plan.creator || "Unknown"),
					(data.flight_plan.fields || []).map(function (field) {
						if (field.ignore_value) return null
						return h(SUI.LabeledList.Item, { key: field.name, label: field.name },
							h("div", { dangerouslySetInnerHTML: { __html: field.value || "" } })
						)
					})
				) : h(SUI.NoticeBox, null, "None submitted.")
			),
			(data.other_reports || []).length ? h(SUI.Section, { title: "Reports" },
				(data.other_reports || []).map(function (report) {
					return h(SUI.LabeledList, { key: report.index },
						h(SUI.LabeledList.Item, { label: report.name },
							h(SUI.Stack, { gap: "6px", wrap: true },
								h(SUI.Button, { disabled: !report.exists, onClick: function () { act("report", { view: "1", index: String(report.index), shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "View"),
								h(SUI.Button, { disabled: !report.access_edit || report.exists, onClick: function () { act("report", { index: String(report.index), shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "Create"),
								h(SUI.Button, { disabled: !report.access_edit || !report.exists, onClick: function () { act("report", { index: String(report.index), shuttle: data.shuttle_name, mission: String(mission.ID) }) } }, "Edit")
							)
						)
					)
				})
			) : null
		)
	}

	function ReportEditView(props) {
		var data = props.data
		var act = props.act
		var report = data.report_data || {}
		var warning = report.access_edit && !data.view_only ? "1" : null
		return h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
			h(SUI.Section, { title: "Navigation" },
				h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { onClick: function () { act("home", { warning: warning }) } }, "Home"),
					h(SUI.Button, { onClick: function () { act("history", { shuttle: data.shuttle_name, warning: warning }) } }, "All Missions"),
					h(SUI.Button, { onClick: function () { act("details", { shuttle: data.shuttle_name, mission: String(data.mission_data.ID), warning: warning }) } }, "Mission Details")
				)
			),
			h(SUI.Section, { title: report.name || "Report Editor", fill: true, scrollable: true },
				h(SUI.LabeledList, null, (report.fields || []).map(function (field) {
					return renderField(field, !data.view_only, act)
				}))
			),
			data.view_only
				? h(SUI.Button, { onClick: function () { act("details", { shuttle: data.shuttle_name, mission: String(data.mission_data.ID) }) } }, "Back")
				: h(SUI.Stack, { gap: "6px", wrap: true },
					h(SUI.Button, { disabled: !report.access_edit, onClick: function () { act("submit") } }, "Submit Report"),
					h(SUI.Button, { disabled: !report.access_edit, onClick: function () { act("discard", { warning: "1" }) } }, "Discard Changes")
				)
		)
	}

	function DeckManagement() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		if (!data.default_access) {
			return h(SUI.NoticeBox, { danger: true }, "You do not have program access.")
		}
		switch (data.prog_state) {
			case 2: return h(AllMissionsView, { data: data, act: act })
			case 3: return h(MissionDetailsView, { data: data, act: act })
			case 4: return h(ReportEditView, { data: data, act: act })
			default: return h(HomeView, { data: data, act: act })
		}
	}

	SUI.registerInterface("DeckManagement", DeckManagement)
})()
