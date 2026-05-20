# FRUS 1993-2000 Volume XV Compiler Workspace

A GitHub Pages workspace for helping a FRUS compiler map source leads for
*Foreign Relations of the United States, 1993-2000, Volume XV, Wars in the
Balkans, 1993-1995*.

The Office of the Historian currently lists this volume as **Being Researched**.
This page is a companion research aid: it does not replace the official FRUS
process, but it gives the compiler a source matrix, issue lanes, declassified
memcon/telcon leads, chronology anchors, and a harvest queue for Clinton Library
and Office of the Historian materials.

The compiler-facing workflow is aligned with the Office of the Historian's
published "About the Series" guidance for FRUS production:
<https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries>.

## Page Structure

- `index.html` is the static GitHub Pages entry point.
- `styles.css` contains the responsive layout and visual system.
- `app.js` renders the compiler lanes, memcon/telcon cards, source cards,
  chronology, questions, and queue from data.
- The public page includes an evidence audit board, coverage bars, a
  counterpart index, and live filters for memcons/telcons by kind, year, and
  keyword.
- A FRUS production-readiness console maps the evidence to Office of the
  Historian expectations for comprehensive coverage, chronological placement,
  first-footnote/source-note metadata, and declassification accounting.
- The memcon/telcon cards now draft citation stems in the same order used by
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
  FOIA manifest for Balkans, Bosnia, Dayton, Holbrooke, Russia, and Kosovo
  follow-on leads.
- `scripts/extract-and-count-conversations.js` resolves direct Clinton Library
  memcon/telcon PDFs, extracts document-level memcons and telcons from packet
  PDFs, and records page counts.
- `reports/nara-scout-memcon-telcon-search.json` records the latest NARA Scout
  search run and filtered declassified candidates.
- `reports/strobe-talbott-manifest-search.json` records the latest Talbott
  manifest sweep and separates in-volume leads from post-1995 follow-on items.
- `reports/conversation-page-counts.json` records the direct and extracted
  memcon/telcon page-count audit.
- `documents/` contains extracted document-level PDFs from packet sources.

## Source Focus

The first-pass source matrix covers:

- Office of the Historian volume and status pages.
- Clinton Library Memcons and Telcons collection indexes.
- Item-level declassified conversations with Mitterrand, Chirac, Major, NATO
  Secretary General Willy Claes, and Spanish Prime Minister Felipe Gonzalez,
  with direct PDF links and counted pages.
- Extracted packet-level memcons and telcons for Izetbegovic, Tudjman,
  Milosevic, Chirac, Kohl, Major, Christopher-de Charette, and Yeltsin, with
  source page ranges and counted conversation pages.
- NARA Scout / National Archives Catalog cross-check for digitized
  declassified memcons and telcons, including NAID `163545436`, the
  Clinton-Yeltsin Hyde Park memcon on Bosnia implementation.
- Strobe Talbott FOIA case `F-2017-13804`, including in-volume contextual
  leads for the Secretary-Kozyrev Bosnia letter, Talbott-Holbrooke traffic, and
  late-1995 implementation context.
- Clinton Digital Library Bosnia collection, `2008-0994-F`.
- Bosnian Declassified Records and the DCI Interagency Balkan Task Force trail.
- Alexander Vershbow's Bosnia files, `2013-0687-F`.
- PC/DC, memcon/telcon, Croatia, Srebrenica, and Dayton-track MDR releases.
- Paris signing and daily schedule contextual sources.

## Evidence Audit

The page currently surfaces `32` document-level memcon/telcon records and `166`
counted conversation pages. Every displayed conversation card has a PDF link,
source-page metadata, and provenance labeling that distinguishes direct Clinton
Library item PDFs from locally extracted packet documents.

The memcon/telcon table can also export the active filtered set as CSV. Each
conversation card contains a collapsed FRUS-style source-note block with a draft
`Source:` note, a locator/page ledger, and open PDF-level checks for
classification, handling controls, drafting, clearance, distribution, marginalia,
attachments not printed, and excisions.

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
