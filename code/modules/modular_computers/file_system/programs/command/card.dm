/datum/computer_file/program/card_mod
	filename = "cardmod"
	filedesc = "ID Card Modification Program"
	nanomodule_path = /datum/nano_module/program/card_mod
	program_icon_state = "id"
	program_key_state = "id_key"
	program_menu_icon = "key"
	extended_desc = "Program for programming crew ID cards."
	requires_ntnet = FALSE
	size = 8
	category = PROG_COMMAND

/datum/nano_module/program/card_mod
	name = "ID card modification program"
	sui_interface_name = "CardMod"
	sui_width = 600
	sui_height = 700
	var/mod_mode = 1
	var/is_centcom = 0
	var/show_assignments = 0
	var/selected_branch = null // Track currently selected branch for rank selection

/datum/nano_module/program/card_mod/proc/build_card_mod_data(mob/user)
	var/list/data = host.initial_data(program)
	var/obj/item/stock_parts/computer/card_slot/card_slot = program.computer.get_component(PART_CARD)

	data["src"] = "\ref[src]"
	data["station_name"] = station_name()
	data["manifest"] = html_crew_manifest()
	data["assignments"] = show_assignments
	data["have_id_slot"] = !!card_slot
	data["have_printer"] = program.computer.has_component(PART_PRINTER)
	data["authenticated"] = program.can_run(user)
	if(!data["have_id_slot"] || !data["have_printer"])
		mod_mode = 0 //We can't modify IDs when there is no card reader
	if(card_slot)
		var/obj/item/card/id/id_card = card_slot.stored_card
		data["has_id"] = !!id_card
		data["id_account_number"] = id_card ? id_card.associated_account_number : null
		data["id_email_login"] = id_card ? id_card.associated_email_login["login"] : null
		data["id_email_password"] = id_card ? stars(id_card.associated_email_login["password"], 0) : null
		data["id_rank"] = id_card && id_card.assignment ? id_card.assignment : "Unassigned"
		data["id_owner"] = id_card && id_card.registered_name ? id_card.registered_name : "-----"
		data["id_name"] = id_card ? id_card.name : "-----"
		data["id_military_branch"] = id_card && id_card.military_branch ? id_card.military_branch.name : "Unset"
		data["id_military_rank"] = id_card && id_card.military_rank ? id_card.military_rank.name : "Unset"
		// Initialize selected_branch based on the card's military_branch
		if(id_card && id_card.military_branch)
			selected_branch = id_card.military_branch.name
	data["mmode"] = mod_mode
	data["centcom_access"] = is_centcom

	data["command_jobs"] = format_jobs(SSjobs.titles_by_department(COM))
	data["support_jobs"] = format_jobs(SSjobs.titles_by_department(SPT))
	data["engineering_jobs"] = format_jobs(SSjobs.titles_by_department(ENG))
	data["medical_jobs"] = format_jobs(SSjobs.titles_by_department(MED))
	data["science_jobs"] = format_jobs(SSjobs.titles_by_department(SCI))
	data["security_jobs"] = format_jobs(SSjobs.titles_by_department(SEC))
	data["exploration_jobs"] = format_jobs(SSjobs.titles_by_department(EXP))
	data["service_jobs"] = format_jobs(SSjobs.titles_by_department(SRV))
	data["supply_jobs"] = format_jobs(SSjobs.titles_by_department(SUP))
	data["civilian_jobs"] = format_jobs(SSjobs.titles_by_department(CIV))
	data["centcom_jobs"] = format_jobs(get_all_centcom_jobs())
	data["military_branches"] = format_military_branches()
	data["military_ranks"] = selected_branch ? format_military_ranks(selected_branch) : list()

	data["all_centcom_access"] = is_centcom ? get_accesses(1) : null
	data["regions"] = get_accesses()

	if(card_slot && card_slot.stored_card)
		var/obj/item/card/id/id_card = card_slot.stored_card
		if(is_centcom)
			var/list/all_centcom_access = list()
			for(var/access in get_all_centcom_access())
				all_centcom_access.Add(list(list(
					"desc" = replacetext(get_centcom_access_desc(access), " ", "&nbsp"),
					"ref" = access,
					"allowed" = (access in id_card.access) ? 1 : 0)))
			data["all_centcom_access"] = all_centcom_access
		else
			var/list/regions = list()
			for(var/i = 1; i <= 8; i++)
				var/list/accesses = list()
				for(var/access in get_region_accesses(i))
					if (get_access_desc(access))
						accesses.Add(list(list(
							"desc" = replacetext(get_access_desc(access), " ", "&nbsp"),
							"ref" = access,
							"allowed" = (access in id_card.access) ? 1 : 0)))

				regions.Add(list(list(
					"name" = get_region_accesses_name(i),
					"accesses" = accesses)))
			data["regions"] = regions
	return data

/datum/nano_module/program/card_mod/sui_data(mob/user)
	return build_card_mod_data(user)

