import { CategoryCode, CandidateProfile, RADIX_SKILL_CATEGORIES } from "../types/contract";

/**
 * RADIX Hackathon — Talent Check Company Skillset Expectations
 * Loaded from talent_check_company_skillsets.json (Participant Brief Page 11)
 * Covers all 12 RADIX skillsets for:
 *  - Google LLC
 *  - Microsoft Corporation
 *  - Oracle Financial Services Software
 */

export interface CompanySkillsetExpectation {
  company_id: string;
  name: string;
  locations: string[];
  roles: string[];
  description: string;
  skill_thresholds: Record<Exclude<CategoryCode, "OTHER">, number>;
}

export interface TalentCheckCompanyDataset {
  companies: {
    google: CompanySkillsetExpectation;
    microsoft: CompanySkillsetExpectation;
    oracle: CompanySkillsetExpectation;
    [key: string]: CompanySkillsetExpectation;
  };
}

/**
 * Canonical 12-skillset expectation dataset matching talent_check_company_skillsets.json
 */
export const TALENT_CHECK_COMPANY_SKILLSETS: TalentCheckCompanyDataset = {
  companies: {
    google: {
      company_id: "google",
      name: "Google LLC",
      locations: ["Bengaluru, India (Hybrid)", "Bengaluru, India"],
      roles: [
        "Software Engineer (SWE)",
        "Data Scientist"
      ],
      skill_thresholds: {
        COD: 9,
        DSA: 9,
        OOD: 8,
        APTI: 9,
        COMM: 8,
        AI: 8,
        CLOUD: 7,
        SQL: 7,
        SWE: 9,
        SYSD: 9,
        NETW: 8,
        OS: 8
      },
      description: "High bar in algorithmic problem solving (DSA 9/10), deep systems/OS, and scalable architecture."
    },
    microsoft: {
      company_id: "microsoft",
      name: "Microsoft Corporation",
      locations: ["Hyderabad, India"],
      roles: [
        "Software Engineer",
        "Data Analyst"
      ],
      skill_thresholds: {
        COD: 8,
        DSA: 8,
        OOD: 8,
        APTI: 8,
        COMM: 8,
        AI: 7,
        CLOUD: 8,
        SQL: 8,
        SWE: 8,
        SYSD: 8,
        NETW: 7,
        OS: 7
      },
      description: "Balanced high bar in SWE, cloud computing (Azure), enterprise design patterns, and DSA."
    },
    oracle: {
      company_id: "oracle",
      name: "Oracle Financial Services Software",
      locations: ["Bengaluru / Mumbai, India", "Bengaluru / Chennai, India"],
      roles: [
        "Associate Software Engineer",
        "Application Support Analyst"
      ],
      skill_thresholds: {
        COD: 7,
        DSA: 6,
        OOD: 7,
        APTI: 7,
        COMM: 8,
        AI: 4,
        CLOUD: 5,
        SQL: 8,
        SWE: 7,
        SYSD: 5,
        NETW: 6,
        OS: 6
      },
      description: "Strong emphasis on SQL, relational integrity, enterprise Java/OOP, client communication, and support triage."
    }
  }
};

export const ALL_12_SKILLSET_CODES: Array<Exclude<CategoryCode, "OTHER">> = [
  "COD",
  "DSA",
  "OOD",
  "APTI",
  "COMM",
  "AI",
  "CLOUD",
  "SQL",
  "SWE",
  "SYSD",
  "NETW",
  "OS"
];

/**
 * Evaluates candidate competency level (1-10 scale) across all 12 skillsets
 * based on verified skills, confidence, evidence depth, hackathons, and internships.
 */
