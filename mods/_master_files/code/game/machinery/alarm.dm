/obj/machinery/alarm/Initialize()
	. = ..()
	GLOB.moved_event.register(src, src, PROC_REF(on_air_alarm_turf_changed))
	queue_atmosphere_check()

/obj/machinery/alarm/Destroy()
	GLOB.moved_event.unregister(src, src, PROC_REF(on_air_alarm_turf_changed))
	unwatch_turf()
	watch_zone(null)
	SSairalarms.unzoned_alarms -= src
	SSairalarms.current_fallback -= src
	SSairalarms.dirty_alarms -= src
	if(SSairalarms.current_alarms)
		SSairalarms.current_alarms -= src
	atmosphere_dirty = FALSE
	return ..()

/obj/machinery/alarm/on_update_icon()
	. = ..()
	var/now_operable = !inoperable() && !shorted && buildstage == 2
	if(monitor_operable != now_operable)
		monitor_operable = now_operable
		queue_atmosphere_check()

/obj/machinery/alarm/power_change()
	. = ..()
	if(.)
		queue_atmosphere_check()

/obj/machinery/alarm/set_broken(new_state, cause = MACHINE_BROKEN_GENERIC)
	. = ..()
	if(.)
		queue_atmosphere_check()

/obj/machinery/alarm/OnTopic(user, href_list, datum/topic_state/state)
	. = ..()
	if(href_list["temperature"] || href_list["rcon"] || href_list["command"] == "set_breach")
		queue_atmosphere_check()
