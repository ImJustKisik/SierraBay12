/obj/machinery/alarm/processing_test
	uncreated_component_parts = null
	stat_immune = MACHINE_STAT_NOPOWER | MACHINE_STAT_NOSCREEN | MACHINE_STAT_NOINPUT
	var/danger_checks = 0
	var/applied_level = 0

/obj/machinery/alarm/processing_test/overall_danger_level(datum/gas_mixture/environment)
	danger_checks++
	return ..()

/obj/machinery/alarm/processing_test/apply_danger_level(new_danger_level)
	applied_level = new_danger_level
	return ..()

/obj/item/stock_parts/power/apc/air_alarm_test
	var/available = FALSE

/obj/item/stock_parts/power/apc/air_alarm_test/can_provide_power(obj/machinery/machine)
	return available

/datum/unit_test/air_alarm_processing
	name = "ATMOS: Event driven air alarm monitoring"
	var/list/test_turfs = list()
	var/list/test_zones = list()
	var/list/test_alarms = list()
	var/errors = 0
	var/zone/first_zone
	var/zone/second_zone
	var/obj/machinery/alarm/processing_test/first_alarm
	var/obj/machinery/alarm/processing_test/second_alarm
	var/obj/machinery/alarm/processing_test/independent_alarm

/datum/unit_test/air_alarm_processing/proc/expect(condition, message)
	if(!condition)
		errors++
		log_bad(message)

/datum/unit_test/air_alarm_processing/proc/drain()
	// Test fixtures are small; exercise the same resumable queues as the MC.
	release_test_throttle()
	SSairalarms.fire(FALSE)
	var/iterations = 0
	var/max_iterations = 100 + 10 * (length(SSairalarms.watched_zones) + length(SSmachines.machinery))
	while(!isnull(SSairalarms.current_alarms) || length(SSairalarms.current_zones) || length(SSairalarms.current_audit) || length(SSairalarms.current_fallback) || length(SSairalarms.dirty_alarms) || length(SSairalarms.dirty_zones))
		var/resumed = !isnull(SSairalarms.current_alarms) || length(SSairalarms.current_zones) || length(SSairalarms.current_audit) || length(SSairalarms.current_fallback)
		release_test_throttle()
		SSairalarms.fire(resumed)
		if(++iterations > max_iterations)
			expect(FALSE, "Queue did not settle within [max_iterations] resumptions.")
			break

/datum/unit_test/air_alarm_processing/proc/release_test_throttle()
	// Advance fixture deadlines instead of sleeping between independent scenarios.
	for(var/obj/machinery/alarm/alarm as anything in test_alarms)
		if(!QDELETED(alarm))
			alarm.next_atmosphere_cycle = 0

/datum/unit_test/air_alarm_processing/proc/dispatch_one_cycle()
	SSairalarms.fire(FALSE)
	while(!isnull(SSairalarms.current_alarms) || length(SSairalarms.current_zones) || length(SSairalarms.current_audit) || length(SSairalarms.current_fallback))
		SSairalarms.fire(TRUE)

/datum/unit_test/air_alarm_processing/proc/normal_air(zone/checked_zone)
	checked_zone.air.gas = global.STANDARD_AIRMIX.Copy()
	checked_zone.air.temperature = T20C
	checked_zone.air.update_values()
	SSairalarms.queue_zone(checked_zone)

/datum/unit_test/air_alarm_processing/proc/setup()
	INCREMENT_WORLD_Z_SIZE
	first_zone = new
	second_zone = new
	test_zones = list(first_zone, second_zone)
	for(var/index in 1 to 3)
		var/turf/simulated/floor/plating/location = new(locate(index + 1, 2, world.maxz))
		test_turfs += location
		var/zone/assigned_zone = index == 3 ? second_zone : first_zone
		assigned_zone.add(location)
		var/obj/machinery/alarm/processing_test/alarm = new(location)
		test_alarms += alarm
	first_alarm = test_alarms[1]
	second_alarm = test_alarms[2]
	independent_alarm = test_alarms[3]
	normal_air(first_zone)
	normal_air(second_zone)
	drain()

