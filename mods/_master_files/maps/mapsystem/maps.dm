/datum/map
	var/shuttle_docked_sound
	var/shuttle_leaving_dock_sound
	var/shuttle_called_sound
	var/shuttle_recall_sound

/datum/map/New()
	. = ..()
	base_lobby_html = file2text('mods/lobbyscreen/html/lobby.html')

// Hard overwrite - doesn't call parent
/datum/map/show_titlescreen(client/C)
	set waitfor = FALSE

	if(isnewplayer(C.mob))
		var/singleton/asset_registry_v2/asset_registry_v2 = GET_SINGLETON(/singleton/asset_registry_v2)
		asset_registry_v2.ensure_pack(C, "login_branding")
		if(!C.asset_v2_packs["login_branding"])
			asset_v2_debug("titlescreen abort undelivered login_branding pack", C)
			winset(C, "lobbybrowser", "is-visible=false")
			return

	winset(C, "lobbybrowser", "is-disabled=false;is-visible=true")

	var/mob/new_player/player = C.mob
	show_browser(C, rewrite_assets_v2(replacetext_char(base_lobby_html, "\[player-ref]", "\ref[player]")), "window=lobbybrowser")
	update_titlescreen(C)
