/datum/computer_file/program/access_decrypter
	filename = "nt_accrypt"
	filedesc = "NTNet Access Decrypter"
	program_icon_state = "hostile"
	program_key_state = "security_key"
	program_menu_icon = "unlocked"
	extended_desc = "This highly advanced script can very slowly decrypt operational codes used in almost any network. These codes can be downloaded to an ID card to expand the available access. The system administrator will probably notice this."
	size = 34
	requires_ntnet = TRUE
	available_on_ntnet = FALSE
	available_on_syndinet = TRUE
	nanomodule_path = /datum/nano_module/program/access_decrypter
	var/message = ""
	var/running = FALSE
	var/progress = 0
	var/target_progress = 300
	var/datum/access/target_access = null
	var/list/restricted_access_codes = list(access_change_ids) // access codes that are not hackable due to balance reasons
	var/list/skill_restricted_access_codes = list(
		access_network = SKILL_EXPERIENCED,
		access_network_admin = SKILL_MASTER
	)

/datum/computer_file/program/access_decrypter/on_shutdown(forced)
	reset()
	..(forced)

/datum/computer_file/program/access_decrypter/proc/reset()
	running = FALSE
	message = ""
	progress = 0

/datum/computer_file/program/access_decrypter/proc/start_decryption(mob/user, access)
	operator_skill = user?.get_skill_value(SKILL_COMPUTER)
	if(running)
		return TRUE
	var/obj/item/stock_parts/computer/processor_unit/CPU = computer.get_component(PART_CPU)
	var/obj/item/stock_parts/computer/card_slot/RFID = computer.get_component(PART_CARD)
	if(!istype(CPU) || !CPU.check_functionality() || !istype(RFID) || !RFID.check_functionality())
		message = "A fatal hardware error has been detected."
		return TRUE
	if(!istype(RFID.stored_card))
		message = "RFID card is not present in the device. Operation aborted."
		return TRUE

	var/obj/item/card/id/id_card = RFID.stored_card
	if(access in id_card.access)
		return TRUE
	if(access in restricted_access_codes)
		return TRUE
	if(skill_restricted_access_codes[access] && operator_skill < skill_restricted_access_codes[access])
		return TRUE
	target_access = get_access_by_id(access)
	if(!target_access)
		return TRUE

	running = TRUE
	if(!prob(get_sneak_chance()))
		ntnet_global.add_log_with_ids_check("Unauthorised access attempt to primary keycode database.", computer.get_component(PART_NETWORK))
	return TRUE

/datum/computer_file/program/access_decrypter/process_tick()
	. = ..()
	if(!running)
		return
	var/obj/item/stock_parts/computer/processor_unit/CPU = computer.get_component(PART_CPU)
	var/obj/item/stock_parts/computer/card_slot/RFID = computer.get_component(PART_CARD)
	if(!istype(CPU) || !CPU.check_functionality() || !istype(RFID) || !RFID.check_functionality())
		message = "A fatal hardware error has been detected."
		return
	if(!istype(RFID.stored_card))
		message = "RFID card has been removed from the device. Operation aborted."
		return

	progress += get_speed()

	if(progress >= target_progress)
		if(prob(20 * max(SKILL_TRAINED - operator_skill, 0))) // Oops
			var/list/valid_access_values = get_all_station_access()
			valid_access_values -= restricted_access_codes
			valid_access_values -= RFID.stored_card.access
			for(var/skill_access in skill_restricted_access_codes)
				// Don't want to randomly assign an access that we wouldn't be able to decrypt normally
				if(skill_restricted_access_codes[skill_access] && operator_skill < skill_restricted_access_codes[skill_access])
					valid_access_values -= skill_access
			target_access = get_access_by_id(pick(valid_access_values))
		RFID.stored_card.access |= target_access.id
		if (!prob(get_sneak_chance()))
			ntnet_global.add_log_with_ids_check("Unauthorised access to primary keycode database - downloaded access codes for: [target_access.desc].", computer.get_component(PART_NETWORK))
		message = "Successfully decrypted and saved operational key codes. Downloaded access codes for: [target_access.desc]."
		target_access = null
		reset()

