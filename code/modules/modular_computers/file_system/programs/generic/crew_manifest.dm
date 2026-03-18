/datum/computer_file/program/crew_manifest
	filename = "crewmanifest"
	filedesc = "Crew Manifest"
	extended_desc = "This program allows access to the manifest of active crew."
	program_icon_state = "generic"
	program_key_state = "generic_key"
	size = 4
	requires_ntnet = TRUE
	available_on_ntnet = TRUE
	nanomodule_path = /datum/nano_module/program/crew_manifest
	usage_flags = PROGRAM_ALL
	category = PROG_OFFICE

/datum/nano_module/program/crew_manifest
	name = "Crew Manifest"
	available_to_ai = TRUE
	sui_interface_name = "CrewManifest" // SIERRA-ADD - SUI
	sui_width = 800 // SIERRA-ADD - SUI
	sui_height = 600 // SIERRA-ADD - SUI

/datum/nano_module/program/crew_manifest/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, master_ui = null, datum/topic_state/state = GLOB.default_state)
	return ..()

/datum/nano_module/program/crew_manifest/sui_data(mob/user)
	var/list/data = host.initial_data(program)
	data["crew_manifest"] = nano_crew_manifest()
	return data
