/datum/controller/subsystem/supply/proc/ResolveCartOffer(datum/trading_station/station, cat, good_id)
	if(!istype(station))
		return null
	var/datum/trade_offer/offer = station.GetOffer(good_id)
	if(!istype(offer))
		return null
	if(cat && offer.category != cat)
		return null
	if(offer.hidden && !station.hidden_inv_unlocked)
		return null
	return offer

/datum/controller/subsystem/supply/proc/ValidateCartItems(obj/machinery/trade_beacon/receiving/beacon, list/items, buyer_faction, list/price_snapshot)
	if(!isnull(price_snapshot) && !is_valid_cargo_quote(price_snapshot))
		return null
	var/total_price = 0
	var/packable = 0
	for(var/list/data as anything in items)
		var/datum/trading_station/station = data["station"]
		if(!istype(station) || GetTradeRangeBlockReason(beacon, station))
			return null
		if(GetStationFactionBlockReason(station, buyer_faction))
			return null
		var/datum/trade_offer/offer = data["offer"] || ResolveCartOffer(station, data["cat"], data["good_id"])
		if(!istype(offer))
			return null
		if(offer.hidden && !station.hidden_inv_unlocked)
			return null
		if(data["cat"] && offer.category != data["cat"])
			return null
		if(offer.stock < data["count"])
			return null
		var/good_path = offer.item_path
		if(!good_path)
			return null
		var/gid = offer.id
		var/price = islist(price_snapshot) ? GetSnapshotUnitPrice(price_snapshot, station, data["cat"], gid) : GetImportCost(gid, station, buyer_faction, data["cat"])
		if(!isnum(price) || price < 1)
			return null
		total_price += price * data["count"]
		if(CanPackPurchase(good_path))
			packable += data["count"]
	return list("price" = total_price, "packable" = packable)

/datum/controller/subsystem/supply/proc/CreateOrderLocker(obj/machinery/trade_beacon/receiving/beacon, is_order, buyer_name)
	var/obj/structure/closet/crate/trade/locker = beacon.DropItem(/obj/structure/closet/crate/trade)
	if(locker && is_order)
		locker.locked = TRUE
		locker.registered_name = buyer_name
		locker.name = "[initial(locker.name)] ([locker.registered_name])"
		locker.update_icon()
	return locker

/datum/controller/subsystem/supply/proc/CanPackPurchase(path, remaining_capacity = null)
	if(!ispath(path, /obj/item))
		return FALSE
	var/obj/item/item_type = path
	var/obj/structure/closet/crate/crate_type = /obj/structure/closet/crate
	var/capacity = isnull(remaining_capacity) ? initial(crate_type.storage_capacity) : remaining_capacity
	return initial(item_type.w_class) < ITEM_SIZE_NO_CONTAINER && initial(item_type.w_class) / 2 <= capacity

/datum/controller/subsystem/supply/proc/SpawnPurchasedItems(obj/machinery/trade_beacon/receiving/beacon, list/cart_items, obj/structure/closet/locker)
	var/list/spawned = list()
	var/remaining_capacity = locker ? locker.storage_capacity : 0
	if(locker)
		spawned += locker
	for(var/list/data as anything in cart_items)
		var/datum/trading_station/station = data["station"]
		var/datum/trade_offer/offer = data["offer"] || ResolveCartOffer(station, data["cat"], data["good_id"])
		var/path = offer ? offer.item_path : station.GetGoodPath(data["cat"], data["good_id"])
		for(var/i in 1 to data["count"])
			if(locker && CanPackPurchase(path, remaining_capacity))
				var/obj/item/item = new path(locker)
				remaining_capacity -= locker.content_size(item)
			else
				var/atom/movable/item = beacon.DropItem(path)
				if(!item)
					for(var/atom/movable/spawned_item as anything in spawned)
						qdel(spawned_item)
					if(locker)
						qdel(locker)
					return null
				spawned += item
	return spawned

/datum/controller/subsystem/supply/proc/FulfillCartStock(list/cart_items, buyer_faction, list/price_snapshot)
	var/list/wealth_by_station = list()
	var/contents_info = ""
	for(var/list/data as anything in cart_items)
		var/datum/trading_station/station = data["station"]
		var/datum/trade_offer/offer = data["offer"] || ResolveCartOffer(station, data["cat"], data["good_id"])
		var/gid = offer ? offer.id : data["good_id"]
		var/count = data["count"]
		var/price = islist(price_snapshot) ? GetSnapshotUnitPrice(price_snapshot, station, data["cat"], gid) : GetImportCost(gid, station, buyer_faction, data["cat"])
		wealth_by_station[station] += price * count
		if(offer)
			offer.ConsumeStock(count)
		else
			station.SetGoodAmount(data["cat"], gid, max(0, station.GetGoodAmount(data["cat"], gid) - count))
		var/item_name = offer ? offer.name : station.GetGoodName(data["cat"], gid)
		contents_info += "<li>[count]x [item_name]</li>"
	for(var/datum/trading_station/station as anything in wealth_by_station)
		station.AddToWealth(wealth_by_station[station])
	return contents_info

/datum/controller/subsystem/supply/proc/ChargeBuyerAccount(datum/money_account/account, price, is_escrow)
	if(!price)
		return TRUE
	if(is_escrow)
		if(!account.withdraw(price, "Trade Network Purchase", "Trade Network"))
			account.money -= price
		return TRUE
	if(account.money < price || !account.withdraw(price, "Trade Network Purchase", "Trade Network"))
		return FALSE
	return TRUE

/datum/controller/subsystem/supply/proc/Buy(obj/machinery/trade_beacon/receiving/receiver_beacon, datum/money_account/account, list/shop_list, is_order = FALSE, buyer_name = null, buyer_faction = null, list/price_snapshot = null, is_escrow = FALSE, order_cost = null)
	if(QDELETED(receiver_beacon) || !istype(receiver_beacon) || !receiver_beacon.operable() || !account || !islist(shop_list) || !length(shop_list))
		return FALSE
	var/list/cart_items = ExtractCartItems(shop_list)
	if(!length(cart_items))
		return FALSE
	var/list/check = ValidateCartItems(receiver_beacon, cart_items, buyer_faction, price_snapshot)
	if(!check)
		return FALSE
	var/price = (isnum(order_cost) && order_cost > 0) ? order_cost : check["price"]
	if(!is_escrow && account.money < price)
		return FALSE
	var/obj/structure/closet/locker = (check["packable"] > 1) ? CreateOrderLocker(receiver_beacon, is_order, buyer_name) : null
	if(check["packable"] > 1 && !locker)
		return FALSE
	var/list/spawned = SpawnPurchasedItems(receiver_beacon, cart_items, locker)
	if(!spawned)
		return FALSE
	if(!ChargeBuyerAccount(account, price, is_escrow))
		if(locker)
			qdel(locker)
		for(var/atom/movable/spawned_item in spawned)
			qdel(spawned_item)
		return FALSE
	var/info = FulfillCartStock(cart_items, buyer_faction, price_snapshot)
	var/atom/invoice_loc = locker || (length(spawned) ? get_turf(spawned[1]) : null)
	CreateLogEntry("Shipping", is_order && buyer_name ? buyer_name : account.owner_name, info, price, TRUE, invoice_loc)
	TrackLiveMarketSales(shop_list)
	return TRUE
