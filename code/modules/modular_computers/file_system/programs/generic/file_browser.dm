/datum/computer_file/program/filemanager
	filename = "filemanager"
	filedesc = "NTOS File Manager"
	extended_desc = "This program allows management of files."
	program_icon_state = "generic"
	program_key_state = "generic_key"
	program_menu_icon = "folder-collapsed"
	size = 8
	processing_size = 0.5
	requires_ntnet = FALSE
	available_on_ntnet = FALSE
	undeletable = TRUE
	nanomodule_path = /datum/nano_module/program/computer_filemanager
	var/open_file
	var/error
	usage_flags = PROGRAM_ALL
	category = PROG_UTIL
/datum/computer_file/program/filemanager/proc/get_portable_drive()
	if(!computer)
		return null
	if(computer.get_component(PART_DRIVE))
		return computer.get_component(PART_DRIVE)
	if(istype(computer.holder, /obj/machinery/computer/modular))
		var/obj/machinery/computer/modular/modular_machine = computer.holder
		return modular_machine.portable_drive
	return null

/datum/computer_file/program/filemanager/proc/handle_filemanager_action(action, list/params, mob/user)
	params = params || list()
	switch(action)
		if("open_file")
			open_file = params["filename"]
			error = null
			return TOPIC_HANDLED
		if("new_text_file")
			if(!istype(user))
				return TOPIC_NOACTION
			var/newname = sanitize(input(user, "Enter file name or leave blank to cancel:", "File rename"))
			if(!newname)
				return TOPIC_HANDLED
			if(!computer.create_data_file(newname, file_type = /datum/computer_file/data/text))
				error = "File error: Unable to create file on disk."
			return TOPIC_HANDLED
		if("delete_file")
			computer.delete_file(params["filename"])
			if(open_file == params["filename"])
				open_file = null
			return TOPIC_HANDLED
		if("clone_file")
			computer.clone_file(params["filename"])
			return TOPIC_HANDLED
		if("rename_file")
			if(!istype(user))
				return TOPIC_NOACTION
			var/filename = params["filename"]
			var/newname = sanitize(input(user, "Enter new file name:", "File rename", filename))
			if(!newname)
				return TOPIC_HANDLED
			if(!computer.rename_file(filename, newname))
				error = "File error: Unable to rename file."
			else if(open_file == filename)
				open_file = newname
			return TOPIC_HANDLED
		if("usb_delete_file")
			var/obj/item/stock_parts/computer/hard_drive/portable/drive = get_portable_drive()
			if(drive)
				computer.delete_file(params["filename"], drive)
			return TOPIC_HANDLED
		if("copy_to_usb")
			var/obj/item/stock_parts/computer/hard_drive/portable/drive = get_portable_drive()
			if(drive)
				computer.copy_between_disks(params["filename"], computer.get_component(PART_HDD), drive)
			return TOPIC_HANDLED
		if("copy_from_usb")
			var/obj/item/stock_parts/computer/hard_drive/portable/drive = get_portable_drive()
			if(drive)
				computer.copy_between_disks(params["filename"], drive, computer.get_component(PART_HDD))
			return TOPIC_HANDLED
		if("close_file")
			open_file = null
			error = null
			return TOPIC_HANDLED
		if("edit")
			if(!open_file)
				return TOPIC_HANDLED
			var/datum/computer_file/data/F = computer.get_file(open_file)
			if(!istype(F))
				return TOPIC_HANDLED
			if(F.do_not_edit && istype(user) && (alert(user, "WARNING: This file is not compatible with editor. Editing it may result in permanently corrupted formatting or damaged data consistency. Edit anyway?", "Incompatible File", "No", "Yes") == "No"))
				return TOPIC_HANDLED
			if(F.read_only)
				error = "This file is read only. You cannot edit it."
				return TOPIC_HANDLED

			var/oldtext = html_decode(F.stored_data)
			oldtext = replacetext(oldtext, "\[br\]", "\n")

			var/newtext = sanitize(replacetext(input(user, "Editing file [open_file]. You may use most tags used in paper formatting:", "Text Editor", oldtext) as message|null, "\n", "\[br\]"), MAX_TEXTFILE_LENGTH)
			if(!newtext)
				return TOPIC_HANDLED

			computer.update_data_file(F.filename, newtext, F.type, replace_content = TRUE)
			return TOPIC_HANDLED
		if("print_file")
			if(!open_file)
				return TOPIC_HANDLED
			var/datum/computer_file/data/F = computer.get_file(open_file)
			var/datum/computer_file/binary/photo/P = computer.get_file(open_file)
			var/datum/computer_file/data/bodyscan/B = computer.get_file(open_file)
			if(istype(B))
				if(!computer.print_bodyscan())
					error = "Hardware error: Unable to print the file."
				else
					var/obj/item/paper/bodyscan/paper = new /obj/item/paper/bodyscan(user.loc, "Printout error.", "Body scan report - [B.filename]", B.generate_print_data())
					paper.metadata = B.stored_data
				return TOPIC_HANDLED
			if(istype(F))
				if(!computer.print_paper(F.generate_file_data(), F.filename, F.papertype, F.metadata))
					error = "Hardware error: Unable to print the file."
			if(istype(P))
				if(!computer.print_photo(P.photo, P.filename))
					error = "Hardware error: Unable to print the photo."
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/computer_file/program/filemanager/Topic(href, href_list)
	if(..())
		return TOPIC_HANDLED

	if(href_list["PRG_openfile"])
		return handle_filemanager_action("open_file", list("filename" = href_list["PRG_openfile"]), usr)
	if(href_list["PRG_newtextfile"])
		return handle_filemanager_action("new_text_file", null, usr)
	if(href_list["PRG_deletefile"])
		return handle_filemanager_action("delete_file", list("filename" = href_list["PRG_deletefile"]), usr)
	if(href_list["PRG_clone"])
		return handle_filemanager_action("clone_file", list("filename" = href_list["PRG_clone"]), usr)
	if(href_list["PRG_rename"])
		return handle_filemanager_action("rename_file", list("filename" = href_list["PRG_rename"]), usr)
	if(href_list["PRG_usbdeletefile"])
		return handle_filemanager_action("usb_delete_file", list("filename" = href_list["PRG_usbdeletefile"]), usr)
	if(href_list["PRG_copytousb"])
		return handle_filemanager_action("copy_to_usb", list("filename" = href_list["PRG_copytousb"]), usr)
	if(href_list["PRG_copyfromusb"])
		return handle_filemanager_action("copy_from_usb", list("filename" = href_list["PRG_copyfromusb"]), usr)
	if(href_list["PRG_closefile"])
		return handle_filemanager_action("close_file", null, usr)
	if(href_list["PRG_edit"])
		return handle_filemanager_action("edit", null, usr)
	if(href_list["PRG_printfile"])
		return handle_filemanager_action("print_file", null, usr)
