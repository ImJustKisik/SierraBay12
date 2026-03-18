/datum/computer_file/program/suit_sensors
	filename = "sensormonitor"
	filedesc = "Suit Sensors Monitoring"
	nanomodule_path = /datum/nano_module/program/crew_monitor
	ui_header = "crew_green.gif"
	program_icon_state = "crew"
	program_key_state = "med_key"
	program_menu_icon = "heart"
	extended_desc = "This program connects to life signs monitoring system to provide basic information on crew health."
	required_access = access_medical
	requires_ntnet = TRUE
	network_destination = "crew life signs monitoring system"
	size = 11
	category = PROG_MONITOR
	var/has_alert = FALSE
	var/beeping = FALSE

/datum/computer_file/program/suit_sensors/process_tick()
	..()

	var/datum/nano_module/program/crew_monitor/NMC = NM
	if(istype(NMC) && (NMC.has_alerts() != has_alert))
		if(!has_alert)
			program_icon_state = "crew-red"
			ui_header = "crew_red.gif"
			if(!beeping)
				computer.visible_notification(SPAN_WARNING("Warning: vital signs beyond acceptable parameters."))
				computer.audible_notification("sound/machines/twobeep.ogg")
				beeping = TRUE //For medical sanity purposes, it'll only beep once per emergency.
		else
			program_icon_state = "crew"
			ui_header = "crew_green.gif"
			beeping = FALSE
		update_computer_icon(FALSE)
		has_alert = !has_alert

	return 1

/datum/nano_module/program/crew_monitor
	name = "Crew monitor"
	available_to_ai = TRUE
	sui_interface_name = "CrewMonitor" // SIERRA-ADD - SUI
	sui_width = 1100 // SIERRA-ADD - SUI
	sui_height = 800 // SIERRA-ADD - SUI
	var/map_enabled = TRUE
	var/map_z_level = null

/datum/nano_module/program/crew_monitor/proc/has_alerts()
	for(var/z_level in GLOB.using_map.map_levels)
		if (crew_repository.has_health_alert(z_level))
			return TRUE
	return FALSE

/datum/nano_module/program/crew_monitor/proc/build_crew_monitor_data(mob/user)
	var/list/data = host.initial_data(program)

	var/Z = get_host_z()
	var/list/crewmembers = crew_repository.health_data(Z)
	if(isnull(map_z_level))
		map_z_level = Z

	var/alert_count = 0
	var/tracking_count = 0
	for(var/list/member in crewmembers)
		if(member["alert"])
			alert_count++
		if(member["sensor_type"] >= SUIT_SENSOR_TRACKING)
			tracking_count++

	data["isAI"] = isAI(user)
	data["crewmembers"] = crewmembers
	data["map_enabled"] = map_enabled
	data["map_z_level"] = map_z_level
	data["map_z_levels"] = GetConnectedZlevels(Z)
	data["alert_count"] = alert_count
	data["tracking_count"] = tracking_count
	data["total_count"] = length(crewmembers)
	return data

/datum/nano_module/program/crew_monitor/sui_data(mob/user)
	return build_crew_monitor_data(user)

/datum/nano_module/program/crew_monitor/proc/set_map_state(datum/sui/ui, enabled, z_level = null)
	map_enabled = !!enabled
	if(!isnull(z_level))
		map_z_level = text2num(z_level)
	if(isnull(map_z_level))
		map_z_level = get_host_z()
	ui?.set_show_map(map_enabled, map_z_level, 500)
	return TRUE

/datum/nano_module/program/crew_monitor/proc/track_crewmember(mob/user, tracked_ref)
	if(isAI(user))
		var/mob/living/silicon/ai/AI = user
		var/mob/living/carbon/human/H = locate(tracked_ref) in SSmobs.mob_list
		if(hassensorlevel(H, SUIT_SENSOR_TRACKING))
			AI.ai_actual_track(H)
	return TRUE

/datum/nano_module/program/crew_monitor/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, master_ui = null, datum/topic_state/state = GLOB.default_state)
	ui_key = ui_key || "main"
	var/datum/sui/ui = get_existing_sui_ui(user, ui_key)
	if(ui && force_open)
		ui.close()
		ui = null
	if(isnull(map_z_level))
		map_z_level = get_host_z()
	if(!ui)
		ui = create_sui_ui(user, ui_key, master_ui, state)
		ui.set_auto_update(TRUE)
		ui.open(sui_data(user))
	else
		ui.push_data(sui_data(user))
	set_map_state(ui, map_enabled, map_z_level)

/datum/nano_module/program/crew_monitor/sui_act(action, list/params, datum/sui/ui)
	if(action == "toggle_map")
		return set_map_state(ui, !map_enabled, map_z_level)
	if(action == "set_map_z")
		return set_map_state(ui, map_enabled, params["z_level"])
	if(action == "track")
		return track_crewmember(ui?.user, params["track"])
	return FALSE

/datum/nano_module/program/crew_monitor/Topic(href, href_list)
	if(..()) return 1

	if(href_list["track"])
		track_crewmember(usr, href_list["track"])
		return 1

/datum/nano_module/program/crew_monitor/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = host.initial_data(program)

	data["isAI"] = isAI(user)
	var/Z = get_host_z()
	data["crewmembers"] = crew_repository.health_data(Z)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if(!ui)
		ui = new(user, src, ui_key, "crew_monitor.tmpl", "Crew Monitoring Computer", 1050, 800, state = state)

		// adding a template with the key "mapContent" enables the map ui functionality
		ui.add_template("mapContent", "crew_monitor_map_content.tmpl")
		// adding a template with the key "mapHeader" replaces the map header content
		ui.add_template("mapHeader", "crew_monitor_map_header.tmpl")

		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)
