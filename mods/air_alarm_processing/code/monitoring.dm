/obj/machinery/alarm
	init_flags = 0
	var/turf/monitored_turf
	var/zone/monitored_zone
	var/atmosphere_dirty = FALSE
	var/monitor_operable
	var/next_atmosphere_cycle = 0

/obj/machinery/alarm/proc/queue_atmosphere_check()
	if(QDELETED(src))
		return
	if(atmosphere_dirty)
		return
	atmosphere_dirty = TRUE
	SSairalarms.dirty_alarms += src

/obj/machinery/alarm/proc/watch_zone(zone/new_zone)
	if(monitored_zone == new_zone)
		return
	if(monitored_zone)
		LAZYREMOVE(monitored_zone.air_alarms, src)
		if(!length(monitored_zone.air_alarms))
			SSairalarms.watched_zones -= monitored_zone
			monitored_zone.air_alarm_sample = null
	monitored_zone = new_zone
	if(new_zone)
		if(!length(new_zone.air_alarms))
			SSairalarms.watched_zones += new_zone
			new_zone.save_air_alarm_sample()
		LAZYADD(new_zone.air_alarms, src)

/obj/machinery/alarm/proc/watch_turf()
	if(monitored_turf != loc)
		unwatch_turf()
		monitored_turf = isturf(loc) ? loc : null
		if(monitored_turf)
			LAZYADD(monitored_turf.air_alarms, src)
			GLOB.turf_changed_event.register(monitored_turf, src, PROC_REF(on_air_alarm_turf_changed))
			GLOB.destroyed_event.register(monitored_turf, src, PROC_REF(on_monitored_turf_destroyed))
	var/turf/simulated/location = loc
	watch_zone(istype(location) && location.zone && !location.zone.invalid ? location.zone : null)
	if(istype(location) && !monitored_zone)
		SSairalarms.unzoned_alarms |= src
	else
		SSairalarms.unzoned_alarms -= src

/obj/machinery/alarm/proc/on_air_alarm_turf_changed()
	queue_atmosphere_check()

/obj/machinery/alarm/proc/unwatch_turf()
	if(!monitored_turf)
		return
	GLOB.turf_changed_event.unregister(monitored_turf, src, PROC_REF(on_air_alarm_turf_changed))
	GLOB.destroyed_event.unregister(monitored_turf, src, PROC_REF(on_monitored_turf_destroyed))
	LAZYREMOVE(monitored_turf.air_alarms, src)
	monitored_turf = null

/obj/machinery/alarm/proc/on_monitored_turf_destroyed()
	unwatch_turf()
	watch_zone(null)
	queue_atmosphere_check()

/obj/machinery/alarm/proc/check_atmosphere()
	watch_turf()
	if(inoperable() || shorted || buildstage != 2 || !istype(loc, /turf/simulated))
		STOP_PROCESSING_MACHINE(src, MACHINERY_PROCESS_SELF)
		return
	var/turf/simulated/location = loc
	var/datum/gas_mixture/environment = location.return_air()
	update_atmospheric_danger(environment)
	update_atmospheric_mode(environment)
	update_remote_control()
	update_thermostat_processing(environment)

/obj/machinery/alarm/proc/update_atmospheric_danger(datum/gas_mixture/environment)
	var/old_level = danger_level
	danger_level = overall_danger_level(environment)
	if(old_level == danger_level)
		return
	if(danger_level == 2)
		playsound(src.loc, 'sound/machines/airalarm.ogg', 25, 0, 4)
	apply_danger_level(danger_level)

/obj/machinery/alarm/proc/update_atmospheric_mode(datum/gas_mixture/environment)
	if(pressure_dangerlevel && breach_detected())
		mode = AALARM_MODE_OFF
		apply_mode()
	if(mode == AALARM_MODE_CYCLE && environment.return_pressure() < ONE_ATMOSPHERE * 0.05)
		breach_start_cooldown()
		mode = AALARM_MODE_FILL
		apply_mode()

/obj/machinery/alarm/proc/update_remote_control()
	switch(rcon_setting)
		if(RCON_NO)
			remote_control = 0
		if(RCON_AUTO)
			remote_control = danger_level == 2
		if(RCON_YES)
			remote_control = 1

/obj/machinery/alarm/proc/update_thermostat_processing(datum/gas_mixture/environment)
	var/needs_regulation = regulating_temperature || (!get_danger_level(target_temperature, TLV["temperature"]) && abs(environment.temperature - target_temperature) > 2)
	if(environment.return_pressure() > ONE_ATMOSPHERE * 0.05 && needs_regulation)
		START_PROCESSING_MACHINE(src, MACHINERY_PROCESS_SELF)
	else
		STOP_PROCESSING_MACHINE(src, MACHINERY_PROCESS_SELF)

/turf/var/list/air_alarms

/turf/proc/notify_air_alarms()
	for(var/obj/machinery/alarm/alarm as anything in air_alarms)
		alarm.queue_atmosphere_check()

/zone
	var/list/air_alarms
	var/air_alarm_queued = FALSE
	var/list/air_alarm_sample
	var/air_alarm_temperature
	var/air_alarm_volume
	var/air_alarm_moles
	var/air_alarm_multiplier

/zone/proc/air_alarm_state_changed()
	if(isnull(air_alarm_sample) || air.temperature != air_alarm_temperature || air.volume != air_alarm_volume)
		return TRUE
	if(air.total_moles != air_alarm_moles || air.group_multiplier != air_alarm_multiplier || length(air.gas) != length(air_alarm_sample))
		return TRUE
	for(var/gas_id in air.gas)
		if(air.gas[gas_id] != air_alarm_sample[gas_id])
			return TRUE
	return FALSE

/zone/proc/save_air_alarm_sample()
	air_alarm_sample = air.gas.Copy()
	air_alarm_temperature = air.temperature
	air_alarm_volume = air.volume
	air_alarm_moles = air.total_moles
	air_alarm_multiplier = air.group_multiplier
