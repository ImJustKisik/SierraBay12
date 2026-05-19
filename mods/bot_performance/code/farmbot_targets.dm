/datum/farmbot_target_bus

GLOBAL_TYPED_NEW(farmbot_target_bus, /datum/farmbot_target_bus)
GLOBAL_LIST_EMPTY(farmbot_attention_targets)

/obj/machinery/portable_atmospherics/hydroponics
	/// Cached raw farmbot attention flags. Per-bot policy is still filtered through /mob/living/bot/farmbot/confirmTarget().
	var/farmbot_attention_flags = 0

/obj/machinery/portable_atmospherics/hydroponics/proc/get_farmbot_attention_flags()
	if(closed_system || !seed)
		return 0

	. = 0
	if(dead || harvest)
		. |= FARMBOT_ATTENTION_COLLECT
	if(waterlevel < 40 && !reagents.has_reagent(/datum/reagent/water))
		. |= FARMBOT_ATTENTION_WATER
	if(weedlevel > 3)
		. |= FARMBOT_ATTENTION_UPROOT
	if(nutrilevel < 1 && reagents.total_volume < 1)
		. |= FARMBOT_ATTENTION_NUTRIMENT

/obj/machinery/portable_atmospherics/hydroponics/proc/update_farmbot_attention()
	var/new_flags = get_farmbot_attention_flags()
	if(new_flags == farmbot_attention_flags)
		return

	farmbot_attention_flags = new_flags
	if(new_flags)
		GLOB.farmbot_attention_targets[src] = new_flags
		SEND_SIGNAL(GLOB.farmbot_target_bus, COMSIG_FARMBOT_TARGET_AVAILABLE, src, new_flags)
	else
		GLOB.farmbot_attention_targets -= src
		SEND_SIGNAL(GLOB.farmbot_target_bus, COMSIG_FARMBOT_TARGET_CLEARED, src)

/obj/machinery/portable_atmospherics/hydroponics/Initialize()
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/LateInitialize(mapload)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/Destroy()
	if(farmbot_attention_flags)
		farmbot_attention_flags = 0
		GLOB.farmbot_attention_targets -= src
		SEND_SIGNAL(GLOB.farmbot_target_bus, COMSIG_FARMBOT_TARGET_CLEARED, src)
	return ..()

/obj/machinery/portable_atmospherics/hydroponics/proc/check_health(icon_update = 1)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/die()
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/harvest(mob/user)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/remove_dead(mob/user, silent)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/weed_invasion()
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/mutate(severity)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/mutate_species()
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/plant_seed(mob/user, obj/item/seeds/S)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/plant()
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/proc/close_lid(mob/living/user)
	. = ..()
	update_farmbot_attention()

/obj/machinery/portable_atmospherics/hydroponics/use_tool(obj/item/O, mob/living/user, list/click_params)
	. = ..()
	update_farmbot_attention()

/mob/living/bot/farmbot
	uses_guarded_ai = TRUE
	uses_target_repath_throttle = TRUE
	/// Chosen adjacent turf near the current hydroponics tray target.
	var/turf/target_adjacent_turf = null
	/// Safety reconciliation interval for state that existed before this bot subscribed to signals.
	var/next_farmbot_reconcile_at = 0
	var/farmbot_reconcile_cooldown = 300
	var/farmbot_target_range = FARMBOT_TARGET_SCAN_RANGE

/mob/living/bot/farmbot/Initialize(mapload, newTank)
	. = ..()
	RegisterSignal(GLOB.farmbot_target_bus, COMSIG_FARMBOT_TARGET_AVAILABLE, PROC_REF(on_farmbot_target_available))
	RegisterSignal(GLOB.farmbot_target_bus, COMSIG_FARMBOT_TARGET_CLEARED, PROC_REF(on_farmbot_target_cleared))
	spawn(1 SECOND)
		reconcileFarmbotTargets()

/mob/living/bot/farmbot/Destroy()
	UnregisterSignal(GLOB.farmbot_target_bus, list(COMSIG_FARMBOT_TARGET_AVAILABLE, COMSIG_FARMBOT_TARGET_CLEARED))
	return ..()

