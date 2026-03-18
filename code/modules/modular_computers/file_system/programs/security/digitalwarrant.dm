LEGACY_RECORD_STRUCTURE(all_warrants, warrant)
/datum/computer_file/data/warrant
	var/archived = FALSE

/datum/computer_file/program/digitalwarrant
	filename = "digitalwarrant"
	filedesc = "Warrant Assistant"
	extended_desc = "Official NTsec program for creation and handling of warrants."
	size = 8
	program_icon_state = "warrant"
	program_key_state = "security_key"
	program_menu_icon = "star"
	requires_ntnet = TRUE
	available_on_ntnet = TRUE
	required_access = access_security
	nanomodule_path = /datum/nano_module/program/digitalwarrant
	category = PROG_SEC

/datum/nano_module/program/digitalwarrant
	name = "Warrant Assistant"
	available_to_ai = TRUE
	sui_interface_name = "DigitalWarrant"
	sui_width = 700
	sui_height = 450
	var/datum/computer_file/data/warrant/activewarrant

/datum/nano_module/program/digitalwarrant/proc/build_warrant_data(mob/user)
	var/list/data = host.initial_data(program)

	if(activewarrant)
		data["warrantname"] = activewarrant.fields["namewarrant"]
		data["warrantjob"] = activewarrant.fields["jobwarrant"]
		data["warrantcharges"] = activewarrant.fields["charges"]
		data["warrantauth"] = activewarrant.fields["auth"]
		data["warrantidauth"] = activewarrant.fields["idauth"]
		data["type"] = activewarrant.fields["arrestsearch"]
	else
		var/list/arrestwarrants = list()
		var/list/searchwarrants = list()
		var/list/archivedwarrants = list()
		for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
			var/charges = W.fields["charges"]
			if(length(charges) > 50)
				charges = copytext(charges, 1, 50) + "..."
			var/warrant = list(
			"warrantname" = W.fields["namewarrant"],
			"charges" = charges,
			"auth" = W.fields["auth"],
			"id" = W.uid,
			"arrestsearch" = W.fields["arrestsearch"],
			"archived" = W.archived)
			if (warrant["archived"])
				archivedwarrants.Add(list(warrant))
			else if(warrant["arrestsearch"] == "arrest")
				arrestwarrants.Add(list(warrant))
			else
				searchwarrants.Add(list(warrant))
		data["arrestwarrants"] = length(arrestwarrants) ? arrestwarrants : null
		data["searchwarrants"] = length(searchwarrants) ? searchwarrants : null
		data["archivedwarrants"] = length(archivedwarrants) ? archivedwarrants : null
	data["has_printer"] = !!program?.computer?.has_component(PART_PRINTER)
	return data

/datum/nano_module/program/digitalwarrant/proc/get_authenticated_security_id(mob/user)
	if(!istype(user))
		return null
	var/obj/item/card/id/I = user.GetIdCard()
	if(!istype(I) || !I.registered_name || !(access_security in I.access))
		to_chat(user, "Authentication error: Unable to locate ID with apropriate access to allow this operation.")
		return null
	return I

