/datum/computer_file/program/rcon_console
	filename = "rconconsole"
	filedesc = "RCON Remote Control"
	nanomodule_path = /datum/nano_module/program/rcon
	program_icon_state = "generic"
	program_key_state = "rd_key"
	program_menu_icon = "power"
	extended_desc = "This program allows remote control of power distribution systems. This program can not be run on tablet computers."
	required_access = access_engine
	requires_ntnet = TRUE
	network_destination = "RCON remote control system"
	requires_ntnet_feature = NTNET_SYSTEMCONTROL
	usage_flags = PROGRAM_LAPTOP | PROGRAM_CONSOLE
	size = 19
	category = PROG_ENG

/datum/nano_module/program/rcon
	name = "Power RCON"
	available_to_ai = TRUE
	sui_interface_name = "Rcon" // SIERRA-ADD - SUI
	sui_width = 700 // SIERRA-ADD - SUI
	sui_height = 540 // SIERRA-ADD - SUI
	var/list/known_SMESs = null
	var/list/known_breakers = null
	// Allows you to hide specific parts of the UI
	var/hide_SMES = 0
	var/hide_SMES_details = 0
	var/hide_breakers = 0

/datum/nano_module/program/rcon/proc/build_rcon_data(mob/user)
	FindDevices() // Update our devices list
	var/list/data = host.initial_data(program)

	// SMES DATA (simplified view)
	var/list/smeslist[0]
	for(var/obj/machinery/power/smes/buildable/SMES in known_SMESs)
		smeslist.Add(list(list(
		"charge" = round(SMES.Percentage()),
		"input_set" = SMES.input_attempt,
		"input_val" = round(SMES.input_level/1000, 0.1),
		"input_max" = round(SMES.input_level_max/1000, 0.1),
		"input_load" = round(SMES.input_available/1000, 0.1),
		"output_set" = SMES.output_attempt,
		"output_val" = round(SMES.output_level/1000, 0.1),
		"output_max" = round(SMES.output_level_max/1000, 0.1),
		"output_load" = round(SMES.output_used/1000, 0.1),
		"RCON_tag" = SMES.RCon_tag
		)))

	data["smes_info"] = sortByKey(smeslist, "RCON_tag")

	// BREAKER DATA (simplified view)
	var/list/breakerlist[0]
	for(var/obj/machinery/power/breakerbox/BR in known_breakers)
		breakerlist.Add(list(list(
		"RCON_tag" = BR.RCon_tag,
		"enabled" = BR.on
		)))
	data["breaker_info"] = breakerlist
	data["hide_smes"] = hide_SMES
	data["hide_smes_details"] = hide_SMES_details
	data["hide_breakers"] = hide_breakers
	return data

/datum/nano_module/program/rcon/sui_data(mob/user)
	return build_rcon_data(user)

/datum/nano_module/program/rcon/proc/toggle_smes_input(tag)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		SMES.toggle_input()
	return TRUE

/datum/nano_module/program/rcon/proc/toggle_smes_output(tag)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		SMES.toggle_output()
	return TRUE

/datum/nano_module/program/rcon/proc/set_smes_input_value(tag, value_kw)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		SMES.set_input(value_kw * 1000)
	return TRUE

/datum/nano_module/program/rcon/proc/set_smes_output_value(tag, value_kw)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		SMES.set_output(value_kw * 1000)
	return TRUE

/datum/nano_module/program/rcon/proc/prompt_smes_input(mob/user, tag)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		var/inputset = input(user, "Enter new input level (0-[SMES.input_level_max/1000] kW)", "SMES Input Power Control", SMES.input_level/1000) as num
		return set_smes_input_value(tag, inputset)
	return TRUE

/datum/nano_module/program/rcon/proc/prompt_smes_output(mob/user, tag)
	var/obj/machinery/power/smes/buildable/SMES = GetSMESByTag(tag)
	if(SMES)
		var/outputset = input(user, "Enter new output level (0-[SMES.output_level_max/1000] kW)", "SMES Input Power Control", SMES.output_level/1000) as num
		return set_smes_output_value(tag, outputset)
	return TRUE

