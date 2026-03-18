/datum/computer_file/program/munitions
	filename = "munitionscontrol"
	filedesc = "Munitions Control Program"
	nanomodule_path = /datum/nano_module/program/munitions
	program_icon_state = "munitions"
	program_key_state = "security_key"
	program_menu_icon = "bullet"
	extended_desc = "Program for controlling munitions loading and arming systems."
	requires_ntnet = FALSE
	size = 8
	category = PROG_COMMAND
	usage_flags = PROGRAM_CONSOLE
	requires_ntnet_feature = NTNET_SYSTEMCONTROL
	required_access = access_bridge

/datum/computer_file/program/munitions/syndicate
	nanomodule_path = /datum/nano_module/program/munitions/syndicate
	required_access = access_syndicate
	available_on_ntnet = FALSE

/datum/nano_module/program/munitions
	name = "Munitions Control Program"
	sui_interface_name = "Munitions"
	sui_width = 500
	sui_height = 600
	var/access_req = list(access_bridge)
	var/list/monitored_munitions = list()
	var/obj/overmap/visitable/linked = null

/datum/nano_module/program/munitions/syndicate
	access_req = list(access_syndicate)

/datum/nano_module/program/munitions/New()
	..()
	linked = get_owning_sector_recursive(nano_host())
	if (linked)
		GLOB.payload_interface_updated.register(linked, src, PROC_REF(update_panel))

/datum/nano_module/program/munitions/Destroy()
	if (linked)
		GLOB.payload_interface_updated.unregister(linked, src, PROC_REF(update_panel))
	. = ..()

/datum/nano_module/program/munitions/proc/update_panel()
	SSnano.update_uis(src)
	SSnano.update_sui_uis(src)

/datum/nano_module/program/munitions/proc/collect_munitions()
	var/list/output = list()
	for (var/obj/machinery/payload_interface/interface in SSmachines.machinery)
		if (linked && linked.check_ownership(interface))
			output += interface
	return output

/datum/nano_module/program/munitions/proc/build_munitions_data(mob/user)
	var/list/data = host.initial_data(program)
	var/authenticated = check_access(user, access_req)

	data["src"] = "\ref[src]"
	data["authenticated"] = authenticated

	var/list/munitions = collect_munitions()

	for (var/obj/machinery/payload_interface/interface in munitions)
		if (!istype(interface))
			continue
		var/obj/structure/missile/payload = interface.get_payload()
		if (interface.allow_arming)
			data["armers"] += list(list(
				"ref" = "\ref[interface]",
				"display_name" = interface.name,
				"has_payload" = !isnull(payload),
				"payload_data" = payload ? payload.name : null,
				"loading" = interface.loading,
				"arming" = payload ? payload.armed : null,
				"firing" = interface.firing
			))
		else
			data["loaders"] += list(list(
				"ref" = "\ref[interface]",
				"display_name" = interface.name,
				"has_payload" = !isnull(payload),
				"payload_data" = payload ? payload.name : null,
				"loading" = interface.loading
			))
	return data

/datum/nano_module/program/munitions/proc/handle_munitions_action(action, list/params, mob/user)
	params = params || list()
	if(!check_access(user, access_req))
		return TOPIC_NOACTION

	var/obj/machinery/payload_interface/interface = locate(params["target"])
	if (!istype(interface) || !linked || !linked.check_ownership(interface))
		return TOPIC_NOACTION

	switch(action)
		if ("load")
			interface.load()
		if ("arm")
			if (interface.can_arm())
				interface.arm(user)
		if ("fire")
			if (interface.can_arm())
				interface.fire(user)
		if ("configure")
			if (!interface.arming)
				var/obj/structure/missile/missile = interface.get_payload()
				var/datum/computer_file/program/munitions/munitions_program = program
				if (istype(missile) && istype(munitions_program))
					munitions_program.configure(user, missile)
		else
			return TOPIC_NOACTION
	return TOPIC_HANDLED

/datum/nano_module/program/munitions/sui_data(mob/user)
	return build_munitions_data(user)

/datum/nano_module/program/munitions/sui_act(action, list/params, datum/sui/ui)
	var/mob/user = ui ? ui.user : null
	return handle_munitions_action(action, params, user) != TOPIC_NOACTION

/datum/nano_module/program/munitions/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_munitions_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "munitions_computer.tmpl", name, 500, 600, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()

/datum/computer_file/program/munitions/proc/configure(mob/user, obj/structure/missile/missile)
	var/list/obj/item/missile_equipment/options = list()
	for (var/slot in missile.equipment)
		var/obj/item/missile_equipment/part = missile.equipment[slot]
		if (part && part.can_configure())
			options += part
	if (!LAZYLEN(options))
		to_chat(user, SPAN_WARNING("\The [missile] does not have any configurable parts!"))
		return
	var/obj/item/missile_equipment/part_to_configure = input("Select a part to configure") as null|obj in options
	if (part_to_configure && istype(part_to_configure))
		part_to_configure.configure(user)

/datum/computer_file/program/munitions/Topic(href, href_list)
	if (..())
		return TOPIC_HANDLED

	var/mob/user = usr
	var/datum/nano_module/program/munitions/module = NM

	var/result = TOPIC_NOACTION
	if(module)
		result = module.handle_munitions_action(href_list["action"], list("target" = href_list["target"]), user)
	if(result != TOPIC_NOACTION)
		SSnano.update_uis(NM)
		return result
	return TOPIC_NOACTION