/datum/unit_test/air_alarm_processing/start_test()
	setup()
	check_stable_air()
	check_pressure_and_modes()
	check_gases()
	check_throttle()
	check_temperature()
	check_lifecycle()
	check_operability()
	check_settings_and_cooldown()
	check_unzoned_and_movement()
	check_turf_replacement()
	check_deletion()
	cleanup()
	if(errors)
		fail("[errors] air alarm assertions failed.")
	else
		pass("Stable air, gas/thermal changes, modes, subscriptions, fallback, power and deletion passed.")
	return 1

/datum/unit_test/air_alarm_processing/proc/check_stable_air()
	var/previous_checks = first_alarm.danger_checks
	for(var/index in 1 to 20)
		var/turf/simulated/location = first_alarm.loc
		location.return_air()
		SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.danger_checks == previous_checks, "Reading unchanged air triggered danger checks.")
	expect(!(first_alarm.processing_flags & MACHINERY_PROCESS_SELF), "Stable thermostat remained self processing.")
	expect(length(first_zone.air_alarms) == 2, "Two alarms failed to share a zone subscription.")
	SSairalarms.next_audit = 0
	drain()
	expect(first_alarm.danger_checks == previous_checks, "Unchanged zone audit triggered danger checks.")

/datum/unit_test/air_alarm_processing/proc/check_pressure_and_modes()
	first_zone.air.multiply(0.01)
	SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.danger_level == 2 && second_alarm.danger_level == 2, "Breach failed to reach both alarms.")
	expect(first_alarm.mode == AALARM_MODE_OFF, "Breach failed to shut down ventilation.")
	expect(independent_alarm.danger_level == 0, "Breach affected an independent zone.")
	first_alarm.mode = AALARM_MODE_CYCLE
	first_alarm.apply_mode()
	drain()
	expect(first_alarm.mode == AALARM_MODE_FILL, "Cycle failed to refill unchanged vacuum after a mode event.")
	normal_air(first_zone)
	drain()
	expect(first_alarm.danger_level == 0 && first_alarm.applied_level == 0, "Restored pressure failed to clear alarm.")

/datum/unit_test/air_alarm_processing/proc/check_gases()
	var/previous_checks = first_alarm.danger_checks
	for(var/index in 1 to 20)
		first_zone.air.adjust_gas(GAS_PHORON, 1)
		SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.danger_level == 2, "Dangerous trace gas was not detected.")
	expect(first_alarm.danger_checks == previous_checks + 1, "Repeated zone changes were not deduplicated.")
	normal_air(first_zone)
	drain()
	expect(first_alarm.danger_level == 0, "Restored gas composition failed to clear alarm.")
	// A same-pressure substitution must not be hidden by equal total moles.
	first_zone.air.gas[GAS_NITROGEN] -= 8
	first_zone.air.gas[GAS_CO2] = 8
	SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.co2_dangerlevel > 0, "Same-mole gas substitution was missed.")
	normal_air(first_zone)
	drain()

/datum/unit_test/air_alarm_processing/proc/check_temperature()
	first_zone.air.temperature = T0C + 100
	SSairalarms.next_audit = 0
	drain()
	expect(first_alarm.temperature_dangerlevel == 2, "Direct temperature write was missed by the zone audit.")
	expect(first_alarm.processing_flags & MACHINERY_PROCESS_SELF, "Hot room did not wake thermostat.")
	var/old_temperature = first_zone.air.temperature
	first_alarm.Process()
	expect(first_zone.air.temperature < old_temperature, "Active thermostat did not cool air.")
	first_zone.air.temperature = T0C - 30
	SSairalarms.queue_zone(first_zone)
	drain()
	old_temperature = first_zone.air.temperature
	first_alarm.Process()
	expect(first_zone.air.temperature > old_temperature, "Active thermostat did not heat air.")
	normal_air(first_zone)
	first_alarm.Process()
	drain()
	expect(!first_alarm.regulating_temperature && first_alarm.use_power == POWER_USE_IDLE, "Thermostat failed to stop at target.")
	check_heat_budget()

