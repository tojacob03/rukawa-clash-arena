# Waza Arc: Konto einrichten

Was im Code fertig ist und was nur im Supabase-Dashboard geht. Die App zeigt auf der Anmeldeseite automatisch genau die Wege, die hier eingeschaltet sind; Code muss dafür niemand ändern.

**Schon erledigt (25. September 2026):**

- Sicherheitsprüfung des Projekts und Schließen der Lücken (`supabase/migrations/20260925090000_portal_lock_down_public_access.sql`, KONZEPT.md 8.3).
- Schema `arc` mit Tabelle, Zugriffsregeln und den Funktionen `arc_pull`, `arc_push`, `arc_delete_account` (`supabase/migrations/20260925100000_arc_cloud_save.sql`).
- Erinnerungen: Push-Abos, Versandprotokoll, Cron-Job und Edge Function `arc-reminders` (Abschnitt 8).
- supabase-js 2.106.2, dieselbe Version wie im Lovable-Build.

Alles Folgende passiert im Dashboard des Projekts „Rukawa Portfolio“ (`jtpiybdcuawhnfibrdho`). Die Reihenfolge ist Absicht: Registrierung erst am Schluss einschalten.

---

## 1. Adressen (Authentication → URL Configuration)

- **Site URL:** `https://rukawaanalytics.com`
- **Redirect URLs** (alle drei eintragen):
  - `https://rukawaanalytics.com/arc/`
  - `https://*.lovable.app/arc/` (Lovable-Vorschau)
  - `http://localhost:8080/arc/` (lokale Entwicklung)

Ohne diese Einträge lehnt Supabase die Rückkehr nach Google, Apple und den Mail-Links ab.

## 2. E-Mail (Authentication → Sign In / Providers → Email)

- Email-Anbieter: an. **Confirm email:** an. **Secure email change:** an.
- **Email OTP Expiration:** 3600 Sekunden oder weniger. Der Security-Advisor meldet den jetzigen Wert als zu lang.
- **Email OTP Length:** 6 (die App nimmt 6 bis 10 Ziffern).
- Für mehr als ein paar Mails pro Stunde einen eigenen SMTP-Versand einrichten (Authentication → Emails → SMTP Settings). Der eingebaute Versand ist stark begrenzt und nur für Tests gedacht.

## 3. E-Mail-Vorlagen (Authentication → Emails → Templates)

Die App bietet Code und Link an. Damit der Code in der Mail steht, braucht jede Vorlage `{{ .Token }}`. Die Vorlagen gelten für das ganze Projekt, also auch für den Admin-Login des Portfolios; die folgenden Texte sind deshalb neutral gehalten.

**Magic Link** (Betreff: `Dein Anmeldecode`):

```html
<h2>Dein Anmeldecode</h2>
<p>Gib diesen Code in der App ein:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Oder melde dich in diesem Browser direkt an: <a href="{{ .ConfirmationURL }}">Anmelden</a></p>
<p>Der Code gilt eine Stunde. Wenn du das nicht angefordert hast, ignoriere die Mail.</p>
```

**Confirm signup** (Betreff: `Bestätige deine E-Mail`): gleicher Aufbau, Überschrift „Willkommen“, Satz „Gib diesen Code ein, um deine Adresse zu bestätigen“.

**Reset Password** (Betreff: `Neues Passwort`): gleicher Aufbau, Satz „Mit diesem Code setzt du ein neues Passwort“.

**Change Email Address** (Betreff: `Neue E-Mail bestätigen`): gleicher Aufbau, Satz „Gib diesen Code ein, um die neue Adresse zu bestätigen“.

## 4. Anbieter (Authentication → Sign In / Providers)

Für jeden Anbieter gilt dieselbe Rückruf-Adresse: `https://jtpiybdcuawhnfibrdho.supabase.co/auth/v1/callback`

- **Google:** In der Google Cloud Console einen OAuth-Client vom Typ „Webanwendung“ anlegen, die Rückruf-Adresse als „Autorisierte Weiterleitungs-URI“ eintragen, Client-ID und Secret in Supabase einfügen. Im OAuth-Zustimmungsbildschirm App-Name, Logo und die Datenschutzerklärung angeben.
- **Apple:** braucht ein Apple-Developer-Konto (99 USD im Jahr). App-ID mit „Sign in with Apple“, eine Services-ID mit Domain `rukawaanalytics.com` und der Rückruf-Adresse, dazu einen Schlüssel. Supabase erzeugt daraus das Client-Secret; es läuft nach sechs Monaten ab und muss dann erneuert werden.
- **Discord:** im Discord Developer Portal eine Application anlegen, unter OAuth2 die Rückruf-Adresse eintragen, Client-ID und Secret übernehmen.
- **GitHub:** unter Settings → Developer settings → OAuth Apps eine App anlegen, Rückruf-Adresse als „Authorization callback URL“.

Weitere Anbieter (Microsoft, X, Twitch, Spotify und andere) zeigt die App automatisch mit Namen an, sobald sie eingeschaltet sind.

- **Manual linking:** auf derselben Seite „Allow manual linking“ einschalten. Sonst kann man im Konto keine weiteren Anmeldewege verbinden und ein Gastkonto nicht mit Google sichern.

## 5. Passkeys (Authentication → Passkeys)

- **Enable Passkey authentication:** an.
- **Relying Party Display Name:** `Waza Arc`
- **Relying Party ID:** `rukawaanalytics.com`
- **Relying Party Origins:** `https://rukawaanalytics.com`

Die RP-ID später nicht mehr ändern: Alle registrierten Passkeys hängen daran. In der Lovable-Vorschau (andere Domain) funktionieren Passkeys deshalb nicht, dort nutzt man die anderen Wege. Die Funktion ist bei Supabase noch als experimentell markiert.

