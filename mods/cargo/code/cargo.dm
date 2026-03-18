#define SUPPLY_LIST_ID_CART 1
#define SUPPLY_LIST_ID_REQUEST 2
#define SUPPLY_LIST_ID_DONE 3
#define CARGO_POINT_TO_THALLER 15	// Если кому то когда то захочется поменять курс таллера, менять тут, и в mods\cargo\code\cargo_controller.dm

/datum/supply_order
	var/accountnubmer = null //аккаунт, с которого списали деньги
	var/payer = null
	var/sum_money = 0 //сумма, списанная с аккаунта

/datum/nano_module/program/supply
	sui_interface_name = "SupplyManagement"
	sui_width = 1080
	sui_height = 800
	var/card_inserted
	var/card_use = FALSE
	var/datum/money_account/custom_account
	var/money
	var/datum/extension/interactive/ntos/os
	var/obj/item/stock_parts/computer/card_slot/card_slot

/datum/nano_module/program/supply/print_order(datum/supply_order/O, mob/user)
	if(!O)
		return

	var/t = ""
	t += "<h3>[GLOB.using_map.station_name] Supply Requisition Reciept</h3><hr>"
	t += "INDEX: #[O.ordernum]<br>"
	t += "TIME: [O.timestamp]<br>"
	t += "REQUESTED BY: [O.orderedby]<br>"
	t += "PAID BY: [O.payer]<br>"
	t += "RANK: [O.orderedrank]<br>"
	t += "REASON: [O.reason]<br>"
	t += "SUPPLY CRATE TYPE: [O.object.name]<br>"
	t += "ACCESS RESTRICTION: [get_access_desc(O.object.access)]<br>"
	t += "CONTENTS:<br>"
	t += O.object.manifest
	t += "<hr>"
	print_text(t, user)


/datum/nano_module/program/supply/proc/build_supply_data(mob/user)
	var/list/data = host.initial_data(program)
	var/is_admin = emagged || check_access(user, admin_access) || istype(user, /mob/living/silicon/ai)
	var/singleton/security_state/security_state = GET_SINGLETON(GLOB.using_map.security_state)
	if(!LAZYLEN(category_names) || !LAZYLEN(category_contents) || current_security_level != security_state.current_security_level || emagged_memory != emagged )
		generate_categories()
		current_security_level = security_state.current_security_level
		emagged_memory = emagged

	data["is_admin"] = is_admin
	if(is_admin)
		data["shopping_cart_length"] = length(SSsupply.shoppinglist)
		data["request_length"] = length(SSsupply.requestlist)
	data["screen"] = screen
	data["credits"] = "[department_accounts["Снабжения"].money]"
	data["currency"] = GLOB.using_map.local_currency_name
	data["currency_short"] = GLOB.using_map.local_currency_name_short
	os = get_extension(nano_host(), /datum/extension/interactive/ntos)
	if(os)
		card_slot = os.get_component(PART_CARD)
	card_inserted = FALSE
	if(card_slot)
		if(card_slot.stored_card)
			card_inserted = TRUE
			custom_account = get_account(card_slot.stored_card.associated_account_number)
			if(custom_account)
				money = custom_account.money
				data["money"] = "[money]"
				data["card_use"] = card_use


	data["card_inserted"] = card_inserted
	switch(screen)
		if(1)// Main ordering menu
			data["categories"] = category_names
			if(selected_category)
				data["category"] = selected_category
				data["possible_purchases"] = category_contents[selected_category]
				if(showing_contents_of_ref)
					data["showing_contents_of"] = showing_contents_of_ref
					data["contents_of_order"] = contents_of_order

		if(2)// Statistics screen with credit overview
			var/list/point_breakdown = list()
			for(var/tag in SSsupply.point_source_descriptions)
				var/entry = list()
				entry["desc"] = SSsupply.point_source_descriptions[tag]
				entry["points"] = SSsupply.point_sources[tag] || 0
				point_breakdown += list(entry) //Make a list of lists, don't flatten
			data["point_breakdown"] = point_breakdown
			data["can_print"] = can_print()

		if(3)// Shuttle monitoring and control
			var/datum/shuttle/autodock/ferry/supply/shuttle = SSsupply.shuttle
			data["shuttle_name"] = shuttle.name
			if(istype(shuttle))
				data["shuttle_location"] = shuttle.at_station() ? GLOB.using_map.name : "Remote location"
			else
				data["shuttle_location"] = "No Connection"
			data["shuttle_status"] = get_shuttle_status()
			data["shuttle_can_control"] = shuttle.can_launch()


		if(4)// Order processing
			if(is_admin) // No bother sending all of this if the user can't see it.
				var/list/cart[0]
				var/list/requests[0]
				var/list/done[0]
				for(var/datum/supply_order/SO in SSsupply.shoppinglist)
					cart.Add(order_to_nanoui(SO, SUPPLY_LIST_ID_CART))
				for(var/datum/supply_order/SO in SSsupply.requestlist)
					requests.Add(order_to_nanoui(SO, SUPPLY_LIST_ID_REQUEST))
				for(var/datum/supply_order/SO in SSsupply.donelist)
					done.Add(order_to_nanoui(SO, SUPPLY_LIST_ID_DONE))
				data["cart"] = cart
				data["requests"] = requests
				data["done"] = done
				data["can_print"] = can_print()
				data["is_NTOS"] = istype(nano_host(), /obj/item/modular_computer) // Can we even use notifications?
				data["notifications_enabled"] = notifications_enabled
	return data