/datum/unit_test/air_alarm_processing/proc/check_throttle()
	var/previous_checks = first_alarm.danger_checks
	first_alarm.next_atmosphere_cycle = SSairalarms.monitor_cycle + 2
	first_zone.air.adjust_gas(GAS_PHORON, 2)
	SSairalarms.queue_zone(first_zone)
	dispatch_one_cycle()
	expect(first_alarm.danger_checks == previous_checks && first_alarm.atmosphere_dirty, "Continuous events bypassed the two-cycle rate limit.")
	dispatch_one_cycle()
	expect(first_alarm.danger_checks == previous_checks + 1 && first_alarm.danger_level == 2, "Rate limiting lost the pending hazard.")
	normal_air(first_zone)
	drain()

/datum/unit_test/air_alarm_processing/proc/check_heat_budget()
	first_zone.air.temperature = T20C - 10
	var/heat_capacity = first_zone.air.heat_capacity()
	var/old_temperature = first_zone.air.temperature
	first_alarm.Process()
	var/added_energy = (first_zone.air.temperature - old_temperature) * heat_capacity
	expect(abs(added_energy - first_alarm.active_power_usage) < 1, "Heating changed the original per-machine-tick energy budget.")
	normal_air(first_zone)
	first_alarm.Process()
	drain()

/datum/unit_test/air_alarm_processing/proc/check_lifecycle()
	var/turf/simulated/location = second_alarm.loc
	first_zone.remove(location)
	second_zone.add(location)
	drain()
	expect(second_alarm.monitored_zone == second_zone, "Removed turf retained its old zone subscription.")
	second_zone.c_merge(first_zone)
	drain()
	expect(second_alarm.monitored_zone == first_zone && independent_alarm.monitored_zone == first_zone, "Merge failed to rebind zone subscribers.")
	expect(!length(second_zone.air_alarms) && !(second_zone in SSairalarms.watched_zones), "Invalid zone retained subscribers.")
	first_zone.rebuild()
	drain()
	expect(!first_alarm.monitored_zone && first_alarm in SSairalarms.unzoned_alarms, "Rebuilding zone failed to enable local fallback.")
	var/zone/rebuilt = new
	test_zones += rebuilt
	for(var/turf/simulated/test_turf as anything in test_turfs)
		rebuilt.add(test_turf)
	first_zone = rebuilt
	normal_air(first_zone)
	drain()
	expect(first_alarm.monitored_zone == rebuilt, "Rebuilt zone failed to restore subscriptions.")

/datum/unit_test/air_alarm_processing/proc/check_operability()
	first_alarm.shorted = TRUE
	first_alarm.update_icon()
	drain()
	first_zone.air.adjust_gas(GAS_PHORON, 2)
	SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.danger_level == 0, "Shorted alarm continued monitoring.")
	first_alarm.shorted = FALSE
	first_alarm.update_icon()
	drain()
	expect(first_alarm.danger_level == 2, "Restored alarm missed existing danger.")
	first_alarm.set_broken(TRUE)
	drain()
	expect(first_alarm.inoperable(), "Broken-state override lost the default broken cause.")
	first_alarm.set_broken(FALSE)
	normal_air(first_zone)
	drain()
	check_power_recovery()

/datum/unit_test/air_alarm_processing/proc/check_power_recovery()
	var/obj/item/stock_parts/power/apc/air_alarm_test/power = first_alarm.install_component(/obj/item/stock_parts/power/apc/air_alarm_test)
	first_alarm.set_stat_immunity(MACHINE_STAT_NOPOWER, FALSE)
	first_alarm.power_change()
	drain()
	expect(first_alarm.inoperable(), "Power loss did not disable the alarm.")
	first_zone.air.adjust_gas(GAS_PHORON, 2)
	SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.danger_level == 0, "Unpowered alarm continued monitoring.")
	power.available = TRUE
	first_alarm.power_change()
	drain()
	expect(first_alarm.danger_level == 2, "Power recovery missed an existing hazard.")
	normal_air(first_zone)
	drain()

