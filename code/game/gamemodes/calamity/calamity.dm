#define ANTAG_TYPE_RATIO 8

/datum/game_mode/calamity
	name = "Calamity"
	round_description = "This must be a Thursday. You never could get the hang of Thursdays..."
	extended_round_description = "All hell is about to break loose. Literally every antagonist type may spawn in this round. Hold on tight."
	config_tag = "calamity"
	required_players = 1
	votable = 0
	event_delay_mod_moderate = 0.5
	event_delay_mod_major = 0.75

/datum/game_mode/calamity/create_antagonists()
	antag_tags |= all_random_antag_types()
	..()

#undef ANTAG_TYPE_RATIO
