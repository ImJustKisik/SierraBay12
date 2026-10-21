/zone/add(turf/simulated/turf_to_add)
	. = ..()
	turf_to_add.notify_air_alarms()
	SSairalarms.queue_zone(src)

/zone/remove(turf/simulated/turf_to_remove)
	. = ..()
	turf_to_remove.notify_air_alarms()
	SSairalarms.queue_zone(src)

/zone/c_invalidate()
	. = ..()
	for(var/obj/machinery/alarm/alarm as anything in air_alarms?.Copy())
		alarm.watch_zone(null)
		alarm.queue_atmosphere_check()
	SSairalarms.dirty_zones -= src
	SSairalarms.current_zones -= src
	SSairalarms.current_audit -= src
	air_alarm_queued = FALSE

/zone/tick()
	. = ..()
	SSairalarms.queue_zone(src)
