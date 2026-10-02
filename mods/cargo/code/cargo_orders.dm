/datum/controller/subsystem/supply/proc/DismantleOrder(order_id)
	if(!order_id || !(order_id in order_queue))
		return FALSE
	var/list/order = order_queue[order_id]
	if(islist(order) && (order["processing"] || order["status"] == "processing"))
		return FALSE
	order_queue.Remove(order_id)
	if(islist(order))
		order["requesting_acct"] = null
		if(islist(order["contents"]))
			ClearShopList(order["contents"])
			order["contents"] = null
		if(islist(order["price_snapshot"]))
			ClearMarketSnapshot(order["price_snapshot"])
			order["price_snapshot"] = null
		order.Cut()
	return TRUE

/datum/controller/subsystem/supply/proc/PurgeStationFromOrders(datum/trading_station/station)
	if(!istype(station))
		return
	var/st_uid = station.uid
	for(var/order_id as anything in order_queue.Copy())
		var/list/order = order_queue[order_id]
		if(!islist(order))
			order_queue.Remove(order_id)
			continue
		var/changed_contents = PurgeStationFromOrderContents(order["contents"], station, st_uid)
		var/changed_snap = PurgeStationFromOrderSnapshot(order["price_snapshot"], station, st_uid)
		if(changed_contents || changed_snap)
			UpdatePurgedOrder(order, order_id)

/datum/controller/subsystem/supply/proc/PurgeStationFromOrderContents(list/contents, datum/trading_station/station, st_uid)
	if(!islist(contents))
		return FALSE
	var/changed = FALSE
	var/list/station_keys = list()
	if(station in contents)
		station_keys += station
	if(st_uid && (st_uid in contents))
		station_keys += st_uid
	for(var/station_key in station_keys)
		var/list/station_cart = contents[station_key]
		if(islist(station_cart))
			for(var/entry in station_cart)
				var/list/inner = station_cart[entry]
				if(islist(inner))
					inner.Cut()
			station_cart.Cut()
		contents -= station_key
		changed = TRUE
	return changed

/datum/controller/subsystem/supply/proc/PurgeStationFromOrderSnapshot(list/price_snapshot, datum/trading_station/station, st_uid)
	if(!islist(price_snapshot))
		return FALSE
	var/changed = FALSE
	var/list/snap_keys = list()
	if(station in price_snapshot)
		snap_keys += station
	if(st_uid && (st_uid in price_snapshot))
		snap_keys += st_uid
	for(var/snap_key in snap_keys)
		var/list/station_snap = price_snapshot[snap_key]
		if(islist(station_snap))
			for(var/cat in station_snap)
				var/list/cat_snap = station_snap[cat]
				if(islist(cat_snap))
					for(var/gid in cat_snap)
						var/list/gsnap = cat_snap[gid]
						if(islist(gsnap))
							gsnap.Cut()
					cat_snap.Cut()
			station_snap.Cut()
		price_snapshot -= snap_key
		changed = TRUE
	return changed

/datum/controller/subsystem/supply/proc/UpdatePurgedOrder(list/order, order_id)
	var/list/contents = order["contents"]
	if(CollectCountsFrom(contents) <= 0)
		DismantleOrder(order_id)
		return
	var/new_cost = GetSnapshotTotalCost(order["price_snapshot"], contents, order["buyer_faction"])
	order["cost"] = new_cost
	var/datum/money_account/master_account = get_supply_department_account()
	var/is_master = master_account && (order["requesting_acct"] == master_account)
	order["fee"] = is_master ? 0 : round(new_cost * handling_fee, 0.01)
	order["viewable_contents"] = BuildOrderViewableContents(contents)

/datum/controller/subsystem/supply/proc/BuildOrderViewableContents(list/shopping_list)
	. = ""
	for(var/list/item_data as anything in ExtractCartItems(shopping_list))
		var/datum/trading_station/station = item_data["station"]
		var/item_name = station.GetGoodName(item_data["cat"], item_data["good_id"])
		. += "<li>[item_data["count"]]x [item_name]</li>"

