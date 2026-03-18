/datum/computer_file/program/ntnetmonitor
	filename = "ntmonitor"
	filedesc = "NTNet Diagnostics and Monitoring"
	program_icon_state = "comm_monitor"
	program_key_state = "generic_key"
	program_menu_icon = "wrench"
	extended_desc = "This program monitors the local NTNet network, provides access to logging systems, and allows for configuration changes"
	size = 12
	requires_ntnet = TRUE
	required_access = access_network_admin
	network_destination = "NTNet Statistics & Configuration" // This triggers logging when the program is opened and closed
	available_on_ntnet = TRUE
	nanomodule_path = /datum/nano_module/program/computer_ntnetmonitor
	category = PROG_ADMIN

/datum/nano_module/program/computer_ntnetmonitor
	name = "NTNet Diagnostics and Monitoring"
	sui_interface_name = "NTNetMonitor" // SIERRA-ADD - SUI
	sui_width = 575 // SIERRA-ADD - SUI
	sui_height = 700 // SIERRA-ADD - SUI
	available_to_ai = TRUE
	var/list/pending_wireless_shutdown = list() // SIERRA-ADD - SUI

/datum/nano_module/program/computer_ntnetmonitor/proc/get_confirm_key(mob/user) // SIERRA-ADD - SUI
	if(!user)
		return null
	return user.ckey || "\ref[user]"

/datum/nano_module/program/computer_ntnetmonitor/proc/is_wireless_shutdown_pending(mob/user) // SIERRA-ADD - SUI
	var/key = get_confirm_key(user)
	if(!key || !islist(pending_wireless_shutdown))
		return FALSE
	return !!pending_wireless_shutdown[key]

/datum/nano_module/program/computer_ntnetmonitor/proc/set_wireless_shutdown_pending(mob/user, pending) // SIERRA-ADD - SUI
	var/key = get_confirm_key(user)
	if(!key)
		return
	if(!islist(pending_wireless_shutdown))
		pending_wireless_shutdown = list()
	if(pending)
		pending_wireless_shutdown[key] = TRUE
	else
		pending_wireless_shutdown -= key

/datum/nano_module/program/computer_ntnetmonitor/proc/build_ntnetmonitor_data(mob/user) // SIERRA-ADD - SUI
	if(!ntnet_global)
		return null
	var/list/data = host.initial_data(program)

	data += "skill_fail"
	if(!user.skill_check(SKILL_COMPUTER, SKILL_BASIC))
		var/datum/extension/fake_data/fake_data = get_or_create_extension(src, /datum/extension/fake_data, 20)
		data["skill_fail"] = fake_data.update_and_return_data()
	data["terminal"] = !!program

	data["ntnetstatus"] = ntnet_global.check_function()
	data["ntnetrelays"] = length(ntnet_global.relays)
	data["idsstatus"] = ntnet_global.intrusion_detection_enabled
	data["idsalarm"] = ntnet_global.intrusion_detection_alarm

	data["config_softwaredownload"] = ntnet_global.setting_softwaredownload
	data["config_peertopeer"] = ntnet_global.setting_peertopeer
	data["config_communication"] = ntnet_global.setting_communication
	data["config_systemcontrol"] = ntnet_global.setting_systemcontrol

	data["ntnetlogs"] = ntnet_global.logs
	data["ntnetmaxlogs"] = ntnet_global.setting_maxlogcount

	data["banned_nids"] = list(ntnet_global.banned_nids)
	data["confirm_wireless_shutdown"] = is_wireless_shutdown_pending(user)

	return data

/datum/nano_module/program/computer_ntnetmonitor/sui_data(mob/user) // SIERRA-ADD - SUI
	return build_ntnetmonitor_data(user)