/datum/unit_test/air_alarm_processing/proc/check_settings_and_cooldown()
	var/list/old_thresholds = first_alarm.TLV["pressure"]
	first_alarm.TLV["pressure"] = list(-1, -1, 40, 50)
	first_alarm.apply_mode()
	drain()
	expect(first_alarm.pressure_dangerlevel == 2, "Changed thresholds did not reevaluate unchanged air.")
	first_alarm.TLV["pressure"] = old_thresholds
	first_alarm.OnTopic(null, list("rcon" = "[RCON_YES]"), null)
	drain()
	expect(first_alarm.danger_level == 0 && first_alarm.remote_control, "RCON or restored threshold failed to update.")
	check_cooldown()

/datum/unit_test/air_alarm_processing/proc/check_cooldown()
	first_zone.air.multiply(0.01)
	for(var/obj/machinery/alarm/alarm as anything in test_alarms)
		alarm.breach_cooldown = TRUE
	first_alarm.mode = AALARM_MODE_FILL
	first_alarm.apply_mode()
	SSairalarms.queue_zone(first_zone)
	drain()
	expect(first_alarm.mode == AALARM_MODE_FILL, "Breach cooldown ended prematurely.")
	first_alarm.breach_end_cooldown()
	drain()
	expect(first_alarm.mode == AALARM_MODE_OFF, "Cooldown expiry failed to reevaluate steady vacuum.")
	normal_air(first_zone)
	drain()

/datum/unit_test/air_alarm_processing/proc/check_unzoned_and_movement()
	var/turf/simulated/location = first_alarm.loc
	first_zone.remove(location)
	drain()
	expect(first_alarm in SSairalarms.unzoned_alarms, "Local air fallback was not registered.")
	location.air.adjust_gas(GAS_PHORON, 2)
	SSairalarms.next_audit = 0
	drain()
	expect(first_alarm.danger_level == 2, "Local gas mutation was missed.")
	first_alarm.forceMove(second_alarm.loc)
	drain()
	expect(first_alarm.monitored_zone == first_zone, "Movement failed to rebind to the destination zone.")
	expect(!(first_alarm in location.air_alarms), "Movement left a turf subscription behind.")
	START_PROCESSING_MACHINE(first_alarm, MACHINERY_PROCESS_COMPONENTS)
	first_alarm.update_thermostat_processing(first_zone.air)
	expect(first_alarm.processing_flags & MACHINERY_PROCESS_COMPONENTS, "Stopping thermostat cleared component processing.")
	STOP_PROCESSING_MACHINE(first_alarm, MACHINERY_PROCESS_COMPONENTS)

/datum/unit_test/air_alarm_processing/proc/check_deletion()
	second_alarm.queue_atmosphere_check()
	SSairalarms.current_alarms = SSairalarms.dirty_alarms
	SSairalarms.dirty_alarms = list()
	qdel(second_alarm)
	expect(!(second_alarm in SSairalarms.current_alarms), "Deletion left a resumed queue reference.")
	expect(!(second_alarm in first_zone.air_alarms), "Deletion left a zone subscription.")
	SSairalarms.fire(TRUE)

/datum/unit_test/air_alarm_processing/proc/check_turf_replacement()
	var/turf/location = first_alarm.loc
	location.ChangeTurf(/turf/simulated/floor/plating, keep_air = TRUE)
	drain()
	expect(first_alarm.monitored_turf == first_alarm.loc, "Turf replacement lost the monitored location.")
	location = first_alarm.loc
	expect(first_alarm in location.air_alarms, "Turf replacement failed to restore its subscriber index.")
	expect(GLOB.turf_changed_event.is_listening(location, first_alarm), "Turf replacement lost the change subscription.")

/datum/unit_test/air_alarm_processing/proc/cleanup()
	for(var/obj/machinery/alarm/alarm as anything in test_alarms)
		if(!QDELETED(alarm))
			qdel(alarm)
	for(var/zone/test_zone as anything in test_zones)
		if(!test_zone.invalid)
			test_zone.c_invalidate()
	test_alarms.Cut()
	test_zones.Cut()
	test_turfs.Cut()
	first_alarm = null
	second_alarm = null
	independent_alarm = null
	first_zone = null
	second_zone = null
