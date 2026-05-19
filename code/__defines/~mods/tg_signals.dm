//MOBS
#define COMSIG_MOB_LAYING_UPDATED "mob_laying_updated" //Отправляется ПОСЛЕ того как изменится положение персонажа (Даже если оно не поменялось в итоге)
#define COMSIG_MOB_LAYING_PRE_UPDATED "mob_laying_pre_updated" //Отправляется ПЕРЕД тем как изменится положение персонажа (Даже если оно не поменялось в итоге)
#define COMSIG_MOB_LAYING_PRE_CHANGED "mob_laying_pre_changed" //Отправляется ПЕРЕД тем как положение персонажа изменяется на НОВОЕ
#define COMSIG_MOB_LAYING_CHANGED "mob_laying_changed" //Отправляется после того как положение персонажа изменяется на НОВОЕ
#define COMSIG_MOB_EQUIPED_SMTHG "mob_equiped_something" //Моб что-то надел/экипировал в слот
//ITEMS
#define COMSIG_ITEM_PICKUPED "item_pickuped" //Данный предмет подобрали
#define COMSIG_MOVABLE_LOC_CHANGED "movable_loc_changed" //переменная loc обьекта изменилась. Перс сделал шаг, предмет убрали из кармана в сумку - чё угодно
//VISION CONE
#define COMSIG_ITEM_EQUIPPED "item_equipped"
#define COMSIG_ITEM_DROPPED "item_dropped"

#define COMSIG_CABINE_OPEN "cabine_open"
#define COMSIG_CABINE_CLOSED "cabine_closed"

//BOTS
#define COMSIG_FARMBOT_TARGET_AVAILABLE "farmbot_target_available" // hydroponics tray стало целью для farmbot
#define COMSIG_FARMBOT_TARGET_CLEARED "farmbot_target_cleared" // hydroponics tray больше не требует внимания farmbot

#define FARMBOT_TARGET_SCAN_RANGE 7
#define FARMBOT_ATTENTION_COLLECT FLAG_01
#define FARMBOT_ATTENTION_WATER FLAG_02
#define FARMBOT_ATTENTION_UPROOT FLAG_03
#define FARMBOT_ATTENTION_NUTRIMENT FLAG_04
