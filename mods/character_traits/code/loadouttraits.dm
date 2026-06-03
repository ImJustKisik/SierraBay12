/singleton/species/proc/get_selectable_mod_traits()
	var/list/allowed_mod_traits = list()
	for (var/mod_trait_id in GLOB.all_mod_traits)
		var/datum/mod_trait/T = GLOB.all_mod_traits[mod_trait_id]
		if (!T.name)
			continue
		if (T.species_allowed && !(name in T.species_allowed))
			continue
		if (T.subspecies_allowed && !(get_bodytype() in T.subspecies_allowed))
			continue
		if (LAZYISIN(traits, T.type))
			continue
		allowed_mod_traits[T.name] = T
	return allowed_mod_traits

/obj/item/storage/box/asthma
	name = "box of asthma autoinjectors"
	desc = "A compact case containing emergency autoinjectors. Issued to patients with asthma for rapid relief of attacks."
	icon_state = "box"
	startswith = list(/obj/item/reagent_containers/hypospray/autoinjector/pouch_auto/dexalin = 5)

/datum/gear/dexalin_box
	display_name = "Diseases — Asthma Kit"
	path = /obj/item/storage/box/asthma
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Asthma")

/obj/item/reagent_containers/pill/synaptizine
	name = "Synaptizine (1u)"
	desc = "Commonly used to treat hallucinations."
	icon_state = "pill3"

/obj/item/reagent_containers/pill/synaptizine/New()
	..()
	reagents.add_reagent(/datum/reagent/synaptizine, 1)
	color = reagents.get_color()

/obj/item/storage/pill_bottle/synaptizine
	name = "prescribed pill bottle (Synaptizine)"
	desc = "A pillbox containing Synaptizine pills. Prescription only. Used to suppress hallucinations and stabilize neural function."
	startswith = list(/obj/item/reagent_containers/pill/synaptizine = 4)
	wrapper_color = COLOR_CYAN_BLUE

/datum/gear/synaptizine_box
	display_name = "Diseases — Hallucinations Kit"
	description = "A bottle of Synaptizine pills. You've better had your prescription in medical records ready."
	path = /obj/item/storage/pill_bottle/synaptizine
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Hallucinations")

/obj/item/reagent_containers/pill/tylenol
	name = "Tylenol (5u)"
	desc = "A mild chewable painkiller."
	icon_state = "pill3"

/obj/item/reagent_containers/pill/tylenol/New()
	..()
	reagents.add_reagent(/datum/reagent/paracetamol, 5)
	color = reagents.get_color()

/obj/item/storage/pill_bottle/tylenol
	name = "pill bottle (Tylenol)"
	desc = "Mild painkiller. Won't fix the cause of your headache (unlike cyanide), but might make it bearable."
	startswith = list(/obj/item/reagent_containers/pill/tylenol = 4)
	wrapper_color = "#c8a5dc"

/datum/gear/tylenol_box
	display_name = "Diseases — Headache Kit"
	path = /obj/item/storage/pill_bottle/tylenol
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Headaches")

// ЗАВИСИМОСТИ В ЛОАДАУТЕ
/obj/item/storage/box/nicotine
	name = "personal smoker's box"
	desc = "A compact box containing a packet of cigarettes and a basic lighter. Issued to heavy smokers."
	icon_state = "box"
	startswith = list(
		/obj/item/storage/fancy/smokable/luckystars = 1,
		/obj/item/flame/lighter/random = 1
	)

/datum/gear/nicotine_box
	display_name = "Diseases — Nicotine Kit"
	path = /obj/item/storage/box/nicotine
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Nicotine Addiction")

/obj/item/reagent_containers/food/drinks/flask/vacuumflask/coffee
	name = "vacuum flask (coffee)"
	desc = "A vacuum flask pre-filled with hot coffee. Keep your coffee hot on long shifts."

/obj/item/reagent_containers/food/drinks/flask/vacuumflask/coffee/Initialize()
	. = ..()
	reagents.add_reagent(/datum/reagent/drink/coffee, 60)

/datum/gear/caffeine_flask
	display_name = "Diseases — Caffeine Kit"
	path = /obj/item/reagent_containers/food/drinks/flask/vacuumflask/coffee
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Caffeine Addiction")

/obj/item/storage/box/sweet_tooth
	name = "personal sweet tooth's box"
	desc = "A compact box containing some candies and lollipops. Issued to people with severe sugar addiction."
	icon_state = "box"
	startswith = list(
		/obj/item/reagent_containers/food/snacks/candy = 3,
		/obj/item/clothing/mask/chewable/candy/lolli = 2
	)

/datum/gear/sweet_tooth_box
	display_name = "Diseases — Sweet Tooth Kit"
	path = /obj/item/storage/box/sweet_tooth
	cost = 2
	flags = GEAR_HAS_NO_CUSTOMIZATION
	allowed_mod_traits = list("Disease - Sweet Tooth")

