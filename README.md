# Seminarbegleitung

Web-App für die Seminare von Nicole Ohlemüller: Selbsteinschätzung vorab, Check-Ins vor jedem Termin, Übungen zum Nachüben, Orientierungs-Check vor der Buchung und Admin-Bereich.

- **Seite:** GitHub Pages (`index.html`, eine Datei)
- **Daten & Login:** Firebase-Projekt `seminarbegleitung-41bc3` (Firestore in Frankfurt, Login per E-Mail-Link)
- **Sicherheitsregeln:** `firestore.rules` (Kopie der in Firebase veröffentlichten Regeln – bei Änderungen beide anpassen)
- **Admins:** in `firestore.rules` **und** in `index.html` (Konstante `ADMINS`) eingetragen
- **Demo ohne Datenbank:** Adresse mit `#demo` am Ende aufrufen