/datum/nano_module/program/card_mod/sui_act(action, list/params, datum/sui/ui)
	var/datum/computer_file/program/card_mod/card_program = program
	var/mob/user = ui ? ui.user : null
	if(!istype(card_program))
		return FALSE
	return card_program.handle_card_mod_action(action, params, user) != TOPIC_NOACTION

/datum/nano_module/program/card_mod/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_card_mod_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "identification_computer.tmpl", name, 600, 700, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()

/datum/nano_module/program/card_mod/proc/format_jobs(list/jobs)
	var/obj/item/card/id/id_card = program.computer.get_inserted_id()
	var/list/formatted = list()
	for(var/job in jobs)
		formatted.Add(list(list(
			"display_name" = replacetext(job, " ", "&nbsp"),
			"target_rank" = id_card && id_card.assignment ? id_card.assignment : "Unassigned",
			"job" = job)))
	return formatted

/datum/nano_module/program/card_mod/proc/format_military_branches()
	var/list/branches = list()
	branches |= "Unset"
	for(var/B in GLOB.mil_branches.branches)
		var/datum/mil_branch/BR = GLOB.mil_branches.branches[B]
		branches |= BR.name
	var/list/formatted = list()
	for(var/branch in branches)
		formatted.Add(list(list(
			"display_name" = html_encode(branch),
			"branch" = branch)))
	return formatted

/datum/nano_module/program/card_mod/proc/format_military_ranks(branch_name)
	var/list/ranks = list()
	ranks |= "Unset"
	var/datum/mil_branch/branch = GLOB.mil_branches.get_branch(branch_name)
	if(branch)
		for(var/rank in branch.ranks)
			var/datum/mil_rank/RA = branch.ranks[rank]
			ranks |= RA.name
	var/list/formatted = list()
	for(var/rank in ranks)
		formatted.Add(list(list(
			"display_name" = html_encode(rank),
			"rank" = rank)))
	return formatted

/datum/nano_module/program/card_mod/proc/get_accesses(is_centcom = 0)
	return null

