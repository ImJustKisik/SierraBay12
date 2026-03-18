/datum/computer_file/program/chatclient
	filename = "ntnrc_client"
	filedesc = "NTNet Relay Chat Client"
	program_icon_state = "command"
	program_key_state = "med_key"
	program_menu_icon = "comment"
	extended_desc = "This program allows communication over NTNRC network"
	size = 2
	processing_size = 0
	requires_ntnet = TRUE
	requires_ntnet_feature = NTNET_COMMUNICATION
	network_destination = "NTNRC server"
	ui_header = "ntnrc_idle.gif"
	available_on_ntnet = TRUE
	nanomodule_path = /datum/nano_module/program/computer_chatclient
	/// Used to generate the toolbar icon
	var/last_message = null
	var/username
	var/datum/ntnet_conversation/channel = null
	/// Channel operator mode
	var/operator_mode = FALSE
	/// Administrator mode (invisible to other users + bypasses passwords)
	var/netadmin_mode = FALSE
	/// Mutes notifications
	var/muted = FALSE
	usage_flags = PROGRAM_ALL

/datum/computer_file/program/chatclient/New()
	username = "DefaultUser[rand(100, 999)]"

/datum/computer_file/program/chatclient/proc/send_chat_message(message)
	if(!channel)
		return TOPIC_HANDLED
	message = sanitize(message, 512)
	if(!message || !length(message) || !channel)
		return TOPIC_HANDLED
	channel.add_message(message, username)
	ntnrc_alert("[username] sent an NTNRC message.")
	return TOPIC_HANDLED

/datum/computer_file/program/chatclient/proc/handle_chat_action(action, list/params, mob/user)
	params = params || list()
	switch(action)
		if("speak")
			if(!channel)
				return TOPIC_HANDLED
			var/message = sanitize(input(user, "Enter message or leave blank to cancel: "), 512)
			return send_chat_message(message)
		if("send_text")
			return send_chat_message(params["message"])
		if("join_channel")
			var/datum/ntnet_conversation/C
			for(var/datum/ntnet_conversation/chan in ntnet_global.chat_channels)
				if(chan.id == text2num(params["id"]))
					C = chan
					break
			if(!C)
				return TOPIC_HANDLED
			if(channel && channel != C)
				channel.remove_client(src)
				ntnrc_alert("A user has left your channel.")
				channel = null
			if(netadmin_mode)
				channel = C
				return TOPIC_HANDLED
			if(C.password)
				var/password = sanitize(input(user,"Access Denied. Enter password:"))
				if(C && (password == C.password))
					C.add_client(src)
					channel = C
					ntnrc_alert("A user has joined your channel.")
				return TOPIC_HANDLED
			C.add_client(src)
			channel = C
			ntnrc_alert("A user has joined your channel.")
			return TOPIC_HANDLED
		if("leave_channel")
			if(channel)
				channel.remove_client(src)
				ntnrc_alert("A user has left your channel.")
			channel = null
			return TOPIC_HANDLED
		if("new_channel")
			var/channel_title = sanitizeSafe(input(user,"Enter channel name or leave blank to cancel:"), 64)
			if(!channel_title)
				return TOPIC_HANDLED
			var/turf/turf = get_turf(computer.get_physical_host())
			var/datum/ntnet_conversation/conversation = new/datum/ntnet_conversation(turf.z)
			conversation.add_client(src)
			conversation.operator = src
			channel = conversation
			conversation.title = channel_title
			return TOPIC_HANDLED
		if("toggle_admin")
			if(netadmin_mode)
				netadmin_mode = FALSE
				if(channel)
					channel.remove_client(src)
					channel = null
				return TOPIC_HANDLED
			if(can_run(user, TRUE, access_network_admin))
				if(channel)
					var/response = alert(user, "Really engage admin-mode? You will be disconnected from your current channel!", "NTNRC Admin mode", "Yes", "No")
					if(response == "Yes")
						if(channel)
							channel.remove_client(src)
							ntnrc_alert("A user has left your channel.")
							channel = null
					else
						return TOPIC_HANDLED
				netadmin_mode = TRUE
			return TOPIC_HANDLED
		if("change_name")
			var/newname = sanitize(input(user,"Enter new nickname or leave blank to cancel:"), 20)
			if(!newname)
				return TOPIC_HANDLED
			if(channel)
				channel.add_status_message("[username] is now known as [newname].")
			username = newname
			return TOPIC_HANDLED
		if("toggle_notifications")
			muted = !muted
			if(muted)
				computer.visible_notification(SPAN_NOTICE("Channel notifications have been disabled."))
			else
				computer.visible_notification(SPAN_NOTICE("Channel notifications have been enabled."))
			return TOPIC_HANDLED
		if("save_log")
			if(!channel)
				return TOPIC_HANDLED
			var/filename = input(user,"Enter desired logfile name (.LOG) or leave blank to cancel:")
			if(!filename || !channel)
				return TOPIC_HANDLED
			var/content = "\[b\]Logfile dump from NTNRC channel [channel.title]\[/b\]\[BR\]"
			for(var/logstring in channel.messages)
				content += "[logstring]\[BR\]"
			content += "\[b\]Logfile dump completed.\[/b\]"
			if(!computer.create_data_file(filename, content, /datum/computer_file/data/logfile))
				computer.show_error(user, "I/O Error - Check hard drive and free space.")
			return TOPIC_HANDLED
		if("rename_channel")
			if(!operator_mode || !channel)
				return TOPIC_HANDLED
			var/newname = sanitize(input(user, "Enter new channel name or leave blank to cancel:"), 64)
			if(!newname || !channel)
				return TOPIC_HANDLED
			channel.add_status_message("Channel renamed from [channel.title] to [newname] by operator.")
			channel.title = newname
			return TOPIC_HANDLED
		if("delete_channel")
			if(channel && ((channel.operator == src) || netadmin_mode))
				if(ntnet_global)
					ntnet_global.chat_channels.Remove(channel)
				qdel(channel)
				channel = null
			return TOPIC_HANDLED
		if("set_password")
			if(!channel || ((channel.operator != src) && !netadmin_mode))
				return TOPIC_HANDLED
			var/newpassword = sanitize(input(user, "Enter new password for this channel. Leave blank to cancel, enter 'nopassword' to remove password completely:"))
			if(!channel || !newpassword || ((channel.operator != src) && !netadmin_mode))
				return TOPIC_HANDLED
			if(newpassword == "nopassword")
				channel.password = ""
			else
				channel.password = newpassword
			return TOPIC_HANDLED
	return TOPIC_NOACTION

