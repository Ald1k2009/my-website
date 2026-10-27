import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowRight, Check, X, Plus, Search, Sparkles, LogOut, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";

/* ============================== DESIGN TOKENS ============================== */
const C = {
  bg: "#FAF9F4",
  paper: "#FFFFFF",
  card: "#F2F0E6",
  ink: "#181B22",
  inkSoft: "#5B5F6B",
  border: "#DEDACB",
  borderStrong: "#C9C4B0",
  accent: "#2E45C7",
  accentDeep: "#20309A",
  accentSoft: "#E8EAF9",
  success: "#1F7A54",
  successSoft: "#E4F3EC",
  danger: "#AE402B",
  dangerSoft: "#FAEAE6",
  warn: "#96650F",
  warnSoft: "#F6EDDA",
};
const serif = '"Iowan Old Style","Palatino Linotype",Georgia,serif';

/* ============================== CONSTANTS ============================== */
const ROLE_OPTIONS = ["Developer", "Designer", "AI/ML", "Researcher", "Product", "Marketing", "Other"];
const SKILL_OPTIONS = ["Python","JavaScript","TypeScript","React","Node.js","UI/UX","Figma","Machine Learning","Marketing","Research","FastAPI","PostgreSQL","Docker","OpenAI API","Writing","SQL"];
const EXPERIENCE_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const LOOKING_FOR_OPTIONS = ["I have an idea", "I want to join projects", "Both"];
const INTEREST_OPTIONS = ["AI", "Education", "Sustainability", "Health", "FinTech", "Social impact", "Open source", "Other"];
const AVAILABILITY_OPTIONS = ["1–3 hrs/week", "3–5 hrs/week", "5–10 hrs/week", "10+ hrs/week"];
const CATEGORY_OPTIONS = ["AI", "Education", "Sustainability", "Health", "FinTech", "Social impact", "Open source", "Other"];
const STAGE_OPTIONS = ["Idea", "Planning", "Building", "Beta", "Completed"];
const LANGUAGE_OPTIONS = ["English", "Russian", "Kazakh", "Spanish", "French", "German", "Chinese", "Turkish", "Arabic", "Portuguese", "Other"];
const LANGUAGE_LEVELS = ["Native", "Fluent", "Intermediate", "Basic"];
const TIMEZONE_OPTIONS = Array.from({ length: 27 }, (_, i) => i - 12).map((h) => `UTC${h >= 0 ? "+" : ""}${h}`);
const COLLAB_TYPE_OPTIONS = ["Remote", "Hybrid", "In-person"];
const PROJECT_TYPE_OPTIONS = ["Hackathon", "Startup", "Personal Project", "University / School Project", "Research", "Open Source", "Portfolio Project", "Long-term Collaboration", "Other"];
const GOAL_OPTIONS = ["Build my portfolio", "Learn new skills", "Win a hackathon", "Start a business", "Research", "Build something useful", "Meet talented people", "Prepare for university / career", "Build for fun"];
const COMMUNICATION_STYLE_OPTIONS = ["Mostly async", "Regular meetings", "Daily communication", "Flexible", "Structured / deadline-focused"];
const COMMUNICATION_PLATFORM_OPTIONS = ["Discord", "Telegram", "WhatsApp", "Slack", "Email", "Other"];
// Maps a personal goal to the project types it's naturally compatible with, for match scoring.
const GOAL_TO_PROJECT_TYPES = {
  "Build my portfolio": ["Portfolio Project", "Personal Project", "Open Source"],
  "Learn new skills": ["Hackathon", "Personal Project", "Open Source", "University / School Project"],
  "Win a hackathon": ["Hackathon"],
  "Start a business": ["Startup", "Long-term Collaboration"],
  "Research": ["Research", "University / School Project"],
  "Build something useful": ["Startup", "Open Source", "Long-term Collaboration"],
  "Meet talented people": ["Hackathon", "Startup", "Long-term Collaboration"],
  "Prepare for university / career": ["University / School Project", "Portfolio Project"],
  "Build for fun": ["Personal Project", "Hackathon"],
};
const tzOffset = (tz) => (tz ? parseInt(tz.replace("UTC", ""), 10) || 0 : null);

