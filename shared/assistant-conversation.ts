import { campusEdges, campusNodes, destinations, getNode, type CampusNode, type Destination } from "./pathfinder";
import { calculateRoute, createRouteInstructions, type RouteResult } from "./routing";
import { deriveRouteManeuvers } from "./maneuvers";
import type { LanguageCode } from "./i18n";

export const conversationIntents = ["idle", "awaiting_route_confirmation", "awaiting_source", "route_ready", "navigating"] as const;
export type ConversationIntent = (typeof conversationIntents)[number];

export type AssistantConversationState = {
  conversationId: string;
  intent: ConversationIntent;
  destinationId?: string;
  sourceNodeId?: string;
  accessibilityRequired: boolean;
  language: LanguageCode;
  navigationStatus: "idle" | "ready" | "active";
  route?: PersistedGuidedRoute;
};

export type PersistedGuidedRoute = {
  sourceNodeId: string;
  destinationId: string;
  totalDistance: number;
  estimatedTime: number;
  instructions: string[];
};

export type GuidedRoute = {
  source: CampusNode;
  destination: Destination;
  result: RouteResult;
  instructions: string[];
};

export type ConversationTurn = {
  handled: boolean;
  reply?: string;
  state: AssistantConversationState;
  route?: GuidedRoute;
  action?: "start_navigation";
};

