/datum/unit_test/extensions
	name = "EXTENSIONS template"
	template = /datum/unit_test/extensions
	async = 0

/datum/unit_test/extensions/basic_extension_shall_lazy_initalize_as_expected
	name = "EXTENSIONS - Basic extension shall lazy initialize as expected"

/datum/unit_test/extensions/basic_extension_shall_lazy_initalize_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	set_extension(O, /datum/extension/test_one)

	var/number_of_failures = 0
	for(var/extension in O.extensions)
		if(!islist(O.extensions[extension]))
			log_unit_test("[extension] was initalized.")
			number_of_failures++

	var/datum/extension/one = get_extension(O, /datum/extension/test_one)
	for(var/extension in O.extensions)
		if(islist(O.extensions[extension]))
			log_unit_test("[extension] was not initalized.")
			number_of_failures++

	if(one.type != /datum/extension/test_one)
		log_unit_test("[log_info_line(one)] was not strictly of the type [/datum/extension/test_one]")
		number_of_failures++

	if(one.holder != O)
		log_unit_test("[log_info_line(one)] had an unexpected holder: [log_info_line(one.holder)]")
		number_of_failures++

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")

	qdel(O)
	return TRUE

/datum/unit_test/extensions/basic_immediate_extension_shall_initalize_as_expected
	name = "EXTENSIONS - Basic immediate extension shall initialize as expected"

/datum/unit_test/extensions/basic_immediate_extension_shall_initalize_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	set_extension(O, /datum/extension/test_two)

	var/number_of_failures = 0
	for(var/extension in O.extensions)
		if(islist(O.extensions[extension]))
			log_unit_test("[extension] was not initalized.")
			number_of_failures++

	var/datum/extension/two = get_extension(O, /datum/extension/test_two)
	if(two.type != /datum/extension/test_two)
		log_unit_test("[log_info_line(two)] was not strictly of the type [/datum/extension/test_two]")
		number_of_failures++

	if(two.holder != O)
		log_unit_test("[log_info_line(two)] had an unexpected holder: [log_info_line(two.holder)]")
		number_of_failures++

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")

	qdel(O)
	return TRUE

/datum/unit_test/extensions/shall_acquire_extension_subtype_as_expected
	name = "EXTENSIONS - Shall acquire extension subtype as expected"

/datum/unit_test/extensions/shall_acquire_extension_subtype_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	set_extension(O, /datum/extension/test_three/subtype)

	var/datum/extension/three = get_extension(O, /datum/extension/test_three)
	if(three.type == /datum/extension/test_three/subtype)
		pass("All assertions passed.")
	else
		fail("[log_info_line(three)] was not strictly of the type [/datum/extension/test_three/subtype]")

	qdel(O)
	return TRUE

/datum/unit_test/extensions/extension_shall_be_provided_arguments_as_expected
	name = "EXTENSIONS - Extension shall be provided arguments as expected"

/datum/unit_test/extensions/extension_shall_be_provided_arguments_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	set_extension(O, /datum/extension/test_four, list("a", "b"), list("c", "d"))

	var/datum/extension/test_four/four = get_extension(O, /datum/extension/test_four)
	if(four.holder == O && islist(four.first_argument) && islist(four.second_argument) && four.first_argument[1] == "a" && four.first_argument[2] == "b" &&	four.second_argument[1] == "c" && four.second_argument[2] == "d")
		pass("All assertions passed.")
	else
		fail("[log_info_line(four)] had unexpected arguments:\n[log_info_line(four.holder)]\n[log_info_line(four.first_argument)]\n[log_info_line(four.second_argument)]")

	return TRUE

/datum/unit_test/extensions/immediate_extension_shall_be_provided_arguments_as_expected
	name = "EXTENSIONS - Immediate extension shall be provided arguments as expected"

/datum/unit_test/extensions/immediate_extension_shall_be_provided_arguments_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	set_extension(O, /datum/extension/test_five, list("a", "b"), list("c", "d"))

	var/datum/extension/test_five/five = get_extension(O, /datum/extension/test_five)
	if(five.holder == O && islist(five.first_argument) && islist(five.second_argument) && five.first_argument[1] == "a" && five.first_argument[2] == "b" &&	five.second_argument[1] == "c" && five.second_argument[2] == "d")
		pass("All assertions passed.")
	else
		fail("[log_info_line(five)] had unexpected arguments:\n[log_info_line(five.holder)]\n[log_info_line(five.first_argument)]\n[log_info_line(five.second_argument)]")

	return TRUE

