# Cargo trade network

`cargo_subsystem.dm` owns subsystem state, initialization, scheduling and cleanup.
Its operations are grouped in flat files for stations and range checks, factions,
contract generation, carts, pricing, orders, purchases, exports and shipping logs.
Station catalog construction, overmap placement and economic ticks are separate.
The two computer programs own their sessions, forms and access checks; the UI
files serialize the shared model without changing NanoUI fields or Topic inputs.

## Runtime data

A cart is `station_uid -> offer_id -> quantity`. Both keys are nonempty strings;
quantities are integers from 1 to 1000. `cargo_cart.dm` provides validation,
independent copying, clearing and quantity changes. Session sanitization removes
unavailable entries; purchasing rejects the entire invalid cart before delivery
or payment. Categories are derived from offers when serializing the UI.

A price snapshot is `station_uid -> offer_id -> {unit_price, amount, timestamp}`.
`BuildOrder` creates a `/datum/cargo_order` with its own cart and snapshot and
returns an `order_N` ID. A fixed quote never falls back to a live price. Removing
a station removes its positions and quotes, recalculates the remaining fixed
cost and cancels an empty pending order. Unregistered catalog templates do not
own station UIDs and cannot remove the registered station's orders on deletion.

`inventory` and `hidden_inventory` are catalog input templates. Runtime code
uses `offers` and `offers_by_category`; `trade_offer.stock` owns current stock.
Offer base price, restocking cost, market baseline and demand remain distinct.
Cart totals and cart rows share one price calculation per screen build. The
temporary UI quote is never stored as a preset: presets still contain quantities
and use live prices, with the existing personal-order commission.

## Purchase and refund lifecycle

`Buy(beacon, account, cart, buyer_faction, price_snapshot)` prepares a
`/datum/cargo_purchase`, validates every position and caches packing eligibility,
item size and personal locker settings without creating cargo or moving money.
Execution uses the prepared packing policy and the actual remaining container
capacity, preserving the existing handling of item sizes after initialization.
It executes delivery, payment,
stock and station wealth changes, shipping logs, then demand changes. A rejected
delivery or withdrawal deletes all freight and packaging created by that plan.
Deleting a successful plan releases references and leaves delivered cargo intact.

`PurchaseOrder` derives personal packaging and escrow from the typed order.
Orders move through `pending`, `processing`, `completed` or `cancelled`.
Processing blocks repeated confirmation and cancellation. Successful and
cancelled orders leave the queue through `qdel`.

A failed escrow refund changes the order to `refund_pending`. The order retains
the original escrow account and outstanding amount, and blocks confirmation,
cancellation and removal. `SSsupply.fire()` retries refunds at its existing
interval. Success clears the debt exactly once and restores `pending`, or removes
an empty order. Deleted or suspended accounts are never replaced automatically;
unpaid refunds remain queued until round end and appear in the order log.

Export retains its existing plan, partial purchases, R&D invoice payouts and
child-before-parent freight deletion. Export preparation and execution remain
in `cargo_exports.dm`, `export_matching.dm` and `export_execution.dm`.

## Validation and deployment

The refactor was bracketed with Sierra compilation and DreamChecker checks.
Cargo test fixtures use registered station UIDs and the new APIs. Regression
definitions cover rejected legacy formats, independent copies, fixed prices,
station removal, processing locks, freight rollback and escrow refund retries.
Unit tests were not executed at the user's request; these runtime scenarios
remain unverified.

Legacy cart and snapshot formats have no adapters. Carts are round-local and
require no database migration. Deploy between rounds; roll back by restoring
the previous module version. Prices, fees, contract rewards, trade ranges,
cooldowns and access requirements retain their existing formulas.
