import { destinations, campusNodes, type Destination, type CampusNode } from "./pathfinder";

export const destinationAliases: Record<string, string[]> = {
  d1: ["main gate", "gate", "ಮುಖ್ಯ ದ್ವಾರ", "ಮುಖ್ಯದ್ವಾರ", "ದ್ವಾರ", "ಗೇಟ್", "मुख्य द्वार", "गेट", "முதன்மை நுழைவாயில்", "நுழைவாயில்", "ప్రధాన ద్వారం", "ద్వారం", "പ്രധാന കവാടം", "കവാടം"],
  d2: ["administrative block", "administration block", "admin block", "administrative office", "main building", "main building administration", "ಆಡಳಿತ ವಿಭಾಗ", "ಆಡಳಿತ ಬ್ಲಾಕ್", "ಆಡಳಿತ ಕಚೇರಿ", "प्रशासनिक ब्लॉक", "நிர்வாகத் தொகுதி", "అడ్మినిస్ట్రేటివ్ బ్లాక్", "അഡ്മിനിസ്ട്രേറ്റീവ് ബ്ലോക്ക്"],
  d3: ["principal office", "principal", "dr peter fernandes", "dr peter fernandes office", "peter fernandes", "ಪ್ರಿನ್ಸಿಪಾಲ್ ಆಫೀಸ್", "ಪ್ರಾಂಶುಪಾಲರ ಕಚೇರಿ", "ಪ್ರಿನ್ಸಿಪಾಲ್", "प्रिंसिपल", "முதல்வர் அலுவலகம்", "ప్రిన్సిపాల్ కార్యాలయం", "പ്രിൻസിപ്പൽ ഓഫീസ്"],
  d4: ["examination cell", "exam cell", "exam branch", "ಪರೀಕ್ಷಾ ವಿಭಾಗ", "ಪರೀಕ್ಷಾ ಶಾಖೆ", "परीक्षा सेल", "தேர்வுப் பிரிவு", "పరీక్షల విభాగం", "പരീക്ഷാ വിഭാഗം"],
  d5: ["computer science department", "computer science", "cse", "hod entrance", "ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ ವಿಭಾಗ", "ಸಿಎಸ್‌ಇ ವಿಭಾಗ", "कंप्यूटर साइंस", "கணினி அறிவியல் துறை", "కంప్యూటర్ సైన్స్ విభాగం", "കംപ്യൂട്ടർ സയൻസ് ഡിപ്പാർട്ട്മെന്റ്"],
  d6: ["cse laboratory", "cse lab", "computer lab", "inside the classroom", "classroom", "class room", "ಕಂಪ್ಯೂಟರ್ ಲ್ಯಾಬ್", "ತರಗತಿ ಕೊಠಡಿ"],
  d7: ["ai lab", "artificial intelligence lab", "ಎಐ ಲ್ಯಾಬ್", "एआई लैब", "AI ஆய்வகம்", "AI ల్యాబ్", "AI ലാബ്"],
  d8: ["innovation lab", "student innovation workspace"],
  d9: ["research centre", "research center", "interdisciplinary research"],
  d10: ["central library", "library", "aiet library", "central learning block library", "ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯ", "ಗ್ರಂಥಾಲಯ", "ಲೈಬ್ರರಿ", "ಪುಸ್ತಕಾಲಯ", "केंद्रीय पुस्तकालय", "पुस्तकालय", "लाइब्रेरी", "மத்திய நூலகம்", "நூலகம்", "కేంద్ర గ్రంథాలయం", "సెంట్రల్ లైబ్రరీ", "గ్రంథాలయం", "ലൈബ്രറി", "സെൻട്രൽ ലൈബ്രറി"],
  d11: ["seminar hall", "seminar"],
  d12: ["auditorium", "ಆಡಿಟೋರಿಯಂ", "ಆಡಿಟೋರಿಯಂ ಹಾಲ್", "सभागार", "அரங்கம்", "ఆడిటోరియం", "ഓഡിറ്റോറിയം"],
  d13: ["cafeteria", "canteen", "cafe", "mess", "food", "snacks", "ಕ್ಯಾಂಟೀನ್", "ಕೆಫೆಟೇರಿಯಾ", "ಊಟದ ಶಾಲೆ", "कैंटीन", "உணவகம்", "క్యాంటీన్", "കാന്റീൻ"],
  d14: ["student hostel", "hostel", "boys hostel", "girls hostel", "ವಿದ್ಯಾರ್ಥಿ ವಸತಿ ನಿಲಯ", "ಹಾಸ್ಟೆಲ್", "छात्रावास", "மாணவர் விடுதி", "విద్యార్థి హాస్టల్", "വിദ്യാർത്ഥി ഹോസ്റ്റൽ"],
  d15: ["parking area", "parking", "ವಾನ ನಿಲುಗಡೆ", "ಪಾರ್ಕಿಂಗ್ ಪ್ರದೇಶ", "ಪಾರ್ಕಿಂಗ್", "पार्किंग क्षेत्र", "पार्किंग", "வாகன நிறுத்தம்", "పార్కింగ్ ప్రాంతం", "പാർക്കിംഗ് ഏരിയ"],
  d16: ["sports complex", "sports", "gym", "ground", "ಕ್ರೀಡಾ ಸಂಕೀರ್ಣ"],
  d17: ["alvas fountain", "fountain", "campus fountain", "ಕಾರಂಜಿ", "ಫೌಂಟೇನ್"],
  d18: ["canara bank atm", "canara bank", "atm", "atm beside entrance", "ಕೆನರಾ ಬ್ಯಾಂಕ್ ಎಟಿಎಂ", "ಎಟಿಎಂ", "ಕೆನರಾ ಬ್ಯಾಂಕ್", "केनरा बैंक एटीएम", "ஏடிஎம்", "ఏటీఎం", "എടിഎം"],
  d19: ["campus community quad", "campus community", "community quad", "quad"],
  d20: ["department library room", "dept library", "cse department library"],
  d21: ["engineering block complex", "engineering block", "engineering block aerial"],
  d22: ["new building aerial overview", "new building aerial"],
  d23: ["new building entrance"],
  d24: ["new building overview", "new building"],
  d25: ["new building to library walkway", "new building walkway"],
  d26: ["abhijith l kotian cabin", "abhijith l kotian", "abhijith kotian cabin", "abhijith kotian", "abhijith cabin"],
  d27: ["anitha rao cabin", "anitha rao", "prof anitha rao", "anitha cabin", "ಅನಿತಾ ರಾವ್"],
  d28: ["asif mulla cabin", "asif mulla", "prof asif mulla", "asif cabin"],
  d29: ["aysha rameela cabin", "aysha rameela", "aysha cabin"],
  d30: ["chandra naik cabin", "chandra naik", "chandra cabin"],
  d31: ["deeksha m cabin", "deeksha m", "deeksha cabin"],
  d32: ["deepika kamath cabin", "deepika kamath", "deepika cabin"],
  d33: ["dr manjunath kotari cabin", "dr manjunath kotari", "manjunath kotari cabin", "manjunath kotari", "dr kotari", "hod cse", "cse hod", "kotari cabin", "ಕೊಠಾರಿ ಸರ್", "ಮಂಜುನಾಥ್ ಕೊಠಾರಿ", "ಡಾ ಮಂಜುನಾಥ್ ಕೊಠಾರಿ"],
  d34: ["g srinivasan cabin", "g srinivasan", "srinivasan cabin", "srinivasan"],
  d35: ["giridhar gowda cabin", "giridhar gowda", "giridhar cabin"],
  d36: ["h harshavardhan cabin", "h harshavardhan", "harshavardhan cabin", "harshavardhan"],
  d37: ["jasmine princy lobo cabin", "jasmine princy lobo", "jasmine lobo", "jasmine cabin"],
  d38: ["jayendra bandyan cabin", "jayendra bandyan", "jayendra cabin", "bandyan"],
  d39: ["kiran b v cabin", "kiran b v", "kiran cabin"],
  d40: ["madhusudhan s cabin", "madhusudhan s", "madhusudhan cabin", "madhusudhan"],
  d41: ["mahesh d k cabin", "mahesh d k", "mahesh cabin"],
  d42: ["mahesh kini m cabin", "mahesh kini m", "mahesh kini", "mahesh kini cabin"],
  d43: ["r senthil kumar cabin", "r senthil kumar", "senthil kumar cabin", "senthil kumar", "senthil"],
  d44: ["rakshitha rai u cabin", "rakshitha rai u", "rakshitha rai", "rakshitha cabin"],
  d45: ["rizwan n shaikh cabin", "rizwan n shaikh", "rizwan shaikh", "rizwan cabin"],
  d46: ["shyla b g cabin", "shyla b g", "shyla cabin"],
  d47: ["vidya cabin", "prof vidya", "vidya"],
  d48: ["yogitha cabin", "prof yogitha", "yogitha"],
};

