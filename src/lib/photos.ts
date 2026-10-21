/** Fotos von Unsplash (Unsplash-Lizenz, kostenlos auch kommerziell nutzbar). Abgebildete Personen sind Models – Symbolbilder. */
export const PHOTOS = {
  arbeit: { src: "/photos/arbeit", alt: "Mann trägt einen Karton mit persönlichen Sachen durch ein Büro", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/J-tNLcS-2aI", pos: "50% 40%" },
  privat: { src: "/photos/privat", alt: "Frau telefoniert genervt an einem Tisch", author: "GlassesShop", url: "https://unsplash.com/de/fotos/p58t3M4jqQ4", pos: "40% 35%" },
  vermieter: { src: "/photos/vermieter", alt: "Frau hält lächelnd einen Schlüsselbund", author: "Md Ishak Rahman", url: "https://unsplash.com/de/fotos/r4sK15Da7LA", pos: "50% 35%" },
  verkehr: { src: "/photos/verkehr", alt: "Menschen und Polizei an zwei Autos nach einem Unfall", author: "Aaron Doucett", url: "https://unsplash.com/de/fotos/za6VUsCoSBA", pos: "50% 55%" },
  firma: { src: "/photos/firma", alt: "Zwei Café-Inhaber stehen mit verschränkten Armen in ihrem Laden", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/dU3KJqyYlO0", pos: "50% 30%" },
  behoerde: { src: "/photos/behoerde", alt: "Frau schreibt konzentriert an einem Tisch", author: "Olivia Anne Snyder", url: "https://unsplash.com/de/fotos/MaqpIRlAP5I", pos: "55% 35%" },
  beratung: { src: "/photos/beratung", alt: "Beratungsgespräch mit einem jungen Paar auf dem Sofa", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/TB2UuDIQOR0", pos: "50% 45%" },
  brief: { src: "/photos/brief", alt: "Mann liest am Küchentisch nachdenklich einen Brief", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/8BuTwOlhLr0", pos: "55% 40%" },
  stress: { src: "/photos/stress", alt: "Mann stützt am Küchentisch besorgt den Kopf in die Hand und liest ein Schreiben", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/8DusFbeYa6o", pos: "50% 35%" },
  einzug: { src: "/photos/einzug", alt: "Junges Paar sitzt zwischen Umzugskartons in der neuen Wohnung und schaut auf ein Tablet", author: "Vitaly Gariev", url: "https://unsplash.com/de/fotos/fdGE4itv-a4", pos: "50% 40%" },
} as const;

export type PhotoKey = keyof typeof PHOTOS;