/datum/unit_test/extensions/get_or_create_extension_shall_initialize_as_expected
	name = "EXTENSIONS - get_or_create() shall initialize as expected"

/datum/unit_test/extensions/get_or_create_extension_shall_initialize_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)
	var/datum/extension/test_one/one = get_or_create_extension(O, /datum/extension/test_one)

	var/number_of_failures = 0
	if(one.type != /datum/extension/test_one)
		log_unit_test("[log_info_line(one)] was not strictly of the type [/datum/extension/test_one]")
		number_of_failures++

	if(one.holder != O)
		log_unit_test("[log_info_line(one)] had an unexpected holder: [log_info_line(one.holder)]")
		number_of_failures++

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")

	return TRUE

/datum/unit_test/extensions/get_or_create_extension_with_arguments_shall_initialize_as_expected
	name = "EXTENSIONS - get_or_create() with arguments shall initialize as expected"

/datum/unit_test/extensions/get_or_create_extension_with_arguments_shall_initialize_as_expected/start_test()
	var/turf/start = get_safe_turf()
	var/obj/O = new(start)

	var/datum/extension/test_four/four = get_or_create_extension(O, /datum/extension/test_four, list("a", "b"), list("c", "d"))
	if(four.holder == O && islist(four.first_argument) && islist(four.second_argument) && four.first_argument[1] == "a" && four.first_argument[2] == "b" &&	four.second_argument[1] == "c" && four.second_argument[2] == "d")
		pass("All assertions passed.")
	else
		fail("[log_info_line(four)] had unexpected arguments:\n[log_info_line(four.holder)]\n[log_info_line(four.first_argument)]\n[log_info_line(four.second_argument)]")

	return TRUE

/datum/extension/test_one
	base_type = /datum/extension/test_one

/datum/extension/test_two
	base_type = /datum/extension/test_two
	flags = EXTENSION_FLAG_IMMEDIATE

/datum/extension/test_three
	base_type = /datum/extension/test_three

/datum/extension/test_three/subtype

/datum/extension/test_four
	base_type = /datum/extension/test_four
	var/list/first_argument
	var/list/second_argument

/datum/extension/test_four/New(holder, first_argument, second_argument)
	..()
	src.first_argument = first_argument
	src.second_argument = second_argument

/datum/extension/test_five
	base_type = /datum/extension/test_five
	flags = EXTENSION_FLAG_IMMEDIATE
	var/list/first_argument
	var/list/second_argument

/datum/extension/test_five/New(holder, first_argument, second_argument)
	..()
	src.first_argument = first_argument
	src.second_argument = second_argument

/datum/unit_test/sui_program_ui_interact_shall_forward_context
	name = "SUI - Program ui_interact shall forward context to ui_interact_sui"

/datum/unit_test/sui_program_ui_interact_shall_forward_context/start_test()
	var/datum/unit_test_sui_host/host = new()
	var/datum/nano_module/unit_test_sui_forwarding/module = new(host, null)
	var/datum/computer_file/program/program = new()
	program.program_state = PROGRAM_STATE_ACTIVE
	program.NM = module

	var/datum/topic_state/custom_state = new()
	var/datum/custom_master_ui = new()
	var/result = program.ui_interact(null, "diagnostics", null, FALSE, custom_master_ui, custom_state)

	var/number_of_failures = 0
	if(result != FALSE)
		log_bad("Expected ui_interact() to return FALSE when delegated to SUI module.")
		number_of_failures++
	if(module.call_count != 1)
		log_bad("Expected ui_interact_sui() to be called once, got [module.call_count].")
		number_of_failures++
	if(module.received_ui_key != "diagnostics")
		log_bad("Expected ui_key diagnostics, got [module.received_ui_key].")
		number_of_failures++
	if(module.received_force_open != FALSE)
		log_bad("Expected force_open FALSE, got [module.received_force_open].")
		number_of_failures++
	if(module.received_master_ui != custom_master_ui)
		log_bad("Expected master_ui to be forwarded unchanged.")
		number_of_failures++
	if(module.received_state != custom_state)
		log_bad("Expected topic state to be forwarded unchanged.")
		number_of_failures++

	qdel(program)
	qdel(module)
	qdel(host)
	qdel(custom_state)
	qdel(custom_master_ui)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_ui_interact_shall_open_and_update_by_custom_key
	name = "SUI - ui_interact_sui shall open/update/reopen for non-main keys"