const replies: Record<LanguageCode, Record<"directions" | "source" | "notFound" | "sourceNotFound" | "routeFound" | "routeError" | "ready", string>> = {
  en: { directions: "Would you like step-by-step directions?", source: "Sure. Where are you starting from?", notFound: "I don't have a verified location for that destination yet. Please choose a configured campus location.", sourceNotFound: "I couldn't match that starting point to a configured campus location. Choose Main Gate, Administrative Block, Student Hostel, or Parking Area.", routeFound: "Route found.", routeError: "I couldn't calculate a verified route between those locations. Please choose another starting point.", ready: "Navigation is ready. I will guide you through the selected route." },
  kn: { directions: "ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶನ ಬೇಕೇ?", source: "ಖಂಡಿತ. ನೀವು ಎಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೀರಿ?", notFound: "ಆ ಗಮ್ಯಸ್ಥಾನಕ್ಕೆ ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳ ಮಾಹಿತಿ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಕಾನ್ಫಿಗರ್ ಮಾಡಿದ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", sourceNotFound: "ಆ ಪ್ರಾರಂಭದ ಸ್ಥಳವನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿದ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳಕ್ಕೆ ಹೊಂದಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮುಖ್ಯ ದ್ವಾರ, ಆಡಳಿತ ವಿಭಾಗ, ವಿದ್ಯಾರ್ಥಿ ವಸತಿ ನಿಲಯ ಅಥವಾ ಪಾರ್ಕಿಂಗ್ ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", routeFound: "ಮಾರ್ಗ ದೊರಕಿದೆ.", routeError: "ಈ ಸ್ಥಳಗಳ ನಡುವೆ ಪರಿಶೀಲಿಸಿದ ಮಾರ್ಗವನ್ನು ಲೆಕ್ಕಹಾಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಪ್ರಾರಂಭದ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", ready: "ನ್ಯಾವಿಗೇಶನ್ ಸಿದ್ಧವಾಗಿದೆ. ಆಯ್ಕೆ ಮಾಡಿದ ಮಾರ್ಗದಲ್ಲಿ ನಾನು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ." },
  tcy: { directions: "ಹಂತ ಹಂತದ ದಾರಿ ಬೇಕಾ?", source: "ಹಾಂ. ನಿಂಗ ಎಲ್ಲಡ್ದ ಪ್ರಾರಂಭ ಮಲ್ತೊಂಡಿದ್ದೀರ್?", notFound: "ಆ ಗಮ್ಯಸ್ಥಾನೊಗ್ ಪರಿಶೀಲನೆ ಮಲ್ತಿನ ಸ್ಥಳ ಮಾಹಿತಿ ಇಜ್ಜಿ. ದಯವಿಟ್ಟು ಸಿದ್ಧ ಮಲ್ತಿನ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳನ್ ಆರಿಸುಲೆ.", sourceNotFound: "ಆ ಪ್ರಾರಂಭದ ಸ್ಥಳನ್ ಸಿದ್ಧ ಮಲ್ತಿನ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳೊಟ್ಟುಗ್ ಹೊಂದಿಸೆರೆ ಆಯಿಜ್ಜಿ. ಮುಖ್ಯ ದ್ವಾರ, ಆಡಳಿತ ಬ್ಲಾಕ್, ವಿದ್ಯಾರ್ಥಿ ಹಾಸ್ಟೆಲ್ ಅತ್ತಂಡ ಪಾರ್ಕಿಂಗ್ ಪ್ರದೇಶನ್ ಆರಿಸುಲೆ.", routeFound: "ದಾರಿ ಸಿಕ್ಕುಂಡ್.", routeError: "ಈ ಸ್ಥಳೊಲೆ ನಡುವೆ ಪರಿಶೀಲನೆ ಮಲ್ತಿನ ದಾರಿ ಲೆಕ್ಕ ಮಲ್ಪೆರೆ ಆಯಿಜ್ಜಿ. ದಯವಿಟ್ಟು ಬೇತೆ ಪ್ರಾರಂಭದ ಸ್ಥಳನ್ ಆರಿಸುಲೆ.", ready: "ನ್ಯಾವಿಗೇಶನ್ ಸಿದ್ಧ ಉಂಡು. ಆಯ್ಕೆ ಮಲ್ತಿನ ದಾರಿಡ್ ಯಾನ್ ನಿಂಗ ಮಾರ್ಗದರ್ಶನ ಕೊರ್ಪೆ." },
  hi: { directions: "क्या आप चरण-दर-चरण दिशा-निर्देश चाहते हैं?", source: "ज़रूर। आप कहाँ से शुरू कर रहे हैं?", notFound: "उस गंतव्य के लिए मेरे पास सत्यापित स्थान जानकारी नहीं है। कृपया कॉन्फ़िगर किया गया कैंपस स्थान चुनें।", sourceNotFound: "मैं उस शुरुआती स्थान को किसी कॉन्फ़िगर किए गए कैंपस स्थान से नहीं मिला सका। मुख्य द्वार, प्रशासनिक ब्लॉक, छात्रावास या पार्किंग क्षेत्र चुनें।", routeFound: "मार्ग मिल गया।", routeError: "इन स्थानों के बीच सत्यापित मार्ग की गणना नहीं हो सकी। कृपया दूसरा शुरुआती स्थान चुनें।", ready: "नेविगेशन तैयार है। मैं आपको चुने गए मार्ग पर मार्गदर्शन दूँगा।" },
  ta: {
    directions: "படிப்படியான வழிகாட்டுதல் வேண்டுமா?",
    source: "நிச்சயமாக. நீங்கள் எங்கிருந்து தொடங்குகிறீர்கள்?",
    notFound: "அந்த இடத்திற்கான சரிபார்க்கப்பட்ட இருப்பிடத் தகவல் என்னிடம் இல்லை. உள்ளமைக்கப்பட்ட வளாக இடத்தைத் தேர்ந்தெடுக்கவும்.",
    sourceNotFound: "அந்த தொடக்க இடத்தை உள்ளமைக்கப்பட்ட வளாக இடத்துடன் பொருத்த முடியவில்லை. முதன்மை நுழைவாயில், நிர்வாகத் தொகுதி, மாணவர் விடுதி அல்லது வாகன நிறுத்தத்தைத் தேர்ந்தெடுக்கவும்.",
    routeFound: "பாதை கிடைத்தது.",
    routeError: "இந்த இடங்களுக்கு இடையிலான சரிபார்க்கப்பட்ட பாதையைக் கணக்கிட முடியவில்லை. வேறு தொடக்க இடத்தைத் தேர்ந்தெடுக்கவும்.",
    ready: "வழிசெலுத்தல் தயாராக உள்ளது. தேர்ந்தெடுக்கப்பட்ட பாதையில் நான் உங்களுக்கு வழிகாட்டுவேன்."
  },
  te: {
    directions: "దశలవారీ దిశలు కావాలా?",
    source: "తప్పకుండా. మీరు ఎక్కడి నుంచి ప్రారంభిస్తున్నారు?",
    notFound: "ఆ గమ్యానికి ధృవీకరించిన స్థాన సమాచారం నా వద్ద లేదు. దయచేసి కాన్ఫిగర్ చేసిన క్యాంపస్ స్థానాన్ని ఎంచుకోండి.",
    sourceNotFound: "ఆ ప్రారంభ స్థానాన్ని కాన్ఫిగర్ చేసిన క్యాంపస్ స్థానంతో సరిపోల్చలేకపోయాను. ప్రధాన ద్వారం, అడ్మినిస్ట్రేటివ్ బ్లాక్, విద్యార్థి హాస్టల్ లేదా పార్కింగ్ ప్రాంతాన్ని ఎంచుకోండి.",
    routeFound: "మార్గం కనుగొనబడింది.",
    routeError: "ఈ స్థానాల మధ్య ధృవీకరించిన మార్గాన్ని లెక్కించలేకపోయాను. దయచేసి వేరే ప్రారంభ స్థానాన్ని ఎంచుకోండి.",
    ready: "నావిగేషన్ సిద్ధంగా ఉంది. ఎంచుకున్న మార్గంలో నేను మీకు మార్గనిర్దేశం చేస్తాను."
  },
  ml: {
    directions: "ഘട്ടംഘട്ടമായ നിർദ്ദേശങ്ങൾ വേണോ?",
    source: "തീർച്ചയായും. നിങ്ങൾ എവിടെ നിന്നാണ് ആരംഭിക്കുന്നത്?",
    notFound: "ആ ലക്ഷ്യസ്ഥാനത്തിനായി സ്ഥിരീകരിച്ച ലൊക്കേഷൻ വിവരങ്ങൾ എനിക്കില്ല. കോൺഫിഗർ ചെയ്ത ക്യാമ്പസ് ലൊക്കേഷൻ തിരഞ്ഞെടുക്കുക.",
    sourceNotFound: "ആ ആരംഭസ്ഥാനം കോൺഫിഗർ ചെയ്ത ക്യാമ്പസ് ലൊക്കേഷനുമായി പൊരുത്തപ്പെടുത്താൻ കഴിഞ്ഞില്ല. പ്രധാന കവാടം, അഡ്മിനിസ്ട്രേറ്റീവ് ബ്ലോക്ക്, വിദ്യാർത്ഥി ഹോസ്റ്റൽ, അല്ലെങ്കിൽ പാർക്കിംഗ് ഏരിയ തിരഞ്ഞെടുക്കുക.",
    routeFound: "റൂട്ട് കണ്ടെത്തി.",
    routeError: "ഈ ലൊക്കേഷനുകൾക്കിടയിൽ സ്ഥിരീകരിച്ച റൂട്ട് കണക്കാക്കാനായില്ല. ദയവായി മറ്റൊരു ആരംഭസ്ഥാനം തിരഞ്ഞെടുക്കുക.",
    ready: "നാവിഗേഷൻ തയ്യാറാണ്. തിരഞ്ഞെടുത്ത റൂട്ടിലൂടെ ഞാൻ നിങ്ങളെ നയിക്കും."
  },
};