/mob/living/bot/farmbot/proc/on_farmbot_target_available(datum/source, obj/machinery/portable_atmospherics/hydroponics/tray, flags)
	SIGNAL_HANDLER
	if(!on || busy || target || emagged)
		return
	if(!tray || !tray.loc)
		return
	if(get_z(src) != get_z(tray))
		return
	if(get_dist(src, tray) > farmbot_target_range)
		return
	if(!confirmTarget(tray))
		return
	target = tray
	target_path = list()
	target_adjacent_turf = null
	cached_target_path_goal = null

/mob/living/bot/farmbot/proc/on_farmbot_target_cleared(datum/source, obj/machinery/portable_atmospherics/hydroponics/tray)
	SIGNAL_HANDLER
	if(target == tray)
		resetTarget()

/mob/living/bot/farmbot/proc/reconcileFarmbotTargets()
	if(!on || busy || target || emagged)
		return

	var/list/invalid_trays = list()
	for(var/obj/machinery/portable_atmospherics/hydroponics/tray as anything in GLOB.farmbot_attention_targets)
		if(!tray || !tray.loc)
			invalid_trays += tray
			continue
		if(get_z(src) != get_z(tray))
			continue
		if(get_dist(src, tray) > farmbot_target_range)
			continue
		if(confirmTarget(tray))
			target = tray
			target_path = list()
			target_adjacent_turf = null
			cached_target_path_goal = null
			break

	for(var/obj/machinery/portable_atmospherics/hydroponics/invalid_tray as anything in invalid_trays)
		GLOB.farmbot_attention_targets -= invalid_tray

/mob/living/bot/farmbot/lookForTargets()
	if(emagged)
		for(var/mob/living/carbon/human/H in view(farmbot_target_range, src))
			if(confirmTarget(H))
				target = H
				return
		return

	reconcileFarmbotTargets()
	if(target)
		return

	// Keep water refill behavior, but avoid scanning hydro trays every AI cycle.
	if(refills_water && tank && tank.reagents.total_volume < tank.reagents.maximum_volume)
		for(var/obj/structure/hygiene/sink/source in view(farmbot_target_range, src))
			if(confirmTarget(source))
				target = source
				return

	if(world.time >= next_farmbot_reconcile_at)
		next_farmbot_reconcile_at = world.time + farmbot_reconcile_cooldown
		reconcileFarmbotTargets()

/mob/living/bot/farmbot/turn_on()
	. = ..()
	reconcileFarmbotTargets()

/mob/living/bot/farmbot/turn_off()
	. = ..()
	target_adjacent_turf = null

/mob/living/bot/farmbot/ProcessCommand(mob/user, command, href_list)
	. = ..()
	reconcileFarmbotTargets()

/mob/living/bot/farmbot/UnarmedAttack(atom/A, proximity)
	var/obj/machinery/portable_atmospherics/hydroponics/tray = istype(A, /obj/machinery/portable_atmospherics/hydroponics) ? A : null
	. = ..()
	if(tray && !QDELETED(tray))
		tray.update_farmbot_attention()

/mob/living/bot/farmbot/calcTargetPath()
	target_path = list()
	target_adjacent_turf = null
	cached_target_path_goal = null

	var/turf/source = get_turf(src)
	var/turf/target_turf = get_turf(target)
	if(!source || !target_turf)
		resetTarget()
		return

	for(var/trayDir in GLOB.cardinal)
		var/turf/T = get_step(target_turf, trayDir)
		if(!T || T.density)
			continue
		if(LinkBlockedWithAccess(target_turf, T, botcard))
			continue
		target_path = AStar(source, T, TYPE_PROC_REF(/turf, CardinalTurfsWithAccess), TYPE_PROC_REF(/turf, Distance), 0, max_target_dist, id = botcard)
		if(length(target_path))
			target_adjacent_turf = T
			cached_target_path_goal = T
			break

	if(!length(target_path))
		ignore_list |= target
		resetTarget()
		return

/mob/living/bot/farmbot/stepToTarget()
	if(!target || !target.loc)
		return
	var/turf/target_turf = get_turf(target)
	if(!target_turf)
		return
	if(Adjacent(target))
		return

	if(!length(target_path) || !target_adjacent_turf || !target_turf.Adjacent(target_adjacent_turf))
		if(uses_target_repath_throttle)
			if(!canRepathTarget())
				return
			markRepathAttempt()
		calcTargetPath()

	if(makeStep(target_path))
		frustration = 0
	else if(max_frustration)
		++frustration

/mob/living/bot/farmbot/resetTarget()
	. = ..()
	target_adjacent_turf = null