/datum/unit_test/sui_ui_interact_shall_open_and_update_by_custom_key/start_test()
	var/datum/unit_test_sui_host/host = new()
	var/datum/nano_module/unit_test_sui_smoke/module = new(host, null)
	module.name = "SUI Smoke Module"
	module.sui_interface_name = "SuiSmoke"
	module.sui_width = 700
	module.sui_height = 450

	var/datum/sui/unit_test_sui_mock/master_ui = new(null, module, "MasterUI", "Master UI", 100, 100)
	var/datum/topic_state/custom_state = new()
	var/number_of_failures = 0

	module.ui_interact_sui(null, "sidebar", FALSE, master_ui, custom_state)
	var/datum/sui/unit_test_sui_mock/first_ui = module.last_created_ui
	var/datum/sui/unit_test_sui_mock/second_ui = null
	if(module.last_seen_ui_key != "sidebar")
		log_bad("Expected try-update path to receive ui_key sidebar, got [module.last_seen_ui_key].")
		number_of_failures++
	if(!istype(first_ui))
		log_bad("Expected a SUI instance to be created on first call.")
		number_of_failures++
	else
		if(first_ui.ui_key != "sidebar")
			log_bad("Expected first UI key sidebar, got [first_ui.ui_key].")
			number_of_failures++
		if(first_ui.master_ui != master_ui)
			log_bad("Expected first UI master_ui to match forwarded master.")
			number_of_failures++
		if(first_ui.state != custom_state)
			log_bad("Expected first UI state to match forwarded topic state.")
			number_of_failures++
		if(first_ui.auto_update_calls != 1)
			log_bad("Expected auto-update to be set exactly once on first open.")
			number_of_failures++
		if(first_ui.open_count != 1)
			log_bad("Expected first UI to open once, got [first_ui.open_count].")
			number_of_failures++
		if(first_ui.push_count != 0)
			log_bad("Expected first UI push_count 0 on initial open, got [first_ui.push_count].")
			number_of_failures++
		if(first_ui.last_open_data["sequence"] != 1)
			var/first_open_sequence = first_ui.last_open_data["sequence"]
			log_bad("Expected first open sequence 1, got [first_open_sequence].")
			number_of_failures++

	if(istype(first_ui))
		module.next_existing_ui = first_ui
		module.ui_interact_sui(null, "sidebar", FALSE, master_ui, custom_state)
		if(module.create_calls != 1)
			log_bad("Expected no extra UI creation on update path, got [module.create_calls] total creates.")
			number_of_failures++
		if(first_ui.push_count != 1)
			log_bad("Expected existing UI to receive one push update, got [first_ui.push_count].")
			number_of_failures++
		if(first_ui.last_push_data["sequence"] != 2)
			var/first_push_sequence = first_ui.last_push_data["sequence"]
			log_bad("Expected push sequence 2, got [first_push_sequence].")
			number_of_failures++

		module.next_existing_ui = first_ui
		module.ui_interact_sui(null, "sidebar", TRUE, master_ui, custom_state)
		second_ui = module.last_created_ui
		if(first_ui.close_count != 1)
			log_bad("Expected force_open to close existing UI once, got [first_ui.close_count].")
			number_of_failures++
		if(module.create_calls != 2)
			log_bad("Expected force_open to create a replacement UI, got [module.create_calls] total creates.")
			number_of_failures++
		if(!istype(second_ui) || second_ui == first_ui)
			log_bad("Expected a new replacement UI instance after force_open.")
			number_of_failures++
		else
			if(second_ui.ui_key != "sidebar")
				log_bad("Expected replacement UI key sidebar, got [second_ui.ui_key].")
				number_of_failures++
			if(second_ui.open_count != 1)
				log_bad("Expected replacement UI to open once, got [second_ui.open_count].")
				number_of_failures++
			if(second_ui.last_open_data["sequence"] != 3)
				var/second_open_sequence = second_ui.last_open_data["sequence"]
				log_bad("Expected replacement open sequence 3, got [second_open_sequence].")
				number_of_failures++

	if(istype(first_ui))
		qdel(first_ui)
	if(istype(second_ui) && second_ui != first_ui)
		qdel(second_ui)
	qdel(module)
	qdel(host)
	qdel(master_ui)
	qdel(custom_state)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test_sui_host

