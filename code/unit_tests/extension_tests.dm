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

/datum/sui/unit_test_sui_mock/close()
	close_count++
	is_open = FALSE
	return

/datum/sui/unit_test_sui_mock/Destroy()
	is_open = FALSE
	is_closing = TRUE
	return ..()
