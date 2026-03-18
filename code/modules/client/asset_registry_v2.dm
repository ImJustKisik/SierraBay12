#define ASSET_V2_BACKEND_BYOND_RSC "byond_rsc"

#define ASSET_V2_REASON_CONNECT "connect"
#define ASSET_V2_REASON_ONDEMAND "ondemand"
#define ASSET_V2_REASON_LEGACY "legacy"
#define ASSET_DELIVERY_V2 "v2"

#define ASSET_PACK_CORE_BOOTSTRAP "core_bootstrap"
#define ASSET_PACK_LOGIN_BRANDING "login_branding"
#define ASSET_PACK_GOONCHAT "goonchat"
#define ASSET_PACK_BROWSER_SHARED "browser_shared"
#define ASSET_PACK_NANOUI_COMMON "nanoui_common"
#define ASSET_PACK_NANOUI_COMPAT "nanoui_compat"
#define ASSET_PACK_SUI_COMMON "sui_common"

/client
	var/list/asset_v2_sent_keys = list()
	var/list/asset_v2_sent_logical_ids = list()
	var/list/asset_v2_packs = list()
	var/list/asset_v2_metrics = list(
		"connect_assets" = 0,
		"connect_packs" = 0,
		"connect_bytes" = 0,
		"ondemand_assets" = 0,
		"ondemand_packs" = 0,
		"ondemand_bytes" = 0
	)
	var/ui_watch_mode_enabled = FALSE
	var/ui_watch_mode_interval = 20
	var/ui_watch_mode_generation = 0

/client/proc/asset_v2_dev_reset_state()
	cache.Cut()
	asset_v2_sent_keys.Cut()
	asset_v2_sent_logical_ids.Cut()
	asset_v2_packs.Cut()
	asset_v2_metrics["ondemand_assets"] = 0
	asset_v2_metrics["ondemand_packs"] = 0
	asset_v2_metrics["ondemand_bytes"] = 0

/client/proc/asset_v2_dev_reload_open_uis()
	. = 0
	var/mob/current_mob = mob
	if(!current_mob)
		return

	if(length(current_mob.open_uis))
		var/list/open_nano = current_mob.open_uis.Copy()
		for(var/datum/nanoui/ui in open_nano)
			if(!istype(ui) || ui.user != current_mob)
				continue
			ui.reload_shell()
			.++

	var/list/open_sui = SSnano.get_user_sui_uis(current_mob)
	if(length(open_sui))
		for(var/datum/sui/ui in open_sui)
			if(!istype(ui) || ui.user != current_mob)
				continue
			ui.reload_shell()
			.++

/client/proc/asset_v2_dev_collect_open_uis()
	. = list()
	var/mob/current_mob = mob
	if(!current_mob)
		return

	if(length(current_mob.open_uis))
		for(var/datum/nanoui/ui in current_mob.open_uis)
			if(!istype(ui) || ui.user != current_mob)
				continue
			. += list(list(
				"type" = "NanoUI",
				"title" = ui.title || "(untitled)",
				"window_id" = ui.window_id || "(no window id)",
				"key" = ui.ui_key || "(no key)",
				"status" = ui.status,
				"extra" = ui.templates && ui.templates["main"] ? ui.templates["main"] : "(no template)"
			))

	var/list/open_sui = SSnano.get_user_sui_uis(current_mob)
	if(length(open_sui))
		for(var/datum/sui/ui in open_sui)
			if(!istype(ui) || ui.user != current_mob)
				continue
			. += list(list(
				"type" = "SUI",
				"title" = ui.title || "(untitled)",
				"window_id" = ui.window_id || "(no window id)",
				"key" = ui.ui_key || "(no key)",
				"status" = ui.status,
				"extra" = ui.interface || "(no interface)"
			))

/client/proc/reload_open_ui_windows()
	set category = "Debug"
	set name = "Reload Open UI Windows"
	set desc = "Reload the HTML shells for your currently open NanoUI/SUI windows without rescanning assets."

	var/client/client = usr?.client || src
	if(!check_rights(R_DEBUG, TRUE, client))
		return

	var/reloaded_uis = asset_v2_dev_reload_open_uis()
	to_chat(src, SPAN_NOTICE("Reloaded open UI windows: [reloaded_uis]."))
	log_admin("[key_name_admin(client)] reloaded open UI windows: [reloaded_uis]")

/client/proc/dev_hot_reload_ui_assets(announce = TRUE, log_action = TRUE)
	var/client/client = usr?.client || src
	var/singleton/asset_registry_v2/registry = get_asset_registry_v2()
	registry.load()
	var/reloaded_assets = registry.dev_reregister_file_assets()
	asset_v2_dev_reset_state()
	var/reloaded_uis = asset_v2_dev_reload_open_uis()

	if(announce)
		to_chat(src, SPAN_NOTICE("UI dev reload complete: assets rescanned=[reloaded_assets], reloaded windows=[reloaded_uis]."))
		to_chat(src, SPAN_NOTICE("Browser-side JS errors continue to appear in logs via asset_v2 ui error/debug hooks."))

	if(log_action)
		log_admin("[key_name_admin(client)] triggered UI asset hot reload: rescanned=[reloaded_assets] windows=[reloaded_uis]")

	return list(
		"assets" = reloaded_assets,
		"uis" = reloaded_uis
	)

/client/proc/run_ui_watch_mode(expected_generation)
	set waitfor = FALSE

	while(ui_watch_mode_enabled && ui_watch_mode_generation == expected_generation)
		sleep(max(ui_watch_mode_interval, 1))
		if(!ui_watch_mode_enabled || ui_watch_mode_generation != expected_generation)
			break
		dev_hot_reload_ui_assets(FALSE, FALSE)

/client/proc/set_ui_watch_mode_interval()
	set category = "Debug"
	set name = "Set UI Watch Interval"
	set desc = "Set the auto-reload interval for UI watch mode in deciseconds."

	var/client/client = usr?.client || src
	if(!check_rights(R_DEBUG, TRUE, client))
		return

	var/current_seconds = round(ui_watch_mode_interval / 10, 0.1)
	var/new_interval = input(src, "Enter UI watch interval in seconds (0.5 to 30).", "UI Watch Interval", current_seconds) as null|num
	if(isnull(new_interval))
		return

	new_interval = min(max(new_interval, 0.5), 30)
	ui_watch_mode_interval = max(round(new_interval * 10), 1)
	to_chat(src, SPAN_NOTICE("UI watch mode interval set to [round(ui_watch_mode_interval / 10, 0.1)] seconds."))

/client/proc/toggle_ui_watch_mode()
	set category = "Debug"
	set name = "Toggle UI Watch Mode"
	set desc = "Continuously hot-reload changed UI assets and open UI windows on a timer."

	var/client/client = usr?.client || src
	if(!check_rights(R_DEBUG, TRUE, client))
		return

	if(ui_watch_mode_enabled)
		ui_watch_mode_enabled = FALSE
		ui_watch_mode_generation++
		to_chat(src, SPAN_NOTICE("UI watch mode disabled."))
		log_admin("[key_name_admin(client)] disabled UI watch mode")
		return

	ui_watch_mode_enabled = TRUE
	ui_watch_mode_generation++
	var/current_generation = ui_watch_mode_generation
	var/list/result = dev_hot_reload_ui_assets(TRUE, TRUE)
	var/initial_assets = result["assets"]
	var/initial_uis = result["uis"]
	to_chat(src, SPAN_NOTICE("UI watch mode enabled. Interval: [round(ui_watch_mode_interval / 10, 0.1)] seconds."))
	to_chat(src, SPAN_NOTICE("Initial pass: assets rescanned=[initial_assets], reloaded windows=[initial_uis]."))
	log_admin("[key_name_admin(client)] enabled UI watch mode interval=[ui_watch_mode_interval]")
	run_ui_watch_mode(current_generation)

