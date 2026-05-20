const DATA_URL = "data/compiler-map.json";
const REPORT_URLS = {
  conversations: "reports/conversation-page-counts.json",
  nara: "reports/nara-scout-memcon-telcon-search.json",
  talbott: "reports/strobe-talbott-manifest-search.json"
};

const state = {
  filter: "All",
  search: "",
  conversationKind: "All",
  conversationYear: "All",
  conversationSearch: ""
};

const nodes = {
  totalSources: document.querySelector("#total-sources"),
  totalLanes: document.querySelector("#total-lanes"),
  totalConversations: document.querySelector("#total-conversations"),
  totalPages: document.querySelector("#total-pages"),
  totalEvents: document.querySelector("#total-events"),
  status: document.querySelector("#volume-status"),
  auditRoot: document.querySelector("#audit-root"),
  coverageRoot: document.querySelector("#coverage-root"),
  counterpartRoot: document.querySelector("#counterpart-root"),
  lanesRoot: document.querySelector("#lanes-root"),
  conversationRoot: document.querySelector("#conversation-root"),
  conversationSearch: document.querySelector("#conversation-search"),
  conversationKindFilters: document.querySelector("#conversation-kind-filters"),
  conversationYearFilters: document.querySelector("#conversation-year-filters"),
  conversationReset: document.querySelector("#conversation-reset"),
  conversationSummary: document.querySelector("#conversation-summary"),
  sourceFilters: document.querySelector("#source-filters"),
  sourceSearch: document.querySelector("#source-search"),
  sourcesRoot: document.querySelector("#sources-root"),
  chronologyRoot: document.querySelector("#chronology-root"),
  questionsRoot: document.querySelector("#questions-root"),
  queueRoot: document.querySelector("#queue-root")
};

