#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "compiler-map.json");
const DATA_JS_PATH = path.join(ROOT, "data", "compiler-map.js");
const REPORT_PATH = path.join(ROOT, "reports", "document-page-counts.json");
const CONVERSATION_REPORT_PATH = path.join(ROOT, "reports", "conversation-page-counts.json");
const CACHE_DIR = path.join("/private/tmp", "balkans-93-95-conversation-pdfs");

const PACKETS = {
  pcDc20100533: {
    identifier: "2010-0533-M",
    collection: "Declassified Documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/36614",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/dca58d1ec9f1ee6508cb03fc7ae5c98f.pdf",
    cacheName: "2010-0533-M-pc-dc-bosnia.pdf",
    repository: "William J. Clinton Presidential Library, Clinton Digital Library"
  },
  bosnia20110964: {
    identifier: "2011-0964-M",
    collection: "Declassified Documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/36589",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/1e07f85597e7a0a171bbd0b1ad67cdf1.pdf",
    cacheName: "2011-0964-M-bosnia.pdf",
    repository: "William J. Clinton Presidential Library, Clinton Digital Library"
  },
  dayton20120799: {
    identifier: "2012-0799-M",
    collection: "Declassified Documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/36591",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/eb29cdb4aad08354ef620554cda41298.pdf",
    cacheName: "2012-0799-M-getting-to-dayton.pdf",
    repository: "William J. Clinton Presidential Library, Clinton Digital Library"
  },
  allied20130517: {
    identifier: "2013-0517-M",
    collection: "Declassified documents concerning Bosnia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/101088",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/9a9ec5fd06f06d2069a286cf7c02fc03.pdf",
    cacheName: "2013-0517-M-allied-leaders.pdf",
    repository: "William J. Clinton Presidential Library, Clinton Digital Library"
  },
  croatia20140311: {
    identifier: "2014-0311-M",
    collection: "Declassified Documents Concerning Croatia",
    itemUrl: "https://clinton.presidentiallibraries.us/items/show/57229",
    sourcePdfUrl: "https://clinton.presidentiallibraries.us/files/original/8ca82ec60f1a687eac595b0564ff674c.pdf",
    cacheName: "2014-0311-M-croatia.pdf",
    repository: "William J. Clinton Presidential Library, Clinton Digital Library"
  },
  yeltsin20140948: {
    identifier: "2014-0948-M / NAID 163545436",
    collection: "National Archives Catalog / Clinton NSC Records Management Office",
    itemUrl: "https://catalog.archives.gov/id/163545436",
    sourcePdfUrl: "https://s3.amazonaws.com/NARAprodstorage/lz/presidential-libraries/clinton/wjc-nscrm/7585721/7-YeltsinHydePark.pdf",
    cacheName: "2014-0948-M-yeltsin-hyde-park.pdf",
    repository: "National Archives and Records Administration, National Archives Catalog"
  }
};

