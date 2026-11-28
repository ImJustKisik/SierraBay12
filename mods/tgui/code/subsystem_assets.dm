SUBSYSTEM_DEF(assets)
	name = "Assets"
	init_order = SS_INIT_ASSETS
	flags = SS_NO_FIRE
	var/list/datum/asset_cache_item/cache = list()
	var/list/preload = list()
	/// Precomputed local_name -> hash map for O(client_cache) preload validation.
	var/list/preload_lookup = list()
	/// Only the explicit connection manifest, keyed by compiled resource identity (not basename).
	/// Rebuilt on world restart; mutable paths and generated assets are not cached here.
	var/list/client_resources = list()
	var/datum/asset_transport/transport = new()

/datum/controller/subsystem/assets/Initialize(timeofday)
	load_assets()
	apply_configuration()
	prepare_client_resources()
	transport.preload = build_preload_assets()
	rebuild_preload_lookup()
	log_debug("Asset transport active: [transport.type] (requested: [config.asset_transport])")

/datum/controller/subsystem/assets/proc/index_preload_asset(datum/asset_cache_item/item, datum/asset_transport/active_transport = transport)
	var/static/list/ignored_exts = list(".js", ".jsm", ".htm", ".html")
	if(!istype(item) || !item.hash)
		return
	if(istype(active_transport, /datum/asset_transport/webroot) && !item.legacy)
		return
	if(lowertext(item.ext) in ignored_exts)
		return
	var/local_name = (item.legacy || item.keep_local_name || (item.namespace && !item.namespace_parent) || active_transport.dont_mutate_filenames) ? item.name : "asset.[item.hash][item.ext]"
	if(!preload_lookup)
		preload_lookup = list()
	preload_lookup[local_name] = item.hash

/datum/controller/subsystem/assets/proc/rebuild_preload_lookup()
	preload_lookup = list()
	for(var/asset_name in cache)
		index_preload_asset(cache[asset_name])

/// Builds the lightweight connection preload list, excluding on-demand design icons and non-layout UI templates.
/datum/controller/subsystem/assets/proc/build_preload_assets()
	var/list/excluded = list()
	var/datum/asset/simple/designs = get_asset_datum(/datum/asset/simple/sierra_designs)
	if(designs?.assets)
		for(var/asset_name in designs.assets)
			excluded[asset_name] = TRUE
	var/datum/asset/simple/templates = get_asset_datum(/datum/asset/simple/nanoui_templates)
	if(templates?.assets)
		for(var/asset_name in templates.assets)
			if(copytext(asset_name, 1, 8) != "layout_")
				excluded[asset_name] = TRUE
	var/list/preload_assets = list()
	for(var/asset_name in cache)
		if(!excluded[asset_name])
			preload_assets[asset_name] = cache[asset_name]
	return preload_assets

/datum/controller/subsystem/assets/Recover()
	cache = SSassets.cache
	preload = SSassets.preload
	preload_lookup = SSassets.preload_lookup
	client_resources = SSassets.client_resources
	qdel(transport)
	transport = SSassets.transport

/datum/controller/subsystem/assets/proc/apply_configuration()
	var/newtransporttype = /datum/asset_transport
	if(config.asset_transport == "webroot")
		newtransporttype = /datum/asset_transport/webroot

	if(newtransporttype == transport.type)
		return

	var/datum/asset_transport/newtransport = new newtransporttype
	if(newtransport.validate_config())
		qdel(transport)
		transport = newtransport
	else
		qdel(newtransport)

	transport.Initialize(cache)
	rebuild_preload_lookup()

/datum/controller/subsystem/assets/proc/prepare_client_resources()
	for(var/resource in client_resource_files() + changelog_resource_files())
		var/resource_path = "[resource]"
		if(client_resources[resource])
			continue
		var/asset_name = copytext(resource_path, findlasttext(resource_path, "/") + 1)
		client_resources[resource] = register_asset(asset_name, resource)

/datum/controller/subsystem/assets/proc/load_assets()
	for(var/datum/asset/asset_type as anything in typesof(/datum/asset))
		if(asset_type == initial(asset_type._abstract))
			continue

		get_asset_datum(asset_type)

	transport.Initialize(cache)