/client/proc/list_open_ui_windows()
	set category = "Debug"
	set name = "List Open UI Windows"
	set desc = "Show all currently open NanoUI/SUI windows for this client."

	var/client/client = usr?.client || src
	if(!check_rights(R_DEBUG, TRUE, client))
		return

	var/list/open_windows = asset_v2_dev_collect_open_uis()
	var/list/lines = list()
	lines += "<html><head><meta charset='utf-8'><title>Open UI Windows</title></head><body style='font-family:Verdana,sans-serif;background:#1b1b1b;color:#ddd;padding:10px;'>"
	lines += "<h2 style='margin-top:0;'>Open UI Windows</h2>"
	lines += "<p>Client: <b>[html_encode("[ckey || key || src]")]</b></p>"

	if(!length(open_windows))
		lines += "<p>No open NanoUI or SUI windows.</p>"
	else
		lines += "<table style='width:100%;border-collapse:collapse;'>"
		lines += "<tr>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Type</th>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Title</th>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Window</th>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Key</th>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Status</th>"
		lines += "<th style='text-align:left;border-bottom:1px solid #40628a;padding:4px;'>Template / Interface</th>"
		lines += "</tr>"
		for(var/list/entry in open_windows)
			var/entry_type = html_encode("[entry["type"]]")
			var/entry_title = html_encode("[entry["title"]]")
			var/entry_window = html_encode("[entry["window_id"]]")
			var/entry_key = html_encode("[entry["key"]]")
			var/entry_status = html_encode("[entry["status"]]")
			var/entry_extra = html_encode("[entry["extra"]]")
			lines += "<tr>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'>[entry_type]</td>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'>[entry_title]</td>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'><code>[entry_window]</code></td>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'><code>[entry_key]</code></td>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'>[entry_status]</td>"
			lines += "<td style='padding:4px;border-bottom:1px solid #2c2c2c;'><code>[entry_extra]</code></td>"
			lines += "</tr>"
		lines += "</table>"

	lines += "</body></html>"
	show_browser(src, jointext(lines, null), "window=open_ui_windows;size=920x520")

/client/proc/reload_ui_assets()
	set category = "Debug"
	set name = "Reload UI Assets"
	set desc = "Re-register changed NanoUI/SUI assets, reset your client-side UI cache, and reload your open interfaces."

	var/client/client = usr?.client || src
	if(!check_rights(R_DEBUG, TRUE, client))
		return

	dev_hot_reload_ui_assets(TRUE, TRUE)

/var/global/asset_v2_debug_enabled = TRUE

/proc/asset_v2_debug_value(value, limit = 256)
	var/text = "[value]"
	if(length(text) > limit)
		return "[copytext(text, 1, limit)]..."
	return text

/proc/asset_v2_debug_list(list/values, limit = 8)
	if(!islist(values))
		return "count=0"

	var/list/preview = list()
	for(var/value in values)
		if(length(preview) >= limit)
			break
		preview += asset_v2_debug_value(value, 64)

	return "count=[length(values)] preview=[jointext(preview, ", ")]"

/proc/asset_v2_debug(message, client/C = null)
	if(!asset_v2_debug_enabled)
		return

	var/prefix = "asset_v2"
	if(istype(C))
		prefix += " client=[asset_v2_debug_value(C.ckey || C.key || C)]"
	log_debug("[prefix] [message]")