const routeDuration: Record<LanguageCode, (minutes: number) => string> = {
  en: (minutes) => `approximately ${minutes} min`,
  kn: (minutes) => `ಸುಮಾರು ${minutes} ನಿಮಿಷ`,
  tcy: (minutes) => `ಸುಮಾರು ${minutes} ನಿಮಿಷ`,
  hi: (minutes) => `लगभग ${minutes} मिनट`,
  ta: (minutes) => `சுமார் ${minutes} நிமிடங்கள்`,
  te: (minutes) => `సుమారు ${minutes} నిమిషాలు`,
  ml: (minutes) => `ഏകദേശം ${minutes} മിനിറ്റ്`,
};

const destinationLocation: Record<LanguageCode, (destination: Destination) => string> = {
  en: (destination) => `${destination.name} is in ${destination.buildingName} on the ${destination.floorName}.`,
  kn: (destination) => `${destination.name} ${destination.buildingName} ನ ${destination.floorName} ನಲ್ಲಿ ಇದೆ.`,
  tcy: (destination) => `${destination.name} ${destination.buildingName}ದ ${destination.floorName}ಡ್ ಉಂಡು.`,
  hi: (destination) => `${destination.name}, ${destination.buildingName} के ${destination.floorName} पर है।`,
  ta: (destination) => `${destination.name}, ${destination.buildingName} இன் ${destination.floorName} இல் உள்ளது.`,
  te: (destination) => `${destination.name}, ${destination.buildingName} యొక్క ${destination.floorName} లో ఉంది.`,
  ml: (destination) => `${destination.name}, ${destination.buildingName} ലെ ${destination.floorName} ൽ ആണ്.`,
};
import { destinationAliases, sourceAliases, resolveCampusDestination, resolveCampusSource, normalize } from "./destinationMatcher";
export { destinationAliases, sourceAliases, resolveCampusDestination, resolveCampusSource };