/datum/nano_module/program/rcon/proc/toggle_breaker_by_tag(tag, mob/user)
	var/obj/machinery/power/breakerbox/toggle = null
	for(var/obj/machinery/power/breakerbox/breaker in known_breakers)
		if(breaker.RCon_tag == tag)
			toggle = breaker
	if(toggle)
		if(toggle.update_locked)
			to_chat(user, "The breaker box was recently toggled. Please wait before toggling it again.")
		else
			toggle.auto_toggle()
	return TRUE

/datum/nano_module/program/rcon/proc/toggle_panel(section)
	if(section == "smes")
		hide_SMES = !hide_SMES
		return TRUE
	if(section == "smes_details")
		hide_SMES_details = !hide_SMES_details
		return TRUE
	if(section == "breakers")
		hide_breakers = !hide_breakers
		return TRUE
	return FALSE

/datum/nano_module/program/rcon/sui_act(action, list/params, datum/sui/ui)
	if(action == "smes_input_toggle")
		return toggle_smes_input(params["tag"])
	if(action == "smes_output_toggle")
		return toggle_smes_output(params["tag"])
	if(action == "smes_input_set")
		return set_smes_input_value(params["tag"], text2num(params["value"]))
	if(action == "smes_output_set")
		return set_smes_output_value(params["tag"], text2num(params["value"]))
	if(action == "toggle_breaker")
		return toggle_breaker_by_tag(params["tag"], ui?.user)
	if(action == "toggle_panel")
		return toggle_panel(params["section"])
	return FALSE

/datum/nano_module/program/rcon/ui_interact(mob/user, ui_key = "rcon", datum/nanoui/ui=null, force_open=1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_rcon_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "rcon.tmpl", "RCON Console", 600, 400, state = state)
		if(host.update_layout()) // This is necessary to ensure the status bar remains updated along with rest of the UI.
			ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)

// Proc: Topic()
// Parameters: 2 (href, href_list - allows us to process UI clicks)
// Description: Allows us to process UI clicks, which are relayed in form of hrefs.
/datum/nano_module/program/rcon/Topic(href, href_list)
	if(..())
		return

	if(href_list["smes_in_toggle"])
		toggle_smes_input(href_list["smes_in_toggle"])
	if(href_list["smes_out_toggle"])
		toggle_smes_output(href_list["smes_out_toggle"])
	if(href_list["smes_in_set"])
		prompt_smes_input(usr, href_list["smes_in_set"])
	if(href_list["smes_out_set"])
		prompt_smes_output(usr, href_list["smes_out_set"])

	if(href_list["toggle_breaker"])
		toggle_breaker_by_tag(href_list["toggle_breaker"], usr)
	if(href_list["hide_smes"])
		toggle_panel("smes")
	if(href_list["hide_smes_details"])
		toggle_panel("smes_details")
	if(href_list["hide_breakers"])
		toggle_panel("breakers")


// Proc: GetSMESByTag()
// Parameters: 1 (tag - RCON tag of SMES we want to look up)
// Description: Looks up and returns SMES which has matching RCON tag
/datum/nano_module/program/rcon/proc/GetSMESByTag(tag)
	if(!tag)
		return

	for(var/obj/machinery/power/smes/buildable/S in known_SMESs)
		if(S.RCon_tag == tag)
			return S

// Proc: FindDevices()
// Parameters: None
// Description: Refreshes local list of known devices.
/datum/nano_module/program/rcon/proc/FindDevices()
	known_SMESs = list()
	for(var/obj/machinery/power/smes/buildable/SMES as anything in SSmachines.get_machinery_of_type(/obj/machinery/power/smes/buildable))
		if(AreConnectedZLevels(get_host_z(), get_z(SMES)) && SMES.RCon_tag && (SMES.RCon_tag != "NO_TAG") && SMES.RCon)
			known_SMESs.Add(SMES)

	known_breakers = list()
	for(var/obj/machinery/power/breakerbox/breaker as anything in SSmachines.get_machinery_of_type(/obj/machinery/power/breakerbox))
		if(AreConnectedZLevels(get_host_z(), get_z(breaker)) && breaker.RCon_tag != "NO_TAG")
			known_breakers.Add(breaker)