/datum/unit_test_sui_host/nano_host()
	return src

/datum/unit_test_sui_host/initial_data(datum/computer_file/program/program)
	return list("source" = "unit_test")

/datum/nano_module/unit_test_sui_forwarding
	sui_interface_name = "UnitTestForwarding"
	var/call_count = 0
	var/received_ui_key
	var/received_force_open = null
	var/received_master_ui
	var/datum/topic_state/received_state

/datum/nano_module/unit_test_sui_forwarding/ui_interact_sui(mob/user, ui_key = "main", force_open = 1, master_ui = null, datum/topic_state/state = GLOB.default_state)
	call_count++
	received_ui_key = ui_key
	received_force_open = force_open
	received_master_ui = master_ui
	received_state = state

/datum/nano_module/unit_test_sui_smoke
	sui_interface_name = "UnitTestSmoke"
	var/datum/sui/unit_test_sui_mock/next_existing_ui
	var/last_seen_ui_key
	var/create_calls = 0
	var/sequence = 0
	var/datum/sui/unit_test_sui_mock/last_created_ui

/datum/nano_module/unit_test_sui_smoke/sui_data(mob/user)
	sequence++
	return list("sequence" = sequence)

/datum/nano_module/unit_test_sui_smoke/get_existing_sui_ui(mob/user, ui_key = "main")
	last_seen_ui_key = ui_key
	return next_existing_ui

/datum/nano_module/unit_test_sui_smoke/create_sui_ui(mob/user, ui_key = "main", master_ui = null, datum/topic_state/state = GLOB.default_state)
	create_calls++
	var/datum/sui/sui_master_ui = istype(master_ui, /datum/sui) ? master_ui : null
	var/datum/sui/unit_test_sui_mock/new_ui = new(user, src, sui_interface_name, name, (sui_width || 450), (sui_height || 550), nmaster_ui = sui_master_ui, nstate = state, nui_key = ui_key)
	last_created_ui = new_ui
	next_existing_ui = new_ui
	return new_ui

/datum/sui/unit_test_sui_mock
	var/open_count = 0
	var/push_count = 0
	var/close_count = 0
	var/auto_update_calls = 0
	var/list/last_open_data = list()
	var/list/last_push_data = list()
	var/last_map_state = FALSE
	var/last_map_z
	var/last_map_height = 0

/datum/sui/unit_test_sui_mock/open(list/initial_data)
	open_count++
	last_open_data = islist(initial_data) ? initial_data.Copy() : list()
	is_open = TRUE
	return

/datum/sui/unit_test_sui_mock/push_data(list/data)
	push_count++
	last_push_data = islist(data) ? data.Copy() : list()
	return

/datum/sui/unit_test_sui_mock/set_auto_update(nstate = TRUE)
	auto_update_calls++
	is_auto_updating = nstate
	return

/datum/sui/unit_test_sui_mock/set_show_map(nstate, nz, map_height = 256)
	last_map_state = !!nstate
	last_map_z = nz
	last_map_height = map_height
	return

/datum/sui/unit_test_sui_mock/check_status()
	return

/datum/sui/unit_test_sui_mock/close()
	close_count++
	is_open = FALSE
	return

/datum/sui/unit_test_sui_mock/Destroy()
	is_open = FALSE
	is_closing = TRUE
	return ..()

/datum/unit_test/sui_close_user_sui_uis_shall_close_registered_windows
	name = "SUI - close_user_sui_uis shall close registered windows"

