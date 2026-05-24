#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const JSON_PATH = path.join(REPORT_DIR, "clinton-library-visit-plan.json");
const MD_PATH = path.join(REPORT_DIR, "clinton-library-visit-plan.md");
const TEXT_DIR = process.env.FINDING_AID_TEXT_DIR || path.join("/private/tmp", "balkans-finding-aids");

const FINDING_AIDS = [
  {
    part: "Part 1",
    pdfPath:
      "/Users/jameswilson/Library/Mobile Documents/com~apple~CloudDocs/2013-0185-M_Part1.pdf"
  },
  {
    part: "Part 2",
    pdfPath:
      "/Users/jameswilson/Library/Mobile Documents/com~apple~CloudDocs/2013-0185-M_Part2.pdf"
  },
  {
    part: "Part 3",
    pdfPath:
      "/Users/jameswilson/Library/Mobile Documents/com~apple~CloudDocs/2013-0185-M_Part3.pdf"
  },
  {
    part: "Part 4",
    pdfPath:
      "/Users/jameswilson/Library/Mobile Documents/com~apple~CloudDocs/2013-0185-M_Part4.pdf"
  }
];

const BALKANS_RE =
  /\b(bosnia(?:n|[- ]hercegovina|[- ]herzegovina)?|balkans?|former yugoslavia|yugoslav(?:ia|s)?|croatia(?:n)?|serbia(?:n)?|montenegro|macedonia|kosovo|gora[zž]de|bihac|biha[cć]|srebrenica|[zž]epa|sarajevo|dayton|ifor|unprofor|uncro|krajina|slavonia|milosevic|milo[sš]evi[cć]|izetbegovic|tudjman|holbrooke|contact group|war crimes|icty|safe areas?|arms embargo|vance[ -]?owen|rapid reaction|operation deliberate force|operation joint endeavor|peace agreement|bosnia calls|serbia\/croatia war|eastern slavonia)\b/i;

const MONTHS = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12"
};

function pdfPages(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : 0;
}

function textPathFor(aid) {
  return path.join(TEXT_DIR, `${path.basename(aid.pdfPath, ".pdf")}.txt`);
}

function extractText(aid) {
  fs.mkdirSync(TEXT_DIR, { recursive: true });
  const outputPath = textPathFor(aid);
  execFileSync("pdftotext", ["-layout", aid.pdfPath, outputPath], { stdio: "ignore" });
  return outputPath;
}

