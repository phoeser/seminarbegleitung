#!/usr/bin/env python3
"""Lädt einen gebauten Flyer nach Firebase Storage und schreibt die Links in Firestore.

Aufruf (Passwort der Wunsch-Seite nie ins Repo schreiben, nur als Umgebungsvariable):
  WUNSCH_KEY=... python3 hochladen.py <flyer-id> <ausgabeordner> <titel> [--quelle datei.js] [--wunsch <wunsch-id>] [--entwurf]

  --entwurf  : nur hochladen und die Links ausgeben (für die Vorschau eines Vorschlags), Flyer-Dokument nicht ändern
  sonst      : Flyer-Dokument webwuensche/<PASSWORT>/flyer/<flyer-id> setzen (titel, quelle, pdf, png1, png2, vorschau, aktualisiertAm)

Gibt die Links als JSON aus.
"""
import json, sys, time, urllib.parse, urllib.request, datetime, argparse, os

KEY = os.environ.get('WUNSCH_KEY') or sys.exit('Bitte WUNSCH_KEY (Passwort der Wunsch-Seite) als Umgebungsvariable setzen.')
API = 'AIzaSyA2IQa8xWN5vthlwzz0AUbsXlt3I_fyyb0'
BUCKET = 'seminarbegleitung-41bc3.firebasestorage.app'
FS = f'https://firestore.googleapis.com/v1/projects/seminarbegleitung-41bc3/databases/(default)/documents/webwuensche/{KEY}'


def upload(local, remote, ctype):
    url = f'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o?name=' + urllib.parse.quote(remote, safe='')
    req = urllib.request.Request(url, data=open(local, 'rb').read(), method='POST', headers={'Content-Type': ctype})
    urllib.request.urlopen(req).read()
    return f'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/' + urllib.parse.quote(remote, safe='') + '?alt=media'


def fs_val(v):
    if isinstance(v, str): return {'stringValue': v}
    if isinstance(v, bool): return {'booleanValue': v}
    if isinstance(v, (int, float)): return {'doubleValue': v}
    if isinstance(v, dict): return {'mapValue': {'fields': {k: fs_val(x) for k, x in v.items()}}}
    if isinstance(v, list): return {'arrayValue': {'values': [fs_val(x) for x in v]}}
    return {'nullValue': None}


def patch(path, fields):
    q = '&'.join('updateMask.fieldPaths=' + urllib.parse.quote(k) for k in fields)
    req = urllib.request.Request(f'{FS}/{path}?{q}&key={API}', data=json.dumps({'fields': {k: fs_val(v) for k, v in fields.items()}}).encode(),
                                 method='PATCH', headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read())


def main():
    a = argparse.ArgumentParser()
    a.add_argument('flyer_id'); a.add_argument('ordner'); a.add_argument('titel')
    a.add_argument('--quelle'); a.add_argument('--wunsch'); a.add_argument('--entwurf', action='store_true')
    o = a.parse_args()
    stamp = time.strftime('%Y%m%d-%H%M%S')
    base = f'webwuensche/{KEY}/flyer/{o.flyer_id}/{stamp}'
    links = {
        'pdf': upload(os.path.join(o.ordner, 'flyer.pdf'), base + '/flyer.pdf', 'application/pdf'),
        'png1': upload(os.path.join(o.ordner, 'seite-1.png'), base + '/vorderseite.png', 'image/png'),
        'png2': upload(os.path.join(o.ordner, 'seite-2.png'), base + '/rueckseite.png', 'image/png'),
        'vorschau': upload(os.path.join(o.ordner, 'vorschau.png'), base + '/vorschau.png', 'image/png'),
    }
    if not o.entwurf:
        f = {'titel': o.titel, **links, 'aktualisiertAm': datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
        if o.quelle: f['quelle'] = open(o.quelle, encoding='utf8').read()
        patch(f'flyer/{o.flyer_id}', f)
    print(json.dumps(links))


if __name__ == '__main__':
    main()
