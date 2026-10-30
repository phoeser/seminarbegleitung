// Flyer „Neurobalance Training“ (A5, Vorder- und Rückseite, 3 mm Beschnitt) – Quelle für die Webseiten-Wünsche.
// Aufruf: node flyer.js <Ausgabeordner>   (braucht: npm i qrcode @fontsource/instrument-sans @fontsource/source-serif-4; playwright)
// Ergebnis: flyer.pdf (Druck, mit Beschnitt), seite-1.png, seite-2.png (300 dpi, A5 Endformat), vorschau.png (beide Seiten nebeneinander)
const QR_URL = 'https://www.nicole-ohlemueller.de/neurobalance-training-bonn';
const OUT = process.argv[2] || 'out';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const F = p => 'file://' + path.resolve('node_modules/@fontsource', p);
let qr = '';

const C = { petrol: '#244A52', creme: '#F8F2EA', terra: '#B86B4B', terraSoft: '#F2E0D5', sand: '#D8C8B4', anth: '#252422', line: '#D9B7A5' };

const css = `
@font-face{font-family:IS;src:url(${F('instrument-sans/files/instrument-sans-latin-400-normal.woff2')});font-weight:400}
@font-face{font-family:IS;src:url(${F('instrument-sans/files/instrument-sans-latin-500-normal.woff2')});font-weight:500}
@font-face{font-family:IS;src:url(${F('instrument-sans/files/instrument-sans-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:SS;src:url(${F('source-serif-4/files/source-serif-4-latin-400-italic.woff2')});font-style:italic}
@page{size:154mm 216mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${C.creme}}
body{font-family:IS;color:${C.petrol}}
.page{width:154mm;height:216mm;position:relative;overflow:hidden;background:${C.creme};page-break-after:always}
/* Inhalt im Beschnittrahmen: 3 mm Beschnitt + 12 mm Rand */
.in{position:absolute;left:15mm;right:15mm;top:0;bottom:0}
.kick{position:absolute;top:14mm;font-size:8.3pt;letter-spacing:.16em;text-transform:uppercase;color:${C.terra};font-weight:500;padding-bottom:2.6mm;border-bottom:1px solid ${C.terra}}
.qrsvg{width:100%;height:100%;display:block}
/* Vorderseite */
.arc{position:absolute;border-radius:50%;border:1px solid ${C.line}}
.f h1{position:absolute;top:28mm;font-weight:500;font-size:41pt;line-height:1.02;letter-spacing:-.015em;color:${C.petrol}}
.f .rule{position:absolute;top:80.5mm;width:19mm;border-top:1.4px solid ${C.terra}}
.f .sub{position:absolute;top:86mm;font-size:18.5pt;line-height:1.22;color:${C.petrol}}
.f .lab{position:absolute;top:114mm;font-size:10.2pt;letter-spacing:.2em;text-transform:uppercase;color:${C.terra};font-weight:500;padding-bottom:2.8mm}
.f .lab:after{content:"";position:absolute;left:0;bottom:0;width:15.5mm;border-top:1.4px solid ${C.terra}}
.f .body{position:absolute;top:128.5mm;width:98mm;font-size:12.6pt;line-height:1.32;color:${C.petrol}}
.f .nb{position:absolute;top:148.5mm;font-size:10.6pt;color:${C.petrol}}
.f .wse{position:absolute;top:154mm;font-size:12.4pt;font-weight:500;color:${C.terra}}
.divider{position:absolute;left:3mm;right:3mm;border-top:1px solid ${C.line}}
.info{position:absolute;display:flex;align-items:flex-start}
.info .q{flex:none}
.info .vr{flex:none;border-left:1.2px solid ${C.terra};align-self:stretch;margin:0 7mm 0 7.5mm}
.f .info{top:174.5mm;left:15mm;right:12mm}
.f .info .q{width:20.5mm;height:20.5mm;margin-top:.6mm}
.f .info .t{font-size:9.5pt;line-height:1.5;color:${C.petrol}}
.f .info .t b{display:block;font-weight:600;font-size:10.3pt;line-height:1.35}
.f .info .t .g{margin-top:2.4mm}
.f .info .t .o{font-size:8.6pt;line-height:1.4}
.f .info .t .d{font-weight:600}
/* Rückseite */
.b h2{position:absolute;top:25.5mm;font-weight:500;font-size:27pt;line-height:1.1;letter-spacing:-.01em;color:${C.petrol}}
.b .list{position:absolute;top:53.5mm;left:15mm;right:12mm;display:flex;flex-direction:column;gap:4.1mm}
.b .it{display:flex;gap:7mm;align-items:center}
.b .num{flex:none;width:13mm;height:13mm;border-radius:50%;background:${C.terraSoft};color:${C.terra};font-size:13pt;display:flex;align-items:center;justify-content:center}
.b .it b{display:block;font-weight:600;font-size:10.4pt;line-height:1.3;color:${C.petrol}}
.b .it span{display:block;font-size:9.6pt;line-height:1.35;color:${C.petrol}}
.b .quote{position:absolute;top:133.5mm;left:15mm;right:14mm;display:flex;gap:4mm}
.b .qm{flex:none;font-family:SS;font-style:normal;font-size:40pt;line-height:.8;color:${C.terra};margin-top:-.5mm}
.b .qt{font-family:SS;font-style:italic;font-size:11.8pt;line-height:1.4;color:${C.petrol}}
.b .who{margin-top:2.8mm;font-family:IS;font-style:normal;font-size:7.4pt;letter-spacing:.16em;text-transform:uppercase;color:#5E5A55}
.b .info{top:170mm;left:15mm;right:12mm}
.b .info .q{width:19mm;height:19mm;margin-top:.5mm}
.b .info .t{font-size:9.1pt;line-height:1.45;color:${C.petrol}}
.b .info .t b{display:block;font-weight:600;font-size:10.3pt;line-height:1.35}
.b .info .t .g{margin-top:2.2mm}
.b .facts{position:absolute;left:3mm;right:3mm;top:195mm;text-align:center;font-size:8.3pt;color:${C.petrol}}
.b .contact{position:absolute;left:3mm;right:3mm;top:201.5mm;text-align:center;font-size:8.3pt;color:${C.petrol}}
.b .contact b{font-weight:600}
`;