/datum/unit_test/sui_close_user_sui_uis_shall_close_registered_windows/start_test()
	var/atom/movable/unit_test_sui_roundtrip_source/source = new()
	var/mob/fake_mob/user = new()
	var/datum/sui/unit_test_sui_mock/main_ui = new(user, source, "RoundtripMain", "Roundtrip Main")
	var/datum/sui/unit_test_sui_mock/aux_ui = new(user, source, "RoundtripAux", "Roundtrip Aux", nui_key = "aux")
	main_ui.is_open = TRUE
	aux_ui.is_open = TRUE

	var/src_key = "\ref[source]"
	SSnano.open_sui_uis[src_key] = list(
		"main" = list(main_ui),
		"aux" = list(aux_ui)
	)

	var/closed = SSnano.close_user_sui_uis(user, source)
	var/number_of_failures = 0
	if(closed != 2)
		log_bad("Expected close_user_sui_uis to close 2 windows, got [closed].")
		number_of_failures++
	if(main_ui.close_count != 1)
		log_bad("Expected main UI close_count 1, got [main_ui.close_count].")
		number_of_failures++
	if(aux_ui.close_count != 1)
		log_bad("Expected aux UI close_count 1, got [aux_ui.close_count].")
		number_of_failures++

	SSnano.open_sui_uis -= src_key
	qdel(main_ui)
	qdel(aux_ui)
	qdel(user)
	qdel(source)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_action_roundtrip_shall_push_update
	name = "SUI - handled sui_act shall roundtrip into ui update"

/datum/unit_test/sui_action_roundtrip_shall_push_update/start_test()
	var/atom/movable/unit_test_sui_roundtrip_source/source = new()
	var/mob/fake_mob/user = new()
	var/datum/sui/unit_test_sui_mock/ui = new(user, source, "Roundtrip", "Roundtrip")
	ui.is_open = TRUE
	ui.status = STATUS_INTERACTIVE

	var/src_key = "\ref[source]"
	SSnano.open_sui_uis[src_key] = list("main" = list(ui))

	if(source.sui_act("toggle", list(), ui))
		SSnano.update_sui_uis(source)

	var/number_of_failures = 0
	if(source.last_action != "toggle")
		log_bad("Expected source to record action 'toggle', got [source.last_action].")
		number_of_failures++
	if(!source.state_on)
		log_bad("Expected source state to become TRUE after toggle action.")
		number_of_failures++
	if(source.sui_update_calls != 1)
		log_bad("Expected sui_update to run once, got [source.sui_update_calls].")
		number_of_failures++
	if(ui.push_count != 1)
		log_bad("Expected UI push_count 1 after update roundtrip, got [ui.push_count].")
		number_of_failures++
	if(!ui.last_push_data["state_on"])
		log_bad("Expected pushed data to include state_on=TRUE.")
		number_of_failures++

	SSnano.open_sui_uis -= src_key
	qdel(ui)
	qdel(user)
	qdel(source)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_status_gating_shall_follow_effective_status
	name = "SUI - status gating shall transition interactive/update/disabled and close"

/datum/unit_test/sui_status_gating_shall_follow_effective_status/start_test()
	var/atom/movable/unit_test_sui_status_host/host = new()
	var/mob/fake_mob/user = new()
	var/datum/sui/unit_test_status_probe/ui = new(user, host, "StatusProbe", "Status Probe")
	ui.is_open = TRUE
	ui.status = STATUS_INTERACTIVE

	host.current_status = STATUS_INTERACTIVE
	ui.check_status()

	host.current_status = STATUS_UPDATE
	ui.check_status()

	host.current_status = STATUS_DISABLED
	ui.check_status()

	host.current_status = STATUS_CLOSE
	ui.check_status()

	var/number_of_failures = 0
	if(ui.status != STATUS_DISABLED)
		log_bad("Expected final non-close status to be STATUS_DISABLED, got [ui.status].")
		number_of_failures++
	if(ui.config_update_calls != 2)
		log_bad("Expected two config updates (interactive->update, update->disabled), got [ui.config_update_calls].")
		number_of_failures++
	if(ui.close_calls != 1)
		log_bad("Expected close() to be called exactly once on STATUS_CLOSE, got [ui.close_calls].")
		number_of_failures++

	qdel(ui)
	qdel(user)
	qdel(host)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_migrated_interfaces_shall_have_assets_and_flags
	name = "SUI - migrated interfaces shall declare sui_interface_name and register assets"