/datum/nano_module/program/supply/proc/handle_supply_action(action, list/params, mob/user)
	params = params || list()
	switch(action)
		if("use_card")
			if(card_slot && card_slot.stored_card)
				custom_account = get_account(card_slot.stored_card.associated_account_number)
				if(custom_account && custom_account.suspended)
					to_chat(user, SPAN_WARNING("Card is invalid or suspended."))
					card_use = FALSE
					return TOPIC_HANDLED
				card_use = !card_use
			return TOPIC_HANDLED
		if("select_category")
			clear_order_contents()
			selected_category = params["category"] || params["select_category"]
			screen = 1
			return TOPIC_HANDLED
		if("set_screen")
			clear_order_contents()
			screen = text2num(params["screen"] || params["set_screen"])
			return TOPIC_HANDLED
		if("show_contents")
			generate_order_contents(params["ref"] || params["show_contents"])
			return TOPIC_HANDLED
		if("hide_contents")
			clear_order_contents()
			return TOPIC_HANDLED
		if("order")
			clear_order_contents()
			var/singleton/hierarchy/supply_pack/P = locate(params["ref"] || params["order"]) in SSsupply.master_supply_list
			if(!istype(P) || (P.hidden && !emagged))
				return TOPIC_HANDLED

			var/reason = sanitize(input(user,"Reason:","Why do you require this item?","") as null|text,,0)
			if(!reason)
				return TOPIC_HANDLED

			var/idname = "*None Provided*"
			var/idrank = "*None Provided*"
			if(ishuman(user))
				if(!card_use)
					var/mob/living/carbon/human/H = user
					idname = H.get_authentification_name()
					idrank = H.get_assignment()
				else
					idname = card_slot.stored_card.registered_name
					idrank = card_slot.stored_card.assignment
			else if(issilicon(user))
				idname = user.real_name

			SSsupply.ordernum++
			var/datum/supply_order/O = new /datum/supply_order()
			O.ordernum = SSsupply.ordernum
			O.timestamp = stationtime2text()
			O.object = P
			O.orderedby = idname
			O.reason = reason
			O.orderedrank = idrank
			O.comment = "#[O.ordernum]"
			O.accountnubmer = department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"]
			O.sum_money = P.cost * CARGO_POINT_TO_THALLER
			O.payer = "None Provided"
			if(card_use)
				custom_account = get_account(card_slot.stored_card.associated_account_number)
				if(!custom_account || custom_account.suspended)
					to_chat(user, SPAN_WARNING("Card is invalid or suspended."))
					return TOPIC_HANDLED
				if(custom_account.money < O.sum_money)
					to_chat(user, SPAN_WARNING("Not enough funds to purchase \the [P.name]!"))
					return TOPIC_HANDLED
				custom_account.transfer(department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"], O.sum_money , "Order of [P.name]. Order number [O.ordernum]")
				O.accountnubmer = custom_account
				O.payer = card_slot.stored_card.registered_name

			SSsupply.requestlist += O
			if(can_print() && alert(user, "Would you like to print a confirmation receipt?", "Print receipt?", "Yes", "No") == "Yes")
				print_order(O, user)
			return TOPIC_HANDLED
		if("print_summary")
			if(can_print())
				print_summary(user)
			return TOPIC_HANDLED

	if(!check_access(access_cargo))
		return TOPIC_HANDLED

	switch(action)
		if("launch_shuttle")
			var/datum/shuttle/autodock/ferry/supply/shuttle = SSsupply.shuttle
			if(!shuttle)
				to_chat(user, SPAN_WARNING("Error connecting to the shuttle."))
				return TOPIC_HANDLED
			if(shuttle.at_station())
				if (shuttle.forbidden_atoms_check())
					to_chat(usr, SPAN_WARNING("For safety reasons the automated supply shuttle cannot transport live organisms, classified nuclear weaponry or homing beacons."))
				else
					shuttle.launch(user)
			else
				shuttle.launch(user)
				var/datum/radio_frequency/frequency = radio_controller.return_frequency(1435)
				if(frequency)
					var/datum/signal/status_signal = new
					status_signal.source = src
					status_signal.transmission_method = 1
					status_signal.data["command"] = "supply"
					frequency.post_signal(src, status_signal)
			return TOPIC_HANDLED
		if("approve_order")
			var/approve_id = text2num(params["id"] || params["approve_order"])
			var/datum/supply_order/approved = find_order_by_id(approve_id, SSsupply.requestlist)
			if(approved)
				if(approved.object.cost >= department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"].money)
					to_chat(usr, SPAN_WARNING("Not enough points to purchase \the [approved.object.name]!"))
				else
					SSsupply.requestlist -= approved
					SSsupply.shoppinglist += approved
					department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"].money -= approved.object.cost * CARGO_POINT_TO_THALLER
			else
				to_chat(user, SPAN_WARNING("Could not find order number [approve_id] to approve."))
			return TOPIC_HANDLED
		if("order_back_to_pending")
			var/pending_id = text2num(params["id"] || params["order_back_to_pending"])
			var/datum/supply_order/pending = find_order_by_id(pending_id, SSsupply.shoppinglist)
			if(pending)
				SSsupply.requestlist += pending
				SSsupply.shoppinglist -= pending
				department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"].money += pending.object.cost * CARGO_POINT_TO_THALLER
			else
				to_chat(user, SPAN_WARNING("Could not find order number [pending_id] to move back to pending."))
			return TOPIC_HANDLED
		if("deny_order")
			var/deny_id = text2num(params["id"] || params["deny_order"])
			var/datum/supply_order/denied = find_order_by_id(deny_id, SSsupply.requestlist)
			if(alert(user, "Are you sure?", "Deny Order", "Yes", "No") != "Yes")
				return TOPIC_HANDLED
			if(denied)
				SSsupply.requestlist -= denied
				department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"].transfer(denied.accountnubmer, denied.sum_money , "Deny of order [denied.ordernum]")
			else
				to_chat(user, SPAN_WARNING("Could not find order number [deny_id] to deny."))
			return TOPIC_HANDLED
		if("cancel_order")
			var/cancel_id = text2num(params["id"] || params["cancel_order"])
			var/datum/supply_order/cancelled = find_order_by_id(cancel_id, SSsupply.shoppinglist)
			if(alert(user, "Are you sure?", "Cancel Order", "Yes", "No") != "Yes")
				return TOPIC_HANDLED
			if(cancelled)
				SSsupply.shoppinglist -= cancelled
				department_accounts["РЎРЅР°Р±Р¶РµРЅРёСЏ"].money += cancelled.object.cost * CARGO_POINT_TO_THALLER
			else
				to_chat(user, SPAN_WARNING("Could not find order number [cancel_id] to cancel."))
			return TOPIC_HANDLED
		if("delete_order")
			var/delete_id = text2num(params["id"] || params["delete_order"])
			var/datum/supply_order/deleted = find_order_by_id(delete_id, SSsupply.donelist)
			if(alert(user, "Are you sure?", "Delete Order", "Yes", "No") != "Yes")
				return TOPIC_HANDLED
			if(deleted)
				SSsupply.donelist -= deleted
			else
				to_chat(user, SPAN_WARNING("Could not find order number [delete_id] to delete."))
			return TOPIC_HANDLED
		if("print_receipt")
			if(!can_print())
				to_chat(user, SPAN_WARNING("No printer connected to print receipts."))
				return TOPIC_HANDLED
			var/receipt_id = text2num(params["id"] || params["print_receipt"])
			var/list_id = text2num(params["list_id"])
			var/list/list_to_search
			switch(list_id)
				if(SUPPLY_LIST_ID_CART)
					list_to_search = SSsupply.shoppinglist
				if(SUPPLY_LIST_ID_REQUEST)
					list_to_search = SSsupply.requestlist
				if(SUPPLY_LIST_ID_DONE)
					list_to_search = SSsupply.donelist
				else
					to_chat(user, SPAN_WARNING("Invalid list ID for order number [receipt_id]. Receipt not printed."))
					return TOPIC_HANDLED
			var/datum/supply_order/receipt = find_order_by_id(receipt_id, list_to_search)
			if(receipt)
				print_order(receipt, user)
			else
				to_chat(user, SPAN_WARNING("Could not find order number [receipt_id] to print receipt."))
			return TOPIC_HANDLED
		if("toggle_notifications")
			notifications_enabled = !notifications_enabled
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/nano_module/program/supply/sui_data(mob/user)
	return build_supply_data(user)

/datum/nano_module/program/supply/sui_act(action, list/params, datum/sui/ui)
	var/mob/user = ui ? ui.user : null
	return handle_supply_action(action, params, user) != TOPIC_NOACTION

/datum/nano_module/program/supply/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, state = GLOB.default_state)
	var/list/data = build_supply_data(user)

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "mods-supply.tmpl", name, 1050, 800, state = state)
		ui.set_auto_update(1)
		ui.set_initial_data(data)
		ui.open()

