// This is special hardware configuration program.
// It is to be used only with modular computers.
// It allows you to toggle components of your device.

/datum/computer_file/program/computerconfig
	filename = "compconfig"
	filedesc = "Computer Configuration Tool"
	extended_desc = "This program allows configuration of computer's hardware"
	program_icon_state = "generic"
	program_key_state = "generic_key"
	program_menu_icon = "gear"
	unsendable = 1
	undeletable = 1
	size = 4
	processing_size = 0.5
	available_on_ntnet = FALSE
	requires_ntnet = FALSE
	nanomodule_path = /datum/nano_module/program/computer_configurator
	usage_flags = PROGRAM_ALL
	category = PROG_UTIL

/datum/nano_module/program/computer_configurator
	name = "NTOS Computer Configuration Tool"
	sui_interface_name = "ComputerConfigurator"
	sui_width = 575
	sui_height = 700

/datum/nano_module/program/computer_configurator/proc/build_configurator_data(mob/user)
	var/list/data = program.get_header_data()

	data["disk_size"] = program.computer.max_disk_capacity()
	data["disk_used"] = program.computer.used_disk_capacity()
	data["power_usage"] = program.computer.get_power_usage()
	var/obj/item/stock_parts/computer/battery_module/battery_module = program.computer.get_component(PART_BATTERY)
	data["battery_exists"] = !!battery_module
	if(battery_module)
		data["battery_rating"] = battery_module.battery.maxcharge
		data["battery_percent"] = round(battery_module.battery.percent())

	// Configurable stuff
	var/obj/item/stock_parts/computer/nano_printer/nano_printer = program.computer.get_component(/obj/item/stock_parts/computer/nano_printer)
	data["print_language"] = nano_printer ? nano_printer.print_language : null

	var/list/all_entries[0]
	var/list/hardware = program.computer.get_all_components()
	for(var/obj/item/stock_parts/computer/H in hardware)
		all_entries.Add(list(list(
		"name" = H.name,
		"desc" = H.desc,
		"enabled" = H.enabled,
		"critical" = H.critical,
		"powerusage" = H.power_usage,
		"ref" = "\ref[H]"
		)))

	data["hardware"] = all_entries

	data["receives_updates"] = program.computer.receives_updates

	return data

/datum/nano_module/program/computer_configurator/sui_data(mob/user)
	return build_configurator_data(user)

/datum/nano_module/program/computer_configurator/proc/prompt_edit_language(mob/user, datum/topic_state/state = null)
	var/obj/item/stock_parts/computer/nano_printer/nano_printer = program.computer.get_component(/obj/item/stock_parts/computer/nano_printer)
	if(!nano_printer)
		to_chat(user, SPAN_WARNING("No printer found, unable to update language."))
		return TRUE
	var/list/selectable_languages = list()
	for(var/datum/language/L in user?.languages)
		if(L.has_written_form)
			selectable_languages += L
	var/new_language = input(user, "What language do you want to print in?", "Change language", nano_printer.print_language) as null|anything in selectable_languages
	if(state && !CanInteract(user, state))
		return FALSE
	if(!new_language)
		return TRUE
	nano_printer.print_language = new_language
	return TRUE

/datum/nano_module/program/computer_configurator/proc/set_component_enabled(ref, enabled)
	var/obj/item/stock_parts/computer/H = locate(ref) in program.computer.holder
	if(H)
		var/enable_component = !!enabled
		if(enable_component && !H.enabled)
			H.enabled = TRUE
			H.on_enable(program.computer)
		else if(!enable_component && H.enabled)
			H.enabled = FALSE
			H.on_disable()
	return TRUE

/datum/nano_module/program/computer_configurator/proc/toggle_component_enabled(ref)
	var/obj/item/stock_parts/computer/H = locate(ref) in program.computer.holder
	if(H)
		return set_component_enabled(ref, !H.enabled)
	return TRUE

/datum/nano_module/program/computer_configurator/proc/set_updates_enabled(enabled)
	program.computer.receives_updates = !!enabled
	return TRUE

/datum/nano_module/program/computer_configurator/sui_act(action, list/params, datum/sui/ui)
	var/mob/user = ui?.user
	if(action == "edit_language")
		return prompt_edit_language(user, ui?.state)
	if(action == "set_component" || action == "toggle_component")
		return action == "toggle_component" ? toggle_component_enabled(params["ref"]) : set_component_enabled(params["ref"], text2num(params["enabled"]))
	if(action == "set_updates")
		return set_updates_enabled(text2num(params["enabled"]))
	return FALSE

/datum/nano_module/program/computer_configurator/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_configurator_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "laptop_configuration.tmpl", "NTOS Configuration Utility", 575, 700, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()

/datum/nano_module/program/computer_configurator/Topic(href, href_list)
	. = ..()
	if (.)
		return

	if (href_list["edit_language"])
		prompt_edit_language(usr)
		return TOPIC_REFRESH