const front = () => `<div class="page f">
  <div class="arc" style="width:84mm;height:84mm;left:109mm;top:-4mm"></div>
  <div class="arc" style="width:64mm;height:64mm;left:119mm;top:6mm"></div>
  <div class="in">
    <div class="kick">Neurobalance Training · Bonn-Beuel&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
    <h1>Viel im Kopf.<br>Viel zu tun.<br>Müde.</h1>
    <div class="rule"></div>
    <div class="sub">Wann kommst du<br>eigentlich zur Ruhe?</div>
    <div class="lab">Neurobalance Training</div>
    <div class="body">Körperorientiertes Nervensystemtraining<br>für Frauen bei Stress, Anspannung<br>und innerer Unruhe.</div>
    <div class="nb">Kein Yoga. Kein klassischer Entspannungskurs.</div>
    <div class="wse">Wahrnehmen. Spüren. Erforschen.</div>
  </div>
  <div class="divider" style="top:168mm"></div>
  <div class="info">
    <div class="q">${qr}</div><div class="vr"></div>
    <div class="t"><b>Neurobalance Training für Frauen</b>Nächster Trainingsstart: Di, 12.01.2027
      <div class="g"><b>Workshop zum Kennenlernen</b>Sa, 05.12.2026 · 10:00–12:00 Uhr · 59 €</div>
      <div class="g o">Freiraum Forum Bonn<br>Küdinghovener Straße 60c, Bonn-Beuel</div></div>
  </div>
</div>`;