/datum/controller/subsystem/supply/proc/BuildOrder(requesting_account, reason, list/shopping_list, buyer_faction = null)
	if(!requesting_account || !islist(shopping_list) || !length(shopping_list) || CollectCountsFrom(shopping_list) <= 0)
		return null

	var/cost = CollectPriceForList(shopping_list, buyer_faction)
	var/datum/money_account/master_account = get_supply_department_account()
	var/is_requestor_master = master_account && requesting_account == master_account

	var/order_queue_slot = "order_[++order_queue_id]"
	order_queue[order_queue_slot] = list(
		"requesting_acct" = requesting_account,
		"reason" = reason,
		"cost" = cost,
		"fee" = is_requestor_master ? 0 : round(cost * handling_fee, 0.01),
		"contents" = shopping_list,
		"buyer_faction" = buyer_faction || FACTION_INDEPENDENT,
		"viewable_contents" = BuildOrderViewableContents(shopping_list),
		"status" = "pending",
		"processing" = FALSE
	)
	return order_queue_slot

/datum/controller/subsystem/supply/proc/RefundEscrowOrder(list/order, datum/money_account/master_account, datum/money_account/requesting_account, transferred, total_cost)
	if(transferred && istype(master_account) && istype(requesting_account))
		master_account.transfer(requesting_account, total_cost, "Trade Network Order Refund")
	if(islist(order))
		order["processing"] = FALSE
		order["status"] = "pending"

/datum/controller/subsystem/supply/proc/CompleteOrder(order_id)
	if(!order_id || !(order_id in order_queue))
		return FALSE
	var/list/order = order_queue[order_id]
	order_queue.Remove(order_id)
	if(islist(order))
		order["processing"] = FALSE
		order["status"] = "completed"
		order["requesting_acct"] = null
		if(islist(order["contents"]))
			ClearShopList(order["contents"])
			order["contents"] = null
		if(islist(order["price_snapshot"]))
			ClearMarketSnapshot(order["price_snapshot"])
			order["price_snapshot"] = null
		order.Cut()
	return TRUE

/datum/controller/subsystem/supply/proc/PurchaseOrder(obj/machinery/trade_beacon/receiving/beacon, order_id)
	if(QDELETED(beacon) || !istype(beacon) || !beacon.operable() || !order_id || !(order_id in order_queue))
		return FALSE

	var/list/order = order_queue[order_id]
	if(!islist(order) || order["processing"] || order["status"] == "processing")
		return FALSE

	var/datum/money_account/master_account = get_supply_department_account()
	var/datum/money_account/requesting_account = order["requesting_acct"]
	if(!master_account || !requesting_account || master_account.suspended || requesting_account.suspended)
		return FALSE

	var/base_cost = order["cost"]
	var/total_cost = base_cost + order["fee"]
	var/is_requestor_master = (master_account == requesting_account)
	if((!is_requestor_master && requesting_account.money < total_cost) || (is_requestor_master && master_account.money < base_cost))
		return FALSE

	order["processing"] = TRUE
	order["status"] = "processing"
	var/transferred = !is_requestor_master && requesting_account.transfer(master_account, total_cost, "Trade Network Order (Escrow)")
	if(!is_requestor_master && !transferred)
		RefundEscrowOrder(order, master_account, requesting_account, FALSE, total_cost)
		return FALSE

	var/list/shopping_list = order["contents"]
	var/buyer_faction = order["buyer_faction"]
	var/list/price_snapshot = order["price_snapshot"]
	if(!Buy(beacon, master_account, shopping_list, !is_requestor_master, requesting_account.owner_name, buyer_faction, price_snapshot, !is_requestor_master, is_requestor_master ? null : base_cost))
		RefundEscrowOrder(order, master_account, requesting_account, transferred, total_cost)
		return FALSE

	CreateLogEntry("Order", requesting_account.owner_name, order["viewable_contents"], total_cost)
	CompleteOrder(order_id)
	return TRUE
