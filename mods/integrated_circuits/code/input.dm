/obj/item/integrated_circuit/input/examiner
	outputs = list(
		"name"				 	= IC_PINTYPE_STRING,
		"description"			= IC_PINTYPE_STRING,
		"X"						= IC_PINTYPE_NUMBER,
		"Y"						= IC_PINTYPE_NUMBER,
		"distance"				= IC_PINTYPE_NUMBER,
		"max reagents"			= IC_PINTYPE_NUMBER,
		"amount of reagents"	= IC_PINTYPE_NUMBER,
		"density"				= IC_PINTYPE_BOOLEAN,
		"opacity"				= IC_PINTYPE_BOOLEAN,
		"occupied turf"			= IC_PINTYPE_REF,
		"object direction"		= IC_PINTYPE_DIR
		)

/obj/item/integrated_circuit/input/examiner/do_work()
	var/atom/H = get_pin_data_as_type(IC_INPUT, 1, /atom)
	var/turf/T = get_turf(src)

	if(!istype(H) || !(H in view(T)))
		activate_pin(3)
	else
		set_pin_data(IC_OUTPUT, 1, H.name)
		set_pin_data(IC_OUTPUT, 2, H.desc)
		set_pin_data(IC_OUTPUT, 3, H.x-T.x)
		set_pin_data(IC_OUTPUT, 4, H.y-T.y)
		set_pin_data(IC_OUTPUT, 5, sqrt((H.x-T.x)*(H.x-T.x)+ (H.y-T.y)*(H.y-T.y)))
		var/mr = 0
		var/tr = 0
		if(H.reagents)
			mr = H.reagents.maximum_volume
			tr = H.reagents.total_volume
		set_pin_data(IC_OUTPUT, 6, mr)
		set_pin_data(IC_OUTPUT, 7, tr)
		set_pin_data(IC_OUTPUT, 8, H.density)
		set_pin_data(IC_OUTPUT, 9, H.opacity)
		set_pin_data(IC_OUTPUT, 10, get_turf(H))
		set_pin_data(IC_OUTPUT, 11, H.dir)
		push_data()
		activate_pin(2)

/obj/item/integrated_circuit/input/list_pick
	name = "list pick"
	desc = "A touch screen with all the data you need to pick."
	icon_state = "screen"
	complexity = 3
	inputs = list("List" = IC_PINTYPE_LIST)
	outputs = list("Picked element" = IC_PINTYPE_ANY)
	activators = list("on pressed" = IC_PINTYPE_PULSE_OUT, "on picked" = IC_PINTYPE_PULSE_OUT)
	spawn_flags = IC_SPAWN_DEFAULT|IC_SPAWN_RESEARCH
	power_draw_per_use = 5

/obj/item/integrated_circuit/input/list_pick/get_topic_data(mob/user)
	return list("Press" = "list_pick=1")

/obj/item/integrated_circuit/input/list_pick/OnICTopic(href_list, user)
	if(href_list["list_pick"])
		activate_pin(1)
		var/list/input_list = get_pin_data(IC_INPUT, 1)
		if(length(input_list))
			var/pick_element = input("Choose an element.") as null|anything in input_list
			if(pick_element)
				if(get_dist(src, user) <= 1)
					set_pin_data(IC_OUTPUT, 1, pick_element)
					push_data()
					activate_pin(2)
				else
					to_chat(user, "<span class='notice'>You are not close enough for that!</span>")
		else
			to_chat(user, "<span class='notice'>There is no list to pick from!</span>")
		return IC_TOPIC_REFRESH

/obj/item/integrated_circuit/input/image_comparse
	name = "image comparsion scanner"
	desc = "A circuit with miniature camera attached to it."
	extended_desc = "On pulsing 'store' activator, circuit would remember the selected target, \
	on 'check' it will compare stored object with the selected target, trying to include into comparsion every detail on them.\
	When both objects are almost completely identical, both outputs will be ones. \
	(matching form - type check, match of details - icon_state check)."
	icon_state = "video_camera"
	complexity = 5
	inputs = list(
		"target" = IC_PINTYPE_REF
		)
	outputs = list(
		"stored object" = IC_PINTYPE_STRING,
		"matching form" = IC_PINTYPE_BOOLEAN,
		"match of details" = IC_PINTYPE_BOOLEAN
		)
	activators = list(
		"store" = IC_PINTYPE_PULSE_IN,
		"check" = IC_PINTYPE_PULSE_IN,
		"on checked" = IC_PINTYPE_PULSE_OUT,
		"on failure" = IC_PINTYPE_PULSE_OUT
		)
	spawn_flags = IC_SPAWN_RESEARCH
	power_draw_per_use = 80
	var/obj_type
	var/state

/obj/item/integrated_circuit/input/image_comparse/do_work(ord)
	switch(ord)
		if(1)
			var/atom/object = get_pin_data_as_type(IC_INPUT, 1, /atom)
			if(object)
				obj_type = object.type
				state = object.icon_state
				set_pin_data(IC_OUTPUT, 1, object.name)
				push_data()
		else
			var/atom/H = get_pin_data_as_type(IC_INPUT, 1, /atom)
			var/turf/T = get_turf(src)

			if(!istype(H) || !(H in view(T)))
				activate_pin(4)
			else
				if(!H || !obj_type)
					return

				if(H.type == obj_type)
					set_pin_data(IC_OUTPUT, 2, 1)

					if(H.icon_state == state)
						set_pin_data(IC_OUTPUT, 3, 1)
					else
						set_pin_data(IC_OUTPUT, 3, 0)

				else
					set_pin_data(IC_OUTPUT, 2, 0)
					set_pin_data(IC_OUTPUT, 3, 0)

				push_data()
				activate_pin(3)