export const sourceAliases: Record<string, string[]> = {
  gate: ["main gate", "gate", "ಮುಖ್ಯ ದ್ವಾರ", "ಮುಖ್ಯದ್ವಾರ", "ದ್ವಾರ", "ಗೇಟ್", "ಗೇಟ್‌ನಿಂದ", "ದ್ವಾರದಿಂದ", "ಮುಖ್ಯ ದ್ವಾರದಿಂದ", "ಗೇಟ್ ನಿಂದ", "मुख्य द्वार", "गेट", "गेट से", "முதன்மை நுழைவாயில்", "நுழைவாயில்", "ప్రధాన ద్వారం", "ద్వారం", "గేట్", "പ്രധാന കവാടം", "കവാടം", "ഗേറ്റ്"],
  reception: ["reception plaza", "reception", "ರಿಸೆಪ್ಷನ್"],
  square: ["campus square", "quad"],
  parking: ["parking area", "parking", "ವಾನ ನಿಲುಗಡೆ", "ಪಾರ್ಕಿಂಗ್ ಪ್ರದೇಶ", "ಪಾರ್ಕಿಂಗ್", "ಪಾರ್ಕಿಂಗ್‌ನಿಂದ", "पार्किंग क्षेत्र", "पार्किंग", "வாகன நிறுத்தம்", "పార్కింగ్ ప్రాంతం", "പാർക്കിംഗ് ഏരിയ"],
  "admin-entry": ["administration entrance", "administrative block", "administration block", "admin block", "ಆಡಳಿತ ವಿಭಾಗ", "ಆಡಳಿತ ಬ್ಲಾಕ್", "ಆಡಳಿತ ಕಚೇರಿ", "ಆಡಳಿತ ವಿಭಾಗದಿಂದ", "ಪ್ರಮುಖ ಕಟ್ಟಡ", "प्रशासनिक ब्लॉक", "நிர்வாகத் தொகுதி", "అడ్మినిస్ట్రేటివ్ బ్లాక్", "അഡ്മിനിസ്ട്രേറ്റീവ് ബ്ലോക്ക്"],
  "library-entry": ["library entrance", "ಗ್ರಂಥಾಲಯ ಪ್ರವೇಶ"],
  "cse-entry": ["computing block entrance", "cse entrance", "ಸಿಎಸ್‌ಇ ಪ್ರವೇಶ"],
  hostel: ["student hostel", "hostel", "ವಿದ್ಯಾರ್ಥಿ ವಸತಿ ನಿಲಯ", "ಹಾಸ್ಟೆಲ್", "ಹಾಸ್ಟೆಲ್‌ನಿಂದ", "ಹಾಸ್ಟೆಲ್ ನಿಂದ", "छात्रावास", "மாணவர் விடுதி", "విద్యార్థి హాస్టల్", "വിദ്യാർത്ഥി ഹോസ്റ്റൽ"],
};

