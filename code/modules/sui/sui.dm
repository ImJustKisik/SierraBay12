/**********************************************************
SUI (Sierra UI) Framework

Lightweight Preact-based UI framework for SierraBay12.
Inspired by TGUI, built on top of existing NanoUI infrastructure.

Usage in DM:
  /obj/machinery/my_machine/ui_interact_sui(mob/user)
    var/datum/sui/ui = SSnano.try_update_sui(user, src, "main")
    if (!ui)
      ui = new /datum/sui(user, src, "MyInterface", "My Machine", 500, 400)
      ui.set_auto_update(TRUE)
      ui.open()
    var/list/data = list("power" = TRUE, "temperature" = 293.15)
    ui.push_data(data)

  /obj/machinery/my_machine/sui_act(action, list/params, datum/sui/ui)
    if (action == "toggle")
      power = !power
      return TRUE

**********************************************************/

/datum/sui
	// The user who opened this UI
	var/mob/user
	// The object this UI belongs to
	var/datum/src_object
	// The title of this UI
	var/title
	// The key for this UI (allows multiple different UIs per src_object)
	var/ui_key = "main"
	// Window ID for browse() and onclose()
	var/window_id
	// The Preact interface name (must match SUI.registerInterface() on JS side)
	var/interface
	// Browser window dimensions
	var/width = 400
	var/height = 500
	// Window options
	var/window_options = "focus=0;can_close=1;can_minimize=1;can_maximize=0;can_resize=1;titlebar=1;"
	// Use a custom in-page titlebar instead of OS chrome
	var/is_frameless = FALSE
	// Auto-update every SSnano tick
	var/is_auto_updating = FALSE
	// UI visibility status
	var/status = STATUS_INTERACTIVE
	// Whether to use on_close logic
	var/on_close_logic = TRUE
	// Custom ref for onclose
	var/atom/ref = null
	// Track if open
	var/is_open = FALSE
	// The current topic state checking logic (distance, etc)
	var/datum/topic_state/state = null
	// Last data sent (used for re-renders)
	var/list/last_data
	// Whether BYOND map child control is currently shown
	var/map_visible = FALSE
	// Last requested Z-level for embedded BYOND map control
	var/map_z_level = 0
	// Whether this UI wants the embedded map control to become the default render target
	var/map_prefers_default_capture = FALSE
	// Whether this UI currently owns the client's default map control
	var/captured_default_map = FALSE
	// Per-client capture ownership to avoid stomping restore logic between windows
	var/static/list/client_map_capture_owners = list()
	// Last known browser-local bounds for an embedded map panel
	var/map_panel_x = 0
	var/map_panel_y = 0
	var/map_panel_width = 0
	var/map_panel_bounds_ready = FALSE
	// Last known live browser viewport size reported by JS
	var/window_client_width = 0
	var/window_client_height = 0
	// Last requested BYOND map panel height
	var/map_panel_height = 256
	// Prevent reentrant close/destroy paths
	var/is_closing = FALSE
	// Ensure close callbacks only run once
	var/close_callback_ran = FALSE
	// Parent UI — if set, this UI inherits status and closes when parent closes
	var/datum/sui/master_ui
	// Child UIs — closed automatically when this UI closes
	var/list/datum/sui/children = list()

/**
 * Create a new SUI instance.
 *
 * @param nuser /mob The mob who owns this UI
 * @param nsrc_object /datum The object this UI belongs to (can be a nano_module)
 * @param ninterface string The Preact interface name (e.g., "ShipSensors")
 * @param ntitle string The window title
 * @param nwidth int Window width
 * @param nheight int Window height
 * @param nref /atom Custom ref for onclose Topic call (defaults to src_object)
 * @param nmaster_ui /datum/sui Parent UI for child hierarchy (optional)
 * @param nstate /datum/topic_state Used to determine interaction range (GLOB.default_state by default)
 * @param nui_key string Key for this UI, allows multiple UIs per src_object (default "main")
 */
