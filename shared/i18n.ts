export const supportedLanguageCodes = ["en", "kn", "tcy", "hi", "ta", "te", "ml"] as const;

export type LanguageCode = (typeof supportedLanguageCodes)[number];

export const languageOptions: Record<LanguageCode, { label: string; nativeLabel: string; speechLocale: string }> = {
  en: { label: "English", nativeLabel: "English", speechLocale: "en-IN" },
  kn: { label: "Kannada", nativeLabel: "ಕನ್ನಡ", speechLocale: "kn-IN" },
  tcy: { label: "Tulu", nativeLabel: "ತುಳು", speechLocale: "kn-IN" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", speechLocale: "hi-IN" },
  ta: { label: "Tamil", nativeLabel: "தமிழ்", speechLocale: "ta-IN" },
  te: { label: "Telugu", nativeLabel: "తెలుగు", speechLocale: "te-IN" },
  ml: { label: "Malayalam", nativeLabel: "മലയാളം", speechLocale: "ml-IN" },
};

const english = {
  language: "Language",
  navMap: "Map",
  navAr: "AR guidance",
  navHistory: "History",
  navAccount: "Account",
  navAdmin: "Admin",
  navAssistant: "AI assistant",
  assistantKicker: "AIET multilingual assistance",
  assistantTitle: "Ask PathFinder anything about the configured campus.",
  assistantSubtitle: "Ask in your preferred language, speak your question, or hear a response aloud.",
  assistantEmpty: "Ask about a configured destination, route, accessibility option, or campus feature.",
  assistantPlaceholder: "Ask PathFinder about campus navigation…",
  startListening: "Start voice input",
  stopListening: "Stop voice input",
  listening: "Listening… speak your campus question.",
  voiceRepliesOn: "Voice replies on",
  voiceRepliesOff: "Voice replies off",
  speechUnavailable: "Voice input is not available in this browser. You can still type your question.",
  assistantError: "PathFinder could not answer right now. Please try again in a moment.",
  assistantUnsupportedLanguage: "The selected language is not supported for AI replies. Choose one of the listed languages and try again.",
  assistantThinking: "PathFinder is preparing an answer…",
  assistantRoute: "Plan a route",
  assistantSourceNote: "Answers are based on the locations currently configured in PathFinder.",
  assistantLanguageSupport: "AI replies are currently available only in the listed languages.",
};

export type TranslationKey = keyof typeof english;

export const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: english,
  kn: {
    language: "ಭಾಷೆ", navMap: "ನಕ್ಷೆ", navAr: "AR ಮಾರ್ಗದರ್ಶನ", navHistory: "ಇತಿಹಾಸ", navAccount: "ಖಾತೆ", navAdmin: "ನಿರ್ವಾಹಕ", navAssistant: "AI ಸಹಾಯಕ",
    assistantKicker: "AIET ಬಹುಭಾಷಾ ಸಹಾಯ", assistantTitle: "ಕಾನ್ಫಿಗರ್ ಮಾಡಿರುವ ಕ್ಯಾಂಪಸ್ ಬಗ್ಗೆ ಪಾತ್‌ಫೈಂಡರ್ ಅನ್ನು ಕೇಳಿ.", assistantSubtitle: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ, ಪ್ರಶ್ನೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಉತ್ತರವನ್ನು ಕೇಳಿ.", assistantEmpty: "ಕಾನ್ಫಿಗರ್ ಮಾಡಿರುವ ಗಮ್ಯಸ್ಥಾನ, ಮಾರ್ಗ, ಪ್ರವೇಶಸೌಲಭ್ಯ ಅಥವಾ ಕ್ಯಾಂಪಸ್ ಸೌಲಭ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ.", assistantPlaceholder: "ಕ್ಯಾಂಪಸ್ ನ್ಯಾವಿಗೇಶನ್ ಕುರಿತು ಪಾತ್‌ಫೈಂಡರ್‌ಗೆ ಕೇಳಿ…", startListening: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಪ್ರಾರಂಭಿಸಿ", stopListening: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ನಿಲ್ಲಿಸಿ", listening: "ಕೇಳಲಾಗುತ್ತಿದೆ… ನಿಮ್ಮ ಕ್ಯಾಂಪಸ್ ಪ್ರಶ್ನೆಯನ್ನು ಹೇಳಿ.", voiceRepliesOn: "ಧ್ವನಿ ಉತ್ತರಗಳು ಆನ್", voiceRepliesOff: "ಧ್ವನಿ ಉತ್ತರಗಳು ಆಫ್", speechUnavailable: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಬಹುದು.", assistantError: "ಪಾತ್‌ಫೈಂಡರ್ ಈಗ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.", assistantUnsupportedLanguage: "ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಗೆ AI ಉತ್ತರಗಳು ಲಭ್ಯವಿಲ್ಲ. ಪಟ್ಟಿಯಲ್ಲಿರುವ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", assistantThinking: "ಪಾತ್‌ಫೈಂಡರ್ ಉತ್ತರವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ…", assistantRoute: "ಮಾರ್ಗ ಯೋಜಿಸಿ", assistantSourceNote: "ಉತ್ತರಗಳು ಪಾತ್‌ಫೈಂಡರ್‌ನಲ್ಲಿ ಈಗ ಕಾನ್ಫಿಗರ್ ಮಾಡಿರುವ ಸ್ಥಳಗಳನ್ನು ಆಧರಿಸಿವೆ.", assistantLanguageSupport: "AI ಉತ್ತರಗಳು ಈಗ ಪಟ್ಟಿಯಲ್ಲಿರುವ ಭಾಷೆಗಳಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯವಿವೆ.",
  },
  tcy: {
    language: "ಬಾಸೆ", navMap: "ನಕ್ಷೆ", navAr: "AR ಮಾರ್ಗದರ್ಶನ", navHistory: "ಇತಿಹಾಸ", navAccount: "ಖಾತೆ", navAdmin: "ನಿರ್ವಾಹಕ", navAssistant: "AI ಸಹಾಯಕ",
    assistantKicker: "AIET ಬಹುಬಾಸೆ ಸಹಾಯ", assistantTitle: "ಸಿದ್ಧ ಮಲ್ತಿನ ಕ್ಯಾಂಪಸ್ ಬಗ್ಗೆ ಪಾತ್‌ಫೈಂಡರ್‌ಡ ಕೇಳುಲೆ.", assistantSubtitle: "ನಿಂಗ ಇಷ್ಟದ ಬಾಸೆಡ್ ಕೇಳುಲೆ, ಪ್ರಶ್ನೆಡ್ ಮಾತಾಡುಲೆ ಅತ್ತಂಡ ಉತ್ತರ ಕೆಳೆಲೆ.", assistantEmpty: "ಸಿದ್ಧ ಮಲ್ತಿನ ಗಮ್ಯಸ್ಥಾನ, ದಾರಿ, ಸುಲಭ ಪ್ರವೇಶ ಆಯ್ಕೆ ಅತ್ತಂಡ ಕ್ಯಾಂಪಸ್ ಸೌಲಭ್ಯ ಬಗ್ಗೆ ಕೇಳುಲೆ.", assistantPlaceholder: "ಕ್ಯಾಂಪಸ್ ದಾರಿ ಪತ್ತೆ ಬಗ್ಗೆ ಪಾತ್‌ಫೈಂಡರ್‌ಡ ಕೇಳುಲೆ…", startListening: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ", stopListening: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ನಿಲ್ಪುಲೆ", listening: "ಕೆಳ್ತೊಂದ್ ಉಂಡು… ನಿಂಗ ಕ್ಯಾಂಪಸ್ ಪ್ರಶ್ನೆಡ್ ಪಾತೆರ್ಲೆ.", voiceRepliesOn: "ಧ್ವನಿ ಉತ್ತರೊ ಆನ್", voiceRepliesOff: "ಧ್ವನಿ ಉತ್ತರೊ ಆಫ್", speechUnavailable: "ಈ ಬ್ರೌಸರ್‌ಡ್ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಇಜ್ಜಿ. ನಿಂಗ ಪ್ರಶ್ನೆಡ್ ಟೈಪ್ ಮಲ್ಪೊಲಿ.", assistantError: "ಪಾತ್‌ಫೈಂಡರ್ ಇತ್ತ ಉತ್ತರ ಕೊರ್ಪೆರೆ ಆಯಿಜ್ಜಿ. ಸ್ವಲ್ಪ ಪೊರ್ಲುಡ್ ಮತ್ತೆ ಪ್ರಯತ್ನ ಮಲ್ಪುಲೆ.", assistantUnsupportedLanguage: "ಆಯ್ಕೆ ಮಲ್ತಿನ ಬಾಸೆಡ್ AI ಉತ್ತರೊ ಇಜ್ಜ. ಪಟ್ಟಿಡ್ ಉಪ್ಪುನ ಬಾಸೆಡ್ ಆರಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನ ಮಲ್ಪುಲೆ.", assistantThinking: "ಪಾತ್‌ಫೈಂಡರ್ ಉತ್ತರ ಸಿದ್ಧ ಮಲ್ತೊಂದ್ ಉಂಡು…", assistantRoute: "ದಾರಿ ಯೋಜನೆ ಮಲ್ಪುಲೆ", assistantSourceNote: "ಉತ್ತರೊ ಪಾತ್‌ಫೈಂಡರ್‌ಡ್ ಸದ್ಯ ಸಿದ್ಧ ಮಲ್ತಿನ ಸ್ಥಳೊಲೆ ಆಧಾರ ಮಲ್ತೆ ಉಲ್ಲ.", assistantLanguageSupport: "AI ಉತ್ತರೊ ಇತ್ತ ಪಟ್ಟಿಡ್ ಉಪ್ಪುನ ಬಾಸೆಲೆಡ್ ಮಾತ್ರ ಉಲ್ಲ.",
  },
  hi: {
    language: "भाषा", navMap: "मानचित्र", navAr: "AR मार्गदर्शन", navHistory: "इतिहास", navAccount: "खाता", navAdmin: "प्रशासक", navAssistant: "AI सहायक",
    assistantKicker: "AIET बहुभाषी सहायता", assistantTitle: "कॉन्फ़िगर किए गए परिसर के बारे में पाथफाइंडर से पूछें।", assistantSubtitle: "अपनी पसंदीदा भाषा में पूछें, प्रश्न बोलें या उत्तर सुनें।", assistantEmpty: "कॉन्फ़िगर किए गए गंतव्य, मार्ग, सुगम्यता विकल्प या परिसर सुविधा के बारे में पूछें।", assistantPlaceholder: "कैंपस नेविगेशन के बारे में पाथफाइंडर से पूछें…", startListening: "वॉइस इनपुट शुरू करें", stopListening: "वॉइस इनपुट रोकें", listening: "सुन रहा है… अपना कैंपस प्रश्न बोलें।", voiceRepliesOn: "वॉइस उत्तर चालू", voiceRepliesOff: "वॉइस उत्तर बंद", speechUnavailable: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। आप अपना प्रश्न टाइप कर सकते हैं।", assistantError: "पाथफाइंडर अभी उत्तर नहीं दे सका। कृपया कुछ समय बाद फिर प्रयास करें।", assistantUnsupportedLanguage: "चुनी गई भाषा में AI उत्तर उपलब्ध नहीं हैं। सूची में दी गई भाषा चुनकर फिर प्रयास करें।", assistantThinking: "पाथफाइंडर उत्तर तैयार कर रहा है…", assistantRoute: "मार्ग बनाएं", assistantSourceNote: "उत्तर पाथफाइंडर में वर्तमान में कॉन्फ़िगर स्थानों पर आधारित हैं।", assistantLanguageSupport: "AI उत्तर अभी केवल सूचीबद्ध भाषाओं में उपलब्ध हैं।",
  },
  ta: {
    language: "மொழி", navMap: "வரைபடம்", navAr: "AR வழிகாட்டுதல்", navHistory: "வரலாறு", navAccount: "கணக்கு", navAdmin: "நிர்வாகம்", navAssistant: "AI உதவியாளர்",
    assistantKicker: "AIET பன்மொழி உதவி", assistantTitle: "உள்ளமைக்கப்பட்ட வளாகத்தைப் பற்றி பாத்ஃபைண்டரிடம் கேளுங்கள்.", assistantSubtitle: "உங்கள் விருப்ப மொழியில் கேளுங்கள், கேள்வியைப் பேசுங்கள் அல்லது பதிலைக் கேளுங்கள்.", assistantEmpty: "உள்ளமைக்கப்பட்ட இடம், பாதை, அணுகல் விருப்பம் அல்லது வளாக வசதி குறித்து கேளுங்கள்.", assistantPlaceholder: "வளாக வழிசெலுத்தல் பற்றி பாத்ஃபைண்டரிடம் கேளுங்கள்…", startListening: "குரல் உள்ளீட்டைத் தொடங்கு", stopListening: "குரல் உள்ளீட்டை நிறுத்து", listening: "கேட்கிறது… உங்கள் வளாகக் கேள்வியைப் பேசுங்கள்.", voiceRepliesOn: "குரல் பதில்கள் இயக்கத்தில்", voiceRepliesOff: "குரல் பதில்கள் முடக்கப்பட்டன", speechUnavailable: "இந்த உலாவியில் குரல் உள்ளீடு கிடைக்கவில்லை. உங்கள் கேள்வியைத் தட்டச்சு செய்யலாம்.", assistantError: "பாத்ஃபைண்டரால் இப்போது பதிலளிக்க முடியவில்லை. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.", assistantUnsupportedLanguage: "தேர்ந்தெடுத்த மொழியில் AI பதில்கள் கிடைக்கவில்லை. பட்டியலில் உள்ள மொழியைத் தேர்வு செய்து மீண்டும் முயற்சிக்கவும்.", assistantThinking: "பாத்ஃபைண்டர் பதிலைத் தயாரிக்கிறது…", assistantRoute: "பாதையைத் திட்டமிடு", assistantSourceNote: "பதில்கள் தற்போது பாத்ஃபைண்டரில் உள்ளமைக்கப்பட்ட இடங்களை அடிப்படையாகக் கொண்டவை.", assistantLanguageSupport: "AI பதில்கள் தற்போது பட்டியலிடப்பட்ட மொழிகளில் மட்டுமே கிடைக்கின்றன.",
  },
  te: {
    language: "భాష", navMap: "మ్యాప్", navAr: "AR మార్గదర్శనం", navHistory: "చరిత్ర", navAccount: "ఖాతా", navAdmin: "నిర్వాహకుడు", navAssistant: "AI సహాయకుడు",
    assistantKicker: "AIET బహుభాషా సహాయం", assistantTitle: "కాన్ఫిగర్ చేసిన క్యాంపస్ గురించి పాత్‌ఫైండర్‌ను అడగండి.", assistantSubtitle: "మీ భాషలో అడగండి, ప్రశ్నను మాట్లాడండి లేదా సమాధానాన్ని వినండి.", assistantEmpty: "కాన్ఫిగర్ చేసిన గమ్యం, మార్గం, ప్రాప్యత ఎంపిక లేదా క్యాంపస్ సౌకర్యం గురించి అడగండి.", assistantPlaceholder: "క్యాంపస్ నావిగేషన్ గురించి పాత్‌ఫైండర్‌ను అడగండి…", startListening: "వాయిస్ ఇన్‌పుట్ ప్రారంభించండి", stopListening: "వాయిస్ ఇన్‌పుట్ ఆపండి", listening: "వింటోంది… మీ క్యాంపస్ ప్రశ్నను చెప్పండి.", voiceRepliesOn: "వాయిస్ సమాధానాలు ఆన్", voiceRepliesOff: "వాయిస్ సమాధానాలు ఆఫ్", speechUnavailable: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. మీరు ప్రశ్నను టైప్ చేయవచ్చు.", assistantError: "పాత్‌ఫైండర్ ఇప్పుడే సమాధానం ఇవ్వలేకపోయింది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి.", assistantUnsupportedLanguage: "ఎంచుకున్న భాషలో AI సమాధానాలు అందుబాటులో లేవు. జాబితాలోని భాషను ఎంచుకుని మళ్లీ ప్రయత్నించండి.", assistantThinking: "పాత్‌ఫైండర్ సమాధానాన్ని సిద్ధం చేస్తోంది…", assistantRoute: "మార్గాన్ని ప్లాన్ చేయండి", assistantSourceNote: "సమాధానాలు పాత్‌ఫైండర్‌లో ప్రస్తుతం కాన్ఫిగర్ చేసిన స్థానాల ఆధారంగా ఉంటాయి.", assistantLanguageSupport: "AI సమాధానాలు ప్రస్తుతం జాబితాలో ఉన్న భాషల్లో మాత్రమే అందుబాటులో ఉన్నాయి.",
  },
  ml: {
    language: "ഭാഷ", navMap: "മാപ്പ്", navAr: "AR മാർഗ്ഗനിർദ്ദേശം", navHistory: "ചരിത്രം", navAccount: "അക്കൗണ്ട്", navAdmin: "അഡ്മിൻ", navAssistant: "AI സഹായി",
    assistantKicker: "AIET ബഹുഭാഷാ സഹായം", assistantTitle: "ക്രമീകരിച്ച ക്യാമ്പസിനെക്കുറിച്ച് പാത്ത്ഫൈൻഡറിനോട് ചോദിക്കൂ.", assistantSubtitle: "നിങ്ങളുടെ ഭാഷയിൽ ചോദിക്കൂ, ചോദ്യം സംസാരിക്കൂ, അല്ലെങ്കിൽ മറുപടി കേൾക്കൂ.", assistantEmpty: "ക്രമീകരിച്ച ലക്ഷ്യം, റൂട്ട്, പ്രവേശനസൗകര്യ ഓപ്ഷൻ, അല്ലെങ്കിൽ ക്യാമ്പസ് സൗകര്യം എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ.", assistantPlaceholder: "ക്യാമ്പസ് നാവിഗേഷനെക്കുറിച്ച് പാത്ത്ഫൈൻഡറിനോട് ചോദിക്കൂ…", startListening: "വോയ്‌സ് ഇൻപുട്ട് ആരംഭിക്കുക", stopListening: "വോയ്‌സ് ഇൻപുട്ട് നിർത്തുക", listening: "കേൾക്കുന്നു… നിങ്ങളുടെ ക്യാമ്പസ് ചോദ്യം പറയൂ.", voiceRepliesOn: "വോയ്‌സ് മറുപടികൾ ഓൺ", voiceRepliesOff: "വോയ്‌സ് മറുപടികൾ ഓഫ്", speechUnavailable: "ഈ ബ്രൗസറിൽ വോയ്‌സ് ഇൻപുട്ട് ലഭ്യമല്ല. നിങ്ങൾക്ക് ചോദ്യം ടൈപ്പ് ചെയ്യാം.", assistantError: "പാത്ത്ഫൈൻഡറിന് ഇപ്പോൾ മറുപടി നൽകാനായില്ല. ദയവായി അല്പസമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.", assistantUnsupportedLanguage: "തിരഞ്ഞെടുത്ത ഭാഷയിൽ AI മറുപടികൾ ലഭ്യമല്ല. പട്ടികയിലെ ഭാഷ തിരഞ്ഞെടുത്ത് വീണ്ടും ശ്രമിക്കുക.", assistantThinking: "പാത്ത്ഫൈൻഡർ മറുപടി തയ്യാറാക്കുന്നു…", assistantRoute: "റൂട്ട് പ്ലാൻ ചെയ്യുക", assistantSourceNote: "മറുപടികൾ പാത്ത്ഫൈൻഡറിൽ നിലവിൽ ക്രമീകരിച്ച സ്ഥലങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്.", assistantLanguageSupport: "AI മറുപടികൾ നിലവിൽ പട്ടികപ്പെടുത്തിയ ഭാഷകളിൽ മാത്രം ലഭ്യമാണ്.",
  },
};