/datum/computer_file/program/chatclient/Topic(href, href_list)
	if(..())
		return TOPIC_HANDLED

	if(href_list["PRG_speak"])
		return handle_chat_action("speak", null, usr)

	if(href_list["PRG_joinchannel"])
		return handle_chat_action("join_channel", list("id" = href_list["PRG_joinchannel"]), usr)
	if(href_list["PRG_leavechannel"])
		return handle_chat_action("leave_channel", null, usr)
	if(href_list["PRG_newchannel"])
		return handle_chat_action("new_channel", null, usr)
	if(href_list["PRG_toggleadmin"])
		return handle_chat_action("toggle_admin", null, usr)
	if(href_list["PRG_changename"])
		return handle_chat_action("change_name", null, usr)

	if (href_list["PRG_mutenotif"])
		return handle_chat_action("toggle_notifications", null, usr)

	if(href_list["PRG_savelog"])
		return handle_chat_action("save_log", null, usr)
	if(href_list["PRG_renamechannel"])
		return handle_chat_action("rename_channel", null, usr)
	if(href_list["PRG_deletechannel"])
		return handle_chat_action("delete_channel", null, usr)
	if(href_list["PRG_setpassword"])
		return handle_chat_action("set_password", null, usr)

/datum/computer_file/program/chatclient/process_tick()
	..()
	var/turf/turf = get_turf(computer.get_physical_host())
	if (channel && !(channel.source_z in GetConnectedZlevels(turf.z)))
		channel.remove_client(src)
		ntnrc_alert("A user has left your channel.")
		channel = null

	if(program_state != PROGRAM_STATE_KILLED)
		ui_header = "ntnrc_idle.gif"
		if(channel)
			// Remember the last message. If there is no message in the channel remember null.
			last_message = length(channel.messages) ? channel.messages[length(channel.messages) - 1] : null
		else
			last_message = null
		return

	if(channel && channel.messages && length(channel.messages))
		ui_header = last_message == channel.messages[length(channel.messages) - 1] ? "ntnrc_idle.gif" : "ntnrc_new.gif"
	else
		ui_header = "ntnrc_idle.gif"

