export type Option = { value: string; label: string; hint?: string; icon?: string };
export type Question = {
  id: "bereich" | "situation" | "beginn" | "bestand";
  title: string;
  subtitle?: string;
  multi?: boolean;
  options: Option[];
};

export const AREAS: Option[] = [
  { value: "arbeit", label: "Beruf und Arbeitsplatz", hint: "Kündigung, Abmahnung, Zeugnis", icon: "Briefcase" },
  { value: "privat", label: "Privatleben", hint: "Verträge, Einkäufe, Schadenersatz", icon: "Shield" },
  { value: "vermieter", label: "Vermietete Immobilien", hint: "Mietstreit, Räumung, Betriebskosten", icon: "House" },
  { value: "firma", label: "Unternehmen", hint: "Selbstständig, Freiberuf, GmbH", icon: "Building2" },
  { value: "mehrere", label: "Mehrere Bereiche", hint: "Kombinierte Absicherung", icon: "Layers" },
];

export const AREA_VALUES = AREAS.map((a) => a.value) as [string, ...string[]];

export const MULTI_AREAS: Option[] = [
  { value: "privat", label: "Privatleben", icon: "Shield" },
  { value: "arbeit", label: "Beruf", icon: "Briefcase" },
  { value: "verkehr", label: "Verkehr", icon: "Car" },
  { value: "wohnen", label: "Eigene Wohnung / Miete", icon: "KeyRound" },
  { value: "vermieter", label: "Vermietung", icon: "House" },
  { value: "firma", label: "Unternehmen", icon: "Building2" },
];

export const SITUATION: Record<string, Question> = {
  arbeit: {
    id: "situation",
    title: "Wie bist du aktuell beschäftigt?",
    options: [
      { value: "angestellt", label: "Angestellt", icon: "Briefcase" },
      { value: "beamter", label: "Beamter / Beamtin", icon: "Landmark" },
      { value: "ausbildung", label: "In Ausbildung", icon: "GraduationCap" },
      { value: "selbststaendig", label: "Selbstständig", icon: "Laptop" },
    ],
  },
  privat: {
    id: "situation",
    title: "Wen möchtest du absichern?",
    options: [
      { value: "single", label: "Nur mich", icon: "UserCheck" },
      { value: "paar", label: "Mich und meine:n Partner:in", icon: "Users" },
      { value: "familie", label: "Familie mit Kindern", icon: "Heart" },
      { value: "alleinerziehend", label: "Alleinerziehend", icon: "Users" },
    ],
  },
  vermieter: {
    id: "situation",
    title: "Welche Immobilie möchtest du absichern?",
    options: [
      { value: "etw", label: "Eigentumswohnung", icon: "Building" },
      { value: "efh", label: "Einfamilienhaus", icon: "House" },
      { value: "mfh", label: "Mehrfamilienhaus", icon: "Building2" },
      { value: "mehrere", label: "Mehrere Immobilien", icon: "Layers" },
    ],
  },
  firma: {
    id: "situation",
    title: "Welche Unternehmensform trifft auf dich zu?",
    options: [
      { value: "einzel", label: "Einzelunternehmen", icon: "Store" },
      { value: "freiberuf", label: "Freiberuflich", icon: "Laptop" },
      { value: "gmbh", label: "GmbH / UG", icon: "Building2" },
      { value: "sonstige", label: "Sonstige", icon: "Layers" },
    ],
  },
  mehrere: {
    id: "situation",
    title: "Welche Bereiche sind dir wichtig?",
    subtitle: "Mehrfachauswahl möglich.",
    multi: true,
    options: MULTI_AREAS,
  },
};

export const BEGINN: Question = {
  id: "beginn",
  title: "Wann möchtest du deinen Rechtsschutz beginnen lassen?",
  options: [
    { value: "bald", label: "Möglichst bald", icon: "Sparkles" },
    { value: "30tage", label: "Innerhalb der nächsten 30 Tage", icon: "Calendar" },
    { value: "spaeter", label: "Zu einem späteren Zeitpunkt", icon: "Clock" },
    { value: "info", label: "Ich möchte mich zunächst informieren", icon: "Info" },
  ],
};

export const BESTAND: Question = {
  id: "bestand",
  title: "Hast du bereits eine Rechtsschutzversicherung?",
  options: [
    { value: "ja", label: "Ja", icon: "CircleCheck" },
    { value: "nein", label: "Nein", icon: "Ban" },
    { value: "unsicher", label: "Nicht sicher", icon: "HelpCircle" },
  ],
};

export const CONTACT_METHODS = [
  { value: "email", label: "E-Mail" },
  { value: "telefon", label: "Telefon" },
  { value: "egal", label: "Egal" },
] as const;

/** Lesbare Labels für Benachrichtigungen, CSV-Export und CRM. */
export function labelFor(questionId: string, value: string, bereich?: string): string {
  if (questionId === "bereich") return AREAS.find((a) => a.value === value)?.label ?? value;
  if (questionId === "situation" && bereich) {
    const q = SITUATION[bereich];
    return q?.options.find((o) => o.value === value)?.label ?? value;
  }
  if (questionId === "beginn") return BEGINN.options.find((o) => o.value === value)?.label ?? value;
  if (questionId === "bestand") return BESTAND.options.find((o) => o.value === value)?.label ?? value;
  return value;
}
