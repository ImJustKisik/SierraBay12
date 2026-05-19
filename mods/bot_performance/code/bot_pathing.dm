/mob/living/bot
	/// Prevent overlapping handleAI() chains from the spawned Life() callback.
	var/bot_ai_running = FALSE
	/// Next world.time at which this bot may run A* for target chasing.
	var/next_target_pathfind_at = 0
	/// Minimum delay between target path recalculations.
	var/target_pathfind_cooldown = 10
	/// Cached path goal used to avoid repeatedly rebuilding an unchanged path.
	var/turf/cached_target_path_goal = null

/mob/living/bot/Life()
	..()
	if(health <= 0)
		death()
		return
	weakened = 0
	stunned = 0
	paralysis = 0

	if(on && !client && !busy && !bot_ai_running)
		bot_ai_running = TRUE
		spawn(0)
			handleAI()
			bot_ai_running = FALSE

/mob/living/bot/proc/canRepathTarget()
	if(world.time < next_target_pathfind_at)
		return FALSE
	next_target_pathfind_at = world.time + target_pathfind_cooldown
	return TRUE

/mob/living/bot/proc/stepToTarget()
	if(!target || !target.loc)
		return
	if(get_dist(src, target) > min_target_dist)
		var/turf/target_turf = get_turf(target)
		if(!length(target_path) || target_turf != cached_target_path_goal)
			if(!canRepathTarget())
				return
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
