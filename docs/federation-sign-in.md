# Двусторонний вход GiV ↔ Аренда

Локальная реализация от 20.11.2026. Наличие кода не означает выкат.

Обе службы предоставляют POST `/auth/federation/start`, `/issue`, `/complete`, `/link`, `/exchange`, `/confirm` (у Rental дополнительный префикс `/api`).

- `start {returnPath?}` создаёт Mongo pending TTL 5 минут и отдельный случайный host-only HttpOnly browser cookie; возвращает `{url}` на фиксированный сайт провайдера `/federation/authorize?state=...`.
- `issue {state}` требует действующую локальную сессию провайдера; создаёт одноразовый код TTL 60 секунд и возвращает `{url}` на фиксированный callback другого сайта. Код и state передаются во fragment; браузерные JWT другого сайта не передаются.
- `complete {code,state}` проверяет cookie и атомарно занимает pending **до** обмена. Backend POST `/exchange` с `X-Rental-Handoff-Secret`; отдаёт минимальный профиль и одноразовый receipt, привязанный к исходному локальному user ID. Получатель устанавливает private link и подтверждает обратную связь через `/confirm {receipt,remoteId}`. Нельзя передать произвольный исходный local ID. Оба уникальных link созданы до выдачи локальной сессии.
- При совпадении email с локальным аккаунтом `complete` возвращает HTTP409 `{code:"ACCOUNT_LINK_REQUIRED",message}` и сохраняет точный ID найденного аккаунта. `link {state,email,password}` требует исходный browser cookie и native пароль именно этого аккаунта; максимум 5 попыток на pending, пароль остаётся на своём backend. Готовая сессия не считается автоматическим согласием на привязку.
- GiV success: native `{user,accessToken,refreshToken,path}`; Rental: `{user,path}` и свои host-only auth cookies.

Mongo `federationlinks`: уникальные `localId` и `remoteId`, отдельно от редактируемых профилей. Mongo `federationflows`: pending, code и receipt с TTL; истечение дополнительно проверяется в запросе независимо от TTL cleanup. Повторный confirm с тем же receipt и парой безопасен; другая пара отклоняется. Коллекции не содержат паролей или browser JWT; browser nonce и код хранятся как SHA256.

Новый mirror получает исходный контактный email и базовую локальную роль (`user` или `renter`), случайный пароль и server-only `federationOnly=true`. Пароль источника/роли не копируются. Native password login и восстановление GiV для такого mirror закрыты; GiV VK auto-link по email закрыт для mirror. Обычные локальные аккаунты сохраняют свой пароль и роли. Связь не меняется при смене контактных данных. Созданный новым потоком mirror можно восстановить по server-only идентификатору источника после частичного сбоя подтверждения. При неопределённом результате обмена код не отправляется повторно: нужен новый start. Свежий поток завершает ту же существующую пару idempotently.

Старые Rental `externalId/externalProvider` могли присваиваться по email. Они сами по себе не являются доказательством владения и не используются новым потоком. Старый handoff разрешает только новые private links или новые federationOnly mirrors; небезопасные legacy mappings возвращают409 и требуют начать новый вход. Booking UI переведён на новый generic flow.

Настройка: одинаковый независимый серверный `RENTAL_HANDOFF_SECRET` длиной не менее 32 символов. Фиксированные authority: `https://gorodaivesi.ru/auth/federation/*`, `https://api.rent.gorodaivesi.ru/api/auth/federation/*`. Web callback: `https://gorodaivesi.ru/federation/callback` и `https://rent.gorodaivesi.ru/federation/callback`. Shared cookie Domain не используется. Redirect — только канонический относительный локальный путь без внешнего host, backslash/whitespace/fragment.

Проверки без production и без денежных операций:

- GiV: `node --test test/federation.test.js test/federation-profile.test.js test/rental-handoff.test.js`.
- Rental: `./node_modules/.bin/tsc --project tsconfig.build.json`; `node --test test/federation.test.cjs test/handoff.test.cjs`.
- Unit fixtures: оба направления, исходные ID и локальные роли, cookie binding, replay/race, exact-target collision proof, максимум5, no retry after unknown, fresh-flow partial failure recovery, expiry/secret, redirect sanitation, protected profile update, запрет native mirror recovery, отказ raw legacy externalId.

Ограничение: отдельное подтверждение существующего аккаунта поддерживает native пароль. Для аккаунта только с VK без установленного native пароля понадобится native восстановление/поддержка; автоматическая привязка по совпадению email намеренно закрыта.
