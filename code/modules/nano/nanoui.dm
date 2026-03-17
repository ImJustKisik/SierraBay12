/**********************************************************
NANO UI FRAMEWORK

nanoui class (or whatever Byond calls classes)

nanoui is used to open and update nano browser uis
**********************************************************/

GLOBAL_VAR_AS(nanoui_use_sui_compat, FALSE)

/proc/nanoui_compat_skip_script(filename)
	switch(lowertext("[filename]"))
		if("libraries.min.js")
			return TRUE
		if("morphdom.min.js")
			return TRUE
		if("nano_utility.js")
			return TRUE
		if("nano_template.js")
			return TRUE
		if("nano_state_manager.js")
			return TRUE
		if("nano_state.js")
			return TRUE
		if("nano_state_default.js")
			return TRUE
		if("nano_base_callbacks.js")
			return TRUE
		if("nano_base_helpers.js")
			return TRUE
	return FALSE

/proc/nanoui_compat_skip_stylesheet(filename)
	switch(lowertext("[filename]"))
		if("shared.css")
			return TRUE
		if("icons.css")
			return TRUE
	return FALSE

/datum/nanoui
	// the user who opened this ui
	var/mob/user
	// the object this ui "belongs" to
	var/datum/src_object
	// the title of this ui
	var/title
	// the key of this ui, this is to allow multiple (different) uis for each src_object
	var/ui_key
	// window_id is used as the window name/identifier for browse and onclose
	var/window_id
	// the browser window width
	var/width = 0
	// the browser window height
	var/height = 0
	// whether to use extra logic when window closes
	var/on_close_logic = 1
	// an extra ref to use when the window is closed, usually null
	var/atom/ref = null
	// options for modifying window behaviour
	var/window_options = "focus=0;can_close=1;can_minimize=1;can_maximize=0;can_resize=1;titlebar=1;" // window option is set using window_id
	// the list of stylesheets to apply to this ui
	var/list/stylesheets = list()
	// the list of javascript scripts to use for this ui
	var/list/scripts = list()
	// a list of templates which can be used with this ui
	var/templates[0]
	// the layout key for this ui (this is used on the frontend, leave it as "default" unless you know what you're doing)
	var/layout_key = "default"
	// optional layout key for additional ui header content to include
	var/layout_header_key = "default_header"
	// this sets whether to re-render the ui layout with each update (default 0, turning on will break the map ui if it's in use)
	var/auto_update_layout = 0
	// this sets whether to re-render the ui content with each update (default 1)
	var/auto_update_content = 1
	// the default state to use for this ui (this is used on the frontend, leave it as "default" unless you know what you're doing)
	var/state_key = "default"
	// show the map ui, this is used by the default layout
	var/show_map = 0
	// the map z level to display
	var/map_z_level = 1
	// initial data, containing the full data structure, must be sent to the ui (the data structure cannot be extended later on)
	var/list/initial_data[0]
	// set to 1 to update the ui automatically every master_controller tick
	var/is_auto_updating = 0
	// the current status/visibility of the ui
	var/status = STATUS_INTERACTIVE
	// opt-in path for the asset registry v2
	var/use_asset_v2 = FALSE

	// Relationship between a master interface and its children. Used in update_status
	var/datum/nanoui/master_ui
	var/list/datum/nanoui/children = list()
	var/datum/topic_state/state = null
	// Internal SUI bridge used when NanoUI compatibility mode is enabled.
	var/datum/sui/nanocompat/compat_ui
	var/compat_revision = 0
	var/list/compat_last_data = null

 /**
  * Create a new nanoui instance.
  *
  * @param nuser /mob The mob who has opened/owns this ui
  * @param nsrc_object /obj|/mob The obj or mob which this ui belongs to
  * @param nui_key string A string key to use for this ui. Allows for multiple unique uis on one src_oject
  * @param ntemplate string The filename of the template file from /nano/templates (e.g. "my_template.tmpl")
  * @param ntitle string The title of this ui
  * @param nwidth int the width of the ui window
  * @param nheight int the height of the ui window
  * @param nref /atom A custom ref to use if "on_close_logic" is set to 1
  *
  * @return /nanoui new nanoui object
  */
