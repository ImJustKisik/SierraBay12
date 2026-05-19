/mob/living/bot
	/// Opt-in guard for spawned handleAI() chains. Disabled by default to preserve non-farmbot behavior.
	var/uses_guarded_ai = FALSE
	/// Prevent overlapping handleAI() chains from the spawned Life() callback.
	var/bot_ai_running = FALSE
	/// Opt-in target A* throttle. Disabled by default to preserve non-farmbot behavior.
	var/uses_target_repath_throttle = FALSE
	/// Next world.time at which this bot may run A* for target chasing.
	var/next_target_pathfind_at = 0
	/// Minimum delay between target path recalculations.
	var/target_pathfind_cooldown = 10
	/// Cached path goal used by opt-in throttled bots.
	var/turf/cached_target_path_goal = null

/mob/living/bot/Life()
	..()
	if(health <= 0)
		death()
		return
	weakened = 0
	stunned = 0
	paralysis = 0

	if(on && !client && !busy)
		if(uses_guarded_ai)
			if(!bot_ai_running)
				spawn(0)
					run_guarded_ai()
		else
			spawn(0)
				handleAI()

/mob/living/bot/proc/run_guarded_ai()
	if(bot_ai_running)
		return
	bot_ai_running = TRUE
	try
		handleAI()
	catch(var/exception/e)
		bot_ai_running = FALSE
		throw e
	bot_ai_running = FALSE

/mob/living/bot/proc/canRepathTarget()
	return world.time >= next_target_pathfind_at

/mob/living/bot/proc/markRepathAttempt()
	next_target_pathfind_at = world.time + target_pathfind_cooldown

/mob/living/bot/proc/stepToTarget()
	if(!target || !target.loc)
		return
	if(get_dist(src, target) > min_target_dist)
		var/turf/target_turf = get_turf(target)
		if(uses_target_repath_throttle)
			if(!length(target_path) || target_turf != cached_target_path_goal)
				if(!canRepathTarget())
					return
				markRepathAttempt()
				calcTargetPath()
		else if(!length(target_path) || target_turf != target_path[length(target_path)])
			calcTargetPath()
		if(makeStep(target_path))
			frustration = 0
		else if(max_frustration)
			++frustration
	return

/mob/living/bot/proc/calcTargetPath()
	cached_target_path_goal = get_turf(target)
	target_path = AStar(get_turf(loc), cached_target_path_goal, TYPE_PROC_REF(/turf, CardinalTurfsWithAccess), TYPE_PROC_REF(/turf, Distance), 0, max_target_dist, id = botcard, exclude = obstacle)
	if(!target_path)
		if(target && target.loc)
			ignore_list |= target
		resetTarget()
		obstacle = null
	return

/mob/living/bot/proc/resetTarget()
	target = null
	target_path = list()
	cached_target_path_goal = null
	frustration = 0
	obstacle = null

/mob/living/bot/proc/turn_off()
	. = ..()
	bot_ai_running = FALSE

/mob/living/bot/proc/death()
	bot_ai_running = FALSE
	return ..()

/mob/living/bot/Destroy()
	bot_ai_running = FALSE
	return ..()