const affirmative = new Set([
  "yes", "yeah", "yep", "sure", "okay", "ok", "please", "do it", "continue", "start", "yes please", "show me", "guide me", "take me", "y", "of course", "definitely", "absolutely", "yup",
  // Kannada & Tulu
  "howdu", "houdu", "haudu", "howdhu", "houdhu", "sari", "beku", "kodi", "thorisi", "kalsi", "aythu", "aithu", "hownu", "bekagide", "thodi", "aand", "aandu", "bodu", "toojale",
  "ಹೌದು", "ಸರಿ", "ಬೇಕು", "ತೋರಿಸಿ", "ಕೊಡಿ", "ಆಯ್ತು", "ಹೌದ್", "ಆಂಡ", "ಆಮ್", "ಬೋಡು", "ತೋಜಾಲೆ",
  // Hindi
  "haan", "sahi", "theek hai", "theek", "chalo", "dikhao", "zaroor", "haanji", "ji",
  "हाँ", "हां", "जी", "हाँ जी", "ज़रूर", "हा",
  // Tamil
  "aama", "aamam", "sari", "vendum", "kattu",
  "ஆம்", "ஆமாம்", "சரி", "வேண்டும்", "காட்டு",
  // Telugu
  "avunu", "sare", "kaavali", "chupinchu",
  "అవును", "సరే", "కావాలి", "చూపించు",
  // Malayalam
  "athe", "shari", "venam", "kaanikku",
  "അതെ", "അതേ", "ശരി", "വേണം", "കാണിക്കൂ",
]);

const negative = new Set([
  "no", "nope", "nah", "stop", "cancel", "don't", "dont", "nevermind", "exit", "quit", "leave",
  "beda", "benda", "illa", "alla", "ಬೇಡ", "ಇಲ್ಲ",
  "bodchi", "ijji", "ಬೋಡ್ಚಿ", "ಇಜ್ಜಿ",
  "nahi", "na", "mat", "mat karo", "नहीं", "ना",
  "vendam", "illai", "வேண்டாம்", "இல்லை",
  "vaddu", "ledu", "వద్దు", "లేదు",
  "venda", "illa", "വേണ്ട", "ഇല്ല",
]);

const isAffirmative = (normText: string) => {
  if (affirmative.has(normText)) return true;
  return /^(yes|yeah|yep|sure|okay|ok|please|haudu|howdu|houdu|howdhu|houdhu|sari|beku|thorisi|haan|haanji|aama|aamam|avunu|athe|shari|ಹೌದು|ಸರಿ|ಬೇಕು|ತೋರಿಸಿ|ಆಂಡ|ಆಮ್|हाँ|हां|जी|ஆம்|ஆமாம்|అవును|അതെ)(\s|$)/i.test(normText);
};

const isNegative = (normText: string) => {
  if (negative.has(normText)) return true;
  return /^(no|nope|nah|cancel|stop|beda|benda|illa|nahi|vendam|vaddu|venda|ಬೇಡ|ಇಲ್ಲ|नहीं|வேண்டாம்|వద్దు|വേണ്ട)(\s|$)/i.test(normText);
};

const isGreeting = (normText: string) => {
  return /^(hi|hello|hey|greetings|namaste|namaskara|namaskar|namaskaram|vanakkam|vanakam|good morning|good afternoon|good evening|who are you|what can you do|help|alvas robo|ಹಲೋ|ಹಾಯ್|ನಮಸ್ಕಾರ|ನಮಸ್ತೆ|नमस्ते|வணக்கம்|నమస్కారం|നമസ്കാരം)(\s|$)/i.test(normText);
};