/datum/nanoui/New(nuser, nsrc_object, nui_key, ntemplate_filename, ntitle = 0, nwidth = 0, nheight = 0, atom/nref = null, datum/nanoui/master_ui = null, datum/topic_state/state = GLOB.default_state, asset_delivery_mode = null)
	user = nuser
	src_object = nsrc_object
	ui_key = nui_key
	window_id = "[ui_key]\ref[src_object]"
	use_asset_v2 = asset_delivery_mode == ASSET_DELIVERY_V2
	if(use_asset_v2)
		asset_v2_debug("nanoui constructed ui_key=[ui_key] template=[ntemplate_filename] window=[window_id] src=[src_object]", user?.client)

	src.master_ui = master_ui
	if(master_ui)
		master_ui.children += src
	src.state = state

	// add the passed template filename as the "main" template, this is required
	add_template("main", ntemplate_filename)

	if (ntitle)
		title = sanitize(ntitle)
	if (nwidth)
		width = nwidth
	if (nheight)
		height = nheight
	if (nref)
		ref = nref
	else
		ref = nsrc_object

	add_common_assets()

//Do not qdel nanouis. Use close() instead.
/datum/nanoui/Destroy()
	if(compat_ui)
		var/datum/sui/nanocompat/compat = compat_ui
		compat_ui = null
		compat.owner = null
		compat.close()
	user = null
	src_object = null
	state = null
	compat_last_data = null
	. = ..()

 /**
  * Use this proc to add assets which are common to (and required by) all nano uis
  *
  * @return nothing
  */
/datum/nanoui/proc/add_common_assets()
	add_script("libraries.min.js") // A JS file comprising of jQuery, doT.js and jQuery Timer libraries (compressed together)
	add_script("morphdom.min.js") // morphdom: DOM diffing library to eliminate UI flicker on auto-updates
	add_script("nano_utility.js") // The NanoUtility JS, this is used to store utility functions.
	add_script("nano_template.js") // The NanoTemplate JS, this is used to render templates.
	add_script("nano_state_manager.js") // The NanoStateManager JS, it handles updates from the server and passes data to the current state
	add_script("nano_state.js") // The NanoState JS, this is the base state which all states must inherit from
	add_script("nano_state_default.js") // The NanoStateDefault JS, this is the "default" state (used by all UIs by default), which inherits from NanoState
	add_script("nano_base_callbacks.js") // The NanoBaseCallbacks JS, this is used to set up (before and after update) callbacks which are common to all UIs
	add_script("nano_base_helpers.js") // The NanoBaseHelpers JS, this is used to set up template helpers which are common to all UIs
	add_stylesheet("shared.css") // this CSS sheet is common to all UIs
	add_stylesheet("icons.css") // this CSS sheet is common to all UIs

 /**
  * Set the current status (also known as visibility) of this ui.
  *
  * @param state int The status to set, see the defines at the top of this file
  * @param push_update int (bool) Push an update to the ui to update it's status (an update is always sent if the status has changed to red (0))
  *
  * @return nothing
  */
/datum/nanoui/proc/set_status(state, push_update)
	if (state != status) // Only update if it is different
		status = state
		sync_sui_compat_window()
		if (status == STATUS_DISABLED)
			if (push_update)
				update()
		else
			if (push_update || status == 0)
				push_data(null, 1) // Update the UI, force the update in case the status is 0, data is null so that previous data is used

 /**
  * Update the status (visibility) of this ui based on the user's status
  *
  * @param push_update int (bool) Push an update to the ui to update it's status. This is set to 0/false if an update is going to be pushed anyway (to avoid unnessary updates)
  *
  * @return 1 if closed, null otherwise.
  */