export const getTranslation = (language: LanguageCode, key: TranslationKey) => translations[language][key];

export const routeLaunchUnavailable: Record<LanguageCode, string> = {
  en: "Route launch is temporarily unavailable. Please use the map route planner.",
  kn: "ಮಾರ್ಗ ಪ್ರಾರಂಭಿಸುವಿಕೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಕ್ಷೆ ಮಾರ್ಗ ಯೋಜಕವನ್ನು ಬಳಸಿ.",
  tcy: "ದಾರಿ ಪ್ರಾರಂಭ ಇತ್ತ ಲಭ್ಯ ಇಜ್ಜಿ. ದಯವಿಟ್ಟು ನಕ್ಷೆ ದಾರಿ ಯೋಜಕನ್ ಬಳಕೆ ಮಲ್ಪುಲೆ.",
  hi: "मार्ग शुरू करना अस्थायी रूप से उपलब्ध नहीं है। कृपया मानचित्र मार्ग योजनाकार का उपयोग करें।",
  ta: "பாதையைத் தொடங்குவது தற்காலிகமாக கிடைக்கவில்லை. வரைபடப் பாதைத் திட்டமிடியைப் பயன்படுத்தவும்.",
  te: "మార్గాన్ని ప్రారంభించడం తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి మ్యాప్ రూట్ ప్లానర్‌ను ఉపయోగించండి.",
  ml: "റൂട്ട് ആരംഭിക്കൽ താൽക്കാലികമായി ലഭ്യമല്ല. ദയവായി മാപ്പ് റൂട്ട് പ്ലാനർ ഉപയോഗിക്കുക.",
};