export const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/[.,!?;:()[\]{}'"/\\-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      if (a[i - 1] === b[j - 1]) {
        row[j] = prev;
      } else {
        row[j] = Math.min(prev + 1, row[j] + 1, row[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return row[b.length];
}

export type FuzzyMatchOptions = {
  limit?: number;
  category?: string;
  building?: string;
  minScore?: number;
};

export type MatchResult = {
  destination: Destination;
  score: number;
  matchedOn: string;
};

/**
 * Fuzzy matches campus destinations with high recall, scoring exact matches,
 * prefix matches, token overlap, and Levenshtein similarity across all aliases.
 */
export function fuzzyMatchDestinations(query: string, options: FuzzyMatchOptions = {}): Destination[] {
  const normQuery = normalize(query);
  const activeDestinations = destinations.filter((d) => {
    if (!d.isActive) return false;
    if (options.category && options.category !== "All" && d.category !== options.category) return false;
    if (options.building && options.building !== "All" && d.buildingName !== options.building) return false;
    return true;
  });

  if (!normQuery) {
    return typeof options.limit === "number" ? activeDestinations.slice(0, options.limit) : activeDestinations;
  }

  const queryTokens = normQuery.split(" ").filter(Boolean);
  const results: MatchResult[] = [];

  for (const destination of activeDestinations) {
    let bestScore = 0;
    let matchedOn = destination.name;

    const candidateStrings: string[] = [
      destination.name,
      destination.buildingName,
      destination.category,
      destination.roomNumber ?? "",
      destination.description,
      ...(destinationAliases[destination.id] ?? []),
    ];

    for (const candidate of candidateStrings) {
      if (!candidate) continue;
      const normCand = normalize(candidate);
      if (!normCand) continue;

      // Exact match
      if (normCand === normQuery) {
        bestScore = Math.max(bestScore, 100);
        matchedOn = candidate;
        break;
      }

      // Starts with query
      if (normCand.startsWith(normQuery)) {
        const score = 85 + Math.min(10, (normQuery.length / normCand.length) * 10);
        if (score > bestScore) {
          bestScore = score;
          matchedOn = candidate;
        }
      }

      // Contains query as substring
      if (normCand.includes(normQuery)) {
        const score = 70 + Math.min(10, (normQuery.length / normCand.length) * 10);
        if (score > bestScore) {
          bestScore = score;
          matchedOn = candidate;
        }
      }

      // Token overlap check
      const candTokens = normCand.split(" ").filter(Boolean);
      const matchedTokenCount = queryTokens.filter((qToken) =>
        candTokens.some((cToken) => cToken.startsWith(qToken) || cToken === qToken)
      ).length;

      if (matchedTokenCount > 0) {
        const tokenScore = (matchedTokenCount / queryTokens.length) * 65;
        if (tokenScore > bestScore) {
          bestScore = tokenScore;
          matchedOn = candidate;
        }
      }

      // Fuzzy edit distance for short single tokens or queries >= 3 chars
      if (normQuery.length >= 3) {
        for (const cToken of candTokens) {
          if (Math.abs(cToken.length - normQuery.length) <= 2) {
            const dist = calculateLevenshteinDistance(normQuery, cToken);
            if (dist <= 2) {
              const levScore = Math.max(0, 70 - dist * 15);
              if (levScore > bestScore) {
                bestScore = levScore;
                matchedOn = candidate;
              }
            }
          }
        }
      }
    }

    if (bestScore >= (options.minScore ?? 30)) {
      results.push({ destination, score: bestScore, matchedOn });
    }
  }

  // Sort descending by score, tie-break by name
  results.sort((a, b) => b.score - a.score || a.destination.name.localeCompare(b.destination.name));

  const matchedDestinations = results.map((r) => r.destination);
  return typeof options.limit === "number" ? matchedDestinations.slice(0, options.limit) : matchedDestinations;
}

/**
 * Resolves a spoken or typed destination query against all campus destination aliases.
 */
export function resolveCampusDestination(value: string): Destination | undefined {
  const normQuery = normalize(value);
  if (!normQuery) return undefined;

  // 1. Direct alias check
  const activeDestinations = destinations.filter((d) => d.isActive);
  const candidates = activeDestinations
    .flatMap((item) => (destinationAliases[item.id] ?? []).map((alias) => ({ item, alias: normalize(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const exact = candidates.find(
    ({ alias }) =>
      normQuery === alias ||
      new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "u").test(normQuery)
  )?.item;

  if (exact) return exact;

  // 2. Fall back to best fuzzy match
  const matches = fuzzyMatchDestinations(value, { limit: 1, minScore: 50 });
  return matches[0];
}

/**
 * Resolves a spoken or typed starting location query against configured campus source nodes.
 */
export function resolveCampusSource(value: string): CampusNode | undefined {
  const query = normalize(value);
  if (!query) return undefined;

  const activeNodes = campusNodes.filter((node) => node.isActive && node.isAccessible);
  const candidates = activeNodes
    .flatMap((item) => (sourceAliases[item.id] ?? []).map((alias) => ({ item, alias: normalize(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const primary = candidates.find(
    ({ alias }) =>
      query === alias ||
      new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "u").test(query)
  )?.item;

  if (primary) return primary;

  // Handle language suffixes like "gate ninda", "hostel inda", "ದ್ವಾರದಿಂದ", "ಗೇಟ್‌ನಿಂದ", "gate se"
  const stripped = value
    .replace(/\b(ninda|inda|se|ilirundhu|nunchi|ninnu|from)\b/gi, " ")
    .replace(/(ದಿಂದ|ನಿಂದ|ಇಂದ|ಯಿಂದ|ನುಂಡಿ|నుంచి|இருந்து|നിന്ന്|से)/g, " ")
    .trim();

  if (stripped && stripped !== value) {
    const strippedQuery = normalize(stripped);
    return candidates.find(
      ({ alias }) =>
        strippedQuery === alias ||
        new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "u").test(strippedQuery)
    )?.item;
  }

  return undefined;
}