/datum/nanoui/proc/update_status(push_update = 0)
	var/atom/host = src_object && src_object.nano_host()
	if(!host)
		close()
		return 1
	var/new_status = host.CanUseTopic(user, state)
	if(master_ui)
		new_status = min(new_status, master_ui.status)
	//[SIERRA-ADD] - AI-UPDATE
	//Здесь мы будем овверрайдить решение кода свыше. Давайте проверим, есть ли у нас доступ проводом?
	//(Технически это костыль, вместо того чтоб вмешиваться в CanUseTopic и глубже в код, мы перебьём)
	//Значение на нужное нам. ИИ сможет взаимодействовать с обьектами, если они вне доступа камер
	if(isAI(user))
		if(istype(host, /obj/machinery/door/airlock))
			var/obj/machinery/door/airlock/door = host
			if(door.CanUseTopic(user))
				new_status = 2
		else
			new_status = 2
	//[SIERRA-ADD]
	if(new_status == STATUS_CLOSE)
		close()
		return 1
	set_status(new_status, push_update)

 /**
  * Set the ui to auto update (every master_controller tick)
  *
  * @param state int (bool) Set auto update to 1 or 0 (true/false)
  *
  * @return nothing
  */
/datum/nanoui/proc/set_auto_update(nstate = 1)
	is_auto_updating = nstate

 /**
  * Set the initial data for the ui. This is vital as the data structure set here cannot be changed when pushing new updates.
  *
  * @param data /list The list of data for this ui
  *
  * @return nothing
  */
/datum/nanoui/proc/set_initial_data(list/data)
	initial_data = data
	if(!isnull(data))
		compat_last_data = data

 /**
  * Get config data to sent to the ui.
  *
  * @return /list config data
  */
/datum/nanoui/proc/get_config_data()
	var/name = "[src_object]"
	name = sanitize(name)
	var/list/config_data = list(
			"title" = title,
			"srcObject" = list("name" = name),
			"stateKey" = state_key,
			"status" = status,
			"autoUpdateLayout" = auto_update_layout,
			"autoUpdateContent" = auto_update_content,
			"showMap" = show_map,
			"mapName" = GLOB.using_map.path,
			"mapZLevel" = map_z_level,
			"mapZLevels" = GLOB.using_map.map_levels,
			"user" = list("name" = user.name),
			"currency" = GLOB.using_map.local_currency_name,
		)
	return config_data

 /**
  * Get data to sent to the ui.
  *
  * @param data /list The list of general data for this ui (can be null to use previous data sent)
  *
  * @return /list data to send to the ui
  */
/datum/nanoui/proc/get_send_data(list/data)
	var/list/config_data = get_config_data()

	var/list/send_data = list("config" = config_data)

	if (!isnull(data))
		send_data["data"] = data

	return send_data

 /**
  * Set the browser window options for this ui
  *
  * @param nwindow_options string The new window options
  *
  * @return nothing
  */
/datum/nanoui/proc/set_window_options(nwindow_options)
	window_options = nwindow_options
	sync_sui_compat_window()

 /**
  * Add a CSS stylesheet to this UI
  * These must be added before the UI has been opened, adding after that will have no effect
  *
  * @param file string The name of the CSS file from /nano/css (e.g. "my_style.css")
  *
  * @return nothing
  */
/datum/nanoui/proc/add_stylesheet(file)
	if(!(file in stylesheets))
		stylesheets.Add(file)

 /**
  * Add a JavsScript script to this UI
  * These must be added before the UI has been opened, adding after that will have no effect
  *
  * @param file string The name of the JavaScript file from /nano/js (e.g. "my_script.js")
  *
  * @return nothing
  */
/datum/nanoui/proc/add_script(file)
	if(!(file in scripts))
		scripts.Add(file)

 /**
  * Add a template for this UI
  * Templates are combined with the data sent to the UI to create the rendered view
  * These must be added before the UI has been opened, adding after that will have no effect
  *
  * @param key string The key which is used to reference this template in the frontend
  * @param filename string The name of the template file from /nano/templates (e.g. "my_template.tmpl")
  *
  * @return nothing
  */
