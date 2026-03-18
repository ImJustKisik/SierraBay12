<!-- SIERRA-EDIT - SUI - migration status and references updated -->
# SUI (Sierra UI) Framework

**SUI** — легковесный реактивный UI-фреймворк для SierraBay12, построенный на [Preact](https://preactjs.com/) поверх транспорта NanoUI. Заменяет `.tmpl`-шаблоны doT.js на компонентный подход с Virtual DOM, сохраняя совместимость с IE11 в BYOND.

---

## Почему SUI?

NanoUI пересобирает весь HTML при каждом `push_data()` — сбрасывает фокус, скролл, лагает. Логика вида `{{if data.x}}` перемешана с разметкой, а интерактивные элементы требуют jQuery-хаков.

SUI решает это:
- **Virtual DOM** — обновляются только изменившиеся элементы, фокус и скролл живут.
- **Компоненты** — переиспользуемые `SUI.Button`, `SUI.Section`, `SUI.ProgressBar` вместо copy-paste `.tmpl`.
- **Frameless WindowChrome** — кастомные перетаскиваемые окна без рамок ОС.
- **`sui_act()` / `sui_data()`** — чистый API вместо сырого Topic/href.

---

## Архитектура

### Серверная часть (DM)
- `code/modules/sui/sui.dm` — `/datum/sui`, SSnano-интеграция, open/close/push_data.
- `code/modules/nano/modules/nano_module.dm` — SUI-интеграция для modular computers (`sui_interface_name`, `sui_data()`, `ui_interact_sui()`).
- `code/modules/modular_computers/file_system/program.dm` — автоматическая делегация на SUI в `ui_interact()`.

### Клиентская часть (JS)
- `nano/js/sui.js` — ядро: transport, `useBackend()` хук, state store, `SUI.act()`.
- `nano/js/sui_components.js` — готовые компоненты.
- `nano/js/sui_[interface].js` — код конкретных интерфейсов (напр. `sui_shipsensors.js`).

---

## Создание интерфейса

### Для standalone-машины

```dm
// DM: открытие UI
/obj/machinery/my_gadget/ui_interact_sui(mob/user)
	var/datum/sui/ui = SSnano.try_update_sui(user, src, "main")
	if(!ui)
		ui = new /datum/sui(user, src, "MyGadget", "My Gadget", 400, 500)
		ui.set_auto_update(TRUE)
		ui.open(get_data(user))
	else
		ui.push_data(get_data(user))

/obj/machinery/my_gadget/proc/get_data(mob/user)
	return list("active" = active, "power" = power_level)

/obj/machinery/my_gadget/sui_act(action, list/params, datum/sui/ui)
	if(action == "toggle")
		active = !active
		return TRUE
	return FALSE

/obj/machinery/my_gadget/sui_update(mob/user, datum/sui/ui)
	ui.push_data(get_data(user))
```

### Для программы modular computer (nano_module)

Программы используют встроенную SUI-интеграцию `nano_module`. Достаточно задать `sui_interface_name` — `program.dm` автоматически делегирует рендер на SUI вместо NanoUI.

```dm
// program file
/datum/computer_file/program/my_program
	filename = "myprog"
	filedesc = "My Program"
	nanomodule_path = /datum/nano_module/program/my_program

// nano_module — задаём SUI и данные
/datum/nano_module/program/my_program
	name = "My Program"
	sui_interface_name = "MyProgram"  // включает SUI
	sui_width = 500
	sui_height = 400

/datum/nano_module/program/my_program/sui_data(mob/user)
	var/list/data = host.initial_data()
	data["power"] = powered
	data["temperature"] = temperature
	return data

/datum/nano_module/program/my_program/sui_act(action, list/params, datum/sui/ui)
	switch(action)
		if("toggle")
			powered = !powered
			return TRUE
	return FALSE
```

Всё — `program.dm` вызовет `NM.ui_interact_sui()`, который откроет/обновит SUI-окно, а `sui_update()` базового класса будет пушить `sui_data()` каждый тик автообновления.

### JS-компонент

Создайте `nano/js/sui_myprogram.js`:

```javascript
;(function () {
    var h = SUI.h
    var useBackend = SUI.useBackend

    function MyProgram() {
        var backend = useBackend()
        var data = backend.data
        var act = backend.act

        return h('div', null,
            h(SUI.Section, { title: 'Controls' },
                h(SUI.Button, {
                    onClick: function() { act('toggle') },
                    selected: data.power
                }, data.power ? 'ON' : 'OFF')
            )
        )
    }

    SUI.registerInterface('MyProgram', MyProgram)
})()
```

### Asset Registry

SUI использует `asset_registry_v2`. `sui.dm` автоматически находит ассет по имени интерфейса и гарантирует verified доставку `sui_common` и `sui_[interface].js` перед `browse()`. Legacy fallback через `<script src='...'>` остаётся как запасной путь.

---

## Компоненты (`sui_components.js`)

### `SUI.Button`
```javascript
h(SUI.Button, {
    icon: 'power-button', // CSS-класс из NanoUI icons
    selected: true,       // подсветка как активная
    disabled: false,
    onClick: function() { act('toggle') }
}, "Toggle Power")
```

### `SUI.ProgressBar`
```javascript
h(SUI.ProgressBar, {
    value: data.health,
    min: 0,
    max: 100,
    color: 'good',       // 'good', 'average', 'bad'
    showText: data.health + '%'
})
```

### `SUI.Section`
```javascript
h(SUI.Section, { title: "Settings" }, children)
```

### `SUI.LabeledList` + `SUI.LabeledList.Item`
```javascript
h(SUI.LabeledList, null,
    h(SUI.LabeledList.Item, { label: "Power" }, data.power ? "ON" : "OFF"),
    h(SUI.LabeledList.Item, { label: "Heat" }, data.heat + "°C")
)
```

### `SUI.Table`, `SUI.Table.Row`, `SUI.Table.Cell`
```javascript
h(SUI.Table, null,
    h(SUI.Table.Row, null,
        h(SUI.Table.Cell, null, "Name"),
        h(SUI.Table.Cell, null, "Value")
    )
)
```

### `SUI.NoticeBox`
```javascript
h(SUI.NoticeBox, null, "Informational message")
h(SUI.NoticeBox, { danger: true }, "Critical error!")
```

### `SUI.WindowChrome`
Кастомная перетаскиваемая шапка. Работает только с `ui.set_frameless(TRUE)` в DM.
```javascript
h(SUI.WindowChrome, {
    title: backend.config.title,
    subtitle: "Status: OK",
    badgeText: "M",
    accent: "#40628a",
    draggable: true
})
```

### `SUI.Tabs` + `SUI.Tabs.Tab`
Вкладки. Поддерживает вертикальный режим.
```javascript
h(SUI.Tabs, { vertical: false },
    h(SUI.Tabs.Tab, { selected: tab === 'main', onClick: function() { setTab('main') } }, "Main"),
    h(SUI.Tabs.Tab, { selected: tab === 'settings', icon: 'cog', onClick: function() { setTab('settings') } }, "Settings")
)
```

### `SUI.NumberInput`
Числовое поле с кнопками +/-, поддержка колеса мыши.
```javascript
h(SUI.NumberInput, {
    value: data.range,
    step: 1,
    minValue: 1,
    maxValue: 10,
    unit: "tiles",
    onChange: function(v) { act('set_range', { range: v }) }
})
```

### `SUI.Dropdown`
Выпадающий список. `options` — массив строк или `{ value, label }`.
```javascript
h(SUI.Dropdown, {
    selected: data.channel,
    options: ['Common', 'Engineering', 'Medical'],
    // или: options: [{ value: 'eng', label: 'Engineering' }]
    placeholder: 'Select channel...',
    width: '200px',
    onSelected: function(v) { act('set_channel', { channel: v }) }
})
```

### `SUI.Input`
Текстовое поле. `onEnter` срабатывает по Enter.
```javascript
h(SUI.Input, {
    value: data.search,
    placeholder: 'Search...',
    fluid: true,
    onChange: function(v) { /* live filtering */ },
    onEnter: function(v) { act('search', { query: v }) }
})
```

### `SUI.Slider`
Ползунок с кликом и колесом мыши.
```javascript
h(SUI.Slider, {
    value: data.power,
    minValue: 0,
    maxValue: 100,
    step: 5,
    unit: '%',
    color: '#40628a',
    onChange: function(v) { act('set_power', { power: v }) }
})
```

### `SUI.Collapsible`
Сворачиваемая секция.
```javascript
h(SUI.Collapsible, { title: 'Advanced Settings', open: false, icon: 'cog' },
    /* children */
)
```

### `SUI.Modal`
Модальное окно поверх интерфейса. Закрывается по клику на фон.
```javascript
h(SUI.Modal, {
    open: showConfirm,
    title: 'Confirm Reset',
    width: '350px',
    onClose: function() { setShowConfirm(false) }
},
    h('p', null, 'Are you sure?'),
    h(SUI.Button, { onClick: function() { act('reset') } }, 'Reset')
)
```

### `SUI.Stack` + `SUI.Stack.Item`
Flex-layout. `vertical` — колонка, иначе строка.
```javascript
h(SUI.Stack, { gap: '8px', fill: true },
    h(SUI.Stack.Item, { grow: true }, h(SUI.Input, { placeholder: 'Search...' })),
    h(SUI.Stack.Item, null, h(SUI.Button, { onClick: go }, 'Go'))
)
```

### `SUI.Icon`
Иконка из NanoUI icon set.
```javascript
h(SUI.Icon, { name: 'power-button', size: '16', spin: false })
```

### `SUI.Tooltip`
Всплывающая подсказка при наведении. Позиции: `top`, `bottom`, `left`, `right`.
```javascript
h(SUI.Tooltip, { text: 'Toggle power supply', position: 'top' },
    h(SUI.Button, { onClick: toggle }, 'Power')
)
```

---

## Продвинутые возможности

### Смена интерфейса на лету (`set_interface`)
Аналог NanoUI `reinitialise()`. Перезагружает страницу с новым JS без закрытия окна:
```dm
ui.set_interface("NewInterface", list("mode" = "advanced"))
```

### Встроенная карта (`set_show_map`)
Встраивает BYOND-карту в нижнюю часть окна (камеры, сенсоры, crew monitor):
```dm
ui.set_show_map(TRUE, map_z_level, 256)  // показать
ui.set_show_map(FALSE)                    // скрыть
```

---

## Заметки

1. **Нет JSX.** BYOND использует IE11 (ES5), сборки нет — пишем через `SUI.h('tag', {props}, children)`.
2. **Иконки предметов через Base64.** Прогнать через `icon2base64()` в DM, передать в JSON, отрисовать как `<img src="data:image/png;base64,...">` с `image-rendering: pixelated`.
3. **CSS в JS.** Стили можно инжектить через `SUI.useEffect` при загрузке компонента, без отдельных CSS-файлов.
4. **`nano_module` + SUI.** Задайте `sui_interface_name` — и `program.dm` автоматически вызовет `ui_interact_sui()`. Переопределите `sui_data()` для данных и `sui_act()` для действий. `sui_update()` базового класса пушит `sui_data()` каждый тик.

---

## NanoUI -> SUI Migration Cookbook

This section documents migration patterns for moving `.tmpl` + helper usage to SUI components with minimum rewrite risk.

### `helper.link` -> `SUI.ActionLink`

Legacy template style:

```js
helper.link("Toggle", "power-button", { toggle: 1 }, status)
```

SUI style:

```javascript
h(SUI.ActionLink, {
    icon: "power-button",
    selected: data.enabled,
    disabled: !data.can_toggle,
    className: "myLinkClass",
    onClick: function () { act("toggle") }
}, "Toggle")
```

Notes:

- `SUI.ActionLink` uses NanoUI-compatible `link/linkActive` visuals.
- For full-width rows, pass `fluid: true`.
- Prefer explicit `act("action", params)` calls over href-string generation.

### `helper.displayBar` -> `SUI.ProgressBar` (or helper math + custom bar)

Legacy template style:

```js
helper.displayBar(value, 0, 100, "good", value + "%")
```

SUI style:

```javascript
h(SUI.ProgressBar, {
    value: data.value,
    min: 0,
    max: 100,
    color: "good",
    showText: SUI.round(data.value) + "%"
})
```

You can also combine `SUI.formatNumber`, `SUI.fixed`, and custom CSS when a specialized bar is needed.

### Map templates (`mapHeader/mapContent`) -> `SUI.MapPanel` + DM `set_show_map`

Legacy NanoUI commonly used separate templates for map header/content.
In SUI, use a single component shell and keep map embedding controlled by DM:

```javascript
h(SUI.MapPanel, {
    active: !!backend.config.map_visible,
    toolbar: h(SUI.ActionLink, { onClick: function () { act("reset") } }, "Disconnect"),
    activeMessage: "Live feed is active.",
    inactiveMessage: "Select a source to enable map.",
    hint: "Map viewport is managed via set_show_map(...)."
})
```

DM side (unchanged control flow):

```dm
ui.set_show_map(TRUE, map_z_level, 256)
ui.set_show_map(FALSE)
```

`/datum/sui` now exposes `config.map_visible` and `config.map_height` to support consistent frontend state.

### Template migration skeleton (new interface)

DM:

```dm
/datum/nano_module/program/example
	sui_interface_name = "Example"

/datum/nano_module/program/example/sui_data(mob/user)
	var/list/data = host.initial_data(program)
	data["value"] = current_value
	return data

/datum/nano_module/program/example/sui_act(action, list/params, datum/sui/ui)
	if(action == "toggle")
		enabled = !enabled
		return TRUE
	return FALSE
```

JS:

```javascript
;(function () {
    var h = SUI.h
    var useBackend = SUI.useBackend

    function Example() {
        var backend = useBackend()
        var data = backend.data
        var act = backend.act

        return h(SUI.Section, { title: "Example", fill: true },
            h(SUI.ActionLink, { onClick: function () { act("toggle") } }, "Toggle"),
            h("div", null, "Value: " + SUI.formatNumber(data.value || 0))
        )
    }

    SUI.registerInterface("Example", Example)
})()
```

## Migration Checklist

1. Add `sui_interface_name` and keep old NanoUI path until SUI reaches parity.
2. Move data building into `sui_data()` and actions into `sui_act()`.
3. Replace `helper.link` with `SUI.ActionLink` and common bars with `SUI.ProgressBar`.
4. If map is involved, migrate to `SUI.MapPanel` while keeping DM `set_show_map(...)`.
5. Use SUI compatibility helpers (`SUI.formatNumber`, `SUI.fixed`, `SUI.round`, `SUI.capitalizeFirstLetter`) for repeated formatting logic.
6. Verify: open, update tick, close/reopen, out-of-range status, and map on/off transitions.

## Migration Status (Iteration 3)

Detailed categorized backlog: [sui_migration_backlog.md](./sui_migration_backlog.md)

### Migrated

- Standalone:
  - `VendingMachine` (`code/game/machinery/vending/_vending.dm` + `nano/js/sui_vendingmachine.js`)
- Modular computers / NTOS:
  - `ShipSensors` (`ship/sensors.dm`)
  - `CrewManifest` (`generic/crew_manifest.dm`)
  - `CameraMonitor` (`generic/camera.dm`)
  - `WordProcessor` (`generic/wordprocessor.dm`) - migrated in iteration 3
  - `NTNetDownloader` (`generic/ntdownloader.dm`) - migrated in iteration 3
  - `NTTransfer` (`generic/nttransfer.dm`) - migrated in iteration 3
  - `Newscast` (`generic/news.dm`) - migrated in iteration 3

### Pending (priority/high-traffic first)

- NTOS utilities/office:
  - `File Manager` (`generic/file_browser.dm`)
  - `Email Client` (`generic/email_client.dm`)
  - `Supply` (`generic/supply.dm`)
  - `Records` (`generic/records.dm`)
  - `NTNRC Client` (`generic/ntnrc_client.dm`)
- Monitoring/engineering:
  - `Power Monitor`, `Alarm Monitor`, `Atmos Control`, `Supermatter Monitor`, `RCON`, `Shields Monitor`
- Other NanoUI-heavy programs:
  - `Deck Management`, `Docks`, `Scanner`, `Library`, `Reports`, security/antag modules

### Blockers / Risks

- Legacy workflows with multiple modal `input()/alert()` calls (especially file/document tools) can regress if action parity is incomplete.
- Map-heavy and template-composed UIs (`mapHeader/mapContent`) still require careful DM-side `set_show_map()` parity validation.
- Some old modules carry fragile Topic/href flows; migration should keep a shared action handler used by both NanoUI and SUI to avoid drift.
- Asset correctness on first-open depends on verified packs; missing interface JS should hard-fail early (already enforced in `sui.dm`).

### Definition Of Done for full NanoUI cutover

1. Every high-traffic player-facing UI has `sui_data/sui_act` and a shipped `nano/js/sui_<interface>.js`.
2. `nanoui_common` is no longer required for any SUI code path (only shared/browser pack deps remain).
3. SUI smoke/parity tests cover lifecycle, roundtrip actions, and status gating, and migrated interfaces have regression checks.
4. Unmigrated NanoUI windows are explicitly tracked, with owners and target iteration.
5. Server config/feature flag exists to disable NanoUI path in staging and complete one full playtest cycle without functional regressions.
6. Legacy `.tmpl` loading for migrated interfaces is removed from runtime paths.

Typical mistakes:

- Using old href-style params directly instead of `act("action", params)`.
- Forgetting to return `TRUE` in `sui_act` after handling an action.
- Assuming map is rendered by JS instead of DM `set_show_map`.
- Migrating visuals but leaving duplicated formatting logic instead of using shared helpers.
