/**
 * Skill Matching client. The backend (server/skill_match.py) matches on the
 * shared JD taxonomy; `localMatch` is a smaller offline fallback with the same
 * output shape and the same rules for what counts as a match.
 */
import { CategoryCode, Skill } from "../types/contract";

export type MatchType = "direct" | "evidence" | "implied" | "alternative" | "category";

export interface MatchedSkillView {
  reqSkill: string;
  category: CategoryCode;
  candSkillName: string;
  evidence: string;
  confidence: string;
  matchType: MatchType;
  matchNote?: string;
}

export interface MissingSkillView {
  reqSkill: string;
  category: CategoryCode;
  reason: string;
  related?: string | null;
}

export interface MatchView {
  matchScore: number;
  matchedSkills: MatchedSkillView[];
  missingSkills: MissingSkillView[];
  engine: "taxonomy" | "offline";
}

type ReqSkill = Pick<Skill, "skill_name" | "category_code" | "evidence" | "confidence">;

const API_BASE = "http://127.0.0.1:8000/api";

export async function matchSkillsRemote(candidate: Skill[], jd: ReqSkill[]): Promise<MatchView> {
  const strip = (s: ReqSkill) => ({
    skill_name: s.skill_name,
    category_code: s.category_code,
    evidence: s.evidence || s.skill_name,
    confidence: s.confidence,
  });
  const res = await fetch(`${API_BASE}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_skills: candidate.map(strip), jd_skills: jd.map(strip) }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`match failed: ${res.status}`);
  const data = await res.json();
  return {
    matchScore: data.match_score,
    matchedSkills: data.matched_skills.map((m: any) => ({
      reqSkill: m.req_skill,
      category: m.category,
      candSkillName: m.cand_skill,
      evidence: m.evidence,
      confidence: m.confidence,
      matchType: m.match_type,
      matchNote: m.note,
    })),
    missingSkills: data.missing_skills.map((m: any) => ({
      reqSkill: m.req_skill,
      category: m.category,
      reason: m.reason,
      related: m.related,
    })),
    engine: "taxonomy",
  };
}

// ---- Offline fallback ------------------------------------------------------

const CREDIT: Record<Exclude<MatchType, "alternative">, number> = { direct: 1, evidence: 0.9, implied: 0.75, category: 0.5 };
const REQ_WEIGHT: Record<string, number> = { high: 1, medium: 0.7, low: 0.4 };
const BROAD = new Set<CategoryCode>(["DSA", "OOD", "APTI", "COMM", "SYSD"]);

// Words too generic to identify a skill on their own ("Data Structures" and
// "Data Visualization" must not match on "data").
const GENERIC = new Set([
  "and", "or", "the", "of", "for", "with", "in", "to", "a", "an", "skills", "skill", "basic", "advanced", "core",
  "strong", "data", "systems", "system", "engineering", "design", "development", "programming", "management",
  "analysis", "technical", "applied", "modern", "understanding", "knowledge", "experience", "fundamentals",
]);

/** Framework → foundations it implies. Mirrors `implies` in server/jd/taxonomy.py. */
const IMPLIES: Array<{ parent: RegExp; label: string; implies: RegExp }> = [
  { parent: /\b(react|next\.?js|vue|angular|svelte|tailwind)\b/i, label: "frontend framework", implies: /\b(html|css|javascript|dom)\b/i },
  { parent: /\b(django|flask|fastapi|pandas|numpy|pytorch|scikit)\b/i, label: "Python framework", implies: /^python\b/i },
  { parent: /\bspring\b/i, label: "Spring", implies: /^(core )?java\b(?!script)/i },
  { parent: /\b(docker|kubernetes|k8s)\b/i, label: "containers", implies: /\blinux\b/i },
  { parent: /\b(postgres|mysql|oracle db|sql server)/i, label: "relational DB", implies: /^sql\b/i },
];

const tokens = (name: string) =>
  new Set((name.toLowerCase().match(/[a-z0-9+#.]+/g) || []).map((t) => t.replace(/\.$/, "")).filter((t) => !GENERIC.has(t)));

export function localMatch(candidate: Skill[], jd: ReqSkill[]): MatchView {
  const matched: MatchedSkillView[] = [];
  const missing: MissingSkillView[] = [];
  let total = 0;
  let got = 0;

  for (const req of jd) {
    const reqTokens = tokens(req.skill_name);
    let hit: MatchedSkillView | null = null;

    const direct = candidate.find((c) => {
      const ct = tokens(c.skill_name);
      return [...reqTokens].some((t) => ct.has(t));
    });
    if (direct) {
      hit = { reqSkill: req.skill_name, category: req.category_code, candSkillName: direct.skill_name, evidence: direct.evidence, confidence: direct.confidence, matchType: "direct", matchNote: "Direct match" };
    }

    if (!hit) {
      for (const rule of IMPLIES) {
        const parent = candidate.find((c) => rule.parent.test(c.skill_name));
        if (parent && rule.implies.test(req.skill_name)) {
          hit = { reqSkill: req.skill_name, category: req.category_code, candSkillName: parent.skill_name, evidence: `${parent.skill_name} implies ${req.skill_name}: ${parent.evidence}`, confidence: "medium", matchType: "implied", matchNote: `Inferred via ${parent.skill_name}` };
          break;
        }
      }
    }

    if (!hit && BROAD.has(req.category_code)) {
      const related = candidate.find((c) => c.category_code === req.category_code);
      if (related) {
        hit = { reqSkill: req.skill_name, category: req.category_code, candSkillName: related.skill_name, evidence: related.evidence, confidence: "low", matchType: "category", matchNote: `Related ${req.category_code} skill, partial credit` };
      }
    }

    const weight = REQ_WEIGHT[req.confidence] ?? 0.7;
    total += weight;
    if (hit) {
      matched.push(hit);
      got += weight * CREDIT[hit.matchType as Exclude<MatchType, "alternative">];
    } else {
      missing.push({
        reqSkill: req.skill_name,
        category: req.category_code,
        reason: req.evidence,
        related: candidate.find((c) => c.category_code === req.category_code)?.skill_name ?? null,
      });
    }
  }

  return { matchScore: total ? Math.round((100 * got) / total) : 0, matchedSkills: matched, missingSkills: missing, engine: "offline" };
}
