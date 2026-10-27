# Webseiten-Wünsche v2 – Arbeitsstand (27.10.2026)

Entscheidungen Paul (27.10.):
- Öffentliche URL mit einfachem Passwort: seminar.nicole-ohlemueller.de/wuensche/
- „Wirklich alles automatisch“ (Text, Bilder, Buttons, Links, Abschnitte, Layout) – vor Strukturänderungen Sicherungskopie der Seite
- Stündlich 8–20 Uhr
- Passwort legt Paul fest (steht aus)
- Alte Artifact-Wunsch-Seite abschalten, sobald die neue läuft

Technik:
- Datei wuensche/index.html im Repo phoeser/seminarbegleitung (GitHub Pages)
- Firestore: webwuensche/{PASSWORT}/items/{id} – Regel erlaubt Zugriff nur, wenn der Pfad-Schlüssel dem Passwort entspricht (Passwort steht nur in der Firebase-Konsole, nicht im öffentlichen Repo)
- Storage: webwuensche/{PASSWORT}/{wunschId}/{datei} für Bilder
- Geplante Aufgabe liest/schreibt per Firestore-REST (ohne Login, über den Passwort-Pfad)

Offen:
- [ ] Passwort von Paul
- [ ] Firestore-Regeln + Storage-Regeln in der Konsole veröffentlichen
- [ ] Storage aktiviert? prüfen
- [ ] Deploy wuensche/index.html
- [ ] Ende-zu-Ende-Test
- [ ] Geplante Aufgabe umstellen (stündlich, REST, alles automatisch, Sicherungskopie)
- [ ] Alte Artifact-Seite löschen, Doku aktualisieren
