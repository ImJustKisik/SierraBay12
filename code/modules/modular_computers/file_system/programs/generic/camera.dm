// Returns which access is relevant to passed network. Used by the program.
// A return value of 0 indicates no access reqirement
/proc/get_camera_access(network)
	if(!network)
		return 0
	. = GLOB.using_map.get_network_access(network)
	if(.)
		return

	switch(network)
		if(NETWORK_ENGINEERING, NETWORK_ALARM_ATMOS, NETWORK_ALARM_CAMERA, NETWORK_ALARM_FIRE, NETWORK_ALARM_POWER)
			return access_engine
		if(NETWORK_CRESCENT, NETWORK_ERT)
			return access_cent_specops
		if(NETWORK_MEDICAL)
			return access_medical
		if(NETWORK_MINE)
			return access_mailsorting // Cargo office - all cargo staff should have access here.
		if(NETWORK_RESEARCH)
			return access_research
		if(NETWORK_THUNDER)
			return 0
		if(NETWORK_HELMETS)
			return access_eva

	return access_security // Default for all other networks

/datum/computer_file/program/camera_monitor
	filename = "cammon"
	filedesc = "Camera Monitoring"
	nanomodule_path = /datum/nano_module/program/camera_monitor
	program_icon_state = "cameras"
	program_key_state = "generic_key"
	program_menu_icon = "search"
	extended_desc = "This program allows remote access to the camera system. Some camera networks may have additional access requirements."
	size = 12
	available_on_ntnet = TRUE
	requires_ntnet = FALSE
	category = PROG_MONITOR

/datum/nano_module/program/camera_monitor
	name = "Camera Monitoring program"
	available_to_ai = TRUE
	sui_interface_name = "CameraMonitor"
	sui_width = 900
	sui_height = 800
	var/obj/machinery/camera/current_camera = null
	var/current_network = null


/datum/nano_module/program/camera_monitor/Destroy()
	reset_current()
	. = ..()


/datum/nano_module/program/camera_monitor/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, master_ui = null, datum/topic_state/state = GLOB.default_state)
	return ..()

/datum/nano_module/program/camera_monitor/sui_data(mob/user)
	var/list/data = host.initial_data(program)

	data["current_camera"] = current_camera ? current_camera.nano_structure() : null
	data["current_network"] = current_network

	var/list/all_networks[0]
	for(var/network in GLOB.using_map.station_networks)
		all_networks.Add(list(list(
							"tag" = network,
							"has_access" = can_access_network(user, get_camera_access(network))
							)))

	all_networks = modify_networks_list(all_networks)

	data["networks"] = all_networks

	if(current_network)
		data["cameras"] = camera_repository.cameras_in_network(current_network)

	// In SUI, we push map visibility as part of the interface state so JS can know whether to frame it.
	return data

// Intended to be overriden by subtypes to manually add non-station networks to the list.
/datum/nano_module/program/camera_monitor/proc/modify_networks_list(list/networks)
	return networks

/datum/nano_module/program/camera_monitor/proc/can_access_network(mob/user, network_access)
	// No access passed, or 0 which is considered no access requirement. Allow it.
	if(!network_access)
		return 1

	return check_access(user, access_security) || check_access(user, network_access)

/datum/nano_module/program/camera_monitor/sui_act(action, list/params, datum/sui/ui)
	if(action == "switch_camera")
		var/obj/machinery/camera/C = locate(params["switch_camera"]) in cameranet.cameras
		var/datum/extension/interactive/ntos/os = get_extension(nano_host(), /datum/extension/interactive/ntos)
		if(!C)
			return FALSE
		if(!(current_network in C.network))
			return FALSE
		if(!AreConnectedZLevels(get_z(C), get_z(host)) && !(get_z(C) in GLOB.using_map.admin_levels))
			to_chat(ui.user, "Unable to establish a connection.")
			return FALSE
		if (!os?.get_ntnet_status() && !C.is_helmet_cam)
			to_chat(ui.user, "Unable to establish a connection.")
			return FALSE
		if (C.inoperable(MACHINE_STAT_EMPED))
			to_chat(ui.user, "Unable to establish a connection.")
			return FALSE

		switch_to_camera(ui.user, C)
		apply_visual(ui.user)
		ui.set_show_map(TRUE, get_z(C), 500) // Show map embedded in SUI
		return TRUE

	if(action == "switch_network")
		if(can_access_network(ui.user, get_camera_access(params["switch_network"])))
			current_network = params["switch_network"]
		else
			to_chat(ui.user, "\The [nano_host()] shows an \"Network Access Denied\" error message.")
		return TRUE

	if(action == "reset")
		reset_current()
		remove_visual(ui.user)
		ui.user.reset_view(current_camera)
		ui.set_show_map(FALSE) // Hide map embedded in SUI
		return TRUE

	return FALSE

