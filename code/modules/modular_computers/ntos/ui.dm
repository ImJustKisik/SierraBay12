/client
	var/list/ntos_boot_sequences = list()

/datum/extension/interactive/proc/sui_data(mob/user)
	return null

/// Operates NanoUI
/datum/extension/interactive/ntos/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1)
	if(!on || !host_status())
		if(ui)
			ui.close()
		var/datum/sui/closed_sui = SSnano.try_update_sui(user, src, ui_key)
		if(closed_sui)
			closed_sui.close()
		return 0

	for (var/datum/computer_file/program/extra_program in running_program_windows)
		extra_program.ui_interact(user, ui_key, null, force_open)

	var/datum/sui/main_menu_sui = SSnano.try_update_sui(user, src, ui_key)

	// If we have an active program switch to it now.
	if(active_program)
		if(ui) // This is the main laptop screen. Since we are switching to program's UI close it for now.
			ui.close()
		if(main_menu_sui)
			main_menu_sui.close()
		active_program.ui_interact(user, ui_key, null, force_open)
		return

	// We are still here, that means there is no program loaded. Load the BIOS/ROM/OS/whatever you want to call it.
	// This screen simply lists available programs and user may select them.
	var/obj/item/stock_parts/computer/hard_drive/hard_drive = get_component(PART_HDD)
	if(!hard_drive)
		show_error(user, "DISK ERROR")
		return // No HDD, Something is very broken.

	if(ui)
		ui.close()
	ui_interact_sui(user, ui_key, force_open)

/datum/extension/interactive/ntos/proc/build_main_menu_data()
	var/list/data = get_header_data()

	var/datum/computer_file/data/autorun = get_file("autorun")
	var/list/programs = list()
	for(var/datum/computer_file/program/P in get_all_files())
		var/list/program = list()
		program["name"] = P.filename
		program["desc"] = P.filedesc
		program["icon"] = P.program_menu_icon
		program["autorun"] = (istype(autorun) && (autorun.stored_data == P.filename)) ? 1 : 0
		program["running"] = (P in running_programs) ? TRUE : FALSE
		program["extra_window"] = (P in running_program_windows) ? TRUE : FALSE
		programs.Add(list(program))

	data["programs"] = programs
	data["updating"] = updating
	data["update_progress"] = update_progress
	data["updates"] = updates
	data["allow_multiple_windows"] = allow_multiple_windows

	var/obj/item/modular_computer/computer_holder = holder
	if(istype(computer_holder))
		data["in_camera_mode"] = computer_holder.in_camera_mode ? TRUE : FALSE

	return data

/datum/extension/interactive/ntos/proc/should_show_ntos_boot(client/C)
	if(!istype(C))
		return FALSE
	if(!islist(C.ntos_boot_sequences))
		C.ntos_boot_sequences = list()
	return !C.ntos_boot_sequences["NTOSMainMenu"]

/datum/extension/interactive/ntos/proc/get_ntos_preload_logical_ids(singleton/asset_registry_v2/asset_registry_v2)
	var/list/logical_ids = list()
	if(!asset_registry_v2)
		return logical_ids

	var/list/icon_asset_names = list(
		"uiIcons16.png",
		"uiIcons16Green.png",
		"uiIcons16Red.png"
	)
	for(var/asset_name in icon_asset_names)
		var/icon_logical_id = asset_registry_v2.register_legacy_named_asset(asset_name, file("nano/images/[asset_name]"))
		if(icon_logical_id && !(icon_logical_id in logical_ids))
			logical_ids += icon_logical_id

	for(var/datum/computer_file/program/P in get_all_files())
		if(!istype(P))
			continue
		var/module_path = initial(P.nanomodule_path)
		if(!module_path)
			continue
		var/interface_name = initial(module_path:sui_interface_name)
		if(!length(interface_name))
			continue
		var/interface_asset_id = asset_registry_v2.ensure_sui_interface_registered(interface_name)
		if(interface_asset_id && !(interface_asset_id in logical_ids))
			logical_ids += interface_asset_id

	return logical_ids

