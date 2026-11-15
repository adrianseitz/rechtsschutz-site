// schedule.mjs: Posting-Termine in deutscher Zeit (Europe/Berlin), ohne Zeitzonen-Rechnerei:
// Es wird nur mit Datum + „HH:MM“ der Berliner Uhr verglichen.
const PARTS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WD = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];

export function berlin(d = new Date()) {
  const p = Object.fromEntries(PARTS.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}`, dow: DOW[p.weekday], day: p.day, month: p.month };
}
const mins = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

export function normTimes(settings) {
  const t = Array.isArray(settings.times) ? settings.times : settings.time ? [settings.time] : ["18:30"];
  return t.filter((x) => /^\d{2}:\d{2}$/.test(x)).sort();
}

/**
 * Fälliger Termin („2026-11-16 18:30“) oder null. Ein verpasster Termin wird bis zu 3 Stunden später nachgeholt,
 * aber jeder Termin nur einmal (lastSlot).
 */
export function dueSlot(settings, lastSlot, now = new Date()) {
  const b = berlin(now), days = settings.days || [];
  if (!days.includes(b.dow)) return null;
  let due = null;
  for (const t of normTimes(settings)) {
    const key = `${b.date} ${t}`, diff = mins(b.hm) - mins(t);
    if (diff >= 0 && diff <= 180 && (!lastSlot || key > lastSlot)) due = key;
  }
  return due;
}

/** Nächster Termin als Text, z. B. „Mi., 18.11. um 18:30“ */
export function nextSlotLabel(settings, lastSlot, now = new Date()) {
  const days = settings.days || [], times = normTimes(settings);
  if (!days.length || !times.length) return null;
  const today = berlin(now);
  for (let i = 0; i < 9; i++) {
    const b = berlin(new Date(now.getTime() + i * 86400000));
    if (!days.includes(b.dow)) continue;
    for (const t of times) {
      if (i === 0 && (t <= today.hm || (lastSlot && `${b.date} ${t}` <= lastSlot))) continue;
      return { key: `${b.date} ${t}`, label: `${WD[b.dow]}, ${b.day}.${b.month}. um ${t}` };
    }
  }
  return null;
}