const CONVERSATION_EXTRACTS = [
  {
    id: "izetbegovic-1993-09-08",
    packet: "bosnia20110964",
    pages: "10-15",
    date: "Sep 8, 1993",
    sortDate: "1993-09-08",
    kind: "Memcon",
    title: "Memorandum of Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Bosnia and Herzegovina", "Safe areas", "Negotiations", "Refugees"],
    compilerUse: "Presidential meeting lead for the 1993 Bosnia review after Vance-Owen and before the 1994 federation track.",
    tags: ["Izetbegovic", "Presidential diplomacy", "1993"]
  },
  {
    id: "izetbegovic-1994-09-25",
    packet: "bosnia20110964",
    pages: "18-25",
    date: "Sep 25, 1994",
    sortDate: "1994-09-25",
    kind: "Memcon",
    title: "Memorandum of Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Bosnia and Herzegovina", "Contact Group", "Federation", "Sanctions"],
    compilerUse: "Mid-1994 presidential meeting lead for Contact Group diplomacy and the Bosnian government's posture before Bihac.",
    tags: ["Izetbegovic", "Contact Group", "Federation"]
  },
  {
    id: "izetbegovic-tudjman-1994-12-05",
    packet: "bosnia20110964",
    pages: "27-29",
    date: "Dec 5, 1994",
    sortDate: "1994-12-05",
    kind: "Memcon",
    title: "Memorandum of Conversation - Presidents Izetbegovic and Tudjman",
    counterpart: "Alija Izetbegovic; Franjo Tudjman",
    subjects: ["Bosnia and Herzegovina", "Croatia", "Bihac", "Federation"],
    compilerUse: "Regional presidential meeting for the late-1994 Bihac crisis and the Bosniak-Croat federation relationship.",
    tags: ["Izetbegovic", "Tudjman", "Bihac", "Croatia"]
  },
  {
    id: "izetbegovic-1995-07-20",
    packet: "bosnia20110964",
    pages: "32-34",
    date: "Jul 20, 1995",
    sortDate: "1995-07-20",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Clinton and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Srebrenica", "Bosnia and Herzegovina", "Air strikes", "London meeting"],
    compilerUse: "Direct post-Srebrenica presidential call with the Bosnian president on air power and allied diplomacy.",
    tags: ["Izetbegovic", "Srebrenica", "Air power", "Telcon"]
  },
  {
    id: "izetbegovic-tudjman-1995-10-24",
    packet: "bosnia20110964",
    pages: "37-43",
    date: "Oct 24, 1995",
    sortDate: "1995-10-24",
    kind: "Memcon",
    title: "Memorandum of Conversation - Presidents Izetbegovic and Tudjman",
    counterpart: "Alija Izetbegovic; Franjo Tudjman",
    subjects: ["Dayton preparations", "Bosnia and Herzegovina", "Croatia", "Yeltsin"],
    compilerUse: "Pre-Dayton meeting that links Bosnian-Croatian coordination to Clinton's Hyde Park discussion with Yeltsin.",
    tags: ["Izetbegovic", "Tudjman", "Dayton", "Russia"]
  },
  {
    id: "quadrilateral-1995-12-14",
    packet: "bosnia20110964",
    pages: "47-50",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Quadrilateral Meeting with Tudjman, Izetbegovic, and Milosevic",
    counterpart: "Franjo Tudjman; Alija Izetbegovic; Slobodan Milosevic",
    subjects: ["Paris signing", "Dayton implementation", "IFOR", "Eastern Slavonia"],
    compilerUse: "Signing-day quadrilateral memcon for Dayton implementation, IFOR, Eastern Slavonia, and regional assurances.",
    tags: ["Paris signing", "Dayton", "Izetbegovic", "Milosevic", "Tudjman"]
  },
  {
    id: "tudjman-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "52-53",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Franjo Tudjman",
    counterpart: "Franjo Tudjman",
    subjects: ["Eastern Slavonia", "Dayton implementation", "Croatia", "War crimes"],
    compilerUse: "Signing-day Croatia pull-aside for Eastern Slavonia and implementation issues adjacent to the Bosnia settlement.",
    tags: ["Tudjman", "Croatia", "Paris signing", "Pull-aside"]
  },
  {
    id: "izetbegovic-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "55-57",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Paris signing", "Dayton implementation", "IFOR", "Sarajevo"],
    compilerUse: "Signing-day Bosnian pull-aside on IFOR safety, Sarajevo, federation politics, and implementation risks.",
    tags: ["Izetbegovic", "Paris signing", "Dayton", "Pull-aside"]
  },
  {
    id: "milosevic-1995-12-14-pull-aside",
    packet: "bosnia20110964",
    pages: "59-61",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "Memcon",
    title: "Memorandum of Conversation - Pull-Aside with President Slobodan Milosevic",
    counterpart: "Slobodan Milosevic",
    subjects: ["Paris signing", "Dayton implementation", "Sarajevo", "Federal Republic of Yugoslavia"],
    compilerUse: "Signing-day Milosevic pull-aside for implementation discipline, Sarajevo, and post-Dayton normalization pressure.",
    tags: ["Milosevic", "Paris signing", "Dayton", "Pull-aside"]
  },
  {
    id: "christopher-de-charette-1995-07-19",
    packet: "allied20130517",
    pages: "2-4",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Secretary Christopher and Foreign Minister de Charette",
    counterpart: "Herve de Charette",
    subjects: ["Bosnia", "Gorazde", "London meeting", "France"],
    compilerUse: "Secretary-level French telcon for the London meeting and allied negotiation over Gorazde after Srebrenica.",
    tags: ["Christopher", "de Charette", "France", "London meeting"]
  },
  {
    id: "kohl-1995-07-13",
    packet: "allied20130517",
    pages: "35-37",
    date: "Jul 13, 1995",
    sortDate: "1995-07-13",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Chancellor Helmut Kohl of Germany",
    counterpart: "Helmut Kohl",
    subjects: ["Srebrenica", "UNPROFOR", "Bosnia", "Chirac"],
    compilerUse: "Post-Srebrenica allied telcon with Kohl on UNPROFOR, Chirac's proposal, and German support.",
    tags: ["Germany", "Kohl", "Srebrenica", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-13",
    packet: "allied20130517",
    pages: "51-55",
    date: "Jul 13, 1995",
    sortDate: "1995-07-13",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Srebrenica", "UNPROFOR", "Bosnia", "Ground forces"],
    compilerUse: "Immediate Srebrenica crisis telcon with Chirac on ground-force options, UNPROFOR, and the arms embargo.",
    tags: ["France", "Chirac", "Srebrenica", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-19",
    packet: "allied20130517",
    pages: "66-71",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Gorazde", "Air strikes", "Bosnia", "London meeting"],
    compilerUse: "Allied telcon on the eve of the London meeting, warning options, air power, and French ground-force concerns.",
    tags: ["France", "Chirac", "Gorazde", "Air power"]
  },
  {
    id: "major-1995-07-19",
    packet: "allied20130517",
    pages: "76-83",
    date: "Jul 19, 1995",
    sortDate: "1995-07-19",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - Prime Minister John Major of the United Kingdom",
    counterpart: "John Major",
    subjects: ["Gorazde", "UNPROFOR", "Bosnia", "Chirac"],
    compilerUse: "British telcon aligning positions after Clinton's Chirac call and before the London meeting.",
    tags: ["United Kingdom", "Major", "London meeting", "UNPROFOR"]
  },
  {
    id: "chirac-1995-07-20",
    packet: "allied20130517",
    pages: "93-95",
    date: "Jul 20, 1995",
    sortDate: "1995-07-20",
    kind: "Telcon",
    title: "Memorandum of Telephone Conversation - President Jacques Chirac of France",
    counterpart: "Jacques Chirac",
    subjects: ["Gorazde", "Air strikes", "Bosnia", "London meeting"],
    compilerUse: "Follow-up Chirac telcon during the London meeting window on red lines, airstrikes, and Islamic-world reaction.",
    tags: ["France", "Chirac", "London meeting", "Air power"]
  },
  {
    id: "yeltsin-1995-10-23-hyde-park-one-on-one",
    packet: "yeltsin20140948",
    pages: "5-16",
    date: "Oct 23, 1995",
    sortDate: "1995-10-23",
    kind: "Memcon",
    title: "Memorandum of Conversation - Clinton-Yeltsin One-on-One at Hyde Park",
    counterpart: "Boris Yeltsin",
    subjects: ["Bosnia implementation force", "Russia-NATO", "IFOR", "CFE", "Hyde Park"],
    compilerUse: "Extracted one-on-one memcon for Russian participation in post-Dayton peace implementation and NATO command arrangements.",
    tags: ["Russia", "Yeltsin", "Hyde Park", "IFOR", "NAID 163545436"]
  },
  {
    id: "yeltsin-1995-10-23-hyde-park-lunch",
    packet: "yeltsin20140948",
    pages: "31-35",
    date: "Oct 23, 1995",
    sortDate: "1995-10-23",
    kind: "Memcon",
    title: "Memorandum of Conversation - Lunch with President Boris Yeltsin",
    counterpart: "Boris Yeltsin",
    subjects: ["Bosnia implementation force", "Russia-NATO", "IFOR", "Hyde Park"],
    compilerUse: "Extracted Hyde Park lunch memcon continuing the Bosnia implementation discussion after the one-on-one.",
    tags: ["Russia", "Yeltsin", "Hyde Park", "IFOR", "NAID 163545436"]
  }
];

const BROAD_EXTRACTS = [
  {
    id: "gore-izetbegovic-1993-04-14",
    packet: "bosnia20110964",
    pages: "3-7",
    date: "Apr 14, 1993",
    sortDate: "1993-04-14",
    kind: "Memcon",
    documentScope: "Vice presidential conversation",
    title: "Memorandum of Conversation - Vice President Gore and President Alija Izetbegovic",
    counterpart: "Alija Izetbegovic",
    subjects: ["Bosnia and Herzegovina", "Vance-Owen plan", "Eastern Bosnia", "Croatia"],
    compilerUse: "Administration-level conversation lead for the April 1993 policy setting immediately before Clinton's Oval Office discussion with Izetbegovic.",
    tags: ["Gore", "Izetbegovic", "Administration conversation", "1993"]
  },
  {
    id: "pcdc-1993-02-27-ex-yugoslavia-work-program",
    packet: "pcDc20100533",
    pages: "2",
    date: "Feb 27, 1993",
    sortDate: "1993-02-27",
    kind: "Policy Memo",
    title: "Ex-Yugoslavia Work Program",
    subjects: ["Vance-Owen plan", "NATO implementation", "Humanitarian access"],
    compilerUse: "Deputies Committee work program for enforcement, NATO planning, and Vance-Owen analysis.",
    tags: ["Deputies Committee", "Work program", "1993"]
  },
  {
    id: "pcdc-1993-03-01-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "3-4",
    date: "Mar 1, 1993",
    sortDate: "1993-03-01",
    kind: "NSC Summary",
    title: "Summary of Conclusions, Deputies Committee Meeting on Bosnia",
    subjects: ["Airdrop operations", "Humanitarian relief", "Russian participation"],
    compilerUse: "Deputies-level conclusions from the February 26 Bosnia meeting.",
    tags: ["Deputies Committee", "Bosnia", "1993"]
  },
  {
    id: "pcdc-1993-03-04-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "5-6",
    date: "Mar 4, 1993",
    sortDate: "1993-03-04",
    kind: "NSC Summary",
    title: "Summary of Conclusions, Deputies Committee Meeting on Bosnia",
    subjects: ["Sanctions", "Bosnia initiative", "Vance-Owen plan"],
    compilerUse: "Early Deputies conclusions on strengthening sanctions and testing diplomatic options.",
    tags: ["Deputies Committee", "Sanctions", "1993"]
  },
  {
    id: "pcdc-1993-03-15-bosnia-summary",
    packet: "pcDc20100533",
    pages: "7-8",
    date: "Mar 15, 1993",
    sortDate: "1993-03-15",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Humanitarian situation", "Sarajevo", "Tuzla"],
    compilerUse: "Interagency conclusions on Bosnia humanitarian and possible Sarajevo/Tuzla initiatives.",
    tags: ["NSC", "Humanitarian", "Sarajevo"]
  },
  {
    id: "pcdc-1993-03-24-bosnia-summary",
    packet: "pcDc20100533",
    pages: "9",
    date: "Mar 24, 1993",
    sortDate: "1993-03-24",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Sanctions", "Vance-Owen plan", "UN"],
    compilerUse: "March 1993 White House summary on Bosnia policy coordination.",
    tags: ["NSC", "Bosnia", "1993"]
  },
  {
    id: "pcdc-1993-03-30-bosnia-summary",
    packet: "pcDc20100533",
    pages: "10-11",
    date: "Mar 30, 1993",
    sortDate: "1993-03-30",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Sanctions", "Izetbegovic meeting", "Press strategy"],
    compilerUse: "Late-March White House conclusions covering sanctions and Vice President Gore's Izetbegovic meeting.",
    tags: ["NSC", "Sanctions", "Izetbegovic"]
  },
  {
    id: "pcdc-1993-04-09-bosnia-summary",
    packet: "pcDc20100533",
    pages: "12",
    date: "Apr 9, 1993",
    sortDate: "1993-04-09",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Bosnia policy", "Sanctions", "Military options"],
    compilerUse: "April 1993 interagency conclusions for the Bosnia review.",
    tags: ["NSC", "Bosnia", "1993"]
  },
  {
    id: "pcdc-1993-04-19-bosnia-summary",
    packet: "pcDc20100533",
    pages: "13-14",
    date: "Apr 19, 1993",
    sortDate: "1993-04-19",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Peace process", "Kozyrev", "Policy options"],
    compilerUse: "White House summary on Bosnia peace-process options after the April 1993 review.",
    tags: ["NSC", "Peace process", "Russia"]
  },
  {
    id: "pcdc-1993-05-06-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "15-16",
    date: "May 6, 1993",
    sortDate: "1993-05-06",
    kind: "NSC Summary",
    title: "Summary of Conclusions, Principals Committee Meeting on Bosnia",
    subjects: ["Eastern Bosnia", "Safe havens", "Allied diplomacy"],
    compilerUse: "Principals Committee conclusions on safe havens and allied pressure.",
    tags: ["Principals Committee", "Safe havens", "1993"]
  },
  {
    id: "pcdc-1993-05-08-bosnia-principals-with-president",
    packet: "pcDc20100533",
    pages: "17-18",
    date: "May 8, 1993",
    sortDate: "1993-05-08",
    kind: "NSC Summary",
    title: "Decisions of Principals Committee Meeting with the President and Vice President on Bosnia",
    subjects: ["Serbia-Bosnia border", "Macedonia", "Air power", "Congressional consultations"],
    compilerUse: "Presidential-level decisions on containment, pressure on Serbia, and air-power review.",
    tags: ["President Clinton", "Principals Committee", "Air power"]
  },
  {
    id: "pcdc-1993-05-17-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "19-20",
    date: "May 17, 1993",
    sortDate: "1993-05-17",
    kind: "NSC Summary",
    title: "Decisions of Principals Committee Meeting on Bosnia",
    subjects: ["UN Security Council", "UNPROFOR", "Air support"],
    compilerUse: "Principals Committee decisions on UN Security Council diplomacy and air support for UNPROFOR.",
    tags: ["Principals Committee", "UNPROFOR", "Air support"]
  },
  {
    id: "pcdc-1993-09-01-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "21-23",
    date: "Sep 1, 1993",
    sortDate: "1993-09-01",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Settlement implementation", "Sanctions", "War crimes tribunal"],
    compilerUse: "Principals Committee conclusions before the September 1993 Clinton-Izetbegovic meeting.",
    tags: ["Principals Committee", "Sanctions", "War crimes"]
  },
  {
    id: "pcdc-1993-09-20-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "24-25",
    date: "Sep 20, 1993",
    sortDate: "1993-09-20",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Congressional strategy", "Implementation", "Sanctions"],
    compilerUse: "Principals Committee conclusions on Bosnia settlement, implementation, and congressional support.",
    tags: ["Principals Committee", "Congress", "1993"]
  },
  {
    id: "pcdc-1993-10-02-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "26-27",
    date: "Oct 2, 1993",
    sortDate: "1993-10-02",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Sanctions", "UNPAs", "SACEUR"],
    compilerUse: "Principals Committee conclusions on Serbia sanctions, Croatia UNPAs, and NATO command issues.",
    tags: ["Principals Committee", "Croatia", "SACEUR"]
  },
  {
    id: "pcdc-1993-10-19-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "28",
    date: "Oct 19, 1993",
    sortDate: "1993-10-19",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Bosnia", "UNPROFOR", "NATO"],
    compilerUse: "October 1993 Principals Committee conclusions on Bosnia.",
    tags: ["Principals Committee", "Bosnia", "1993"]
  },
  {
    id: "pcdc-1993-10-28-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "29-30",
    date: "Oct 28, 1993",
    sortDate: "1993-10-28",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Deputies Committee Meeting on Bosnia",
    subjects: ["UNPROFOR", "Humanitarian corridor", "Air support"],
    compilerUse: "Deputies Committee conclusions on military requirements for humanitarian corridors through Bosnia.",
    tags: ["Deputies Committee", "Humanitarian corridor", "Air support"]
  },
  {
    id: "pcdc-1993-11-16-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "31-32",
    date: "Nov 16, 1993",
    sortDate: "1993-11-16",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Deputies Committee Meeting on Bosnia",
    subjects: ["Humanitarian relief", "Serbia relief", "European diplomacy"],
    compilerUse: "Deputies Committee conclusions following European discussions on humanitarian leverage.",
    tags: ["Deputies Committee", "Humanitarian", "1993"]
  },
  {
    id: "pcdc-1994-02-18-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "33-35",
    date: "Feb 18, 1994",
    sortDate: "1994-02-18",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Sarajevo ultimatum", "NATO", "Counter-battery radar", "Congress"],
    compilerUse: "Principals Committee conclusions in the Sarajevo ultimatum period.",
    tags: ["Principals Committee", "Sarajevo", "NATO"]
  },
  {
    id: "pcdc-1994-02-28-bosnia-summary",
    packet: "pcDc20100533",
    pages: "36-37",
    date: "Feb 28, 1994",
    sortDate: "1994-02-28",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Sarajevo", "Congressional consultations", "Public affairs"],
    compilerUse: "White House conclusions on Bosnia following the Sarajevo crisis.",
    tags: ["NSC", "Sarajevo", "Congress"]
  },
  {
    id: "pcdc-1994-03-08-bosnia-summary",
    packet: "pcDc20100533",
    pages: "38-39",
    date: "Mar 8, 1994",
    sortDate: "1994-03-08",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["UNPROFOR", "Eastern Europe", "Force contributions"],
    compilerUse: "White House conclusions on UNPROFOR support and prospective troop contributors.",
    tags: ["NSC", "UNPROFOR", "1994"]
  },
  {
    id: "pcdc-1994-04-10-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "40-41",
    date: "Apr 10, 1994",
    sortDate: "1994-04-10",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Gorazde", "Aviano Group", "NATO air action"],
    compilerUse: "Principals Committee conclusions during the Gorazde crisis.",
    tags: ["Principals Committee", "Gorazde", "NATO"]
  },
  {
    id: "pcdc-1994-04-18-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "42-43",
    date: "Apr 18, 1994",
    sortDate: "1994-04-18",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Gorazde", "Exclusion zone", "UN"],
    compilerUse: "Principals Committee conclusions on Gorazde, exclusion zones, and UN posture.",
    tags: ["Principals Committee", "Gorazde", "UN"]
  },
  {
    id: "pcdc-1994-04-23-bosnia-principals-1700",
    packet: "pcDc20100533",
    pages: "44",
    date: "Apr 23, 1994",
    sortDate: "1994-04-23",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia, 5:00 p.m.",
    subjects: ["Gorazde", "NATO air strikes", "Joulwan"],
    compilerUse: "Short presidential Principals Committee summary on timing of NATO air strikes.",
    tags: ["President Clinton", "Principals Committee", "Gorazde"]
  },
  {
    id: "pcdc-1994-04-23-bosnia-principals-1330",
    packet: "pcDc20100533",
    pages: "45-46",
    date: "Apr 23, 1994",
    sortDate: "1994-04-23",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia, 1:30 p.m.",
    subjects: ["Gorazde", "NATO ultimatum", "UN Secretary-General"],
    compilerUse: "Principals Committee conclusions on Gorazde and NATO response conditions.",
    tags: ["Principals Committee", "Gorazde", "NATO"]
  },
  {
    id: "pcdc-1994-05-20-bosnia-summary",
    packet: "pcDc20100533",
    pages: "47-48",
    date: "May 20, 1994",
    sortDate: "1994-05-20",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Negotiations", "Sanctions", "Skopje", "Athens"],
    compilerUse: "White House conclusions on negotiations and economic sanctions violations.",
    tags: ["NSC", "Sanctions", "Macedonia"]
  },
  {
    id: "pcdc-1994-05-31-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "49-50",
    date: "May 31, 1994",
    sortDate: "1994-05-31",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Contact Group", "51-49 territorial division", "Bosnian government"],
    compilerUse: "Principals Committee conclusions on the Contact Group's territorial proposal.",
    tags: ["Principals Committee", "Contact Group", "Territory"]
  },
  {
    id: "pcdc-1994-07-27-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "51-52",
    date: "Jul 27, 1994",
    sortDate: "1994-07-27",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Sanctions tightening", "Milosevic", "Bosnian Serbs"],
    compilerUse: "Principals Committee conclusions on sanctions tightening and separating Milosevic from the Bosnian Serbs.",
    tags: ["Principals Committee", "Milosevic", "Sanctions"]
  },
  {
    id: "pcdc-1994-08-10-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "53-54",
    date: "Aug 10, 1994",
    sortDate: "1994-08-10",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Sanctions", "Arms embargo", "Nunn-Mitchell"],
    compilerUse: "Principals Committee conclusions on sanctions tightening and the arms embargo.",
    tags: ["Principals Committee", "Arms embargo", "Sanctions"]
  },
  {
    id: "pcdc-1994-08-17-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "55-57",
    date: "Aug 17, 1994",
    sortDate: "1994-08-17",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Milosevic", "Arms embargo", "Macedonia"],
    compilerUse: "Principals Committee conclusions on the Serbia-Bosnia border closure, arms embargo planning, and Macedonia.",
    tags: ["Principals Committee", "Arms embargo", "Macedonia"]
  },
  {
    id: "pcdc-1994-09-13-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "58-59",
    date: "Sep 13, 1994",
    sortDate: "1994-09-13",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Arms embargo", "Military planning", "Allied consultations"],
    compilerUse: "Principals Committee conclusions on arms embargo lift planning before Izetbegovic's September visit.",
    tags: ["Principals Committee", "Arms embargo", "1994"]
  },
  {
    id: "pcdc-1994-10-18-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "60-61",
    date: "Oct 18, 1994",
    sortDate: "1994-10-18",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Arms embargo", "Congress", "Contact Group"],
    compilerUse: "Principals Committee conclusions on arms embargo strategy and consultations with Bosnians and Congress.",
    tags: ["Principals Committee", "Congress", "Arms embargo"]
  },
  {
    id: "pcdc-1994-11-07-bosnia-summary",
    packet: "pcDc20100533",
    pages: "62-64",
    date: "Nov 7, 1994",
    sortDate: "1994-11-07",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Nunn-Mitchell", "Military operations", "Congressional consultations"],
    compilerUse: "White House conclusions on Nunn-Mitchell, consultations, and military operations.",
    tags: ["NSC", "Nunn-Mitchell", "Congress"]
  },
  {
    id: "pcdc-1994-11-17-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "65-66",
    date: "Nov 17, 1994",
    sortDate: "1994-11-17",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Bihac", "Triggers", "Bosnian Serb offensive"],
    compilerUse: "Principals Committee conclusions on Bihac trigger conditions.",
    tags: ["Principals Committee", "Bihac", "Triggers"]
  },
  {
    id: "pcdc-1994-11-28-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "67-70",
    date: "Nov 28, 1994",
    sortDate: "1994-11-28",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Bihac", "Short-term strategy", "Nunn-Mitchell", "NATO ground operations"],
    compilerUse: "Principals Committee conclusions for the late-1994 Bihac crisis and short-term Bosnia strategy.",
    tags: ["Principals Committee", "Bihac", "NATO"]
  },
  {
    id: "pcdc-1994-12-12-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "71-73",
    date: "Dec 12, 1994",
    sortDate: "1994-12-12",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["UNPROFOR", "NATO withdrawal planning", "Congressional strategy"],
    compilerUse: "Principals Committee conclusions on UNPROFOR status and NATO withdrawal planning.",
    tags: ["Principals Committee", "UNPROFOR", "Withdrawal"]
  },
  {
    id: "pcdc-1994-12-19-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "74-76",
    date: "Dec 19, 1994",
    sortDate: "1994-12-19",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Deputies Committee Meeting on Bosnia",
    subjects: ["Negotiations", "UNPROFOR", "Public affairs"],
    compilerUse: "Deputies Committee conclusions on negotiations and retaining/strengthening UNPROFOR.",
    tags: ["Deputies Committee", "UNPROFOR", "1994"]
  },
  {
    id: "pcdc-1995-01-20-former-yugoslavia-principals-summary",
    packet: "pcDc20100533",
    pages: "77-79",
    date: "Jan 20, 1995",
    sortDate: "1995-01-20",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Former Yugoslavia",
    subjects: ["Bosnia", "Croatia", "UNPROFOR", "Silajdzic visit"],
    compilerUse: "Principals Committee conclusions on Bosnia, Croatia, and UNPROFOR immediately before the Silajdzic visit.",
    tags: ["Principals Committee", "Croatia", "UNPROFOR"]
  },
  {
    id: "pcdc-1995-05-09-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "80-82",
    date: "May 9, 1995",
    sortDate: "1995-05-09",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Deputies Committee Meeting on Bosnia",
    subjects: ["Croatia", "Milosevic", "NATO OPLAN", "Sanctions relief"],
    compilerUse: "Deputies Committee conclusions after Croatia's May 1995 offensive and amid Bosnia sanctions planning.",
    tags: ["Deputies Committee", "Croatia", "Milosevic"]
  },
  {
    id: "pcdc-1995-05-23-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "83-84",
    date: "May 23, 1995",
    sortDate: "1995-05-23",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["UN", "Contact Group", "Milosevic", "Bosnian Serbs"],
    compilerUse: "Principals Committee conclusions on UN and Contact Group diplomacy in May 1995.",
    tags: ["Principals Committee", "Contact Group", "Milosevic"]
  },
  {
    id: "pcdc-1995-08-01-bosnia-summary",
    packet: "pcDc20100533",
    pages: "85-86",
    date: "Aug 1, 1995",
    sortDate: "1995-08-01",
    kind: "NSC Summary",
    title: "Summary of Conclusions on Bosnia",
    subjects: ["Srebrenica aftermath", "Bildt-Milosevic package", "Gorazde"],
    compilerUse: "August 1995 conclusions after Srebrenica and before the endgame strategy review.",
    tags: ["NSC", "Srebrenica", "Milosevic"]
  },
  {
    id: "pcdc-1995-08-15-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "87-88",
    date: "Aug 15, 1995",
    sortDate: "1995-08-15",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Geneva", "Implementation", "Economic reconstruction"],
    compilerUse: "Principals Committee conclusions on settlement negotiations and implementation planning.",
    tags: ["Principals Committee", "Dayton track", "Implementation"]
  },
  {
    id: "pcdc-1995-08-22-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "89-90",
    date: "Aug 22, 1995",
    sortDate: "1995-08-22",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Territorial adjustments", "Mutual recognition", "Federation"],
    compilerUse: "Principals Committee conclusions defining elements of the Bosnia settlement strategy.",
    tags: ["Principals Committee", "Settlement", "Federation"]
  },
  {
    id: "pcdc-1995-08-23-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "91-95",
    date: "Aug 23, 1995",
    sortDate: "1995-08-23",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Deputies Committee Meeting on Bosnia",
    subjects: ["Settlement implementation", "Bosniak-Croat Federation", "Arms limitations", "Peace implementation force"],
    compilerUse: "Deputies Committee conclusions on the implementation design for a Bosnia settlement.",
    tags: ["Deputies Committee", "Implementation", "Peace force"]
  },
  {
    id: "pcdc-1995-09-11-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "96-97",
    date: "Sep 11, 1995",
    sortDate: "1995-09-11",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Operation Deliberate Force", "Sarajevo marketplace", "Milosevic"],
    compilerUse: "Principals Committee conclusions during NATO bombing and the diplomatic endgame.",
    tags: ["Principals Committee", "Deliberate Force", "Sarajevo"]
  },
  {
    id: "pcdc-1995-09-21-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "98-100",
    date: "Sep 21, 1995",
    sortDate: "1995-09-21",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["New York foreign ministers meeting", "IFOR", "Russian forces"],
    compilerUse: "Principals Committee conclusions on Bosnia principles and IFOR/Russian-force arrangements.",
    tags: ["Principals Committee", "IFOR", "Russia"]
  },
  {
    id: "pcdc-1995-09-25-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "101-102",
    date: "Sep 25, 1995",
    sortDate: "1995-09-25",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["New York foreign ministers meeting", "Dayton preparations", "Constitutional issues"],
    compilerUse: "Principals Committee conclusions on the next negotiating steps after Geneva and New York.",
    tags: ["Principals Committee", "Dayton track", "New York"]
  },
  {
    id: "pcdc-1995-09-29-bosnia-deputies-summary",
    packet: "pcDc20100533",
    pages: "103-104",
    date: "Sep 29, 1995",
    sortDate: "1995-09-29",
    kind: "NSC Summary",
    title: "Summary of Conclusions, SVTS Meeting of the NSC Deputies Committee",
    subjects: ["Russian participation", "NATO operational control", "IFOR"],
    compilerUse: "Secure-video Deputies Committee conclusions on Russian participation in a Bosnia peace force.",
    tags: ["Deputies Committee", "Russia", "IFOR"]
  },
  {
    id: "pcdc-1995-10-02-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "105",
    date: "Oct 2, 1995",
    sortDate: "1995-10-02",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Proximity talks", "Cease-fire monitoring", "Venue"],
    compilerUse: "Principals Committee conclusions on venue and monitoring issues before the proximity talks.",
    tags: ["Principals Committee", "Proximity talks", "Dayton"]
  },
  {
    id: "pcdc-1995-11-07-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "106-108",
    date: "Nov 7, 1995",
    sortDate: "1995-11-07",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Dayton", "Humanitarian sanctions relief", "Implementation funding", "Eastern Slavonia"],
    compilerUse: "Principals Committee conclusions during the Dayton negotiations on sanctions relief and implementation.",
    tags: ["Principals Committee", "Dayton", "Sanctions"]
  },
  {
    id: "pcdc-1995-11-22-bosnia-principals-summary",
    packet: "pcDc20100533",
    pages: "109-111",
    date: "Nov 22, 1995",
    sortDate: "1995-11-22",
    kind: "NSC Summary",
    title: "Summary of Conclusions, NSC Principals Committee Meeting on Bosnia",
    subjects: ["Dayton agreement", "IFOR", "Equip and train", "Russian participation"],
    compilerUse: "Presidential and vice-presidential Principals Committee meeting after the Dayton peace agreement was initialed.",
    tags: ["President Clinton", "Dayton", "IFOR"]
  },
  {
    id: "dayton-1995-08-03-albright-endgame",
    packet: "dayton20120799",
    pages: "2-8",
    date: "Aug 3, 1995",
    sortDate: "1995-08-03",
    kind: "Policy Memo",
    title: "Memorandum From Ambassador Albright to the National Security Advisor on Bosnia Endgame Strategy",
    subjects: ["Bosnia endgame", "UNPROFOR withdrawal", "Bosnian state viability"],
    compilerUse: "Albright's contribution to the August 1995 endgame strategy review.",
    tags: ["Albright", "Endgame", "Getting to Dayton"]
  },
  {
    id: "dayton-1995-08-04-strategy-for-balkan-conflict",
    packet: "dayton20120799",
    pages: "9-14",
    date: "Aug 4, 1995",
    sortDate: "1995-08-04",
    kind: "Policy Paper",
    title: "Strategy for the Balkan Conflict",
    subjects: ["Balkan conflict", "Political settlement", "Military balance", "Contact Group"],
    compilerUse: "NSC strategy paper laying out the modified Contact Group approach and post-UNPROFOR contingencies.",
    tags: ["NSC", "Strategy", "Getting to Dayton"]
  },
  {
    id: "dayton-1995-08-04-sustainable-defense",
    packet: "dayton20120799",
    pages: "15-20",
    date: "Undated [inferred Aug 4-5, 1995]",
    sortDate: "1995-08-04",
    dateCertainty: "inferred",
    dateBasis: "Filed as Tab D to Anthony Lake's August 5, 1995 memorandum to the President and adjacent to August 3-4 endgame papers.",
    kind: "Policy Paper",
    title: "Endgame Strategy: A Sustainable Defense of a Viable Bosnia after UNPROFOR Withdrawal",
    subjects: ["UNPROFOR withdrawal", "Bosnia defense", "Diplomatic strategy", "Sanctions"],
    compilerUse: "Undated endgame paper used in the August 1995 presidential strategy review.",
    tags: ["Undated", "Endgame", "UNPROFOR"]
  },
  {
    id: "dayton-1995-08-05-lake-balkan-strategy",
    packet: "dayton20120799",
    pages: "21-24",
    date: "Aug 5, 1995",
    sortDate: "1995-08-05",
    kind: "Presidential Memo",
    title: "Memorandum From Anthony Lake to President Clinton: Balkan Strategy Options for Discussion",
    subjects: ["Balkan strategy", "Foreign Policy Group", "Bosnia settlement", "UNPROFOR withdrawal"],
    compilerUse: "Presidential decision memorandum summarizing agency options for the August 7 foreign policy group meeting.",
    tags: ["President Clinton", "Lake", "Getting to Dayton"]
  },
  {
    id: "croatia-1995-01-20-strategy",
    packet: "croatia20140311",
    pages: "2-5",
    date: "Undated [inferred Jan 1995]",
    sortDate: "1995-01-20",
    dateCertainty: "inferred",
    dateBasis: "Internal references place the paper after Zagreb's January 1995 UNPROFOR announcement and before the scheduled January 30 Z-4 presentation.",
    kind: "Policy Paper",
    title: "Croatia Strategy",
    subjects: ["Croatia", "UNPROFOR", "Z-4 plan", "Krajina Serbs"],
    compilerUse: "Policy paper on balancing support for Croatian sovereignty with prevention of renewed Serbo-Croat war.",
    tags: ["Undated", "Croatia", "Z-4"]
  },
  {
    id: "croatia-1995-01-14-demarche-milosevic",
    packet: "croatia20140311",
    pages: "6-7",
    date: "Jan 14, 1995",
    sortDate: "1995-01-14",
    kind: "Cable",
    title: "Demarche to Milosevic on Croatia and UNPROFOR",
    subjects: ["Croatia", "Milosevic", "UNPROFOR", "Z-4 plan"],
    compilerUse: "State Department instruction on pressing Belgrade after Zagreb's UNPROFOR decision.",
    tags: ["Croatia", "Milosevic", "UNPROFOR"]
  },
  {
    id: "croatia-1995-01-17-meeting-milosevic",
    packet: "croatia20140311",
    pages: "8-11",
    date: "Jan 17, 1995",
    sortDate: "1995-01-17",
    kind: "Cable",
    title: "January 16 Meeting with Milosevic",
    subjects: ["Croatia", "Milosevic", "Z-4 plan", "Bosnia"],
    compilerUse: "Embassy Belgrade report on Milosevic's reaction to the Croatia/UNPROFOR demarche and Bosnia negotiations.",
    tags: ["Croatia", "Milosevic", "Belgrade"]
  },
  {
    id: "allied-1995-07-17-options-paper-breakfast",
    packet: "allied20130517",
    pages: "6-9",
    date: "Jul 17, 1995",
    sortDate: "1995-07-17",
    kind: "Policy Memo",
    title: "Options Paper for Breakfast",
    subjects: ["Gorazde", "Srebrenica aftermath", "Air power", "UNPROFOR"],
    compilerUse: "Vershbow options paper immediately preceding the July 1995 allied leader calls.",
    tags: ["Vershbow", "London meeting", "Srebrenica"]
  },
  {
    id: "allied-1995-07-22-london-meeting-bosnia",
    packet: "allied20130517",
    pages: "103-106",
    date: "Jul 22, 1995",
    sortDate: "1995-07-22",
    kind: "Presidential Memo",
    title: "Memorandum From Anthony Lake to President Clinton: Your Meeting with Christopher and Shalikashvili on the London Meeting on Bosnia",
    subjects: ["London meeting", "Gorazde", "Warning to the Serbs", "NATO"],
    compilerUse: "Presidential information memorandum and talking points after the July 1995 London meeting.",
    tags: ["President Clinton", "London meeting", "Gorazde"]
  }
];

const TALBOTT_DIRECT = [
  {
    id: "talbott-C09000058-1994-05-02",
    documentId: "C09000058",
    date: "May 2, 1994",
    sortDate: "1994-05-02",
    kind: "Presidential Memo",
    title: "Memorandum From Acting S/S Talbott to President Clinton: Your Appearance on CNN Tomorrow",
    identifier: "C09000058 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000058",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_May2022/FL-2017-13804/DOC_0C09000058/C09000058.pdf",
    subjects: ["President Clinton", "Bosnia", "Air power", "UNPROFOR", "Safe areas"],
    compilerUse: "Standalone Talbott FOIA presidential briefing memorandum with a substantial Bosnia-policy section for the May 1994 CNN appearance.",
    tags: ["Talbott FOIA", "President Clinton", "Bosnia", "UNPROFOR"],
    cacheName: "C09000058-1994-05-02.pdf"
  },
  {
    id: "talbott-C09000052-1994-12-12",
    documentId: "C09000052",
    date: "Dec 12, 1994",
    sortDate: "1994-12-12",
    kind: "Diplomatic Letter",
    title: "Letter From Strobe Talbott to Yuri",
    identifier: "C09000052 (May 2022 release) / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000052",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_May2022/FL-2017-13804/DOC_0C09000052/C09000052.pdf",
    subjects: ["Russia", "NATO expansion", "Bosnia", "Budapest summit"],
    compilerUse: "Standalone private Talbott letter placing Bosnia inside the U.S.-Russian strategic bargaining after the Budapest NATO-expansion dispute.",
    tags: ["Talbott FOIA", "Russia", "Bosnia", "NATO"],
    cacheName: "C09000052-1994-12-12.pdf"
  },
  {
    id: "talbott-C09000085-1995-02-23",
    documentId: "C09000085",
    date: "Feb 23, 1995",
    sortDate: "1995-02-23",
    kind: "Briefing Memo",
    title: "Memorandum From Acting Secretary Talbott to Secretary Brown: Your Visit to Spain",
    identifier: "C09000085 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000085",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_Apr2023/FL-2017-13804/DOC_0C09000085/C09000085.pdf",
    subjects: ["Spain", "UNPROFOR", "Bosnia", "Contact Group", "Croatia"],
    compilerUse: "Standalone Talbott briefing memorandum for Secretary Brown's Madrid trip, including Spain's Bosnia peacekeeping role and Contact Group concerns.",
    tags: ["Talbott FOIA", "Spain", "UNPROFOR", "Contact Group"],
    cacheName: "C09000085-1995-02-23.pdf"
  },
  {
    id: "talbott-C09000078-1995-04-11",
    documentId: "C09000078",
    date: "Apr 11, 1995",
    sortDate: "1995-04-11",
    kind: "Public Remarks",
    title: "Remarks by Deputy Secretary Talbott: U.S.-Turkish Leadership in the Post-Cold War World",
    identifier: "C09000078 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000078",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_Sep2023/FL-2017-13804/DOC_0C09000078/C09000078.pdf",
    subjects: ["Turkey", "Bosnia-Herzegovina", "Kosovo", "War crimes", "Former Yugoslavia"],
    compilerUse: "Standalone Talbott remarks with a discrete former-Yugoslavia policy passage on Bosnia, Kosovo, Serbia, peacekeeping, and war crimes.",
    tags: ["Talbott FOIA", "Turkey", "Former Yugoslavia", "Kosovo"],
    cacheName: "C09000078-1995-04-11.pdf"
  },
  {
    id: "talbott-C09000098-1995-06-07",
    documentId: "C09000098",
    date: "Jun 7, 1995",
    sortDate: "1995-06-07",
    kind: "Official-Informal",
    title: "Official-Informal Message From Talbott to Mamedov",
    identifier: "C09000098 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000098",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_Apr2023/FL-2017-13804/DOC_0C09000098/C09000098.pdf",
    subjects: ["Clinton-Yeltsin diplomacy", "Bosnia", "Milosevic", "Contact Group", "NATO-Russia"],
    compilerUse: "Standalone official-informal message previewing Bosnia and Milosevic as Clinton-Yeltsin agenda items before Halifax.",
    tags: ["Talbott FOIA", "Russia", "Bosnia", "Milosevic"],
    cacheName: "C09000098-1995-06-07.pdf"
  },
  {
    id: "talbott-C09000087-1995-06-13",
    documentId: "C09000087",
    date: "Jun 13, 1995",
    sortDate: "1995-06-13",
    kind: "Diplomatic Letter",
    title: "Letter From Yuri Mamedov to Strobe Talbott",
    identifier: "C09000087 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000087",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_Apr2023/FL-2017-13804/DOC_0C09000087/C09000087.pdf",
    subjects: ["Former Yugoslavia", "Contact Group", "Clinton-Yeltsin diplomacy", "Halifax summit"],
    compilerUse: "Standalone Mamedov letter to Talbott on the Halifax presidents' meeting, former Yugoslavia, and U.S.-Russian Contact Group cooperation.",
    tags: ["Talbott FOIA", "Russia", "Former Yugoslavia", "Contact Group"],
    cacheName: "C09000087-1995-06-13.pdf"
  },
  {
    id: "talbott-C09000009",
    documentId: "C09000009",
    date: "Aug 31, 1995",
    sortDate: "1995-08-31",
    kind: "State FOIA Record",
    title: "Bosnia: Secretary-Kozyrev Letter",
    identifier: "C09000009 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000009",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_June2022/FL-2017-13804/DOC_0C09000009/C09000009.pdf",
    subjects: ["Bosnia", "Kozyrev", "Russia", "Secretary Christopher"],
    compilerUse: "In-period Talbott FOIA hit for Bosnia diplomacy with Russia.",
    tags: ["Talbott FOIA", "Russia", "Bosnia"],
    cacheName: "C09000009.pdf"
  },
  {
    id: "talbott-C09000010",
    documentId: "C09000010",
    date: "Oct 13, 1995",
    sortDate: "1995-10-13",
    kind: "State FOIA Record",
    title: "Memorandum from Strobe Talbott to Ambassador Holbrooke",
    identifier: "C09000010 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000010",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_June2022/FL-2017-13804/DOC_0C09000010/C09000010.pdf",
    subjects: ["Holbrooke", "Dayton preparations", "Russia", "Bosnia"],
    compilerUse: "In-period Talbott FOIA memorandum to Holbrooke during the Dayton lead-up.",
    tags: ["Talbott FOIA", "Holbrooke", "Dayton"],
    cacheName: "C09000010.pdf"
  },
  {
    id: "talbott-C09000055-1995-10-19",
    documentId: "C09000055",
    date: "Oct 19, 1995",
    sortDate: "1995-10-19",
    kind: "Dissent Channel Message",
    title: "Dissent Channel Message: Bringing Russia into IFOR: Wrong Assumption, Wrong Objective",
    identifier: "C09000055 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000055",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_Mar2025/FL-2017-13804/DOC_0C09000055/C09000055.pdf",
    subjects: ["IFOR", "Russia", "Bosnia", "Hyde Park summit", "NATO"],
    compilerUse: "Standalone dissent-channel document on the prospective Russian role in the Bosnia Peace Implementation Force before the Hyde Park summit.",
    tags: ["Talbott FOIA", "Dissent Channel", "IFOR", "Russia"],
    cacheName: "C09000055-1995-10-19.pdf"
  },
  {
    id: "talbott-C09000068",
    documentId: "C09000068",
    date: "Dec 14, 1995",
    sortDate: "1995-12-14",
    kind: "State FOIA Record",
    title: "Note from Strobe Talbott to Assistant Secretary Holbrooke",
    identifier: "C09000068 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000068",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_June2022/FL-2017-13804/DOC_0C09000068/C09000068.pdf",
    subjects: ["Holbrooke", "Dayton signing", "Talbott"],
    compilerUse: "Talbott FOIA note dated the Paris signing day.",
    tags: ["Talbott FOIA", "Paris signing", "Holbrooke"],
    cacheName: "C09000068.pdf"
  },
  {
    id: "talbott-C09000051",
    documentId: "C09000051",
    date: "Dec 20, 1995",
    sortDate: "1995-12-20",
    kind: "State FOIA Record",
    title: "Letter From Michael Nacht to Strobe Talbott with Attachments",
    identifier: "C09000051 / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000051",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_July2022/FL-2017-13804/DOC_0C09000051/C09000051.pdf",
    subjects: ["Bosnia peace accord", "Arms control", "Russia"],
    compilerUse: "Post-signing in-period Talbott FOIA context on Bosnia and the broader foreign-policy agenda.",
    tags: ["Talbott FOIA", "Bosnia", "Post-Dayton"],
    cacheName: "C09000051.pdf"
  },
  {
    id: "talbott-C09000052-1995-12-27",
    documentId: "C09000052",
    date: "Dec 27, 1995",
    sortDate: "1995-12-27",
    kind: "Diplomatic Letter",
    title: "Letter From Henry Kissinger to Strobe Talbott on Bosnia, Russia, and NATO Enlargement",
    identifier: "C09000052 (July 2022 release) / F-2017-13804",
    collection: "Strobe Talbott FOIA case F-2017-13804",
    repository: "Department of State, FOIA Virtual Reading Room",
    url: "https://foia.state.gov/search/results.aspx?searchText=C09000052",
    pdfUrl: "https://foia.state.gov/DOCUMENTS/FOIA_L_July2022/FL-2017-13804/DOC_0C09000052/C09000052.pdf",
    subjects: ["Bosnia", "Dayton implementation", "Russia", "NATO enlargement", "Henry Kissinger"],
    compilerUse: "Standalone post-signing letter in Talbott's files on Russian cooperation in Bosnia and its relationship to NATO enlargement.",
    tags: ["Talbott FOIA", "Bosnia", "Russia", "NATO"],
    cacheName: "C09000052-1995-12-27.pdf"
  }
];

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function sourcePdfFor(packet) {
  return path.join(CACHE_DIR, packet.cacheName);
}

function request(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Balkans-93-95 FRUS compiler page builder" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          const next = new URL(response.headers.location, url).toString();
          response.resume();
          request(next).then(resolve, reject);
          return;
        }
        resolve(response);
      })
      .on("error", reject);
  });
}

