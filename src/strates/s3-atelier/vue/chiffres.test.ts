// La police des chiffres ↊ et ↋ (fiche, § 6) : un fichier TrueType que les navigateurs acceptent.
import { describe, expect, it } from "vitest";
import { glyphes, police } from "./chiffres";

const octets = police();
const lecture = new DataView(octets.buffer);
const u16 = (o: number) => lecture.getUint16(o);
const u32 = (o: number) => lecture.getUint32(o);
const i16 = (o: number) => lecture.getInt16(o);

/** Les tables, par leur étiquette : leur position et leur longueur. */
const tables = new Map<string, { position: number; longueur: number; somme: number }>();
for (let k = 0; k < u16(4); k++) {
  const r = 12 + 16 * k;
  const etiquette = String.fromCharCode(...octets.slice(r, r + 4));
  tables.set(etiquette, { somme: u32(r + 4), position: u32(r + 8), longueur: u32(r + 12) });
}

function somme(debut: number, longueur: number): number {
  let s = 0;
  for (let o = debut; o < debut + longueur; o += 4) s = (s + u32(o)) >>> 0;
  return s;
}

describe("la police des chiffres de l'atelier", () => {
  it("est une police TrueType, avec ses dix tables dans l'ordre", () => {
    expect(u32(0)).toBe(0x00010000);
    expect([...tables.keys()]).toEqual([
      "OS/2",
      "cmap",
      "glyf",
      "head",
      "hhea",
      "hmtx",
      "loca",
      "maxp",
      "name",
      "post",
    ]);
  });

  it("a des sommes de contrôle justes : chaque table, et le fichier entier", () => {
    for (const [etiquette, t] of tables) {
      if (etiquette === "head") continue;
      expect(somme(t.position, Math.ceil(t.longueur / 4) * 4), etiquette).toBe(t.somme);
    }
    expect(somme(0, octets.length)).toBe(0xb1b0afba);
  });

  it("donne ↊ au glyphe 1 et ↋ au glyphe 2", () => {
    const cmap = tables.get("cmap")!.position;
    const sous = cmap + u32(cmap + 8);
    expect(u16(sous)).toBe(4);
    const segments = u16(sous + 6) / 2;
    const fins = sous + 14;
    const debuts = fins + 2 * segments + 2;
    const ecarts = debuts + 2 * segments;
    const glyphe = (code: number) => {
      for (let s = 0; s < segments; s++) {
        if (code <= u16(fins + 2 * s) && code >= u16(debuts + 2 * s)) {
          return (code + i16(ecarts + 2 * s)) & 0xffff;
        }
      }
      return 0;
    };
    expect(glyphe(0x218a)).toBe(1);
    expect(glyphe(0x218b)).toBe(2);
    expect(glyphe(0x32)).toBe(0);
  });

  it("dessine deux chiffres de la hauteur des capitales, aux contours dans le sens horaire", () => {
    const dessins = glyphes();
    expect(dessins).toHaveLength(2);
    for (const contours of dessins) {
      for (const c of contours) {
        let aire = 0;
        c.forEach(([x1, y1], i) => {
          const [x2, y2] = c[(i + 1) % c.length]!;
          aire += x1 * y2 - x2 * y1;
        });
        expect(aire).toBeLessThan(0);
        for (const [x, y] of c) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(556);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(700);
        }
      }
    }
  });
});