function normalizeSpaces(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function cleanStaffOrOffice(value = "") {
  return normalizeSpaces(value)
    .replace(/^StaffDirector-/i, "Staff Director-")
    .replace(/^Staff Director-Soderber[ag]\.?[,]? Nanc$/i, "Staff Director-Soderberg, Nancy")
    .replace(/^\{?Office of the National Security Advisor-/i, "Office of the National Security Advisor-");
}

function slug(value = "") {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseRow(rawLine) {
  const line = rawLine.replace(/\f/g, "").replace(/[|]+/g, " ").replace(/\s+$/g, "");
  const match = line.match(/^\s*(\d{3,5}[A-Z]?)\s{2,}(.+)$/);
  if (!match) return null;

  const chunks = match[2].trim().split(/\s{2,}/).map(normalizeSpaces).filter(Boolean);
  if (!chunks.length) return null;

  return {
    oaBox: match[1],
    folderTitle: chunks.length > 1 ? chunks.slice(0, -1).join(" ") : chunks[0],
    staffOrOffice: chunks.length > 1 ? cleanStaffOrOffice(chunks[chunks.length - 1]) : ""
  };
}

function yearsIn(value = "") {
  return [...new Set((value.match(/\b(19|20)\d{2}\b/g) || []).map(Number))].sort((a, b) => a - b);
}

function dateGuess(value = "") {
  const fullDate = value.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+((?:19|20)\d{2})\b/i
  );
  if (fullDate) {
    const month = MONTHS[fullDate[1].toLowerCase()];
    return `${fullDate[3]}-${month}-${String(Number(fullDate[2])).padStart(2, "0")}`;
  }

  const monthYear = value.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+((?:19|20)\d{2})\b/i
  );
  if (monthYear) return `${monthYear[2]}-${MONTHS[monthYear[1].toLowerCase()]}`;

  const years = yearsIn(value);
  return years.length ? String(years[0]) : "";
}

function chronologyScope(value = "") {
  const years = yearsIn(value);
  if (!years.length) return "Undated";
  if (years.some((year) => year >= 1993 && year <= 1995)) return "In-period";
  if (years.every((year) => year > 1995)) return "Follow-on";
  return "Reference";
}

function targetScore(row) {
  const text = `${row.folderTitle} ${row.staffOrOffice}`;
  let score = 0;

  if (BALKANS_RE.test(text)) score += 45;
  if (/\b(Bosnia|Former Yugoslavia|Yugoslav|Dayton|Srebrenica)\b/i.test(text)) score += 20;
  if (/Soderber.?g Notes.*Bosnia.*\b(?:PC|DC)\b/i.test(text)) score += 70;
  if (/\b(Memcons?|Telcons?|Foreign Leader Calls|Izetbegovic|Tudjman|Milosevic|Holbrooke|Frasure|Lake|Berger|Soderberg|POTUS)\b/i.test(text)) {
    score += 25;
  }
  if (/\b(PC\/DC|PC Meeting|DC Meeting|PDD|PRD|NAC|London Meetings|Peace Agreement|IFOR|UNPROFOR|War Crimes|ICTY|Counterterrorism|Withdrawal|No[- ]?Fly|air ?strikes?|Airdrops|lift and strike|Ultimatum|Contact Group)\b/i.test(text)) {
    score += 20;
  }
  if (/\b199[345]\b|\b(1993-1994|1994-1995|May-December 1994|June 1993|July 1995)\b/i.test(text)) {
    score += 15;
  }
  if (/Office of the National Security Advisor|Staff Director|Records Management|Multilateral & Humanitarian|Southeast European Affairs|Transnational Threats|Speechwriting/i.test(row.staffOrOffice)) {
    score += 10;
  }
  if (/\b(1996|1997|1998|1999|2000)\b/.test(text) && !/\b199[345]\b/.test(text)) score -= 35;
  if (/Speechwriting|Press|Statements|Radio Address|Fact Sheets|Q & A|Newsclips|Newsweek|Op-Ed/i.test(text)) score -= 12;

  return score;
}

function priorityFor(score, scope) {
  if (scope === "Follow-on") return "Follow-on";
  if (score >= 100) return "Critical";
  if (score >= 70) return "High";
  if (score >= 55) return "Medium";
  return "Background";
}

function categoryFor(row) {
  const text = `${row.folderTitle} ${row.staffOrOffice}`;
  if (/Soderber.?g Notes.*Bosnia.*\b(?:PC|DC)\b|PC\/DC|PC Meeting|DC Meeting/i.test(text)) {
    return "PC/DC decision process";
  }
  if (/Memcons?|Telcons?|Foreign Leader Calls|POTUS|Izetbegovic|Tudjman|Milosevic|Mitterrand|Kohl|Yeltsin/i.test(text)) {
    return "Presidential diplomacy";
  }
  if (/Lake|Berger|Holbrooke|Frasure|PDD|PRD|NAC|Former Yugoslavia/i.test(text)) {
    return "NSC policy files";
  }
  if (/Srebrenica|War Crimes|ICTY|Genocide|Humanitarian|Repatriation|Airlift|Refugee/i.test(text)) {
    return "Humanitarian and war-crimes files";
  }
  if (/IFOR|UNPROFOR|Air|No[- ]?Fly|Withdrawal|Joint Endeavor|Deliberate Force|NATO/i.test(text)) {
    return "Military and implementation files";
  }
  if (/Speechwriting|Statement|Press|Q & A|Newsclips/i.test(text)) return "Public messaging files";
  return "Regional subject files";
}

function reasonFor(row) {
  const text = `${row.folderTitle} ${row.staffOrOffice}`;
  const reasons = [];

  if (/Soderber.?g Notes.*Bosnia.*\b(?:PC|DC)\b/i.test(text)) {
    reasons.push("Parallel staff notes for Bosnia Principals/Deputies Committee meetings; compare against Records Management PC/DC files already surfaced in the chronology.");
  }
  if (/Records Management/i.test(row.staffOrOffice) && /\b(?:PC|DC)\d+|PC Meeting|DC Meeting/i.test(row.folderTitle)) {
    reasons.push("Records Management control-copy lead for a dated PC/DC meeting; useful for confirming meeting sequence, document numbering, and duplicate status.");
  }
  if (/Memcons?|Telcons?|Foreign Leader Calls|POTUS/i.test(text)) {
    reasons.push("Presidential conversation folder lead; verify against the digitized memcon/telcon collection and existing page-count inventory.");
  }
  if (/Lake|Berger|Holbrooke|Frasure|Soderberg/i.test(text)) {
    reasons.push("Senior NSC policy-file lead likely to carry briefing, options, or decision context around the same events.");
  }
  if (/Srebrenica|War Crimes|ICTY|Humanitarian|Repatriation|Airlift/i.test(text)) {
    reasons.push("Humanitarian, atrocity, and accountability context needed to test whether the chronology underweights these tracks.");
  }
  if (/IFOR|UNPROFOR|NATO|No[- ]?Fly|Air|Withdrawal|Joint Endeavor|Deliberate Force/i.test(text)) {
    reasons.push("Military implementation and alliance-management context for air power, peacekeeping, withdrawal, and Dayton implementation decisions.");
  }
  if (!reasons.length) reasons.push("Balkans-related folder title in the 2013-0185-M finding aid; pull if adjacent priority folders do not answer the research question.");

  return reasons.join(" ");
}

function onsiteActionFor(row, priority) {
  const text = `${row.folderTitle} ${row.staffOrOffice}`;
  if (/Soderber.?g Notes.*Bosnia.*\b(?:PC|DC)\b|Index to Soderberg Notes/i.test(text)) {
    return "Pull first. Photograph the folder title, withdrawal/redaction sheets, index, all dated notes, and any routing/annotation pages.";
  }
  if (/Records Management/i.test(row.staffOrOffice) && /\b(?:PC|DC)\d+|PC Meeting|DC Meeting/i.test(row.folderTitle)) {
    return "Use as the control run for PC/DC chronology; compare dates and document numbers to extracted PC/DC summaries.";
  }
  if (/Memcons?|Telcons?|Foreign Leader Calls|POTUS/i.test(text)) {
    return "Check for undigitized presidential conversations, duplicate releases, and source-note metadata before requesting scans.";
  }
  if (priority === "Follow-on") {
    return "Defer unless it resolves provenance, implementation, or duplicate questions after the in-period pulls.";
  }
  return "Request the folder, confirm whether it contains declassified document-level records, and capture folder-level provenance before triage.";
}

function sourceNoteLead(target) {
  return `Source: William J. Clinton Presidential Library, Clinton Presidential Records, National Security Council, 2013-0185-M, ${target.staffOrOffice || "folder list"}, OA/ID ${target.oaBox}, folder "${target.folderTitle}," finding aid ${target.findingAidPart}, p. ${target.findingAidPage}. Pull onsite to verify exact folder title, box/OA label, withdrawal sheets, restriction/declassification markers, attachments, annotations, and document-level dates before final FRUS source-note treatment.`;
}

function parseFindingAid(aid) {
  const pageCount = pdfPages(aid.pdfPath);
  const txtPath = extractText(aid);
  const text = fs.readFileSync(txtPath, "utf8");
  const pages = text.split("\f");
  const rows = [];
  let rawBalkansLineHits = 0;
  let globalLine = 0;
  let pendingContinuation = "";

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const lines = pages[pageIndex].split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      globalLine += 1;
      const rawLine = lines[lineIndex];
      if (BALKANS_RE.test(rawLine)) rawBalkansLineHits += 1;

      const parsed = parseRow(rawLine);
      if (!parsed) {
        const continuation = normalizeSpaces(rawLine.replace(/\f/g, ""));
        if (continuation && BALKANS_RE.test(continuation)) pendingContinuation = continuation;
        continue;
      }

      if (pendingContinuation && /^((19|20)\d{2}\]?)|\[?\d/.test(parsed.folderTitle)) {
        parsed.folderTitle = normalizeSpaces(`${pendingContinuation} ${parsed.folderTitle}`);
      }
      pendingContinuation = "";

      const score = targetScore(parsed);
      if (score < 35) continue;

      const textValue = `${parsed.folderTitle} ${parsed.staffOrOffice}`;
      const scope = chronologyScope(textValue);
      const priority = priorityFor(score, scope);
      const target = {
        id: `${aid.part.toLowerCase().replace(/\s+/g, "-")}-${globalLine}-${slug(`${parsed.oaBox}-${parsed.folderTitle}`)}`,
        findingAidPart: aid.part,
        findingAidPdf: path.basename(aid.pdfPath),
        findingAidPage: pageIndex + 1,
        findingAidLine: globalLine,
        oaBox: parsed.oaBox,
        folderTitle: parsed.folderTitle,
        staffOrOffice: parsed.staffOrOffice,
        priority,
        chronologyScope: scope,
        score,
        category: categoryFor(parsed),
        dateGuess: dateGuess(textValue),
        years: yearsIn(textValue),
        reason: reasonFor(parsed),
        onsiteAction: onsiteActionFor(parsed, priority)
      };
      target.sourceNoteLead = sourceNoteLead(target);
      rows.push(target);
    }
  }

  return {
    part: aid.part,
    pdfPath: aid.pdfPath,
    textPath: txtPath,
    pageCount,
    rawBalkansLineHits,
    parsedTargets: rows.length,
    targets: rows
  };
}

