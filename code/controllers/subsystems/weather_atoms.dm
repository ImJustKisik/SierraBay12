SUBSYSTEM_DEF(weather_atoms)
	name     = "Weather Atoms"
	wait     = 2 SECONDS
	priority = SS_PRIORITY_WEATHER
	flags    = SS_NO_INIT | SS_BACKGROUND
	var/list/weather_atoms = list()
	var/list/processing_atoms

	// Predeclared vars for processing.
	var/atom/atom
	var/obj/abstract/weather_system/weather
	var/singleton/state/weather/weather_state

/datum/controller/subsystem/weather_atoms/UpdateStat(time)
	if (PreventUpdateStat(time))
		return ..()
	..("A:[length(weather_atoms)]")

/datum/controller/subsystem/weather_atoms/fire(resumed = 0)
	if(!resumed)
		// [SIERRA-ADD] - WEATHER_OPT: Fast exit if no weather systems exist in world
		if(!length(SSweather.weather_systems))
			return
		// [/SIERRA-ADD]
		processing_atoms = weather_atoms.Copy()

	atom          = null
	weather       = null
	weather_state = null

	var/i = 0
	while(i < length(processing_atoms))
		i++
		atom = processing_atoms[i]

		// Atom is null or doesn't exist, remove it from processing.
		if(QDELETED(atom))
			weather_atoms -= atom
			continue

		// [SIERRA-EDIT] - WEATHER_OPT: Single get_turf() + turf.weather check instead of double get_turf() and is_outside()
		var/turf/turf = get_turf(atom)
		weather = turf?.weather
		if(!weather)
			continue

		weather_state = weather.weather_system?.current_state
		if(!istype(weather_state))
			continue
		// [/SIERRA-EDIT]

		// Process the atom and return early if needed.
		if(atom.process_weather(weather, weather_state) == PROCESS_KILL)
			weather_atoms -= atom
		if (MC_TICK_CHECK)
			processing_atoms.Cut(1, i+1)
			return

	processing_atoms.Cut()

/atom/proc/process_weather(obj/abstract/weather_system/weather, singleton/state/weather/weather_state)
	return PROCESS_KILL