export function computeCandidateCompetencyScores(
  profile: CandidateProfile
): Record<Exclude<CategoryCode, "OTHER">, number> {
  const scores: Record<Exclude<CategoryCode, "OTHER">, number> = {
    COD: 2,
    DSA: 2,
    OOD: 2,
    APTI: 2,
    COMM: 2,
    AI: 1,
    CLOUD: 1,
    SQL: 2,
    SWE: 2,
    SYSD: 1,
    NETW: 1,
    OS: 1
  };

  // 1. Process verified skills
  (profile.skills || []).forEach((skill) => {
    const cat = skill.category_code as Exclude<CategoryCode, "OTHER">;
    if (!scores[cat]) {
      if (cat in scores) {
        scores[cat] = 2;
      } else {
        return;
      }
    }

    let points = 0;
    if (skill.confidence === "high") {
      points += 3.2;
    } else if (skill.confidence === "medium") {
      points += 2.0;
    } else {
      points += 1.0;
    }

    // Evidence depth multiplier
    const ev = (skill.evidence || "").toLowerCase();
    if (
      ev.includes("450+") ||
      ev.includes("from scratch") ||
      ev.includes("99th percentile") ||
      ev.includes("lead") ||
      ev.includes("architect") ||
      ev.includes("production") ||
      ev.includes("100m+") ||
      ev.includes("allocator") ||
      ev.includes("kernel")
    ) {
      points += 1.2;
    } else if (ev.length > 50) {
      points += 0.6;
    }

    scores[cat] += points;
  });

  // 2. Beyond-Resume Boosts: Hackathons
  (profile.hackathons || []).forEach((h) => {
    scores.SWE += 0.8;
    scores.APTI += 0.6;
    scores.COMM += 0.4;

    (h.skills_used || []).forEach((skillName) => {
      const lower = skillName.toLowerCase();
      if (lower.includes("raft") || lower.includes("distributed") || lower.includes("system")) {
        scores.SYSD += 1.2;
      }
      if (lower.includes("c++") || lower.includes("go") || lower.includes("python") || lower.includes("java")) {
        scores.COD += 0.8;
      }
      if (lower.includes("grpc") || lower.includes("network") || lower.includes("socket")) {
        scores.NETW += 1.0;
      }
      if (lower.includes("docker") || lower.includes("cloud") || lower.includes("aws")) {
        scores.CLOUD += 0.8;
      }
      if (lower.includes("sql") || lower.includes("postgres")) {
        scores.SQL += 0.8;
      }
      if (lower.includes("ai") || lower.includes("ml") || lower.includes("torch")) {
        scores.AI += 1.0;
      }
    });

    if (h.achievement && (h.achievement.includes("1st") || h.achievement.includes("Winner") || h.achievement.includes("Top"))) {
      scores.SWE += 0.5;
      scores.APTI += 0.5;
    }
  });

  // 3. Beyond-Resume Boosts: Internships
  (profile.internships || []).forEach((intern) => {
    scores.SWE += 1.0;
    scores.COMM += 1.0;

    const desc = (intern.description || "").toLowerCase();
    if (desc.includes("latency") || desc.includes("scale") || desc.includes("throughput")) {
      scores.SYSD += 0.8;
    }
    if (desc.includes("sql") || desc.includes("database") || desc.includes("query")) {
      scores.SQL += 0.8;
    }
    if (desc.includes("perf") || desc.includes("linux") || desc.includes("concurrency")) {
      scores.OS += 1.0;
    }
  });

  // 4. Beyond-Resume Boosts: Certifications
  (profile.certifications || []).forEach((c) => {
    const certLower = (c.name || "").toLowerCase();
    if (certLower.includes("aws") || certLower.includes("cloud") || certLower.includes("azure")) {
      scores.CLOUD += 1.2;
    }
    if (certLower.includes("oracle") || certLower.includes("sql") || certLower.includes("database")) {
      scores.SQL += 1.2;
    }
    if (certLower.includes("ai") || certLower.includes("deep learning") || certLower.includes("machine learning")) {
      scores.AI += 1.2;
    }
  });

  // Normalize and clamp between 1 and 10
  const finalized: Record<Exclude<CategoryCode, "OTHER">, number> = {} as any;
  ALL_12_SKILLSET_CODES.forEach((cat) => {
    finalized[cat] = Math.min(10, Math.max(1, Math.round(scores[cat])));
  });

  return finalized;
}

export interface SkillGapItem {
  category: Exclude<CategoryCode, "OTHER">;
  req: number;
  cand: number;
  gap: number;
  name: string;
  recommendation: string;
}

export interface SkillStrengthItem {
  category: Exclude<CategoryCode, "OTHER">;
  req: number;
  cand: number;
  name: string;
}

export interface CategoryComparisonRow {
  category: Exclude<CategoryCode, "OTHER">;
  name: string;
  req: number;
  cand: number;
  status: "met" | "gap" | "exceeds";
  gap: number;
  recommendation: string;
}

export interface TalentCheckEvaluationResult {
  readinessScore: number;
  strengths: SkillStrengthItem[];
  gaps: SkillGapItem[];
  comparison: CategoryComparisonRow[];
  totalRequired: number;
  totalMet: number;
  barStatus: "Meets Bar" | "Competitive" | "Gaps to Bridge";
  fitSummaryByRole: Array<{
    role: string;
    isPrimaryFit: boolean;
    fitNote: string;
  }>;
}

/**
 * Evaluates candidate scores against a company's 12-skillset thresholds
 */