function countBy(items, keyFor) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFor(item) || "Unsorted";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function sortTargets(a, b) {
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, "Follow-on": 3, Background: 4 };
  const scopeOrder = { "In-period": 0, Undated: 1, Reference: 2, "Follow-on": 3 };
  return (
    (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
    (scopeOrder[a.chronologyScope] ?? 9) - (scopeOrder[b.chronologyScope] ?? 9) ||
    b.score - a.score ||
    (a.dateGuess || "9999").localeCompare(b.dateGuess || "9999") ||
    String(a.oaBox).localeCompare(String(b.oaBox)) ||
    a.folderTitle.localeCompare(b.folderTitle)
  );
}

function priorityCounts(targets) {
  const counts = countBy(targets, (target) => target.priority);
  return {
    critical: counts.Critical || 0,
    high: counts.High || 0,
    medium: counts.Medium || 0,
    followOn: counts["Follow-on"] || 0,
    background: counts.Background || 0
  };
}

function callSlipBatches(targets) {
  const groups = new Map();
  for (const target of targets) {
    if (!["Critical", "High", "Medium"].includes(target.priority)) continue;
    const key = String(target.oaBox);
    const group = groups.get(key) || {
      id: `oa-${slug(`${target.oaBox}-${target.staffOrOffice}`)}`,
      oaBox: target.oaBox,
      staffOrOffice: target.staffOrOffice,
      targetCount: 0,
      priorities: { Critical: 0, High: 0, Medium: 0 },
      categories: {},
      sampleFolders: [],
      highestPriority: target.priority,
      firstFindingAidPart: target.findingAidPart,
      firstFindingAidPage: target.findingAidPage
    };
    if (!group.staffOrOffice && target.staffOrOffice) group.staffOrOffice = target.staffOrOffice;
    group.targetCount += 1;
    group.priorities[target.priority] += 1;
    group.categories[target.category] = (group.categories[target.category] || 0) + 1;
    if (group.sampleFolders.length < 6) group.sampleFolders.push(target.folderTitle);
    if (sortTargets(target, { ...target, priority: group.highestPriority, score: target.score }) < 0) {
      group.highestPriority = target.priority;
    }
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2 };
      return (
        (priorityOrder[a.highestPriority] ?? 9) - (priorityOrder[b.highestPriority] ?? 9) ||
        b.priorities.Critical - a.priorities.Critical ||
        b.targetCount - a.targetCount ||
        String(a.oaBox).localeCompare(String(b.oaBox))
      );
    })
    .map((group, index) => ({ ...group, rank: index + 1 }));
}

