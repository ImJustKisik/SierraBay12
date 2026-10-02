/datum/controller/subsystem/supply/proc/ExtractCartItems(list/shop_list)
	var/list/items = list()
	if(!islist(shop_list))
		return items
	var/list/merged_by_key = list()
	for(var/station_key in shop_list)
		var/datum/trading_station/station = ResolveStation(station_key)
		if(!istype(station))
			return list()
		var/list/sub = shop_list[station_key]
		if(!islist(sub))
			return list()
		for(var/key in sub)
			var/val = sub[key]
			if(isnum(val))
				if(!is_valid_cargo_quantity(val))
					return list()
				var/datum/trade_offer/offer = station.GetOffer(key)
				var/cat = offer ? offer.category : null
				var/merge_key = "[station.uid]_[key]"
				if(merged_by_key[merge_key])
					var/list/existing = merged_by_key[merge_key]
					existing["count"] += round(val)
					if(existing["count"] > 1000)
						return list()
				else
					var/list/entry = list("station" = station, "good_id" = key, "cat" = cat, "count" = round(val), "offer" = offer)
					merged_by_key[merge_key] = entry
					items += list(entry)
			else if(islist(val))
				for(var/good_id in val)
					var/cnt = val[good_id]
					if(!isnum(cnt) || !is_valid_cargo_quantity(cnt))
						return list()
					var/datum/trade_offer/offer = station.GetOffer(good_id)
					var/merge_key = "[station.uid]_[good_id]"
					if(merged_by_key[merge_key])
						var/list/existing = merged_by_key[merge_key]
						existing["count"] += round(cnt)
						if(existing["count"] > 1000)
							return list()
					else
						var/list/entry = list("station" = station, "good_id" = good_id, "cat" = key, "count" = round(cnt), "offer" = offer)
						merged_by_key[merge_key] = entry
						items += list(entry)
			else
				return list()
	return items

/datum/controller/subsystem/supply/proc/CollectCountsFrom(list/shop_list)
	. = 0
	if(!islist(shop_list))
		return
	for(var/list/item as anything in ExtractCartItems(shop_list))
		. += item["count"]

/datum/controller/subsystem/supply/proc/CollectPriceForList(list/shop_list, buyer_faction = null)
	. = 0
	if(!islist(shop_list))
		return
	for(var/list/item as anything in ExtractCartItems(shop_list))
		var/datum/trading_station/station = item["station"]
		var/gid = item["good_id"]
		var/cat = item["cat"]
		var/count = item["count"]
		. += GetImportCost(gid, station, buyer_faction, cat) * count

/datum/controller/subsystem/supply/proc/ClearShopList(list/target_list)
	if(!islist(target_list))
		return
	for(var/station_key in target_list)
		var/list/sub = target_list[station_key]
		if(islist(sub))
			for(var/entry in sub)
				var/list/inner = sub[entry]
				if(islist(inner))
					inner.Cut()
			sub.Cut()
	target_list.Cut()

/datum/controller/subsystem/supply/proc/ClearMarketSnapshot(list/snapshot)
	if(!islist(snapshot))
		return
	for(var/datum/trading_station/station as anything in snapshot)
		var/list/station_snap = snapshot[station]
		if(islist(station_snap))
			for(var/category_name in station_snap)
				var/list/category_snap = station_snap[category_name]
				if(islist(category_snap))
					for(var/good_id in category_snap)
						var/list/good_snap = category_snap[good_id]
						if(islist(good_snap))
							good_snap.Cut()
					category_snap.Cut()
			station_snap.Cut()
	snapshot.Cut()