/datum/nano_module/program/digitalwarrant/proc/handle_warrant_action(action, list/params, mob/user)
	params = params || list()

	switch(action)
		if("sw_menu", "back")
			activewarrant = null
			return TOPIC_HANDLED
		if("editwarrant")
			for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
				if(W.uid == text2num(params["id"]))
					activewarrant = W
					break
			return TOPIC_HANDLED

	var/obj/item/card/id/I = get_authenticated_security_id(user)
	if(!I)
		return TOPIC_HANDLED

	switch(action)
		if("sendtoarchive")
			for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
				if(W.uid == text2num(params["id"]))
					W.archived = TRUE
					break
			return TOPIC_HANDLED
		if("restore")
			for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
				if(W.uid == text2num(params["id"]))
					W.archived = FALSE
					break
			return TOPIC_HANDLED
		if("addwarrant")
			var/datum/computer_file/data/warrant/W = new()
			if(CanInteract(user, GLOB.default_state))
				W.fields["namewarrant"] = "Unknown"
				W.fields["jobwarrant"] = "N/A"
				W.fields["auth"] = "Unauthorized"
				W.fields["idauth"] = "Unauthorized"
				W.fields["access"] = list()
				if(params["kind"] == "arrest")
					W.fields["charges"] = "No charges present"
					W.fields["arrestsearch"] = "arrest"
				if(params["kind"] == "search")
					W.fields["charges"] = "No reason given"
					W.fields["arrestsearch"] = "search"
				activewarrant = W
			return TOPIC_HANDLED
		if("savewarrant")
			if(!activewarrant)
				return TOPIC_HANDLED
			broadcast_security_hud_message("\A [activewarrant.fields["arrestsearch"]] warrant for <b>[activewarrant.fields["namewarrant"]]</b> has been [(activewarrant in GLOB.all_warrants) ? "edited" : "uploaded"].", nano_host())
			GLOB.all_warrants |= activewarrant
			activewarrant = null
			return TOPIC_HANDLED
		if("deletewarrant")
			if(!activewarrant)
				for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
					if(W.uid == text2num(params["id"]))
						activewarrant = W
						break
			GLOB.all_warrants -= activewarrant
			activewarrant = null
			return TOPIC_HANDLED
		if("printwarrant")
			if(!program.computer.has_component(PART_PRINTER))
				to_chat(user, SPAN_WARNING("Hardware Error: Printer not found."))
				return TOPIC_HANDLED
			if(!activewarrant)
				var/puid = text2num(params["id"])
				for(var/datum/computer_file/data/warrant/W in GLOB.all_warrants)
					if(W.uid == puid)
						activewarrant = W
						break
			if(activewarrant)
				program.computer.print_paper(warranttotext(activewarrant), capitalize(activewarrant.fields["arrestsearch"]) + " Warrant - " + activewarrant.fields["namewarrant"])
			else
				to_chat(user, SPAN_WARNING("Internal error: Warrant not found."))
			return TOPIC_HANDLED
		if("editwarrantname")
			var/namelist = list()
			for(var/datum/computer_file/report/crew_record/CR in GLOB.all_crew_records)
				namelist += "[CR.get_name()] \[[CR.get_job()]\]"
			var/new_person = sanitize(input(user, "Please input name") as null|anything in namelist)
			if(CanInteract(user, GLOB.default_state))
				if(!new_person || !activewarrant)
					return TOPIC_HANDLED
				var/entry_components = splittext(new_person, " \[")
				var/name = entry_components[1]
				var/job = copytext(entry_components[2], 1, length(entry_components[2]))
				activewarrant.fields["namewarrant"] = name
				activewarrant.fields["jobwarrant"] = job
				activewarrant.fields["auth"] = "Unauthorized"
				activewarrant.fields["idauth"] = "Unauthorized"
				activewarrant.fields["access"] = list()
			return TOPIC_HANDLED
		if("editwarrantnamecustom")
			var/new_name = sanitize(input("Please input name") as null|text)
			var/new_job = sanitize(input("Please input job") as null|text)
			if(CanInteract(user, GLOB.default_state))
				if(!new_name || !new_job || !activewarrant)
					return TOPIC_HANDLED
				activewarrant.fields["namewarrant"] = new_name
				activewarrant.fields["jobwarrant"] = new_job
				activewarrant.fields["auth"] = "Unauthorized"
				activewarrant.fields["idauth"] = "Unauthorized"
				activewarrant.fields["access"] = list()
			return TOPIC_HANDLED
		if("editwarrantcharges")
			var/new_charges = sanitize(input("Please input charges", "Charges", activewarrant.fields["charges"]) as null|text)
			if(CanInteract(user, GLOB.default_state))
				if(!new_charges || !activewarrant)
					return TOPIC_HANDLED
				activewarrant.fields["charges"] = new_charges
			return TOPIC_HANDLED
		if("editwarrantauth")
			if(!activewarrant)
				return TOPIC_HANDLED
			activewarrant.fields["auth"] = "[I.registered_name] - [I.assignment ? I.assignment : "(Unknown)"]"
			return TOPIC_HANDLED
		if("editwarrantidauth")
			if(!activewarrant || activewarrant.fields["arrestsearch"] == "search")
				return TOPIC_HANDLED

			var/datum/computer_file/report/crew_record/warrant_subject
			var/datum/job/J = SSjobs.get_by_title(activewarrant.fields["jobwarrant"])
			if(!J)
				to_chat(user, "Lookup error: Unable to locate specified job in access database.")
				return TOPIC_HANDLED
			for(var/datum/computer_file/report/crew_record/CR in GLOB.all_crew_records)
				if(CR.get_name() == activewarrant.fields["namewarrant"] && CR.get_job() == activewarrant.fields["jobwarrant"])
					warrant_subject = CR

			if(!warrant_subject)
				to_chat(user, "Lookup error: Unable to locate specified personnel in crew records.")
				return TOPIC_HANDLED

			var/list/warrant_access = J.get_access()
			if(!(access_change_ids in I.access) || length(difflist(warrant_access, I.access)))
				to_chat(user, "Authentication error: Unable to locate ID with appropriate access to allow this operation.")
				return TOPIC_HANDLED
			warrant_access.Remove(get_region_accesses(ACCESS_REGION_COMMAND))

			activewarrant.fields["idauth"] = "[I.registered_name] - [I.assignment ? I.assignment : "(Unknown)"]"
			activewarrant.fields["access"] = warrant_access
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/nano_module/program/digitalwarrant/sui_data(mob/user)
	return build_warrant_data(user)

