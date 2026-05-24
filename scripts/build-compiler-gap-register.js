#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const JSON_PATH = path.join(REPORT_DIR, "compiler-gap-register.json");
const MD_PATH = path.join(REPORT_DIR, "compiler-gap-register.md");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function countBy(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item) || "Unknown";
    const value = counts.get(key) || { count: 0, pages: 0 };
    value.count += 1;
    value.pages += item.pageCount || 0;
    counts.set(key, value);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function textOf(item) {
  return [
    item.title,
    item.counterpart,
    item.compilerUse,
    item.snippet,
    item.sourceNote,
    item.sourceNoteDraft,
    item.sourceSeries,
    item.sourceFamily,
    item.caseNumber,
    item.messageNumber,
    ...(item.subjects || []),
    ...(item.tags || []),
    ...(item.matchedQueries || [])
  ]
    .filter(Boolean)
    .join(" ");
}

function countMatches(items, regex) {
  return items.filter((item) => regex.test(textOf(item))).length;
}

function makeGap({
  id,
  severity,
  status,
  area,
  title,
  risk,
  mitigation,
  evidence,
  nextActions,
  sourcePools,
  candidateLeadIds
}) {
  return {
    id,
    severity,
    status,
    area,
    title,
    risk,
    mitigation,
    evidence,
    nextActions,
    sourcePools,
    candidateLeadIds
  };
}