/datum/extension/interactive/ntos/proc/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, datum/topic_state/state = GLOB.default_state)
	ui_key = ui_key || "main"

	var/datum/sui/ui = SSnano.try_update_sui(user, src, ui_key)
	if(ui && force_open)
		ui.close()
		ui = null

	if(!ui)
		ui = new /datum/sui(user, src, "NTOSMainMenu", "NTOS Main Menu", 400, 500, nstate = state, nui_key = ui_key)
		ui.set_auto_update(TRUE)
		ui.open(src.sui_data(user))
	else
		ui.push_data(src.sui_data(user))

/datum/extension/interactive/ntos/sui_data(mob/user)
	return build_main_menu_data()

/datum/extension/interactive/ntos/sui_update(mob/user, datum/sui/ui)
	ui.push_data(src.sui_data(user))

/datum/extension/interactive/ntos/sui_verify_assets(datum/sui/ui, client/C)
	if(!istype(ui) || ui.interface != "NTOSMainMenu" || !istype(C))
		return TRUE

	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	if(!should_show_ntos_boot(C))
		return TRUE

	asset_registry_v2.ensure_pack_verified(C, ASSET_PACK_NANOUI_COMMON)
	if(!C.asset_v2_packs[ASSET_PACK_NANOUI_COMMON])
		return FALSE

	var/list/logical_ids = get_ntos_preload_logical_ids(asset_registry_v2)
	for(var/logical_id in logical_ids)
		asset_registry_v2.ensure_asset_verified(C, logical_id)
		var/datum/asset_entry_v2/entry = asset_registry_v2.assets_by_logical_id[logical_id]
		if(istype(entry) && !C.asset_v2_sent_keys[entry.key])
			return FALSE

	return TRUE