/datum/sui/New(mob/nuser, datum/nsrc_object, ninterface, ntitle = "", nwidth = 400, nheight = 500, atom/nref = null, datum/sui/nmaster_ui = null, datum/topic_state/nstate = GLOB.default_state, nui_key = "main")
	user = nuser
	src_object = nsrc_object
	interface = ninterface
	title = ntitle || "[nsrc_object]"
	width = nwidth
	height = nheight
	ui_key = nui_key
	window_id = "sui_[ui_key]_[ninterface]\ref[nsrc_object]"
	ref = nref || nsrc_object
	// Enforce default topic state
	state = nstate || GLOB.default_state
	// Child UI hierarchy
	if(nmaster_ui)
		master_ui = nmaster_ui
		master_ui.children += src

/datum/sui/Destroy()
	if(is_open)
		run_on_close_callback(user?.client)
	release_default_map()
	if(is_open && !is_closing)
		is_closing = TRUE
		is_auto_updating = FALSE
		is_open = FALSE
		SSnano.sui_closed(src)
		if(user)
			show_browser(user, null, "window=[window_id]")
	// Detach from parent
	if(master_ui)
		master_ui.children -= src
		master_ui = null
	// Cascade-close children
	for(var/datum/sui/child in children)
		child.master_ui = null
		child.close()
	children.Cut()
	user = null
	src_object = null
	ref = null
	. = ..()

/**
 * Set auto-update on/off
 */
/datum/sui/proc/set_auto_update(nstate = TRUE)
	is_auto_updating = nstate

/**
 * Override raw browse() window options.
 */
/datum/sui/proc/set_window_options(nwindow_options)
	window_options = nwindow_options
	is_frameless = findtext(window_options, "titlebar=0") > 0

/**
 * Enable a frameless popup shell for custom chrome rendered in HTML.
 */
/datum/sui/proc/set_frameless(nstate = TRUE, ncan_resize = FALSE)
	is_frameless = nstate
	if(is_frameless)
		window_options = "focus=0;can_close=1;can_minimize=0;can_maximize=0;can_resize=[ncan_resize ? 1 : 0];titlebar=0;border=0;"
	else
		window_options = "focus=0;can_close=1;can_minimize=1;can_maximize=0;can_resize=1;titlebar=1;"

/**
 * Swap the Preact interface at runtime without closing the window.
 * Equivalent to NanoUI's reinitialise() — reloads the page with a new interface JS file.
 * Any data passed will be sent as initial_data to the new interface.
 */
/datum/sui/proc/set_interface(new_interface, list/new_data)
	interface = new_interface
	if(is_open && user?.client)
		// Full page reload with new interface script
		var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
		asset_registry_v2.ensure_sui_interface_registered(new_interface)
		show_browser(user, get_html(new_data), "window=[window_id];size=[width]x[height];[window_options]")

/**
 * Show or hide the BYOND map element inside this SUI window.
 * Uses winset to create a map child control inside the browser window,
 * positioned at the bottom of the window.
 *
 * @param nstate boolean TRUE to show map, FALSE to hide
 * @param nz int Z-level to display on the map (default: src_object z-level)
 * @param map_height int Height of the map element in pixels (default: 256)
 * @param capture_default bool/null TRUE to route world rendering into this map control
 */
/datum/sui/proc/set_show_map(nstate, nz, map_height = 256, capture_default = null)
	if(!user?.client)
		return

	if(!isnull(capture_default))
		map_prefers_default_capture = !!capture_default

	map_visible = !!nstate
	map_z_level = nz || get_z(src_object.nano_host())
	if(map_visible && !map_panel_bounds_ready)
		map_panel_height = map_height
	if(nstate)
		apply_map_layout()
		if(map_prefers_default_capture)
			capture_default_map()
		else
			release_default_map(FALSE)
	else
		release_default_map()
		map_prefers_default_capture = FALSE
		// Hide the map element and restore browser to full size
		winset(user, "[window_id].sui_map", "parent=;type=map")
		winset(user, "[window_id].browser", "size=0x0;pos=0,0;anchor1=0,0;anchor2=100,100")
	send_config_update()