/datum/nano_module/program/computer_filemanager
	name = "NTOS File Manager"
	sui_interface_name = "FileManager" // SIERRA-ADD - SUI
	sui_width = 600 // SIERRA-ADD - SUI
	sui_height = 700 // SIERRA-ADD - SUI

/datum/nano_module/program/computer_filemanager/proc/build_filemanager_data(mob/user) // SIERRA-ADD - SUI
	var/list/data = host.initial_data(program)
	var/datum/computer_file/program/filemanager/PRG = program
	if(!istype(PRG))
		return data

	if(PRG.error)
		data["error"] = PRG.error
	if(PRG.open_file)
		if(!PRG.computer || !PRG.computer.has_component(PART_HDD))
			data["error"] = "I/O ERROR: Unable to access hard drive."
		else
			var/datum/computer_file/data/F = PRG.computer.get_file(PRG.open_file)
			//[SIERRA-ADD] - MODPACK RND
			var/datum/computer_file/binary/photo/P = PRG.computer.get_file(PRG.open_file)
			var/datum/computer_file/data/bodyscan/B = PRG.computer.get_file(PRG.open_file)
			if(istype(B))
				data["filename"] = "[B.filename].[B.filetype]"
				data["filedata"] = B.generate_file_data(user, B.stored_data)
			else if(istype(P))
				data["filename"] = "[P.filename].[P.filetype]"
				data["photodata"] = P.generate_photo_data(user, P.photo)
			//[/SIERRA-ADD] - MODPACK RND
			else if(!istype(F))
				data["error"] = "I/O ERROR: Unable to open file."
			else
				data["filedata"] = F.generate_file_data(user)
				data["filename"] = "[F.filename].[F.filetype]"
	else
		if(!PRG.computer || !PRG.computer.has_component(PART_HDD))
			data["error"] = "I/O ERROR: Unable to access hard drive."
		else
			var/list/files[0]
			for(var/datum/computer_file/F in PRG.computer.get_all_files())
				files.Add(list(list(
					"name" = F.filename,
					"type" = F.filetype,
					"size" = F.size,
					"undeletable" = F.undeletable
				)))
			data["files"] = files
			var/obj/item/stock_parts/computer/hard_drive/portable/RHDD
			if(PRG.computer.get_component(PART_DRIVE))
				RHDD = PRG.computer.get_component(PART_DRIVE)
			else if(istype(PRG.computer.holder, /obj/machinery/computer/modular))
				var/obj/machinery/computer/modular/modular_machine = PRG.computer.holder
				RHDD = modular_machine.portable_drive
			if(RHDD)
				data["usbconnected"] = TRUE
				var/list/usbfiles[0]
				for(var/datum/computer_file/F in PRG.computer.get_all_files(disk = RHDD))
					usbfiles.Add(list(list(
						"name" = F.filename,
						"type" = F.filetype,
						"size" = F.size,
						"undeletable" = F.undeletable
					)))
				data["usbfiles"] = usbfiles
	return data

/datum/nano_module/program/computer_filemanager/sui_data(mob/user) // SIERRA-ADD - SUI
	return build_filemanager_data(user)

/datum/nano_module/program/computer_filemanager/sui_act(action, list/params, datum/sui/ui) // SIERRA-ADD - SUI
	var/datum/computer_file/program/filemanager/PRG = program
	if(!istype(PRG))
		return FALSE
	return PRG.handle_filemanager_action(action, params || list(), ui?.user) != TOPIC_NOACTION

/datum/nano_module/program/computer_filemanager/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_filemanager_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "file_manager.tmpl", "NTOS File Manager", 600, 700, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