/datum/nano_module/program/digitalwarrant/sui_act(action, list/params, datum/sui/ui)
	return handle_warrant_action(action, params, ui?.user) != TOPIC_NOACTION

/datum/nano_module/program/digitalwarrant/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_warrant_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "digitalwarrant.tmpl", name, 700, 450, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()

/datum/nano_module/program/digitalwarrant/Topic(href, href_list)
	if(..())
		return TRUE

	if(href_list["sw_menu"])
		return handle_warrant_action("sw_menu", null, usr)

	if(href_list["editwarrant"])
		return handle_warrant_action("editwarrant", list("id" = href_list["editwarrant"]), usr)

	if(href_list["sendtoarchive"])
		return handle_warrant_action("sendtoarchive", list("id" = href_list["sendtoarchive"]), usr)

	if(href_list["restore"])
		return handle_warrant_action("restore", list("id" = href_list["restore"]), usr)

	if(href_list["addwarrant"])
		return handle_warrant_action("addwarrant", list("kind" = href_list["addwarrant"]), usr)

	if(href_list["savewarrant"])
		return handle_warrant_action("savewarrant", null, usr)

	if(href_list["deletewarrant"])
		return handle_warrant_action("deletewarrant", list("id" = href_list["deletewarrant"]), usr)

	if(href_list["printwarrant"])
		return handle_warrant_action("printwarrant", list("id" = href_list["printwarrant"]), usr)

	if(href_list["editwarrantname"])
		return handle_warrant_action("editwarrantname", null, usr)

	if(href_list["editwarrantnamecustom"])
		return handle_warrant_action("editwarrantnamecustom", null, usr)

	if(href_list["editwarrantcharges"])
		return handle_warrant_action("editwarrantcharges", null, usr)

	if(href_list["editwarrantauth"])
		return handle_warrant_action("editwarrantauth", null, usr)

	if(href_list["editwarrantidauth"])
		return handle_warrant_action("editwarrantidauth", null, usr)

	if(href_list["back"])
		return handle_warrant_action("back", null, usr)


//SEV Torch Arrest Warrant
//System: Geneva 291
//
//Suspect Name: Joe Schmoe
//Suspect Job: Assistant
//Charges: Vandalism
//
//Authorized by: Notthe Capitano - Commanding Officer
//Access authorized by: Notthe Capitano - Commanding Officer
//
//(legal notice)
/datum/nano_module/program/digitalwarrant/proc/warranttotext(datum/computer_file/data/warrant/warrant)
	. += "\[center]\[h3]" + GLOB.using_map.station_name + " " + capitalize(warrant.fields["arrestsearch"]) + " Warrant\[/center]\[/h3] \
	      \[b]System: \[/b]" + GLOB.using_map.system_name
	. += "\n\n\[b]Suspect Name: \[/b]" + warrant.fields["namewarrant"]
	. += "\n\[b]Suspect Job: \[/b]"  + warrant.fields["jobwarrant"]
	. += "\n\[b]Charges: \[/b]" + warrant.fields["charges"]
	. += "\n\n\[b]Authorized by: \[/b]" + warrant.fields["auth"]
	. += "\n\[b]Access authorized by: \[/b]" + warrant.fields["idauth"]
	. += "\n\n\[small]THIS WARRANT IS ONLY VALID WITH PROPER AUTHORIZATION FROM AN APPROPRIATE HEAD OF STAFF ONBOARD THE VESSEL OR AS EXCEPTED IN SOLGOV LAW. \
		  THIS PAPER IS DESIGNED FOR RECORDKEEPING PURPOSES ONLY AND SHOULD NOT BE PRESENTED TO THE SUSPECT.\[/small]"
