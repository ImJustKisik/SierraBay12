#define REPORTS_VIEW      1
#define REPORTS_DOWNLOAD  2

/datum/computer_file/program/reports
	filename = "repview"
	filedesc = "Report Editor"
	nanomodule_path = /datum/nano_module/program/reports
	extended_desc = "A general paperwork viewing and editing utility."
	program_icon_state = "word"
	program_key_state = "atmos_key"
	size = 2
	available_on_ntnet = TRUE
	requires_ntnet = FALSE
	usage_flags = PROGRAM_ALL
	category = PROG_OFFICE

/datum/nano_module/program/reports
	name = "Report Editor"
	sui_interface_name = "Reports"
	sui_width = 700
	sui_height = 800

	/// Whether we are in view-only mode.
	var/can_view_only = FALSE
	/// A report being viewed/edited. This is a temporary copy.
	var/datum/computer_file/report/selected_report
	/// The computer file currently open.
	var/datum/computer_file/report/saved_report
	var/prog_state = REPORTS_VIEW

/datum/nano_module/program/reports/proc/build_reports_data(mob/user)
	var/list/data = host.initial_data(program)
	data["prog_state"] = prog_state
	switch(prog_state)
		if(REPORTS_VIEW)
			if(selected_report)
				data["report_data"] = selected_report.generate_nano_data(get_access(user))
			data["view_only"] = can_view_only
			data["printer"] = program.computer.has_component(PART_PRINTER)
		if(REPORTS_DOWNLOAD)
			var/list/L = list()
			for(var/datum/computer_file/report/report in ntnet_global.fetch_reports(get_access(user)))
				var/M = list()
				M["name"] = report.display_name()
				M["uid"] = report.uid
				L += list(M)
			data["reports"] = L
	return data

/datum/nano_module/program/reports/proc/confirm_unsaved_changes(mob/user)
	if(!selected_report || can_view_only || !istype(user))
		return TRUE
	return alert(user, "Are you sure you want to leave this page? Unsubmitted data will be lost.",, "Yes.", "No.") == "Yes."

/datum/nano_module/program/reports/proc/handle_reports_action(action, list/params, mob/user)
	params = params || list()
	switch(action)
		if("load")
			if((selected_report || saved_report) && !confirm_unsaved_changes(user))
				return TOPIC_HANDLED
			if(selected_report || saved_report)
				close_report()
			load_report(user)
			return TOPIC_HANDLED
		if("save")
			if(!selected_report || !selected_report.verify_access(get_access(user)))
				return TOPIC_HANDLED
			save_report(user, text2num(params["save_as"]))
			return TOPIC_HANDLED
		if("submit")
			if(!selected_report || !selected_report.verify_access_edit(get_access(user)))
				return TOPIC_HANDLED
			if(selected_report.submit(user))
				to_chat(user, "The [src] has been submitted.")
				if(alert(user, "Would you like to save a copy?","Save Report", "Yes.", "No.") == "Yes.")
					save_report(user)
			return TOPIC_HANDLED
		if("discard")
			if(!selected_report)
				return TOPIC_HANDLED
			if(!can_view_only && !confirm_unsaved_changes(user))
				return TOPIC_HANDLED
			close_report()
			return TOPIC_HANDLED
		if("edit")
			if(!selected_report)
				return TOPIC_HANDLED
			var/field_ID = text2num(params["ID"])
			var/datum/report_field/field = selected_report.field_from_ID(field_ID)
			if(!field || !field.verify_access_edit(get_access(user)))
				return TOPIC_HANDLED
			field.ask_value(user)
			return TOPIC_HANDLED
		if("print")
			if(!selected_report || !selected_report.verify_access(get_access(user)))
				return TOPIC_HANDLED
			var/with_fields = text2num(params["print_mode"])
			var/text = selected_report.generate_pencode(get_access(user), with_fields)
			if(!program.computer.print_paper(text, selected_report.display_name()))
				to_chat(user, "Hardware error: Printer was unable to print the file. It may be out of paper.")
			return TOPIC_HANDLED
		if("export")
			if(!selected_report || !selected_report.verify_access(get_access(user)))
				return TOPIC_HANDLED
			selected_report.rename_file()
			var/datum/computer_file/data/text/file = new
			file.filename = selected_report.filename
			file.stored_data = selected_report.generate_pencode(get_access(user), no_html = TRUE)
			if(!program.computer.create_file(file))
				to_chat(user, "Error storing file. Please check your hard drive.")
			else
				to_chat(user, "The report has been exported as [file.filename].[file.filetype]")
			return TOPIC_HANDLED
		if("download")
			if(!confirm_unsaved_changes(user))
				return TOPIC_HANDLED
			switch_state(REPORTS_DOWNLOAD)
			return TOPIC_HANDLED
		if("get_report")
			var/uid = text2num(params["report"])
			for(var/datum/computer_file/report/report in ntnet_global.fetch_reports(get_access(user)))
				if(report.uid == uid)
					selected_report = report.clone()
					can_view_only = FALSE
					switch_state(REPORTS_VIEW)
					return TOPIC_HANDLED
			to_chat(user, "Network error: Selected report could not be downloaded. Check network functionality and credentials.")
			return TOPIC_HANDLED
		if("home")
			switch_state(REPORTS_VIEW)
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/nano_module/program/reports/sui_data(mob/user)
	return build_reports_data(user)

