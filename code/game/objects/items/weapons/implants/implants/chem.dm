/obj/item/implant/chem
	name = "chemical implant"
	desc = "Injects things."
	origin_tech = list(TECH_MATERIAL = 1, TECH_BIO = 2)
	known = 1

/obj/item/implant/chem/get_data()
	return {"
	<b>Implant Specifications:</b><BR>
	<b>Name:</b> Robust Corp MJ-420 Prisoner Management Implant<BR>
	<b>Life:</b> Deactivates upon death but remains within the body.<BR>
	<b>Important Notes: Due to the system functioning off of nutrients in the implanted subject's body, the subject<BR>
	will suffer from an increased appetite.</B><BR>
	<HR>
	<b>Implant Details:</b><BR>
	<b>Function:</b> Contains a small capsule that can contain various chemicals. Upon receiving a specially encoded signal<BR>
	the implant releases the chemicals directly into the blood stream.<BR>
	<b>Special Features:</b>
	<i>Micro-Capsule</i>- Can be loaded with any sort of chemical agent via the common syringe and can hold 50 units.<BR>
	Can only be loaded while still in its original case.<BR>
	<b>Integrity:</b> Implant will last so long as the subject is alive. However, if the subject suffers from prolonged malnutrition,<BR>
	nine or more days without nutrients, the implant may become unstable and either pre-maturely inject the subject or simply break."}

/obj/item/implant/chem/New()
	..()
	create_reagents(50)

/obj/item/implant/chem/activate(amount)
	if(malfunction || (!iscarbon(imp_in)))	return 0
	if(!amount)
		amount = rand(1,25)
	var/mob/living/carbon/R = imp_in
	reagents.trans_to_mob(R, amount, CHEM_BLOOD)
	to_chat(R, SPAN_NOTICE("You hear a faint *beep*."))

/obj/item/implant/chem/use_tool(obj/item/I, mob/living/user, list/click_params)
	if(istype(I, /obj/item/reagent_containers/syringe))
		if(reagents.total_volume >= reagents.maximum_volume)
			to_chat(user, SPAN_WARNING("\The [src] is full."))
			return TRUE
		else
			if(do_after(user, 0.5 SECONDS, src, DO_MEDICAL))
				I.reagents.trans_to_obj(src, 5)
				to_chat(user, SPAN_NOTICE("You inject 5 units of the solution. The syringe now contains [I.reagents.total_volume] units."))
			return TRUE

	return ..()

/obj/item/implantcase/chem
	name = "glass case - 'chem'"
	imp = /obj/item/implant/chem

/obj/item/implant/insulin_pump
	name = "insulin pump implant"
	desc = "Микро-имплант, автоматически поддерживающий уровень сахара в норме путем микроинъекций инсулина."
	origin_tech = list(TECH_MATERIAL = 2, TECH_BIO = 3)
	var/insulin_amount = 50
	var/max_insulin = 50

/obj/item/implant/insulin_pump/get_data()
	return {"
	<b>Характеристики импланта:</b><BR>
	<b>Имя:</b> Инсулиновая помпа Zeon-7<BR>
	<b>Запас инсулина:</b> [insulin_amount]/[max_insulin] ед.<BR>
	<b>Принцип работы:</b> Автоматически сканирует уровень сахара в крови и вводит 1 ед. инсулина, если уровень превышает 140 ед.<BR>
	<b>Перезарядка:</b> Может быть перезаправлен инсулином с помощью шприца, пока находится в защитном кейсе.
	"}

/obj/item/implant/insulin_pump/use_tool(obj/item/I, mob/living/user, list/click_params)
	if(istype(I, /obj/item/reagent_containers/syringe))
		if(insulin_amount >= max_insulin)
			to_chat(user, SPAN_WARNING("\The [src] полностью заправлена."))
			return TRUE
		if(!I.reagents.has_reagent(/datum/reagent/insulin))
			to_chat(user, SPAN_WARNING("Шприц не содержит инсулина!"))
			return TRUE
		if(do_after(user, 0.5 SECONDS, src, DO_MEDICAL))
			var/transferred = I.reagents.remove_reagent(/datum/reagent/insulin, min(5, max_insulin - insulin_amount))
			insulin_amount += transferred
			to_chat(user, SPAN_NOTICE("Вы заправили [transferred] ед. инсулина в помпу. Текущий заряд: [insulin_amount]/[max_insulin]."))
		return TRUE
	return ..()

/obj/item/implantcase/insulin_pump
	name = "glass case - 'insulin pump'"
	imp = /obj/item/implant/insulin_pump

/obj/item/implanter/insulin_pump
	name = "implanter-insulin pump"
	imp = /obj/item/implant/insulin_pump
