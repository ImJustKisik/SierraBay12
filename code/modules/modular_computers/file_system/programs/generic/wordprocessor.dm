/datum/computer_file/program/wordprocessor
	filename = "wordprocessor"
	filedesc = "NanoWord"
	extended_desc = "This program allows the editing and preview of text documents."
	program_icon_state = "word"
	program_key_state = "atmos_key"
	size = 4
	requires_ntnet = FALSE
	available_on_ntnet = TRUE
	nanomodule_path = /datum/nano_module/program/computer_wordprocessor
	var/browsing = FALSE
	var/open_file
	var/loaded_data
	var/error
	var/is_edited
	usage_flags = PROGRAM_ALL
	category = PROG_OFFICE

/datum/computer_file/program/wordprocessor/proc/open_file(filename)
	var/datum/computer_file/data/F = computer.get_file(filename)
	if(istype(F))
		open_file = F.filename
		loaded_data = F.stored_data
		is_edited = FALSE
		return TRUE
	return FALSE

/datum/computer_file/program/wordprocessor/proc/create_file(filename, data = "")
	. = computer.save_data_file(filename, data, /datum/computer_file/data/text)
	if(.)
		is_edited = FALSE

/datum/computer_file/program/wordprocessor/proc/save_file(filename)
	. = computer.save_data_file(filename, loaded_data, /datum/computer_file/data/text)
	if(.)
		is_edited = FALSE

/datum/computer_file/program/wordprocessor/proc/handle_wordprocessor_action(action, list/params, mob/user)
	switch(action)
		if("preview_text")
			if(!istype(user))
				return TOPIC_NOACTION
			show_browser(user,"<HTML><HEAD><TITLE>[open_file]</TITLE></HEAD>[digitalPencode2html(loaded_data)]</BODY></HTML>", "window=[open_file]")
			return TOPIC_HANDLED

		if("tag_help")
			if(!istype(user))
				return TOPIC_NOACTION
			var/datum/codex_entry/entry = SScodex.get_codex_entry("pen")
			if(entry)
				SScodex.present_codex_entry(user, entry)
			return TOPIC_HANDLED

		if("close_browser")
			browsing = FALSE
			return TOPIC_HANDLED

		if("back_to_menu")
			error = null
			return TOPIC_HANDLED

		if("load_menu")
			browsing = TRUE
			return TOPIC_HANDLED

		if("open_file")
			var/target_file = params["filename"]
			if(!target_file)
				return TOPIC_NOACTION
			if(is_edited && istype(user))
				if(alert(user, "Would you like to save your changes first?", null, "Yes", "No") == "Yes")
					if(!save_file(open_file))
						error = "I/O error: Unable to save file '[open_file]'."
						browsing = FALSE
						return TOPIC_HANDLED
			browsing = FALSE
			if(!open_file(target_file))
				error = "I/O error: Unable to open file '[target_file]'."
			return TOPIC_HANDLED

		if("new_file")
			if(is_edited && istype(user))
				if(alert(user, "Would you like to save your changes first?", null, "Yes", "No") == "Yes")
					if(!save_file(open_file))
						error = "I/O error: Unable to save file '[open_file]'."
						return TOPIC_HANDLED
			if(!istype(user))
				return TOPIC_NOACTION
			var/newname = sanitize(input(user, "Enter file name:", "New File") as text|null)
			if(!newname)
				return TOPIC_HANDLED
			var/datum/computer_file/data/F = create_file(newname)
			if(!istype(F))
				error = "I/O error: Unable to create file '[newname]'."
				return TOPIC_HANDLED
			open_file = F.filename
			loaded_data = ""
			return TOPIC_HANDLED

		if("save_as_file")
			if(!istype(user))
				return TOPIC_NOACTION
			var/newname = sanitize(input(user, "Enter file name:", "Save As") as text|null)
			if(!newname)
				return TOPIC_HANDLED
			var/datum/computer_file/data/F = create_file(newname, loaded_data)
			if(!istype(F))
				error = "I/O error: Unable to create file '[newname]'."
				return TOPIC_HANDLED
			open_file = F.filename
			return TOPIC_HANDLED

		if("save_file")
			if(!open_file)
				if(!istype(user))
					return TOPIC_NOACTION
				open_file = sanitize(input(user, "Enter file name:", "Save As") as text|null)
				if(!open_file)
					return TOPIC_HANDLED
			if(!save_file(open_file))
				error = "I/O error: Unable to save file '[open_file]'."
			return TOPIC_HANDLED

		if("edit_file")
			if(!istype(user))
				return TOPIC_NOACTION
			var/oldtext = html_decode(loaded_data)
			oldtext = replacetext(oldtext, "\[br\]", "\n")

			var/newtext = sanitize(replacetext(input(user, "Editing file '[open_file]'. You may use most tags used in paper formatting:", "Text Editor", oldtext) as message|null, "\n", "\[br\]"), MAX_TEXTFILE_LENGTH)
			if(!newtext)
				return TOPIC_HANDLED
			loaded_data = newtext
			is_edited = TRUE
			return TOPIC_HANDLED

		if("print_file")
			if(!computer.print_paper(digitalPencode2html(loaded_data)))
				error = "Hardware error: Printer missing or out of paper."
			return TOPIC_HANDLED

	return TOPIC_NOACTION