function markdown(report) {
  const lines = [
    "# Balkans 1993-1995 Compiler Gap Register",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- ${report.summary.gaps} compiler-risk gaps tracked.`,
    `- ${report.summary.mitigated} mitigated by a new reproducible source layer or queue.`,
    `- ${report.summary.open} still open after this pass.`,
    `- ${report.summary.candidateLeads} candidate leads now sit outside the chronology for compiler review.`,
    ""
  ];
  for (const gap of report.gaps) {
    lines.push(`## ${gap.severity}: ${gap.title}`, "");
    lines.push(`Status: ${gap.status}`);
    lines.push(`Area: ${gap.area}`, "");
    lines.push(gap.risk, "");
    lines.push(`Mitigation: ${gap.mitigation}`, "");
    lines.push("Evidence:");
    for (const item of gap.evidence) lines.push(`- ${item}`);
    lines.push("", "Next actions:");
    for (const item of gap.nextActions) lines.push(`- ${item}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const data = readJson("data/compiler-map.json");
  const research = readJson("reports/research-collection-search.json");
  const sourceCrosscheck = readJson("reports/source-crosscheck-potential-documents.json");
  const stateFoia = readJson("reports/state-foia-balkans-search.json");
  const publicPapers = readJson("reports/public-papers-balkans-search.json");
  const talbott = readJson("reports/strobe-talbott-manifest-search.json");
  const documents = data.documents || [];
  const archivalDocs = documents.filter((record) => record.documentScope !== "Public statement");
  const conversations = documents.filter((record) => ["Memcon", "Telcon"].includes(record.kind));
  const researchTargets = research.rankedTargets || [];
  const unselectedTargets = researchTargets.filter((target) => !(target.selectedFileIds || []).length);
  const unselectedWithPdfHits = unselectedTargets.filter((target) => target.pdfHitCount);
  const stateDocs = stateFoia.stateFoiaDocuments || [];
  const crossDocs = sourceCrosscheck.potentialDocuments || [];
  const researchFiles = research.digitizedFiles || [];
  const candidateLeadCount = researchFiles.length + crossDocs.length + stateDocs.length;

  const extractionQueue = [
    ...unselectedWithPdfHits.slice(0, 20).map((target) => ({
      id: `research-target-${target.rank}`,
      sourceFamily: "Clinton Digital Library research plan",
      priority: target.rank <= 50 ? "High" : "Medium",
      title: target.folderTitle,
      reason: `${target.pdfHitCount} PDF search hits but no selected in-period declassified file yet.`,
      nextAction: "Open the target PDFs, separate document boundaries, and promote dated declassified records into candidate-document review."
    })),
    ...stateDocs.slice(0, 30).map((record) => ({
      id: record.id,
      sourceFamily: "State FOIA Virtual Reading Room",
      priority: "High",
      title: record.title,
      date: record.sortDate,
      pageCount: record.pageCount,
      url: record.pdfUrl,
      reason: `${record.from || "State"} to ${record.to || "recipient"}; ${record.identifier}; score ${record.score}.`,
      nextAction: "Verify cable metadata, drafting/clearance, attachments, distribution, and excisions; then decide whether to promote to chronology."
    })),
    ...crossDocs.slice(0, 20).map((record) => ({
      id: record.id,
      sourceFamily: record.sourceFamilyLabel,
      priority: "High",
      title: record.title,
      date: record.sortDate,
      pageCount: record.pageCount,
      url: record.pdfUrl,
      reason: `${record.identifier}; ${record.sourceSeries}.`,
      nextAction: "Check whether this is a duplicate release, folder-level packet, or standalone document; then extract document boundaries if needed."
    }))
  ];

  const sourcePools = [
    {
      id: "state-foia",
      label: "Department of State FOIA Virtual Reading Room",
      url: "https://foia.state.gov/",
      status: "Mitigated by candidate layer",
      currentLeads: stateFoia.summary.selectedCandidateDocuments,
      countedPages: stateFoia.summary.countedPages,
      remainingRisk: "Search totals remain larger than the selected layer; central files and bureau file paths still require archival verification."
    },
    {
      id: "clinton-research-pdfs",
      label: "Clinton Digital Library research-plan PDFs",
      url: "https://clinton.presidentiallibraries.us/",
      status: "Mitigated by ranked target queue",
      currentLeads: research.summary.uniqueDigitizedFiles,
      countedPages: research.summary.countedPages,
      remainingRisk: `${unselectedWithPdfHits.length} ranked targets have PDF hits but no selected in-period file yet.`
    },
    {
      id: "nara-crosscheck",
      label: "NARA Catalog collection 7388808 and NARA Scout Europe scopes",
      url: "https://catalog.archives.gov/",
      status: "Mitigated by candidate layer",
      currentLeads: sourceCrosscheck.summary.addedPotentialDocuments,
      countedPages: sourceCrosscheck.summary.countedPages,
      remainingRisk: "Candidate leads need duplicate review and document-boundary extraction before promotion."
    },
    {
      id: "cia-btf",
      label: "CIA / Balkan Task Force and Clinton Library BTF collection",
      url: "https://clinton.presidentiallibraries.us/collections/show/37",
      status: "Open",
      currentLeads: countMatches(researchFiles, /Balkan Task Force|BTF|CIA|intelligence/i),
      countedPages: researchFiles
        .filter((item) => /Balkan Task Force|BTF|CIA|intelligence/i.test(textOf(item)))
        .reduce((sum, item) => sum + (item.pageCount || 0), 0),
      remainingRisk: "Intelligence products are still folder-level leads and need document-level extraction."
    },
    {
      id: "defense-jcs",
      label: "Defense, JCS, OSD, IFOR, air-power, and contingency planning",
      url: "https://catalog.archives.gov/",
      status: "Open",
      currentLeads: countMatches([...researchFiles, ...crossDocs, ...stateDocs], /JCS|Joint Chiefs|OSD|Defense|IFOR|air strike|no-fly|withdrawal|Oplan|military/i),
      countedPages: 0,
      remainingRisk: "Military implementation is present as scattered State/NARA leads, not as a verified Defense/JCS source base."
    }
  ];

  const gaps = [
    makeGap({
      id: "state-department-source-base",
      severity: "Critical",
      status: "Mitigated",
      area: "State Department",
      title: "State Department cable and memorandum base was thin",
      risk:
        "A FRUS volume cannot rely mainly on presidential records and public statements. State cables and memoranda are required to reconstruct diplomacy, instructions, reporting, and bureau-level decision traffic.",
      mitigation:
        "Added a reproducible State FOIA Virtual Reading Room sweep and candidate layer.",
      evidence: [
        `The chronology itself has ${documents.filter((record) => /Department of State/.test(record.repository || "")).length} State FOIA chronology records.`,
        `The new State FOIA sweep queried ${stateFoia.summary.queryPacks} packs, fetched ${stateFoia.summary.fetchedRows} rows from ${stateFoia.summary.totalHitsAcrossQueries} total API hits, and selected ${stateFoia.summary.selectedCandidateDocuments} candidate documents.`,
        `State FOIA candidates add ${stateFoia.summary.countedPages} counted PDF pages for review.`
      ],
      nextActions: [
        "Review the State FOIA candidates in date order and promote standalone, in-scope cables/memoranda into the chronology after source-note verification.",
        "Run narrower follow-up searches by office/from-to line: BELGRADE, ZAGREB, SARAJEVO, USNATO, USUN, MOSCOW, EUR, S/S, S/P, and IO.",
        "Separate State public-affairs products from operational cables and memoranda."
      ],
      sourcePools: ["state-foia"],
      candidateLeadIds: stateDocs.slice(0, 25).map((item) => item.id)
    }),
    makeGap({
      id: "folder-pdf-document-boundaries",
      severity: "Critical",
      status: "Mitigated",
      area: "Document Extraction",
      title: "Large research PDFs need document-level extraction",
      risk:
        "The research section contains thousands of pages of public PDFs. Until document boundaries are extracted, the compiler cannot rely on the site as a document-level chronology.",
      mitigation:
        "Added a generated extraction queue that prioritizes ranked targets with PDF hits but no selected file.",
      evidence: [
        `${research.summary.uniqueDigitizedFiles} Clinton Digital Library research leads total ${research.summary.countedPages} counted pages.`,
        `${unselectedTargets.length} ranked research targets still have no selected file; ${unselectedWithPdfHits.length} of them have PDF hits that need human review.`,
        `The extraction queue now starts with ${extractionQueue.filter((item) => item.sourceFamily === "Clinton Digital Library research plan").length} high-priority research targets.`
      ],
      nextActions: [
        "Extract POTUS Memos, POTUS Letters, Peace Plans, Rapid Reaction Force, PCDC, UNCRO, U.N. general, Pol Mil Plan, and Intelligence Sharing files first.",
        "For each large packet, retain the first page as the annotation sheet and record exact source page spans.",
        "Only promote extracted records after duplicate review against existing PC/DC and MDR packets."
      ],
      sourcePools: ["clinton-research-pdfs"],
      candidateLeadIds: extractionQueue.filter((item) => item.sourceFamily === "Clinton Digital Library research plan").map((item) => item.id)
    }),
    makeGap({
      id: "nara-potential-duplicates",
      severity: "High",
      status: "Mitigated",
      area: "NARA Catalog",
      title: "NARA source-family leads need duplicate and boundary review",
      risk:
        "NARA Catalog file units may be duplicate releases, folder packets, or standalone documents. Treating them as final chronology records without review would inflate the corpus.",
      mitigation:
        "Kept NARA source-family records in the research lead layer and added a review queue.",
      evidence: [
        `${sourceCrosscheck.summary.inputCandidates} NARA Catalog/NARA Scout candidates were checked.`,
        `${sourceCrosscheck.summary.addedPotentialDocuments} non-duplicate in-period PDF leads totaling ${sourceCrosscheck.summary.countedPages} pages were added.`,
        `${sourceCrosscheck.summary.skipped.already_surfaced} candidates were skipped as already surfaced.`
      ],
      nextActions: [
        "Review the 1993-1995 PC/DC, PRD/PDD, Kosovo, SECDEF, and Albright file-unit leads first.",
        "Flag alternate releases of the same PC/DC summary before promotion.",
        "Extract only the relevant document pages from packet PDFs."
      ],
      sourcePools: ["nara-crosscheck"],
      candidateLeadIds: crossDocs.slice(0, 25).map((item) => item.id)
    }),
    makeGap({
      id: "defense-jcs-source-base",
      severity: "High",
      status: "Open",
      area: "Defense and Military Implementation",
      title: "Defense, JCS, and military implementation source base remains thin",
      risk:
        "Air strikes, IFOR, no-fly-zone enforcement, lift-and-strike, and contingency planning are central to the story but are still mostly visible through State/NARA fragments and PC/DC summaries.",
      mitigation:
        "Added the Defense/JCS source pool to the gap register and extraction queue criteria.",
      evidence: [
        `${documents.filter((record) => /Defense|JCS|Joint Chiefs|OSD/i.test(textOf(record))).length} chronology records clearly identify Defense/JCS as their source family.`,
        `${countMatches([...researchFiles, ...crossDocs, ...stateDocs], /IFOR|air strike|no-fly|withdrawal|Oplan|military|SECDEF|JCS|Joint Chiefs|Defense/i)} candidate leads contain military implementation terms.`,
        "No dedicated Defense/JCS public release report exists yet in this repository."
      ],
      nextActions: [
        "Run NARA Catalog searches for SECDEF, JCS, OSD, Deliberate Force, IFOR, no-fly zone, OPLAN, and withdrawal planning.",
        "Prioritize documents tied to PC/DC decision points and presidential calls.",
        "Add a Defense/JCS report before claiming the military implementation gap is closed."
      ],
      sourcePools: ["defense-jcs"],
      candidateLeadIds: []
    }),
    makeGap({
      id: "cia-btf-document-level",
      severity: "High",
      status: "Open",
      area: "Intelligence",
      title: "CIA/Balkan Task Force material is not document-level",
      risk:
        "Srebrenica, safe areas, war crimes, sanctions, and military assessments require intelligence-policy records. The site identifies the BTF collection, but it does not yet provide a document-level intelligence chronology.",
      mitigation:
        "Added CIA/BTF to the source-pool register and tied it to the document-boundary extraction workflow.",
      evidence: [
        `${data.sources.filter((source) => /BTF|CIA|Intelligence/i.test(textOf(source))).length} source cards mention BTF/CIA/intelligence.`,
        `${sourcePools.find((pool) => pool.id === "cia-btf").currentLeads} research leads contain BTF/CIA/intelligence terms.`,
        `${countMatches(documents, /Srebrenica|war crimes|atrocit|tribunal|ICTY|genocide/i)} chronology records touch war-crimes or atrocity themes, but most are public or NSC/PCDC records.`
      ],
      nextActions: [
        "Harvest the BTF collection at item level and separate intelligence assessments, situation reports, and policy memos.",
        "Cross-check CIA Reading Room and NARA Catalog for Balkan Task Force, Srebrenica, safe area, and war-crimes terms.",
        "Keep intelligence products distinct from public statements and press guidance."
      ],
      sourcePools: ["cia-btf"],
      candidateLeadIds: []
    }),
    makeGap({
      id: "regional-imbalance",
      severity: "Medium",
      status: "Mitigated",
      area: "Coverage Balance",
      title: "Bosnia dominance can hide Croatia, Kosovo, Macedonia, and Serbia/Montenegro gaps",
      risk:
        "Bosnia dominates the record set. The compiler needs explicit counters and queues so Croatia/Krajina, Kosovo, Macedonia, Serbia/Montenegro, and Eastern Slavonia are not missed.",
      mitigation:
        "Added topic counters to the gap register and State FOIA/NARA candidate layers with Kosovo, Macedonia, Krajina, and Croatia search packs.",
      evidence: [
        `Chronology term counts: Bosnia ${countMatches(documents, /bosnia|srebrenica|bihac|sarajevo|dayton/i)}, Croatia ${countMatches(documents, /croatia|tudjman|krajina|eastern slavonia|z-4|zagreb|knin/i)}, Serbia/Montenegro ${countMatches(documents, /serbia|serb|milosevic|montenegro|belgrade/i)}, Kosovo ${countMatches(documents, /kosovo/i)}, Macedonia ${countMatches(documents, /macedonia/i)}.`,
        `State FOIA candidate term counts: Croatia ${countMatches(stateDocs, /croatia|tudjman|krajina|zagreb/i)}, Kosovo ${countMatches(stateDocs, /kosovo/i)}, Macedonia ${countMatches(stateDocs, /macedonia/i)}, Serbia/Montenegro ${countMatches(stateDocs, /serbia|serb|milosevic|montenegro|belgrade/i)}.`,
        `Public Papers contribute ${publicPapers.summary.selectedRecords} records, so topic counts must distinguish public context from archival decision records.`
      ],
      nextActions: [
        "Filter candidate leads by Croatia/Krajina, Kosovo, Macedonia, and Serbia/Montenegro before promoting any more Bosnia records.",
        "Build separate candidate bundles for Z-4/Eastern Slavonia, Kosovo/Macedonia spillover, and Belgrade sanctions diplomacy.",
        "Keep public-statement counts separate from archival-policy counts in compiler decisions."
      ],
      sourcePools: ["state-foia", "nara-crosscheck", "clinton-research-pdfs"],
      candidateLeadIds: stateDocs.filter((item) => /kosovo|macedonia|croatia|krajina|belgrade/i.test(textOf(item))).slice(0, 30).map((item) => item.id)
    }),
    makeGap({
      id: "memcon-telcon-reconciliation",
      severity: "Medium",
      status: "Open",
      area: "Presidential Conversations",
      title: "Memcon/telcon completeness still depends on schedule and call-log reconciliation",
      risk:
        "The current memcon/telcon inventory is strong, but completeness requires checking schedule/call-log evidence for missing, withheld, or not-yet-digitized conversations.",
      mitigation:
        "The gap register keeps this as an explicit production task rather than implying the conversation layer is complete.",
      evidence: [
        `${conversations.length} memcon/telcon chronology records are present.`,
        `Conversation years: ${JSON.stringify(countBy(conversations, (item) => (item.sortDate || "").slice(0, 4)))}.`,
        `${data.sources.filter((source) => /schedule|meeting|telephone/i.test(textOf(source))).length} source cards point to schedule/call verification sources.`
      ],
      nextActions: [
        "Reconcile each presidential call/meeting against daily schedules and foreign leader call lists.",
        "Mark known no-document or withheld conversations in the chronology as source gaps, not absent events.",
        "Record Washington time when available."
      ],
      sourcePools: ["clinton-research-pdfs"],
      candidateLeadIds: conversations.map((item) => item.id).slice(0, 20)
    }),
    makeGap({
      id: "source-note-finalization",
      severity: "Medium",
      status: "Open",
      area: "Source Notes",
      title: "Draft source notes still need FRUS-level verification",
      risk:
        "The page uses FRUS-style source-note stems, but final FRUS treatment requires PDF-level verification of markings, attachments, marginalia, distribution, and excisions.",
      mitigation:
        "Every candidate layer now carries a source-note draft and verification warning; the gap register turns remaining verification into an explicit queue.",
      evidence: [
        `${documents.filter((record) => record.sourceNote).length} chronology records have source-note drafts.`,
        `${stateDocs.length} State FOIA candidates and ${crossDocs.length} NARA source-family candidates have source-note drafts.`,
        `${documents.filter((record) => record.annotationSheet).length} extracted chronology PDFs append source packet page 1 as an annotation sheet.`
      ],
      nextActions: [
        "Open each promoted PDF and verify classification, handling controls, drafting, clearance, addressees, attachments, annotations, and excision accounting.",
        "For State cables, verify cable number, TAGS/SUBJECT, from/to line, and distribution before source-note finalization.",
        "Track attachments-not-printed and wholly withheld cross-references separately."
      ],
      sourcePools: ["state-foia", "nara-crosscheck", "clinton-research-pdfs"],
      candidateLeadIds: []
    })
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This register identifies compiler-risk gaps and mitigation queues. It does not recommend document inclusion and does not impose a FRUS volume structure.",
    metrics: {
      chronologyRecords: documents.length,
      chronologyPages: documents.reduce((sum, item) => sum + (item.pageCount || 0), 0),
      archivalChronologyRecords: archivalDocs.length,
      publicStatementRecords: documents.length - archivalDocs.length,
      candidateLeadCount,
      candidateLeadPages:
        research.summary.countedPages + sourceCrosscheck.summary.countedPages + stateFoia.summary.countedPages,
      byYear: countBy(documents, (item) => (item.sortDate || "").slice(0, 4)),
      byScope: countBy(documents, (item) => item.documentScope),
      byRepository: countBy(documents, (item) => item.repository || item.institution || item.collection)
    },
    summary: {
      gaps: gaps.length,
      mitigated: gaps.filter((gap) => gap.status === "Mitigated").length,
      open: gaps.filter((gap) => gap.status === "Open").length,
      critical: gaps.filter((gap) => gap.severity === "Critical").length,
      high: gaps.filter((gap) => gap.severity === "High").length,
      medium: gaps.filter((gap) => gap.severity === "Medium").length,
      sourcePools: sourcePools.length,
      extractionQueue: extractionQueue.length,
      candidateLeads: candidateLeadCount
    },
    sourcePools,
    extractionQueue,
    gaps
  };

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MD_PATH, markdown(report));
  console.log(`Wrote ${path.relative(ROOT, JSON_PATH)} and ${path.relative(ROOT, MD_PATH)}.`);
}

main();
