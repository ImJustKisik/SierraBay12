SUBSYSTEM_DEF(airalarms)
	name = "Air Alarms"
	wait = 1 SECOND
	init_order = SS_INIT_MISC_LATE
	priority = SS_PRIORITY_MACHINERY
	flags = SS_KEEP_TIMING
	/// Only zones with subscribers are audited; no global alarm scan.
	var/list/watched_zones = list()
	/// Local/exterior air has no persistent zone, so it keeps the original safety interval.
	var/list/unzoned_alarms = list()
	var/list/dirty_zones = list()
	var/list/dirty_alarms = list()
	var/list/current_zones = list()
	var/list/current_audit = list()
	var/list/current_fallback = list()
	var/list/current_alarms
	var/next_audit = 0
	var/monitor_cycle = 0

/datum/controller/subsystem/airalarms/Recover(datum/controller/subsystem/airalarms/old_system)
	watched_zones = old_system.watched_zones
	unzoned_alarms = old_system.unzoned_alarms
	dirty_zones = old_system.dirty_zones + old_system.current_zones
	dirty_alarms = old_system.dirty_alarms.Copy()
	if(old_system.current_alarms)
		dirty_alarms += old_system.current_alarms
	monitor_cycle = old_system.monitor_cycle
	next_audit = 0

/datum/controller/subsystem/airalarms/proc/queue_zone(zone/changed_zone)
	if(!length(changed_zone.air_alarms) || changed_zone.invalid)
		return
	if(changed_zone.air_alarm_queued)
		return
	changed_zone.air_alarm_queued = TRUE
	dirty_zones += changed_zone

/datum/controller/subsystem/airalarms/proc/begin_cycle()
	monitor_cycle++
	current_zones = dirty_zones
	dirty_zones = list()
	if(world.time >= next_audit)
		next_audit = world.time + 2 SECONDS
		current_audit = watched_zones.Copy()
		current_fallback = unzoned_alarms.Copy()

/datum/controller/subsystem/airalarms/fire(resumed = FALSE)
	if(!resumed)
		begin_cycle()
	if(!audit_zones() || !sample_zones() || !queue_fallback())
		return
	if(isnull(current_alarms))
		current_alarms = dirty_alarms
		dirty_alarms = list()
	while(length(current_alarms))
		var/obj/machinery/alarm/alarm = current_alarms[length(current_alarms)]
		LIST_DEC(current_alarms)
		process_alarm(alarm)
		if(MC_TICK_CHECK)
			return
	current_alarms = null

/datum/controller/subsystem/airalarms/proc/process_alarm(obj/machinery/alarm/alarm)
	if(QDELETED(alarm))
		alarm.atmosphere_dirty = FALSE
		return
	if(alarm.next_atmosphere_cycle > monitor_cycle)
		dirty_alarms += alarm
		return
	alarm.atmosphere_dirty = FALSE
	// Stable alarms can react on the next one-second dispatch. Continuous changes
	// are limited to the original two-second cadence, including across MC pauses.
	alarm.next_atmosphere_cycle = monitor_cycle + 2
	alarm.check_atmosphere()

/datum/controller/subsystem/airalarms/proc/audit_zones()
	while(length(current_audit))
		var/zone/checked_zone = current_audit[length(current_audit)]
		LIST_DEC(current_audit)
		sample_zone(checked_zone)
		if(MC_TICK_CHECK)
			return FALSE
	return TRUE

/datum/controller/subsystem/airalarms/proc/sample_zones()
	while(length(current_zones))
		var/zone/checked_zone = current_zones[length(current_zones)]
		LIST_DEC(current_zones)
		checked_zone.air_alarm_queued = FALSE
		sample_zone(checked_zone)
		if(MC_TICK_CHECK)
			return FALSE
	return TRUE

/datum/controller/subsystem/airalarms/proc/sample_zone(zone/checked_zone)
	if(checked_zone.invalid || !length(checked_zone.air_alarms))
		return
	if(!checked_zone.air_alarm_state_changed())
		return
	checked_zone.save_air_alarm_sample()
	for(var/obj/machinery/alarm/alarm as anything in checked_zone.air_alarms)
		alarm.queue_atmosphere_check()

/datum/controller/subsystem/airalarms/proc/queue_fallback()
	while(length(current_fallback))
		var/obj/machinery/alarm/alarm = current_fallback[length(current_fallback)]
		LIST_DEC(current_fallback)
		if(!QDELETED(alarm))
			alarm.queue_atmosphere_check()
		if(MC_TICK_CHECK)
			return FALSE
	return TRUE