/datum/extension/interactive/ntos/sui_get_head_html(datum/sui/ui, singleton/asset_registry_v2/asset_registry_v2)
	if(!istype(ui) || ui.interface != "NTOSMainMenu")
		return null

	var/client/C = ui?.user?.client
	if(!should_show_ntos_boot(C))
		return null

	var/list/preload_urls = list()
	var/list/logical_ids = get_ntos_preload_logical_ids(asset_registry_v2)
	for(var/logical_id in logical_ids)
		var/url = asset_registry_v2.resolve_key(logical_id)
		if(length(url))
			preload_urls += url

	if(istype(C))
		C.ntos_boot_sequences["NTOSMainMenu"] = TRUE

	var/list/boot_messages = list(
		"POST complete. Mounting NTOS system image...",
		"Enumerating installed program manifests...",
		"Loading interface modules into memory...",
		"Synchronizing icon atlases and status glyphs...",
		"Verifying local terminal control surface..."
	)
	var/boot_messages_json = json_encode(boot_messages)
	var/preload_urls_json = json_encode(preload_urls)

	return {"<script type='text/javascript'>
		window.suiBootConfig = {
			enabled: true,
			minDuration: 1350,
			completeMessage: 'NTOS boot complete. Handing control to MAIN MENU.',
			messages: [boot_messages_json],
			preloadUrls: [preload_urls_json]
		};
	</script>"}

/datum/extension/interactive/ntos/sui_act(action, list/params, datum/sui/ui)
	var/mob/user = ui ? ui.user : null
	switch(action)
		if("kill_program")
			var/datum/computer_file/program/program_to_kill = get_file(params["program"])
			if(!istype(program_to_kill) || program_to_kill.program_state == PROGRAM_STATE_KILLED)
				return FALSE
			kill_program_remote(program_to_kill, FALSE, user)
			to_chat(user, SPAN_NOTICE("Program [program_to_kill.filename].[program_to_kill.filetype] with PID [rand(100,999)] has been killed."))
			return TRUE
		if("run_program")
			var/datum/computer_file/program/program_to_run = run_program(params["program"], user)
			if(!istype(program_to_run))
				return FALSE
			if(ui)
				ui.close()
			program_to_run.ui_interact(user)
			return TRUE
		if("run_program_new_window")
			var/datum/computer_file/program/program_to_open = get_file(params["program"])
			if(!istype(program_to_open))
				return FALSE
			if(program_to_open.program_state == PROGRAM_STATE_ACTIVE && (program_to_open in running_program_windows))
				minimize_program(program_to_open, user)
				return TRUE
			program_to_open = run_program_new_window(params["program"], user)
			if(!istype(program_to_open))
				return FALSE
			program_to_open.ui_interact(user)
			return TRUE
		if("toggle_autorun")
			var/datum/computer_file/data/autorun = get_file("autorun")
			if(istype(autorun) && autorun.stored_data == params["program"])
				set_autorun()
			else
				set_autorun(params["program"])
			return TRUE
		if("shutdown")
			system_shutdown()
			return TRUE
		if("terminal")
			open_terminal(user)
			return FALSE
		if("camera")
			camera()
			return FALSE
	return FALSE

/datum/extension/interactive/ntos/extension_status(mob/user)
	. = ..()
	if(!on || !host_status())
		return STATUS_CLOSE
	//There is no bypassing the update, mwhahaha
	if(updating)
		. = min(STATUS_UPDATE, .)

/datum/extension/interactive/ntos/CanUseTopic(mob/user, state)
	. = holder.CanUseTopic(user, state)
	. = min(., extension_status(user))

/// Handles user's GUI input
/datum/extension/interactive/ntos/extension_act(href, href_list, user)
	if( href_list["PC_exit"] )
		var/datum/computer_file/program/program_to_exit = get_file(href_list["PC_exit"])
		kill_program(program_to_exit)
		return TOPIC_HANDLED
	if(href_list["PC_enable_component"] )
		var/obj/item/stock_parts/computer/H = locate(href_list["PC_enable_component"]) in holder
		if(H && istype(H) && !H.enabled)
			H.enabled = TRUE
			H.on_enable(src)
		return TOPIC_REFRESH
	if(href_list["PC_disable_component"] )
		var/obj/item/stock_parts/computer/H = locate(href_list["PC_disable_component"]) in holder
		if(H && istype(H) && H.enabled)
			H.enabled = FALSE
			H.on_disable()
		return TOPIC_REFRESH
	if( href_list["PC_enable_update"] )
		receives_updates = TRUE
		return TOPIC_REFRESH
	if( href_list["PC_disable_update"] )
		receives_updates = FALSE
		return TOPIC_REFRESH
	if( href_list["PC_shutdown"] )
		system_shutdown()
		return TOPIC_HANDLED
	if( href_list["PC_minimize"] )
		var/datum/computer_file/program/program_to_minimize = get_file(href_list["PC_minimize"])
		if(!istype(program_to_minimize) || program_to_minimize.program_state == PROGRAM_STATE_KILLED)
			return TOPIC_HANDLED
		minimize_program(program_to_minimize, usr)
		return TOPIC_HANDLED
//[SIERRA-ADD]
	var/obj/item/modular_computer/c = holder
	if(istype(c))
		if( href_list["PC_camera"] )
			camera()
			return TOPIC_HANDLED
//[/SIERRA-ADD]

	if( href_list["PC_killprogram"] )
		var/datum/computer_file/program/P = get_file(href_list["PC_killprogram"])

		if(!istype(P) || P.program_state == PROGRAM_STATE_KILLED)
			return TOPIC_HANDLED

		kill_program(P)
		update_uis()
		to_chat(usr, SPAN_NOTICE("Program [P.filename].[P.filetype] with PID [rand(100,999)] has been killed."))
		return TOPIC_HANDLED

	if( href_list["PC_runprogram"] )
		run_program(href_list["PC_runprogram"], user)
		return TOPIC_HANDLED

	if( href_list["PC_runprogram_newwindow"] )
		var/datum/computer_file/program/program_to_run = get_file(href_list["PC_runprogram_newwindow"])
		if(istype(program_to_run) && program_to_run.program_state == PROGRAM_STATE_ACTIVE && (program_to_run in running_program_windows))
			minimize_program(program_to_run)
		else
			run_program_new_window(href_list["PC_runprogram_newwindow"], user)
		return TOPIC_HANDLED

	if( href_list["PC_setautorun"] )
		var/datum/computer_file/data/autorun = get_file("autorun")
		if(istype(autorun) && autorun.stored_data == href_list["PC_setautorun"])
			set_autorun()
		else
			set_autorun(href_list["PC_setautorun"])
		return TOPIC_REFRESH

	if( href_list["PC_terminal"] )
		open_terminal(usr)
		return TOPIC_HANDLED

/datum/extension/interactive/ntos/proc/regular_ui_update()
	var/ui_update_needed = FALSE
	var/obj/item/stock_parts/computer/battery_module/battery_module = get_component(PART_BATTERY)
	if(battery_module)
		var/batery_percent = battery_module.battery.percent()
		if(last_battery_percent != batery_percent) //Let's update UI on percent change
			ui_update_needed = TRUE
			last_battery_percent = batery_percent

	if(stationtime2text() != last_world_time)
		last_world_time = stationtime2text()
		ui_update_needed = TRUE

	var/list/current_header_icons = list()
	for(var/datum/computer_file/program/P in running_programs)
		if(!P.ui_header)
			continue
		current_header_icons[P.type] = P.ui_header

	if(!last_header_icons)
		last_header_icons = current_header_icons

	else if(!listequal(last_header_icons, current_header_icons))
		last_header_icons = current_header_icons
		ui_update_needed = TRUE
	else
		for(var/x in last_header_icons|current_header_icons)
			if(last_header_icons[x]!=current_header_icons[x])
				last_header_icons = current_header_icons
				ui_update_needed = TRUE
				break

	if(ui_update_needed)
		update_uis()

/datum/extension/interactive/ntos/proc/update_uis()
	if(active_program) //Should we update program ui or computer ui?
		SSnano.update_uis(active_program)
		if(active_program.NM)
			SSnano.update_uis(active_program.NM)
	for (var/datum/computer_file/program/extra_program in running_program_windows)
		SSnano.update_uis(extra_program)
		if(extra_program.NM)
			SSnano.update_uis(extra_program.NM)

/// Function used by NanoUI's to obtain data for header. All relevant entries begin with "PC_"
/datum/extension/interactive/ntos/proc/get_header_data(datum/computer_file/program/program)
	var/list/data = list()

	var/obj/item/stock_parts/computer/battery_module/battery_module = get_component(PART_BATTERY)
	if(battery_module)
		switch(battery_module.battery.percent())
			if(80 to 200) // 100 should be maximal but just in case..
				data["PC_batteryicon"] = "batt_100.gif"
			if(60 to 80)
				data["PC_batteryicon"] = "batt_80.gif"
			if(40 to 60)
				data["PC_batteryicon"] = "batt_60.gif"
			if(20 to 40)
				data["PC_batteryicon"] = "batt_40.gif"
			if(5 to 20)
				data["PC_batteryicon"] = "batt_20.gif"
			else
				data["PC_batteryicon"] = "batt_5.gif"
		data["PC_batterypercent"] = "[round(battery_module.battery.percent())] %"
		data["PC_showbatteryicon"] = TRUE
	else
		data["PC_batteryicon"] = "batt_5.gif"
		data["PC_batterypercent"] = "N/C"
		data["PC_showbatteryicon"] = battery_module ? TRUE : FALSE

	var/obj/item/stock_parts/computer/tesla_link/tesla_link = get_component(PART_TESLA)
	if(tesla_link && tesla_link.enabled)
		data["PC_apclinkicon"] = "charging.gif"

	var/obj/item/stock_parts/computer/network_card/network_card = get_component(PART_NETWORK)
	if(network_card && network_card.is_banned())
		data["PC_ntneticon"] = "sig_warning.gif"
	else
		switch(get_ntnet_status())
			if(0)
				data["PC_ntneticon"] = "sig_none.gif"
			if(1)
				data["PC_ntneticon"] = "sig_low.gif"
			if(2)
				data["PC_ntneticon"] = "sig_high.gif"
			if(3)
				data["PC_ntneticon"] = "sig_lan.gif"

	var/list/program_headers = list()
	for(var/datum/computer_file/program/P in running_programs)
		if(!P.ui_header)
			continue
		program_headers.Add(list(list(
			"icon" = P.ui_header
		)))
	data["PC_programheaders"] = program_headers
	data["PC_activeprogram"] = program ? program.filename : null

	data["PC_stationtime"] = stationtime2text()
	data["PC_hasheader"] = !updating
	data["PC_showshutdown"] = (program && active_program != program) ? FALSE : TRUE // Hides "Shutdown" button on extra screens
	data["PC_showexitprogram"] = program ? TRUE : FALSE // Hides "Exit Program" button on mainscreen
	return data

/datum/extension/interactive/ntos/initial_data(datum/computer_file/program/program)
	return get_header_data(program)

/datum/extension/interactive/ntos/update_layout()
	return TRUE

/datum/extension/interactive/ntos/nano_host()
	return holder.nano_host()
