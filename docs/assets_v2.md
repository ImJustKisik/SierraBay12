# Assets V2

## Current Audit

### Bulk-send today

- Connection path preloads a fixed resource list in [`code/modules/client/client_procs.dm`](../code/modules/client/client_procs.dm) via `/client/proc/send_resources()`.
- The heavy bulk-send of the entire legacy asset cache happens in [`code/modules/client/client_procs.dm`](../code/modules/client/client_procs.dm) via `/client/proc/after_send_resources()` calling `getFilesSlow(src, asset_cache.cache, register_asset = FALSE)`.
- Late init also backfills the entire legacy asset cache to already connected clients in [`code/modules/client/asset_cache.dm`](../code/modules/client/asset_cache.dm) via `/singleton/asset_cache/proc/load()`.

### Blocking verify today

- [`code/modules/client/asset_cache.dm`](../code/modules/client/asset_cache.dm) blocks in `/proc/send_asset()` with `while(client && !client.completed_asset_jobs.Find(job)) sleep(1)`.
- [`code/modules/client/asset_cache.dm`](../code/modules/client/asset_cache.dm) blocks in `/proc/send_asset_list()` the same way.
- NanoUI common assets currently force `verify = TRUE` through `/datum/asset/nanoui/send()`.
- Goonchat also uses blocking verify through `/datum/asset/simple/goonchat`.

### Legacy asset groups

- `nanoui`: crawls `nano/css`, `nano/images`, `nano/js`, templates, map images, and RnD design icons.
- `goonchat`: `jquery`, chat JS/CSS, `fontawesome`.
- `mod_lobby`: lobby fonts, images, button video.
- `mod_lobby_loop`: lobby loop video.

### Startup dependency map

- Login/title screen:
  - `mods/lobbyscreen/html/lobby.html`
  - `font-awesome.css`, `v4shim.css`, FA webfonts
  - `round-control.woff`, `courierprime-code.woff`
  - `light_left.png`, `light_right.png`, `smallbutton.png`, `buttons.mp4`
  - optional `loop.mp4`
- Chat:
  - `browserOutput.html`
  - `jquery.min.js`, `json2.min.js`, `browserOutput.js`
  - `browserOutput.css`, `browserOutput_white.css`
  - `font-awesome.css`, FA webfonts
- NanoUI:
  - common JS/CSS from `nano/js`, `nano/js/libraries`, `nano/css`
  - per-template `.tmpl` from `nano/templates` or `nano/templates/mods`
  - optional map images
- SUI:
  - uses `browser_shared` + `sui_common` packs
  - `libraries.min.js`, `preact.min.js`, `preact-hooks.min.js`
  - `sui.js`, `sui_components.js`
  - `shared.css`, `icons.css`

## Goals

- No full `asset_cache` send on connect.
- Stable content-addressed keys.
- Explicit packs with dependencies.
- Non-blocking delivery.
- Legacy HTML/NanoUI can migrate incrementally.

## Architecture

### AssetRegistry

`/singleton/asset_registry_v2`

- Registers `logical_id -> /datum/asset_entry_v2`.
- Provides idempotent `register(logical_id, source, meta)`.
- Provides `define_pack(pack_id, assets, deps)`.
- Provides `ensure_asset(client, logical_id)` and `ensure_pack(client, pack_id)`.
- Tracks assets by both `logical_id` and resolved `key`.

### Asset Entry

`/datum/asset_entry_v2`

- `logical_id`
- `key`
- `content_hash`
- `ext`
- `backend`
- `source`
- `meta`

### Packs

`/datum/asset_pack_v2`

- `pack_id`
- `assets`
- `deps`

Initial pack layout:

- `core_bootstrap`
- `login_branding`
- `goonchat`
- `browser_shared`
- `nanoui_common`
- `sui_common`
- `rnd_icons_page_<n>`

## Delivery Flow

### Legacy flow