/datum/sui/proc/set_map_panel_bounds(nx, ny, nwidth, nheight, nwindow_width = null, nwindow_height = null)
	var/new_window_width = max(round(text2num("[nwindow_width]")), 0)
	var/new_window_height = max(round(text2num("[nwindow_height]")), 0)
	var/window_size_changed = FALSE
	if(new_window_width)
		window_size_changed = window_size_changed || window_client_width != new_window_width
		window_client_width = new_window_width
	if(new_window_height)
		window_size_changed = window_size_changed || window_client_height != new_window_height
		window_client_height = new_window_height

	var/new_x = max(round(text2num("[nx]")), 0)
	var/new_y = max(round(text2num("[ny]")), 0)
	var/new_width = max(round(text2num("[nwidth]")), 1)
	var/new_height = max(round(text2num("[nheight]")), 1)

	var/changed = !map_panel_bounds_ready \
		|| window_size_changed \
		|| map_panel_x != new_x \
		|| map_panel_y != new_y \
		|| map_panel_width != new_width \
		|| map_panel_height != new_height

	map_panel_x = new_x
	map_panel_y = new_y
	map_panel_width = new_width
	map_panel_height = new_height
	map_panel_bounds_ready = TRUE

	if(changed && map_visible)
		apply_map_layout()

/datum/sui/proc/apply_map_layout()
	if(!user?.client || !map_visible)
		return

	if(map_panel_bounds_ready && map_panel_width > 0 && map_panel_height > 0)
		// Keep the browser full-size and place the map control over the measured panel bounds.
		winset(user, "[window_id].browser", "size=0x0;pos=0,0;anchor1=0,0;anchor2=100,100")
		winset(user, "[window_id].sui_map", "parent=[window_id];type=map;pos=[map_panel_x],[map_panel_y];size=[map_panel_width]x[map_panel_height];anchor1=0,0;anchor2=0,0;zoom=0;is-disabled=true")
	else
		// Fallback for interfaces that have not yet reported an embedded panel rect.
		var/fallback_height = max((window_client_height || height) - map_panel_height, 0)
		winset(user, "[window_id].browser", "size=0x[fallback_height];pos=0,0;anchor1=0,0;anchor2=100,0")
		winset(user, "[window_id].sui_map", "parent=[window_id];type=map;pos=0,0;size=0x[map_panel_height];anchor1=0,100;anchor2=100,100;zoom=0;is-disabled=true")

	winset(user, "[window_id].browser", "focus=true")

/datum/sui/proc/capture_default_map()
	if(!user?.client || !map_visible)
		return

	var/client_key = "\ref[user.client]"
	var/datum/sui/current_owner = client_map_capture_owners[client_key]
	if(current_owner && current_owner != src)
		current_owner.captured_default_map = FALSE
		if(current_owner.user == user)
			winset(user, "[current_owner.window_id].sui_map", "is-default=false")

	client_map_capture_owners[client_key] = src
	captured_default_map = TRUE
	winset(user, "mapwindow.map", "is-default=false")
	winset(user, "[window_id].sui_map", "is-default=true;is-disabled=true")
	winset(user, "[window_id].browser", "focus=true")

/datum/sui/proc/release_default_map(restore_main = TRUE)
	if(user?.client)
		winset(user, "[window_id].sui_map", "is-default=false;is-disabled=false")

	var/client_key = user?.client ? "\ref[user.client]" : null
	if(client_key && client_map_capture_owners[client_key] == src)
		client_map_capture_owners -= client_key
		if(user?.client && restore_main)
			winset(user, "mapwindow.map", "is-default=true;focus=true")

	captured_default_map = FALSE

/**
 * Build config payload sent to frontend.
 */
/datum/sui/proc/get_config_data()
	return list(
		"title" = title,
		"status" = status,
		"interface" = interface,
		"user" = list("name" = user.name),
		"currency" = GLOB.using_map.local_currency_name,
		"frameless" = is_frameless,
		"window_id" = window_id,
		"map_visible" = map_visible,
		"map_height" = map_panel_height,
		"shell_lock_scroll" = map_visible && map_prefers_default_capture
	)

/**
 * Push only config update to frontend.
 */
/datum/sui/proc/send_config_update()
	if(!user?.client || !is_open || is_closing)
		return
	var/list/config_data = list("config" = get_config_data())
	var/json_data = json_encode(config_data)
	user << output(json_data, "[window_id].browser:receiveSuiData")

/**
 * Resolve the current effective UI status against host/topic checks.
 */
