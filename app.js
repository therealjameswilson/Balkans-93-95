const DATA_URL = "data/compiler-map.json";

const state = {
  filter: "All",
  search: ""
};

const nodes = {
  totalSources: document.querySelector("#total-sources"),
  totalLanes: document.querySelector("#total-lanes"),
  totalConversations: document.querySelector("#total-conversations"),
  totalPages: document.querySelector("#total-pages"),
  totalEvents: document.querySelector("#total-events"),
  status: document.querySelector("#volume-status"),
  lanesRoot: document.querySelector("#lanes-root"),
  conversationRoot: document.querySelector("#conversation-root"),
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

function renderStats(data) {
  const conversationPages = data.conversations
    .filter((record) => ["Memcon", "Telcon"].includes(record.kind))
    .reduce((sum, record) => sum + (record.pageCount || 0), 0);

  nodes.totalSources.textContent = data.sources.length.toString();
  nodes.totalLanes.textContent = data.lanes.length.toString();
  nodes.totalConversations.textContent = data.conversations.length.toString();
  nodes.totalPages.textContent = conversationPages.toString();
  nodes.totalEvents.textContent = data.chronology.length.toString();
  nodes.status.textContent = data.volume.status;
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

function renderConversations(data) {
  nodes.conversationRoot.replaceChildren();

  for (const record of [...data.conversations].sort(byDateThenType)) {
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
    const kind = document.createElement("span");
    kind.className = `source-type ${record.kind.toLowerCase()}`;
    kind.textContent = record.kind;
    top.append(heading, kind);

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

    body.append(top, meta, use, subjects, createTagRow(record.tags));

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
}

async function loadData() {
  if (window.COMPILER_DATA) return window.COMPILER_DATA;

  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Unable to load ${DATA_URL}: ${response.status}`);
  return response.json();
}

async function init() {
  try {
    const data = await loadData();
    renderStats(data);
    renderLanes(data);
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
