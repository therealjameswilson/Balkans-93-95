# Balkans 1993-1995 Compiler Gap Register

Generated: 2026-05-23T13:51:03.686Z

## Summary

- 8 compiler-risk gaps tracked.
- 4 mitigated by a new reproducible source layer or queue.
- 4 still open after this pass.
- 875 candidate leads now sit outside the chronology for compiler review.

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

Status: Open
Area: Defense and Military Implementation

Air strikes, IFOR, no-fly-zone enforcement, lift-and-strike, and contingency planning are central to the story but are still mostly visible through State/NARA fragments and PC/DC summaries.

Mitigation: Added the Defense/JCS source pool to the gap register and extraction queue criteria.

Evidence:
- 17 chronology records clearly identify Defense/JCS as their source family.
- 52 candidate leads contain military implementation terms.
- No dedicated Defense/JCS public release report exists yet in this repository.

Next actions:
- Run NARA Catalog searches for SECDEF, JCS, OSD, Deliberate Force, IFOR, no-fly zone, OPLAN, and withdrawal planning.
- Prioritize documents tied to PC/DC decision points and presidential calls.
- Add a Defense/JCS report before claiming the military implementation gap is closed.

## High: CIA/Balkan Task Force material is not document-level

Status: Open
Area: Intelligence

Srebrenica, safe areas, war crimes, sanctions, and military assessments require intelligence-policy records. The site identifies the BTF collection, but it does not yet provide a document-level intelligence chronology.

Mitigation: Added CIA/BTF to the source-pool register and tied it to the document-boundary extraction workflow.

Evidence:
- 5 source cards mention BTF/CIA/intelligence.
- 29 research leads contain BTF/CIA/intelligence terms.
- 47 chronology records touch war-crimes or atrocity themes, but most are public or NSC/PCDC records.

Next actions:
- Harvest the BTF collection at item level and separate intelligence assessments, situation reports, and policy memos.
- Cross-check CIA Reading Room and NARA Catalog for Balkan Task Force, Srebrenica, safe area, and war-crimes terms.
- Keep intelligence products distinct from public statements and press guidance.

## Medium: Bosnia dominance can hide Croatia, Kosovo, Macedonia, and Serbia/Montenegro gaps

Status: Mitigated
Area: Coverage Balance

Bosnia dominates the record set. The compiler needs explicit counters and queues so Croatia/Krajina, Kosovo, Macedonia, Serbia/Montenegro, and Eastern Slavonia are not missed.

Mitigation: Added topic counters to the gap register and State FOIA/NARA candidate layers with Kosovo, Macedonia, Krajina, and Croatia search packs.

Evidence:
- Chronology term counts: Bosnia 513, Croatia 123, Serbia/Montenegro 204, Kosovo 7, Macedonia 48.
- State FOIA candidate term counts: Croatia 110, Kosovo 20, Macedonia 20, Serbia/Montenegro 207.
- Public Papers contribute 446 records, so topic counts must distinguish public context from archival decision records.

Next actions:
- Filter candidate leads by Croatia/Krajina, Kosovo, Macedonia, and Serbia/Montenegro before promoting any more Bosnia records.
- Build separate candidate bundles for Z-4/Eastern Slavonia, Kosovo/Macedonia spillover, and Belgrade sanctions diplomacy.
- Keep public-statement counts separate from archival-policy counts in compiler decisions.

## Medium: Memcon/telcon completeness still depends on schedule and call-log reconciliation

Status: Open
Area: Presidential Conversations

The current memcon/telcon inventory is strong, but completeness requires checking schedule/call-log evidence for missing, withheld, or not-yet-digitized conversations.

Mitigation: The gap register keeps this as an explicit production task rather than implying the conversation layer is complete.

Evidence:
- 32 memcon/telcon chronology records are present.
- Conversation years: {"1993":{"count":6,"pages":24},"1994":{"count":3,"pages":14},"1995":{"count":23,"pages":128}}.
- 7 source cards point to schedule/call verification sources.

Next actions:
- Reconcile each presidential call/meeting against daily schedules and foreign leader call lists.
- Mark known no-document or withheld conversations in the chronology as source gaps, not absent events.
- Record Washington time when available.

## Medium: Draft source notes still need FRUS-level verification

Status: Open
Area: Source Notes

The page uses FRUS-style source-note stems, but final FRUS treatment requires PDF-level verification of markings, attachments, marginalia, distribution, and excisions.

Mitigation: Every candidate layer now carries a source-note draft and verification warning; the gap register turns remaining verification into an explicit queue.

Evidence:
- 549 chronology records have source-note drafts.
- 250 State FOIA candidates and 163 NARA source-family candidates have source-note drafts.
- 77 extracted chronology PDFs append source packet page 1 as an annotation sheet.

Next actions:
- Open each promoted PDF and verify classification, handling controls, drafting, clearance, addressees, attachments, annotations, and excision accounting.
- For State cables, verify cable number, TAGS/SUBJECT, from/to line, and distribution before source-note finalization.
- Track attachments-not-printed and wholly withheld cross-references separately.

