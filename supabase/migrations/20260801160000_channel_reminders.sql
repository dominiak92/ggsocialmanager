-- Próg ciszy per kanał — po ilu dniach bez publikacji kanał ma się upomnieć.
--
-- Per kanał, a nie globalnie, bo rytmy są różne: Instagram milczący 3 dni to
-- problem, newsletter co 30 dni to norma. Globalny próg dawałby albo ciągły
-- alarm przy newsletterze, albo ciszę przy Instagramie.
alter table ggsm.channels
  add column if not exists reminder_after_days integer not null default 7;

alter table ggsm.channels
  drop constraint if exists channels_reminder_after_days_check;

-- 0 = kanał świadomie wyłączony z przypominania (np. archiwalny).
alter table ggsm.channels
  add constraint channels_reminder_after_days_check
  check (reminder_after_days >= 0 and reminder_after_days <= 365);

-- Progi startowe wg realnego rytmu kanałów.
update ggsm.channels set reminder_after_days = 3  where code like 'ig-%';
update ggsm.channels set reminder_after_days = 3  where code = 'fb-pl';
update ggsm.channels set reminder_after_days = 7  where code in ('fb-banda', 'tiktok');
update ggsm.channels set reminder_after_days = 14 where code in ('fb-en', 'fb-cz', 'fb-ro', 'fb-de', 'fb-lt', 'youtube', 'www');
update ggsm.channels set reminder_after_days = 30 where code = 'newsletter';