export const assistantNetworkUnavailable: Record<LanguageCode, string> = {
  en: "You appear to be offline. Reconnect to the internet, then try your question again.",
  kn: "ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿರುವಂತೆ ತೋರುತ್ತದೆ. ಇಂಟರ್ನೆಟ್‌ಗೆ ಮರುಸಂಪರ್ಕಿಸಿ, ನಂತರ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  tcy: "ನಿಂಗ ಆಫ್‌ಲೈನ್‌ಡ್ ಇದ್ದೆರ್ ಪಂಡು ತೋನ್ದುಂಡು. ಇಂಟರ್ನೆಟ್‌ಗ್ ಮತ್ತೆ ಸಂಪರ್ಕ ಮಲ್ಪುಲೆ, ಆಮೇಲೆ ಪ್ರಶ್ನೆಡ್ ಮತ್ತೆ ಪ್ರಯತ್ನ ಮಲ್ಪುಲೆ.",
  hi: "लगता है आप ऑफ़लाइन हैं। इंटरनेट से दोबारा कनेक्ट करें, फिर अपना प्रश्न पूछें।",
  ta: "நீங்கள் இணைய இணைப்பில் இல்லை போல் தெரிகிறது. இணையத்துடன் மீண்டும் இணைந்து, உங்கள் கேள்வியை மீண்டும் முயற்சிக்கவும்.",
  te: "మీరు ఆఫ్‌లైన్‌లో ఉన్నట్లు కనిపిస్తోంది. ఇంటర్నెట్‌కు మళ్లీ కనెక్ట్ అయి, ప్రశ్నను మళ్లీ ప్రయత్నించండి.",
  ml: "നിങ്ങൾ ഓഫ്‌ലൈനിലാണെന്ന് തോന്നുന്നു. ഇന്റർനെറ്റിലേക്ക് വീണ്ടും കണക്റ്റ് ചെയ്ത് ചോദ്യം വീണ്ടും ശ്രമിക്കുക.",
};