1. Server populates global `asset_cache`.
2. Client connects and receives a fixed preload from `/client/proc/send_resources()`.
3. Shortly after connect, `/client/proc/after_send_resources()` sends the full `asset_cache` to the client.
4. UI code often assumes required files are already present and references plain names like `shared.css` or `vending_machine.tmpl`.
5. Some asset sends use blocking verify loops and wait until the client confirms receipt.

Implications:

- High connect-time bandwidth cost.
- UI code is coupled to global preload behavior.
- Asset ownership is unclear because many callers depend on side effects from connection startup.
- Filename collisions are possible because keys are often human-readable filenames.

### V2 flow

1. Server registers assets in `asset_registry_v2` under stable `logical_id`s.
2. Each asset resolves to a content-addressed `key` like `asset.<sha1>.<ext>`.
3. Features define explicit packs such as `browser_shared`, `nanoui_common`, `sui_common`, `login_branding`, or feature-specific paged packs.
4. When a UI or feature opens, it calls `ensure_pack()` / `ensure_asset()` for async paths, or the verified variants for UI-critical windows that must not race first open.
5. HTML is rewritten through `{{asset:logical_id}}` or `ASSET("logical_id")`, so frontend markup does not need to know final cache keys.
6. Client-local v2 state tracks which assets, keys, and packs were already sent, preventing duplicate sends.

Implications:

- Connect-time payload can be reduced to zero or near zero.
- Ownership is explicit: the feature that uses the asset requests it.
- Content-addressing makes stale cache collisions much less likely.
- Migration can happen UI-by-UI without replacing all legacy code at once.

### Current implemented vertical slices

- `SUI` requests `sui_common` (which now depends on `browser_shared`, not `nanoui_common`) and interface-specific JS with verified delivery before window open.
- `vending_machine.tmpl` is the first real NanoUI screen using the v2 path.
- Raw `nano/images/*` assets are still exposed under legacy filenames so existing CSS `url(...)` references remain valid during migration.
- Legacy login, most NanoUI screens, goonchat, and generated icon-heavy paths are still on the old system or mixed mode.

## Logical IDs

Format:

- Core: `core.*`, `nano.*`, `chat.*`, `login.*`
- Mods: `mods.<modname>.*`

Rules:

- Lowercase segments.
- Stable semantic path, not filesystem path.
- Re-registration with the same resolved content is allowed.
- Re-registration with different content under the same `logical_id` is a collision and must not silently overwrite.

## Keys

Format:

- `asset.<sha1>.<ext>`

Hash source:

- File-backed assets: `sha1(fcopy_rsc(file))`
- Generated assets: caller provides `meta["content_hash"]` during migration, otherwise they stay on legacy until migrated

Reasoning:

- `sha1` is already available in DM.
- Content-addressing avoids stale-client collisions and deduplicates identical files automatically.

## Delivery Backends

### `byond_rsc`

- Default for current migration.
- Uses `send_rsc(client, content, key)`.
- Non-blocking by default.

### `inline`

- Reserved for tiny generated snippets if needed later.

### `cdn_ready`

- Stub only for now.
- Same registry contract, different URL resolution later.

## Client State

Per-client state tracked separately from legacy `client.cache`:

- sent keys
- sent logical ids
- ensured packs
- counters for connect-time and on-demand sends

Non-blocking send still marks an asset as sent immediately after `send_rsc()` for async paths. Verified delivery is now reserved for narrow UI-critical flows such as SUI, v2 NanoUI windows, login branding, and legacy callers that already depended on blocking verify semantics.

## Resolver Layer

Two compatible forms:

- token rewrite in HTML: `{{asset:logical_id}}`
- DM helper: `ASSET("logical_id")`

The resolver returns the final content-addressed key. This allows old templates to migrate one reference at a time without changing the transport layer again.

## Old vs New