function textMatch(source) {
  const haystack = [
    source.title,
    source.identifier,
    source.institution,
    source.description,
    source.compilerUse,
    source.type,
    ...(source.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.search.toLowerCase());
}

function byPriority(a, b) {
  const order = { Anchor: 0, Core: 1, High: 2, Contextual: 3 };
  return (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || a.title.localeCompare(b.title);
}

function priorityClass(priority) {
  return (priority || "").toLowerCase();
}

function createTagRow(tags = []) {
  const row = document.createElement("div");
  row.className = "tag-row";

  for (const tag of tags) {
    const item = document.createElement("span");
    item.className = "tag";
    item.textContent = tag;
    row.append(item);
  }

  return row;
}

function conversationRecords(data) {
  return data.conversations.filter((record) => ["Memcon", "Telcon"].includes(record.kind));
}

function sumPages(records) {
  return records.reduce((sum, record) => sum + (record.pageCount || 0), 0);
}

function sortByValueDesc(entries) {
  return entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function groupCounts(records, labelFor) {
  const groups = new Map();
  for (const record of records) {
    const label = labelFor(record) || "Unsorted";
    const item = groups.get(label) || { label, count: 0, pages: 0 };
    item.count += 1;
    item.pages += record.pageCount || 0;
    groups.set(label, item);
  }
  return [...groups.values()];
}

function isDirectItem(record) {
  return /^https:\/\/clinton\.presidentiallibraries\.us\/files\/original\//.test(record.pdfUrl || "");
}

function isExtractedDocument(record) {
  return /^(documents\/|\.\/documents\/)/.test(record.pdfUrl || "");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function renderStats(data) {
  const conversations = conversationRecords(data);

  nodes.totalSources.textContent = data.sources.length.toString();
  nodes.totalLanes.textContent = data.lanes.length.toString();
  nodes.totalConversations.textContent = conversations.length.toString();
  nodes.totalPages.textContent = sumPages(conversations).toString();
  nodes.totalEvents.textContent = data.chronology.length.toString();
  nodes.status.textContent = data.volume.status;
}

function auditCard(title, value, detail, meta) {
  const card = document.createElement("article");
  card.className = "audit-card";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const stat = document.createElement("p");
  stat.className = "audit-stat";
  stat.textContent = value;

  const body = document.createElement("p");
  body.textContent = detail;

  card.append(heading, stat, body);

  if (meta) {
    const note = document.createElement("p");
    note.className = "audit-meta";
    note.textContent = meta;
    card.append(note);
  }

  return card;
}

function renderAudit(data, reports = {}) {
  const conversations = conversationRecords(data);
  const direct = conversations.filter(isDirectItem);
  const extracted = conversations.filter(isExtractedDocument);
  const pending = conversations.filter((record) => !record.pageCount);
  const memcons = conversations.filter((record) => record.kind === "Memcon");
  const telcons = conversations.filter((record) => record.kind === "Telcon");
  const denseYear = sortByValueDesc(
    groupCounts(conversations, (record) => (record.sortDate || "").slice(0, 4)).map((item) => ({
      label: item.label,
      value: item.count,
      pages: item.pages
    }))
  )[0];
  const naraRecords = reports.nara?.declassifiedRecords || reports.nara?.records?.length || 0;
  const naraUnique = reports.nara?.uniqueRecords || 0;
  const talbottHits = reports.talbott?.matchedCount || reports.talbott?.records?.length || 0;
  const talbottRows = reports.talbott?.rowCount || 0;
  const talbottContext = reports.talbott?.buckets?.inVolumeContext || 0;

  nodes.auditRoot.replaceChildren(
    auditCard(
      "Conversation Evidence",
      `${formatNumber(conversations.length)} records`,
      `${formatNumber(sumPages(conversations))} counted pages: ${formatNumber(memcons.length)} memcons and ${formatNumber(telcons.length)} telcons.`,
      `${pending.length} records still need page counts.`
    ),
    auditCard(
      "PDF Coverage",
      `${formatNumber(direct.length + extracted.length)} PDFs`,
      `${formatNumber(direct.length)} direct Clinton Library item PDFs and ${formatNumber(extracted.length)} extracted packet documents.`,
      "Each displayed memcon/telcon card has a PDF link and source-page metadata."
    ),
    auditCard(
      "Discovery Sweeps",
      `${formatNumber(naraRecords + talbottHits)} leads`,
      `${formatNumber(naraRecords)} declassified NARA Scout records from ${formatNumber(naraUnique)} unique hits; ${formatNumber(talbottHits)} Strobe Talbott manifest hits from ${formatNumber(talbottRows)} rows.`,
      `${formatNumber(talbottContext)} Talbott hits are in-volume contextual leads.`
    ),
    auditCard(
      "Highest Density",
      denseYear ? denseYear.label : "N/A",
      denseYear
        ? `${formatNumber(denseYear.value)} conversations and ${formatNumber(denseYear.pages)} pages cluster in ${denseYear.label}.`
        : "No conversation dates available.",
      "Use this to prioritize the 1995 coercive diplomacy and Dayton sequence."
    )
  );

  renderCoverage(conversations);
  renderCounterparts(conversations);
}

function renderCoverage(conversations) {
  const byYear = groupCounts(conversations, (record) => (record.sortDate || "").slice(0, 4)).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  const byKind = groupCounts(conversations, (record) => record.kind).sort((a, b) => a.label.localeCompare(b.label));
  const maxPages = Math.max(...byYear.map((item) => item.pages), ...byKind.map((item) => item.pages), 1);

  const heading = document.createElement("h3");
  heading.textContent = "Coverage by Year and Form";
  const list = document.createElement("div");
  list.className = "coverage-list";

  for (const item of [...byYear, ...byKind]) {
    const row = document.createElement("div");
    row.className = "coverage-row";
    const label = document.createElement("span");
    label.textContent = item.label;
    const meter = document.createElement("span");
    meter.className = "coverage-meter";
    meter.style.setProperty("--meter-width", `${Math.max(8, (item.pages / maxPages) * 100)}%`);
    const value = document.createElement("span");
    value.textContent = `${formatNumber(item.count)} records / ${formatNumber(item.pages)} pages`;
    row.append(label, meter, value);
    list.append(row);
  }

  nodes.coverageRoot.replaceChildren(heading, list);
}

function renderCounterparts(conversations) {
  const groups = groupCounts(conversations, (record) => record.counterpart)
    .sort((a, b) => b.count - a.count || b.pages - a.pages || a.label.localeCompare(b.label))
    .slice(0, 10);

  const heading = document.createElement("h3");
  heading.textContent = "Counterpart Index";
  const list = document.createElement("div");
  list.className = "counterpart-list";

  for (const item of groups) {
    const row = document.createElement("div");
    row.className = "counterpart-row";
    const label = document.createElement("span");
    label.textContent = item.label;
    const value = document.createElement("span");
    value.textContent = `${formatNumber(item.count)} / ${formatNumber(item.pages)} pp.`;
    row.append(label, value);
    list.append(row);
  }

  nodes.counterpartRoot.replaceChildren(heading, list);
}

function renderLanes(data) {
  nodes.lanesRoot.replaceChildren();

  for (const lane of data.lanes) {
    const card = document.createElement("article");
    card.className = "lane-card";

    const top = document.createElement("div");
    top.className = "lane-top";

    const headingWrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = lane.title;
    const period = document.createElement("p");
    period.className = "lane-period";
    period.textContent = lane.period;
    headingWrap.append(heading, period);

    const number = document.createElement("span");
    number.className = "lane-number";
    number.textContent = `Lane ${lane.number}`;

    top.append(headingWrap, number);

    const focus = document.createElement("p");
    focus.textContent = lane.focus;

    const list = document.createElement("ul");
    for (const item of lane.mustFind) {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    }

    card.append(top, focus, list);
    nodes.lanesRoot.append(card);
  }
}

function byDateThenType(a, b) {
  return (a.sortDate || "").localeCompare(b.sortDate || "") || a.title.localeCompare(b.title);
}

function pageLabel(pageCount) {
  if (!pageCount) return "Pages pending";
  return pageCount === 1 ? "1 page" : `${pageCount} pages`;
}

function createConversationLinks(record) {
  const links = document.createElement("div");
  links.className = "conversation-links";

  for (const [label, url] of [
    ["Open PDF", record.pdfUrl],
    ["Open record", record.url]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  return links;
}

function conversationTextMatch(record) {
  if (!state.conversationSearch) return true;
  const haystack = [
    record.title,
    record.counterpart,
    record.identifier,
    record.collection,
    record.compilerUse,
    record.kind,
    ...(record.subjects || []),
    ...(record.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.conversationSearch.toLowerCase());
}

function conversationYear(record) {
  return (record.sortDate || "").slice(0, 4);
}

function filteredConversations(data) {
  return conversationRecords(data)
    .filter((record) => state.conversationKind === "All" || record.kind === state.conversationKind)
    .filter((record) => state.conversationYear === "All" || conversationYear(record) === state.conversationYear)
    .filter(conversationTextMatch)
    .sort(byDateThenType);
}

function renderButtonGroup(root, values, activeValue, onSelect) {
  root.replaceChildren();

  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.setAttribute("aria-pressed", value === activeValue ? "true" : "false");
    button.addEventListener("click", () => onSelect(value));
    root.append(button);
  }
}

function renderConversationFilters(data) {
  const conversations = conversationRecords(data);
  const kinds = ["All", ...new Set(conversations.map((record) => record.kind).sort())];
  const years = ["All", ...new Set(conversations.map(conversationYear).filter(Boolean).sort())];

  renderButtonGroup(nodes.conversationKindFilters, kinds, state.conversationKind, (value) => {
    state.conversationKind = value;
    renderConversationFilters(data);
    renderConversations(data);
  });

  renderButtonGroup(nodes.conversationYearFilters, years, state.conversationYear, (value) => {
    state.conversationYear = value;
    renderConversationFilters(data);
    renderConversations(data);
  });
}

function renderConversations(data) {
  nodes.conversationRoot.replaceChildren();

  const records = filteredConversations(data);
  const direct = records.filter(isDirectItem).length;
  const extracted = records.filter(isExtractedDocument).length;
  nodes.conversationSummary.textContent = `Showing ${formatNumber(records.length)} of ${formatNumber(
    conversationRecords(data).length
  )} records, ${formatNumber(sumPages(records))} pages, ${formatNumber(direct)} direct PDFs, ${formatNumber(
    extracted
  )} extracted PDFs.`;

  if (!records.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No memcons or telcons match the current filters.";
    nodes.conversationRoot.append(empty);
    return;
  }

  for (const record of records) {
    const card = document.createElement("article");
    card.className = "conversation-card";

    const date = document.createElement("time");
    date.className = "conversation-date";
    date.dateTime = record.sortDate;
    date.textContent = record.date;

    const body = document.createElement("div");

    const top = document.createElement("div");
    top.className = "conversation-top";
    const heading = document.createElement("h3");
    heading.textContent = record.title;
    const badges = document.createElement("div");
    badges.className = "conversation-badges";
    const kind = document.createElement("span");
    kind.className = `source-type ${record.kind.toLowerCase()}`;
    kind.textContent = record.kind;
    const provenance = document.createElement("span");
    provenance.className = `source-type ${isExtractedDocument(record) ? "extracted" : "direct"}`;
    provenance.textContent = isExtractedDocument(record) ? "Extracted PDF" : "Direct PDF";
    badges.append(kind, provenance);
    top.append(heading, badges);

    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [
      record.counterpart,
      record.identifier,
      record.collection,
      pageLabel(record.pageCount),
      record.sourcePdfPages ? `source pp. ${record.sourcePdfPages}` : ""
    ]
      .filter(Boolean)
      .join(" | ");

    const use = document.createElement("p");
    use.textContent = record.compilerUse;

    const subjects = document.createElement("p");
    subjects.className = "conversation-subjects";
    subjects.textContent = record.subjects.join(" / ");

    const extraction = document.createElement("p");
    extraction.className = "conversation-provenance";
    extraction.textContent = record.extractionStatus || "PDF provenance recorded in source metadata.";

    body.append(top, meta, use, subjects, extraction, createTagRow(record.tags));

    card.append(date, body, createConversationLinks(record));
    nodes.conversationRoot.append(card);
  }
}

function renderFilters(data) {
  const types = ["All", ...new Set(data.sources.map((source) => source.type))];
  nodes.sourceFilters.replaceChildren();

  for (const type of types) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = type;
    button.setAttribute("aria-pressed", type === state.filter ? "true" : "false");
    button.addEventListener("click", () => {
      state.filter = type;
      renderSources(data);
      renderFilters(data);
    });
    nodes.sourceFilters.append(button);
  }
}

function renderSources(data) {
  nodes.sourcesRoot.replaceChildren();

  const sources = data.sources
    .filter((source) => state.filter === "All" || source.type === state.filter)
    .filter(textMatch)
    .sort(byPriority);

  if (!sources.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No source leads match the current search.";
    nodes.sourcesRoot.append(empty);
    return;
  }

  for (const source of sources) {
    const card = document.createElement("article");
    card.className = "source-card";

    const top = document.createElement("div");
    top.className = "source-top";

    const headingWrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = source.title;
    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = [source.identifier, source.institution].filter(Boolean).join(" | ");
    headingWrap.append(heading, meta);

    const priority = document.createElement("span");
    priority.className = `priority ${priorityClass(source.priority)}`;
    priority.textContent = source.priority;

    top.append(headingWrap, priority);

    const type = document.createElement("span");
    type.className = "source-type";
    type.textContent = source.type;

    const description = document.createElement("p");
    description.textContent = source.description;

    const use = document.createElement("p");
    use.textContent = source.compilerUse;

    const link = document.createElement("a");
    link.className = "source-link";
    link.href = source.url;
    link.rel = "noreferrer";
    link.textContent = "Open source";

    card.append(top, type, description, use, createTagRow(source.tags), link);
    nodes.sourcesRoot.append(card);
  }
}

function renderChronology(data) {
  nodes.chronologyRoot.replaceChildren();

  for (const event of data.chronology) {
    const item = document.createElement("article");
    item.className = "timeline-item";

    const date = document.createElement("div");
    date.className = "timeline-date";
    date.textContent = event.date;

    const body = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = event.title;
    const detail = document.createElement("p");
    detail.textContent = event.detail;
    body.append(heading, detail);

    const source = document.createElement("div");
    source.className = "timeline-source";
    source.textContent = event.sourceCue;

    item.append(date, body, source);
    nodes.chronologyRoot.append(item);
  }
}

function renderQuestions(data) {
  nodes.questionsRoot.replaceChildren();

  for (const question of data.questions) {
    const card = document.createElement("article");
    card.className = "question-card";

    const top = document.createElement("div");
    top.className = "question-top";
    const heading = document.createElement("h3");
    heading.textContent = question.title;
    const status = document.createElement("span");
    status.className = `status-pill ${question.status.toLowerCase()}`;
    status.textContent = question.status;
    top.append(heading, status);

    const meta = document.createElement("p");
    meta.className = "question-meta";
    meta.textContent = question.lane;

    const detail = document.createElement("p");
    detail.textContent = question.detail;

    const list = document.createElement("ul");
    for (const lead of question.sourceLeads) {
      const li = document.createElement("li");
      li.textContent = lead;
      list.append(li);
    }

    card.append(top, meta, detail, list);
    nodes.questionsRoot.append(card);
  }
}

function renderQueue(data) {
  nodes.queueRoot.replaceChildren();

  for (const item of data.harvestQueue) {
    const row = document.createElement("tr");

    for (const value of [item.target, item.why, item.nextAction, item.status]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    nodes.queueRoot.append(row);
  }
}

function bindSearch(data) {
  nodes.sourceSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderSources(data);
  });

  nodes.conversationSearch.addEventListener("input", (event) => {
    state.conversationSearch = event.target.value.trim();
    renderConversations(data);
  });

  nodes.conversationReset.addEventListener("click", () => {
    state.conversationKind = "All";
    state.conversationYear = "All";
    state.conversationSearch = "";
    nodes.conversationSearch.value = "";
    renderConversationFilters(data);
    renderConversations(data);
  });
}

async function loadOptionalJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function loadReports() {
  const [conversations, nara, talbott] = await Promise.all([
    loadOptionalJson(REPORT_URLS.conversations),
    loadOptionalJson(REPORT_URLS.nara),
    loadOptionalJson(REPORT_URLS.talbott)
  ]);

  return { conversations, nara, talbott };
}

async function loadData() {
  if (window.COMPILER_MAP_DATA) return window.COMPILER_MAP_DATA;
  if (window.COMPILER_DATA) return window.COMPILER_DATA;

  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Unable to load ${DATA_URL}: ${response.status}`);
  return response.json();
}

async function init() {
  try {
    const [data, reports] = await Promise.all([loadData(), loadReports()]);
    renderStats(data);
    renderAudit(data, reports);
    renderLanes(data);
    renderConversationFilters(data);
    renderConversations(data);
    renderFilters(data);
    renderSources(data);
    renderChronology(data);
    renderQuestions(data);
    renderQueue(data);
    bindSearch(data);
  } catch (error) {
    nodes.sourcesRoot.innerHTML = '<p class="empty-state">Compiler data could not be loaded.</p>';
  }
}

init();