## 6. Zweiter Faktor (Authentication → Multi-Factor)

TOTP (Authenticator-App) ist standardmäßig an. Nichts zu tun, außer es wurde ausgeschaltet. Die Datenbank lässt Konten mit bestätigtem zweitem Faktor nur mit `aal2` an ihre Daten.

## 7. Optional

- **Gastkonten** (Anonymous Sign-Ins): einschalten, wenn Leute ohne E-Mail sichern sollen. Dann unbedingt CAPTCHA dazu (Authentication → Attack Protection → Cloudflare Turnstile) und in Lovable die Umgebungsvariable `VITE_ARC_TURNSTILE_SITEKEY` mit dem Site-Key setzen. Supabase räumt alte Gastkonten nicht selbst auf; das lässt sich später mit einem Cron-Job lösen.
- **SMS** (Phone): braucht einen Anbieter wie Twilio oder MessageBird und kostet pro SMS.
- **Leaked password protection:** prüft Passwörter gegen HaveIBeenPwned. Nur in bezahlten Plänen.
- **Postgres-Update:** Der Security-Advisor meldet offene Sicherheitsupdates für die Datenbankversion (Settings → Infrastructure).

## 8. Erinnerungen vor dem Training

Im Code fertig: Wochenplan, Benachrichtigungen (Web Push), E-Mail, Kalender-Datei. Der Kalender funktioniert sofort und ohne Server. Für Push und Mail:

1. **Datenbank und Function: erledigt am 25. September 2026.** Migration `supabase/migrations/20260926090000_arc_reminders.sql` ist angewendet (im Projekt als `arc_reminders`), die Edge Function `arc-reminders` läuft mit `verify_jwt = false` (sie prüft Cron-Geheimnis und Anmeldung selbst), der Cron-Job `arc-reminders` alle fünf Minuten, die VAPID-Schlüssel sind erzeugt (privat nur im Vault). Nach Änderungen an der Function neu deployen mit `supabase functions deploy arc-reminders`. Sobald das Frontend gemergt ist, zeigt der Wochenplan „Auf diesem Gerät einschalten“.
2. **E-Mail (optional):** ein Konto bei [Resend](https://resend.com) anlegen, die Domain `rukawaanalytics.com` verifizieren (drei DNS-Einträge beim Domain-Anbieter), einen API-Key erzeugen. Dann unter Edge Functions → Secrets setzen:
   - `RESEND_API_KEY`: der Key
   - `ARC_MAIL_FROM`: z. B. `Waza Arc <arc@rukawaanalytics.com>`
   Beim nächsten Lauf meldet die Function „Mail bereit“, und der Wochenplan bietet E-Mail an. Der kostenlose Tarif reicht für 100 Mails am Tag.
3. **Prüfen:** Im Wochenplan „Test-Erinnerung schicken“. Fehlgeschlagene Läufe stehen in `cron.job_run_details`, Details in den Logs der Function.

## 9. Crew, Freundeskreis und Gym

Im Code fertig. Solange die Migration fehlt, zeigt der Crew-Reiter „Crew und Freundeskreis sind auf dem Server noch nicht eingerichtet.“, alles andere läuft normal.

1. **Migration anwenden:** `supabase/migrations/20260926120000_arc_social.sql` (legt nur neue Tabellen und Funktionen an, ändert nichts Bestehendes). Sie wurde vorher in einer zurückgerollten Transaktion auf der echten Datenbank durchgespielt.
2. **Prüfen:** zwei Konten, im einen unter Seekarte → Crew einschalten und eine Crew gründen, den Link ans andere schicken, beitreten; im Gym-Bereich ein Gym anlegen und mit dem Code beitreten.

## 10. Registrierung einschalten (zuletzt)

Authentication → Sign In / Providers → **Allow new users to sign up:** an.

Danach einmal selbst durchspielen: auf `https://rukawaanalytics.com/arc/` im Profil „Anmelden oder Konto erstellen“, mit Code anmelden, im Konto einen Passkey und den zweiten Faktor hinzufügen, auf einem zweiten Gerät anmelden und ein Training eintragen.

## 11. Datenschutzerklärung

Die Seite `/datenschutz` des Portfolios braucht einen Abschnitt zu Waza Arc: welche Daten mit Konto gespeichert werden (Anmeldedaten, Trainingsdaten), wo (Supabase, Frankfurt), wozu (Sicherung und Abgleich zwischen Geräten), welche Anbieter bei der Anmeldung beteiligt sein können (Google, Apple, Discord, GitHub, Cloudflare bei aktiviertem CAPTCHA), wie lange (bis zur Löschung des Kontos) und wie man das Konto löscht (in der App unter Konto). Für Erinnerungen dazu: Der Server liest den Wochenplan, speichert pro Gerät die Push-Adresse beim Push-Dienst des Browsers (Google, Apple, Mozilla oder Microsoft stellen die Nachricht zu), Mails verschickt Resend, das Versandprotokoll wird nach 30 Tagen gelöscht. Für Crew, Freundeskreis und Gym dazu: nur nach Einschalten; gespeichert werden der gewählte Name, eine Karte mit Spielwerten (Gurt, Level, Power Level, Flamme, Kopfgeld, Trainings dieser Woche, Avatar, Schiff und Position auf der Seekarte), auf Wunsch die Trainingszeiten (Tag, Uhrzeit, Dauer, Sportart), Freundschaften, Crew- und Gym-Mitgliedschaft; sichtbar nur für Befreundete, die eigene Crew und sichtbare Leute aus dem eigenen Gym; gelöscht beim Ausschalten oder mit dem Konto. Den Text sollte jemand prüfen, der sich mit der DSGVO auskennt.