/datum/nanoui/proc/add_template(key, filename)
	templates[key] = filename

/datum/nanoui/proc/get_template_filenames()
	. = list()
	for(var/key in templates)
		var/template_filename = templates[key]
		if(!(template_filename in .))
			. += template_filename

/datum/nanoui/proc/prepare_render_assets()
	add_stylesheet("layout_[layout_key].css")
	add_template("layout", "layout_[layout_key].tmpl")
	if (layout_header_key)
		add_template("layoutHeader", "layout_[layout_header_key].tmpl")

 /**
  * Set the layout key for use in the frontend Javascript
  * The layout key is the basic layout key for the page
  * Two files are loaded on the client based on the layout key varable:
  *     -> a template in /nano/templates with the filename "layout_<layout_key>.tmpl
  *     -> a CSS stylesheet in /nano/css with the filename "layout_<layout_key>.css
  *
  * @param nlayout string The layout key to use
  *
  * @return nothing
  */
/datum/nanoui/proc/set_layout_key(nlayout_key)
	layout_key = lowertext(nlayout_key)

 /**
  * Set the ui to update the layout (re-render it) on each update, turning this on will break the map ui (if it's being used)
  *
  * @param state int (bool) Set update to 1 or 0 (true/false) (default 0)
  *
  * @return nothing
  */
/datum/nanoui/proc/set_auto_update_layout(nstate)
	auto_update_layout = nstate

 /**
  * Set the ui to update the main content (re-render it) on each update
  *
  * @param state int (bool) Set update to 1 or 0 (true/false) (default 1)
  *
  * @return nothing
  */
/datum/nanoui/proc/set_auto_update_content(nstate)
	auto_update_content = nstate

 /**
  * Set the state key for use in the frontend Javascript
  *
  * @param nstate_key string The key of the state to use
  *
  * @return nothing
  */
/datum/nanoui/proc/set_state_key(nstate_key)
	state_key = nstate_key

 /**
  * Toggle showing the map ui
  *
  * @param nstate_key boolean 1 to show map, 0 to hide (default is 0)
  *
  * @return nothing
  */
/datum/nanoui/proc/set_show_map(nstate)
	show_map = nstate

 /**
  * Toggle showing the map ui
  *
  * @param nstate_key boolean 1 to show map, 0 to hide (default is 0)
  *
  * @return nothing
  */
/datum/nanoui/proc/set_map_z_level(nz)
	map_z_level = nz

 /**
  * Set whether or not to use the "old" on close logic (mainly unset_machine())
  *
  * @param state int (bool) Set on_close_logic to 1 or 0 (true/false)
  *
  * @return nothing
  */
/datum/nanoui/proc/use_on_close_logic(state)
	on_close_logic = state
	sync_sui_compat_window()

/datum/nanoui/proc/should_use_sui_compat()
	return GLOB.nanoui_use_sui_compat

/datum/nanoui/nano_host()
	return src_object?.nano_host()

/datum/nanoui/proc/sync_sui_compat_window()
	if(!compat_ui)
		return
	compat_ui.user = user
	compat_ui.title = title
	compat_ui.width = width ? width : compat_ui.width
	compat_ui.height = height ? height : compat_ui.height
	compat_ui.ui_key = ui_key
	compat_ui.window_id = window_id
	compat_ui.ref = ref
	compat_ui.state = state
	compat_ui.on_close_logic = on_close_logic
	compat_ui.status = status
	compat_ui.set_window_options(window_options)

/datum/nanoui/proc/get_sui_compat_master_ui()
	return should_use_sui_compat() ? master_ui?.compat_ui : null

/datum/nanoui/proc/create_sui_compat_ui()
	var/datum/sui/nanocompat/new_ui = new(user, src, "NanoCompat", title, width ? width : 400, height ? height : 500, ref, get_sui_compat_master_ui(), state, ui_key)
	new_ui.owner = src
	compat_ui = new_ui
	sync_sui_compat_window()
	return compat_ui