function makeVisitPlan(targets, batches) {
  const byOa = new Map();
  for (const batch of batches) {
    byOa.set(String(batch.oaBox), (byOa.get(String(batch.oaBox)) || 0) + batch.targetCount);
  }
  const count = (oaBox) => byOa.get(String(oaBox)) || 0;

  return [
    {
      rank: 1,
      timeBlock: "First 90 minutes",
      objective: "Lock down the parallel PC/DC decision chronology.",
      callSlips: ["1394"],
      targetCount: count("1394"),
      action:
        "Pull the Soderberg Bosnia PC/DC notes and index first, then capture folder titles, withdrawal sheets, the index, dated notes, and any annotations."
    },
    {
      rank: 2,
      timeBlock: "Next pull set",
      objective: "Compare PC/DC control copies against Soderberg notes.",
      callSlips: ["3994", "4005", "4006", "4007", "4008", "4009"],
      targetCount: ["3994", "4005", "4006", "4007", "4008", "4009"].reduce((sum, oa) => sum + count(oa), 0),
      action:
        "Use Records Management PC/DC folders to confirm document numbers, dates, duplicate status, and missing meeting summaries."
    },
    {
      rank: 3,
      timeBlock: "Senior NSC files",
      objective: "Fill Lake/Berger/Holbrooke policy and presidential-diplomacy gaps.",
      callSlips: ["1459", "1464", "1465", "1466", "1480", "1493"],
      targetCount: ["1459", "1464", "1465", "1466", "1480", "1493"].reduce((sum, oa) => sum + count(oa), 0),
      action:
        "Prioritize Bosnia, Holbrooke, Tudjman, POTUS correspondence, and sensitive Bosnia files before broad regional files."
    },
    {
      rank: 4,
      timeBlock: "Soderberg subject files",
      objective: "Capture options, allied diplomacy, foreign leader calls, and 1995 endgame folders.",
      callSlips: ["1402", "1404", "1416", "1419"],
      targetCount: ["1402", "1404", "1416", "1419"].reduce((sum, oa) => sum + count(oa), 0),
      action:
        "Pull Bosnia 1993/1995, Former Yugoslavia, foreign leader calls, London meetings, NAC, ultimatum, and Bosnia Calls folders."
    },
    {
      rank: 5,
      timeBlock: "Humanitarian and accountability files",
      objective: "Test Srebrenica, war-crimes, airlift, refugee, and humanitarian-policy gaps.",
      callSlips: ["1571", "2553", "3137", "3215", "3216", "3476"],
      targetCount: ["1571", "2553", "3137", "3215", "3216", "3476"].reduce((sum, oa) => sum + count(oa), 0),
      action:
        "Pull Schwartz and related Multilateral/Humanitarian files after the decision-process run is under control."
    },
    {
      rank: 6,
      timeBlock: "Implementation and source-family checks",
      objective: "Use regional, transnational-threats, and follow-on files only where they resolve an open gap.",
      callSlips: ["1751", "1753", "2249", "2989", "3543", "3544", "3549", "3784"],
      targetCount: ["1751", "1753", "2249", "2989", "3543", "3544", "3549", "3784"].reduce((sum, oa) => sum + count(oa), 0),
      action:
        "Hold these until the core in-period pulls are photographed; use them for military implementation, counterterrorism, Kosovo/Macedonia context, and duplicate checks."
    }
  ];
}