/datum/computer_file/program/card_mod/proc/handle_card_mod_action(action, list/params, mob/user)
	params = params || list()

	var/obj/item/card/id/user_id_card = user ? user.GetIdCard() : null
	var/obj/item/card/id/id_card = computer ? computer.get_inserted_id() : null
	var/datum/nano_module/program/card_mod/module = NM

	if (!module)
		return TOPIC_NOACTION

	switch(action)
		if("switchm")
			if(params["target"] == "mod")
				module.mod_mode = 1
			else if (params["target"] == "manifest")
				module.mod_mode = 0
			return TOPIC_HANDLED
		if("togglea")
			module.show_assignments = !module.show_assignments
			return TOPIC_HANDLED
		if("eject")
			var/obj/item/stock_parts/computer/card_slot/card_slot = computer.get_component(PART_CARD)
			if(computer.get_inserted_id())
				card_slot.eject_id(user)
			else
				card_slot.insert_id(user.get_active_hand(), user)
			return TOPIC_HANDLED

	if (!user_id_card || !id_card)
		return TOPIC_HANDLED

	switch(action)
		if("print")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer.has_component(PART_PRINTER))
				if(module.mod_mode)
					if(can_run(user, 1))
						var/contents = {"<h4>Access Report</h4>
									<u>Prepared By:</u> [user_id_card.registered_name ? user_id_card.registered_name : "Unknown"]<br>
									<u>For:</u> [id_card.registered_name ? id_card.registered_name : "Unregistered"]<br>
									<hr>
									<u>Assignment:</u> [id_card.assignment]<br>
									<u>Branch:</u> [id_card.military_branch ? id_card.military_branch.name : "Unset"]<br>
									<u>Rank:</u> [id_card.military_rank ? id_card.military_rank.name : "Unset"]<br>
									<u>Account Number:</u> #[id_card.associated_account_number]<br>
									<u>Email account:</u> [id_card.associated_email_login["login"]]
									<u>Email password:</u> [stars(id_card.associated_email_login["password"], 0)]
									<u>Blood Type:</u> [id_card.blood_type]<br><br>
									<u>Access:</u><br>
								"}

						var/known_access_rights = get_access_ids(ACCESS_TYPE_STATION|ACCESS_TYPE_CENTCOM)
						for(var/A in id_card.access)
							if(A in known_access_rights)
								contents += "  [get_access_desc(A)]"

						if(!computer.print_paper(contents,"access report"))
							to_chat(usr, SPAN_NOTICE("Hardware error: Printer was unable to print the file. It may be out of paper."))
					else
						var/manifest_contents = {"<h4>Crew Manifest</h4>
										<br>
										[html_crew_manifest()]
										"}
						if(!computer.print_paper(manifest_contents, "crew manifest ([stationtime2text()])"))
							to_chat(usr, SPAN_NOTICE("Hardware error: Printer was unable to print the file. It may be out of paper."))
			return TOPIC_HANDLED
		if("terminate")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer && can_run(user, 1))
				id_card.assignment = "Terminated"
				id_card.military_branch = null
				id_card.military_rank = null
				remove_nt_access(id_card)
				callHook("terminate_employee", list(id_card))
			return TOPIC_HANDLED
		if("edit")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer && can_run(user, 1))
				if(params["name"])
					var/temp_name = sanitizeName(input("Enter name.", "Name", id_card.registered_name),allow_numbers=TRUE)
					if(temp_name)
						id_card.registered_name = temp_name
						id_card.formal_name_suffix = initial(id_card.formal_name_suffix)
						id_card.formal_name_prefix = initial(id_card.formal_name_prefix)
					else
						computer.show_error(usr, "Invalid name entered!")
				else if(params["account"])
					var/account_num = text2num(input("Enter account number.", "Account", id_card.associated_account_number))
					id_card.associated_account_number = account_num
				else if(params["elogin"])
					var/email_login = input("Enter email login.", "Email login", id_card.associated_email_login["login"])
					id_card.associated_email_login["login"] = email_login
				else if(params["epswd"])
					var/email_password = input("Enter email password.", "Email password")
					id_card.associated_email_login["password"] = email_password
			return TOPIC_HANDLED
		if("assign")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer && can_run(user, 1) && id_card)
				var/t1 = params["assign_target"]
				if(t1 == "Custom")
					var/temp_t = sanitize(input("Enter a custom job assignment.","Assignment", id_card.assignment), 45)
					if(temp_t)
						id_card.assignment = temp_t
				else
					var/list/access = list()
					if(module.is_centcom)
						access = get_centcom_access(t1)
					else
						var/datum/job/jobdatum = SSjobs.get_by_title(t1)
						if(!jobdatum)
							to_chat(usr, SPAN_WARNING("No log exists for this job: [t1]"))
							return TOPIC_HANDLED
						access = jobdatum.get_access()
					remove_nt_access(id_card)
					apply_access(id_card, access)
					id_card.assignment = t1
					id_card.rank = t1
				callHook("reassign_employee", list(id_card))
			return TOPIC_HANDLED
		if("set_military_branch")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer && can_run(user, 1) && id_card)
				var/new_branch = params["branch_target"]
				if(new_branch == "Unset")
					id_card.military_branch = null
					id_card.military_rank = null
					module.selected_branch = null
				else
					var/datum/mil_branch/branch = GLOB.mil_branches.get_branch(new_branch)
					if(branch)
						id_card.military_branch = branch
						id_card.military_rank = null
						module.selected_branch = new_branch
					else
						to_chat(usr, SPAN_WARNING("Invalid military branch: [new_branch]"))
						return TOPIC_HANDLED
				callHook("update_military_branch", list(id_card))
			return TOPIC_HANDLED
		if("set_military_rank")
			if(!authorized(user_id_card))
				to_chat(usr, SPAN_WARNING("Access denied."))
				return TOPIC_HANDLED
			if(computer && can_run(user, 1) && id_card && id_card.military_branch)
				var/new_rank = params["rank_target"]
				if(new_rank == "Unset")
					id_card.military_rank = null
				else
					var/datum/mil_branch/branch = id_card.military_branch
					var/datum/mil_rank/rank_datum = null
					for(var/rank in branch.ranks)
						var/datum/mil_rank/RA = branch.ranks[rank]
						if(RA.name == new_rank)
							rank_datum = RA
							break
					if(rank_datum)
						id_card.military_rank = rank_datum
					else
						to_chat(usr, SPAN_WARNING("Invalid military rank: [new_rank]"))
						return TOPIC_HANDLED
				callHook("update_military_rank", list(id_card))
			return TOPIC_HANDLED
		if("access")
			if(params["allowed"] && computer && can_run(user, 1) && id_card)
				var/access_type = params["access_target"]
				var/access_allowed = text2num(params["allowed"])
				if(access_type in get_access_ids(ACCESS_TYPE_STATION|ACCESS_TYPE_CENTCOM))
					for(var/access in user_id_card.access)
						var/region_type = get_access_region_by_id(access_type)
						if(access in GLOB.using_map.access_modify_region[region_type])
							id_card.access -= access_type
							if(!access_allowed)
								id_card.access += access_type
							break
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/computer_file/program/card_mod/Topic(href, href_list)
	if(..())
		return 1
	var/result = handle_card_mod_action(href_list["action"], href_list, usr)
	var/obj/item/card/id/id_card = computer ? computer.get_inserted_id() : null
	if(id_card)
		id_card.SetName("[id_card.registered_name]'s ID Card ([id_card.assignment])")
	if(result != TOPIC_NOACTION)
		SSnano.update_uis(NM)
		return 1
	return

/datum/computer_file/program/card_mod/proc/remove_nt_access(obj/item/card/id/id_card)
	id_card.access -= get_access_ids(ACCESS_TYPE_STATION|ACCESS_TYPE_CENTCOM)

/datum/computer_file/program/card_mod/proc/apply_access(obj/item/card/id/id_card, list/accesses)
	id_card.access |= accesses

/datum/computer_file/program/card_mod/proc/authorized(obj/item/card/id/id_card)
	return id_card && (access_change_ids in id_card.access)