/datum/computer_file/program/wordprocessor/Topic(href, href_list)
	if(..())
		return TOPIC_HANDLED

	if(href_list["PRG_txtrpeview"])
		return handle_wordprocessor_action("preview_text", null, usr)

	if(href_list["PRG_taghelp"])
		return handle_wordprocessor_action("tag_help", null, usr)

	if(href_list["PRG_closebrowser"])
		return handle_wordprocessor_action("close_browser", null, usr)

	if(href_list["PRG_backtomenu"])
		return handle_wordprocessor_action("back_to_menu", null, usr)

	if(href_list["PRG_loadmenu"])
		return handle_wordprocessor_action("load_menu", null, usr)

	if(href_list["PRG_openfile"])
		return handle_wordprocessor_action("open_file", list("filename" = href_list["PRG_openfile"]), usr)

	if(href_list["PRG_newfile"])
		return handle_wordprocessor_action("new_file", null, usr)

	if(href_list["PRG_saveasfile"])
		return handle_wordprocessor_action("save_as_file", null, usr)

	if(href_list["PRG_savefile"])
		return handle_wordprocessor_action("save_file", null, usr)

	if(href_list["PRG_editfile"])
		return handle_wordprocessor_action("edit_file", null, usr)

	if(href_list["PRG_printfile"])
		return handle_wordprocessor_action("print_file", null, usr)

/datum/nano_module/program/computer_wordprocessor
	name = "Word Processor"
	sui_interface_name = "WordProcessor"
	sui_width = 575
	sui_height = 700

/datum/nano_module/program/computer_wordprocessor/proc/build_wordprocessor_data(mob/user)
	var/list/data = host.initial_data(program)
	var/datum/computer_file/program/wordprocessor/PRG
	PRG = program
	if(!istype(PRG))
		return data

	if(PRG.error)
		data["error"] = PRG.error
	if(PRG.browsing)
		data["browsing"] = PRG.browsing
		if(!PRG.computer || !PRG.computer.has_component(PART_HDD))
			data["error"] = "I/O ERROR: Unable to access hard drive."
		else
			var/list/files[0]
			for(var/datum/computer_file/F in PRG.computer.get_all_files())
				if(F.filetype == "TXT")
					files.Add(list(list(
						"name" = F.filename,
						"size" = F.size
					)))
			data["files"] = files

			var/obj/item/stock_parts/computer/hard_drive/portable/RHDD = PRG.computer.get_component(PART_DRIVE)
			if(RHDD)
				data["usbconnected"] = TRUE
				var/list/usbfiles[0]
				for(var/datum/computer_file/F in PRG.computer.get_all_files(disk = RHDD))
					if(F.filetype == "TXT")
						usbfiles.Add(list(list(
							"name" = F.filename,
							"size" = F.size,
						)))
				data["usbfiles"] = usbfiles
	else if(PRG.open_file)
		data["filedata"] = digitalPencode2html(sanitize(PRG.loaded_data, MAX_TEXTFILE_LENGTH, FALSE))
		data["filename"] = PRG.is_edited ? "[PRG.open_file]*" : PRG.open_file
	else
		data["filedata"] = digitalPencode2html(sanitize(PRG.loaded_data, MAX_TEXTFILE_LENGTH, FALSE))
		data["filename"] = "UNNAMED"
	return data

/datum/nano_module/program/computer_wordprocessor/sui_data(mob/user)
	return build_wordprocessor_data(user)

/datum/nano_module/program/computer_wordprocessor/sui_act(action, list/params, datum/sui/ui)
	var/datum/computer_file/program/wordprocessor/PRG = program
	if(!istype(PRG))
		return FALSE
	return PRG.handle_wordprocessor_action(action, params || list(), ui?.user) != TOPIC_NOACTION

/datum/nano_module/program/computer_wordprocessor/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_wordprocessor_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "word_processor.tmpl", "Word Processor", 575, 700, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