function markdown(report) {
  const lines = [
    "# Clinton Library Onsite Visit Plan",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    report.mission,
    "",
    "## Summary",
    "",
    `- Finding aids processed: ${report.summary.findingAidCount}.`,
    `- Finding-aid pages counted: ${report.summary.findingAidPages}.`,
    `- Raw Balkans line hits: ${report.summary.rawBalkansLineHits}.`,
    `- Priority pull targets: ${report.summary.priorityPullTargets} (${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium).`,
    `- Follow-on/deferred targets: ${report.summary.followOn}.`,
    "",
    "## First-Day Sequence",
    ""
  ];

  for (const item of report.visitPlan) {
    lines.push(`### ${item.rank}. ${item.timeBlock}`);
    lines.push("");
    lines.push(`Objective: ${item.objective}`);
    lines.push(`Call slips: ${item.callSlips.join(", ")} (${item.targetCount} targets).`);
    lines.push(item.action, "");
  }

  lines.push("## Top Call-Slip Batches", "");
  for (const batch of report.callSlipBatches.slice(0, 25)) {
    lines.push(
      `- ${batch.rank}. OA/ID ${batch.oaBox}, ${batch.staffOrOffice || "folder list"}: ${batch.targetCount} targets; ${batch.priorities.Critical} critical, ${batch.priorities.High} high, ${batch.priorities.Medium} medium.`
    );
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const parsedAids = FINDING_AIDS.map(parseFindingAid);
  const allTargets = parsedAids.flatMap((aid) => aid.targets).sort(sortTargets);
  const counts = priorityCounts(allTargets);
  const pullTargets = allTargets.filter((target) => ["Critical", "High", "Medium"].includes(target.priority));
  const followOnTargets = allTargets.filter((target) => target.priority === "Follow-on").sort(sortTargets);
  const batches = callSlipBatches(allTargets);

  const report = {
    generatedAt: new Date().toISOString(),
    collection:
      "William J. Clinton Presidential Library, Clinton Presidential Records, National Security Council, 2013-0185-M",
    mission:
      "This is an onsite research tool for maximizing Clinton Library time. It identifies folder-level leads from the 2013-0185-M finding aids; it is not a recommendation about document inclusion or the structure of FRUS Volume XV.",
    sourceNoteStandard:
      "Each target keeps repository/custody, collection/control number, OA/ID locator, finding-aid part and page, then folder-level metadata to verify onsite before document-level FRUS source-note treatment.",
    findingAids: parsedAids.map((aid) => ({
      part: aid.part,
      pdfPath: aid.pdfPath,
      pdfFile: path.basename(aid.pdfPath),
      textPath: aid.textPath,
      pageCount: aid.pageCount,
      rawBalkansLineHits: aid.rawBalkansLineHits,
      parsedTargets: aid.parsedTargets
    })),
    summary: {
      findingAidCount: parsedAids.length,
      findingAidPages: parsedAids.reduce((sum, aid) => sum + aid.pageCount, 0),
      rawBalkansLineHits: parsedAids.reduce((sum, aid) => sum + aid.rawBalkansLineHits, 0),
      scoredTargets: allTargets.length,
      priorityPullTargets: pullTargets.length,
      critical: counts.critical,
      high: counts.high,
      medium: counts.medium,
      followOn: counts.followOn,
      background: counts.background,
      soderbergPcDcTargets: pullTargets.filter((target) => /Soderber.?g Notes.*Bosnia.*\b(?:PC|DC)\b/i.test(target.folderTitle)).length,
      recordsManagementPcDcTargets: pullTargets.filter(
        (target) => /Records Management/i.test(target.staffOrOffice) && /\b(?:PC|DC)\d+|PC Meeting|DC Meeting/i.test(target.folderTitle)
      ).length,
      presidentialConversationFolderTargets: pullTargets.filter((target) => /Memcons?|Telcons?|Foreign Leader Calls|POTUS/i.test(`${target.folderTitle} ${target.staffOrOffice}`)).length,
      callSlipBatches: batches.length
    },
    countsByPriority: countBy(allTargets, (target) => target.priority),
    countsByCategory: countBy(pullTargets, (target) => target.category),
    countsByPart: countBy(pullTargets, (target) => target.findingAidPart),
    visitPlan: makeVisitPlan(allTargets, batches),
    callSlipBatches: batches,
    pullTargets,
    followOnTargets
  };

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MD_PATH, markdown(report));
  console.log(
    `Wrote ${path.relative(ROOT, JSON_PATH)} and ${path.relative(ROOT, MD_PATH)} (${report.summary.priorityPullTargets} priority pull targets, ${report.summary.findingAidPages} finding-aid pages).`
  );
}

main();