/datum/sui/proc/get_effective_status(atom/host)
	if(!host)
		return STATUS_CLOSE

	var/new_status = host.CanUseTopic(user, state)
	// Inherit status from parent UI (child can never be more permissive than parent)
	if(master_ui)
		new_status = min(new_status, master_ui.status)

	// AI special case handling (mirrors NanoUI behavior)
	if(isAI(user))
		if(istype(host, /obj/machinery/door/airlock))
			var/obj/machinery/door/airlock/door = host
			if(door.CanUseTopic(user))
				new_status = STATUS_INTERACTIVE
		else
			new_status = STATUS_INTERACTIVE

	// Global fallback for UIs that deliberately move the user's eye away from
	// the host (camera/overmap style interactions) while still tied to machine.
	if(new_status == STATUS_CLOSE && user?.machine == host)
		if(host.check_eye(user) >= 0)
			new_status = STATUS_INTERACTIVE

	return new_status

/**
 * Re-check interaction status and push config changes when it flips.
 */
/datum/sui/proc/check_status()
	if(!src_object || !user)
		close()
		return

	var/atom/host = src_object.nano_host()
	if(!host)
		close()
		return

	var/new_status = get_effective_status(host)

	if(new_status == STATUS_CLOSE)
		close()
		return

	if(status != new_status)
		status = new_status
		// If status changed (e.g. from Interactive to Update-Only), push full config to JS
		send_config_update()

/**
 * Generate the HTML shell that loads Preact + SUI and mounts the interface.
 */