/datum/nanoui/proc/get_sui_compat_script_assets()
	. = list()
	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	for(var/filename in scripts)
		if(nanoui_compat_skip_script(filename))
			continue
		var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(filename)
		. += list(list(
			"name" = filename,
			"url" = logical_id ? asset_registry_v2.resolve_key(logical_id, filename) : filename
		))

/datum/nanoui/proc/get_sui_compat_stylesheet_assets()
	. = list()
	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	for(var/filename in stylesheets)
		if(nanoui_compat_skip_stylesheet(filename))
			continue
		var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(filename)
		. += list(list(
			"name" = filename,
			"url" = logical_id ? asset_registry_v2.resolve_key(logical_id, filename) : filename
		))

/datum/nanoui/proc/get_sui_compat_template_assets()
	. = list()
	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	for(var/key in templates)
		var/template_filename = templates[key]
		var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(template_filename)
		.[key] = list(
			"name" = template_filename,
			"url" = logical_id ? asset_registry_v2.resolve_key(logical_id, template_filename) : template_filename
		)

/datum/nanoui/proc/get_sui_compat_payload(list/data = null, advance_revision = TRUE)
	var/list/effective_data = !isnull(data) ? data : compat_last_data
	if(isnull(effective_data))
		effective_data = initial_data
	if(!isnull(effective_data))
		compat_last_data = effective_data
	if(advance_revision)
		compat_revision++

	var/list/config_data = get_config_data()
	config_data["layoutKey"] = layout_key
	config_data["layoutHeaderKey"] = layout_header_key
	config_data["stateKey"] = state_key
	config_data["windowOptions"] = window_options
	config_data["windowId"] = window_id
	config_data["uiKey"] = ui_key
	config_data["assetDeliveryMode"] = "sui_compat"

	return list(
		"assets" = list(
			"templates" = get_sui_compat_template_assets(),
			"stylesheets" = get_sui_compat_stylesheet_assets(),
			"scripts" = get_sui_compat_script_assets()
		),
		"config" = config_data,
		"data" = !isnull(effective_data) ? effective_data : list(),
		"initial_data" = !isnull(initial_data) ? initial_data : list(),
		"revision" = compat_revision
	)

/datum/nanoui/sui_data(mob/user)
	return get_sui_compat_payload(null, FALSE)

/datum/nanoui/proc/ensure_sui_compat_open()
	if(!compat_ui || QDELETED(compat_ui))
		create_sui_compat_ui()
	else
		sync_sui_compat_window()
	return compat_ui

/datum/nanoui/proc/build_compat_href(list/href_list)
	var/list/query_parts = list("?src=\ref[src]")
	for(var/key in href_list)
		query_parts += ";[key]=[href_list[key]]"
	return jointext(query_parts, "")

/datum/nanoui/proc/handle_topic_action(href, list/href_list)
	// This is used to toggle the nano map ui
	var/map_update = 0
	if(href_list["showMap"])
		set_show_map(text2num(href_list["showMap"]))
		map_update = 1

	if(href_list["mapZLevel"])
		var/map_z = text2num(href_list["mapZLevel"])
		if(map_z in GLOB.using_map.map_levels)
			set_map_z_level(map_z)
			map_update = 1

	if ((src_object && src_object.Topic(href, href_list, state)) || map_update)
		SSnano.update_uis(src_object) // update all UIs attached to src_object
		return TRUE
	return FALSE

/datum/nanoui/sui_act(action, list/params, datum/sui/ui)
	if(action != "legacy_href")
		return FALSE

	var/list/href_list = islist(params) ? params.Copy() : list()
	var/href = href_list["legacy_href_raw"]
	href_list -= "legacy_href_raw"
	href_list -= "legacy_href"
	href_list -= "src"
	if(!href)
		href = build_compat_href(href_list)
	return handle_topic_action(href, href_list)

/datum/nanoui/sui_verify_assets(datum/sui/ui, client/C)
	if(!should_use_sui_compat() || !istype(ui, /datum/sui/nanocompat))
		return TRUE

	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	return !isnull(asset_registry_v2.ensure_nanoui_compat_ui_verified(C, src))

