# FRUS 1993-2000 Volume XV Compiler Workspace

A GitHub Pages workspace for helping a FRUS compiler review a chronological
inventory of declassified and public U.S. Clinton-era records for
*Foreign Relations of the United States, 1993-2000, Volume XV, Wars in the
Balkans, 1993-1995*.

The Office of the Historian currently lists this volume as **Being Researched**.
This page is a companion research aid: it does not replace the official FRUS
process and does not recommend documents for inclusion or propose a volume
structure. Its mission is to provide declassified U.S. records and Clinton
Public Papers records covering the Balkans chronologically, with source and
page metadata, so the compiler can consider them.

The compiler-facing workflow is aligned with the Office of the Historian's
published "About the Series" guidance for FRUS production:
<https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries>.

## Page Structure

- `index.html` is the static GitHub Pages entry point.
- `styles.css` contains the responsive layout and visual system.
- `app.js` renders the chronological declassified/public-record inventory,
  research collection sweep, source cards, and completeness queue from data.
- The public page includes an evidence audit board, coverage bars, a
  people/form index, and live filters for records by form, year, and
  keyword.
- A FRUS inventory-method console keeps the evidence aligned with chronological
  ordering, source-note metadata, and declassification accounting without making
  selection judgments.
- A separate research-collections section incorporates the 200-folder
  2013-0185-M research plan and the online Clinton Digital Library sweep,
  while keeping collection discovery distinct from document-selection or
  volume-structure judgments.
- The document cards draft citation stems in the same order used by
  FRUS source notes in Volume XXXI: repository/custody, collection or control
  number, item/NAID locator, PDF page range, then original classification,
  handling controls, drafting/clearance/distribution, annotations, attachments,
  and declassification/excision accounting to verify from the PDF.
- `data/compiler-map.json` is the canonical data file.
- `data/compiler-map.js` mirrors the same data for direct filesystem preview.
- `assets/balkans-compiler-map.svg` is the local visual asset used in the hero.
- `scripts/search-nara-scout-memcons.js` reproduces the NARA Scout
  memcon/telcon search against the National Archives Catalog.
- `scripts/search-strobe-talbott-manifest.js` scores the public Strobe Talbott
  FOIA manifest, downloads and full-text searches the direct PDFs, counts pages,
  and separates reviewed in-volume standalone records from false positives and
  post-1995 follow-on leads.
- `scripts/build-broad-document-inventory.js` builds the expanded chronology,
  extracts packet PDF page ranges, appends page 1 of each source packet as an
  annotation sheet, and writes document page-count metadata.
- `scripts/extract-and-count-conversations.js` resolves direct Clinton Library
  memcon/telcon PDFs, extracts document-level memcons and telcons from packet
  PDFs, and records page counts.
- `scripts/search-research-collections.js` parses the 2013-0185-M research plan,
  searches the Clinton Digital Library for each ranked and supplemental
  collection target through a browser context, de-duplicates declassified
  digitized PDFs, and records page counts.
- `scripts/search-public-papers.js` downloads the six 1993-1995 Clinton Public
  Papers packages from GovInfo, searches all document granules for Balkans
  terms, excludes reviewed false positives, and records GovInfo source-page
  counts for each selected public record.
- `reports/nara-scout-memcon-telcon-search.json` records the latest NARA Scout
  search run and filtered declassified records.
- `reports/strobe-talbott-manifest-search.json` records the latest Talbott
  manifest/PDF sweep, selected standalone direct FOIA records, reviewed
  exclusions, and post-1995 follow-on items.
- `reports/conversation-page-counts.json` records the direct and extracted
  memcon/telcon page-count audit.
- `reports/document-page-counts.json` records the expanded document inventory
  page-count audit.
- `reports/research-collection-search.json` records the ranked-folder and
  supplemental collection sweep, including selected digitized files, public
  item/PDF links, match confidence, provenance-note drafts, and counted pages.
- `reports/public-papers-balkans-search.json` records the GovInfo Public Papers
  sweep, selected public records, reviewed exclusions, raw hits, and counted
  Public Papers source pages.
- `documents/` contains extracted document-level PDFs from packet sources.

## Source Focus

The first-pass source matrix supports completeness checks across:

- Office of the Historian volume and status pages.
- Clinton Library Memcons and Telcons collection indexes.
- Item-level declassified President Clinton conversations with Mitterrand,
  Chirac, Major, NATO Secretary General Willy Claes, and Spanish Prime Minister
  Felipe Gonzalez, with direct PDF links and counted pages.
- Extracted packet-level President Clinton memcons and telcons for Izetbegovic,
  Tudjman, Milosevic, Chirac, Kohl, Major, Christopher-de Charette, and Yeltsin,
  with source page ranges and counted document pages.
- Extracted NSC Principals and Deputies Committee summaries from the PC/DC
  Bosnia MDR packet.
- Extracted August 1995 endgame strategy papers from the Getting to Dayton MDR
  packet.
- Extracted Croatia, Z-4, Milosevic, Srebrenica/London, and allied-diplomacy
  policy records from Clinton Library MDR packets.
- NARA Scout / National Archives Catalog cross-check for digitized
  declassified memcons and telcons, including NAID `163545436`, the
  Clinton-Yeltsin Hyde Park memcon on Bosnia implementation.
- Strobe Talbott FOIA case `F-2017-13804`, including `12` reviewed standalone
  direct FOIA records on Bosnia, IFOR, Russia, Dayton implementation,
  Spain/UNPROFOR, Turkey/Kosovo, and NATO-Bosnia linkages.
- Clinton Public Papers GovInfo packages `PPP-1993-book1` through
  `PPP-1995-book2`, adding public statements, exchanges, interviews, messages,
  letters, radio addresses, and news conferences that mention Bosnia,
  Yugoslavia, Serbia/Serbs, Croatia/Croats, Macedonia, Kosovo, UNPROFOR, IFOR,
  Dayton, and related terms.
- Clinton Digital Library Bosnia collection, `2008-0994-F`.
- Clinton Digital Library FOIA folder releases surfaced from the 2013-0185-M
  research plan, including `2008-0994-F`, `2013-0687-F`, PC/DC files,
  Bosnia monthly files, Holl early-period files, Kerrick subject files,
  Balkan Crisis notebooks, and the 72-page `Telcons and Memcons` folder.
- Bosnian Declassified Records and the DCI Interagency Balkan Task Force trail.
- Alexander Vershbow's Bosnia files, `2013-0687-F`.
- PC/DC, memcon/telcon, Croatia, Srebrenica, and Dayton-track MDR releases.
- Paris signing and daily schedule contextual sources.

## Evidence Audit

The page currently surfaces `549` chronological declassified and public records
and `2,251` counted document pages, including `31` memcon/telcon records and
`446` Clinton Public Papers records.
Every displayed card has a PDF link, source-page metadata, and provenance
labeling that distinguishes direct PDFs from locally extracted packet documents.

Packet extractions include only the document pages and append page 1 of the
source PDF as an annotation sheet for the compiler's provenance review.

The document table can also export the active filtered set as CSV. Each
document card contains a collapsed FRUS-style source-note block with a draft
`Source:` note, a locator/page ledger, and open PDF-level checks for
classification, handling controls, drafting, clearance, distribution, marginalia,
attachments not printed, and excisions.

The research-collections section adds `200` ranked folder targets and `9`
supplemental collection leads from the research plan. The online sweep found
`462` selected declassified/digitized PDF leads across `93` ranked targets and
`1` supplemental target, with `16,293` counted PDF pages.

The Strobe Talbott FOIA full-text sweep searched all `1,474` manifest PDFs,
found `405` Balkans-related full-text hits, reviewed `20` in-volume hits, and
adds `12` standalone direct State FOIA records totaling `70` counted pages.

The GovInfo Public Papers sweep searched all `3,472` document granules across
the six 1993-1995 Clinton Public Papers packages, found `466` in-period
Balkans-related hits, excluded `20` reviewed false positives, and adds `446`
public records totaling `1,864` counted Public Papers pages.

## Local Preview

The page can open directly from the filesystem because `data/compiler-map.js`
loads before `app.js`.

For a server preview:

```bash
python3 -m http.server 4187
```

Then open <http://127.0.0.1:4187/>.

## Publish

This repository deploys through GitHub Pages with
`.github/workflows/deploy-pages.yml`.

After the first push to `main`, open the repository settings on GitHub, go to
**Pages**, and set the source to **GitHub Actions** if it is not already set.