/datum/nano_module/program/reports/sui_act(action, list/params, datum/sui/ui)
	return handle_reports_action(action, params, ui?.user) != TOPIC_NOACTION

/datum/nano_module/program/reports/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, state = GLOB.default_state)
	var/list/data = build_reports_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "reports.tmpl", name, 700, 800, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()

/datum/nano_module/program/reports/proc/switch_state(new_state)
	if(prog_state == new_state)
		return
	switch(new_state)
		if(REPORTS_VIEW)
			program.requires_ntnet_feature = null
			program.requires_ntnet = FALSE
			prog_state = REPORTS_VIEW
		if(REPORTS_DOWNLOAD)
			close_report()
			program.requires_ntnet_feature = NTNET_SOFTWAREDOWNLOAD
			program.requires_ntnet = TRUE
			prog_state = REPORTS_DOWNLOAD

/datum/nano_module/program/reports/proc/close_report()
	QDEL_NULL(selected_report)
	saved_report = null

/datum/nano_module/program/reports/proc/save_report(mob/user, save_as)
	if(!program.computer || !program.computer.has_component(PART_HDD))
		to_chat(user, "Unable to find hard drive.")
		return
	selected_report.rename_file()
	if(!program.computer.create_file(selected_report))
		to_chat(user, "Error storing file. Please check your hard drive.")
		return
	saved_report = selected_report
	selected_report = saved_report.clone()
	to_chat(user, "The report has been saved as [saved_report.filename].[saved_report.filetype]")

/datum/nano_module/program/reports/proc/load_report(mob/user)
	if(!program.computer || !program.computer.has_component(PART_HDD))
		to_chat(user, "Unable to find hard drive.")
		return
	var/choices = list()
	for(var/datum/computer_file/report/R in program.computer.get_all_files())
		choices["[R.filename].[R.filetype]"] = R
	var/choice = input(user, "Which report would you like to load?", "Loading Report") as null|anything in choices
	if(choice in choices)
		var/datum/computer_file/report/chosen_report = choices[choice]
		var/editing = alert(user, "Would you like to view or edit the report", "Loading Report", "View", "Edit")
		if(editing == "View")
			if(!chosen_report.verify_access(get_access(user)))
				to_chat(user, SPAN_WARNING("You lack access to view this report."))
				return
			can_view_only = TRUE
		else
			if(!chosen_report.verify_access_edit(get_access(user)))
				to_chat(user, SPAN_WARNING("You lack access to edit this report."))
				return
			can_view_only = FALSE
		saved_report = chosen_report
		selected_report = chosen_report.clone()
		return

/datum/nano_module/program/reports/Topic(href, href_list)
	if(..())
		return TOPIC_HANDLED
	if(href_list["load"])
		return handle_reports_action("load", null, usr)
	if(href_list["save"])
		return handle_reports_action("save", list("save_as" = href_list["save_as"]), usr)
	if(href_list["submit"])
		return handle_reports_action("submit", null, usr)
	if(href_list["discard"])
		return handle_reports_action("discard", null, usr)
	if(href_list["edit"])
		return handle_reports_action("edit", list("ID" = href_list["ID"]), usr)
	if(href_list["print"])
		return handle_reports_action("print", list("print_mode" = href_list["print_mode"]), usr)
	if(href_list["export"])
		return handle_reports_action("export", null, usr)
	if(href_list["download"])
		return handle_reports_action("download", null, usr)
	if(href_list["get_report"])
		return handle_reports_action("get_report", list("report" = href_list["report"]), usr)
	if(href_list["home"])
		return handle_reports_action("home", null, usr)

#undef REPORTS_VIEW
#undef REPORTS_DOWNLOAD