/datum/computer_file/program/access_decrypter/Topic(href, href_list)
	if(..())
		return TOPIC_HANDLED
	if(href_list["PRG_reset"])
		reset()
		return TOPIC_HANDLED
	if(href_list["PRG_execute"])
		start_decryption(usr, href_list["PRG_execute"])
		return TOPIC_HANDLED

/datum/computer_file/program/access_decrypter/proc/get_sneak_chance()
	return max(operator_skill - SKILL_TRAINED, 0) * 30

/datum/computer_file/program/access_decrypter/proc/get_speed()
	var/skill_speed_modifier = 1 + (operator_skill - SKILL_TRAINED)/(SKILL_MAX - SKILL_MIN)
	var/obj/item/stock_parts/computer/processor_unit/CPU = computer.get_component(PART_CPU)
	return CPU?.processing_power * skill_speed_modifier

/datum/nano_module/program/access_decrypter
	name = "NTNet Access Decrypter"
	sui_interface_name = "AccessDecrypter" // SIERRA-ADD - SUI
	sui_width = 550 // SIERRA-ADD - SUI
	sui_height = 400 // SIERRA-ADD - SUI

/datum/nano_module/program/access_decrypter/proc/build_decrypter_data(mob/user) // SIERRA-ADD - SUI
	if(!ntnet_global)
		return list()
	var/datum/computer_file/program/access_decrypter/PRG = program
	if(!istype(PRG))
		return list()
	var/list/data = PRG.get_header_data()

	var/obj/item/stock_parts/computer/card_slot/RFID = PRG.computer.get_component(PART_CARD)
	if(PRG.message)
		data["message"] = PRG.message
	else if(PRG.running)
		data["running"] = 1
		data["rate"] = PRG.get_speed()

		// Stolen from DOS traffic generator, generates strings of 1s and 0s
		var/percentage = (PRG.progress / PRG.target_progress) * 100
		var/list/strings[0]
		for(var/j, j<10, j++)
			var/string = ""
			for(var/i, i<20, i++)
				string = "[string][prob(percentage)]"
			strings.Add(string)
		data["dos_strings"] = strings
	else if(RFID && RFID.stored_card)
		var/obj/item/card/id/id_card = RFID.stored_card
		var/current_skill = istype(user) ? user.get_skill_value(SKILL_COMPUTER) : PRG.operator_skill
		var/list/regions = list()
		for(var/i = ACCESS_REGION_MIN; i <= ACCESS_REGION_MAX; i++)
			var/list/accesses = list()
			for(var/access in get_region_accesses(i))
				if (get_access_desc(access))
					accesses.Add(list(list(
						"desc" = replacetext(get_access_desc(access), " ", "&nbsp"),
						"ref" = access,
						"allowed" = (access in id_card.access) ? 1 : 0,
						"blocked" = ((access in PRG.restricted_access_codes) || (PRG.skill_restricted_access_codes[access] && current_skill < PRG.skill_restricted_access_codes[access])) ? 1 : 0
					)))

			regions.Add(list(list(
				"name" = get_region_accesses_name(i),
				"accesses" = accesses)))
		data["regions"] = regions

	return data

/datum/nano_module/program/access_decrypter/sui_data(mob/user)
	return build_decrypter_data(user)

/datum/nano_module/program/access_decrypter/sui_act(action, list/params, datum/sui/ui)
	var/datum/computer_file/program/access_decrypter/PRG = program
	if(!istype(PRG))
		return FALSE
	if(action == "reset")
		PRG.reset()
		return TRUE
	if(action == "execute")
		return PRG.start_decryption(ui?.user, params["access"])
	return FALSE

/datum/nano_module/program/access_decrypter/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_decrypter_data(user)
	if(!length(data))
		return

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "access_decrypter.tmpl", "NTNet Access Decrypter", 550, 400, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)