/datum/nano_module/program/supply/Topic(href, href_list)
	var/mob/user = usr
	if(..())
		return 1
	if(href_list["use_card"])
		return handle_supply_action("use_card", href_list, user)
	if(href_list["select_category"])
		return handle_supply_action("select_category", href_list, user)
	if(href_list["set_screen"])
		return handle_supply_action("set_screen", href_list, user)
	if(href_list["show_contents"])
		return handle_supply_action("show_contents", href_list, user)
	if(href_list["hide_contents"])
		return handle_supply_action("hide_contents", href_list, user)
	if(href_list["order"])
		return handle_supply_action("order", href_list, user)
	if(href_list["print_summary"])
		return handle_supply_action("print_summary", href_list, user)
	if(href_list["launch_shuttle"])
		return handle_supply_action("launch_shuttle", href_list, user)
	if(href_list["approve_order"])
		return handle_supply_action("approve_order", href_list, user)
	if(href_list["order_back_to_pending"])
		return handle_supply_action("order_back_to_pending", href_list, user)
	if(href_list["deny_order"])
		return handle_supply_action("deny_order", href_list, user)
	if(href_list["cancel_order"])
		return handle_supply_action("cancel_order", href_list, user)
	if(href_list["delete_order"])
		return handle_supply_action("delete_order", href_list, user)
	if(href_list["print_receipt"])
		return handle_supply_action("print_receipt", href_list, user)
	if(href_list["toggle_notifications"])
		return handle_supply_action("toggle_notifications", href_list, user)

	if(href_list["use_card"])
		if(card_slot.stored_card)
			custom_account = get_account(card_slot.stored_card.associated_account_number)
			if(custom_account && custom_account.suspended)
				to_chat(user, SPAN_WARNING("Card is invalid or suspended."))
				card_use = FALSE
				return
			card_use = !card_use


	if(href_list["select_category"])
		clear_order_contents()
		selected_category = href_list["select_category"]
		return 1

	if(href_list["set_screen"])
		clear_order_contents()
		screen = text2num(href_list["set_screen"])
		return 1

	if(href_list["show_contents"])
		generate_order_contents(href_list["show_contents"])

	if(href_list["hide_contents"])
		clear_order_contents()

	if(href_list["order"])
		clear_order_contents()
		var/singleton/hierarchy/supply_pack/P = locate(href_list["order"]) in SSsupply.master_supply_list
		if(!istype(P))
			return 1

		if(P.hidden && !emagged)
			return 1

		var/reason = sanitize(input(user,"Reason:","Why do you require this item?","") as null|text,,0)
		if(!reason)
			return 1

		var/idname = "*None Provided*"
		var/idrank = "*None Provided*"
		if(ishuman(user))
			if(!card_use)
				var/mob/living/carbon/human/H = user
				idname = H.get_authentification_name()
				idrank = H.get_assignment()
			else
				idname = card_slot.stored_card.registered_name
				idrank = card_slot.stored_card.assignment
		else if(issilicon(user))
			idname = user.real_name

		SSsupply.ordernum++

		var/datum/supply_order/O = new /datum/supply_order()
		O.ordernum = SSsupply.ordernum
		O.timestamp = stationtime2text()
		O.object = P
		O.orderedby = idname
		O.reason = reason
		O.orderedrank = idrank
		O.comment = "#[O.ordernum]"
		O.accountnubmer = department_accounts["Снабжения"]
		O.sum_money = P.cost * CARGO_POINT_TO_THALLER
		O.payer = "None Provided"
		if(card_use)
			custom_account = get_account(card_slot.stored_card.associated_account_number)
			if(!custom_account || custom_account.suspended)
				to_chat(user, SPAN_WARNING("Card is invalid or suspended."))
				return
			if(custom_account.money < O.sum_money)
				to_chat(user, SPAN_WARNING("Not enough funds to purchase \the [P.name]!"))
				return
			custom_account.transfer(department_accounts["Снабжения"], O.sum_money , "Order of [P.name]. Order number [O.ordernum]")
			O.accountnubmer = custom_account
			O.payer = card_slot.stored_card.registered_name


		SSsupply.requestlist += O

		if(can_print() && alert(user, "Would you like to print a confirmation receipt?", "Print receipt?", "Yes", "No") == "Yes")
			print_order(O, user)
		return 1

	if(href_list["print_summary"])
		if(!can_print())
			return
		print_summary(user)

	// Items requiring cargo access go below this entry. Other items go above.
	if(!check_access(access_cargo))
		return 1

	if(href_list["launch_shuttle"])
		var/datum/shuttle/autodock/ferry/supply/shuttle = SSsupply.shuttle
		if(!shuttle)
			to_chat(user, SPAN_WARNING("Error connecting to the shuttle."))
			return
		if(shuttle.at_station())
			if (shuttle.forbidden_atoms_check())
				to_chat(usr, SPAN_WARNING("For safety reasons the automated supply shuttle cannot transport live organisms, classified nuclear weaponry or homing beacons."))
			else
				shuttle.launch(user)
		else
			shuttle.launch(user)
			var/datum/radio_frequency/frequency = radio_controller.return_frequency(1435)
			if(!frequency)
				return

			var/datum/signal/status_signal = new
			status_signal.source = src
			status_signal.transmission_method = 1
			status_signal.data["command"] = "supply"
			frequency.post_signal(src, status_signal)
		return 1

	if(href_list["approve_order"])
		var/id = text2num(href_list["approve_order"])
		var/datum/supply_order/SO = find_order_by_id(id, SSsupply.requestlist)
		if(SO)
			if(SO.object.cost >= department_accounts["Снабжения"].money)
				to_chat(usr, SPAN_WARNING("Not enough points to purchase \the [SO.object.name]!"))
			else
				SSsupply.requestlist -= SO
				SSsupply.shoppinglist += SO
				department_accounts["Снабжения"].money -= SO.object.cost * CARGO_POINT_TO_THALLER

		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to approve."))

		return 1

	if(href_list["order_back_to_pending"])
		var/id = text2num(href_list["order_back_to_pending"])
		var/datum/supply_order/SO = find_order_by_id(id, SSsupply.shoppinglist)
		if(SO)
			SSsupply.requestlist += SO
			SSsupply.shoppinglist -= SO
			department_accounts["Снабжения"].money += SO.object.cost * CARGO_POINT_TO_THALLER

		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to move back to pending."))

		return 1

	if(href_list["deny_order"])
		var/id = text2num(href_list["deny_order"])
		var/datum/supply_order/SO = find_order_by_id(id, SSsupply.requestlist)
		if(alert(user, "Are you sure?", "Deny Order", "Yes", "No") != "Yes")
			return 1
		if(SO)
			SSsupply.requestlist -= SO
			department_accounts["Снабжения"].transfer(SO.accountnubmer, SO.sum_money , "Deny of order [SO.ordernum]")
		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to deny."))

		return 1

	if(href_list["cancel_order"])
		var/id = text2num(href_list["cancel_order"])
		var/datum/supply_order/SO = find_order_by_id(id, SSsupply.shoppinglist)
		if(alert(user, "Are you sure?", "Cancel Order", "Yes", "No") != "Yes")
			return 1
		if(SO)
			SSsupply.shoppinglist -= SO
			department_accounts["Снабжения"].money += SO.object.cost * CARGO_POINT_TO_THALLER
		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to cancel."))

		return 1

	if(href_list["delete_order"])
		var/id = text2num(href_list["delete_order"])
		var/datum/supply_order/SO = find_order_by_id(id, SSsupply.donelist)
		if(alert(user, "Are you sure?", "Delete Order", "Yes", "No") != "Yes")
			return 1
		if(SO)
			SSsupply.donelist -= SO
		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to delete."))

		return 1

	if(href_list["print_receipt"])
		if(!can_print())
			to_chat(user, SPAN_WARNING("No printer connected to print receipts."))
			return 1

		var/id = text2num(href_list["print_receipt"])
		var/list_id = text2num(href_list["list_id"])
		var/list/list_to_search
		switch(list_id)
			if(SUPPLY_LIST_ID_CART)
				list_to_search = SSsupply.shoppinglist
			if(SUPPLY_LIST_ID_REQUEST)
				list_to_search = SSsupply.requestlist
			if(SUPPLY_LIST_ID_DONE)
				list_to_search = SSsupply.donelist
			else
				to_chat(user, SPAN_WARNING("Invalid list ID for order number [id]. Receipt not printed."))
				return 1

		var/datum/supply_order/SO = find_order_by_id(id, list_to_search)
		if(SO)
			print_order(SO, user)
		else
			to_chat(user, SPAN_WARNING("Could not find order number [id] to print receipt."))

		return 1

	if(href_list["toggle_notifications"])
		notifications_enabled = !notifications_enabled
		return 1