/* ============================== UTILITIES ============================== */
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + uid().slice(0, 4);
const initials = (name) => (name || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const AVATAR_HUES = [C.accent, "#8E4B9E", "#1F7A54", "#AE402B", "#96650F", "#2E7DA6"];
const avatarColor = (name) => AVATAR_HUES[(name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HUES.length];

/* ============================== PERSISTENCE LAYER (acts as the DB) ============================== */
async function loadShared(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}
async function saveShared(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}
async function getSession() {
  try {
    const r = await window.storage.get("bt_session", false);
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
async function setSession(userId) {
  try {
    await window.storage.set("bt_session", JSON.stringify({ userId }), false);
  } catch (e) {}
}
async function clearSession() {
  try {
    await window.storage.delete("bt_session", false);
  } catch (e) {}
}

/* ============================== DEMO DATA SEED ============================== */
function buildDemoData() {
  const mk = (o) => ({
    onboardingComplete: true, bio: "", location: "", createdAt: Date.now(),
    languagesSpoken: [], preferredTeamLanguages: [], timezone: "UTC+5",
    collaborationTypePreference: ["Remote"], goals: [], communicationStyle: "Flexible",
    communicationPlatform: ["Discord"], github: "", portfolio: "", linkedin: "", website: "",
    ...o,
  });
  const users = [
    mk({ id: "u_alex", name: "Alex Kim", email: "alex@demo.dev", password: "demo1234", roles: ["Developer"], skills: ["Python", "FastAPI", "PostgreSQL", "Docker"], experienceLevel: "Advanced", lookingFor: "Both", interests: ["AI", "Education", "Open source"], availability: "5–10 hrs/week", bio: "Backend developer who likes shipping fast.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Kazakh", level: "Native" }], preferredTeamLanguages: ["English"], timezone: "UTC+5", collaborationTypePreference: ["Remote", "Hybrid"], goals: ["Build something useful", "Meet talented people"], communicationStyle: "Regular meetings", communicationPlatform: ["Discord", "Slack"], github: "github.com/alexkim" }),
    mk({ id: "u_mira", name: "Mira Ilyas", email: "mira@demo.dev", password: "demo1234", roles: ["Designer"], skills: ["Figma", "UI/UX"], experienceLevel: "Intermediate", lookingFor: "I want to join projects", interests: ["Education", "Health", "Social impact"], availability: "3–5 hrs/week", bio: "Product designer focused on clean, usable interfaces.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Russian", level: "Native" }], preferredTeamLanguages: ["English", "Russian"], timezone: "UTC+5", collaborationTypePreference: ["Remote"], goals: ["Build my portfolio", "Learn new skills"], communicationStyle: "Mostly async", communicationPlatform: ["Telegram"], portfolio: "mira.design" }),
    mk({ id: "u_dan", name: "Daniyar Suleimen", email: "dan@demo.dev", password: "demo1234", roles: ["AI/ML"], skills: ["Python", "Machine Learning", "OpenAI API"], experienceLevel: "Advanced", lookingFor: "I want to join projects", interests: ["AI", "Sustainability"], availability: "5–10 hrs/week", bio: "ML engineer, previously built a crop-disease classifier.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Kazakh", level: "Native" }, { language: "Russian", level: "Fluent" }], preferredTeamLanguages: ["English"], timezone: "UTC+6", collaborationTypePreference: ["Remote"], goals: ["Research", "Build something useful"], communicationStyle: "Flexible", communicationPlatform: ["Discord"], github: "github.com/dsuleimen" }),
    mk({ id: "u_zhan", name: "Zhanna Bekova", email: "zhanna@demo.dev", password: "demo1234", roles: ["Product", "Marketing"], skills: ["Marketing", "Research"], experienceLevel: "Intermediate", lookingFor: "Both", interests: ["FinTech", "Social impact"], availability: "1–3 hrs/week", bio: "Early-stage product person, loves talking to users.", languagesSpoken: [{ language: "English", level: "Intermediate" }, { language: "Russian", level: "Native" }], preferredTeamLanguages: ["Russian"], timezone: "UTC+5", collaborationTypePreference: ["Hybrid", "In-person"], goals: ["Start a business", "Meet talented people"], communicationStyle: "Structured / deadline-focused", communicationPlatform: ["WhatsApp"], linkedin: "linkedin.com/in/zbekova" }),
    mk({ id: "u_erlan", name: "Erlan Tokayev", email: "erlan@demo.dev", password: "demo1234", roles: ["Developer"], skills: ["JavaScript", "TypeScript", "React", "Node.js"], experienceLevel: "Intermediate", lookingFor: "I want to join projects", interests: ["Education", "Open source"], availability: "10+ hrs/week", bio: "Frontend developer, React and TypeScript daily driver.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Kazakh", level: "Native" }], preferredTeamLanguages: ["English", "Kazakh"], timezone: "UTC+5", collaborationTypePreference: ["Remote"], goals: ["Learn new skills", "Build my portfolio"], communicationStyle: "Daily communication", communicationPlatform: ["Discord", "Telegram"], github: "github.com/erlant" }),
    mk({ id: "u_saya", name: "Saya Nurlanovna", email: "saya@demo.dev", password: "demo1234", roles: ["Researcher"], skills: ["Research", "Writing"], experienceLevel: "Beginner", lookingFor: "I want to join projects", interests: ["Health", "AI"], availability: "3–5 hrs/week", bio: "Public health student interested in applied AI.", languagesSpoken: [{ language: "English", level: "Intermediate" }, { language: "Russian", level: "Native" }], preferredTeamLanguages: ["Russian", "English"], timezone: "UTC+5", collaborationTypePreference: ["Remote", "Hybrid"], goals: ["Research", "Prepare for university / career"], communicationStyle: "Mostly async", communicationPlatform: ["Email"] }),
    mk({ id: "u_timur", name: "Timur Aliyev", email: "timur@demo.dev", password: "demo1234", roles: ["Developer", "AI/ML"], skills: ["Python", "SQL", "Machine Learning", "Docker"], experienceLevel: "Advanced", lookingFor: "Both", interests: ["FinTech", "AI"], availability: "5–10 hrs/week", bio: "Full-stack leaning ML, building side projects most weekends.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Russian", level: "Native" }], preferredTeamLanguages: ["English"], timezone: "UTC+3", collaborationTypePreference: ["Remote"], goals: ["Start a business", "Build something useful"], communicationStyle: "Regular meetings", communicationPlatform: ["Slack"], github: "github.com/taliyev" }),
    mk({ id: "u_asel", name: "Asel Nurmagambetova", email: "asel@demo.dev", password: "demo1234", roles: ["Designer", "Product"], skills: ["Figma", "UI/UX", "Research"], experienceLevel: "Advanced", lookingFor: "I want to join projects", interests: ["Sustainability", "Social impact"], availability: "3–5 hrs/week", bio: "Design lead, ran a campus sustainability hackathon track.", languagesSpoken: [{ language: "English", level: "Fluent" }, { language: "Kazakh", level: "Native" }], preferredTeamLanguages: ["English", "Kazakh"], timezone: "UTC+5", collaborationTypePreference: ["Hybrid"], goals: ["Win a hackathon", "Meet talented people"], communicationStyle: "Regular meetings", communicationPlatform: ["Discord"], portfolio: "asel.design" }),
  ];

  const proj = (o) => ({
    status: "published", createdAt: Date.now() - Math.floor(Math.random() * 8e8), updatedAt: Date.now(), members: [],
    teamLanguages: ["English"], requiredLanguage: "", collaborationType: "Remote", projectTypes: ["Personal Project"],
    timezone: "UTC+5", startDate: "", deadline: "", ...o,
  });
  const projects = [
    proj({
      id: "p_english", ownerId: "u_alex", title: "AI English Learning App", slug: "ai-english-learning-app",
      shortDescription: "An AI-powered platform for English speaking practice.",
      description: "Students can practice spoken English with an AI conversation partner that gives real-time feedback on grammar, vocabulary, and fluency, then tracks progress over time.",
      problem: "Students often struggle to practice speaking consistently because they lack a patient partner and honest feedback.",
      targetAudience: "University students and adult learners preparing for English fluency or exams.",
      solution: "An AI conversation partner with personalized feedback and a vocabulary tracker.",
      expectedOutcome: "Learners speak more often and see measurable fluency gains within weeks.",
      category: "Education", stage: "Idea", duration: "2–3 months", commitment: "5–10 hrs/week",
      teamLanguages: ["English", "Kazakh"], requiredLanguage: "", collaborationType: "Remote", projectTypes: ["Startup", "University / School Project"], timezone: "UTC+5", startDate: "2026-10-01", deadline: "2026-12-15",
      features: ["User authentication", "AI conversation practice", "Vocabulary tracking", "Basic progress dashboard"],
      roles: [
        { id: uid(), roleName: "Backend Developer", quantity: 1, required: true, skills: ["Python", "FastAPI", "PostgreSQL"] },
        { id: uid(), roleName: "UI/UX Designer", quantity: 1, required: true, skills: ["Figma", "UI/UX"] },
        { id: uid(), roleName: "AI/ML Engineer", quantity: 1, required: true, skills: ["Python", "OpenAI API", "Machine Learning"] },
        { id: uid(), roleName: "Marketing / Growth", quantity: 1, required: false, skills: ["Marketing"] },
      ],
    }),
    proj({
      id: "p_waste", ownerId: "u_dan", title: "AI Waste Classifier", slug: "ai-waste-classifier",
      shortDescription: "Point your camera at trash, get sorted instantly.",
      description: "A mobile-friendly web app that uses a vision model to classify waste into recycling categories, aimed at university campuses.",
      problem: "People misclassify recyclables because sorting rules vary and are hard to remember.",
      targetAudience: "Campus sustainability offices and eco-conscious students.",
      solution: "A camera-based classifier with instant sorting guidance.",
      expectedOutcome: "Higher correct-sorting rates measured via campus bin audits.",
      category: "Sustainability", stage: "Planning", duration: "1–2 months", commitment: "3–5 hrs/week",
      teamLanguages: ["English"], requiredLanguage: "English", collaborationType: "Remote", projectTypes: ["Hackathon", "University / School Project"], timezone: "UTC+6", startDate: "2026-10-10", deadline: "2026-11-20",
      features: ["Image classification", "Sorting guide by campus", "Usage analytics"],
      roles: [
        { id: uid(), roleName: "Backend Developer", quantity: 1, required: true, skills: ["Python", "PostgreSQL"] },
        { id: uid(), roleName: "Frontend Developer", quantity: 1, required: true, skills: ["React", "TypeScript"] },
      ],
    }),
    proj({
      id: "p_productivity", ownerId: "u_erlan", title: "Student Productivity Platform", slug: "student-productivity-platform",
      shortDescription: "Assignment tracking that syncs with your syllabus.",
      description: "Students upload a syllabus PDF and get a structured task list with reminders, synced across their courses.",
      problem: "Deadlines are scattered across syllabi, emails, and portals.",
      targetAudience: "University students juggling multiple courses.",
      solution: "Automatic syllabus parsing into a unified task list.",
      expectedOutcome: "Fewer missed deadlines, measured by user-reported surveys.",
      category: "Education", stage: "Building", duration: "3–4 months", commitment: "5–10 hrs/week",
      teamLanguages: ["English", "Kazakh"], requiredLanguage: "", collaborationType: "Hybrid", projectTypes: ["Long-term Collaboration", "Portfolio Project"], timezone: "UTC+5", startDate: "2026-08-01", deadline: "2026-12-01",
      features: ["Syllabus parsing", "Unified calendar", "Reminders"],
      roles: [
        { id: uid(), roleName: "Frontend Developer", quantity: 1, required: true, skills: ["React", "TypeScript"] },
        { id: uid(), roleName: "AI/ML Engineer", quantity: 1, required: false, skills: ["Python", "Machine Learning"] },
      ],
    }),
    proj({
      id: "p_fintrack", ownerId: "u_zhan", title: "Micro-Savings for Gig Workers", slug: "micro-savings-gig-workers",
      shortDescription: "Round-up savings built for irregular income.",
      description: "A FinTech tool that rounds up gig-economy payouts into an automated savings pool, with simple goal tracking.",
      problem: "Gig workers have irregular income and struggle to save consistently.",
      targetAudience: "Ride-share, delivery, and freelance gig workers.",
      solution: "Automatic round-up savings tied to payout events.",
      expectedOutcome: "Users build an emergency fund within 3 months.",
      category: "FinTech", stage: "Idea", duration: "2–3 months", commitment: "1–3 hrs/week",
      teamLanguages: ["Russian", "English"], requiredLanguage: "", collaborationType: "Remote", projectTypes: ["Startup"], timezone: "UTC+5", startDate: "2026-11-01", deadline: "2027-01-31",
      features: ["Payout round-ups", "Goal tracking", "Weekly summary"],
      roles: [
        { id: uid(), roleName: "Backend Developer", quantity: 1, required: true, skills: ["Node.js", "PostgreSQL"] },
        { id: uid(), roleName: "Product Manager", quantity: 1, required: false, skills: ["Research"] },
      ],
    }),
    proj({
      id: "p_health", ownerId: "u_saya", title: "Symptom Journal for Chronic Illness", slug: "symptom-journal-chronic-illness",
      shortDescription: "A quiet, low-effort daily health log.",
      description: "A journaling tool for people managing chronic conditions, designed to take under a minute a day and generate doctor-ready summaries.",
      problem: "Patients forget symptom patterns between doctor visits.",
      targetAudience: "People managing chronic conditions and their care teams.",
      solution: "A one-minute daily log with automatic pattern summaries.",
      expectedOutcome: "Patients arrive at appointments with clearer symptom history.",
      category: "Health", stage: "Idea", duration: "2–3 months", commitment: "3–5 hrs/week",
      teamLanguages: ["English", "Russian"], requiredLanguage: "", collaborationType: "Remote", projectTypes: ["Research", "Portfolio Project"], timezone: "UTC+5", startDate: "2026-10-15", deadline: "2027-01-15",
      features: ["Daily log", "Pattern summary", "Exportable report"],
      roles: [
        { id: uid(), roleName: "UI/UX Designer", quantity: 1, required: true, skills: ["Figma", "UI/UX"] },
        { id: uid(), roleName: "Backend Developer", quantity: 1, required: true, skills: ["Python", "PostgreSQL"] },
        { id: uid(), roleName: "Researcher", quantity: 1, required: false, skills: ["Research", "Writing"] },
      ],
    }),
    proj({
      id: "p_oss", ownerId: "u_timur", title: "Open Dataset Explorer", slug: "open-dataset-explorer",
      shortDescription: "Browse and query public datasets without SQL.",
      description: "An open-source tool that lets researchers explore public datasets through natural-language questions instead of writing SQL.",
      problem: "Non-technical researchers can't easily query large public datasets.",
      targetAudience: "Researchers and students working with public data.",
      solution: "A natural-language query layer over common dataset formats.",
      expectedOutcome: "Non-technical users can independently pull the numbers they need.",
      category: "Open source", stage: "Building", duration: "Ongoing", commitment: "5–10 hrs/week",
      teamLanguages: ["English"], requiredLanguage: "English", collaborationType: "Remote", projectTypes: ["Open Source", "Long-term Collaboration"], timezone: "UTC+3", startDate: "2026-06-01", deadline: "",
      features: ["Natural-language queries", "CSV/Parquet support", "Shareable query links"],
      roles: [
        { id: uid(), roleName: "AI/ML Engineer", quantity: 1, required: true, skills: ["Python", "Machine Learning", "OpenAI API"] },
        { id: uid(), roleName: "Frontend Developer", quantity: 1, required: false, skills: ["React", "TypeScript"] },
      ],
    }),
  ];
  return { users, projects };
}

/* ============================== MATCHING ALGORITHM ============================== */
/*
  calculateMatchScore(user, project) -> { score, reasons, breakdown, notes }

  Transparent, weighted scoring. Every component reports what it earned and why,
  so the UI can explain the number instead of showing an unexplained percentage.

  Weights (total 100):
    Role compatibility  25
    Skills              20
    Languages           15
    Interests/category  10
    Goals               10
    Availability        10
    Time-zone overlap    5
    Experience           5
*/
const MATCH_WEIGHTS = {
  role: 25, skills: 20, languages: 15, interests: 10,
  goals: 10, availability: 10, timezone: 5, experience: 5,
};

const LEVEL_STRENGTH = { Native: 1, Fluent: 1, Intermediate: 0.6, Basic: 0.3 };
const HOURS_MIDPOINT = { "1–3 hrs/week": 2, "3–5 hrs/week": 4, "5–10 hrs/week": 7.5, "10+ hrs/week": 12 };

// Rough daily overlap assuming each person has a ~12h waking/working window.
function timezoneOverlapHours(tzA, tzB) {
  const a = tzOffset(tzA), b = tzOffset(tzB);
  if (a === null || b === null) return null;
  return Math.max(0, 12 - Math.abs(a - b));
}

