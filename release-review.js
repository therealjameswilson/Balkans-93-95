(() => {
  const root = document.querySelector('[data-october-review]');
  const report = window.OCTOBER_RELEASE_REVIEW;
  if (!root || !report) return;
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const link = (label, url) => { const a = el('a', label); a.href = url; a.rel = 'noreferrer'; return a; };
  const heading = el('h2', 'October 30, 2026 release: documentary review');
  const intro = el('p', report.summaryText);
  const boundary = el('p', 'Volume XV covers 1993–1995. Later implementation records are separate context; undated, cover-only, sparse and illegible records remain verification leads. Every record remains pending compiler selection.');
  const notice = el('p', report.evidenceNotice, 'october-notice');
  const links = el('p'); links.append(link('Release microsite', report.releaseSite), document.createTextNode(' · '), link('Download review data', 'data/october-2026-review.json'), document.createTextNode(' · '), link('Review method and gaps', 'reports/october-2026-review.md'));
  const controls = el('div', undefined, 'october-controls');
  const searchLabel = el('label', 'Search this release');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Srebrenica, sanctions, annex, cable number…'; search.setAttribute('aria-label', 'Search October release documentary leads'); searchLabel.append(search);
  const scopeLabel = el('label', 'Research scope'); const scope = el('select'); scope.setAttribute('aria-label', 'October release research scope');
  for (const [value, label] of [['core', '1993–1995 body-supported leads'], ['context', 'After 1995: context only'], ['verification', 'Date / content verification queue'], ['all', 'All reviewed release records']]) { const option = el('option', label); option.value = value; scope.append(option); } scopeLabel.append(scope);
  const exportButton = el('button', 'Export filtered JSON'); exportButton.type = 'button';
  controls.append(searchLabel, scopeLabel, exportButton);
  const count = el('p'); count.setAttribute('aria-live', 'polite');
  const list = el('div', undefined, 'october-cards');
  const more = el('button', 'Show more records'); more.type = 'button';
  let limit = 30, filtered = [];
  function render() {
    const q = search.value.toLowerCase().trim();
    filtered = report.records.filter(r => (scope.value === 'all' || r.scope === scope.value) && (!q || JSON.stringify(r).toLowerCase().includes(q))).sort((a,b) => (a.reviewDate || a.catalogDate || '9999').localeCompare(b.reviewDate || b.catalogDate || '9999') || a.title.localeCompare(b.title));
    count.textContent = `${filtered.length} matching records; showing ${Math.min(limit, filtered.length)}. Counts describe documentary leads, not documents selected for publication.`;
    list.replaceChildren();
    for (const r of filtered.slice(0, limit)) {
      const card = el('article', undefined, 'october-card'); card.id = `october-${r.id}`;
      const title = el('h3'); title.append(link(r.title, r.pdfUrl));
      card.append(el('p', `${r.scopeLabel} · ${r.reviewStatus}`, 'october-meta'), title,
        el('p', `${r.reviewDate || 'Historical date unresolved'}${r.catalogDate && r.catalogDate !== r.reviewDate ? ` · Catalog date: ${r.catalogDate}` : ''} · ${r.caseNumber} / ${r.documentId} · ${r.pageCount} physical PDF page${r.pageCount === 1 ? '' : 's'}`, 'october-meta'));
      if (r.dateNote) card.append(el('p', r.dateNote));
      card.append(el('p', r.summary), el('p', `Compiler use: ${r.compilerUse}`));
      const details = el('details'); details.append(el('summary', 'Page evidence and source-note work'));
      for (const e of r.evidence) {
        const paragraph = el('p'); paragraph.append(link(`PDF p. ${e.page}`, `${r.pdfUrl}#page=${e.page}`), document.createTextNode(` — ${e.note || 'Text evidence'}${e.excerpt ? `: “${e.excerpt}”` : ''}`)); details.append(paragraph);
      }
      details.append(el('p', `Source note draft: ${r.sourceNote}`), el('p', `Checks and gaps: ${r.gaps.join(' ')}`));
      if (r.relatedRecords?.length) details.append(el('p', `Related release records / possible copies: ${r.relatedRecords.join('; ')}. Compare texts, routing and excisions before merging.`));
      if (r.crossVolumes?.length) details.append(el('p', `Cross-volume connections: ${r.crossVolumes.join('; ')}`));
      details.append(el('p', `Stable release ID: ${r.id}. Full official PDF URL is retained in the dataset; control numbers repeat across cases.`, 'october-meta'));
      card.append(details, el('p', 'Extracted text / OCR evidence only; the source facsimile and source note await compiler verification.', 'october-notice'));
      list.append(card);
    }
    more.hidden = limit >= filtered.length;
  }
  search.addEventListener('input', () => { limit = 30; render(); }); scope.addEventListener('change', () => { limit = 30; render(); }); more.addEventListener('click', () => { limit += 30; render(); });
  exportButton.addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify({...report, records: filtered}, null, 2)], {type:'application/json'})); const a = link('', url); a.download = 'balkans-october-2026-filtered-review.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  root.replaceChildren(heading, intro, boundary, notice, links, controls, count, list, more);
  const openLinkedRecord = () => {
    const id = location.hash.replace(/^#october-/, '');
    if (!report.records.some(r => r.id === id)) return false;
    scope.value = 'all'; search.value = id; limit = 30; render();
    document.getElementById(`october-${id}`)?.scrollIntoView(); return true;
  };
  window.addEventListener('hashchange', openLinkedRecord);
  if (!openLinkedRecord()) render();
})();