/datum/nano_module/program/camera_monitor/proc/switch_to_camera(mob/user, obj/machinery/camera/C)
	//don't need to check if the camera works for AI because the AI jumps to the camera location and doesn't actually look through cameras.
	if(isAI(user))
		var/mob/living/silicon/ai/A = user
		// Only allow non-carded AIs to view because the interaction with the eye gets all wonky otherwise.
		if(!A.is_in_chassis())
			return 0

		A.eyeobj.setLoc(get_turf(C))
		A.client.eye = A.eyeobj
		return 1

	set_current(C)
	return 1

/datum/nano_module/program/camera_monitor/proc/set_current(obj/machinery/camera/C)
	if(current_camera == C)
		return

	if(current_camera)
		reset_current()

	current_camera = C
	if(current_camera)
		GLOB.destroyed_event.register(current_camera, src, PROC_REF(reset_current))
		GLOB.moved_event.register(current_camera, src, PROC_REF(camera_moved))
		var/mob/living/L = current_camera.loc
		if(istype(L))
			L.tracking_initiated()

/datum/nano_module/program/camera_monitor/proc/camera_moved(atom/movable/moved_atom, atom/old_loc, atom/new_loc)
	if (AreConnectedZLevels(get_z(old_loc), get_z(new_loc)))
		return
	reset_current()

/datum/nano_module/program/camera_monitor/proc/reset_current()
	if(current_camera)
		GLOB.destroyed_event.unregister(current_camera, src, PROC_REF(reset_current))
		GLOB.moved_event.unregister(current_camera, src, PROC_REF(camera_moved))
		var/mob/living/L = current_camera.loc
		if(istype(L))
			L.tracking_cancelled()
	current_camera = null

/datum/nano_module/program/camera_monitor/check_eye(mob/user as mob)
	if(!current_camera)
		return 0
	var/viewflag = current_camera.check_eye(user)
	if ( viewflag < 0 ) //camera doesn't work
		reset_current()
	return viewflag


// ERT Variant of the program
/datum/computer_file/program/camera_monitor/ert
	filename = "ertcammon"
	filedesc = "SCGDF Camera Monitoring"
	extended_desc = "A special version of the camera monitoring system tailored for SCG's security and defense forces. Has expanded access to a broad encryption key database and is compatible with PDAs."
	nanomodule_path = /datum/nano_module/program/camera_monitor/ert
	required_access = access_ert_responder
	usage_flags = PROGRAM_ALL

/datum/nano_module/program/camera_monitor/ert
	name = "SCGDF Camera Monitoring Program"
	available_to_ai = FALSE

// The ERT variant has access to ERT and crescent cams, but still checks for accesses. ERT members should be able to use it.
/datum/nano_module/program/camera_monitor/ert/modify_networks_list(list/networks)
	..()
	networks.Add(list(list("tag" = NETWORK_ERT, "has_access" = 1)))
	networks.Add(list(list("tag" = NETWORK_CRESCENT, "has_access" = 1)))
	return networks

/datum/nano_module/program/camera_monitor/apply_visual(mob/M)
	if(current_camera)
		current_camera.apply_visual(M)
	else
		remove_visual(M)

/datum/nano_module/program/camera_monitor/remove_visual(mob/M)
	if(current_camera)
		current_camera.remove_visual(M)
	usr.client.reload_fov()