export function evaluateCandidateAgainstCompany(
  candidateScores: Record<Exclude<CategoryCode, "OTHER">, number>,
  company: CompanySkillsetExpectation
): TalentCheckEvaluationResult {
  let totalRequired = 0;
  let totalMet = 0;

  const gaps: SkillGapItem[] = [];
  const strengths: SkillStrengthItem[] = [];
  const comparison: CategoryComparisonRow[] = [];

  ALL_12_SKILLSET_CODES.forEach((cat) => {
    const req = company.skill_thresholds[cat] || 6;
    const cand = candidateScores[cat] || 1;
    const meta = RADIX_SKILL_CATEGORIES[cat];
    const name = meta?.name || cat;

    totalRequired += req;
    totalMet += Math.min(req, cand);

    const isGap = cand < req;
    const gapAmount = isGap ? req - cand : 0;
    const status: "met" | "gap" | "exceeds" = cand > req ? "exceeds" : cand === req ? "met" : "gap";
    const recommendation = getTargetedRecommendation(cat, cand, req, company.name);

    if (isGap) {
      gaps.push({
        category: cat,
        req,
        cand,
        gap: gapAmount,
        name,
        recommendation
      });
    } else {
      strengths.push({
        category: cat,
        req,
        cand,
        name
      });
    }

    comparison.push({
      category: cat,
      name,
      req,
      cand,
      status,
      gap: gapAmount,
      recommendation
    });
  });

  // Sort gaps by severity (largest gap first)
  gaps.sort((a, b) => b.gap - a.gap);

  const readinessScore = totalRequired > 0 ? Math.round((totalMet / totalRequired) * 100) : 0;

  const barStatus: "Meets Bar" | "Competitive" | "Gaps to Bridge" =
    readinessScore >= 80 ? "Meets Bar" : readinessScore >= 65 ? "Competitive" : "Gaps to Bridge";

  // Compute fit for company roles
  const fitSummaryByRole = company.roles.map((role) => {
    let roleFit = false;
    let note = "";

    const lowerRole = role.toLowerCase();
    if (lowerRole.includes("data scientist") || lowerRole.includes("data analyst")) {
      const dataScore = (candidateScores.SQL + candidateScores.AI + candidateScores.APTI) / 3;
      roleFit = dataScore >= (company.skill_thresholds.SQL + company.skill_thresholds.AI + company.skill_thresholds.APTI) / 3 - 0.5;
      note = roleFit
        ? `Strong candidate alignment in SQL (${candidateScores.SQL}/10), AI/ML (${candidateScores.AI}/10), and Quantitative Analytics (${candidateScores.APTI}/10).`
        : `Requires elevating AI/ML (currently ${candidateScores.AI}/10, bar is ${company.skill_thresholds.AI}/10) and SQL pipelines.`;
    } else if (lowerRole.includes("software engineer") || lowerRole.includes("swe")) {
      const sweScore = (candidateScores.COD + candidateScores.DSA + candidateScores.SWE) / 3;
      roleFit = sweScore >= (company.skill_thresholds.COD + company.skill_thresholds.DSA + company.skill_thresholds.SWE) / 3 - 0.5;
      note = roleFit
        ? `Exceeds core SWE thresholds in Coding (${candidateScores.COD}/10) and Algorithmic Problem Solving (${candidateScores.DSA}/10).`
        : `Bridge algorithmic problem solving (${candidateScores.DSA}/10) and system architecture.`;
    } else if (lowerRole.includes("support")) {
      const supportScore = (candidateScores.SQL + candidateScores.COMM + candidateScores.APTI) / 3;
      roleFit = supportScore >= 7;
      note = roleFit
        ? `High competence in SQL relational queries (${candidateScores.SQL}/10), incident triage (${candidateScores.APTI}/10), and technical communication (${candidateScores.COMM}/10).`
        : `Focus on database query optimization and enterprise incident communication.`;
    } else {
      roleFit = readinessScore >= 70;
      note = roleFit ? "Balanced competencies meeting typical hiring bar." : "Specific technical competencies need augmentation.";
    }

    return {
      role,
      isPrimaryFit: roleFit,
      fitNote: note
    };
  });

  return {
    readinessScore,
    strengths,
    gaps,
    comparison,
    totalRequired,
    totalMet,
    barStatus,
    fitSummaryByRole
  };
}

function getTargetedRecommendation(
  cat: Exclude<CategoryCode, "OTHER">,
  cand: number,
  req: number,
  companyName: string
): string {
  switch (cat) {
    case "DSA":
      return `Practice advanced tree algorithms, graph traversal (DFS/BFS), and dynamic programming to lift from ${cand}/10 to ${req}/10 standard.`;
    case "COD":
      return `Build production-quality implementations in C++, Go, Java, or Python demonstrating clean memory and concurrency handling.`;
    case "SYSD":
      return `Study distributed consensus protocols (Raft, Paxos), partitioned storage sharding, and caching strategies required at ${companyName}.`;
    case "OS":
      return `Deepen understanding of Linux epoll I/O multiplexing, POSIX threads, memory paging, and process scheduling.`;
    case "NETW":
      return `Build a custom binary TCP socket protocol with framed packets, checksums, and backpressure handling.`;
    case "SQL":
      return `Master advanced relational SQL: CTEs, window functions, query execution plan analysis, and index tuning.`;
    case "CLOUD":
      return `Containerize microservices with multi-stage Dockerfiles and deploy with automated CI/CD pipelines to AWS, Azure, or GCP.`;
    case "AI":
      return `Implement machine learning pipelines with Scikit-Learn or PyTorch, emphasizing hyperparameter tuning and model evaluation.`;
    case "SWE":
      return `Add unit testing suites with >85% coverage, automated linting, and GitHub Actions continuous integration.`;
    case "OOD":
      return `Refactor application architectures strictly following SOLID principles, factory, and observer design patterns.`;
    case "COMM":
      return `Draft architectural decision records (ADRs) and technical walkthroughs demonstrating structured engineering communication.`;
    case "APTI":
      return `Practice competitive quantitative reasoning, probability distributions, and algorithmic complexity estimation.`;
    default:
      return `Review technical documentation and build a reference project demonstrating ${cat} competency.`;
  }
}