/datum/sui/proc/get_html(list/initial_data)
	var/head_content = ""
	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	var/interface_asset_id = asset_registry_v2.ensure_sui_interface_registered(interface)
	asset_v2_debug("sui get_html window=[window_id] interface=[interface] interface_asset_id=[interface_asset_id || "missing"]", user?.client)

	// Core libraries (jQuery is needed for some BYOND compatibility)
	head_content += "<script type='text/javascript' defer src='{{asset:nano.js.libraries_min}}'></script> "
	head_content += "<script type='text/javascript' defer src='{{asset:sui.js.preact_min}}'></script> "
	head_content += "<script type='text/javascript' defer src='{{asset:sui.js.preact_hooks_min}}'></script> "

	// SUI framework
	head_content += "<script type='text/javascript' defer src='{{asset:sui.js.core}}'></script> "
	head_content += "<script type='text/javascript' defer src='{{asset:sui.js.components}}'></script> "

	// Interface-specific script
	if(interface_asset_id)
		head_content += "<script type='text/javascript' defer src='{{asset:[interface_asset_id]}}'></script> "
	else
		head_content += "<script type='text/javascript' defer src='sui_[lowertext(interface)].js'></script> "

	// NanoUI stylesheets (reuse existing dark theme)
	head_content += "<link rel='stylesheet' type='text/css' href='{{asset:nano.css.shared}}'> "
	head_content += "<link rel='stylesheet' type='text/css' href='{{asset:nano.css.icons}}'> "

	// Prepare data
	var/list/send_data = list()
	send_data["config"] = get_config_data()
	if(initial_data)
		send_data["data"] = initial_data

	var/initial_data_json = replacetext(replacetext(json_encode(send_data), "&#34;", "&amp;#34;"), "'", "&#39;")
	initial_data_json = strip_improper(initial_data_json)

	var/url_parameters_json = json_encode(list("src" = "\ref[src]"))

	return rewrite_assets_v2({"
<!DOCTYPE html>
<html style='width:100%;height:100%;'>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		[asset_v2_browser_debug_script(window_id, "sui:[interface]")]
		<script type='text/javascript'>
			function receiveSuiData(jsonString)
			{
				if (typeof SUI != 'undefined')
				{
					try {
						var data = JSON.parse(jsonString);
						// Update the SUI state store directly
						if (data.config) SUI.getState().config = data.config;
						if (data.data) SUI.getState().data = data.data;
						// Trigger re-render via subscribers
						window.receiveSuiData(jsonString);
					} catch(e) {}
				}
			}
		</script>
		[head_content]
	</head>
	<body scroll=auto style='margin:0;width:100%;min-height:100%;box-sizing:border-box;' data-sui-interface='[interface]' data-sui-window-mode='[is_frameless ? "frameless" : "default"]' data-url-parameters='[url_parameters_json]' data-initial-data='[initial_data_json]'>
		[ui_loading_shell(title, "Mounting reactive control surface")]
		<div id='sui-root' style='width:100%;min-height:100%;box-sizing:border-box;'></div>
		<noscript>
			<div style='text-align:center;margin-top:50px;'>
				<h2>JAVASCRIPT REQUIRED</h2>
				<p>Enable Javascript to use SUI interfaces.</p>
			</div>
		</noscript>
	</body>
</html>
	"})

/**
 * Open the UI window
 */
/datum/sui/proc/open(list/initial_data)
	if(!istype(user))
		qdel(src)
		return
	if(!user?.client)
		qdel(src)
		return
	if(!src_object)
		qdel(src)
		return

	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	asset_v2_debug("sui open start window=[window_id] interface=[interface] title=[asset_v2_debug_value(title)]", user.client)
	asset_registry_v2.ensure_pack_verified(user.client, ASSET_PACK_SUI_COMMON)
	if(!user.client.asset_v2_packs[ASSET_PACK_SUI_COMMON])
		asset_v2_debug("sui open abort unverified common pack window=[window_id] interface=[interface]", user.client)
		qdel(src)
		return
	var/interface_asset_id = asset_registry_v2.ensure_sui_interface_registered(interface)
	if(interface_asset_id)
		asset_registry_v2.ensure_asset_verified(user.client, interface_asset_id)
		var/datum/asset_entry_v2/interface_entry = asset_registry_v2.assets_by_logical_id[interface_asset_id]
		if(!istype(interface_entry) || !user.client.asset_v2_sent_keys[interface_entry.key])
			asset_v2_debug("sui open abort unverified interface asset window=[window_id] interface=[interface] logical_id=[interface_asset_id]", user.client)
			qdel(src)
			return
	else
		asset_v2_debug("sui open abort missing interface-specific asset interface=[interface]", user.client)
		qdel(src)
		return

	var/window_size = ""
	if(width && height)
		window_size = "size=[width]x[height];"

	last_data = initial_data
	show_browser(user, get_html(initial_data), "window=[window_id];[window_size][window_options]")
	asset_v2_debug("sui open browse window=[window_id] interface=[interface]", user.client)
	winset(user, "[window_id].browser", "size=0x0;pos=0,0;anchor1=0,0;anchor2=100,100")
	winset(user, "mapwindow.map", "focus=true")
	on_close_winset()
	if(map_visible)
		apply_map_layout()
		if(map_prefers_default_capture)
			capture_default_map()

	is_open = TRUE
	SSnano.sui_opened(src)

/datum/sui/proc/reload_shell()
	if(is_closing || !is_open)
		return
	if(!istype(user))
		return
	if(!user?.client)
		return
	if(!src_object)
		close()
		return

	var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
	asset_v2_debug("sui reload_shell window=[window_id] interface=[interface] title=[asset_v2_debug_value(title)]", user.client)
	asset_registry_v2.ensure_pack_verified(user.client, ASSET_PACK_SUI_COMMON)
	if(!user.client.asset_v2_packs[ASSET_PACK_SUI_COMMON])
		asset_v2_debug("sui reload_shell abort unverified common pack window=[window_id] interface=[interface]", user.client)
		return
	var/interface_asset_id = asset_registry_v2.ensure_sui_interface_registered(interface)
	if(interface_asset_id)
		asset_registry_v2.ensure_asset_verified(user.client, interface_asset_id)
		var/datum/asset_entry_v2/interface_entry = asset_registry_v2.assets_by_logical_id[interface_asset_id]
		if(!istype(interface_entry) || !user.client.asset_v2_sent_keys[interface_entry.key])
			asset_v2_debug("sui reload_shell abort unverified interface asset window=[window_id] interface=[interface] logical_id=[interface_asset_id]", user.client)
			return
	else
		asset_v2_debug("sui reload_shell abort missing interface-specific asset interface=[interface]", user.client)
		return

	var/window_size = ""
	if(width && height)
		window_size = "size=[width]x[height];"

	show_browser(user, get_html(last_data), "window=[window_id];[window_size][window_options]")
	winset(user, "[window_id].browser", "size=0x0;pos=0,0;anchor1=0,0;anchor2=100,100")
	winset(user, "mapwindow.map", "focus=true")
	on_close_winset()
	if(map_visible)
		apply_map_layout()
		if(map_prefers_default_capture)
			capture_default_map()

/**
 * Close the UI
 */
/datum/sui/proc/close()
	if(is_closing)
		return
	var/was_open = is_open
	is_closing = TRUE
	is_auto_updating = FALSE
	if(was_open)
		run_on_close_callback(user?.client)
		is_open = FALSE
		SSnano.sui_closed(src)
	release_default_map()
	// Cascade close to children
	for(var/datum/sui/child in children)
		child.master_ui = null
		child.close()
	children.Cut()
	// Detach from parent
	if(master_ui)
		master_ui.children -= src
		master_ui = null
	if(user)
		show_browser(user, null, "window=[window_id]")
	qdel(src)

/datum/sui/proc/run_on_close_callback(client/C = user?.client)
	set waitfor = FALSE
	if(close_callback_ran || !istype(C))
		return
	close_callback_ran = TRUE

	if(ref && !QDELETED(ref))
		var/href = "close=1"
		C.Topic(href, params2list(href), ref)
	if(on_close_logic && C.mob)
		C.mob.unset_machine()

/datum/sui/proc/handle_builtin_action(action, mob/user, list/params = null)
	if(action == "__close")
		close()
		return TRUE

	if(action == "__sync_map_panel")
		set_map_panel_bounds(params?["x"], params?["y"], params?["width"], params?["height"], params?["window_width"], params?["window_height"])
		return TRUE

	if(!istype(src_object, /datum/nano_module/program))
		return FALSE

	var/datum/nano_module/program/module = src_object
	var/datum/computer_file/program/program = module.program
	var/datum/extension/interactive/ntos/computer = program?.computer
	if(!program || !computer)
		return FALSE

	switch(action)
		if("__pc_minimize")
			computer.minimize_program(program, user)
			return TRUE
		if("__pc_exit")
			computer.kill_program_remote(program, FALSE, user)
			return TRUE

	return FALSE

/**
 * Set up onclose handler
 */
/datum/sui/proc/on_close_winset()
	if(!user?.client)
		return
	var/params = "\ref[src]"
	spawn(2)
		if(!user || !user.client)
			return
		winset(user, window_id, "on-close=\"nanoclose [params]\"")

/**
 * Push data update to the browser
 */
/datum/sui/proc/push_data(list/data)
	if(!user?.client || !is_open || is_closing)
		return
	if(!src_object)
		close()
		return
	check_status()
	if(is_closing || !is_open)
		return
	if(status == STATUS_DISABLED)
		return

	last_data = data

	var/list/send_data = list()
	send_data["config"] = get_config_data()
	if(!isnull(data))
		send_data["data"] = data

	to_target(user, output(list2params(list(strip_improper(json_encode(send_data)))),"[window_id].browser:receiveSuiData"))

/**
 * Handle incoming Topic calls from the browser
 */
/datum/sui/Topic(href, href_list)
	check_status()
	if(is_closing || !is_open)
		return

	var/atom/host = src_object && src_object.nano_host()
	if(status != STATUS_INTERACTIVE || user != usr)
		if(host)
			host.CouldNotUseTopic(user)
		return

	if(get_effective_status(host) != STATUS_INTERACTIVE)
		if(host)
			host.CouldNotUseTopic(user)
		return
	if(host)
		host.CouldUseTopic(user)

	var/action = href_list["sui_action"]
	if(!action)
		return

	if(handle_builtin_action(action, user, href_list))
		return

	// Remove internal params before passing to sui_act
	href_list -= "src"
	href_list -= "sui_action"

	if(src_object.sui_act(action, href_list, src))
		// Action was handled, update all UIs for this object
		SSnano.update_sui_uis(src_object)

/**
 * Process this UI (called by SSnano)
 */
/datum/sui/Process()
	if(is_closing)
		return
	check_status()
	if(is_closing)
		return
	if(!src_object || !user)
		close()
		return
	if(is_auto_updating && is_open && status > STATUS_DISABLED)
		src_object.sui_update(user, src)

// ============================================================
// Base procs for objects using SUI
// ============================================================

/**
 * Override this to handle SUI actions from the user.
 * Return TRUE if the action was handled and UIs should update.
 */
/datum/proc/sui_act(action, list/params, datum/sui/ui)
	return FALSE

/**
 * Override this to push data updates during auto-update.
 */
/datum/proc/sui_update(mob/user, datum/sui/ui)
	return

// ============================================================
// SSnano integration (extend existing subsystem)
// ============================================================

/datum/controller/subsystem/processing/nano
	// SUI windows tracked as: open_sui_uis[src_ref_key][ui_key] = list(datum/sui)
	// Mirrors NanoUI's open_uis structure for consistency
	var/list/list/open_sui_uis = list()

/**
 * Try to find an existing SUI for the given user/src_object/ui_key combo.
 * If found, returns the UI so you can push_data() to it instead of creating a new one.
 */
/datum/controller/subsystem/processing/nano/proc/try_update_sui(mob/user, datum/src_object, ui_key = "main")
	var/src_key = "\ref[src_object]"
	if(!open_sui_uis[src_key] || !open_sui_uis[src_key][ui_key])
		return null
	for(var/datum/sui/ui in open_sui_uis[src_key][ui_key])
		if(ui.user == user)
			return ui
	return null

/datum/controller/subsystem/processing/nano/proc/sui_opened(datum/sui/ui)
	var/src_key = "\ref[ui.src_object]"
	if(!open_sui_uis[src_key])
		open_sui_uis[src_key] = list()
	LAZYINITLIST(open_sui_uis[src_key][ui.ui_key])
	LAZYDISTINCTADD(open_sui_uis[src_key][ui.ui_key], ui)
	START_PROCESSING(SSnano, ui)

/datum/controller/subsystem/processing/nano/proc/sui_closed(datum/sui/ui)
	var/src_key = "\ref[ui.src_object]"
	if(!open_sui_uis[src_key] || !open_sui_uis[src_key][ui.ui_key])
		return
	STOP_PROCESSING(SSnano, ui)
	open_sui_uis[src_key][ui.ui_key] -= ui
	if(!length(open_sui_uis[src_key][ui.ui_key]))
		open_sui_uis[src_key] -= ui.ui_key
	if(!length(open_sui_uis[src_key]))
		open_sui_uis -= src_key

/datum/controller/subsystem/processing/nano/proc/update_sui_uis(datum/src_object)
	. = 0
	var/src_key = "\ref[src_object]"
	if(!open_sui_uis[src_key])
		return
	for(var/key in open_sui_uis[src_key])
		for(var/datum/sui/ui in open_sui_uis[src_key][key])
			if(ui.src_object && ui.user && ui.is_open)
				ui.check_status()
				if(ui.is_closing || !ui.is_open || ui.status <= STATUS_DISABLED)
					continue
				ui.src_object.sui_update(ui.user, ui)
				.++

/datum/controller/subsystem/processing/nano/proc/get_user_sui_uis(mob/user)
	. = list()
	if(!user || !length(open_sui_uis))
		return
	for(var/src_key in open_sui_uis)
		for(var/key in open_sui_uis[src_key])
			for(var/datum/sui/ui in open_sui_uis[src_key][key])
				if(ui.user == user)
					. += ui

/datum/controller/subsystem/processing/nano/proc/close_sui_uis(datum/src_object)
	set waitfor = FALSE
	. = 0
	var/src_key = "\ref[src_object]"
	if(!open_sui_uis[src_key])
		return
	var/list/sui_by_key = open_sui_uis[src_key]
	var/list/keys_copy = sui_by_key.Copy()
	for(var/key in keys_copy)
		var/list/sui_list = sui_by_key[key]
		var/list/uis_copy = sui_list.Copy()
		for(var/datum/sui/ui in uis_copy)
			ui.close()
			.++

/datum/controller/subsystem/processing/nano/proc/close_user_sui_uis(mob/user, datum/src_object)
	. = 0
	if(!length(open_sui_uis))
		return
	for(var/src_key in open_sui_uis)
		var/list/sui_by_key = open_sui_uis[src_key]
		for(var/key in sui_by_key)
			var/list/sui_list = sui_by_key[key]
			var/list/uis_copy = sui_list.Copy()
			for(var/datum/sui/ui in uis_copy)
				if(ui.user != user)
					continue
				if(!isnull(src_object) && ui.src_object != src_object)
					continue
				ui.close()
				.++

/datum/controller/subsystem/processing/nano/proc/transfer_user_sui_uis(mob/oldMob, mob/newMob)
	. = 0
	if(!length(open_sui_uis))
		return
	for(var/src_key in open_sui_uis)
		for(var/key in open_sui_uis[src_key])
			for(var/datum/sui/ui in open_sui_uis[src_key][key])
				if(ui.user != oldMob)
					continue
				ui.user = newMob
				.++