| Aspect | Legacy system | V2 system |
| --- | --- | --- |
| Registration model | Implicit global cache and ad-hoc `send_rsc()` | Explicit registry with `logical_id -> asset entry` |
| Delivery trigger | Mostly connect-time preload and side effects | On-demand per feature or per UI |
| Asset identity | Filename-oriented | Content-addressed key plus stable logical id |
| Collision handling | Best effort, easy to overwrite by filename | Idempotent registration, collision detection, namespaced ids |
| Client state | `client.cache`, `client.sending`, job ack list | sent keys, sent logical ids, ensured packs, counters |
| Verification | Blocking `while/sleep` loops in some paths | Non-blocking by default, verify can be limited to narrow cases |
| UI references | Raw filenames like `shared.css` or `layout_default.tmpl` | Resolver-backed references from logical id to final key |
| Mod support | Ad-hoc prefixes like `mods-...`, easy to drift | Namespaced ids like `mods.<modname>.*` |
| Heavy asset sets | Can be registered and delivered eagerly | Can be split into packs and paged delivery |
| Rollback strategy | Hard because preload is global | Easy to keep v1 and v2 side by side per UI |

### Practical example

Legacy NanoUI vending machine flow:

1. Client connects.
2. Startup code sends broad NanoUI assets through global cache behavior.
3. Vending machine opens `vending_machine.tmpl` assuming common JS, CSS, and templates are already or eventually present.

V2 vending machine flow:

1. Client connects without full-cache bulk-send.
2. Vending machine opts into `asset_delivery_mode = "v2"`.
3. NanoUI common JS/CSS and vending templates are registered and sent only when that UI opens.
4. HTML and template URLs use content-addressed keys resolved from registry entries.

## Migration Strategy

1. Introduce registry v2 beside legacy `asset_cache`.
2. Stop connect-time full-cache bulk-send first.
3. Move one vertical slice to explicit packs and resolver-backed keys.
4. Keep legacy `/datum/asset` as adapter-backed compatibility layer while individual call sites migrate.
5. Replace blocking verify loops with queue/batch acknowledgement only where strictly necessary.
6. Split heavy asset sets, especially RnD icons, into paged packs.
7. Remove legacy preload lists only after their HTML has explicit pack ownership.

## Minimal `core_bootstrap`

Target end state:

- empty or near-empty

Reasoning:

- Login branding should live in `login_branding`.
- Chat should live in `goonchat`.
- NanoUI should live in `nanoui_common`.
- SUI should live in `sui_common`.
- Generic browser assets should move to their own browser pack.
- Shared browser runtime has been split into `browser_shared` and is now consumed by both NanoUI and SUI.
- Connect-time bootstrap must not be treated as authoritative for UI correctness; windows that cannot tolerate a first-open race should verify their own assets before `browse()`.

Transition note:

- The current fixed `send_resources()` preload remains legacy until those raw HTML call sites gain explicit ownership or resolver support.

## SUI Compatibility Layer Notes

`ASSET_PACK_SUI_COMMON` continues to be the SUI runtime pack, now with explicit dependency on `ASSET_PACK_BROWSER_SHARED` (instead of `ASSET_PACK_NANOUI_COMMON`).
No new files were added for iteration 2: compatibility APIs and map abstractions were integrated into existing assets:

- `nano/js/sui.js`
  - `SUI.formatNumber`, `SUI.fixed`, `SUI.round`, `SUI.capitalizeFirstLetter`
  - `SUI.helpers` compatibility object with theme-mode API (`themeMode`, `syndicateMode`, `ntscieMode`, `DAISMode`, `TechMode`)
- `nano/js/sui_components.js`
  - `SUI.ActionLink` (NanoUI-like replacement for link helper patterns)
  - `SUI.MapPanel` (standard map placeholder/toolbar shell for DM-managed map view)

Because these changes are inside already-registered logical IDs (`sui.js.core`, `sui.js.components`), only pack dependency wiring changed in iteration 3 (`sui_common -> browser_shared`).
