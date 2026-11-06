import "server-only";

/**
 * HTML-Vorlage der Eingangsbestätigung im Look der Website.
 * E-Mail-tauglich: Tabellenlayout, nur Inline-Styles, keine Bilder und keine externen Schriften
 * (lädt nichts nach, funktioniert auch bei blockierten Bildern).
 */

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = { ink: "#0B0B0A", soft: "#45453F", muted: "#71716B", line: "#E6E5DF", paper: "#F4F3EE", surface: "#FAFAF7", sun: "#FFD60A", note: "#FFE45E" };
const SANS = `'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const SERIF = `'Instrument Serif',Georgia,'Times New Roman',serif`;
const MONO = `'Geist Mono',ui-monospace,Menlo,Consolas,'Courier New',monospace`;

export type ConfirmationData = {
  subject: string;
  firstName: string;
  way: string;
  rows: [string, string][];
  receivedAt: string;
  phone: string;
  siteUrl: string;
  brand: string;
  owner: string;
  street: string;
  city: string;
  status: string;
};

const steps = (way: string): [string, string][] => [
  ["Prüfung", "Ich sehe mir deine Angaben persönlich an und bereite mich auf unser Gespräch vor."],
  ["Persönlicher Kontakt", `Ich melde mich ${way} bei dir, um offene Fragen zu klären.`],
  ["Unverbindliche Empfehlung", "Du erhältst eine Empfehlung, die zu deiner Situation passt – ohne Verpflichtung."],
];

export function confirmationHtml(d: ConfirmationData) {
  const tel = d.phone.replace(/[^\d+]/g, "").replace(/^0/, "+49");
  const hello = d.firstName ? `Danke, ${esc(d.firstName)}!` : "Vielen Dank!";
  const host = d.siteUrl.replace(/^https?:\/\//, "");

  const receiptRows = [...d.rows, ["Eingang", d.receivedAt] as [string, string]]
    .map(
      ([k, v], i, all) => `<tr>
  <td style="padding:9px 0;border-bottom:${i === all.length - 1 ? "0" : `1px dotted #CFCEC6`};font-family:${MONO};font-size:13px;line-height:18px;color:${C.muted};vertical-align:top;width:44%">${esc(k)}</td>
  <td align="right" style="padding:9px 0;border-bottom:${i === all.length - 1 ? "0" : `1px dotted #CFCEC6`};font-family:${MONO};font-size:13px;line-height:18px;color:${C.ink};font-weight:700;vertical-align:top">${esc(v)}</td>
</tr>`,
    )
    .join("");

  const stepRows = steps(d.way)
    .map(
      ([t, txt], i) => `<tr><td style="padding:0 0 10px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:16px;background:#FFFFFF">
    <tr>
      <td width="40" style="padding:16px 0 16px 16px;vertical-align:top">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="36" height="36" align="center" style="width:36px;height:36px;background:${C.ink};border-radius:11px;font-family:${MONO};font-size:15px;font-weight:700;color:${C.sun}">${i + 1}</td></tr></table>
      </td>
      <td style="padding:15px 16px 15px 14px;vertical-align:top">
        <p style="margin:0;font-family:${SANS};font-size:15px;line-height:20px;font-weight:700;color:${C.ink}">${esc(t)}</p>
        <p style="margin:3px 0 0;font-family:${SANS};font-size:14px;line-height:21px;color:${C.soft}">${esc(txt)}</p>
      </td>
    </tr>
  </table>
</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(d.subject)}</title>
<style>
  @media (max-width:620px){
    .card{padding:28px 22px !important}
    .h1{font-size:31px !important;line-height:35px !important}
    .outer{padding:20px 10px !important}
  }
  a{color:${C.ink}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Deine Anfrage ist angekommen – ich melde mich persönlich bei dir.&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}">