const cancellationReplies: Record<LanguageCode, string> = {
  en: "No problem! Let me know if you would like directions or information for another campus location.",
  kn: "ತೊಂದರೆಯಿಲ್ಲ! ಬೇರೆ ಯಾವುದಾದರೂ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ ಅಥವಾ ಮಾಹಿತಿಯ ಅಗತ್ಯವಿದ್ದರೆ ಕೇಳಿ.",
  tcy: "ತೊಂದರೆ ಇಜ್ಜಿ! ಬೇತೆ ಒವ್ವೆ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ ಅತ್ತಂಡ ಮಾಹಿತಿ ಬೋಡಾಂಡ ಕೇನ್ಲೆ.",
  hi: "कोई बात नहीं! यदि आपको परिसर के किसी अन्य स्थान की दिशा या जानकारी चाहिए, तो बताइए।",
  ta: "பரவாயில்லை! வேறு ஏதேனும் வளாக இடத்திற்கான வழிகாட்டல் அல்லது தகவல் தேவைப்பட்டால் கேளுங்கள்.",
  te: "పర్వాలేదు! మీకు క్యాంపస్‌లోని వేరే ఏదైనా ప్రదేశం కోసం దిశలు లేదా సమాచారం కావాలంటే అడగండి.",
  ml: "പ്രശ്നമില്ല! മറ്റൊരു ക്യാമ്പസ് ലൊക്കേഷനിലേക്കുള്ള വഴിയോ വിവരങ്ങളോ ആവശ്യമുണ്ടെങ്കിൽ ചോദിക്കൂ.",
};

const greetingsReplies: Record<LanguageCode, string> = {
  en: "Hello! I am Alvas Robo, your AIET campus assistant. Ask me for directions to any department, library, faculty cabin, lab, or campus facility, or ask any question about the college!",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ಆಳ್ವಾಸ್ ರೋಬೋ (Alvas Robo), ನಿಮ್ಮ AIET ಕ್ಯಾಂಪಸ್ ಸಹಾಯಕ. ಗ್ರಂಥಾಲಯ, ವಿಭಾಗಗಳು, ಪ್ರಾಧ್ಯಾಪಕರ ಕೊಠಡಿಗಳು (Faculty Cabins), ಲ್ಯಾಬ್‌ಗಳು ಅಥವಾ ಯಾವುದೇ ಸ್ಥಳಕ್ಕೆ ಮಾರ್ಗದರ್ಶನ ಕೇಳಿ!",
  tcy: "ನಮಸ್ಕಾರ! ಯಾನ್ ಆಳ್ವಾಸ್ ರೋಬೋ (Alvas Robo), ಈರೆನ ಕ್ಯಾಂಪಸ್ ಸಹಾಯಕ. ಗ್ರಂಥಾಲಯ, ಕೊಠಡಿಲು, ಲೆಕ್ಚರರ್ ಕ್ಯಾಬಿನ್ ಅತ್ತಂಡ ಒವ್ವೆ ಜಾಗೆಗ್ ದಾರಿ ಬೋಡಾಂಡ ಎನನ್ ಕೇನ್ಲೆ!",
  hi: "नमस्ते! मैं अल्वास रोबो (Alvas Robo) हूँ, आपका AIET कैंपस सहायक। किसी भी विभाग, पुस्तकालय, संकाय केबिन, लैब या परिसर सुविधा का रास्ता जानने के लिए मुझसे पूछें!",
  ta: "வணக்கம்! நான் அல்வாஸ் ரோபோ (Alvas Robo), உங்கள் AIET வளாக உதவியாளர். நூலகம், துறைகள், ஆசிரியர் அறைகள் அல்லது வளாக இடங்களுக்கான வழியை என்னிடம் கேளுங்கள்!",
  te: "నమస్కారం! నేను అల్వాಸ್ రోబో (Alvas Robo), మీ AIET క్యాంపస్ అసిస్టెంట్. లైబ్రరీ, డిపార్ట్‌మెంట్లు, ఫ్యాకల్టీ క్యాబిన్లు లేదా క్యాంపస్ ప్రదేశాల మార్గాల కోసం నన్ను అడగండి!",
  ml: "നമസ്കാരം! ഞാൻ അൽവാസ് റോബോ (Alvas Robo), നിങ്ങളുടെ AIET ക്യാമ്പസ് സഹായി. ലൈബ്രറി, ഡിപ്പാർട്ട്‌മെന്റുകൾ, ഫാക്കൽറ്റി ക്യാബിനുകൾ അല്ലെങ്കിൽ ക്യാമ്പസ് ലൊക്കേഷനുകൾ എന്നിവയിലേക്കുള്ള വഴികൾ എന്നോട് ചോദിക്കൂ!",
};

