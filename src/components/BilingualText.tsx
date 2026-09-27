/**
 * Ported from product_detail.html's splitBilingualText()/renderSplit(). The
 * description fields store English + Nepali as one continuous string; this
 * detects where Devanagari script begins and splits it into two properly
 * styled paragraphs, breaking at a sentence boundary so no word is cut in
 * half. Same two-path algorithm as the original: prefer a blank-line split,
 * fall back to punctuation-boundary detection for one continuous blob.
 */
function splitBilingual(raw: string): { en: string; ne: string } | null {
  if (!/[ऀ-ॿ]/.test(raw)) return null;

  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    const enParas: string[] = [];
    const neParas: string[] = [];
    let seenNepali = false;
    for (const p of paragraphs) {
      if (/[ऀ-ॿ]/.test(p)) seenNepali = true;
      (seenNepali ? neParas : enParas).push(p);
    }
    if (enParas.length && neParas.length) {
      return { en: enParas.join(" "), ne: neParas.join(" ") };
    }
  }

  const text = raw.replace(/\s+/g, " ").trim();
  const match = text.match(/[ऀ-ॿ]/);
  if (!match || match.index === undefined) return null;
  const idx = match.index;

  const boundaryRegex = /[.!?।]\s+/g;
  let m: RegExpExecArray | null;
  let boundary = -1;
  while ((m = boundaryRegex.exec(text)) !== null) {
    const endPos = m.index + m[0].length;
    if (endPos <= idx) boundary = endPos;
    else break;
  }
  if (boundary === -1) boundary = idx;

  const enPart = text.slice(0, boundary).trim();
  const nePart = text.slice(boundary).trim();
  if (!enPart || !nePart) return null;
  return { en: enPart, ne: nePart };
}

export default function BilingualText({ text, className }: { text: string; className?: string }) {
  const split = splitBilingual(text);

  if (!split) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      <p className="desc-block desc-en">{split.en}</p>
      <div className="desc-divider">
        <span />
        <i className="fas fa-leaf" />
        <span />
      </div>
      <p className="desc-block desc-ne">{split.ne}</p>
    </div>
  );
}