/datum/unit_test/sui_migrated_interfaces_shall_have_assets_and_flags/start_test()
	var/singleton/asset_registry_v2/registry = GET_SINGLETON(/singleton/asset_registry_v2)
	var/datum/unit_test_sui_host/host = new()
	var/number_of_failures = 0
	var/list/migrated = list(
		list("interface" = "WordProcessor", "module" = /datum/nano_module/program/computer_wordprocessor),
		list("interface" = "NTNetDownloader", "module" = /datum/nano_module/program/computer_ntnetdownload),
		list("interface" = "NTTransfer", "module" = /datum/nano_module/program/computer_nttransfer),
		list("interface" = "Newscast", "module" = /datum/nano_module/program/newscast),
		list("interface" = "AccessDecrypter", "module" = /datum/nano_module/program/access_decrypter),
		list("interface" = "ComputerDos", "module" = /datum/nano_module/program/computer_dos),
		list("interface" = "Revelation", "module" = /datum/nano_module/program/revelation),
		list("interface" = "ComputerConfigurator", "module" = /datum/nano_module/program/computer_configurator),
		list("interface" = "Docking", "module" = /datum/nano_module/program/docking),
		list("interface" = "ArcadeClassic", "module" = /datum/nano_module/program/arcade_classic),
		list("interface" = "Scanner", "module" = /datum/nano_module/program/scanner),
		list("interface" = "AIDiag", "module" = /datum/nano_module/program/computer_aidiag),
		list("interface" = "NTNetMonitor", "module" = /datum/nano_module/program/computer_ntnetmonitor),
		list("interface" = "ForceAuthorization", "module" = /datum/nano_module/program/forceauthorization),
		list("interface" = "EngineControl", "module" = /datum/nano_module/program/ship/engine_control),
		list("interface" = "PowerMonitor", "module" = /datum/nano_module/program/power_monitor),
		list("interface" = "AlarmMonitor", "module" = /datum/nano_module/program/alarm_monitor/engineering),
		list("interface" = "AtmosControl", "module" = /datum/nano_module/program/atmos_control),
		list("interface" = "Rcon", "module" = /datum/nano_module/program/rcon),
		list("interface" = "ShieldsMonitor", "module" = /datum/nano_module/program/shields_monitor),
		list("interface" = "SupermatterMonitor", "module" = /datum/nano_module/program/supermatter_monitor),
		list("interface" = "CrewMonitor", "module" = /datum/nano_module/program/crew_monitor),
		list("interface" = "ShipSensors", "module" = /datum/nano_module/program/ship/sensors),
		list("interface" = "CrewManifest", "module" = /datum/nano_module/program/crew_manifest),
		list("interface" = "CameraMonitor", "module" = /datum/nano_module/program/camera_monitor),
		list("interface" = "CameraMonitor", "module" = /datum/nano_module/program/camera_monitor/hacked)
	)

	for(var/list/entry in migrated)
		var/interface_name = entry["interface"]
		var/module_type = entry["module"]
		var/datum/nano_module/program/module = new module_type(host, null, null)
		if(module.sui_interface_name != interface_name)
			log_bad("Expected [module_type] sui_interface_name='[interface_name]', got '[module.sui_interface_name]'.")
			number_of_failures++
		var/logical_id = registry.ensure_sui_interface_registered(interface_name)
		if(!logical_id)
			log_bad("Expected interface asset for '[interface_name]' to be registerable.")
			number_of_failures++
		qdel(module)

	var/datum/nano_module/program/supply/unmigrated = new(host, null, null)
	if(unmigrated.sui_interface_name)
		log_bad("Expected unmigrated /datum/nano_module/program/supply to remain on NanoUI path (no sui_interface_name).")
		number_of_failures++
	qdel(unmigrated)
	qdel(host)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/atom/movable/unit_test_sui_roundtrip_source
	var/state_on = FALSE
	var/last_action
	var/sui_update_calls = 0

/atom/movable/unit_test_sui_roundtrip_source/nano_host()
	return src

/atom/movable/unit_test_sui_roundtrip_source/CanUseTopic(mob/user, datum/topic_state/state = GLOB.default_state)
	return STATUS_INTERACTIVE