/datum/nanoui/sui_get_head_html(datum/sui/ui, singleton/asset_registry_v2/asset_registry_v2)
	if(!should_use_sui_compat() || !istype(ui, /datum/sui/nanocompat))
		return null
	return "<script type='text/javascript' defer src='{{asset:nano.js.morphdom_min}}'></script> "

 /**
  * Return the HTML for this UI
  *
  * @return string HTML for the UI
  */
/datum/nanoui/proc/get_html()
	prepare_render_assets()

	var/head_content = ""
	var/list/template_urls = templates

	if(use_asset_v2)
		asset_v2_debug("nanoui get_html window=[window_id] scripts=[asset_v2_debug_list(scripts)] styles=[asset_v2_debug_list(stylesheets)] templates=[asset_v2_debug_list(templates)]", user?.client)
		var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
		for (var/filename in scripts)
			var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(filename)
			if(logical_id)
				head_content += "<script type='text/javascript' defer src='{{asset:[logical_id]}}'></script> "
			else
				head_content += "<script type='text/javascript' defer src='[filename]'></script> "

		for (var/filename in stylesheets)
			var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(filename)
			if(logical_id)
				head_content += "<link rel='stylesheet' type='text/css' href='{{asset:[logical_id]}}'> "
			else
				head_content += "<link rel='stylesheet' type='text/css' href='[filename]'> "

		if (length(templates) > 0)
			template_urls = list()
			for (var/key in templates)
				var/template_filename = templates[key]
				var/logical_id = asset_registry_v2.ensure_nanoui_filename_registered(template_filename)
				template_urls[key] = logical_id ? asset_registry_v2.resolve_key(logical_id, template_filename) : template_filename
	else
		for (var/filename in scripts)
			head_content += "<script type='text/javascript' defer src='[filename]'></script> "

		for (var/filename in stylesheets)
			head_content += "<link rel='stylesheet' type='text/css' href='[filename]'> "

	var/template_data_json = "{}" // An empty JSON object
	if (length(template_urls) > 0)
		template_data_json = strip_improper(json_encode(template_urls))

	var/list/send_data = get_send_data(initial_data)
	var/initial_data_json = replacetext(replacetext(json_encode(send_data), "&#34;", "&amp;#34;"), "'", "&#39;")
	initial_data_json = strip_improper(initial_data_json);

	var/url_parameters_json = json_encode(list("src" = "\ref[src]"))

	if(use_asset_v2)
		return rewrite_assets_v2({"
<!DOCTYPE html>
<html>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		[asset_v2_browser_debug_script(window_id, "nanoui:[ui_key]")]
		<script type='text/javascript'>
			function receiveUpdateData(jsonString)
			{
				// We need both jQuery and NanoStateManager to be able to recieve data
				// At the moment any data received before those libraries are loaded will be lost
				if (typeof NanoStateManager != 'undefined' && typeof jQuery != 'undefined')
				{
					NanoStateManager.receiveUpdateData(jsonString);
				}
				//else
				//{
				//	alert('browser.recieveUpdateData failed due to jQuery or NanoStateManager being unavailiable.');
				//}
			}
		</script>
		[head_content]
	</head>
	<body scroll=auto data-template-data='[template_data_json]' data-url-parameters='[url_parameters_json]' data-initial-data='[initial_data_json]'>
		[ui_loading_shell(title, "Synchronizing templates and terminal controls")]
		<div id='uiLayout'>
		</div>
		<noscript>
			<div id='uiNoScript'>
				<h2>JAVASCRIPT REQUIRED</h2>
				<p>Your Internet Explorer's Javascript is disabled (or broken).<br/>
				Enable Javascript and then open this UI again.</p>
			</div>
		</noscript>
	</body>
</html>
	"})

	return {"
<!DOCTYPE html>
<html>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<script type='text/javascript'>
			function receiveUpdateData(jsonString)
			{
				// We need both jQuery and NanoStateManager to be able to recieve data
				// At the moment any data received before those libraries are loaded will be lost
				if (typeof NanoStateManager != 'undefined' && typeof jQuery != 'undefined')
				{
					NanoStateManager.receiveUpdateData(jsonString);
				}
				//else
				//{
				//	alert('browser.recieveUpdateData failed due to jQuery or NanoStateManager being unavailiable.');
				//}
			}
		</script>
		[head_content]
	</head>
	<body scroll=auto data-template-data='[template_data_json]' data-url-parameters='[url_parameters_json]' data-initial-data='[initial_data_json]'>
		[ui_loading_shell(title, "Synchronizing templates and terminal controls")]
		<div id='uiLayout'>
		</div>
		<noscript>
			<div id='uiNoScript'>
				<h2>JAVASCRIPT REQUIRED</h2>
				<p>Your Internet Explorer's Javascript is disabled (or broken).<br/>
				Enable Javascript and then open this UI again.</p>
			</div>
		</noscript>
	</body>
</html>
	"}

 /**
  * Open this UI
  *
  * @return nothing
  */
/datum/nanoui/proc/open()
	if(!istype(user))
		stack_trace("Wrong type of nanoui user passed: [user], [user.type]")
		qdel(src)
		return

	if(!user?.client)
		qdel(src)
		return

	if(!src_object)
		close()
		return

	prepare_render_assets()

	var/window_size = ""
	if (width && height)
		window_size = "size=[width]x[height];"
	if(update_status(0))
		return // Will be closed by update_status().

	if(should_use_sui_compat())
		var/datum/sui/nanocompat/ui = ensure_sui_compat_open()
		if(!ui)
			qdel(src)
			return
		var/list/payload = get_sui_compat_payload()
		if(ui.is_open)
			ui.last_data = payload
			ui.reload_shell()
		else
			ui.open(payload)
		if(!compat_ui || QDELETED(compat_ui) || !ui.is_open)
			qdel(src)
			return
		SSnano.ui_opened(src)
		return

	if(use_asset_v2)
		asset_v2_debug("nanoui open start window=[window_id] title=[asset_v2_debug_value(title)]", user?.client)
		var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
		if(isnull(asset_registry_v2.ensure_nanoui_ui_verified(user.client, src)))
			asset_v2_debug("nanoui open abort unverified assets window=[window_id] title=[asset_v2_debug_value(title)]", user?.client)
			qdel(src)
			return
	else
		var/datum/asset/assets = get_asset_datum(/datum/asset/nanoui)
		assets.send(user, get_template_filenames())

	show_browser(user, get_html(), "window=[window_id];[window_size][window_options]")
	if(use_asset_v2)
		asset_v2_debug("nanoui open browse window=[window_id]", user?.client)
	winset(user, "mapwindow.map", "focus=true") // return keyboard focus to map
	on_close_winset()
	//onclose(user, window_id)
	SSnano.ui_opened(src)

/datum/nanoui/proc/reload_shell()
	if(!istype(user) || !user?.client)
		return
	if(!src_object)
		close()
		return

	prepare_render_assets()

	var/window_size = ""
	if (width && height)
		window_size = "size=[width]x[height];"
	if(update_status(0))
		return

	if(should_use_sui_compat())
		var/datum/sui/nanocompat/ui = ensure_sui_compat_open()
		if(!ui)
			return
		ui.last_data = get_sui_compat_payload()
		ui.reload_shell()
		return

	if(use_asset_v2)
		asset_v2_debug("nanoui reload_shell window=[window_id] title=[asset_v2_debug_value(title)]", user?.client)
		var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
		if(isnull(asset_registry_v2.ensure_nanoui_ui_verified(user.client, src)))
			asset_v2_debug("nanoui reload_shell abort unverified assets window=[window_id] title=[asset_v2_debug_value(title)]", user?.client)
			return
	else
		var/datum/asset/assets = get_asset_datum(/datum/asset/nanoui)
		assets.send(user, get_template_filenames())

	show_browser(user, get_html(), "window=[window_id];[window_size][window_options]")
	winset(user, "mapwindow.map", "focus=true")
	on_close_winset()

 /**
  * Reinitialise this UI, potentially with a different template and/or initial data
  *
  * @return nothing
  */
/datum/nanoui/proc/reinitialise(template, new_initial_data)
	if(template)
		add_template("main", template)
	if(new_initial_data)
		set_initial_data(new_initial_data)
	open()

 /**
  * Close this UI
  *
  * @return nothing
  */
/datum/nanoui/proc/close()
	is_auto_updating = 0
	if(compat_ui)
		var/datum/sui/nanocompat/compat = compat_ui
		compat_ui = null
		compat.owner = null
		compat.close()
	SSnano.ui_closed(src)
	show_browser(user, null, "window=[window_id]")
	for(var/datum/nanoui/child in children)
		child.close()
	children.Cut()
	compat_last_data = null
	state = null
	master_ui = null
	qdel(src)

 /**
  * Set the UI window to call the nanoclose verb when the window is closed
  * This allows Nano to handle closed windows
  *
  * @return nothing
  */
/datum/nanoui/proc/on_close_winset()
	if(!user.client)
		return
	var/params = "\ref[src]"

	spawn(2)
		if(!user || !user.client)
			return
		winset(user, window_id, "on-close=\"nanoclose [params]\"")

 /**
  * Push data to an already open UI window
  *
  * @return nothing
  */
/datum/nanoui/proc/push_data(data, force_push = 0)
	if(update_status(0))
		return // Closed
	if (status == STATUS_DISABLED && !force_push)
		return // Cannot update UI, no visibility

	if(!isnull(data))
		compat_last_data = data

	if(should_use_sui_compat())
		var/datum/sui/nanocompat/ui = ensure_sui_compat_open()
		if(!ui)
			return
		var/list/payload = get_sui_compat_payload(data)
		ui.status = status
		if(!ui.is_open)
			ui.open(payload)
		else if(force_push && ui.user?.client && !ui.is_closing)
			ui.last_data = payload
			var/list/send_data = list(
				"config" = ui.get_config_data(),
				"data" = payload
			)
			to_target(ui.user, output(list2params(list(strip_improper(json_encode(send_data)))),"[ui.window_id].browser:receiveSuiData"))
		else
			ui.push_data(payload)
		return

	var/list/send_data = get_send_data(data)

//	to_chat(user, list2json_usecache(send_data))// used for debugging //NANO DEBUG HOOK

	to_target(user, output(list2params(list(strip_improper(json_encode(send_data)))),"[window_id].browser:receiveUpdateData"))

 /**
  * This Topic() proc is called whenever a user clicks on a link within a Nano UI
  * If the UI status is currently STATUS_INTERACTIVE then call the src_object Topic()
  * If the src_object Topic() returns 1 (true) then update all UIs attached to src_object
  *
  * @return nothing
  */
/datum/nanoui/Topic(href, href_list)
	update_status(0) // update the status
	if (status != STATUS_INTERACTIVE || user != usr) // If UI is not interactive or usr calling Topic is not the UI user
		return
	handle_topic_action(href, href_list)

 /**
  * Process this UI, updating the entire UI or just the status (aka visibility)
  *
  * @param update string For this UI to update
  *
  * @return nothing
  */
/datum/nanoui/proc/try_update(update = 0)
	if (!src_object || !user)
		close()
		return

	if (status && (update || is_auto_updating))
		update() // Update the UI (update_status() is called whenever a UI is updated)
	else
		update_status(1) // Not updating UI, so lets check here if status has changed

 /**
  * This Process proc is called by SSnano.
  * Use try_update() to make manual updates.
  */
/datum/nanoui/Process()
	try_update(0)

 /**
  * Update the UI
  *
  * @return nothing
  */
/datum/nanoui/proc/update(force_open = 0)
	src_object.ui_interact(user, ui_key, src, force_open, master_ui, state)
