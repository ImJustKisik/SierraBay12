#### Список PRов:

- Pending local implementation

## Sierra UI

ID мода: MODPACK_SUI

### Описание мода

Этот мод переносит стек Sierra UI из `nano/js` в `mods/sui`, сохраняя текущие имена интерфейсов, контракты `SUI.registerInterface(...)`, `NanoUI compat` и существующие DM-вызовы открытия интерфейсов.

### Изменения *кор кода*

- `code\modules\client\asset_registry_v2.dm`: пути регистрации и резолвинга SUI-ассетов переведены на `mods/sui`
- `mods\README.md`: добавлены правила размещения новых SUI-интерфейсов

### Оверрайды

- `mods\sui\code\sui_bootstrap.dm`: `/datum/sui/proc/set_interface()`, `/datum/sui/proc/get_html()`

### Дефайны

- Отсутствуют

### Используемые файлы, не содержащиеся в модпаке

- `nano\js\libraries.min.js`
- `nano\css\shared.css`
- `nano\css\icons.css`

### Авторы:

OpenAI