/atom/movable/unit_test_sui_roundtrip_source/sui_act(action, list/params, datum/sui/ui)
	last_action = action
	if(action == "toggle")
		state_on = !state_on
		return TRUE
	return FALSE

/atom/movable/unit_test_sui_roundtrip_source/sui_update(mob/user, datum/sui/ui)
	sui_update_calls++
	ui.push_data(list(
		"state_on" = state_on,
		"updates" = sui_update_calls
	))

/atom/movable/unit_test_sui_status_host
	var/current_status = STATUS_INTERACTIVE

/atom/movable/unit_test_sui_status_host/nano_host()
	return src

/atom/movable/unit_test_sui_status_host/CanUseTopic(mob/user, datum/topic_state/state = GLOB.default_state)
	return current_status

/datum/unit_test/sui_power_monitor_actions_shall_update_selection
	name = "SUI - power monitor actions shall update selection"

/datum/unit_test/sui_power_monitor_actions_shall_update_selection/start_test()
	var/datum/unit_test_sui_host/host = new()
	var/datum/nano_module/program/power_monitor/module = new(host, null, null)
	var/number_of_failures = 0

	module.sui_act("select_sensor", list("sensor" = "Grid-A"), null)
	if(module.active_sensor != "Grid-A")
		log_bad("Expected power monitor to store selected sensor.")
		number_of_failures++

	module.sui_act("clear", list(), null)
	if(!isnull(module.active_sensor))
		log_bad("Expected power monitor clear action to reset active sensor.")
		number_of_failures++

	qdel(module)
	qdel(host)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_supermatter_monitor_actions_shall_switch_screen
	name = "SUI - supermatter monitor actions shall switch screens"

/datum/unit_test/sui_supermatter_monitor_actions_shall_switch_screen/start_test()
	var/datum/unit_test_sui_host/host = new()
	var/datum/nano_module/program/supermatter_monitor/module = new(host, null, null)
	var/number_of_failures = 0

	module.sui_act("screen", list("screen" = SM_MONITOR_SCREEN_THRESHHOLDS), null)
	if(module.screen != SM_MONITOR_SCREEN_THRESHHOLDS)
		log_bad("Expected supermatter monitor to switch to threshholds screen.")
		number_of_failures++

	module.sui_act("clear", list(), null)
	if(module.screen != SM_MONITOR_SCREEN_MAIN)
		log_bad("Expected clear action to restore main screen.")
		number_of_failures++

	qdel(module)
	qdel(host)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/unit_test/sui_crew_monitor_actions_shall_drive_map_state
	name = "SUI - crew monitor actions shall drive map state"

/datum/unit_test/sui_crew_monitor_actions_shall_drive_map_state/start_test()
	var/datum/unit_test_sui_host/host = new()
	var/datum/nano_module/program/crew_monitor/module = new(host, null, null)
	var/datum/sui/unit_test_sui_mock/ui = new(null, module, "CrewMonitor", "Crew Monitor")
	var/number_of_failures = 0

	module.sui_act("set_map_z", list("z_level" = "2"), ui)
	if(module.map_z_level != 2)
		log_bad("Expected crew monitor map z-level to update to 2.")
		number_of_failures++
	if(!ui.last_map_state || ui.last_map_z != 2)
		log_bad("Expected crew monitor to request visible map at z-level 2.")
		number_of_failures++

	module.sui_act("toggle_map", list(), ui)
	if(module.map_enabled)
		log_bad("Expected crew monitor toggle_map action to disable the map.")
		number_of_failures++
	if(ui.last_map_state)
		log_bad("Expected crew monitor to hide the map after toggle.")
		number_of_failures++

	qdel(ui)
	qdel(module)
	qdel(host)

	if(number_of_failures)
		fail("[number_of_failures] failed assertion\s.")
	else
		pass("All assertions passed.")
	return TRUE

/datum/sui/unit_test_status_probe
	var/config_update_calls = 0
	var/close_calls = 0

/datum/sui/unit_test_status_probe/send_config_update()
	config_update_calls++
	return

/datum/sui/unit_test_status_probe/close()
	close_calls++
	is_open = FALSE
	is_closing = TRUE
	return