/proc/asset_v2_browser_debug_script(window_id, context_label)
	var/safe_window = replacetext("[window_id]", "'", "\\'")
	var/safe_context = replacetext("[context_label]", "'", "\\'")
	return {"
		<script type='text/javascript'>
			window.assetV2Window = '[safe_window]';
			window.assetV2Context = '[safe_context]';
			window.assetV2Report = function(kind, message)
			{
				try {
					var key = kind === 'error' ? 'asset_v2_ui_error' : 'asset_v2_ui_debug';
					var text = String(message == null ? '' : message);
					if (text.length > 700)
						text = text.substring(0, 700);
					window.location.href = '?' + key + '=' + encodeURIComponent(text)
						+ '&asset_v2_ui_window=' + encodeURIComponent(window.assetV2Window || '')
						+ '&asset_v2_ui_context=' + encodeURIComponent(window.assetV2Context || '');
				} catch (e) {}
			};
			window.addEventListener('error', function(event)
			{
				var details = (event && event.message ? event.message : 'Unknown error')
					+ ' @ ' + (event && event.filename ? event.filename : 'unknown')
					+ ':' + (event && event.lineno ? event.lineno : 0)
					+ ':' + (event && event.colno ? event.colno : 0);
				window.assetV2Report('error', details);
			});
			window.addEventListener('unhandledrejection', function(event)
			{
				var reason = event && event.reason ? event.reason : 'Unknown rejection';
				window.assetV2Report('error', 'Unhandled rejection: ' + reason);
			});
			document.addEventListener('DOMContentLoaded', function()
			{
				window.assetV2Report('debug', 'dom_ready');
			});
		</script>
	"}

/proc/ui_loading_shell(title, subtitle = "Synchronizing interface assets")
	var/safe_title = html_encode("[title]")
	var/safe_subtitle = html_encode("[subtitle]")
	return {"
		<style type='text/css'>
			html, body {
				background:
					radial-gradient(circle at top, #203247 0%, #10151d 38%, #06080c 100%);
				min-height: 100%;
			}
			body {
				margin: 0;
				color: #d8e6f5;
			}
			#uiLayout,
			#sui-root {
				opacity: 0;
				transition: opacity 0.18s ease;
			}
			body.ui-ready #uiLayout,
			body.ui-ready #sui-root {
				opacity: 1;
			}
			.uiBootSplash {
				position: fixed;
				inset: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 24px;
				background:
					linear-gradient(180deg, rgba(5, 9, 14, 0.08) 0%, rgba(5, 9, 14, 0.68) 100%),
					repeating-linear-gradient(180deg, rgba(116, 162, 209, 0.06) 0px, rgba(116, 162, 209, 0.06) 1px, transparent 1px, transparent 4px);
				transition: opacity 0.2s ease, visibility 0.2s ease;
				z-index: 9999;
			}
			body.ui-ready .uiBootSplash {
				opacity: 0;
				visibility: hidden;
				pointer-events: none;
			}
			.uiBootSplash__panel {
				width: min(640px, calc(100vw - 48px));
				padding: 18px 20px 16px;
				background: linear-gradient(180deg, rgba(9, 14, 20, 0.98) 0%, rgba(6, 10, 15, 0.98) 100%);
				border: 1px solid rgba(126, 183, 240, 0.18);
				box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
				position: relative;
				overflow: hidden;
				font-family: Consolas, 'Courier New', monospace;
			}
			.uiBootSplash__panel::before {
				content: '';
				position: absolute;
				inset: 0 auto 0 0;
				width: 3px;
				background: linear-gradient(180deg, #6fc3ff 0%, #3f78ff 100%);
				box-shadow: 0 0 16px rgba(79, 141, 255, 0.45);
			}
			.uiBootSplash__eyebrow {
				font: 600 10px/1.1 Consolas, 'Courier New', monospace;
				letter-spacing: 0.22em;
				text-transform: uppercase;
				color: #89bff0;
				margin-bottom: 8px;
			}
			.uiBootSplash__title {
				font: 700 18px/1.1 Consolas, 'Courier New', monospace;
				margin: 0 0 8px;
				color: #eef6ff;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}
			.uiBootSplash__subtitle {
				font: 12px/1.5 Consolas, 'Courier New', monospace;
				margin: 0 0 12px;
				color: rgba(191, 220, 248, 0.88);
			}
			.uiBootSplash__status {
				display: flex;
				justify-content: space-between;
				gap: 16px;
				font: 10px/1.1 Consolas, 'Courier New', monospace;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				color: #9ecdf6;
				margin-bottom: 8px;
			}
			.uiBootSplash__bar {
				position: relative;
				height: 6px;
				background: rgba(120, 164, 211, 0.14);
				border: 1px solid rgba(120, 164, 211, 0.15);
				overflow: hidden;
				margin-bottom: 12px;
			}
			.uiBootSplash__bar::after {
				content: '';
				position: absolute;
				inset: 0;
				background: linear-gradient(90deg, rgba(96, 199, 255, 0.06) 0%, rgba(96, 199, 255, 0.2) 50%, rgba(96, 199, 255, 0.06) 100%);
			}
			.uiBootSplash__barFill {
				display: block;
				height: 100%;
				width: 0%;
				background: linear-gradient(90deg, #6ac8ff 0%, #7ea7ff 52%, #c3dcff 100%);
				box-shadow: 0 0 12px rgba(111, 195, 255, 0.42);
				transition: width 0.12s ease;
			}
			.uiBootSplash__foot {
				margin-top: 10px;
				font: 10px/1.5 Consolas, 'Courier New', monospace;
				color: rgba(171, 203, 233, 0.82);
				display: flex;
				justify-content: space-between;
				gap: 10px;
			}
			.uiBootSplash__log {
				height: 172px;
				overflow: hidden;
				border: 1px solid rgba(120, 164, 211, 0.12);
				background: rgba(5, 9, 14, 0.52);
				padding: 10px 12px;
				font: 12px/1.45 Consolas, 'Courier New', monospace;
				color: #d6e8fb;
				white-space: pre-wrap;
			}
			.uiBootSplash__line {
				display: block;
			}
			.uiBootSplash__line--muted {
				color: #8fb4da;
			}
			.uiBootSplash__cursor {
				display: inline-block;
				width: 8px;
				height: 14px;
				margin-left: 4px;
				background: #9dd4ff;
				vertical-align: -2px;
				animation: uiBootCursorBlink 1s steps(1, end) infinite;
			}
			.uiBootSplash--error .uiBootSplash__barFill {
				background: linear-gradient(90deg, #ff7b70 0%, #ffb070 100%);
				box-shadow: 0 0 12px rgba(255, 123, 112, 0.35);
			}
			.uiBootSplash--error .uiBootSplash__panel {
				background: linear-gradient(180deg, rgba(27, 10, 10, 0.98) 0%, rgba(14, 5, 5, 0.98) 100%);
				border-color: rgba(255, 120, 120, 0.34);
				box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
			}
			.uiBootSplash--error .uiBootSplash__panel::before {
				background: linear-gradient(180deg, #ff7a7a 0%, #a61b1b 100%);
				box-shadow: 0 0 16px rgba(255, 74, 74, 0.38);
			}
			.uiBootSplash--error .uiBootSplash__eyebrow,
			.uiBootSplash--error .uiBootSplash__status,
			.uiBootSplash--error .uiBootSplash__foot {
				color: #ffc2bc;
			}
			.uiBootSplash--error .uiBootSplash__title {
				color: #ffe4e4;
			}
			.uiBootSplash--error .uiBootSplash__subtitle {
				color: rgba(255, 214, 214, 0.92);
			}
			.uiBootSplash--error .uiBootSplash__cursor {
				background: #ffc2bc;
			}
			@keyframes uiBootCursorBlink {
				0%, 49% { opacity: 1; }
				50%, 100% { opacity: 0; }
			}
		</style>
		<script type='text/javascript'>
			window.appendUiBootLog = function(message, muted)
			{
				try {
					var node = document.getElementById('uiBootSplashLog');
					if (!node)
						return;
					var line = document.createElement('div');
					line.className = 'uiBootSplash__line' + (muted ? ' uiBootSplash__line--muted' : '');
					line.textContent = String(message || '');
					node.appendChild(line);
					node.scrollTop = node.scrollHeight;
				} catch (e) {}
			};
			window.setUiBootProgress = function(value, total)
			{
				try {
					var bar = document.getElementById('uiBootSplashBarFill');
					var statusLeft = document.getElementById('uiBootSplashStatusLeft');
					var statusRight = document.getElementById('uiBootSplashStatusRight');
					var percent = total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
					if (bar)
						bar.style.width = percent + '%';
					if (statusLeft)
						statusLeft.textContent = 'Boot sequence';
					if (statusRight)
						statusRight.textContent = String(value || 0) + '/' + String(total || 0) + ' assets (' + percent + '%)';
				} catch (e) {}
			};
			window.setUiLoadingMessage = function(message)
			{
				try {
					var node = document.getElementById('uiBootSplashMessage');
					if (node)
						node.textContent = String(message || '');
				} catch (e) {}
			};
			window.setUiLoadingError = function(message)
			{
				try {
					var splash = document.getElementById('uiBootSplash');
					var eyebrow = document.getElementById('uiBootSplashEyebrow');
					var title = document.getElementById('uiBootSplashTitle');
					var statusLeft = document.getElementById('uiBootSplashStatusLeft');
					var statusRight = document.getElementById('uiBootSplashStatusRight');
					var footLeft = document.getElementById('uiBootSplashFootLeft');
					var footRight = document.getElementById('uiBootSplashFootRight');
					if (splash)
						splash.className = 'uiBootSplash uiBootSplash--error';
					if (eyebrow)
						eyebrow.textContent = 'Kernel panic';
					if (title)
						title.textContent = 'NTOS CRITICAL FAILURE';
					if (statusLeft)
						statusLeft.textContent = 'Panic';
					if (statusRight)
						statusRight.textContent = 'System halted';
					if (footLeft)
						footLeft.textContent = 'Collecting crash state and halting terminal process';
					if (footRight)
						footRight.textContent = 'Power cycle recommended';
					window.appendUiBootLog('!!! kernel panic: ' + String(message || 'Interface bootstrap failed.'), FALSE);
					window.appendUiBootLog('!!! emergency stop issued for reactive control surface', TRUE);
					window.setUiLoadingMessage('KERNEL PANIC: ' + String(message || 'Interface bootstrap failed.'));
				} catch (e) {}
			};
			window.hideUiLoading = function()
			{
				try {
					if (document.body)
						document.body.className += (document.body.className ? ' ' : '') + 'ui-ready';
				} catch (e) {}
			};
			document.addEventListener('DOMContentLoaded', function()
			{
				window.setTimeout(function()
				{
					try {
						if (document.body && document.body.className.indexOf('ui-ready') === -1)
							window.setUiLoadingMessage('Awaiting terminal response...');
					} catch (e) {}
				}, 900);
			});
		</script>
		<div id='uiBootSplash' class='uiBootSplash'>
			<div class='uiBootSplash__panel'>
				<div id='uiBootSplashEyebrow' class='uiBootSplash__eyebrow'>NT interface link</div>
				<h1 id='uiBootSplashTitle' class='uiBootSplash__title'>[safe_title]</h1>
				<p id='uiBootSplashMessage' class='uiBootSplash__subtitle'>[safe_subtitle]</p>
				<div class='uiBootSplash__status'>
					<span id='uiBootSplashStatusLeft'>Boot sequence</span>
					<span id='uiBootSplashStatusRight'>0/0 assets (0%)</span>
				</div>
				<div class='uiBootSplash__bar'>
					<span id='uiBootSplashBarFill' class='uiBootSplash__barFill'></span>
				</div>
				<div id='uiBootSplashLog' class='uiBootSplash__log'>
					<div class='uiBootSplash__line'>NTOS BIOS v5.4.12</div>
					<div class='uiBootSplash__line uiBootSplash__line--muted'>Copyright NanoTrasen Integrated Systems</div>
					<div class='uiBootSplash__line'>POST: memory map stable</div>
					<div class='uiBootSplash__line'>POST: reactive terminal bus linked</div>
					<div class='uiBootSplash__line'>POST: awaiting asset stream<span class='uiBootSplash__cursor'></span></div>
				</div>
				<div class='uiBootSplash__foot'>
					<span id='uiBootSplashFootLeft'>Establishing secure terminal session</span>
					<span id='uiBootSplashFootRight'>Please stand by</span>
				</div>
			</div>
		</div>
	"}

/client/proc/asset_v2_note_asset_send(datum/asset_entry_v2/entry, reason)
	if(!istype(entry))
		return

	var/bytes = 0
	if(islist(entry.meta) && isnum(entry.meta["bytes"]))
		bytes = entry.meta["bytes"]
	if(reason == ASSET_V2_REASON_CONNECT)
		asset_v2_metrics["connect_assets"] += 1
		asset_v2_metrics["connect_bytes"] += bytes
	else
		asset_v2_metrics["ondemand_assets"] += 1
		asset_v2_metrics["ondemand_bytes"] += bytes
	asset_v2_debug("sent asset logical_id=[entry.logical_id] key=[entry.key] reason=[reason] bytes=[bytes]", src)

/client/proc/asset_v2_note_pack_send(pack_id, reason)
	if(reason == ASSET_V2_REASON_CONNECT)
		asset_v2_metrics["connect_packs"] += 1
	else
		asset_v2_metrics["ondemand_packs"] += 1
	asset_v2_debug("ensured pack pack_id=[pack_id] reason=[reason]", src)

/client/proc/log_asset_v2_connect_summary()
	log_debug("asset_v2 connect summary for [ckey || key]: packs=[asset_v2_metrics["connect_packs"]] assets=[asset_v2_metrics["connect_assets"]] bytes=[asset_v2_metrics["connect_bytes"]] on_demand_packs=[asset_v2_metrics["ondemand_packs"]] on_demand_assets=[asset_v2_metrics["ondemand_assets"]] on_demand_bytes=[asset_v2_metrics["ondemand_bytes"]]")

/client/proc/log_asset_v2_state(context = "state")
	asset_v2_debug("[context] packs=[asset_v2_debug_list(asset_v2_packs)] logical_ids=[asset_v2_debug_list(asset_v2_sent_logical_ids)] keys=[asset_v2_debug_list(asset_v2_sent_keys)]", src)

/datum/asset_entry_v2
	var/logical_id
	var/key
	var/content_hash
	var/ext = "bin"
	var/backend = ASSET_V2_BACKEND_BYOND_RSC
	var/source
	var/list/meta = list()

/datum/asset_entry_v2/proc/resolve_content()
	if(isfile(source))
		return source
	if(istype(source, /datum/callback))
		return invoke(source)
	return source

/datum/asset_entry_v2/proc/is_equivalent(other_key, other_hash, other_backend)
	return key == other_key && content_hash == other_hash && backend == other_backend

/datum/asset_pack_v2
	var/pack_id
	var/list/assets = list()
	var/list/deps = list()

/proc/get_asset_registry_v2()
	return GET_SINGLETON(/singleton/asset_registry_v2)

/proc/ASSET(logical_id, fallback = null)
	var/singleton/asset_registry_v2/registry = get_asset_registry_v2()
	return registry.resolve_key(logical_id, fallback)

/proc/rewrite_assets_v2(html)
	if(!istext(html) || !length(html))
		return html

	var/token_start = findtext(html, "{{asset:")
	var/rewrite_count = 0
	while(token_start)
		var/token_end = findtext(html, "}}", token_start + 8)
		if(!token_end)
			log_warning("asset_v2 rewrite found unterminated token in html fragment: [asset_v2_debug_value(copytext(html, token_start, min(token_start + 80, length(html) + 1)))]")
			break

		var/logical_id = copytext(html, token_start + 8, token_end)
		var/resolved_key = ASSET(logical_id, logical_id)
		if(resolved_key == logical_id)
			log_warning("asset_v2 rewrite could not resolve logical_id [logical_id]")
		else
			asset_v2_debug("rewrite token logical_id=[logical_id] -> key=[resolved_key]")
		html = "[copytext(html, 1, token_start)][resolved_key][copytext(html, token_end + 2)]"
		token_start = findtext(html, "{{asset:", token_start + length(resolved_key))
		rewrite_count++

	if(rewrite_count)
		asset_v2_debug("rewrite complete tokens=[rewrite_count]")
	return html

/proc/asset_v2_same_list(list/a, list/b)
	if(length(a) != length(b))
		return FALSE
	for(var/value in a)
		if(!(value in b))
			return FALSE
	return TRUE

/proc/asset_v2_get_client(target)
	if(istype(target, /client))
		return target
	if(ismob(target))
		var/mob/M = target
		return M.client
	return null

/proc/asset_v2_get_ext(source, list/meta)
	if(islist(meta) && meta["ext"])
		return lowertext("[meta["ext"]]")
	if(!isfile(source))
		return "bin"

	var/source_text = "[source]"
	var/last_dot = findlasttext(source_text, ".")
	if(!last_dot)
		return "bin"

	return lowertext(copytext(source_text, last_dot + 1))

/proc/asset_v2_logicalize(value)
	var/result = lowertext("[value]")
	result = replacetext(result, "\\", ".")
	result = replacetext(result, "/", ".")
	result = replacetext(result, "-", "_")
	result = replacetext(result, " ", "_")
	return result

/proc/asset_v2_name_ext(asset_name, default_ext = "bin")
	var/name_text = "[asset_name]"
	var/last_dot = findlasttext(name_text, ".")
	if(!last_dot)
		return default_ext
	return lowertext(copytext(name_text, last_dot + 1))

/proc/asset_v2_legacy_logical_id(asset_name, namespace = "legacy.asset")
	var/name_text = "[asset_name]"
	var/safe_name = asset_v2_logicalize(name_text)
	var/name_hash = copytext(md5(name_text), 1, 9)
	return "[namespace].[safe_name].[name_hash]"

/proc/asset_v2_hash_source(logical_id, source, list/meta)
	if(islist(meta) && meta["content_hash"])
		return "[meta["content_hash"]]"
	if(istype(source, /datum/callback))
		log_warning("asset_v2 missing content hash for callback-backed asset [logical_id]")
		return null

	var/copied_resource = fcopy_rsc(source)
	if(copied_resource)
		return sha1(copied_resource)

	log_warning("asset_v2 missing content hash for [logical_id]; leaving this asset on legacy path is recommended.")
	return null

/singleton/asset_registry_v2
	var/list/assets_by_logical_id = list()
	var/list/assets_by_key = list()
	var/list/packs = list()
	var/loaded = FALSE

/singleton/asset_registry_v2/proc/load()
	if(loaded)
		return

	loaded = TRUE
	asset_v2_debug("load start")
	register_defaults()
	asset_v2_debug("load complete assets=[length(assets_by_logical_id)] packs=[length(packs)]")

/singleton/asset_registry_v2/proc/register(logical_id, source, list/meta = null)
	if(!logical_id)
		return null

	var/list/asset_meta = islist(meta) ? meta.Copy() : list()
	var/allow_replace = FALSE
	if(asset_meta["allow_replace"])
		allow_replace = TRUE
	var/ext = asset_v2_get_ext(source, asset_meta)
	var/backend = asset_meta["backend"] || ASSET_V2_BACKEND_BYOND_RSC
	var/content_hash = asset_v2_hash_source(logical_id, source, asset_meta)
	if(!content_hash)
		return null

	var/key = asset_meta["key"] || "asset.[content_hash].[ext]"
	asset_v2_debug("register request logical_id=[logical_id] key=[key] backend=[backend] source=[asset_v2_debug_value(source)]")
	var/datum/asset_entry_v2/existing = assets_by_logical_id[logical_id]
	if(existing)
		if(existing.is_equivalent(key, content_hash, backend))
			asset_v2_debug("register reused logical_id=[logical_id] key=[key]")
			return existing

		if(allow_replace)
			var/datum/asset_entry_v2/by_key_for_replace = assets_by_key[key]
			if(by_key_for_replace && by_key_for_replace != existing)
				log_warning("asset_v2 replace key collision for [key]: existing=[by_key_for_replace.logical_id] new=[logical_id]")
				return by_key_for_replace

			var/old_key = existing.key
			var/old_hash = existing.content_hash
			if(old_key != key)
				assets_by_key -= old_key

			existing.key = key
			existing.content_hash = content_hash
			existing.ext = ext
			existing.backend = backend
			existing.source = source
			existing.meta = asset_meta
			assets_by_key[key] = existing
			if(old_key != key || old_hash != content_hash)
				invalidate_key_for_clients(old_key, logical_id)
				if(old_key != key)
					invalidate_key_for_clients(key, logical_id)
			asset_v2_debug("register replaced logical_id=[logical_id] old_key=[old_key] new_key=[key]")
			return existing

		log_warning("asset_v2 logical_id collision for [logical_id]: existing=[existing.key] new=[key]")
		return existing

	var/datum/asset_entry_v2/by_key = assets_by_key[key]
	if(by_key && by_key.logical_id != logical_id)
		log_warning("asset_v2 key collision for [key]: existing=[by_key.logical_id] new=[logical_id]")
		return by_key

	var/datum/asset_entry_v2/entry = new
	entry.logical_id = logical_id
	entry.key = key
	entry.content_hash = content_hash
	entry.ext = ext
	entry.backend = backend
	entry.source = source
	entry.meta = asset_meta

	assets_by_logical_id[logical_id] = entry
	assets_by_key[key] = entry
	asset_v2_debug("register success logical_id=[logical_id] key=[key] ext=[ext]")
	return entry

/singleton/asset_registry_v2/proc/invalidate_key_for_clients(key, logical_id = null)
	if(!length("[key]"))
		return

	for(var/client/C in GLOB.clients)
		C.asset_v2_sent_keys -= key
		C.cache -= key
		if(logical_id)
			C.asset_v2_sent_logical_ids -= logical_id

	asset_v2_debug("invalidate key=[key] logical_id=[logical_id || "none"]")

/singleton/asset_registry_v2/proc/dev_reregister_file_asset(logical_id)
	var/datum/asset_entry_v2/existing = assets_by_logical_id[logical_id]
	if(!istype(existing) || !isfile(existing.source))
		return FALSE

	var/list/reload_meta = islist(existing.meta) ? existing.meta.Copy() : list()
	reload_meta["allow_replace"] = TRUE
	return !!register(logical_id, existing.source, reload_meta)

/singleton/asset_registry_v2/proc/dev_reregister_file_assets()
	. = 0
	var/list/logical_ids = assets_by_logical_id.Copy()
	for(var/logical_id in logical_ids)
		if(dev_reregister_file_asset(logical_id))
			.++
	asset_v2_debug("dev_reregister_file_assets complete rescanned=[.]")

/singleton/asset_registry_v2/proc/register_file(logical_id, asset_file, list/meta = null)
	if(!isfile(asset_file))
		log_warning("asset_v2 expected file-backed asset for [logical_id], got [asset_file]")
		return null
	if(!fexists(asset_file))
		log_warning("asset_v2 file for [logical_id] does not exist: [asset_file]")
		return null

	asset_v2_debug("register file logical_id=[logical_id] path=[asset_file]")
	return register(logical_id, asset_file, meta)

/singleton/asset_registry_v2/proc/define_pack(pack_id, list/assets = null, list/deps = null)
	var/list/pack_assets = islist(assets) ? assets.Copy() : list()
	var/list/pack_deps = islist(deps) ? deps.Copy() : list()
	var/datum/asset_pack_v2/existing = packs[pack_id]
	if(existing)
		if(asset_v2_same_list(existing.assets, pack_assets) && asset_v2_same_list(existing.deps, pack_deps))
			asset_v2_debug("define_pack reused pack_id=[pack_id] assets=[asset_v2_debug_list(pack_assets)] deps=[asset_v2_debug_list(pack_deps)]")
			return existing

		log_warning("asset_v2 pack collision for [pack_id]")
		return existing

	var/datum/asset_pack_v2/pack = new
	pack.pack_id = pack_id
	pack.assets = pack_assets
	pack.deps = pack_deps
	packs[pack_id] = pack
	asset_v2_debug("define_pack success pack_id=[pack_id] assets=[asset_v2_debug_list(pack_assets)] deps=[asset_v2_debug_list(pack_deps)]")
	return pack

/singleton/asset_registry_v2/proc/resolve_key(logical_id, fallback = null)
	var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
	if(entry)
		asset_v2_debug("resolve_key hit logical_id=[logical_id] key=[entry.key]")
		return entry.key
	asset_v2_debug("resolve_key miss logical_id=[logical_id] fallback=[fallback]")
	return isnull(fallback) ? logical_id : fallback

/singleton/asset_registry_v2/proc/send_entries(target, list/entries, reason = ASSET_V2_REASON_ONDEMAND, verify = FALSE)
	var/client/C = asset_v2_get_client(target)
	if(!C)
		return null
	if(!islist(entries) || !length(entries))
		return 0

	var/list/pending_entries = list()
	var/list/pending_keys = list()
	for(var/datum/asset_entry_v2/entry as anything in entries)
		if(!istype(entry))
			continue
		if(C.asset_v2_sent_keys[entry.key])
			asset_v2_debug("send_entries skip already-sent logical_id=[entry.logical_id] key=[entry.key]", C)
			continue
		if(entry.key in pending_keys)
			continue

		var/content = entry.resolve_content()
		if(isnull(content))
			log_warning("asset_v2 failed to resolve content for [entry.logical_id]")
			return null

		send_rsc(C, content, entry.key)
		pending_entries += entry
		pending_keys += entry.key

	if(!length(pending_entries))
		return 0

	if(verify && !asset_cache_wait_for_confirm(C, pending_keys))
		return null

	for(var/datum/asset_entry_v2/entry as anything in pending_entries)
		C.asset_v2_sent_keys[entry.key] = TRUE
		C.asset_v2_sent_logical_ids[entry.logical_id] = entry.key
		if(verify)
			C.cache |= entry.key
		C.asset_v2_note_asset_send(entry, reason)

	return length(pending_entries)

/singleton/asset_registry_v2/proc/ensure_asset(target, logical_id, reason = ASSET_V2_REASON_ONDEMAND)
	var/client/C = asset_v2_get_client(target)
	if(!C)
		return FALSE

	asset_v2_debug("ensure_asset start logical_id=[logical_id] reason=[reason]", C)
	var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
	if(!entry)
		log_warning("asset_v2 missing asset [logical_id]")
		return FALSE

	var/sent = send_entries(C, list(entry), reason, FALSE)
	return !isnull(sent) && sent > 0

/singleton/asset_registry_v2/proc/ensure_asset_verified(target, logical_id, reason = ASSET_V2_REASON_ONDEMAND)
	var/client/C = asset_v2_get_client(target)
	if(!C)
		return FALSE

	asset_v2_debug("ensure_asset_verified start logical_id=[logical_id] reason=[reason]", C)
	var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
	if(!entry)
		log_warning("asset_v2 missing asset [logical_id]")
		return FALSE

	var/sent = send_entries(C, list(entry), reason, TRUE)
	return !isnull(sent) && sent > 0

/singleton/asset_registry_v2/proc/ensure_pack_internal(target, pack_id, reason = ASSET_V2_REASON_ONDEMAND, list/visiting = null, verify = FALSE)
	var/client/C = asset_v2_get_client(target)
	if(!C)
		return 0

	var/mode = verify ? "verified" : "async"
	asset_v2_debug("ensure_pack_internal start pack_id=[pack_id] reason=[reason] mode=[mode]", C)
	var/datum/asset_pack_v2/pack = packs[pack_id]
	if(!pack)
		log_warning("asset_v2 missing pack [pack_id]")
		return 0
	if(C.asset_v2_packs[pack_id])
		asset_v2_debug("ensure_pack_internal skip already-ensured pack_id=[pack_id] mode=[mode]", C)
		return 0

	if(!islist(visiting))
		visiting = list()
	if(visiting[pack_id])
		log_warning("asset_v2 dependency cycle detected for pack [pack_id]")
		return 0

	visiting[pack_id] = TRUE
	var/sent = 0
	var/ok = TRUE
	for(var/dep_id in pack.deps)
		asset_v2_debug("ensure_pack_internal dependency parent=[pack_id] dep=[dep_id] mode=[mode]", C)
		sent += ensure_pack_internal(C, dep_id, reason, visiting, verify)
		if(!C.asset_v2_packs[dep_id])
			ok = FALSE

	var/list/pending_entries = list()
	for(var/logical_id in pack.assets)
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!entry)
			log_warning("asset_v2 missing asset [logical_id]")
			ok = FALSE
			continue
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	var/send_result = send_entries(C, pending_entries, reason, verify)
	if(isnull(send_result))
		ok = FALSE
	else
		sent += send_result

	visiting[pack_id] = null
	if(ok)
		C.asset_v2_packs[pack_id] = TRUE
		C.asset_v2_note_pack_send(pack_id, reason)
	asset_v2_debug("ensure_pack_internal complete pack_id=[pack_id] sent_assets=[sent] mode=[mode] ok=[ok]", C)
	return sent

/singleton/asset_registry_v2/proc/ensure_pack(target, pack_id, reason = ASSET_V2_REASON_ONDEMAND, list/visiting = null)
	return ensure_pack_internal(target, pack_id, reason, visiting, FALSE)

/singleton/asset_registry_v2/proc/ensure_pack_verified(target, pack_id, reason = ASSET_V2_REASON_ONDEMAND, list/visiting = null)
	return ensure_pack_internal(target, pack_id, reason, visiting, TRUE)

/singleton/asset_registry_v2/proc/ensure_sui_interface_registered(interface_name)
	var/safe_name = lowertext("[interface_name]")
	var/logical_id = "sui.interface.[safe_name]"
	if(assets_by_logical_id[logical_id])
		asset_v2_debug("ensure_sui_interface_registered reused interface=[interface_name] logical_id=[logical_id]")
		return logical_id

	var/interface_file = file("mods/sui/js/sui_[safe_name].js")
	if(!fexists(interface_file))
		asset_v2_debug("ensure_sui_interface_registered missing interface=[interface_name] path=[interface_file]")
		return null

	if(register_file(logical_id, interface_file, list("ext" = "js")))
		asset_v2_debug("ensure_sui_interface_registered success interface=[interface_name] logical_id=[logical_id] path=[interface_file]")
		return logical_id
	return null

/singleton/asset_registry_v2/proc/register_dynamic_file(logical_id, relative_path)
	var/asset_file = file(relative_path)
	if(!fexists(asset_file))
		asset_v2_debug("register_dynamic_file miss logical_id=[logical_id] path=[relative_path]")
		return null

	asset_v2_debug("register_dynamic_file hit logical_id=[logical_id] path=[relative_path]")
	if(register_file(logical_id, asset_file))
		return logical_id
	return null

/singleton/asset_registry_v2/proc/register_legacy_named_asset(asset_name, asset, namespace = "legacy.asset")
	if(!length("[asset_name]"))
		return null

	var/logical_id = asset_v2_legacy_logical_id(asset_name, namespace)
	var/list/meta = list(
		"key" = "[asset_name]",
		"ext" = asset_v2_name_ext(asset_name),
		"allow_replace" = TRUE
	)
	var/datum/asset_entry_v2/entry = register(logical_id, asset, meta)
	if(entry)
		asset_v2_debug("register_legacy_named_asset name=[asset_name] logical_id=[logical_id] key=[entry.key]")
		return logical_id
	return null

/singleton/asset_registry_v2/proc/add_legacy_assets_from_dir(relative_dir, list/pack_assets, namespace = "legacy.asset")
	if(!islist(pack_assets))
		return

	var/list/filenames = flist(relative_dir)
	var/list/seen_names = list()
	for(var/filename in filenames)
		if(copytext(filename, -1) == "/")
			continue
		if(seen_names[filename])
			log_warning("asset_v2 duplicate legacy asset filename in [relative_dir]: [filename]")
			continue
		seen_names[filename] = TRUE

		var/logical_id = asset_v2_legacy_logical_id(filename, namespace)
		var/asset_file = file("[relative_dir][filename]")
		if(!fexists(asset_file))
			continue

		var/datum/asset_entry_v2/existing = assets_by_logical_id[logical_id]
		if(!existing)
			logical_id = register_legacy_named_asset(filename, asset_file, namespace)
		else
			var/list/meta = list(
				"key" = "[filename]",
				"ext" = asset_v2_name_ext(filename),
				"allow_replace" = TRUE
			)
			var/content_hash = asset_v2_hash_source(logical_id, asset_file, meta)
			if(content_hash && existing.is_equivalent(filename, content_hash, ASSET_V2_BACKEND_BYOND_RSC))
				asset_v2_debug("duplicate legacy asset filename [filename] from [relative_dir] matched existing registration")
			else
				log_warning("asset_v2 duplicate legacy asset filename [filename] from [relative_dir], keeping existing registration")

		if(logical_id && !(logical_id in pack_assets))
			pack_assets += logical_id

/singleton/asset_registry_v2/proc/ensure_legacy_named_asset(target, asset_name, asset = null, reason = ASSET_V2_REASON_LEGACY, namespace = "legacy.asset")
	var/logical_id = asset_v2_legacy_logical_id(asset_name, namespace)
	if(!assets_by_logical_id[logical_id])
		if(isnull(asset))
			log_warning("asset_v2 missing legacy named asset [asset_name] namespace=[namespace]")
			return FALSE
		logical_id = register_legacy_named_asset(asset_name, asset, namespace)
	else if(!isnull(asset))
		logical_id = register_legacy_named_asset(asset_name, asset, namespace)

	if(!logical_id)
		return FALSE
	return ensure_asset(target, logical_id, reason)

/singleton/asset_registry_v2/proc/get_nanoui_static_logical_id(filename)
	switch(filename)
		if("libraries.min.js")
			return "nano.js.libraries_min"
		if("morphdom.min.js")
			return "nano.js.morphdom_min"
		if("nano_utility.js")
			return "nano.js.nano_utility"
		if("nano_template.js")
			return "nano.js.nano_template"
		if("nano_state_manager.js")
			return "nano.js.nano_state_manager"
		if("nano_state.js")
			return "nano.js.nano_state"
		if("nano_state_default.js")
			return "nano.js.nano_state_default"
		if("nano_base_callbacks.js")
			return "nano.js.nano_base_callbacks"
		if("nano_base_helpers.js")
			return "nano.js.nano_base_helpers"
		if("shared.css")
			return "nano.css.shared"
		if("icons.css")
			return "nano.css.icons"
	return null

/singleton/asset_registry_v2/proc/ensure_nanoui_filename_registered(filename)
	var/logical_id = get_nanoui_static_logical_id(filename)
	if(logical_id)
		asset_v2_debug("ensure_nanoui_filename_registered static filename=[filename] logical_id=[logical_id]")
		return logical_id

	if(findtext(filename, "mods-") == 1)
		var/mod_template = copytext(filename, 6)
		logical_id = "mods.nanoui.template.[asset_v2_logicalize(mod_template)]"
		logical_id = register_dynamic_file(logical_id, "nano/templates/mods/[mod_template]")
		if(logical_id)
			asset_v2_debug("ensure_nanoui_filename_registered mod template filename=[filename] logical_id=[logical_id]")
		else
			asset_v2_debug("ensure_nanoui_filename_registered mod template miss filename=[filename]")
		return logical_id

	logical_id = "nano.js.[asset_v2_logicalize(filename)]"
	if(register_dynamic_file(logical_id, "nano/js/[filename]"))
		asset_v2_debug("ensure_nanoui_filename_registered js filename=[filename] logical_id=[logical_id]")
		return logical_id

	logical_id = "nano.js.library.[asset_v2_logicalize(filename)]"
	if(register_dynamic_file(logical_id, "nano/js/libraries/[filename]"))
		asset_v2_debug("ensure_nanoui_filename_registered js library filename=[filename] logical_id=[logical_id]")
		return logical_id

	logical_id = "nano.css.[asset_v2_logicalize(filename)]"
	if(register_dynamic_file(logical_id, "nano/css/[filename]"))
		asset_v2_debug("ensure_nanoui_filename_registered css filename=[filename] logical_id=[logical_id]")
		return logical_id

	logical_id = "nano.template.[asset_v2_logicalize(filename)]"
	if(register_dynamic_file(logical_id, "nano/templates/[filename]"))
		asset_v2_debug("ensure_nanoui_filename_registered template filename=[filename] logical_id=[logical_id]")
		return logical_id

	asset_v2_debug("ensure_nanoui_filename_registered miss filename=[filename]")
	return null

/singleton/asset_registry_v2/proc/ensure_nanoui_ui(target, datum/nanoui/ui)
	var/client/C = asset_v2_get_client(target)
	if(!C || !istype(ui))
		return 0

	asset_v2_debug("ensure_nanoui_ui start window=[ui.window_id] title=[asset_v2_debug_value(ui.title)] scripts=[asset_v2_debug_list(ui.scripts)] styles=[asset_v2_debug_list(ui.stylesheets)] templates=[asset_v2_debug_list(ui.templates)]", C)
	var/sent = ensure_pack(C, ASSET_PACK_NANOUI_COMMON)

	for(var/filename in ui.scripts)
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(logical_id)
			sent += ensure_asset(C, logical_id)

	for(var/filename in ui.stylesheets)
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(logical_id)
			sent += ensure_asset(C, logical_id)

	for(var/key in ui.templates)
		var/template_filename = ui.templates[key]
		var/logical_id = ensure_nanoui_filename_registered(template_filename)
		if(logical_id)
			sent += ensure_asset(C, logical_id)

	asset_v2_debug("ensure_nanoui_ui complete window=[ui.window_id] sent_assets=[sent]", C)
	return sent

/singleton/asset_registry_v2/proc/ensure_nanoui_ui_verified(target, datum/nanoui/ui)
	var/client/C = asset_v2_get_client(target)
	if(!C || !istype(ui))
		return null

	asset_v2_debug("ensure_nanoui_ui_verified start window=[ui.window_id] title=[asset_v2_debug_value(ui.title)] scripts=[asset_v2_debug_list(ui.scripts)] styles=[asset_v2_debug_list(ui.stylesheets)] templates=[asset_v2_debug_list(ui.templates)]", C)
	var/sent = ensure_pack_verified(C, ASSET_PACK_NANOUI_COMMON)
	if(!C.asset_v2_packs[ASSET_PACK_NANOUI_COMMON])
		return null

	var/list/pending_entries = list()
	var/list/required_entries = list()
	var/ok = TRUE

	for(var/filename in ui.scripts)
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	for(var/filename in ui.stylesheets)
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	for(var/key in ui.templates)
		var/template_filename = ui.templates[key]
		var/logical_id = ensure_nanoui_filename_registered(template_filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	if(!ok)
		return null

	var/send_result = send_entries(C, pending_entries, ASSET_V2_REASON_ONDEMAND, TRUE)
	if(isnull(send_result))
		return null
	sent += send_result

	for(var/datum/asset_entry_v2/entry as anything in required_entries)
		if(!C.asset_v2_sent_keys[entry.key])
			return null

	asset_v2_debug("ensure_nanoui_ui_verified complete window=[ui.window_id] sent_assets=[sent]", C)
	return sent

/singleton/asset_registry_v2/proc/ensure_nanoui_compat_ui_verified(target, datum/nanoui/ui)
	var/client/C = asset_v2_get_client(target)
	if(!C || !istype(ui))
		return null

	asset_v2_debug("ensure_nanoui_compat_ui_verified start window=[ui.window_id] title=[asset_v2_debug_value(ui.title)] scripts=[asset_v2_debug_list(ui.scripts)] styles=[asset_v2_debug_list(ui.stylesheets)] templates=[asset_v2_debug_list(ui.templates)]", C)
	var/sent = ensure_pack_verified(C, ASSET_PACK_NANOUI_COMPAT)
	if(!C.asset_v2_packs[ASSET_PACK_NANOUI_COMPAT])
		return null

	var/interface_asset_id = ensure_sui_interface_registered("NanoCompat")
	if(!interface_asset_id)
		return null
	ensure_asset_verified(C, interface_asset_id)
	var/datum/asset_entry_v2/interface_entry = assets_by_logical_id[interface_asset_id]
	if(!istype(interface_entry) || !C.asset_v2_sent_keys[interface_entry.key])
		return null

	var/list/pending_entries = list()
	var/list/required_entries = list(interface_entry)
	var/ok = TRUE

	for(var/filename in ui.scripts)
		if(nanoui_compat_skip_script(filename))
			continue
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	for(var/filename in ui.stylesheets)
		if(nanoui_compat_skip_stylesheet(filename))
			continue
		var/logical_id = ensure_nanoui_filename_registered(filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	for(var/key in ui.templates)
		var/template_filename = ui.templates[key]
		var/logical_id = ensure_nanoui_filename_registered(template_filename)
		if(!logical_id)
			ok = FALSE
			continue
		var/datum/asset_entry_v2/entry = assets_by_logical_id[logical_id]
		if(!istype(entry))
			ok = FALSE
			continue
		required_entries |= entry
		if(!C.asset_v2_sent_keys[entry.key])
			pending_entries += entry

	if(!ok)
		return null

	var/send_result = send_entries(C, pending_entries, ASSET_V2_REASON_ONDEMAND, TRUE)
	if(isnull(send_result))
		return null
	sent += send_result

	for(var/datum/asset_entry_v2/entry as anything in required_entries)
		if(!C.asset_v2_sent_keys[entry.key])
			return null

	asset_v2_debug("ensure_nanoui_compat_ui_verified complete window=[ui.window_id] sent_assets=[sent]", C)
	return sent

/singleton/asset_registry_v2/proc/register_defaults()
	asset_v2_debug("register_defaults start")
	register_file("chat.js.jquery_min", 'code/modules/goonchat/browserassets/js/jquery.min.js')
	register_file("chat.js.json2_min", 'code/modules/goonchat/browserassets/js/json2.min.js')
	register_file("chat.js.browser_output", 'code/modules/goonchat/browserassets/js/browserOutput.js')
	register_file("chat.css.browser_output", 'code/modules/goonchat/browserassets/css/browserOutput.css')
	register_file("chat.css.browser_output_white", 'code/modules/goonchat/browserassets/css/browserOutput_white.css')

	register_file("login.fontawesome.css", 'html/font-awesome/css/all.min.css')
	register_file("login.fontawesome.v4shim_css", 'html/font-awesome/css/v4-shims.min.css')
	register_file("login.fontawesome.fa_regular_400_eot", 'html/font-awesome/webfonts/fa-regular-400.eot')
	register_file("login.fontawesome.fa_regular_400_woff", 'html/font-awesome/webfonts/fa-regular-400.woff')
	register_file("login.fontawesome.fa_solid_900_eot", 'html/font-awesome/webfonts/fa-solid-900.eot')
	register_file("login.fontawesome.fa_solid_900_woff", 'html/font-awesome/webfonts/fa-solid-900.woff')
	register_file("mods.lobbyscreen.fontawesome.fa_brands_400_eot", 'mods/lobbyscreen/html/font-awesome/fa-brands-400.eot')
	register_file("mods.lobbyscreen.fontawesome.fa_brands_400_woff", 'mods/lobbyscreen/html/font-awesome/fa-brands-400.woff')
	register_file("mods.lobbyscreen.font.round_control", 'mods/lobbyscreen/html/fonts/round-control.woff')
	register_file("mods.lobbyscreen.font.courierprime_code", 'mods/lobbyscreen/html/fonts/courierprime-code.woff')
	register_file("mods.lobbyscreen.image.light_left", 'mods/lobbyscreen/html/assets/light_left.png')
	register_file("mods.lobbyscreen.image.light_right", 'mods/lobbyscreen/html/assets/light_right.png')
	register_file("mods.lobbyscreen.image.smallbutton", 'mods/lobbyscreen/html/assets/smallbutton.png')
	register_file("mods.lobbyscreen.video.buttons", 'mods/lobbyscreen/html/assets/buttons.mp4')
	register_file("mods.lobbyscreen.video.loop", 'mods/lobbyscreen/html/assets/loop.mp4')

	register_file("nano.js.libraries_min", 'nano/js/libraries.min.js')
	register_file("nano.js.morphdom_min", 'nano/js/libraries/morphdom.min.js')
	register_file("nano.js.nano_utility", 'nano/js/nano_utility.js')
	register_dynamic_file("nano.js.nano_template", "nano/js/nano_template.js")
	register_dynamic_file("nano.js.nano_state_manager", "nano/js/nano_state_manager.js")
	register_file("nano.js.nano_state", 'nano/js/nano_state.js')
	register_file("nano.js.nano_state_default", 'nano/js/nano_state_default.js')
	register_file("nano.js.nano_base_callbacks", 'nano/js/nano_base_callbacks.js')
	register_file("nano.js.nano_base_helpers", 'nano/js/nano_base_helpers.js')
	register_file("nano.css.shared", 'nano/css/shared.css')
	register_file("nano.css.icons", 'nano/css/icons.css')

	register_file("sui.js.preact_min", 'mods/sui/js/libraries/preact.min.js')
	register_file("sui.js.preact_hooks_min", 'mods/sui/js/libraries/preact-hooks.min.js')
	register_dynamic_file("sui.js.core", "mods/sui/js/sui.js")
	register_dynamic_file("sui.js.components", "mods/sui/js/sui_components.js")
	register_dynamic_file("sui.js.ntos_common", "mods/sui/js/sui_ntos_common.js")

	define_pack(ASSET_PACK_CORE_BOOTSTRAP, list())
	define_pack(ASSET_PACK_LOGIN_BRANDING, list(
		"login.fontawesome.css",
		"login.fontawesome.v4shim_css",
		"login.fontawesome.fa_regular_400_eot",
		"login.fontawesome.fa_regular_400_woff",
		"login.fontawesome.fa_solid_900_eot",
		"login.fontawesome.fa_solid_900_woff",
		"mods.lobbyscreen.fontawesome.fa_brands_400_eot",
		"mods.lobbyscreen.fontawesome.fa_brands_400_woff",
		"mods.lobbyscreen.font.round_control",
		"mods.lobbyscreen.font.courierprime_code",
		"mods.lobbyscreen.image.light_left",
		"mods.lobbyscreen.image.light_right",
		"mods.lobbyscreen.image.smallbutton",
		"mods.lobbyscreen.video.buttons",
		"mods.lobbyscreen.video.loop"
	))
	define_pack(ASSET_PACK_GOONCHAT, list(
		"chat.js.jquery_min",
		"chat.js.json2_min",
		"chat.js.browser_output",
		"chat.css.browser_output",
		"chat.css.browser_output_white",
		"login.fontawesome.css",
		"login.fontawesome.fa_regular_400_eot",
		"login.fontawesome.fa_regular_400_woff",
		"login.fontawesome.fa_solid_900_eot",
		"login.fontawesome.fa_solid_900_woff",
		"mods.lobbyscreen.fontawesome.fa_brands_400_eot",
		"mods.lobbyscreen.fontawesome.fa_brands_400_woff"
	))
	var/list/browser_shared_assets = list(
		"nano.js.libraries_min",
		"nano.css.shared",
		"nano.css.icons"
	)
	define_pack(ASSET_PACK_BROWSER_SHARED, browser_shared_assets)

	var/list/nanoui_common_assets = list(
		"nano.js.morphdom_min",
		"nano.js.nano_utility",
		"nano.js.nano_template",
		"nano.js.nano_state_manager",
		"nano.js.nano_state",
		"nano.js.nano_state_default",
		"nano.js.nano_base_callbacks",
		"nano.js.nano_base_helpers"
	)
	add_legacy_assets_from_dir("nano/images/", nanoui_common_assets)
	add_legacy_assets_from_dir("nano/images/status_icons/", nanoui_common_assets)
	add_legacy_assets_from_dir("nano/images/modular_computers/", nanoui_common_assets)
	define_pack(ASSET_PACK_NANOUI_COMMON, nanoui_common_assets, list(
		ASSET_PACK_BROWSER_SHARED
	))
	define_pack(ASSET_PACK_NANOUI_COMPAT, list(
		"nano.js.morphdom_min"
	), list(
		ASSET_PACK_SUI_COMMON
	))
	define_pack(ASSET_PACK_SUI_COMMON, list(
		"sui.js.preact_min",
		"sui.js.preact_hooks_min",
		"sui.js.core",
		"sui.js.components",
		"sui.js.ntos_common"
	), list(
		ASSET_PACK_BROWSER_SHARED
	))
	asset_v2_debug("register_defaults complete")
