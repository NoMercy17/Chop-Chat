// Client-side mirror of backend/services/moderation.js.
// Patterns here MUST stay in sync with the backend so the frontend gives accurate
// pre-submit feedback. The backend always remains the authoritative gate.

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/3/g, 'e').replace(/0/g, 'o').replace(/\$/g, 's').replace(/@/g, 'a')
    .replace(/\b(\w)(\s\w)+\b/g, m => m.replace(/\s/g, ''));
}

const BLOCK_PATTERNS = [

  // ── GENERAL PROFANITY ─────────────────────────────────────────────────────
  /\bf[uv*]+c?k+[sz]?\b/i,
  /\bf[uv*]+c?k+(?:ing|ed|er[sz]?)\b/i,
  /\bf[uv*]+c?k+\s+(?:you|u|off|this|that|yourself|ur\s*self|urself)\b/i,
  /\bwhat\s+the\s+f[uv*]+c?k+\b/i,

  /\bshit[sz]?\b/i,
  /\bsh[i*!1]+t[sz]?\b/i,
  /\bshitting\b/i,
  /\bshitty\b/i,
  /\bbullshit\b/i,

  /\bbitch(?:es|ing|ed)?\b/i,
  /\bb[i*!1]+tch\b/i,

  /\basshole[sz]?\b/i,
  /\bdumb\s*ass\b/i,
  /\bjack\s*ass\b/i,

  /\bf[a@]gg?[o0]t[sz]?\b/i,

  // ── SELF-HARM DIRECTED AT READER ──────────────────────────────────────────
  /k[i1][l1][l1]\s*(your\s*self|ur\s*self|urself)/i,
  /\bkys\b/i,
  /go\s+(die|k[i1][l1][l1]\s*(your\s*self|urself))/i,
  /end\s+(your|ur)\s+(life|existence)/i,
  /hang\s*(your\s*self|ur\s*self|urself)/i,

  /\bdie\b(?!\s+for\b)/i,
  /\bkill\b(?!\s+for\b)/i,

  // ── DEATH / HARM THREATS ──────────────────────────────────────────────────
  /i('?ll|('?m\s+going\s+to)|\s+will|\s+am\s+going\s+to)\s+(kill|murder|hurt|stab|shoot|harm|beat)\b.{0,35}\b(you|u)\b/i,
  /i('?ll|\s+will|'?m\s+going\s+to|\s+am\s+going\s+to)\s+kill\b(?!\s+for\b)/i,
  /you\s+(should|deserve\s+to|need\s+to|ought\s+to)\s+(die|get\s+killed|be\s+killed|burn)/i,
  /i('?m|'ll)\s+(come|find|hunt)\s+(for\s+)?(you|u)\b/i,

  // ── DOXXING ───────────────────────────────────────────────────────────────
  /i\s+know\s+where\s+you\s+live/i,

  // ── SEXUAL HARASSMENT DIRECTED AT A PERSON ────────────────────────────────
  /\b(send|show)\s+(me\s+)?(nude|nudes|naked\s+pics?|your\s+(tits|ass|boobs|cock|dick|pussy))\b/i,
  /\bi('?ll|'?m\s+going\s+to|\s+will)\s+(rape|sexually\s+assault|molest)\s+(you|u)\b/i,
  /\byou\s+(are\s+a?\s*)?(stupid\s+|dirty\s+|filthy\s+)?(whore|slut|cunt)\b/i,

  // ── CHILD PROTECTION — ZERO TOLERANCE ────────────────────────────────────
  /\b(child|kid|minor|underage|loli|jailbait)\s+(porn|sex|nude|naked|pic|content)\b/i,
  /\bcp\b.{0,20}\b(send|share|got|have|want)\b/i,
  /\b(send|share|got|want)\b.{0,20}\bcp\b/i,

  // ── RACIAL & ETHNIC SLURS ─────────────────────────────────────────────────
  /\bn[i!1]+gg([ae][rz]?|[ae]r[sz]?)\b/i,
  /\bn[i!1]gg?\b/i,
  /\bsp[i!1]c[ks]?\b/i,
  /\bch[i!1]+nk[sz]?\b/i,
  /\bk[i!1]+ke[sz]?\b/i,
  /\bw[e3]tb[a@]ck[sz]?\b/i,
  /\bsand\s*n[i!1]+gg[ae]r[sz]?\b/i,
  /\btar\s*baby\b/i,
  /\bgook[sz]?\b/i,
  /\bcoon[sz]?\b(?!\s*(dog|hound))/i,
  /\bz[i!1]p\s*head[sz]?\b/i,
  /\bporch\s*monk[e3]y[sz]?\b/i,
  /\bjigg?ab[o0]+[sz]?\b/i,
  /\bmulatt[o0]\b/i,
  /\bzig[a@]b[o0]+[sz]?\b/i,
  /\bbeaner[sz]?\b/i,
];

export function moderateText(text) {
  if (!text?.trim() || text.trim().length < 3) return { flagged: false };
  const normalized = normalize(text);
  return { flagged: BLOCK_PATTERNS.some(p => p.test(text.trim()) || p.test(normalized)) };
}