const navigationStartPhrases = ["start navigation", "start guiding", "begin navigation", "navigate now", "start", "ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭಿಸಿ", "ನ್ಯಾವಿಗೇಶನ್ ಪ್ರಾರಂಭಿಸಿ", "ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ", "ನೆವಿಗೇಶನ್ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ", "नेविगेशन शुरू करें", "मार्गदर्शन शुरू करें", "வழிசெலுத்தலைத் தொடங்கு", "మార్గదర్శనాన్ని ప్రారంభించండి", "నావిగేషన్ ప్రారంభించండి", "നാവിഗേഷൻ ആരംഭിക്കുക", "മാർഗ്ഗനിർദ്ദേശം ആരംഭിക്കുക"];
const directRoute = /(?:from\s+(.+?)\s+(?:to|towards)\s+(.+))|(?:(?:to|towards)\s+(.+?)\s+from\s+(.+))|(?:^\s*(.+?)\s+(?:to|towards)\s+(.+?)\s*$)/i;
const localizedRoutePairs = [
  { sourceId: "gate", destinationId: "d10", sourceStems: ["முதன்மை நுழைவாயி", "പ്രധാന കവാട"], destinationStems: ["மத்திய நூலக", "സെൻട്രൽ ലൈബ്ര"] },
];

const isNavigationStart = (value: string) => {
  const normalized = normalize(value);
  return navigationStartPhrases.some((phrase) => normalized === normalize(phrase) || normalized.includes(normalize(phrase)));
};

/**
 * Converts a recognised spoken direction request into a deterministic direct
 * route only when the user has already chosen a configured starting point.
 * This keeps voice navigation grounded in campus aliases and never invents a
 * location from a transcript.
 */
export function prepareSpokenRouteRequest(message: string, selectedSourceId?: string) {
  const destination = resolveCampusDestination(message);
  const explicitSource = resolveCampusSource(message);
  const selectedSource = selectedSourceId ? getNode(selectedSourceId) : undefined;
  const directionIntent = /\b(navigate|direction|directions|route|take me|go to|reach)\b|ಮಾರ್ಗ|ಹೋಗ|ನೆವಿಗ|दिशा|नेविग|मार्ग|வழிசெல|வழி|మార్గ|నావిగ|മാർഗ|നാവിഗ/i.test(message);
  if (!destination || explicitSource || !selectedSource || !directionIntent) return message;
  return `from ${selectedSource.name} to ${destination.name}`;
}

export function createConversationState(language: LanguageCode, conversationId = crypto.randomUUID()): AssistantConversationState {
  return { conversationId, intent: "idle", accessibilityRequired: false, language, navigationStatus: "idle" };
}

function withRoute(source: CampusNode, destination: Destination, state: AssistantConversationState): ConversationTurn {
  try {
    const result = calculateRoute(campusNodes, campusEdges, source.id, destination.nodeId, "auto", state.accessibilityRequired);
    const maneuvers = deriveRouteManeuvers(campusNodes, result.nodeIds);
    const instructions = maneuvers.map((m) => m.instruction);
    const persistedRoute: PersistedGuidedRoute = { sourceNodeId: source.id, destinationId: destination.id, totalDistance: result.totalDistance, estimatedTime: result.estimatedTime, instructions };
    const next = { ...state, intent: "route_ready" as const, sourceNodeId: source.id, destinationId: destination.id, navigationStatus: "ready" as const, route: persistedRoute };
    const minutes = Math.max(1, Math.ceil(result.estimatedTime / 60));
    const stepLines = maneuvers.map((m, index) => `${index + 1}. ${m.instruction}`);
    const summary = `${replies[state.language].routeFound} ${source.name} → ${destination.name}. ${result.totalDistance} m · ${routeDuration[state.language](minutes)}.`;
    const reply = `${summary}\n\n${stepLines.join("\n")}`;
    return { handled: true, state: next, route: { source, destination, result, instructions }, reply };
  } catch {
    return { handled: true, state, reply: replies[state.language].routeError };
  }
}