const items = [
  ['Wahrnehmen, wie es dir gerade geht', 'und nicht schon zum nächsten To-do übergehen.'],
  ['Wieder mehr spüren, was du gerade brauchst', 'statt einfach weiterzumachen.'],
  ['Herausfinden, was dir bei Stress und Anspannung hilft', 'und welche Übungen du für dich im Alltag nutzen kannst.'],
  ['Nach Anspannung wieder leichter zur Ruhe finden', 'und flexibler zwischen Aktivität und Ruhe wechseln.'],
];
const back = () => `<div class="page b">
  <div class="in">
    <div class="kick">Neurobalance Training&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
    <h2>Was du aus dem Training<br>mitnehmen kannst</h2>
  </div>
  <div class="list">${items.map((x, i) => `<div class="it"><div class="num">${i + 1}</div><div><b>${x[0]}</b><span>${x[1]}</span></div></div>`).join('')}</div>
  <div class="divider" style="top:126.5mm;left:15mm;right:12mm"></div>
  <div class="quote"><div><div class="qt">„Es hat mir neue Impulse gegeben und mich dazu angeregt, bewusster auf mich und mein Wohlbefinden zu achten. Eine wertvolle Erfahrung!“</div><div class="who">Hannah, Teilnehmerin</div></div></div>
  <div class="divider" style="top:162.5mm;left:15mm;right:12mm"></div>
  <div class="info">
    <div class="q">${qr}</div><div class="vr"></div>
    <div class="t"><b>Workshop zum Kennenlernen</b>Sa, 05.12.2026 · 10:00–12:00 Uhr · 59 €
      <div class="g"><b>Neurobalance Training</b>ab Di, 12.01.2027 · 6 × 75 Minuten · 189 €</div></div>
  </div>
  <div class="facts">Freiraum Forum Bonn, Bonn-Beuel · Max. 8 Teilnehmerinnen · Keine Vorerfahrung nötig</div>
  <div class="contact"><b>Nicole Ohlemüller</b> · kontakt@nicole-ohlemueller.de · www.nicole-ohlemueller.de</div>
</div>`;

(async () => {
  qr = (await require('qrcode').toString(QR_URL, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#244A52', light: '#00000000' } })).replace('<svg', '<svg class="qrsvg"');
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${css}</style></head><body>${front()}${back()}</body></html>`;
  const file = path.resolve(OUT, 'flyer.html'); fs.writeFileSync(file, html);
  const p = await b.newPage({ viewport: { width: 582, height: 816 }, deviceScaleFactor: 300 / 96 });
  await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(OUT, 'flyer.pdf'), width: '154mm', height: '216mm', printBackground: true, preferCSSPageSize: true });
  const mm = 96 / 25.4, els = await p.$$('.page');
  for (let i = 0; i < els.length; i++) { const bb = await els[i].boundingBox(); await p.screenshot({ path: path.join(OUT, `seite-${i + 1}.png`), clip: { x: bb.x + 3 * mm, y: bb.y + 3 * mm, width: bb.width - 6 * mm, height: bb.height - 6 * mm }, fullPage: true }); }
  const prev = await b.newPage({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 1 });
  const imgs = [1, 2].map(i => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, `seite-${i}.png`)).toString('base64'));
  await prev.setContent(`<body style="margin:0;background:#e8e2da;display:flex;gap:24px;padding:24px">${imgs.map(u => `<img src="${u}" style="width:564px;box-shadow:0 2px 8px #0002">`).join('')}</body>`);
  await prev.screenshot({ path: path.join(OUT, 'vorschau.png'), fullPage: true });
  const r = await p.evaluate(() => { const mm = 96 / 25.4; const out = []; document.querySelectorAll('.page').forEach((pg, i) => { const P = pg.getBoundingClientRect(); const els = [...pg.querySelectorAll('.kick,h1,h2,.rule,.sub,.lab,.body,.nb,.wse,.info,.list,.quote,.facts,.contact')]; const R = els.map(e => [e.className || e.tagName, e.getBoundingClientRect()]); R.forEach(([n, a]) => { if (!/facts|contact/.test(n) && (a.left - P.left < 8 * mm || P.right - a.right < 8 * mm || P.bottom - a.bottom < 8 * mm)) out.push((i + 1) + ' Rand: ' + n); }); for (let x = 0; x < R.length; x++) for (let y = x + 1; y < R.length; y++) { const a = R[x][1], c = R[y][1]; if (a.left < c.right && c.left < a.right && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push((i + 1) + ' Überlappung: ' + R[x][0] + ' / ' + R[y][0]); } }); return out; });
  console.log(r.length ? 'Hinweise:\n' + r.join('\n') : 'Layout ok');
  await b.close();
})();