function calculateMatchScore(user, project) {
  const empty = { score: 0, reasons: [], breakdown: [], notes: [] };
  if (!user || !project) return empty;

  const breakdown = [];
  const reasons = [];
  const notes = [];
  const add = (key, label, earned, detail) => {
    breakdown.push({ key, label, earned: Math.round(earned), max: MATCH_WEIGHTS[key], detail });
    return earned;
  };
  let score = 0;

  /* ---- Role compatibility (25) ---- */
  const roles = project.roles || [];
  const userRoles = (user.roles || []).map((r) => r.toLowerCase());
  const openRoles = roles.filter(
    (r) => (r.quantity || 0) - (project.members || []).filter((m) => m.roleId === r.id && m.status === "accepted").length > 0
  );
  const roleHit = openRoles.find((r) =>
    userRoles.some((ur) => r.roleName.toLowerCase().includes(ur) || ur.includes(r.roleName.toLowerCase()))
  );
  if (roleHit) {
    score += add("role", "Role", MATCH_WEIGHTS.role, `Strong match for ${roleHit.roleName}`);
    reasons.push(`Strong role match for ${roleHit.roleName}`);
  } else if (openRoles.length && userRoles.length) {
    score += add("role", "Role", MATCH_WEIGHTS.role * 0.3, "Partial overlap with open roles");
    reasons.push("Partial role overlap");
  } else {
    add("role", "Role", 0, openRoles.length ? "No matching open role" : "No open roles left");
  }

  /* ---- Skills (20) ---- */
  const neededSkills = Array.from(new Set(roles.flatMap((r) => r.skills || [])));
  const userSkills = new Set(user.skills || []);
  const overlap = neededSkills.filter((s) => userSkills.has(s));
  if (neededSkills.length > 0) {
    const earned = (overlap.length / neededSkills.length) * MATCH_WEIGHTS.skills;
    score += add("skills", "Skills", earned, `${overlap.length}/${neededSkills.length} required skills`);
    if (overlap.length > 0) reasons.push(`${overlap.length}/${neededSkills.length} required skills (${overlap.slice(0, 3).join(", ")})`);
  } else {
    add("skills", "Skills", 0, "No skills listed on this project");
  }

  /* ---- Languages (15) ---- */
  const spoken = user.languagesSpoken || [];
  const spokenMap = {};
  spoken.forEach((l) => { spokenMap[l.language] = LEVEL_STRENGTH[l.level] || 0; });
  const teamLangs = project.teamLanguages || [];
  const required = project.requiredLanguage;
  let langEarned = 0;
  let langDetail = "No languages specified";

  if (required) {
    const strength = spokenMap[required] || 0;
    if (strength === 0) {
      langDetail = `Does not speak required language (${required})`;
      notes.push(`This project requires ${required}, which isn't listed on your profile.`);
    } else {
      langEarned = MATCH_WEIGHTS.languages * (0.6 + 0.4 * strength);
      const lvl = (spoken.find((l) => l.language === required) || {}).level;
      langDetail = `Speaks required ${required} (${lvl})`;
      reasons.push(`Speaks required language: ${required} (${lvl})`);
    }
  } else if (teamLangs.length > 0) {
    const shared = teamLangs.filter((l) => (spokenMap[l] || 0) > 0);
    if (shared.length > 0) {
      const best = Math.max(...shared.map((l) => spokenMap[l]));
      const coverage = shared.length / teamLangs.length;
      langEarned = MATCH_WEIGHTS.languages * (0.5 * best + 0.5 * coverage);
      langDetail = `${shared.join(" + ")} compatible`;
      reasons.push(`${shared.join(" + ")} compatible`);
      const preferred = (user.preferredTeamLanguages || []).filter((l) => teamLangs.includes(l));
      if (preferred.length) reasons.push(`Team uses your preferred language (${preferred.join(", ")})`);
    } else {
      langDetail = `No shared language with the team (${teamLangs.join(", ")})`;
      notes.push(`This team communicates in ${teamLangs.join(", ")} — none are on your profile.`);
    }
  }
  score += add("languages", "Languages", langEarned, langDetail);

  /* ---- Interests / category (10) ---- */
  const interests = (user.interests || []).map((i) => i.toLowerCase());
  if (interests.includes((project.category || "").toLowerCase())) {
    score += add("interests", "Interests", MATCH_WEIGHTS.interests, `Shared interest in ${project.category}`);
    reasons.push(`Shared interest in ${project.category}`);
  } else {
    add("interests", "Interests", 0, `You haven't listed ${project.category} as an interest`);
  }

  /* ---- Goals (10) ---- */
  const goals = user.goals || [];
  const ptypes = project.projectTypes || [];
  const goalHits = goals.filter((g) => (GOAL_TO_PROJECT_TYPES[g] || []).some((t) => ptypes.includes(t)));
  if (goalHits.length > 0) {
    const earned = Math.min(1, goalHits.length / 2) * MATCH_WEIGHTS.goals;
    score += add("goals", "Goals", earned, goalHits.join(", "));
    reasons.push(`Fits your goal: ${goalHits[0]}`);
  } else {
    add("goals", "Goals", 0, goals.length ? "Project type doesn't line up with your goals" : "No goals set on your profile");
  }

  /* ---- Availability (10) ---- */
  const userHrs = HOURS_MIDPOINT[user.availability];
  const needHrs = HOURS_MIDPOINT[project.commitment];
  if (userHrs && needHrs) {
    const ratio = Math.min(1, userHrs / needHrs);
    const earned = ratio * MATCH_WEIGHTS.availability;
    score += add("availability", "Availability", earned,
      ratio >= 1 ? `You have ${user.availability} for a ${project.commitment} project` : `Project asks ${project.commitment}, you have ${user.availability}`);
    if (ratio >= 1) reasons.push("Availability covers the project's commitment");
    else notes.push(`This project asks for ${project.commitment}; your profile says ${user.availability}.`);
  } else if (userHrs) {
    score += add("availability", "Availability", MATCH_WEIGHTS.availability * 0.5, "Project hasn't specified a commitment");
  } else {
    add("availability", "Availability", 0, "No availability set on your profile");
  }

  /* ---- Time-zone overlap (5) ---- */
  const ov = timezoneOverlapHours(user.timezone, project.timezone);
  if (ov !== null) {
    const earned = (Math.min(ov, 8) / 8) * MATCH_WEIGHTS.timezone;
    score += add("timezone", "Time zone", earned, `${ov}h overlap/day (${user.timezone} ↔ ${project.timezone})`);
    if (ov >= 4) reasons.push(`${ov}-hour timezone overlap`);
    else notes.push(`Only about ${ov}h of daily overlap between ${user.timezone} and ${project.timezone}.`);
  } else {
    add("timezone", "Time zone", 0, "Time zone not set");
  }

  /* ---- Experience (5) ---- */
  const expRatio = { Beginner: 0.5, Intermediate: 0.8, Advanced: 1 }[user.experienceLevel] || 0;
  score += add("experience", "Experience", expRatio * MATCH_WEIGHTS.experience, user.experienceLevel || "Not set");
  if (expRatio >= 0.8) reasons.push(`${user.experienceLevel} experience level`);

  /* ---- Collaboration type: surfaced as a note, not scored ---- */
  const prefs = user.collaborationTypePreference || [];
  if (project.collaborationType && prefs.length) {
    if (prefs.includes(project.collaborationType)) reasons.push(`${project.collaborationType} matches how you like to work`);
    else notes.push(`This project is ${project.collaborationType}; you prefer ${prefs.join(" / ")}.`);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, breakdown, notes };
}

/* ============================== AI PROJECT ANALYSIS ============================== */
function fallbackAnalyze({ title, shortDescription, description, category }) {
  const text = `${title} ${shortDescription} ${description}`.toLowerCase();
  const roles = [
    { roleName: "Frontend Developer", quantity: 1, required: true, skills: ["React", "TypeScript"] },
    { roleName: "Backend Developer", quantity: 1, required: true, skills: ["Node.js", "PostgreSQL"] },
    { roleName: "UI/UX Designer", quantity: 1, required: false, skills: ["Figma", "UI/UX"] },
  ];
  const skills = new Set(["React", "Node.js", "PostgreSQL", "Figma"]);
  if (/\bai\b|machine learning|\bml\b|model|gpt|nlp|classif/.test(text)) {
    roles.push({ roleName: "AI/ML Engineer", quantity: 1, required: true, skills: ["Python", "Machine Learning", "OpenAI API"] });
    ["Python", "Machine Learning", "OpenAI API"].forEach((s) => skills.add(s));
  }
  if (/market|growth|launch|users acquire|acquisition/.test(text)) {
    roles.push({ roleName: "Marketing / Growth", quantity: 1, required: false, skills: ["Marketing"] });
    skills.add("Marketing");
  }
  if (category === "Research") {
    roles.push({ roleName: "Researcher", quantity: 1, required: false, skills: ["Research", "Writing"] });
    skills.add("Research");
  }
  return {
    summary: shortDescription || (description || "").slice(0, 160) || title,
    problem: `People affected by this currently lack an easy way to ${(shortDescription || "solve this problem").toLowerCase()}.`,
    targetAudience: "People directly affected by the problem described in the idea.",
    features: ["User authentication", "Core workflow for the main use case", "Basic dashboard to track progress"],
    roles,
    skills: Array.from(skills),
    complexity: roles.length >= 4 ? "High" : roles.length === 3 ? "Medium" : "Low",
    risks: ["Scope may grow beyond a minimal MVP", "Finding collaborators with the right skills", "Validating the idea with real users before building too much"],
    nextSteps: ["Confirm the roles you actually need", "Publish the project so it's discoverable", "Reach out to your strongest matches first"],
    source: "fallback",
  };
}

