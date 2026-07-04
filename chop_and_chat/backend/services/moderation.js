// Local pattern-based moderation — zero latency, no external API.
// block profanity, slurs, threats, and harassment.


// Normalise before matching: leet-speak substitutions + collapse spaces between
// lone characters (e.g. "k i l l" → "kill") to defeat simple evasion attempts.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/3/g, 'e').replace(/0/g, 'o').replace(/\$/g, 's').replace(/@/g, 'a')
    .replace(/\b(\w)(\s\w)+\b/g, m => m.replace(/\s/g, ''));
}

const BLOCK_PATTERNS = [

  // ── GENERAL PROFANITY ─────────────────────────────────────────────────────
  // normalize() collapses "f u c k" → "fuck" and maps "$→s", "@→a",
  // so normalized-text passes catch "$hit", "@sshole", "f@ggot" etc. too.

  // "fuck" family — base + leet/symbol evasions (fuk, fvck, f*ck, f**k) + suffixes
  /\bf[uv*]+c?k+[sz]?\b/i,                 // fuck, fuk, fvck, f*ck, f**k, fucks
  /\bf[uv*]+c?k+(?:ing|ed|er[sz]?)\b/i,    // fucking, fucked, fucker(s)
  /\bf[uv*]+c?k+\s+(?:you|u|off|this|that|yourself|ur\s*self|urself)\b/i,
  /\bwhat\s+the\s+f[uv*]+c?k+\b/i,         // "what the fuck"

  // "bitch"
  /\bbitch(?:es|ing|ed)?\b/i,
  /\bb[i*!1]+tch\b/i,                       // b*tch, b!tch, b1tch

  // "faggot" — slur (also supplement to the racial/ethnic section below)
  /\bf[a@]gg?[o0]t[sz]?\b/i,

  // ── SELF-HARM DIRECTED AT READER ──────────────────────────────────────────
  /k[i1][l1][l1]\s*(your\s*self|ur\s*self|urself)/i,
  /\bkys\b/i,
  /go\s+(die|k[i1][l1][l1]\s*(your\s*self|urself))/i,
  /end\s+(your|ur)\s+(life|existence)/i,
  /hang\s*(your\s*self|ur\s*self|urself)/i,

  // "die" / "kill" — block unless food compliment ("die for this", "kill for a bite")
  /\bdie\b(?!\s+for\b)/i,
  /\bkill\b(?!\s+for\b)/i,

  // ── DEATH / HARM THREATS ──────────────────────────────────────────────────
  // "i will/i'll kill/murder/..." — any target including words between kill and you
  /i('?ll|('?m\s+going\s+to)|\s+will|\s+am\s+going\s+to)\s+(kill|murder|hurt|stab|shoot|harm|beat)\b.{0,35}\b(you|u)\b/i,
  // "i will/i'll kill" — but NOT "i will kill for [food]" (food hyperbole)
  /i('?ll|\s+will|'?m\s+going\s+to|\s+am\s+going\s+to)\s+kill\b(?!\s+for\b)/i,
  /you\s+(should|deserve\s+to|need\s+to|ought\s+to)\s+(die|get\s+killed|be\s+killed|burn)/i,
  /i('?m|'ll)\s+(come|find|hunt)\s+(for\s+)?(you|u)\b/i,

  // ── DOXXING ───────────────────────────────────────────────────────────────
  /i\s+know\s+where\s+you\s+live/i,

  // ── SEXUAL HARASSMENT DIRECTED AT A PERSON ────────────────────────────────
  // Demands for sexual content
  /\b(send|show)\s+(me\s+)?(nude|nudes|naked\s+pics?|your\s+(tits|ass|boobs|cock|dick|pussy))\b/i,
  // Sexual assault threats
  /\bi('?ll|'?m\s+going\s+to|\s+will)\s+(rape|sexually\s+assault|molest)\s+(you|u)\b/i,
  // Explicit sexual insults directed at the reader as a personal attack
  /\byou\s+(are\s+a?\s*)?(stupid\s+|dirty\s+|filthy\s+)?(whore|slut|cunt)\b/i,

  // ── CHILD PROTECTION — ZERO TOLERANCE ────────────────────────────────────
  /\b(child|kid|minor|underage|loli|jailbait)\s+(porn|sex|nude|naked|pic|content)\b/i,
  /\bcp\b.{0,20}\b(send|share|got|have|want)\b/i,
  /\b(send|share|got|want)\b.{0,20}\bcp\b/i,

  // ── RACIAL & ETHNIC SLURS ─────────────────────────────────────────────────
  // n-word: full forms (nigger/niggers/nigga/niggaz + leet n1g/n!g variants)
  /\bn[i!1]+gg([ae][rz]?|[ae]r[sz]?)\b/i,
  // n-word: abbreviated standalone (nig, nigg, n1g, n1gg — word-boundary guards
  // prevent matching "Niger" or "Nigeria" since those have letters after)
  /\bn[i!1]gg?\b/i,
  /\bsp[i!1]c[ks]?\b/i,             // Hispanic slur + leet (sp1c, sp!c)
  /\bch[i!1]+nk[sz]?\b/i,           // East Asian slur
  /\bk[i!1]+ke[sz]?\b/i,            // Jewish slur
  /\bw[e3]tb[a@]ck[sz]?\b/i,        // Hispanic slur
  /\bsand\s*n[i!1]+gg[ae]r[sz]?\b/i, // Middle Eastern slur
  /\btar\s*baby\b/i,
  /\bgook[sz]?\b/i,                 // Asian slur
  /\bcoon[sz]?\b(?!\s*(dog|hound))/i, // racial slur (exclude "coonhound" etc.)
  /\bz[i!1]p\s*head[sz]?\b/i,
  /\bporch\s*monk[e3]y[sz]?\b/i,
  /\bjigg?ab[o0]+[sz]?\b/i,
  /\bmulatt[o0]\b/i,                // often used as a slur in modern context
  /\bzig[a@]b[o0]+[sz]?\b/i,        // Romani slur
  /\bbeaner[sz]?\b/i,               // Hispanic slur
];

function moderateText(text) {
  if (!text?.trim() || text.trim().length < 3) return { flagged: false };
  const normalized = normalize(text);
  return { flagged: BLOCK_PATTERNS.some(p => p.test(text.trim()) || p.test(normalized)) };
}

module.exports = { moderateText };
