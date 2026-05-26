# Balkans 1993-1995 Compiler Gap Register

Generated: 2026-05-26T02:23:35.625Z

## Summary

- 8 compiler-risk gaps tracked.
- 8 mitigated by a new reproducible source layer or queue.
- 0 still open after this pass.
- 1222 candidate/source leads now available for compiler review.

## Critical: State Department cable and memorandum base was thin

Status: Mitigated
Area: State Department

A FRUS volume cannot rely mainly on presidential records and public statements. State cables and memoranda are required to reconstruct diplomacy, instructions, reporting, and bureau-level decision traffic.

Mitigation: Added a reproducible State FOIA Virtual Reading Room sweep and candidate layer.

Evidence:
- The chronology itself has 12 State FOIA chronology records.
- The new State FOIA sweep queried 19 packs, fetched 940 rows from 7916 total API hits, and selected 250 candidate documents.
- State FOIA candidates add 2169 counted PDF pages for review.

Next actions:
- Review the State FOIA candidates in date order and promote standalone, in-scope cables/memoranda into the chronology after source-note verification.
- Run narrower follow-up searches by office/from-to line: BELGRADE, ZAGREB, SARAJEVO, USNATO, USUN, MOSCOW, EUR, S/S, S/P, and IO.
- Separate State public-affairs products from operational cables and memoranda.

## Critical: Large research PDFs need document-level extraction

Status: Mitigated
Area: Document Extraction

The research section contains thousands of pages of public PDFs. Until document boundaries are extracted, the compiler cannot rely on the site as a document-level chronology.

Mitigation: Added a generated extraction queue that prioritizes ranked targets with PDF hits but no selected file.

Evidence:
- 462 Clinton Digital Library research leads total 16293 counted pages.
- 107 ranked research targets still have no selected file; 22 of them have PDF hits that need human review.
- The extraction queue now starts with 20 high-priority research targets.

Next actions:
- Extract POTUS Memos, POTUS Letters, Peace Plans, Rapid Reaction Force, PCDC, UNCRO, U.N. general, Pol Mil Plan, and Intelligence Sharing files first.
- For each large packet, retain the first page as the annotation sheet and record exact source page spans.
- Only promote extracted records after duplicate review against existing PC/DC and MDR packets.

## High: NARA source-family leads need duplicate and boundary review

Status: Mitigated
Area: NARA Catalog

NARA Catalog file units may be duplicate releases, folder packets, or standalone documents. Treating them as final chronology records without review would inflate the corpus.

Mitigation: Kept NARA source-family records in the research lead layer and added a review queue.

Evidence:
- 1956 NARA Catalog/NARA Scout candidates were checked.
- 163 non-duplicate in-period PDF leads totaling 2087 pages were added.
- 135 candidates were skipped as already surfaced.

Next actions:
- Review the 1993-1995 PC/DC, PRD/PDD, Kosovo, SECDEF, and Albright file-unit leads first.
- Flag alternate releases of the same PC/DC summary before promotion.
- Extract only the relevant document pages from packet PDFs.

## High: Defense, JCS, and military implementation source base remains thin

Status: Mitigated
Area: Defense and Military Implementation

Air strikes, IFOR, no-fly-zone enforcement, lift-and-strike, and contingency planning are central to the story but are still mostly visible through State/NARA fragments and PC/DC summaries.

Mitigation: Added a dedicated Defense/JCS source-base report that aggregates military-implementation leads across BTF, State FOIA, NARA, and Clinton Library research files.

Evidence:
- 53 chronology records clearly identify Defense/JCS as their source family.
- 163 dedicated Defense/JCS and military-implementation leads now total 1664 counted pages.
- 24 of those leads come from the document-level CIA/BTF harvest; 98 come from State FOIA.

Next actions:
- Use reports/defense-jcs-source-search.json as the military-implementation review queue.
- Prioritize documents tied to PC/DC decision points, presidential calls, Deliberate Force, IFOR, UNPROFOR withdrawal, and no-fly-zone enforcement.
- Promote only standalone, non-duplicate records after source-note and attachment review.