async function download(url, targetPath) {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) return;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const response = await request(url);
  if (response.statusCode !== 200) throw new Error(`HTTP ${response.statusCode} for ${url}`);

  const file = fs.createWriteStream(targetPath);
  await new Promise((resolve, reject) => {
    response.pipe(file);
    response.on("error", reject);
    file.on("finish", resolve);
    file.on("error", reject);
  });
}

function pageCount(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Could not find Pages in pdfinfo output for ${pdfPath}`);
  return Number(match[1]);
}

function firstPageText(pdfPath, pages) {
  const firstPage = String(pages).split(",")[0].split("-")[0].trim();
  try {
    return execFileSync("pdftotext", ["-f", firstPage, "-l", firstPage, "-layout", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024
    });
  } catch {
    return "";
  }
}

function detectClassification(pdfPath, pages) {
  const text = firstPageText(pdfPath, pages).replace(/\s+/g, " ").toUpperCase();
  if (/TOP SECRET|T0P SECRET|TSB[ECR]{2,}/.test(text.slice(0, 400))) return "Top Secret";
  if (/SECRET|SECRBT|SECKET|CECRET|0ECRET|ODCRDT/.test(text)) return "Secret";
  if (/CONFIDENTIAL|CONFID/.test(text)) return "Confidential";
  if (/UNCLASSIFIED|UNCLAS/.test(text)) return "Unclassified";
  return "Original classification marking visible in PDF; verify";
}

function extractPages(sourcePath, pages, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const pageArgs = String(pages)
    .split(",")
    .map((pageSpec) => pageSpec.trim())
    .filter(Boolean)
    .flatMap((pageSpec) => [sourcePath, pageSpec]);
  const args = ["--warning-exit-0", "--empty", "--pages", ...pageArgs, sourcePath, "1", "--", outPath];
  const result = spawnSync("qpdf", args, { encoding: "utf8" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`qpdf failed for ${outPath}`);
  }
}

function normalizeIdentifier(identifier = "") {
  return identifier.replace(/\s+\/\s+/g, "; ");
}

function sourceNoteFor(record, packet, pageCountValue, classification) {
  const locator = [packet.repository, "Clinton Presidential Records", packet.collection, normalizeIdentifier(packet.identifier), packet.itemUrl]
    .filter(Boolean)
    .join(", ");
  const dateClause = record.dateCertainty === "inferred" ? ` Date inferred for chronological placement: ${record.dateBasis}` : "";
  const pageWord = pageCountValue === 1 ? "page" : "pages";
  return `Source: ${locator}. ${classification}. Extracted from source packet PDF pages ${record.pages}; ${pageCountValue} document ${pageWord} counted. The displayed review PDF appends page 1 of the source packet as an annotation sheet.${dateClause} Verify drafting, clearance, distribution, handwritten annotations, attachments, and excisions against the PDF before final FRUS treatment.`;
}

function directSourceNoteFor(record, pageCountValue) {
  const pageWord = pageCountValue === 1 ? "page" : "pages";
  return `Source: ${record.repository}, ${record.collection}, ${normalizeIdentifier(record.identifier)}, ${record.pdfUrl}. Direct FOIA PDF; ${pageCountValue} ${pageWord} counted. Verify classification, handling controls, drafting, clearance, annotations, attachments, and excisions against the PDF before final FRUS treatment.`;
}

function directClintonLibrarySourceNoteFor(record, pageCountValue) {
  const pageWord = pageCountValue === 1 ? "page" : "pages";
  const locator = [
    record.repository || "William J. Clinton Presidential Library, Clinton Digital Library",
    "Clinton Presidential Records",
    record.collection,
    normalizeIdentifier(record.identifier),
    record.url
  ]
    .filter(Boolean)
    .join(", ");
  return `Source: ${locator}. Classification and handling markings require PDF verification. Direct item PDF ${record.pdfUrl}; ${pageCountValue} ${pageWord} counted. Verify drafting, clearance, distribution, handwritten annotations, attachments, and excisions against the PDF before final FRUS treatment.`;
}

function isDirectClintonLibraryPdf(record) {
  return /^https:\/\/clinton\.presidentiallibraries\.us\/files\/original\/.+\.pdf/i.test(record.pdfUrl || "");
}

function withDirectClintonLibraryProvenance(record) {
  if (!isDirectClintonLibraryPdf(record)) return record;
  const repository = record.repository || "William J. Clinton Presidential Library, Clinton Digital Library";
  const sourcePdfPages = record.sourcePdfPages || (record.pageCount ? `1-${record.pageCount}` : undefined);
  const normalized = {
    ...record,
    repository,
    sourcePdfUrl: record.sourcePdfUrl || record.pdfUrl,
    sourcePdfPages,
    localPdfPageCount: record.localPdfPageCount || record.pageCount
  };
  return {
    ...normalized,
    sourceNote: directClintonLibrarySourceNoteFor(normalized, record.pageCount || 0)
  };
}

async function buildExtract(record) {
  const packet = PACKETS[record.packet];
  const sourcePdfPath = sourcePdfFor(packet);
  await download(packet.sourcePdfUrl, sourcePdfPath);

  const relativeOut = `documents/extracted/${record.sortDate}-${slug(record.id)}.pdf`;
  const outPath = path.join(ROOT, relativeOut);
  extractPages(sourcePdfPath, record.pages, outPath);
  const localPages = pageCount(outPath);
  const documentPages = localPages - 1;
  const classification = detectClassification(sourcePdfPath, record.pages);

  return {
    ...record,
    identifier: packet.identifier,
    collection: packet.collection,
    repository: packet.repository,
    url: packet.itemUrl,
    pdfUrl: relativeOut,
    sourcePdfUrl: packet.sourcePdfUrl,
    sourcePdfPages: record.pages,
    pageCount: documentPages,
    localPdfPageCount: localPages,
    annotationSheet: "Appended source packet page 1 after the extracted document pages.",
    annotationSourcePdfPages: "1",
    extractionStatus: `Extracted source pages ${record.pages} as the document text and appended source packet page 1 as the annotation sheet.`,
    sourceNote: sourceNoteFor(record, packet, documentPages, classification),
    classification
  };
}

async function enrichTalbott(record) {
  const pdfPath = path.join(CACHE_DIR, record.cacheName);
  await download(record.pdfUrl, pdfPath);
  const pages = pageCount(pdfPath);
  return {
    ...record,
    sourcePdfUrl: record.pdfUrl,
    sourcePdfPages: `1-${pages}`,
    pageCount: pages,
    localPdfPageCount: pages,
    extractionStatus: "Direct State FOIA PDF; no packet extraction required.",
    sourceNote: directSourceNoteFor(record, pages)
  };
}

function asDocument(record, overrides = {}) {
  const normalized = withDirectClintonLibraryProvenance(record);
  const documentScope = record.documentScope || (["Memcon", "Telcon"].includes(record.kind) ? "Conversation" : "Policy document");
  return {
    ...normalized,
    ...overrides,
    documentScope,
    documentType: record.kind,
    subjects: normalized.subjects || [],
    tags: normalized.tags || []
  };
}

function sortRecords(a, b) {
  return (a.sortDate || "").localeCompare(b.sortDate || "") || (a.title || "").localeCompare(b.title || "");
}

function reportRecord(record) {
  return {
    id: record.id,
    date: record.date,
    kind: record.kind,
    title: record.title,
    pageCount: record.pageCount,
    localPdfPageCount: record.localPdfPageCount,
    pdfUrl: record.pdfUrl,
    sourcePdfPages: record.sourcePdfPages,
    annotationSheet: record.annotationSheet || null,
    sourceNote: record.sourceNote || null
  };
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const extracted = [];

  for (const record of [...CONVERSATION_EXTRACTS, ...BROAD_EXTRACTS]) {
    extracted.push(await buildExtract(record));
  }

  const extractedById = new Map(extracted.map((record) => [record.id, record]));
  data.conversations = data.conversations
    .map((record) => extractedById.get(record.id) || withDirectClintonLibraryProvenance(record))
    .sort(sortRecords);

  const existingConversationIds = new Set(data.conversations.map((record) => record.id));
  const broadOnly = extracted.filter((record) => !existingConversationIds.has(record.id));
  const directTalbott = [];
  for (const record of TALBOTT_DIRECT) directTalbott.push(await enrichTalbott(record));

  data.documents = [
    ...data.conversations.map((record) => asDocument(record, { documentScope: "Conversation" })),
    ...broadOnly.map((record) => asDocument(record)),
    ...directTalbott.map((record) => asDocument(record, { documentScope: "State FOIA context" }))
  ].sort(sortRecords);

  data.volume = {
    ...data.volume,
    inventoryScope:
      "Chronological public inventory of declassified U.S. records covering Balkans policy, 1993-1995; not a selection list or proposed volume structure.",
    sourceNoteStandard:
      "FRUS-style source-note stems follow George H.W. Bush-era Office of the Historian practice: repository and file/control locator first; classification/handling next; then markings, distribution, attachments, annotations, and declassification accounting."
  };

  data.harvestQueue = data.harvestQueue.map((item) => {
    const updates = {
      "MDR 2010-0533-M": {
        nextAction: "Review classification, attachments, annotations, and excisions in the extracted PC/DC PDFs.",
        status: "Extracted"
      },
      "Memcon/telcon MDRs": {
        nextAction: "Cross-check exact times, participants, and distribution lines against schedules and PDF headers.",
        status: "Extracted"
      },
      "Srebrenica and war-crimes records": {
        nextAction: "Continue the war-crimes collection sweep while keeping the extracted Srebrenica/London records in the chronology.",
        status: "Partial"
      },
      "Dayton and Paris records": {
        nextAction: "Verify Paris-signing annotations and attached tabs after the extracted Dayton/Paris records.",
        status: "Partial"
      },
      "Strobe Talbott FOIA manifest leads": {
        nextAction: "Review the pulled in-volume PDFs; keep later Kosovo hits in a Volume XVI/follow-on bucket.",
        status: "Pulled"
      }
    };
    return updates[item.target] ? { ...item, ...updates[item.target] } : item;
  });

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(DATA_JS_PATH, `window.COMPILER_MAP_DATA = ${JSON.stringify(data, null, 2)};\n`);

  const extractedDocumentCount = extracted.length;
  const directDocumentCount = data.documents.filter((record) => /^https?:\/\/.+\.pdf/i.test(record.pdfUrl || "")).length;
  const documentPageTotal = data.documents.reduce((sum, record) => sum + (record.pageCount || 0), 0);
  const report = {
    generatedAt: new Date().toISOString(),
    documentRecordCount: data.documents.length,
    conversationRecordCount: data.conversations.length,
    extractedDocumentCount,
    directDocumentCount,
    documentPageTotal,
    sourcePacketAnnotation: "Every packet extraction appends page 1 of the original source PDF after the extracted document pages.",
    extracted: extracted.map(reportRecord),
    directTalbott: directTalbott.map(reportRecord)
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  const conversationRecords = data.conversations.filter((record) => ["Memcon", "Telcon"].includes(record.kind));
  const conversationReport = {
    generatedAt: new Date().toISOString(),
    conversationRecordCount: conversationRecords.length,
    pageTotal: conversationRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0),
    directItemCount: conversationRecords.filter((record) => /^https?:\/\/.+\.pdf/i.test(record.pdfUrl || "")).length,
    extractedDocumentCount: conversationRecords.filter((record) => /^(documents\/|\.\/documents\/)/.test(record.pdfUrl || "")).length,
    sourcePacketAnnotation: "Packet extractions append page 1 of the original source PDF after the extracted document pages.",
    records: conversationRecords.map(reportRecord)
  };
  fs.writeFileSync(CONVERSATION_REPORT_PATH, `${JSON.stringify(conversationReport, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
