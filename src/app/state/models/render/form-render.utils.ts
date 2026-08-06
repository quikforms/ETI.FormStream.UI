// Pure text/format utilities shared by the structure builder and the field component.

// Special characters are built from code points (ASCII-only source) so the
// matching is exact and encoding-independent.
const cc = String.fromCharCode;
const MOJIBAKE_PREFIX = cc(0x00e2, 0x20ac); // "â€" — UTF-8 mojibake lead bytes

// Fixes UTF-8 mojibake and normalizes curly quotes / dashes / ellipsis.
export function sanitizeText(text: string): string {
  if (!text) { return ''; }

  // 1) Specific mojibake sequences → their intended character.
  const sequences: Array<[string, string]> = [
    [MOJIBAKE_PREFIX + cc(0x2122), "'"],
    [MOJIBAKE_PREFIX + cc(0x2018), "'"],
    [MOJIBAKE_PREFIX + cc(0x201c), '-'],
    [MOJIBAKE_PREFIX + cc(0x201d), ' -- '],
    [MOJIBAKE_PREFIX + cc(0x0153), '"'],
    [MOJIBAKE_PREFIX + cc(0x009d), '"'],
    [MOJIBAKE_PREFIX + cc(0x00a6), '...'],
  ];
  let out = text;
  for (const [from, to] of sequences) { out = out.split(from).join(to); }

  // 2) Any other mojibake-prefixed punctuation → hyphen (catch-all).
  const catchAll = new RegExp(
    MOJIBAKE_PREFIX + '[' + cc(0x0080) + '-' + cc(0x00ff) + cc(0x2000) + '-' + cc(0x2200) + ']',
    'g'
  );
  out = out.replace(catchAll, '-');

  // 3) Curly quotes / dashes / ellipsis → ASCII.
  out = out
    .replace(new RegExp('[' + cc(0x2018, 0x2019, 0x201a) + ']', 'g'), "'")
    .replace(new RegExp('[' + cc(0x201c, 0x201d, 0x201e) + ']', 'g'), '"')
    .split(cc(0x2013)).join('-')
    .split(cc(0x2014)).join(' -- ')
    .split(cc(0x2026)).join('...');

  return out;
}

// Applies a format mask where '#' = a digit; other chars are literals.
export function applyFormatMask(value: string | null, format: string): string {
  if (!value || !format) { return value || ''; }
  const raw = value.replace(/\D/g, '');
  let result = '';
  let rawIdx = 0;
  for (let i = 0; i < format.length && rawIdx < raw.length; i++) {
    const fc = format[i];
    if (fc === '#') { result += raw[rawIdx]; rawIdx++; }
    else { result += fc; }
  }
  return result;
}