<tr><td align="center" class="outer" style="padding:36px 16px">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

    <!-- Logo -->
    <tr><td style="padding:0 4px 20px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="34" height="34" align="center" style="width:34px;height:34px;background:${C.ink};border-radius:10px;font-family:${SERIF};font-style:italic;font-size:21px;line-height:34px;color:${C.sun}">§</td>
        <td style="padding-left:10px;font-family:${SANS};font-size:18px;font-weight:700;color:${C.ink};letter-spacing:-0.3px">${esc(d.brand.split(" ")[0])} <span style="font-family:${SERIF};font-style:italic;font-weight:400;font-size:20px">${esc(d.brand.split(" ").slice(1).join(" "))}</span></td>
      </tr></table>
    </td></tr>

    <!-- Karte -->
    <tr><td class="card" style="background:#FFFFFF;border:1px solid ${C.line};border-radius:24px;padding:40px 40px 36px">

      <p style="margin:0 0 26px;font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${C.muted}"><span style="font-family:${SERIF};font-style:italic;font-size:15px;letter-spacing:0;color:${C.ink}">§</span>&nbsp; Persönliche Rechtsschutz-Beratung</p>

      <!-- Stempel -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="transform:rotate(-3deg)"><tr>
        <td style="background:${C.sun};border:3px solid ${C.ink};border-radius:10px;padding:10px 20px 9px;text-align:center">
          <p style="margin:0;font-family:${MONO};font-size:20px;line-height:22px;font-weight:700;letter-spacing:5px;color:${C.ink}">ANGEKOMMEN</p>
          <p style="margin:3px 0 0;font-family:${SERIF};font-style:italic;font-size:14px;line-height:16px;color:${C.ink}">Danke für dein Vertrauen</p>
        </td>
      </tr></table>

      <h1 class="h1" style="margin:26px 0 0;font-family:${SANS};font-size:38px;line-height:41px;font-weight:800;letter-spacing:-1.4px;color:${C.ink}">${hello} Deine Anfrage ist <span style="font-family:${SERIF};font-style:italic;font-weight:400;letter-spacing:-0.5px">angekommen.</span></h1>
      <p style="margin:16px 0 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.soft}">Ich schaue mir deine Angaben persönlich an und melde mich <strong style="color:${C.ink}">${esc(d.way)}</strong> bei dir – kein Callcenter, sondern direkt ich.</p>

      <!-- Beleg -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;background:${C.surface};border:1px solid ${C.line};border-radius:14px">
        <tr><td style="padding:16px 22px 6px">
          <p style="margin:0;padding:0 0 12px;border-bottom:1px dashed #BDBCB4;text-align:center;font-family:${MONO};font-size:11px;letter-spacing:3px;color:${C.muted}">DEINE ANGABEN</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${receiptRows}</table>
        </td></tr>
        <tr><td style="padding:0 22px 14px">
          <p style="margin:0;padding:10px 0 0;border-top:2px solid ${C.ink};font-family:${MONO};font-size:11px;line-height:16px;color:${C.muted}">Kostenlos &amp; unverbindlich</p>
        </td></tr>
      </table>

      <!-- Schritte -->
      <p style="margin:34px 0 14px;font-family:${SANS};font-size:19px;line-height:24px;font-weight:800;letter-spacing:-0.4px;color:${C.ink}">So geht es <span style="font-family:${SERIF};font-style:italic;font-weight:400;font-size:21px">jetzt weiter</span></p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>

      <!-- Notizzettel -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;transform:rotate(-1deg)"><tr>
        <td style="background:${C.note};padding:20px 24px 16px;border-radius:3px;box-shadow:0 14px 24px -14px rgba(11,11,10,0.35)">
          <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:21px;line-height:27px;color:${C.ink}">Fragen vorab? Ruf mich einfach an – ich nehme mir gern Zeit für dich.</p>
          <p style="margin:8px 0 0;text-align:right;font-family:${SERIF};font-style:italic;font-size:17px;color:${C.ink}">– Adrian</p>
        </td>
      </tr></table>

      <!-- Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0"><tr>
        <td style="background:${C.ink};border-radius:999px;padding:6px 6px 6px 24px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:14px"><a href="tel:${esc(tel)}" style="font-family:${SANS};font-size:15px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none">${esc(d.phone)} anrufen</a></td>
            <td width="34" height="34" align="center" style="width:34px;height:34px;background:${C.sun};border-radius:999px;font-family:${SANS};font-size:17px;line-height:34px;font-weight:700"><a href="tel:${esc(tel)}" style="color:${C.ink};text-decoration:none">&#8599;</a></td>
          </tr></table>
        </td>
      </tr></table>

      <!-- Gruß -->
      <p style="margin:34px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.soft}">Viele Grüße</p>
      <p style="margin:2px 0 0;font-family:${SERIF};font-style:italic;font-size:30px;line-height:34px;color:${C.ink}">${esc(d.owner)}</p>
      <p style="margin:4px 0 0;font-family:${SANS};font-size:13px;line-height:19px;color:${C.muted}">Vertriebspartner der ARAG · <a href="${esc(d.siteUrl)}" style="color:${C.muted};white-space:nowrap">${esc(host)}</a></p>
    </td></tr>

    <!-- Fuß -->
    <tr><td style="padding:22px 12px 0;text-align:center;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted}">
      ${esc(d.owner)} · ${esc(d.street)} · ${esc(d.city)}<br>
      ${esc(d.status)}<br>
      <a href="${esc(d.siteUrl)}/impressum" style="color:${C.muted}">Impressum</a> &nbsp;·&nbsp; <a href="${esc(d.siteUrl)}/datenschutz" style="color:${C.muted}">Datenschutz</a>
      <p style="margin:14px 0 0;font-size:12px;line-height:18px;color:${C.muted}">Du erhältst diese Mail, weil diese Adresse auf meiner Website angegeben wurde.<br>Warst du das nicht? Dann antworte kurz auf diese Mail, ich lösche die Anfrage.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}
