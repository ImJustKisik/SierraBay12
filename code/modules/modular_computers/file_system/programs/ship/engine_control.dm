/datum/computer_file/program/ship/engine_control
	filename = "engctrl"
	filedesc = "Engine Control"
	nanomodule_path = /datum/nano_module/program/ship/engine_control
	program_icon_state = "engines"
	program_key_state = "tech_key"
	program_menu_icon = "eject"
	extended_desc = "Allows remote control of a spacecraft's gas thrusters, and displays information about remaining fuel."
	required_access = access_engine
	requires_access_to_run = FALSE
	required_parts = list(/obj/item/stock_parts/computer/ship_interface)
	size = 5

/datum/nano_module/program/ship/engine_control
	name = "Engine control"
	sui_interface_name = "EngineControl" // SIERRA-ADD - SUI
	sui_width = 450 // SIERRA-ADD - SUI
	sui_height = 530 // SIERRA-ADD - SUI
	var/display_state = "status"

/datum/nano_module/program/ship/engine_control/proc/build_engine_data(mob/user)
	var/list/data = host.initial_data()
	data["synced"] = !isnull(linked)
	data["state"] = display_state
	data["global_state"] = linked ? linked.engines_state : 0
	data["global_limit"] = linked ? round(linked.thrust_limit*100) : 0
	var/total_thrust = 0

	var/list/enginfo = list()
	for (var/datum/ship_engine/E in linked?.engines)
		var/list/rdata = list()
		rdata["eng_type"] = E.name
		rdata["eng_on"] = E.is_on()
		rdata["eng_thrust"] = E.get_thrust()
		rdata["eng_thrust_limiter"] = round(E.get_thrust_limit()*100)
		rdata["eng_status"] = E.get_status()
		rdata["eng_reference"] = "\ref[E]"
		total_thrust += E.get_thrust()
		enginfo.Add(list(rdata))

	data["engines_info"] = enginfo
	data["total_thrust"] = total_thrust

	return data

/datum/nano_module/program/ship/engine_control/sui_data(mob/user)
	return build_engine_data(user)

/datum/nano_module/program/ship/engine_control/proc/set_display_state(new_state)
	display_state = new_state
	return TRUE

/datum/nano_module/program/ship/engine_control/proc/toggle_all_engines()
	if(!linked)
		return FALSE
	linked.engines_state = !linked.engines_state
	for(var/datum/ship_engine/E in linked.engines)
		if(linked.engines_state == !E.is_on())
			E.toggle()
	return TRUE

/datum/nano_module/program/ship/engine_control/proc/set_global_limit_value(new_limit)
	if(!linked)
		return FALSE
	linked.thrust_limit = clamp(new_limit, 0, 1)
	for(var/datum/ship_engine/E in linked.engines)
		E.set_thrust_limit(linked.thrust_limit)
	return TRUE

/datum/nano_module/program/ship/engine_control/proc/prompt_global_limit(mob/user, datum/topic_state/state = null)
	if(!linked)
		return FALSE
	var/newlim = input(user, "Input new thrust limit (0..100%)", "Thrust limit", linked.thrust_limit * 100) as num
	if(state && !CanInteract(user, state))
		return FALSE
	return set_global_limit_value(newlim / 100)

/datum/nano_module/program/ship/engine_control/proc/adjust_global_limit(delta)
	if(!linked)
		return FALSE
	return set_global_limit_value(linked.thrust_limit + delta)

/datum/nano_module/program/ship/engine_control/proc/get_engine_by_ref(engine_ref)
	return locate(engine_ref)

/datum/nano_module/program/ship/engine_control/proc/toggle_engine(engine_ref)
	var/datum/ship_engine/E = get_engine_by_ref(engine_ref)
	if(istype(E))
		E.toggle()
	return TRUE

/datum/nano_module/program/ship/engine_control/proc/set_engine_limit_value(engine_ref, new_limit)
	var/datum/ship_engine/E = get_engine_by_ref(engine_ref)
	if(!istype(E))
		return FALSE
	E.set_thrust_limit(clamp(new_limit, 0, 1))
	return TRUE

/datum/nano_module/program/ship/engine_control/proc/prompt_engine_limit(mob/user, engine_ref, datum/topic_state/state = null)
	var/datum/ship_engine/E = get_engine_by_ref(engine_ref)
	if(!istype(E))
		return FALSE
	var/newlim = input(user, "Input new thrust limit (0..100)", "Thrust limit", round(E.get_thrust_limit() * 100)) as num
	if(state && !CanInteract(user, state))
		return FALSE
	return set_engine_limit_value(engine_ref, newlim / 100)

/datum/nano_module/program/ship/engine_control/proc/adjust_engine_limit(engine_ref, delta)
	var/datum/ship_engine/E = get_engine_by_ref(engine_ref)
	if(!istype(E))
		return FALSE
	return set_engine_limit_value(engine_ref, E.get_thrust_limit() + delta)

/datum/nano_module/program/ship/engine_control/sui_act(action, list/params, datum/sui/ui)
	if(action == "state")
		return set_display_state(params["state"])
	if(action == "sync")
		sync_linked()
		return TRUE
	if(!linked)
		return FALSE
	if(action == "global_toggle")
		return toggle_all_engines()
	if(action == "set_global_limit")
		return prompt_global_limit(ui?.user, ui?.state)
	if(action == "global_limit")
		return adjust_global_limit(text2num(params["delta"]))
	if(action == "engine_toggle")
		return toggle_engine(params["engine"])
	if(action == "engine_set_limit")
		return prompt_engine_limit(ui?.user, params["engine"], ui?.state)
	if(action == "engine_limit")
		return adjust_engine_limit(params["engine"], text2num(params["delta"]))
	return FALSE

/datum/nano_module/program/ship/engine_control/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_engine_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "engines_control.tmpl", "[linked ? "[linked.name ]" : ""] Engines Control", 450, 530)
		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)

/datum/nano_module/program/ship/engine_control/Topic(href, href_list)
	if (..())
		return TOPIC_HANDLED

	if (href_list["state"])
		set_display_state(href_list["state"])
		return TOPIC_REFRESH

	if (href_list["global_toggle"])
		toggle_all_engines()
		return TOPIC_REFRESH

	if (href_list["set_global_limit"])
		if (!prompt_global_limit(usr))
			return TOPIC_NOACTION
		return TOPIC_REFRESH

	if (href_list["global_limit"])
		adjust_global_limit(text2num(href_list["global_limit"]))
		return TOPIC_REFRESH

	if (href_list["engine"])
		if (href_list["set_limit"])
			if (!prompt_engine_limit(usr, href_list["engine"]))
				return TOPIC_NOACTION
			return TOPIC_REFRESH
		if (href_list["limit"])
			adjust_engine_limit(href_list["engine"], text2num(href_list["limit"]))
			return TOPIC_REFRESH

		if (href_list["toggle"])
			toggle_engine(href_list["engine"])
			return TOPIC_REFRESH
		return TOPIC_REFRESH
	return TOPIC_NOACTION
