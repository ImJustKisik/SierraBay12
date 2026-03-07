/datum/nano_module
	var/name
	var/datum/host
	var/available_to_ai = TRUE
	var/datum/topic_manager/topic_manager
	var/list/using_access = list()

/datum/nano_module/New(datum/host, topic_manager)
	..()
	src.host = host.nano_host()
	src.topic_manager = topic_manager

/datum/nano_module/Destroy()
	host = null
	QDEL_NULL(topic_manager)
	. = ..()

/datum/nano_module/nano_host()
	return host ? host : src

/datum/nano_module/proc/can_still_topic(datum/topic_state/state = GLOB.default_state)
	return CanUseTopic(usr, state) == STATUS_INTERACTIVE

/datum/nano_module/proc/check_eye(mob/user)
	return -1

//returns a list.
/datum/nano_module/proc/get_access(mob/user)
	. = using_access
	if(istype(user))
		var/obj/item/card/id/I = user.GetIdCard()
		if(I)
			. |= I.access

/datum/nano_module/proc/check_access(mob/user, access)
	if(!access)
		return 1
	if(!islist(access))
		access = list(access) //listify a single access code.
	if(has_access(access, using_access))
		return 1 //This is faster, and often enough.
	return has_access(access, get_access(user)) //Also checks the mob's ID.

/datum/nano_module/Topic(href, href_list)
	if(topic_manager && topic_manager.Topic(href, href_list))
		return TRUE
	. = ..()

/datum/nano_module/proc/get_host_z()
	return get_z(nano_host())

/datum/nano_module/proc/print_text(text, mob/user)
	var/datum/extension/interactive/ntos/os = get_extension(nano_host(), /datum/extension/interactive/ntos)
	if(os)
		os.print_paper(text)
	else
		to_chat(user, "Error: Unable to detect compatible printer interface. Are you running NTOSv2 compatible system?")

/datum/proc/initial_data(datum/computer_file/program/program)
	return list()

/datum/proc/update_layout()
	return FALSE

// ============================================================
// SUI Integration — opt-in Preact rendering for nano_modules
// Set sui_interface_name to enable SUI rendering for a module.
// ============================================================

/datum/nano_module
	/// Preact interface name (e.g. "ShipSensors"). When set, program.dm delegates to SUI instead of NanoUI.
	var/sui_interface_name
	/// SUI window width. 0 = use default (450).
	var/sui_width = 0
	/// SUI window height. 0 = use default (550).
	var/sui_height = 0

/// Override this to return data for the SUI interface.
/// This is the SUI equivalent of building data in ui_interact().
/datum/nano_module/proc/sui_data(mob/user)
	return host ? host.initial_data() : list()

/// Wrapper for SSnano.try_update_sui(). Overridable for testing.
/datum/nano_module/proc/get_existing_sui_ui(mob/user, ui_key = "main")
	return SSnano.try_update_sui(user, src, ui_key)

/// Constructs a new /datum/sui instance for this module.
/datum/nano_module/proc/create_sui_ui(mob/user, ui_key = "main", master_ui = null, datum/topic_state/state = GLOB.default_state)
	var/datum/sui/sui_master_ui = istype(master_ui, /datum/sui) ? master_ui : null
	return new /datum/sui(user, src, sui_interface_name, name, (sui_width || 450), (sui_height || 550), nmaster_ui = sui_master_ui, nstate = state, nui_key = ui_key)

/// Default SUI open/update pattern. Override for custom window options.
/datum/nano_module/proc/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, master_ui = null, datum/topic_state/state = GLOB.default_state)
	ui_key = ui_key || "main"

	var/datum/sui/ui = get_existing_sui_ui(user, ui_key)
	if(ui && force_open)
		ui.close()
		ui = null
	if(!ui)
		ui = create_sui_ui(user, ui_key, master_ui, state)
		ui.set_auto_update(TRUE)
		ui.open(sui_data(user))
	else
		ui.push_data(sui_data(user))

/// Default auto-update handler for SUI. Pushes fresh sui_data() each tick.
/datum/nano_module/sui_update(mob/user, datum/sui/ui)
	ui.push_data(sui_data(user))