function extractDirectRoute(message: string) {
  const match = message.match(directRoute);
  if (!match) {
    const findAliasPosition = (aliases: string[]) => Math.min(...aliases.map((alias) => normalize(message).indexOf(normalize(alias))).filter((position) => position >= 0));
    const source = Object.entries(sourceAliases).map(([id, aliases]) => ({ id, position: findAliasPosition(aliases) })).filter((candidate) => Number.isFinite(candidate.position)).sort((a, b) => a.position - b.position)[0];
    const destination = source ? Object.entries(destinationAliases).map(([id, aliases]) => ({ id, position: findAliasPosition(aliases) })).filter((candidate) => Number.isFinite(candidate.position) && candidate.position > source.position).sort((a, b) => a.position - b.position)[0] : undefined;
    if (!source || !destination) {
      const localizedPair = localizedRoutePairs.find((pair) => pair.sourceStems.some((stem) => normalize(message).includes(normalize(stem))) && pair.destinationStems.some((stem) => normalize(message).includes(normalize(stem))));
      if (!localizedPair) return undefined;
      return { source: getNode(localizedPair.sourceId), destination: destinations.find((item) => item.id === localizedPair.destinationId) };
    }
    return { source: getNode(source.id), destination: destinations.find((item) => item.id === destination.id) };
  }
  const sourceText = match[1] ?? match[4] ?? match[5];
  const destinationText = match[2] ?? match[3] ?? match[6];
  if (!sourceText || !destinationText) return undefined;
  return { source: resolveCampusSource(sourceText), destination: resolveCampusDestination(destinationText) };
}

const isStepByStepIntent = (value: string) => {
  const norm = normalize(value);
  return (
    /\b(step[- ]?by[- ]?step|directions?|guide me|take me there|navigate to|route|show me the way|start voice|walk me through)\b/i.test(norm) ||
    /ಹಂತ.*ಮಾರ್ಗದರ್ಶನ|ಹಂತ.*ದಾರಿ|ದಾರಿ|ಮಾರ್ಗ|ತೋರಿಸಿ|ಕೊಡಿ|दिशा.*निर्देश|रास्ता|मार्ग|வழிகாட்டு|வழிகாட்டுதல்|வழி|దిశలు|దారి|మార్గం|നിർദ്ദേശങ്ങൾ|വഴി/i.test(norm)
  );
};

