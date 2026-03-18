# SUI Migration Backlog

Подробный backlog миграции с `nanoUI` на `SUI`.

Этот документ дополняет [sui.md](./sui.md) и служит рабочим списком для поэтапного cutover. Он не заменяет migration checklist из основной документации, а раскладывает оставшиеся интерфейсы по категориям и приоритетам.

## Сводка

Сейчас уже перенесены все основные интерфейсы modular computers, которые зарегистрированы через `sui_interface_name`, а также несколько high-traffic программ и `VendingMachine`-подобные кейсы из SUI unit tests. В backlog остаются в основном standalone-machines, консоли и более рискованные legacy/template-heavy интерфейсы.

## Уже перенесено

Эти интерфейсы уже стоит считать закрытыми для миграции:

- `WordProcessor`
- `NTNetDownloader`
- `NTTransfer`
- `Newscast`
- `AccessDecrypter`
- `ComputerDos`
- `Revelation`
- `ComputerConfigurator`
- `Docking`
- `ArcadeClassic`
- `Scanner`
- `Library`
- `DeckManagement`
- `AIDiag`
- `NTNRCClient`
- `NTNetMonitor`
- `ForceAuthorization`
- `CardMod`
- `EngineControl`
- `Munitions`
- `PowerMonitor`
- `AlarmMonitor`
- `AtmosControl`
- `Rcon`
- `ShieldsMonitor`
- `SupermatterMonitor`
- `Reports`
- `CrewRecords`
- `DigitalWarrant`
- `EmailAdministration`
- `EmailClient`
- `Supply`
- `Comm`
- `FileManager`
- `CrewMonitor`
- `ShipSensors`
- `CrewManifest`
- `CameraMonitor`

Опорный источник для этого списка:

- `code/unit_tests/extension_tests.dm`

## Оставшийся backlog

### 1. Standalone machinery и консоли

Приоритет: `P1-P2`

Это большая масса пользовательских UI вне NTOS. Их миграция потребует ручного `ui_interact_sui`, `sui_act` и, в ряде случаев, `sui_update`.

- Энергия и атмос:
  - `APC`
  - `SMES`
  - `Battery Rack`
  - `Generator`
  - `PACMAN / Port Gen`
  - `Power Monitor`
  - `Air Alarm`
  - `Air Control`
  - `Portable Scrubber`
  - `Portable Pump`
  - `Canister`
  - `Outlet Injector`
  - `Heater`
  - `Gas Extractor`
  - `Freezer`
  - `Mixer`
  - `Filter`
  - `Pump`
  - `Passive Gate`
  - `Oxyregenerator`
- Шаттлы и embedded controllers:
  - `Shuttle Console`
  - `Emergency Shuttle`
  - `Escape Pods`
  - `Simple Docking Controller`
  - `Airlock Docking Controllers`
  - `Tin Can`
- Станционные машины:
  - `Airlock`
  - `Door Timer`
  - `Shield Generator`
  - `Shield Wall Generator`
  - `Supermatter`
  - `Fusion Console`
  - `Helm`
  - `Disperser Console`
  - `Requests Console`
  - `Guest Pass`
  - `Robot Console`
  - `Turret Controller`
  - `Portable Turret`
  - `Nuclear Bomb`
- Сервис и логистика:
  - `Smartfridge`
  - `Seed Storage`
  - `Botany Extractor`
  - `Botany Editor`
  - `Biogenerator`
  - `Accounts DB`
  - `Laptop Vendor`
  - `Janicart`

Опорные пути:

- `code/game/machinery/doors/airlock.dm`
- `code/modules/power/apc.dm`
- `code/modules/reagents/Chemistry-Machinery.dm`
- `code/modules/hydroponics/seed_storage.dm`

### 2. Медицинские, научные и предметные UI

Приоритет: `P2`

Часть этих интерфейсов high-traffic, но они чаще содержат более хрупкую логику Topic/href, предметные edge cases или сложные data payloads.

- Медицинские машины:
  - `Sleeper`
  - `Cryo Cell`
  - `Body Scanner Console`
  - `Body Scan Display`
- Химия и реактивы:
  - `ChemMaster`
  - `Chemical Dispenser`
  - `Borghypo`
- Наука:
  - `DNA Forensics`
  - `Radiocarbon Spectrometer`
  - `Robotics Fabricator`
- Предметы и носимое:
  - `GPS`
  - `Transfer Valve`
  - `Suit Sensor Jammer`
  - `Radio Jammer`
  - `Tank UI`
  - `AI Card`
  - `Syndicate ID`
  - `Uplink item`
  - `Modular Computer item`
  - `RIG UI`
  - `Synthesized Instruments`
  - `Radio` variants
  - `pAI` software/modules

Опорные пути:

- `code/game/machinery/Sleeper.dm`
- `code/modules/reagents/reagent_containers/borghypo.dm`
- `code/game/objects/items/devices/radio/radio.dm`

### 3. Legacy/template-heavy и модовый контент

Приоритет: `P2-P3`

Это самые рискованные миграции. Их лучше делать после стабилизации ядра `SUI` и high-traffic base-game интерфейсов.

- Template-heavy из base:
  - интерфейсы с `auto_update_layout`
  - интерфейсы с `add_template`
  - интерфейсы со сложным `href/Topic`
  - map-heavy окна с `mapHeader` / `mapContent`
- Явные сложные кейсы:
  - `Crew Monitor` legacy path
  - `Merchant`
  - офисные NTOS-интерфейсы
  - химия
  - часть engineering-monitoring окон
- Моды:
  - `RnD` автоматы и связанные программы
  - `cargo`
  - `gravity_generator`
  - `virusology`
  - `newUI`
  - `jukebox_tapes`
  - `utility_items`
  - `paimod`
  - `ipc_mods`
  - `xeno_whitelist`
  - прочие модовые `nanoUI`

Опорные пути:

- `code/modules/nano/nanoui.dm`
- `mods/RnD/code/machinery/autolathe.dm`
- `code/modules/modular_computers/file_system/programs/medical/suit_sensors.dm`

## Рекомендуемый порядок миграции

1. Закрыть все оставшиеся NTOS-программы без `sui_interface_name`.
2. Перенести high-traffic standalone UI:
   - `APC`
   - `Airlock`
   - `ChemMaster`
   - `Sleeper`
   - `Shuttle / Docking`
   - `Power / Atmos` консоли
3. После этого переносить предметные UI и редкие машины.
4. Моды и template-heavy legacy переносить последними, когда базовый стек уже стабилизирован.

## Test Plan

Для каждой миграции проверять:

- open
- auto-update
- action roundtrip
- close / reopen
- статусы `interactive / update / disabled / close`

Для map-heavy окон отдельно проверять:

- `set_show_map`
- переключение `z_level`
- возврат default map capture

Для high-traffic интерфейсов добавлять parity-тесты по аналогии с текущими SUI unit tests.

## Assumptions

- За уже перенесённые считаются интерфейсы из SUI unit test и `VendingMachine`.
- Список включает и base-repo, и модовый контент.
- Приоритеты расставлены по полезности для cutover, а не по сложности реализации.
