# Публичный каталог аренды

ГиВ читает каталог через `GET /rental/listings`, `GET /rental/listings/:id`, `GET /rental/categories`. Авторизация не требуется. Proxy не пишет данные и не создаёт брони.

`RENTAL_API_ORIGIN` задаётся сервером; по умолчанию `https://api.rent.gorodaivesi.ru`. Для локального Nest: `http://127.0.0.1:4382`. Query и заголовки клиента не меняют origin. Таймаут 8 секунд, без повторов. Недоступность/некорректный ответ источника — HTTP 502; ошибки параметров — 400; отсутствующая/непубличная карточка — 404.

Параметры списка: `page`, `limit` (1–48), `search`, `categorySlugs` (через запятую), `priceFrom`, `priceTo`, `pickupMethod` (`self_pickup`/`delivery`), `unitsNeeded`, `sortBy` (`priceAsc`/`priceDesc`), `dateFrom`, `dateTo`. Даты: обе вместе, существующие дни YYYY-MM-DD, период `[dateFrom,dateTo)`, начало строго раньше конца. Поддержка дат требует соответствующего обновления public API аренды.

Список: `{data:[Listing],page,total,totalPages}`. Карточка: `{listing:Listing}`. Listing: `id,title,description,photo?,pricePerDay,minRentalDays,availableUnits,pickupMethods,pickupAddress?,deliveryZone?,categorySlugs,status`. Только `status=active`; фото превращаются в абсолютные HTTP(S) URL; цена передаётся без вычисления или округления.

Категории: `{data:[{id,title,slug,icon?,sortOrder?,isActive:true}]}`.

Доступность отражает снимок каталога, не резервирование. Для периода сервис аренды учитывает одновременную занятость в pending/confirmed/active; свободное количество возвращается для выбранного периода. Создание брони и повторная проверка наличия остаются на площадке аренды.

Проверки: `node --test test/rental-catalog.test.js` (без сети, injected fetch). Backend аренды: `npm run build && node --test test/public-catalog.test.cjs` (модели на fixtures).