export function continueRouteConversation(message: string, previous: AssistantConversationState): ConversationTurn {
  const state = { ...previous };
  const text = normalize(message);
  state.accessibilityRequired = state.accessibilityRequired || /step free|stepfree|accessible|wheelchair/i.test(message);

  // If the user asks a person question (e.g. "who is the principal", "who is the chairman"), let knowledge handler answer
  if (/\b(who|ಯಾರು|ಕೌನ್|யார்|ఎవరు|ആരാണ്)\b/i.test(message) && /\b(principal|chairman|hod|trustee|president|head|founder|ಡಾ|dr|doctor|ಪ್ರಿನ್ಸಿಪಾಲ್|ಪ್ರಾಂಶುಪಾಲ|ಚೇರ್ಮನ್|ಅಧ್ಯಕ್ಷ)\b/i.test(message)) {
    return { handled: false, state };
  }

  const direct = extractDirectRoute(message);
  if (direct?.source && direct.destination) return withRoute(direct.source, direct.destination, { ...state, destinationId: direct.destination.id });

  const destination = resolveCampusDestination(message);

  if (state.intent === "awaiting_route_confirmation") {
    const selectedDestination = state.destinationId ? destinations.find((item) => item.id === state.destinationId) : destination;

    // Check if user directly provided source ("main gate", "gate ninda", "hostel")
    const directSource = resolveCampusSource(message);
    if (directSource && selectedDestination) {
      return withRoute(directSource, selectedDestination, state);
    }

    if (selectedDestination && isStepByStepIntent(message)) {
      const explicitSource = resolveCampusSource(message);
      const source = explicitSource ?? (state.sourceNodeId ? getNode(state.sourceNodeId) : getNode("gate"));
      if (source) return withRoute(source, selectedDestination, state);
    }

    // User confirmed: "howdu", "haudu", "yes", "sari", "beku", etc.
    if (isAffirmative(text)) {
      const explicitSource = resolveCampusSource(message);
      if (explicitSource && selectedDestination) {
        return withRoute(explicitSource, selectedDestination, state);
      }
      if (state.sourceNodeId && selectedDestination) {
        const source = getNode(state.sourceNodeId);
        if (source) return withRoute(source, selectedDestination, state);
      }
      return { handled: true, state: { ...state, intent: "awaiting_source" }, reply: replies[state.language].source };
    }

    // User canceled: "no", "beda", "illa", "cancel"
    if (isNegative(text)) {
      return { handled: true, state: { ...state, intent: "idle" }, reply: cancellationReplies[state.language] };
    }

    // User switched destination
    if (destination) {
      return { handled: true, state: { ...state, destinationId: destination.id, intent: "awaiting_route_confirmation" }, reply: `${destinationLocation[state.language](destination)} ${destination.description} ${replies[state.language].directions}` };
    }
  }

  if (state.intent === "awaiting_source") {
    const selectedDestination = state.destinationId ? destinations.find((item) => item.id === state.destinationId) : undefined;

    // User canceled
    if (isNegative(text)) {
      return { handled: true, state: { ...state, intent: "idle" }, reply: cancellationReplies[state.language] };
    }

    const source = resolveCampusSource(message);
    if (source && selectedDestination) return withRoute(source, selectedDestination, state);

    if ((isAffirmative(text) || isStepByStepIntent(message) || /\b(here|current|start|entrance)\b/i.test(text)) && selectedDestination) {
      const fallbackSource = state.sourceNodeId ? getNode(state.sourceNodeId) : getNode("gate");
      if (fallbackSource) return withRoute(fallbackSource, selectedDestination, state);
    }
    if (destination) return { handled: true, state: { ...state, destinationId: destination.id }, reply: replies[state.language].source };
    return { handled: true, state, reply: replies[state.language].sourceNotFound };
  }

  if ((state.intent === "route_ready" || state.intent === "navigating") && isNavigationStart(message)) {
    const source = state.sourceNodeId ? getNode(state.sourceNodeId) : undefined;
    const selectedDestination = state.destinationId ? destinations.find((item) => item.id === state.destinationId) : undefined;
    if (source && selectedDestination) {
      const turn = withRoute(source, selectedDestination, state);
      return { ...turn, state: { ...turn.state, intent: "navigating", navigationStatus: "active" }, action: "start_navigation", reply: replies[state.language].ready };
    }
  }

  if ((state.intent === "route_ready" || state.intent === "navigating") && isNegative(text)) {
    return { handled: true, state: { ...state, intent: "idle", navigationStatus: "idle" }, reply: cancellationReplies[state.language] };
  }

  if (state.destinationId && isStepByStepIntent(message) && !destination) {
    const targetDest = destinations.find((item) => item.id === state.destinationId);
    if (targetDest) {
      const explicitSource = resolveCampusSource(message);
      const source = explicitSource ?? (state.sourceNodeId ? getNode(state.sourceNodeId) : getNode("gate"));
      if (source) return withRoute(source, targetDest, state);
    }
  }

  if (destination) {
    const directIntent = /\b(take me|how .*reach|navigate|directions|route|go to)\b/i.test(message);
    if (directIntent) {
      const explicitSource = resolveCampusSource(message);
      if (explicitSource) return withRoute(explicitSource, destination, state);
      if (state.sourceNodeId || isStepByStepIntent(message)) {
        const source = state.sourceNodeId ? getNode(state.sourceNodeId) : getNode("gate");
        if (source) return withRoute(source, destination, state);
      }
      return { handled: true, state: { ...state, destinationId: destination.id, intent: "awaiting_source" }, reply: `${destinationLocation[state.language](destination)} ${replies[state.language].source}` };
    }
    return { handled: true, state: { ...state, destinationId: destination.id, intent: "awaiting_route_confirmation" }, reply: `${destinationLocation[state.language](destination)} ${destination.description} ${destination.accessibilityInfo}. ${replies[state.language].directions}` };
  }

  if (isGreeting(text)) {
    return { handled: true, state, reply: greetingsReplies[state.language] };
  }

  if (/\b(where|location|route|navigate|direction|take me|reach)\b/i.test(message)) return { handled: true, state, reply: replies[state.language].notFound };
  return { handled: false, state };
}