/datum/nano_module/program/computer_ntnetmonitor/proc/perform_monitor_action(action, mob/user, datum/topic_state/state = null, list/params = null) // SIERRA-ADD - SUI
	if(!user)
		return FALSE
	if(!user.skill_check(SKILL_COMPUTER, SKILL_BASIC))
		return TRUE
	if(action == "resetIDS")
		if(ntnet_global)
			ntnet_global.resetIDS()
		return TRUE
	if(action == "toggleIDS")
		if(ntnet_global)
			ntnet_global.toggleIDS()
		return TRUE
	if(action == "toggleWireless")
		if(!ntnet_global)
			return TRUE
		if(ntnet_global.setting_disabled)
			set_wireless_shutdown_pending(user, FALSE)
			ntnet_global.setting_disabled = FALSE
			return TRUE
		set_wireless_shutdown_pending(user, TRUE)
		return TRUE
	if(action == "confirmToggleWireless")
		if(!ntnet_global)
			return TRUE
		set_wireless_shutdown_pending(user, FALSE)
		if(!state || CanInteract(user, state))
			ntnet_global.setting_disabled = TRUE
		return TRUE
	if(action == "cancelToggleWireless")
		set_wireless_shutdown_pending(user, FALSE)
		return TRUE
	if(action == "purgelogs")
		if(ntnet_global)
			ntnet_global.purge_logs()
		return TRUE
	if(action == "updatemaxlogs")
		var/logcount = text2num(input(user, "Enter amount of logs to keep in memory ([MIN_NTNET_LOGS]-[MAX_NTNET_LOGS]):"))
		if(state && !CanInteract(user, state))
			return FALSE
		if(ntnet_global)
			ntnet_global.update_max_log_count(logcount)
		return TRUE
	if(action == "toggle_function")
		if(!ntnet_global)
			return TRUE
		ntnet_global.toggle_function(params["function"])
		return TRUE
	if(action == "ban_nid")
		if(!ntnet_global)
			return TRUE
		var/nid = input(user, "Enter NID of device which you want to block from the network:", "Enter NID") as null|num
		if(nid && (!state || CanInteract(user, state)))
			ntnet_global.banned_nids |= nid
		return TRUE
	if(action == "unban_nid")
		if(!ntnet_global)
			return TRUE
		var/nid = input(user, "Enter NID of device which you want to unblock from the network:", "Enter NID") as null|num
		if(nid && (!state || CanInteract(user, state)))
			ntnet_global.banned_nids -= nid
		return TRUE
	return FALSE

/datum/nano_module/program/computer_ntnetmonitor/sui_act(action, list/params, datum/sui/ui) // SIERRA-ADD - SUI
	return perform_monitor_action(action, ui?.user, ui?.state, params)

/datum/nano_module/program/computer_ntnetmonitor/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_ntnetmonitor_data(user)
	if(!data)
		return

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "ntnet_monitor.tmpl", "NTNet Diagnostics and Monitoring Tool", 575, 700, state = state)
		if(host.update_layout())
			ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)

/datum/nano_module/program/computer_ntnetmonitor/Topic(href, href_list, state)
	var/mob/user = usr
	if(..())
		return TOPIC_HANDLED

	if(href_list["resetIDS"])
		perform_monitor_action("resetIDS", user, state)
		return TOPIC_HANDLED
	if(href_list["toggleIDS"])
		perform_monitor_action("toggleIDS", user, state)
		return TOPIC_HANDLED
	if(href_list["toggleWireless"])
		perform_monitor_action("toggleWireless", user, state)
		return TOPIC_HANDLED
	if(href_list["purgelogs"])
		perform_monitor_action("purgelogs", user, state)
		return TOPIC_HANDLED
	if(href_list["updatemaxlogs"])
		perform_monitor_action("updatemaxlogs", user, state)
		return TOPIC_HANDLED
	if(href_list["toggle_function"])
		perform_monitor_action("toggle_function", user, state, list("function" = href_list["toggle_function"]))
		return TOPIC_HANDLED
	if(href_list["ban_nid"])
		perform_monitor_action("ban_nid", user, state)
		return TOPIC_HANDLED
	if(href_list["unban_nid"])
		perform_monitor_action("unban_nid", user, state)
		return TOPIC_HANDLED