/datum/computer_file/program/chatclient/on_shutdown(forced = FALSE)
	if(channel)
		channel.remove_client(src)
		src.ntnrc_alert("A user has left your channel.")
		channel = null
	..(forced)

/datum/computer_file/program/chatclient/proc/ntnrc_alert(message)
	if (!istype(src))
		return
	for (var/datum/computer_file/program/chatclient/client in channel.clients)
		if (client == src || client.muted)
			continue
		client.computer.visible_notification(SPAN_NOTICE(message))
		client.computer.audible_notification("sound/machines/ping.ogg")

/datum/nano_module/program/computer_chatclient
	name = "NTNet Relay Chat Client"
	sui_interface_name = "NTNRCClient"
	sui_width = 575
	sui_height = 700

/datum/nano_module/program/computer_chatclient/proc/build_chatclient_data(mob/user)
	if(!ntnet_global || !ntnet_global.chat_channels)
		return null

	var/list/data = program ? program.get_header_data() : list()
	var/datum/computer_file/program/chatclient/C = program
	if(!istype(C))
		return null

	data["adminmode"] = C.netadmin_mode
	data["username"] = C.username
	data["muted"] = C.muted
	var/list/all_channels[0]
	var/turf/turf = get_turf(C.computer.get_physical_host())
	var/list/connected_zs = GetConnectedZlevels(turf.z)
	for(var/datum/ntnet_conversation/conv in ntnet_global.chat_channels)
		if(conv && conv.title && (conv.source_z in connected_zs))
			var/preview = ""
			var/message_count = length(conv.messages)
			if(message_count)
				preview = "[conv.messages[message_count]]"
			all_channels.Add(list(list(
				"chan" = conv.title,
				"id" = conv.id,
				"preview" = preview,
				"message_count" = message_count
			)))
	data["all_channels"] = all_channels
	if(C.channel)
		data["channel_id"] = C.channel.id
		data["title"] = C.channel.title
		var/list/messages[0]
		for(var/M in C.channel.messages)
			messages.Add(list(list(
				"msg" = M
			)))
		data["messages"] = messages
		var/list/clients[0]
		for(var/datum/computer_file/program/chatclient/cl in C.channel.clients)
			clients.Add(list(list(
				"name" = cl.username
			)))
		data["clients"] = clients
		C.operator_mode = (C.channel.operator == C) ? TRUE : FALSE
		data["is_operator"] = C.operator_mode || C.netadmin_mode
	return data

/datum/nano_module/program/computer_chatclient/sui_data(mob/user)
	return build_chatclient_data(user)

/datum/nano_module/program/computer_chatclient/sui_act(action, list/params, datum/sui/ui)
	var/datum/computer_file/program/chatclient/C = program
	var/mob/user = ui ? ui.user : null
	if(!istype(C))
		return FALSE
	return C.handle_chat_action(action, params, user) != TOPIC_NOACTION

/datum/nano_module/program/computer_chatclient/ui_interact(mob/user, ui_key = "main", datum/nanoui/ui = null, force_open = 1, datum/topic_state/state = GLOB.default_state)
	var/list/data = build_chatclient_data(user)
	if(isnull(data))
		return

	ui = SSnano.try_update_ui(user, src, ui_key, ui, data, force_open)
	if (!ui)
		ui = new(user, src, ui_key, "ntnet_chat.tmpl", "NTNet Relay Chat Client", 575, 700, state = state)
		ui.auto_update_layout = 1
		ui.set_initial_data(data)
		ui.open()
		ui.set_auto_update(1)