export const voicePermissionDenied: Record<LanguageCode, string> = {
  en: "Microphone permission is required for voice input. You can still type your question.",
  kn: "ಧ್ವನಿ ಇನ್‌ಪುಟ್‌ಗಾಗಿ ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಬಹುದು.",
  tcy: "ಧ್ವನಿ ಇನ್‌ಪುಟ್‌ಗ್ ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಬೇಕು. ನಿಂಗ ಪ್ರಶ್ನೆಡ್ ಟೈಪ್ ಮಲ್ಪೊಲಿ.",
  hi: "वॉइस इनपुट के लिए माइक्रोफ़ोन अनुमति आवश्यक है। आप अपना प्रश्न टाइप कर सकते हैं।",
  ta: "குரல் உள்ளீட்டுக்கு மைக்ரோஃபோன் அனுமதி தேவை. உங்கள் கேள்வியைத் தட்டச்சு செய்யலாம்.",
  te: "వాయిస్ ఇన్‌పుట్‌కు మైక్రోఫోన్ అనుమతి అవసరం. మీరు ప్రశ్నను టైప్ చేయవచ్చు.",
  ml: "വോയ്‌സ് ഇൻപുട്ടിന് മൈക്രോഫോൺ അനുമതി ആവശ്യമാണ്. നിങ്ങൾക്ക് ചോദ്യം ടൈപ്പ് ചെയ്യാം.",
};