async function analyzeProjectWithAI(fields) {
  const { title, shortDescription, description, category, problem, targetAudience, solution } = fields;
  const system = `You are a startup analyst embedded in a product called BuildTogether. Given a project idea, respond with ONLY a JSON object (no markdown fences, no preamble) matching exactly this shape:
{"summary":"string, 1-2 sentences","problem":"string","targetAudience":"string","features":["string", ...4 max],"roles":[{"roleName":"string","quantity":1,"required":true,"skills":["string","string","string"]}],"skills":["string", ...8 max],"complexity":"Low|Medium|High","risks":["string", ...3 max],"nextSteps":["string", ...3 max]}
Suggest 3-5 realistic roles from this vocabulary where sensible: Backend Developer, Frontend Developer, UI/UX Designer, AI/ML Engineer, Marketing / Growth, Product Manager, Researcher. Keep skills concrete and short (e.g. "Python", "React", "Figma", "OpenAI API").`;
  const user = `Project title: ${title}\nShort description: ${shortDescription}\nDetailed idea: ${description}\nCategory: ${category}\nProblem: ${problem || "(not specified)"}\nTarget users: ${targetAudience || "(not specified)"}\nProposed solution: ${solution || "(not specified)"}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages: [{ role: "user", content: user }] }),
    });
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.roles || !Array.isArray(parsed.roles)) throw new Error("bad shape");
    parsed.roles = parsed.roles.map((r) => ({ ...r, id: uid(), quantity: r.quantity || 1, required: r.required !== false, skills: r.skills || [] }));
    parsed.source = "ai";
    return parsed;
  } catch (e) {
    const fb = fallbackAnalyze(fields);
    fb.roles = fb.roles.map((r) => ({ ...r, id: uid() }));
    return fb;
  }
}

/* ============================== SMALL UI ATOMS ============================== */
function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", className = "" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" };
  const styles = {
    primary: { background: C.accent, color: "#fff" },
    dark: { background: C.ink, color: "#fff" },
    outline: { background: "transparent", color: C.ink, border: `1px solid ${C.borderStrong}` },
    ghost: { background: "transparent", color: C.inkSoft },
    danger: { background: C.dangerSoft, color: C.danger, border: `1px solid ${C.danger}22` },
    success: { background: C.successSoft, color: C.success, border: `1px solid ${C.success}22` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${className}`} style={styles[variant]}>
      {children}
    </button>
  );
}
function Pill({ children, tone = "neutral", small }) {
  const tones = {
    neutral: { background: C.card, color: C.inkSoft, border: `1px solid ${C.border}` },
    accent: { background: C.accentSoft, color: C.accentDeep, border: `1px solid ${C.accent}33` },
    success: { background: C.successSoft, color: C.success, border: `1px solid ${C.success}33` },
    warn: { background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}33` },
    danger: { background: C.dangerSoft, color: C.danger, border: `1px solid ${C.danger}33` },
  };
  return (
    <span className={`inline-flex items-center rounded-full ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`} style={tones[tone]}>
      {children}
    </span>
  );
}
function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-lg ${className}`} style={{ background: C.paper, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>{label}</div>
      {children}
      {hint && <div className="text-xs mt-1" style={{ color: C.inkSoft }}>{hint}</div>}
    </label>
  );
}
function inputStyle() {
  return { background: C.paper, border: `1px solid ${C.border}`, color: C.ink };
}
function TextInput(props) {
  return <input {...props} className={`w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${props.className || ""}`} style={{ ...inputStyle(), ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} className={`w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${props.className || ""}`} style={{ ...inputStyle(), ...(props.style || {}) }} />;
}
function Select(props) {
  return (
    <select {...props} className={`w-full rounded-md px-3 py-2 text-sm outline-none ${props.className || ""}`} style={inputStyle()}>
      {props.children}
    </select>
  );
}
function MultiChoice({ options, value, onChange, single }) {
  const toggle = (opt) => {
    if (single) return onChange(opt);
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  const isOn = (opt) => (single ? value === opt : value.includes(opt));
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className="rounded-md px-3 py-1.5 text-sm transition-colors"
          style={isOn(opt) ? { background: C.ink, color: "#fff", border: `1px solid ${C.ink}` } : { background: C.paper, color: C.ink, border: `1px solid ${C.border}` }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
function UserAvatar({ user, size = 36 }) {
  const name = user?.name || "?";
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold"
      style={{ width: size, height: size, background: avatarColor(name), color: "#fff", fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
function MatchBadge({ score }) {
  const tone = score >= 75 ? "success" : score >= 45 ? "accent" : "neutral";
  return <Pill tone={tone}>Match {score}%</Pill>;
}

/* Editor for "languages I speak" — language + proficiency level pairs. */
function LanguageEditor({ value = [], onChange }) {
  const [lang, setLang] = useState("");
  const [level, setLevel] = useState("Fluent");
  const addLang = () => {
    if (!lang || value.some((v) => v.language === lang)) return;
    onChange([...value, { language: lang, level }]);
    setLang("");
  };
  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {value.map((v) => (
            <div key={v.language} className="flex items-center gap-2">
              <span className="text-sm flex-1" style={{ color: C.ink }}>{v.language}</span>
              <Select
                value={v.level}
                onChange={(e) => onChange(value.map((x) => (x.language === v.language ? { ...x, level: e.target.value } : x)))}
                style={{ maxWidth: 150 }}
              >
                {LANGUAGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </Select>
              <button onClick={() => onChange(value.filter((x) => x.language !== v.language))} style={{ color: C.inkSoft }} aria-label={`Remove ${v.language}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">Add a language…</option>
          {LANGUAGE_OPTIONS.filter((l) => !value.some((v) => v.language === l)).map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} style={{ maxWidth: 150 }}>
          {LANGUAGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
        </Select>
        <Btn size="sm" variant="outline" onClick={addLang}>Add</Btn>
      </div>
    </div>
  );
}

/* Explainable score: a bar per component, so the percentage is never unexplained. */
function MatchBreakdown({ match, compact }) {
  const [open, setOpen] = useState(false);
  if (!match) return null;
  return (
    <Card className="p-4 mb-6" style={{ background: C.accentSoft, borderColor: `${C.accent}33` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium" style={{ color: C.accentDeep }}>{match.score}% match — why?</div>
        <button className="text-xs" style={{ color: C.accentDeep }} onClick={() => setOpen(!open)}>
          {open ? "Hide detail" : "Show detail"}
        </button>
      </div>
      <ul className="text-sm flex flex-col gap-1" style={{ color: C.accentDeep }}>
        {match.reasons.map((r, i) => <li key={i}>+ {r}</li>)}
      </ul>
      {match.notes?.length > 0 && (
        <ul className="text-sm flex flex-col gap-1 mt-2" style={{ color: C.warn }}>
          {match.notes.map((n, i) => <li key={i}>! {n}</li>)}
        </ul>
      )}
      {open && (
        <div className="flex flex-col gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${C.accent}33` }}>
          {match.breakdown.map((b) => (
            <div key={b.key}>
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.accentDeep }}>
                <span>{b.label}</span>
                <span>{b.earned}/{b.max}</span>
              </div>
              <div className="h-1 w-full rounded-full" style={{ background: `${C.accent}22` }}>
                <div className="h-1 rounded-full" style={{ width: `${(b.earned / b.max) * 100}%`, background: C.accent }} />
              </div>
              {b.detail && <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{b.detail}</div>}
            </div>
          ))}
          <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
            Match score is a transparent heuristic, not a guarantee of compatibility.
          </p>
        </div>
      )}
    </Card>
  );
}

/* Optional profile links (GitHub / portfolio / LinkedIn / website). */
function ProfileLinks({ user }) {
  const links = [
    ["GitHub", user.github], ["Portfolio", user.portfolio],
    ["LinkedIn", user.linkedin], ["Website", user.website],
  ].filter(([, v]) => v && v.trim());
  if (!links.length) return null;
  const href = (v) => (v.startsWith("http") ? v : `https://${v}`);
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {links.map(([label, v]) => (
        <a key={label} href={href(v)} target="_blank" rel="noreferrer noopener" className="text-sm" style={{ color: C.accent }}>
          {label} ↗
        </a>
      ))}
    </div>
  );
}
function EmptyState({ title, subtitle, action }) {
  return (
    <div className="text-center py-14 px-6 rounded-lg" style={{ border: `1px dashed ${C.border}`, background: C.card }}>
      <p className="text-base font-medium" style={{ color: C.ink, fontFamily: serif }}>{title}</p>
      {subtitle && <p className="text-sm mt-1.5 max-w-sm mx-auto" style={{ color: C.inkSoft }}>{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(24,27,34,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg p-6 max-h-[85vh] overflow-y-auto" style={{ background: C.paper, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ fontFamily: serif, color: C.ink }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.inkSoft }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Banner({ tone = "warn", children }) {
  const tones = { warn: [C.warnSoft, C.warn], danger: [C.dangerSoft, C.danger], accent: [C.accentSoft, C.accentDeep] };
  const [bg, fg] = tones[tone];
  return (
    <div className="flex items-start gap-2 rounded-md px-3 py-2 text-sm mb-4" style={{ background: bg, color: fg }}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
function ProgressLine({ step, total }) {
  return (
    <div className="mb-8">
      <div className="text-xs mb-2" style={{ color: C.inkSoft }}>Step {step + 1} of {total}</div>
      <div className="h-1 w-full rounded-full" style={{ background: C.border }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${((step + 1) / total) * 100}%`, background: C.accent }} />
      </div>
    </div>
  );
}

/* ============================== PROJECT CARD ============================== */
function openSlots(project) {
  return (project.roles || []).map((r) => ({
    ...r,
    filled: (project.members || []).filter((m) => m.roleId === r.id && m.status === "accepted").length,
  }));
}
function ProjectCard({ project, owner, matchScore, onOpen }) {
  const slots = openSlots(project);
  const needed = slots.filter((s) => s.filled < s.quantity);
  return (
    <Card className="p-5 flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold" style={{ fontFamily: serif, color: C.ink }}>{project.title}</h3>
          <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{project.shortDescription}</p>
        </div>
        {typeof matchScore === "number" && <MatchBadge score={matchScore} />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Pill small>{project.category}</Pill>
        <Pill small tone="accent">{project.stage}</Pill>
        {project.collaborationType && <Pill small>{project.collaborationType}</Pill>}
        {(project.projectTypes || []).slice(0, 2).map((t) => <Pill key={t} small tone="accent">{t}</Pill>)}
        {project.status === "draft" && <Pill small tone="warn">Draft</Pill>}
      </div>
      {(project.teamLanguages || []).length > 0 && (
        <div className="text-xs" style={{ color: C.inkSoft }}>
          Speaks: {project.teamLanguages.join(", ")}
          {project.requiredLanguage ? ` · ${project.requiredLanguage} required` : ""}
        </div>
      )}
      <div className="text-sm" style={{ color: C.inkSoft }}>
        <span className="font-medium" style={{ color: C.ink }}>Looking for: </span>
        {needed.length ? needed.map((s) => s.roleName).join(", ") : "Team complete"}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.inkSoft }}>
          <UserAvatar user={owner} size={22} />
          {owner?.name || "Unknown"}
        </div>
        <button onClick={onOpen} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: C.accent }}>
          View project <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  );
}

/* ============================== NAVBAR ============================== */
function Navbar({ currentUser, nav, onLogout, route }) {
  const link = (name, label) => (
    <button
      onClick={() => nav(name)}
      className="text-sm font-medium px-1"
      style={{ color: route.name === name ? C.ink : C.inkSoft, borderBottom: route.name === name ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom: 4 }}
    >
      {label}
    </button>
  );
  return (
    <div className="sticky top-0 z-40 border-b" style={{ background: C.bg, borderColor: C.border }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => nav("landing")} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold" style={{ background: C.ink }}>B</div>
          <span className="text-lg font-semibold" style={{ fontFamily: serif, color: C.ink }}>BuildTogether</span>
        </button>
        <div className="hidden md:flex items-center gap-6">
          {link("explore", "Explore")}
          {currentUser && link("dashboard", "Dashboard")}
          {currentUser && link("create", "New project")}
        </div>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <button onClick={() => nav("profile", { userId: currentUser.id })} className="flex items-center gap-2">
                <UserAvatar user={currentUser} size={30} />
              </button>
              <button onClick={onLogout} title="Log out" style={{ color: C.inkSoft }}><LogOut size={17} /></button>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="sm" onClick={() => nav("auth", { mode: "login" })}>Log in</Btn>
              <Btn size="sm" onClick={() => nav("auth", { mode: "signup" })}>Sign up</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== LANDING ============================== */
function Landing({ nav, currentUser }) {
  const demoProject = { title: "AI English Learning App", roles: [{ roleName: "Developer" }, { roleName: "Designer" }, { roleName: "Marketing" }] };
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl leading-tight" style={{ fontFamily: serif, color: C.ink }}>
            Find the people who can help you build your idea.
          </h1>
          <p className="mt-5 text-lg" style={{ color: C.inkSoft }}>
            Turn an idea into a project, discover the skills you need, and find collaborators who want to build something together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn size="lg" onClick={() => nav(currentUser ? "create" : "auth", currentUser ? {} : { mode: "signup", intent: "create" })}>
              Create a project <ArrowRight size={16} />
            </Btn>
            <Btn size="lg" variant="outline" onClick={() => nav("explore")}>Explore projects</Btn>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.slice(0, 6).map((c) => <Pill key={c}>{c}</Pill>)}
          </div>
        </div>
        <Card className="p-6" style={{ background: C.card }}>
          <div className="text-xs mb-3" style={{ color: C.inkSoft }}>Example project</div>
          <Card className="p-5">
            <h3 className="text-lg font-semibold" style={{ fontFamily: serif, color: C.ink }}>{demoProject.title}</h3>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>An AI-powered platform for English speaking practice.</p>
            <div className="mt-4 text-sm" style={{ color: C.ink }}>
              <div className="font-medium mb-1.5">Needed</div>
              <div className="flex gap-1.5 flex-wrap">{demoProject.roles.map((r) => <Pill key={r.roleName} small>{r.roleName}</Pill>)}</div>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-sm" style={{ color: C.inkSoft }}>Matched</span>
              <Pill tone="success">3 potential collaborators</Pill>
            </div>
          </Card>
        </Card>
      </div>

      <div className="border-t" style={{ borderColor: C.border, background: C.paper }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              ["Have an idea?", "Describe what you want to build, in your own words."],
              ["Turn it into a project", "AI structures it into roles, skills, and a plan you can edit."],
              ["Find the right people", "Browse collaborators, or let matching surface strong fits."],
              ["Build together", "Accept requests and track your team from one dashboard."],
            ].map(([t, d], i) => (
              <div key={t}>
                <div className="text-sm mb-2" style={{ color: C.accent, fontFamily: serif }}>{i + 1}</div>
                <div className="font-medium mb-1" style={{ color: C.ink }}>{t}</div>
                <div className="text-sm" style={{ color: C.inkSoft }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl" style={{ fontFamily: serif, color: C.ink }}>Not just people matching.<br />Project matching.</h2>
            <p className="mt-4 text-base" style={{ color: C.inkSoft }}>
              Most platforms connect you to people. BuildTogether starts from your project — the roles it needs, the skills required, the stage it's at — and finds collaborators who actually fit that specific thing you're building.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Hackathons", "Startups", "University projects", "Open-source", "Research", "Personal projects"].map((c) => (
              <Pill key={c} tone="accent">{c}</Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row justify-between gap-4 text-sm" style={{ color: C.inkSoft }}>
          <span>© {new Date().getFullYear()} BuildTogether</span>
          <span>Built for students, developers, designers, and founders who need a team.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== AUTH ============================== */
function AuthView({ mode, setMode, users, onAuth, nav }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup") {
      if (!form.name.trim() || !form.email.trim() || form.password.length < 4) {
        setError("Please fill in your name, email, and a password of at least 4 characters.");
        return;
      }
      if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
        setError("An account with this email already exists. Try logging in instead.");
        return;
      }
      onAuth("signup", form);
    } else {
      const u = users.find((u) => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password);
      if (!u) {
        setError("Invalid email or password.");
        return;
      }
      onAuth("login", u);
    }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8">
        <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
          {mode === "signup" ? "Takes less than a minute." : "Log in to see your projects and matches."}
        </p>
        {error && <Banner tone="danger">{error}</Banner>}
        <form onSubmit={submit}>
          {mode === "signup" && (
            <Field label="Full name">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Kim" />
            </Field>
          )}
          <Field label="Email">
            <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Password" hint={mode === "signup" ? "At least 4 characters — this is a demo, keep it simple." : undefined}>
            <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </Field>
          <Btn type="submit" className="w-full mt-2">{mode === "signup" ? "Create account" : "Log in"}</Btn>
        </form>
        <p className="text-sm mt-5 text-center" style={{ color: C.inkSoft }}>
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button className="font-medium" style={{ color: C.accent }} onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
        <p className="text-xs mt-6 text-center" style={{ color: C.inkSoft }}>
          Demo accounts: any email above like <span style={{ fontFamily: "ui-monospace" }}>alex@demo.dev</span> / password <span style={{ fontFamily: "ui-monospace" }}>demo1234</span>
        </p>
      </Card>
    </div>
  );
}

/* ============================== ONBOARDING ============================== */
function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: user.name || "",
    roles: user.roles || [],
    skills: user.skills || [],
    experienceLevel: user.experienceLevel || "",
    lookingFor: user.lookingFor || "",
    interests: user.interests || [],
    availability: user.availability || "",
    languagesSpoken: user.languagesSpoken || [],
    preferredTeamLanguages: user.preferredTeamLanguages || [],
    timezone: user.timezone || "UTC+5",
    collaborationTypePreference: user.collaborationTypePreference || [],
    goals: user.goals || [],
  });
  const steps = [
    { title: "What's your name?", valid: f.name.trim().length > 0,
      body: <TextInput autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your full name" /> },
    { title: "What do you do?", sub: "Select all that apply.", valid: f.roles.length > 0,
      body: <MultiChoice options={ROLE_OPTIONS} value={f.roles} onChange={(v) => setF({ ...f, roles: v })} /> },
    { title: "What are your skills?", sub: "Pick what you're comfortable with today.", valid: f.skills.length > 0,
      body: <MultiChoice options={SKILL_OPTIONS} value={f.skills} onChange={(v) => setF({ ...f, skills: v })} /> },
    { title: "Experience level", valid: !!f.experienceLevel,
      body: <MultiChoice single options={EXPERIENCE_OPTIONS} value={f.experienceLevel} onChange={(v) => setF({ ...f, experienceLevel: v })} /> },
    { title: "Which languages do you speak?", sub: "Teams match better when everyone shares a working language.", valid: f.languagesSpoken.length > 0,
      body: (
        <div>
          <LanguageEditor value={f.languagesSpoken} onChange={(v) => setF({ ...f, languagesSpoken: v })} />
          <div className="mt-6">
            <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>Preferred team languages</div>
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>Which of these would you actually want to work in?</p>
            <MultiChoice
              options={f.languagesSpoken.map((l) => l.language)}
              value={f.preferredTeamLanguages}
              onChange={(v) => setF({ ...f, preferredTeamLanguages: v })}
            />
          </div>
        </div>
      ) },
    { title: "Where are you based?", sub: "Used to estimate daily overlap with a team.", valid: !!f.timezone,
      body: (
        <div>
          <Select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>
            {TIMEZONE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="mt-6">
            <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>How do you prefer to collaborate?</div>
            <MultiChoice options={COLLAB_TYPE_OPTIONS} value={f.collaborationTypePreference} onChange={(v) => setF({ ...f, collaborationTypePreference: v })} />
          </div>
        </div>
      ) },
    { title: "What are you looking for?", valid: !!f.lookingFor,
      body: <MultiChoice single options={LOOKING_FOR_OPTIONS} value={f.lookingFor} onChange={(v) => setF({ ...f, lookingFor: v })} /> },
    { title: "What are your goals?", sub: "We use these to surface projects worth your time.", valid: f.goals.length > 0,
      body: <MultiChoice options={GOAL_OPTIONS} value={f.goals} onChange={(v) => setF({ ...f, goals: v })} /> },
    { title: "What are you interested in?", valid: f.interests.length > 0,
      body: <MultiChoice options={INTEREST_OPTIONS} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} /> },
    { title: "Availability", sub: "You can fine-tune communication preferences and links later in your profile.", valid: !!f.availability,
      body: <MultiChoice single options={AVAILABILITY_OPTIONS} value={f.availability} onChange={(v) => setF({ ...f, availability: v })} /> },
  ];
  const total = steps.length;
  const cur = steps[step];
  const isLast = step === total - 1;
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <ProgressLine step={step} total={total} />
      <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>{cur.title}</h2>
      {cur.sub ? <p className="text-sm mb-5" style={{ color: C.inkSoft }}>{cur.sub}</p> : <div className="mb-5" />}
      <div className="mb-8">{cur.body}</div>
      <div className="flex items-center justify-between">
        <Btn variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft size={16} /> Back
        </Btn>
        {isLast ? (
          <Btn disabled={!cur.valid} onClick={() => onComplete(f)}>Complete profile <Check size={16} /></Btn>
        ) : (
          <Btn disabled={!cur.valid} onClick={() => setStep((s) => s + 1)}>Next <ChevronRight size={16} /></Btn>
        )}
      </div>
    </div>
  );
}

/* ============================== PROFILE ============================== */
function ProfileEditForm({ user, onSave, onCancel }) {
  const [f, setF] = useState({ ...user });
  return (
    <Card className="p-6">
      <Field label="Bio"><TextArea rows={3} value={f.bio || ""} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="A sentence or two about you." /></Field>
      <Field label="Location (optional)"><TextInput value={f.location || ""} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="City, country" /></Field>
      <Field label="Roles"><MultiChoice options={ROLE_OPTIONS} value={f.roles || []} onChange={(v) => setF({ ...f, roles: v })} /></Field>
      <Field label="Skills"><MultiChoice options={SKILL_OPTIONS} value={f.skills || []} onChange={(v) => setF({ ...f, skills: v })} /></Field>
      <Field label="Experience level"><MultiChoice single options={EXPERIENCE_OPTIONS} value={f.experienceLevel} onChange={(v) => setF({ ...f, experienceLevel: v })} /></Field>

      <Field label="Languages I speak">
        <LanguageEditor value={f.languagesSpoken || []} onChange={(v) => setF({ ...f, languagesSpoken: v, preferredTeamLanguages: (f.preferredTeamLanguages || []).filter((p) => v.some((x) => x.language === p)) })} />
      </Field>
      <Field label="Preferred team languages" hint="Languages you'd actually want to work in day to day.">
        <MultiChoice options={(f.languagesSpoken || []).map((l) => l.language)} value={f.preferredTeamLanguages || []} onChange={(v) => setF({ ...f, preferredTeamLanguages: v })} />
      </Field>

      <Field label="Time zone">
        <Select value={f.timezone || "UTC+5"} onChange={(e) => setF({ ...f, timezone: e.target.value })}>
          {TIMEZONE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="Preferred collaboration type"><MultiChoice options={COLLAB_TYPE_OPTIONS} value={f.collaborationTypePreference || []} onChange={(v) => setF({ ...f, collaborationTypePreference: v })} /></Field>

      <Field label="My goals"><MultiChoice options={GOAL_OPTIONS} value={f.goals || []} onChange={(v) => setF({ ...f, goals: v })} /></Field>
      <Field label="Looking for"><MultiChoice single options={LOOKING_FOR_OPTIONS} value={f.lookingFor} onChange={(v) => setF({ ...f, lookingFor: v })} /></Field>
      <Field label="Interests"><MultiChoice options={INTEREST_OPTIONS} value={f.interests || []} onChange={(v) => setF({ ...f, interests: v })} /></Field>
      <Field label="Availability"><MultiChoice single options={AVAILABILITY_OPTIONS} value={f.availability} onChange={(v) => setF({ ...f, availability: v })} /></Field>

      <Field label="Communication style"><MultiChoice single options={COMMUNICATION_STYLE_OPTIONS} value={f.communicationStyle} onChange={(v) => setF({ ...f, communicationStyle: v })} /></Field>
      <Field label="Preferred platforms"><MultiChoice options={COMMUNICATION_PLATFORM_OPTIONS} value={f.communicationPlatform || []} onChange={(v) => setF({ ...f, communicationPlatform: v })} /></Field>

      <Field label="GitHub (optional)"><TextInput value={f.github || ""} onChange={(e) => setF({ ...f, github: e.target.value })} placeholder="github.com/username" /></Field>
      <Field label="Portfolio (optional)"><TextInput value={f.portfolio || ""} onChange={(e) => setF({ ...f, portfolio: e.target.value })} placeholder="yoursite.com" /></Field>
      <Field label="LinkedIn (optional)"><TextInput value={f.linkedin || ""} onChange={(e) => setF({ ...f, linkedin: e.target.value })} placeholder="linkedin.com/in/username" /></Field>
      <Field label="Personal website (optional)"><TextInput value={f.website || ""} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="example.com" /></Field>

      <div className="flex gap-2 mt-6">
        <Btn onClick={() => onSave(f)}>Save changes</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </Card>
  );
}

function InfoCard({ label, children }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>{label}</div>
      {children}
    </Card>
  );
}
function NoneYet() {
  return <span className="text-sm" style={{ color: C.inkSoft }}>Not set</span>;
}

function ProfileView({ user, isOwn, projectsOwned, projectsJoined, onSave }) {
  const [editing, setEditing] = useState(false);
  if (!user) return <EmptyState title="Person not found" />;
  if (editing) return <div className="max-w-2xl mx-auto px-4 py-10"><ProfileEditForm user={user} onCancel={() => setEditing(false)} onSave={(f) => { onSave(f); setEditing(false); }} /></div>;
  const langs = user.languagesSpoken || [];
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start gap-4">
        <UserAvatar user={user} size={64} />
        <div className="flex-1">
          <h2 className="text-2xl" style={{ fontFamily: serif, color: C.ink }}>{user.name}</h2>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            {(user.roles || []).join(" · ") || "No roles set"}{user.location ? ` · ${user.location}` : ""}{user.timezone ? ` · ${user.timezone}` : ""}
          </p>
          {user.bio && <p className="text-sm mt-2" style={{ color: C.ink }}>{user.bio}</p>}
          <ProfileLinks user={user} />
        </div>
        {isOwn && <Btn variant="outline" size="sm" onClick={() => setEditing(true)}>Edit profile</Btn>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <InfoCard label="Skills">
          <div className="flex flex-wrap gap-1.5">{(user.skills || []).length ? user.skills.map((s) => <Pill key={s} small>{s}</Pill>) : <NoneYet />}</div>
        </InfoCard>
        <InfoCard label="Languages">
          <div className="flex flex-wrap gap-1.5">
            {langs.length ? langs.map((l) => <Pill key={l.language} small tone="accent">{l.language} — {l.level}</Pill>) : <NoneYet />}
          </div>
          {(user.preferredTeamLanguages || []).length > 0 && (
            <div className="text-xs mt-2" style={{ color: C.inkSoft }}>Prefers team language: {user.preferredTeamLanguages.join(", ")}</div>
          )}
        </InfoCard>
        <InfoCard label="Goals">
          <div className="flex flex-wrap gap-1.5">{(user.goals || []).length ? user.goals.map((g) => <Pill key={g} small>{g}</Pill>) : <NoneYet />}</div>
        </InfoCard>
        <InfoCard label="Interested in">
          <div className="flex flex-wrap gap-1.5">{(user.interests || []).length ? user.interests.map((s) => <Pill key={s} small tone="accent">{s}</Pill>) : <NoneYet />}</div>
        </InfoCard>
        <InfoCard label="Experience"><span className="text-sm" style={{ color: C.ink }}>{user.experienceLevel || "Not set"}</span></InfoCard>
        <InfoCard label="Availability"><span className="text-sm" style={{ color: C.ink }}>{user.availability || "Not set"}</span></InfoCard>
        <InfoCard label="Collaboration">
          <div className="flex flex-wrap gap-1.5">{(user.collaborationTypePreference || []).length ? user.collaborationTypePreference.map((c) => <Pill key={c} small>{c}</Pill>) : <NoneYet />}</div>
        </InfoCard>
        <InfoCard label="Communication">
          <div className="text-sm" style={{ color: C.ink }}>{user.communicationStyle || "Not set"}</div>
          {(user.communicationPlatform || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">{user.communicationPlatform.map((p) => <Pill key={p} small>{p}</Pill>)}</div>
          )}
        </InfoCard>
      </div>

      <div className="mt-8">
        <div className="text-sm font-medium mb-2" style={{ color: C.ink }}>Projects owned</div>
        {projectsOwned.length ? <div className="flex flex-col gap-2">{projectsOwned.map((p) => <div key={p.id} className="text-sm" style={{ color: C.accent }}>{p.title}</div>)}</div> : <span className="text-sm" style={{ color: C.inkSoft }}>None yet</span>}
      </div>
      <div className="mt-4">
        <div className="text-sm font-medium mb-2" style={{ color: C.ink }}>Collaboration history</div>
        {projectsJoined.length ? <div className="flex flex-col gap-2">{projectsJoined.map((p) => <div key={p.id} className="text-sm" style={{ color: C.accent }}>{p.title}</div>)}</div> : <span className="text-sm" style={{ color: C.inkSoft }}>No collaborations yet</span>}
      </div>
    </div>
  );
}

/* ============================== PROJECT CREATE WIZARD ============================== */
function RoleEditor({ roles, setRoles }) {
  const update = (id, patch) => setRoles(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => setRoles(roles.filter((r) => r.id !== id));
  const add = () => setRoles([...roles, { id: uid(), roleName: "New role", quantity: 1, required: true, skills: [] }]);
  return (
    <div className="flex flex-col gap-3">
      {roles.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <TextInput value={r.roleName} onChange={(e) => update(r.id, { roleName: e.target.value })} className="font-medium mb-2" />
              <div className="flex flex-wrap gap-1.5 mb-2">
                {r.skills.map((s) => (
                  <Pill key={s} small>
                    {s} <button onClick={() => update(r.id, { skills: r.skills.filter((x) => x !== s) })} className="ml-1"><X size={10} /></button>
                  </Pill>
                ))}
              </div>
              <SkillAdder onAdd={(s) => !r.skills.includes(s) && update(r.id, { skills: [...r.skills, s] })} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => remove(r.id)} style={{ color: C.danger }}><X size={16} /></button>
              <div className="flex items-center gap-1 text-sm">
                <span style={{ color: C.inkSoft }}>Qty</span>
                <input type="number" min={1} max={9} value={r.quantity} onChange={(e) => update(r.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} className="w-14 rounded-md px-2 py-1 text-sm" style={inputStyle()} />
              </div>
              <button onClick={() => update(r.id, { required: !r.required })} className="text-xs">
                <Pill small tone={r.required ? "accent" : "neutral"}>{r.required ? "Required" : "Optional"}</Pill>
              </button>
            </div>
          </div>
        </Card>
      ))}
      <Btn variant="outline" size="sm" onClick={add} className="self-start"><Plus size={14} /> Add role</Btn>
    </div>
  );
}
function SkillAdder({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <Select value={val} onChange={(e) => setVal(e.target.value)}>
        <option value="">Add a skill…</option>
        {SKILL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Btn size="sm" variant="outline" onClick={() => { if (val) { onAdd(val); setVal(""); } }}>Add</Btn>
    </div>
  );
}
function ListEditor({ items, setItems, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex flex-col gap-1.5 mb-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="flex-1" style={{ color: C.ink }}>{it}</span>
            <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{ color: C.inkSoft }}><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput value={val} placeholder={placeholder} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (val.trim()) { setItems([...items, val.trim()]); setVal(""); } } }} />
        <Btn size="sm" variant="outline" onClick={() => { if (val.trim()) { setItems([...items, val.trim()]); setVal(""); } }}>Add</Btn>
      </div>
    </div>
  );
}

function ProjectCreateWizard({ currentUser, onPublish, editingDraft }) {
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(!!editingDraft?.aiRan);
  const [aiSource, setAiSource] = useState(null);
  const [f, setF] = useState(editingDraft || {
    title: "", shortDescription: "", description: "", category: "AI",
    problem: "", targetAudience: "", solution: "", expectedOutcome: "", stage: "Idea", duration: "", commitment: "",
    features: [], roles: [], skills: [], complexity: "", risks: [], nextSteps: [],
    projectTypes: [], collaborationType: "Remote", timezone: "UTC+5",
    teamLanguages: ["English"], requiredLanguage: "", startDate: "", deadline: "",
  });
  const total = 6;

  const runAI = async () => {
    setAiLoading(true);
    const result = await analyzeProjectWithAI(f);
    setF((prev) => ({
      ...prev,
      description: prev.description || result.summary,
      problem: prev.problem || result.problem,
      targetAudience: prev.targetAudience || result.targetAudience,
      features: result.features || [],
      roles: result.roles || [],
      skills: result.skills || [],
      complexity: result.complexity || "",
      risks: result.risks || [],
      nextSteps: result.nextSteps || [],
    }));
    setAiSource(result.source);
    setAiRan(true);
    setAiLoading(false);
  };

  const stepValid = [
    f.title.trim() && f.shortDescription.trim() && f.description.trim(),
    f.problem.trim() && f.targetAudience.trim() && f.solution.trim() && f.stage,
    f.projectTypes.length > 0 && f.teamLanguages.length > 0 && f.collaborationType,
    aiRan,
    f.roles.length > 0,
    true,
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <ProgressLine step={step} total={total} />

      {step === 0 && (
        <div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>What do you want to build?</h2>
          <p className="text-sm mb-6" style={{ color: C.inkSoft }}>e.g. "I want to build an AI application that helps students improve their English speaking skills."</p>
          <Field label="Project title"><TextInput value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="AI English Learning App" /></Field>
          <Field label="Short description"><TextInput value={f.shortDescription} onChange={(e) => setF({ ...f, shortDescription: e.target.value })} placeholder="One sentence anyone can understand." /></Field>
          <Field label="Detailed idea"><TextArea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Describe the idea in your own words." /></Field>
          <Field label="Category">
            <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="text-2xl mb-6" style={{ fontFamily: serif, color: C.ink }}>Project details</h2>
          <Field label="Problem"><TextArea rows={2} value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} placeholder="What problem does this solve?" /></Field>
          <Field label="Target users"><TextInput value={f.targetAudience} onChange={(e) => setF({ ...f, targetAudience: e.target.value })} placeholder="Who is this for?" /></Field>
          <Field label="Proposed solution"><TextArea rows={2} value={f.solution} onChange={(e) => setF({ ...f, solution: e.target.value })} /></Field>
          <Field label="Expected outcome"><TextInput value={f.expectedOutcome} onChange={(e) => setF({ ...f, expectedOutcome: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project stage">
              <Select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>{STAGE_OPTIONS.map((s) => <option key={s}>{s}</option>)}</Select>
            </Field>
            <Field label="Estimated duration"><TextInput value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="2–3 months" /></Field>
          </div>
          <Field label="Commitment required">
            <Select value={f.commitment} onChange={(e) => setF({ ...f, commitment: e.target.value })}>
              <option value="">Select…</option>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>How the team will work</h2>
          <p className="text-sm mb-6" style={{ color: C.inkSoft }}>This is what lets BuildTogether match you with people who can actually collaborate with you.</p>

          <Field label="Project type" hint="Pick everything that applies.">
            <MultiChoice options={PROJECT_TYPE_OPTIONS} value={f.projectTypes} onChange={(v) => setF({ ...f, projectTypes: v })} />
          </Field>

          <Field label="Team communication languages" hint="Languages your team can work in.">
            <MultiChoice options={LANGUAGE_OPTIONS} value={f.teamLanguages} onChange={(v) => setF({ ...f, teamLanguages: v, requiredLanguage: v.includes(f.requiredLanguage) ? f.requiredLanguage : "" })} />
          </Field>

          <Field label="Required language (optional)" hint="Only set this if a collaborator genuinely can't contribute without it.">
            <Select value={f.requiredLanguage} onChange={(e) => setF({ ...f, requiredLanguage: e.target.value })}>
              <option value="">No strict requirement</option>
              {f.teamLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Collaboration type">
              <Select value={f.collaborationType} onChange={(e) => setF({ ...f, collaborationType: e.target.value })}>
                {COLLAB_TYPE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Team time zone">
              <Select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>
                {TIMEZONE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date (optional)">
              <TextInput type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
            </Field>
            <Field label="Deadline (optional)">
              <TextInput type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>AI analysis</h2>
          <p className="text-sm mb-6" style={{ color: C.inkSoft }}>AI suggests roles and skills from your idea. You can edit everything before publishing — these are suggestions, not final.</p>
          {!aiRan ? (
            <Btn onClick={runAI} disabled={aiLoading}>
              {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Sparkles size={16} /> Analyze with AI</>}
            </Btn>
          ) : (
            <div>
              {aiSource === "fallback" && <Banner tone="warn">AI analysis was unavailable, so these suggestions were generated with a rule-based fallback. The app still works fully — just review carefully.</Banner>}
              <Field label="Project summary"><TextArea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
              <Field label="Problem statement"><TextArea rows={2} value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} /></Field>
              <Field label="Target audience"><TextInput value={f.targetAudience} onChange={(e) => setF({ ...f, targetAudience: e.target.value })} /></Field>
              <Field label="Suggested features"><ListEditor items={f.features} setItems={(v) => setF({ ...f, features: v })} placeholder="Add a feature and press Enter" /></Field>
              <Field label="Suggested skills"><div className="flex flex-wrap gap-1.5">{f.skills.map((s) => <Pill key={s} small>{s}</Pill>)}</div></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Estimated complexity"><Pill tone={f.complexity === "High" ? "danger" : f.complexity === "Medium" ? "warn" : "success"}>{f.complexity}</Pill></Field>
              </div>
              <Field label="Possible risks"><ListEditor items={f.risks} setItems={(v) => setF({ ...f, risks: v })} placeholder="Add a risk" /></Field>
              <Field label="Suggested next steps"><ListEditor items={f.nextSteps} setItems={(v) => setF({ ...f, nextSteps: v })} placeholder="Add a step" /></Field>
              <Btn variant="ghost" size="sm" onClick={runAI}>{aiLoading ? "Re-analyzing…" : "Re-run AI analysis"}</Btn>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>Team requirements</h2>
          <p className="text-sm mb-6" style={{ color: C.inkSoft }}>Add, remove, or edit roles. Mark each as required or optional.</p>
          <RoleEditor roles={f.roles} setRoles={(v) => setF({ ...f, roles: v })} />
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-2xl mb-6" style={{ fontFamily: serif, color: C.ink }}>Preview & publish</h2>
          <Card className="p-5 mb-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: serif, color: C.ink }}>{f.title}</h3>
            <p className="text-sm mb-3" style={{ color: C.inkSoft }}>{f.shortDescription}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Pill small>{f.category}</Pill>
              <Pill small tone="accent">{f.stage}</Pill>
              {f.duration && <Pill small>{f.duration}</Pill>}
              {f.collaborationType && <Pill small>{f.collaborationType}</Pill>}
              {f.projectTypes.map((t) => <Pill key={t} small tone="accent">{t}</Pill>)}
            </div>
            <div className="text-sm mb-3" style={{ color: C.ink }}>
              <span className="font-medium">Languages: </span>
              {f.teamLanguages.join(", ")}{f.requiredLanguage ? ` (${f.requiredLanguage} required)` : ""}
            </div>
            <div className="text-sm mb-3" style={{ color: C.ink }}><span className="font-medium">Problem: </span>{f.problem}</div>
            <div className="text-sm mb-3" style={{ color: C.ink }}><span className="font-medium">Solution: </span>{f.solution}</div>
            <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>Roles needed</div>
            <div className="flex flex-col gap-1">
              {f.roles.map((r) => <div key={r.id} className="text-sm" style={{ color: C.inkSoft }}>{r.roleName} × {r.quantity} {r.required ? "" : "(optional)"} — {r.skills.join(", ")}</div>)}
            </div>
          </Card>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => onPublish(f, "draft")}>Save draft</Btn>
            <Btn onClick={() => onPublish(f, "published")}>Publish project</Btn>
          </div>
        </div>
      )}

      {step < total - 1 && (
        <div className="flex items-center justify-between mt-8">
          <Btn variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</Btn>
          <Btn disabled={!stepValid[step]} onClick={() => setStep((s) => s + 1)}>Next <ChevronRight size={16} /></Btn>
        </div>
      )}
      {step === total - 1 && (
        <div className="mt-6"><Btn variant="ghost" onClick={() => setStep((s) => s - 1)}><ChevronLeft size={16} /> Back</Btn></div>
      )}
    </div>
  );
}

/* ============================== EXPLORE ============================== */
function Explore({ projects, users, currentUser, nav }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [language, setLanguage] = useState("");
  const [collab, setCollab] = useState("");
  const [ptype, setPtype] = useState("");
  const published = projects.filter((p) => p.status === "published");
  const filtered = published.filter((p) => {
    if (category && p.category !== category) return false;
    if (stage && p.stage !== stage) return false;
    if (language && !(p.teamLanguages || []).includes(language)) return false;
    if (collab && p.collaborationType !== collab) return false;
    if (ptype && !(p.projectTypes || []).includes(ptype)) return false;
    if (q && !(`${p.title} ${p.shortDescription} ${p.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h2 className="text-2xl mb-6" style={{ fontFamily: serif, color: C.ink }}>Explore projects</h2>
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkSoft }} />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" style={{ paddingLeft: 32 }} />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={stage} onChange={(e) => setStage(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ maxWidth: 170 }}>
          <option value="">Any language</option>
          {LANGUAGE_OPTIONS.map((l) => <option key={l}>{l}</option>)}
        </Select>
        <Select value={collab} onChange={(e) => setCollab(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Remote / Hybrid / In-person</option>
          {COLLAB_TYPE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={ptype} onChange={(e) => setPtype(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Any project type</option>
          {PROJECT_TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No projects match your filters" subtitle="Try clearing a filter or search term." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              owner={users.find((u) => u.id === p.ownerId)}
              matchScore={currentUser && currentUser.id !== p.ownerId ? calculateMatchScore(currentUser, p).score : undefined}
              onOpen={() => nav("project", { slug: p.slug })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== PROJECT DETAIL ============================== */
function RequestModal({ project, currentUser, onSubmit, onClose }) {
  const slots = openSlots(project).filter((s) => s.filled < s.quantity);
  const [roleId, setRoleId] = useState(slots[0]?.id || "");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  return (
    <Modal title={`Request to join ${project.title}`} onClose={onClose}>
      <Field label="Role">
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          {slots.map((s) => <option key={s.id} value={s.id}>{s.roleName}</option>)}
        </Select>
      </Field>
      <Field label="Message"><TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why are you a good fit for this role?" /></Field>
      <Field label="Portfolio / GitHub (optional)"><TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://github.com/…" /></Field>
      <Btn className="w-full" disabled={!roleId || !message.trim()} onClick={() => onSubmit({ roleId, message, link })}>Send request</Btn>
    </Modal>
  );
}
function ProjectDetail({ project, owner, currentUser, myRequest, onRequest, onCancelRequest, nav, isMember }) {
  const [showModal, setShowModal] = useState(false);
  if (!project) return <EmptyState title="Project not found" />;
  const slots = openSlots(project);
  const isOwner = currentUser && currentUser.id === project.ownerId;
  const match = currentUser && !isOwner ? calculateMatchScore(currentUser, project) : null;
  const tzOverlap = currentUser ? timezoneOverlapHours(currentUser.timezone, project.timezone) : null;
  const canRequest = currentUser && !isOwner && !isMember && !myRequest && slots.some((s) => s.filled < s.quantity) && project.status === "published";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-3xl" style={{ fontFamily: serif, color: C.ink }}>{project.title}</h1>
        {match && <MatchBadge score={match.score} />}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Pill small>{project.category}</Pill>
        <Pill small tone="accent">{project.stage}</Pill>
        {project.collaborationType && <Pill small>{project.collaborationType}</Pill>}
        {(project.projectTypes || []).map((t) => <Pill key={t} small tone="accent">{t}</Pill>)}
        {project.status === "draft" && <Pill small tone="warn">Draft</Pill>}
      </div>
      <p className="text-base mb-6" style={{ color: C.inkSoft }}>{project.shortDescription}</p>

      {match && <MatchBreakdown match={match} />}

      {[
        ["Problem", project.problem],
        ["Solution", project.solution],
        ["Target users", project.targetAudience],
      ].map(([label, val]) => val && (
        <div className="mb-5" key={label}>
          <div className="text-sm font-medium mb-1" style={{ color: C.ink }}>{label}</div>
          <div className="text-sm" style={{ color: C.inkSoft }}>{val}</div>
        </div>
      ))}

      {project.features?.length > 0 && (
        <div className="mb-5">
          <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>Features</div>
          <ul className="text-sm flex flex-col gap-1" style={{ color: C.inkSoft }}>{project.features.map((f, i) => <li key={i}>• {f}</li>)}</ul>
        </div>
      )}

      <div className="mb-5">
        <div className="text-sm font-medium mb-1.5" style={{ color: C.ink }}>Team</div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: C.ink }}>
          <UserAvatar user={owner} size={24} /> {owner?.name} — Owner
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium mb-2" style={{ color: C.ink }}>Roles needed</div>
        <div className="flex flex-col gap-2">
          {slots.map((s) => (
            <Card key={s.id} className="p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: C.ink }}>{s.roleName}</span>
                <span className="text-xs ml-2" style={{ color: C.inkSoft }}>{s.filled}/{s.quantity} filled</span>
                <div className="flex flex-wrap gap-1 mt-1">{s.skills.map((sk) => <Pill key={sk} small>{sk}</Pill>)}</div>
              </div>
              <Pill small tone={s.required ? "accent" : "neutral"}>{s.required ? "Required" : "Optional"}</Pill>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <InfoCard label="Languages">
          <div className="flex flex-wrap gap-1.5">
            {(project.teamLanguages || []).map((l) => (
              <Pill key={l} small tone={l === project.requiredLanguage ? "accent" : "neutral"}>
                {l}{l === project.requiredLanguage ? " — required" : ""}
              </Pill>
            ))}
            {!(project.teamLanguages || []).length && <NoneYet />}
          </div>
        </InfoCard>
        <InfoCard label="Working style">
          <div className="text-sm" style={{ color: C.ink }}>{project.collaborationType || "—"}{project.timezone ? ` · ${project.timezone}` : ""}</div>
          {tzOverlap !== null && (
            <div className="text-xs mt-1" style={{ color: C.inkSoft }}>Timezone overlap: ~{tzOverlap} hours/day</div>
          )}
        </InfoCard>
        <InfoCard label="Timeline">
          <div className="text-sm" style={{ color: C.ink }}>
            {project.startDate ? `Starts ${project.startDate}` : "Start date not set"}
            {project.deadline ? ` · Due ${project.deadline}` : ""}
          </div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>Duration: {project.duration || "—"}</div>
        </InfoCard>
        <InfoCard label="Commitment">
          <div className="text-sm" style={{ color: C.ink }}>{project.commitment || "—"}</div>
        </InfoCard>
      </div>

      <div className="flex gap-3">
        {isOwner && <Btn variant="outline" onClick={() => nav("manage", { slug: project.slug })}>Manage project</Btn>}
        {isMember && <Pill tone="success">You're a member of this project</Pill>}
        {myRequest && myRequest.status === "pending" && (
          <div className="flex items-center gap-2">
            <Pill tone="warn">Request pending</Pill>
            <Btn size="sm" variant="ghost" onClick={onCancelRequest}>Cancel request</Btn>
          </div>
        )}
        {myRequest && myRequest.status === "rejected" && <Pill tone="danger">Request declined</Pill>}
        {canRequest && <Btn onClick={() => (currentUser ? setShowModal(true) : nav("auth", { mode: "login" }))}>Request to join</Btn>}
        {!currentUser && !isOwner && <Btn onClick={() => nav("auth", { mode: "signup" })}>Log in to request to join</Btn>}
      </div>

      {showModal && <RequestModal project={project} currentUser={currentUser} onClose={() => setShowModal(false)} onSubmit={(payload) => { onRequest(payload); setShowModal(false); }} />}
    </div>
  );
}

/* ============================== MANAGE PROJECT ============================== */
function ManageProject({ project, users, requests, onDecision, onStatusChange, nav }) {
  if (!project) return <EmptyState title="Project not found" />;
  const projectRequests = requests.filter((r) => r.projectId === project.id);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => nav("project", { slug: project.slug })} className="text-sm mb-4 inline-flex items-center gap-1" style={{ color: C.inkSoft }}><ChevronLeft size={14} /> Back to project</button>
      <h1 className="text-2xl mb-1" style={{ fontFamily: serif, color: C.ink }}>Manage: {project.title}</h1>
      <div className="flex gap-2 mb-8">
        <Pill tone={project.status === "published" ? "success" : project.status === "draft" ? "warn" : "neutral"}>{project.status}</Pill>
        {project.status !== "archived" && (
          <Btn size="sm" variant="ghost" onClick={() => onStatusChange(project.status === "published" ? "draft" : "published")}>
            {project.status === "published" ? "Unpublish" : "Publish"}
          </Btn>
        )}
        {project.status !== "archived" && <Btn size="sm" variant="ghost" onClick={() => onStatusChange("archived")}>Archive</Btn>}
      </div>

      <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: serif, color: C.ink }}>Collaboration requests</h2>
      {projectRequests.length === 0 ? (
        <EmptyState title="No collaboration requests yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {projectRequests.map((r) => {
            const applicant = users.find((u) => u.id === r.applicantId);
            const role = (project.roles || []).find((rl) => rl.id === r.roleId);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={applicant} size={36} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: C.ink }}>{applicant?.name} <span style={{ color: C.inkSoft, fontWeight: 400 }}>→ {role?.roleName}</span></div>
                      <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{r.message}</p>
                      {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="text-xs" style={{ color: C.accent }}>{r.link}</a>}
                    </div>
                  </div>
                  <Pill small tone={r.status === "pending" ? "warn" : r.status === "accepted" ? "success" : "danger"}>{r.status}</Pill>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Btn size="sm" variant="success" onClick={() => onDecision(r.id, "accepted")}><Check size={14} /> Accept</Btn>
                    <Btn size="sm" variant="danger" onClick={() => onDecision(r.id, "rejected")}><X size={14} /> Reject</Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ currentUser, projects, users, requests, nav }) {
  const myProjects = projects.filter((p) => p.ownerId === currentUser.id);
  const joined = projects.filter((p) => (p.members || []).some((m) => m.userId === currentUser.id && m.status === "accepted"));
  const incoming = requests.filter((r) => myProjects.some((p) => p.id === r.projectId) && r.status === "pending");
  const sent = requests.filter((r) => r.applicantId === currentUser.id);
  const recommended = useMemo(() => {
    return projects
      .filter((p) => p.status === "published" && p.ownerId !== currentUser.id)
      .filter((p) => !(p.members || []).some((m) => m.userId === currentUser.id))
      .filter((p) => !requests.some((r) => r.projectId === p.id && r.applicantId === currentUser.id && r.status !== "rejected" && r.status !== "cancelled"))
      .map((p) => ({ p, m: calculateMatchScore(currentUser, p) }))
      .sort((a, b) => b.m.score - a.m.score)
      .slice(0, 4);
  }, [projects, requests, currentUser.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl mb-8" style={{ fontFamily: serif, color: C.ink }}>Welcome back, {currentUser.name.split(" ")[0]}</h1>

      <Section title="Recommended for you">
        {recommended.length === 0 ? (
          <EmptyState title="Complete your profile to discover better matches" action={<Btn size="sm" onClick={() => nav("profile", { userId: currentUser.id })}>Edit profile</Btn>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map(({ p, m }) => (
              <ProjectCard key={p.id} project={p} owner={users.find((u) => u.id === p.ownerId)} matchScore={m.score} onOpen={() => nav("project", { slug: p.slug })} />
            ))}
          </div>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <Section title="My projects">
          {myProjects.length === 0 ? (
            <EmptyState title="Your next project starts with an idea." action={<Btn size="sm" onClick={() => nav("create")}>Create a project</Btn>} />
          ) : (
            <div className="flex flex-col gap-2">
              {myProjects.map((p) => (
                <Card key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: C.ink }}>{p.title}</div>
                    <Pill small tone={p.status === "published" ? "success" : p.status === "draft" ? "warn" : "neutral"}>{p.status}</Pill>
                  </div>
                  <button className="text-sm" style={{ color: C.accent }} onClick={() => nav("manage", { slug: p.slug })}>Manage</button>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title="Projects I joined">
          {joined.length === 0 ? (
            <EmptyState title="You haven't joined a project yet" subtitle="Explore projects and request to join one that fits." />
          ) : (
            <div className="flex flex-col gap-2">
              {joined.map((p) => (
                <Card key={p.id} className="p-3 flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: C.ink }}>{p.title}</div>
                  <button className="text-sm" style={{ color: C.accent }} onClick={() => nav("project", { slug: p.slug })}>View</button>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title="Incoming requests">
          {incoming.length === 0 ? (
            <EmptyState title="No collaboration requests yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {incoming.map((r) => {
                const p = projects.find((pp) => pp.id === r.projectId);
                const applicant = users.find((u) => u.id === r.applicantId);
                return (
                  <Card key={r.id} className="p-3 flex items-center justify-between">
                    <div className="text-sm" style={{ color: C.ink }}>{applicant?.name} → {p?.title}</div>
                    <button className="text-sm" style={{ color: C.accent }} onClick={() => nav("manage", { slug: p?.slug })}>Review</button>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="My sent requests">
          {sent.length === 0 ? (
            <EmptyState title="You haven't requested to join anything yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {sent.map((r) => {
                const p = projects.find((pp) => pp.id === r.projectId);
                return (
                  <Card key={r.id} className="p-3 flex items-center justify-between">
                    <div className="text-sm" style={{ color: C.ink }}>{p?.title}</div>
                    <Pill small tone={r.status === "pending" ? "warn" : r.status === "accepted" ? "success" : "danger"}>{r.status}</Pill>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: serif, color: C.ink }}>{title}</h2>
      {children}
    </div>
  );
}

/* ============================== APP ROOT ============================== */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [route, setRoute] = useState({ name: "landing", params: {} });
  const [authMode, setAuthMode] = useState("signup");
  const [intent, setIntent] = useState(null);

  const nav = useCallback((name, params = {}) => {
    if (name === "auth" && params.mode) setAuthMode(params.mode);
    if (params.intent) setIntent(params.intent);
    setRoute({ name, params });
    window.scrollTo?.(0, 0);
  }, []);

  useEffect(() => {
    (async () => {
      let u = await loadShared("bt_users");
      let p = await loadShared("bt_projects");
      let r = await loadShared("bt_requests");
      if (u.length === 0 && p.length === 0) {
        const demo = buildDemoData();
        u = demo.users;
        p = demo.projects;
        await saveShared("bt_users", u);
        await saveShared("bt_projects", p);
      }
      setUsers(u);
      setProjects(p);
      setRequests(r);
      const sess = await getSession();
      if (sess?.userId && u.some((usr) => usr.id === sess.userId)) setSessionUserId(sess.userId);
      setLoaded(true);
    })();
  }, []);

  const currentUser = users.find((u) => u.id === sessionUserId) || null;

  const persistUsers = (next) => { setUsers(next); saveShared("bt_users", next); };
  const persistProjects = (next) => { setProjects(next); saveShared("bt_projects", next); };
  const persistRequests = (next) => { setRequests(next); saveShared("bt_requests", next); };

  const handleAuth = async (mode, payload) => {
    if (mode === "signup") {
      const newUser = {
        id: uid(), name: payload.name, email: payload.email, password: payload.password,
        avatar: null, bio: "", location: "", roles: [], skills: [], experienceLevel: "", lookingFor: "",
        interests: [], availability: "", onboardingComplete: false, createdAt: Date.now(),
      };
      persistUsers([...users, newUser]);
      setSessionUserId(newUser.id);
      await setSession(newUser.id);
      nav("onboarding");
    } else {
      setSessionUserId(payload.id);
      await setSession(payload.id);
      nav(payload.onboardingComplete ? "dashboard" : "onboarding");
    }
  };

  const handleLogout = async () => {
    setSessionUserId(null);
    await clearSession();
    nav("landing");
  };

  const handleOnboardingComplete = (fields) => {
    const updated = { ...currentUser, ...fields, onboardingComplete: true };
    persistUsers(users.map((u) => (u.id === currentUser.id ? updated : u)));
    if (intent === "create") { setIntent(null); nav("create"); }
    else nav("dashboard");
  };

  const handleProfileSave = (fields) => {
    persistUsers(users.map((u) => (u.id === currentUser.id ? { ...u, ...fields } : u)));
  };

  const handlePublish = (fields, status) => {
    const existingIdx = projects.findIndex((p) => p.id === fields.id);
    if (existingIdx >= 0) {
      const updated = { ...projects[existingIdx], ...fields, status, updatedAt: Date.now() };
      const next = [...projects];
      next[existingIdx] = updated;
      persistProjects(next);
      nav("project", { slug: updated.slug });
      return;
    }
    const newProject = {
      ...fields, id: uid(), slug: slugify(fields.title), ownerId: currentUser.id, status,
      members: [], createdAt: Date.now(), updatedAt: Date.now(), aiRan: true,
    };
    persistProjects([...projects, newProject]);
    nav("project", { slug: newProject.slug });
  };

  const handleRequest = (project, payload) => {
    const already = requests.some((r) => r.projectId === project.id && r.applicantId === currentUser.id && r.status !== "rejected" && r.status !== "cancelled");
    if (already) return;
    const newReq = { id: uid(), projectId: project.id, applicantId: currentUser.id, roleId: payload.roleId, message: payload.message, link: payload.link, status: "pending", createdAt: Date.now() };
    persistRequests([...requests, newReq]);
  };
  const handleCancelRequest = (reqId) => {
    persistRequests(requests.map((r) => (r.id === reqId ? { ...r, status: "cancelled" } : r)));
  };
  const handleDecision = (reqId, decision) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;
    persistRequests(requests.map((r) => (r.id === reqId ? { ...r, status: decision } : r)));
    if (decision === "accepted") {
      const project = projects.find((p) => p.id === req.projectId);
      const member = { id: uid(), projectId: project.id, userId: req.applicantId, roleId: req.roleId, status: "accepted" };
      persistProjects(projects.map((p) => (p.id === project.id ? { ...p, members: [...(p.members || []), member] } : p)));
    }
  };
  const handleStatusChange = (project, status) => {
    persistProjects(projects.map((p) => (p.id === project.id ? { ...p, status } : p)));
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="animate-spin" style={{ color: C.accent }} />
      </div>
    );
  }

  let body = null;
  if (route.name === "landing") body = <Landing nav={nav} currentUser={currentUser} />;
  else if (route.name === "auth") body = <AuthView mode={authMode} setMode={setAuthMode} users={users} onAuth={handleAuth} nav={nav} />;
  else if (route.name === "onboarding" && currentUser) body = <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />;
  else if (route.name === "explore") body = <Explore projects={projects} users={users} currentUser={currentUser} nav={nav} />;
  else if (route.name === "create" && currentUser) body = <ProjectCreateWizard currentUser={currentUser} onPublish={handlePublish} />;
  else if (route.name === "profile") {
    const user = users.find((u) => u.id === route.params.userId) || currentUser;
    body = (
      <ProfileView
        user={user}
        isOwn={currentUser && user && currentUser.id === user.id}
        projectsOwned={projects.filter((p) => user && p.ownerId === user.id)}
        projectsJoined={projects.filter((p) => user && (p.members || []).some((m) => m.userId === user.id && m.status === "accepted"))}
        onSave={handleProfileSave}
      />
    );
  } else if (route.name === "project") {
    const project = projects.find((p) => p.slug === route.params.slug);
    const owner = project && users.find((u) => u.id === project.ownerId);
    const myRequest = project && currentUser ? requests.find((r) => r.projectId === project.id && r.applicantId === currentUser.id && r.status !== "cancelled") : null;
    const isMember = project && currentUser ? (project.members || []).some((m) => m.userId === currentUser.id && m.status === "accepted") : false;
    body = (
      <ProjectDetail
        project={project} owner={owner} currentUser={currentUser} myRequest={myRequest} isMember={isMember}
        onRequest={(payload) => handleRequest(project, payload)}
        onCancelRequest={() => handleCancelRequest(myRequest.id)}
        nav={nav}
      />
    );
  } else if (route.name === "manage" && currentUser) {
    const project = projects.find((p) => p.slug === route.params.slug);
    if (!project || project.ownerId !== currentUser.id) body = <EmptyState title="You don't have access to manage this project" />;
    else body = <ManageProject project={project} users={users} requests={requests} onDecision={handleDecision} onStatusChange={(s) => handleStatusChange(project, s)} nav={nav} />;
  } else if (route.name === "dashboard" && currentUser) {
    body = <Dashboard currentUser={currentUser} projects={projects} users={users} requests={requests} nav={nav} />;
  } else {
    body = <Landing nav={nav} currentUser={currentUser} />;
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>
      <Navbar currentUser={currentUser} nav={nav} onLogout={handleLogout} route={route} />
      {body}
    </div>
  );
}