/datum/nano_module/program/supply/generate_categories()
	category_names.Cut()
	category_contents.Cut()
	var/singleton/hierarchy/supply_pack/root = GET_SINGLETON(/singleton/hierarchy/supply_pack)
	for(var/singleton/hierarchy/supply_pack/sp in root.children)
		if(!sp.is_category())
			continue // No children
		category_names.Add(sp.name)
		var/list/category[0]
		for(var/singleton/hierarchy/supply_pack/spc in sp.get_descendents())
			if((spc.hidden || spc.contraband || !spc.sec_available()) && !emagged)
				continue
			category.Add(list(list(
				"name" = spc.name,
				"cost" = spc.cost * CARGO_POINT_TO_THALLER,
				"ref" = "\ref[spc]"
			)))
		category_contents[sp.name] = category



/datum/nano_module/program/supply/order_to_nanoui(datum/supply_order/SO, list_id)
	return list(list(
		"id" = SO.ordernum,
		"time" = SO.timestamp,
		"object" = SO.object.name,
		"orderer" = SO.orderedby,
		"cost" = SO.object.cost * CARGO_POINT_TO_THALLER,
		"payer" = SO.payer,
		"reason" = SO.reason,
		"list_id" = list_id
		))

#undef CARGO_POINT_TO_THALLER
#undef SUPPLY_LIST_ID_CART
#undef SUPPLY_LIST_ID_REQUEST
#undef SUPPLY_LIST_ID_DONE