## High: CIA/Balkan Task Force material is not document-level

Status: Mitigated
Area: Intelligence

Srebrenica, safe areas, war crimes, sanctions, and military assessments require intelligence-policy records. The site identifies the BTF collection, but it does not yet provide a document-level intelligence chronology.

Mitigation: Harvested the Clinton Library Bosnian Declassified Records collection at item level and promoted in-period standalone records into the chronology.

Evidence:
- 6 source cards mention BTF/CIA/intelligence.
- 321 document-level CIA/BTF records for 1993-1995 now add 1688 counted pages.
- 43 BTF records contain defense/military terms; 5 contain war-crimes or atrocity terms.

Next actions:
- Review the cia-btf-* chronology records for duplicate releases against existing PC/DC and MDR packets.
- Transcribe classification, attachment, and excision data from each BTF PDF before final source-note treatment.
- Keep intelligence products distinct from public statements and press guidance.

## Medium: Bosnia dominance can hide Croatia, Kosovo, Macedonia, and Serbia/Montenegro gaps

Status: Mitigated
Area: Coverage Balance

Bosnia dominates the record set. The compiler needs explicit counters and queues so Croatia/Krajina, Kosovo, Macedonia, Serbia/Montenegro, and Eastern Slavonia are not missed.

Mitigation: Added topic counters to the gap register and State FOIA/NARA candidate layers with Kosovo, Macedonia, Krajina, and Croatia search packs.

Evidence:
- Chronology term counts: Bosnia 834, Croatia 173, Serbia/Montenegro 240, Kosovo 7, Macedonia 50.
- State FOIA candidate term counts: Croatia 110, Kosovo 20, Macedonia 20, Serbia/Montenegro 207.
- Public Papers contribute 446 records, so topic counts must distinguish public context from archival decision records.

Next actions:
- Filter candidate leads by Croatia/Krajina, Kosovo, Macedonia, and Serbia/Montenegro before promoting any more Bosnia records.
- Build separate candidate bundles for Z-4/Eastern Slavonia, Kosovo/Macedonia spillover, and Belgrade sanctions diplomacy.
- Keep public-statement counts separate from archival-policy counts in compiler decisions.

## Medium: Memcon/telcon completeness still depends on schedule and call-log reconciliation

Status: Mitigated
Area: Presidential Conversations

The current memcon/telcon inventory is strong, but completeness requires checking schedule/call-log evidence for missing, withheld, or not-yet-digitized conversations.

Mitigation: Added a presidential conversation reconciliation matrix that links known memcons/telcons to schedule and call-log folder leads.

Evidence:
- 32 memcon/telcon chronology records are present.
- Conversation years: {"1993":{"count":6,"pages":24},"1994":{"count":3,"pages":14},"1995":{"count":23,"pages":128}}.
- 65 schedule/call folder leads are now surfaced for absence/withheld-record checks.
- 26 Presidential Daily Diary call/meeting references now support date-by-date reconciliation.

Next actions:
- Use reports/presidential-conversation-reconciliation.json for date-by-date schedule checks.
- Use reports/presidential-daily-diary-search.json to cross-check source-image references for known and possible no-document calls or meetings.
- Mark known no-document or withheld conversations as source gaps, not absent events.
- Record Washington time when available.

## Medium: Draft source notes still need FRUS-level verification

Status: Mitigated
Area: Source Notes

The page uses FRUS-style source-note stems, but final FRUS treatment requires PDF-level verification of markings, attachments, marginalia, distribution, and excisions.

Mitigation: Added a source-note verification audit that checks FRUS-style source-note patterns, page accounting, and remaining transcription queues.

Evidence:
- 901 chronology/conversation records have source notes.
- 0 source notes contain raw URLs or old verification prose.
- 351 records remain in the classification/handling transcription queue.

Next actions:
- Use reports/source-note-verification-audit.json as the source-note finalization queue.
- For State cables, verify cable number, TAGS/SUBJECT, from/to line, and distribution before final source-note clearance.
- Track attachments-not-printed and wholly withheld cross-references separately.

