import type { LanguageCode } from "./i18n";

export type VoiceInputCopy = {
  recording: string;
  transcribing: string;
  fallbackReady: string;
  captureUnsupported: string;
  noSpeech: string;
  transcriptionFailed: string;
  recordingTooLong: string;
};

export const voiceInputCopy: Record<LanguageCode, VoiceInputCopy> = {
  en: {
    recording: "Recording your request… tap again when you are done.",
    transcribing: "Transcribing your request…",
    fallbackReady: "Voice input is ready. PathFinder will record your request and transcribe it.",
    captureUnsupported: "Voice input is not supported by this browser. Type your request instead.",
    noSpeech: "I could not hear a clear request. Please try again or type it.",
    transcriptionFailed: "I could not transcribe that recording. Please try again or type your request.",
    recordingTooLong: "Keep a recorded request under one minute.",
  },
  kn: {
    recording: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ… ಮುಗಿದಾಗ ಮತ್ತೆ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    transcribing: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ…",
    fallbackReady: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಸಿದ್ಧವಾಗಿದೆ. ಪಾತ್‌ಫೈಂಡರ್ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ದಾಖಲಿಸಿ ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸುತ್ತದೆ.",
    captureUnsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    noSpeech: "ಸ್ಪಷ್ಟವಾದ ವಿನಂತಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
    transcriptionFailed: "ದಾಖಲಿಸಿದ ಧ್ವನಿಯನ್ನು ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
    recordingTooLong: "ದಾಖಲಿಸಿದ ವಿನಂತಿಯನ್ನು ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ ಇಡಿ.",
  },
  tcy: {
    recording: "ನಿಂಗ ವಿನಂತಿಡ್ ದಾಖಲೆ ಮಲ್ತೊಂದ್ ಉಂಡು… ಮುಗಿದ ಪುದರ್ ಮತ್ತೆ ಟ್ಯಾಪ್ ಮಲ್ಪುಲೆ.",
    transcribing: "ನಿಂಗ ವಿನಂತಿಡ್ ಬರಹಕ್ಕೆ ಮಾರ್ಪಾಡ್ ಮಲ್ತೊಂದ್ ಉಂಡು…",
    fallbackReady: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಸಿದ್ಧ ಉಂಡು. ಪಾತ್‌ಫೈಂಡರ್ ನಿಂಗ ವಿನಂತಿಡ್ ದಾಖಲೆ ಮಲ್ತ್ ಬರಹಕ್ಕೆ ಮಾರ್ಪಾಡ್ ಮಲ್ಪುಂಡು.",
    captureUnsupported: "ಈ ಬ್ರೌಸರ್‌ಡ್ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬೆಂಬಲ ಇಜ್ಜಿ. ನಿಂಗ ವಿನಂತಿಡ್ ಟೈಪ್ ಮಲ್ಪುಲೆ.",
    noSpeech: "ಸ್ಪಷ್ಟ ವಿನಂತಿ ಕೆಳಪ್ಪುಜಿ. ಮತ್ತೆ ಪ್ರಯತ್ನ ಮಲ್ಪುಲೆ ಅತ್ತಂಡ ಟೈಪ್ ಮಲ್ಪುಲೆ.",
    transcriptionFailed: "ಆ ದಾಖಲೆಯನ್ ಬರಹಕ್ಕೆ ಮಾರ್ಪಾಡ್ ಮಲ್ಪೆರೆ ಆಯಿಜ್ಜಿ. ಮತ್ತೆ ಪ್ರಯತ್ನ ಮಲ್ಪುಲೆ ಅತ್ತಂಡ ಟೈಪ್ ಮಲ್ಪುಲೆ.",
    recordingTooLong: "ದಾಖಲೆ ಮಲ್ತಿನ ವಿನಂತಿಡ್ ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ ದೀರೆ.",
  },
  hi: {
    recording: "आपका अनुरोध रिकॉर्ड हो रहा है… पूरा होने पर फिर टैप करें।",
    transcribing: "आपका अनुरोध लिखित रूप में बदला जा रहा है…",
    fallbackReady: "वॉइस इनपुट तैयार है। पाथफाइंडर आपके अनुरोध को रिकॉर्ड करके लिखित रूप में बदलेगा।",
    captureUnsupported: "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। अपना अनुरोध टाइप करें।",
    noSpeech: "मुझे स्पष्ट अनुरोध सुनाई नहीं दिया। कृपया फिर कोशिश करें या टाइप करें।",
    transcriptionFailed: "उस रिकॉर्डिंग को लिखित रूप में बदला नहीं जा सका। कृपया फिर कोशिश करें या अपना अनुरोध टाइप करें।",
    recordingTooLong: "रिकॉर्ड किया गया अनुरोध एक मिनट से कम रखें।",
  },
  ta: {
    recording: "உங்கள் கோரிக்கை பதிவு செய்யப்படுகிறது… முடிந்ததும் மீண்டும் தட்டவும்.",
    transcribing: "உங்கள் கோரிக்கை உரையாக மாற்றப்படுகிறது…",
    fallbackReady: "குரல் உள்ளீடு தயாராக உள்ளது. பாத்ஃபைண்டர் உங்கள் கோரிக்கையை பதிவு செய்து உரையாக மாற்றும்.",
    captureUnsupported: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. உங்கள் கோரிக்கையை தட்டச்சு செய்யவும்.",
    noSpeech: "தெளிவான கோரிக்கை கேட்கவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.",
    transcriptionFailed: "அந்த பதிவை உரையாக மாற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் கோரிக்கையை தட்டச்சு செய்யவும்.",
    recordingTooLong: "பதிவு செய்யப்பட்ட கோரிக்கையை ஒரு நிமிடத்திற்குள் வைத்திருக்கவும்.",
  },
  te: {
    recording: "మీ అభ్యర్థన రికార్డ్ అవుతోంది… పూర్తయిన తర్వాత మళ్లీ నొక్కండి.",
    transcribing: "మీ అభ్యర్థనను వచనంగా మారుస్తోంది…",
    fallbackReady: "వాయిస్ ఇన్‌పుట్ సిద్ధంగా ఉంది. పాత్‌ఫైండర్ మీ అభ్యర్థనను రికార్డ్ చేసి వచనంగా మారుస్తుంది.",
    captureUnsupported: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ మద్దతు లేదు. మీ అభ్యర్థనను టైప్ చేయండి.",
    noSpeech: "స్పష్టమైన అభ్యర్థన వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.",
    transcriptionFailed: "ఆ రికార్డింగ్‌ను వచనంగా మార్చలేకపోయాం. మళ్లీ ప్రయత్నించండి లేదా మీ అభ్యర్థనను టైప్ చేయండి.",
    recordingTooLong: "రికార్డ్ చేసిన అభ్యర్థనను ఒక నిమిషం కంటే తక్కువగా ఉంచండి.",
  },
  ml: {
    recording: "നിങ്ങളുടെ അഭ്യർത്ഥന റെക്കോർഡ് ചെയ്യുന്നു… പൂർത്തിയാകുമ്പോൾ വീണ്ടും ടാപ്പ് ചെയ്യുക.",
    transcribing: "നിങ്ങളുടെ അഭ്യർത്ഥന വാചകമാക്കി മാറ്റുന്നു…",
    fallbackReady: "വോയ്‌സ് ഇൻപുട്ട് തയ്യാറാണ്. പാത്ത്ഫൈൻഡർ നിങ്ങളുടെ അഭ്യർത്ഥന റെക്കോർഡ് ചെയ്ത് വാചകമാക്കും.",
    captureUnsupported: "ഈ ബ്രൗസറിൽ വോയ്‌സ് ഇൻപുട്ട് പിന്തുണയ്ക്കുന്നില്ല. നിങ്ങളുടെ അഭ്യർത്ഥന ടൈപ്പ് ചെയ്യുക.",
    noSpeech: "വ്യക്തമായ ഒരു അഭ്യർത്ഥന കേൾക്കാനായില്ല. വീണ്ടും ശ്രമിക്കൂ അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യൂ.",
    transcriptionFailed: "ആ റെക്കോർഡിംഗ് വാചകമാക്കി മാറ്റാനായില്ല. വീണ്ടും ശ്രമിക്കൂ അല്ലെങ്കിൽ നിങ്ങളുടെ അഭ്യർത്ഥന ടൈപ്പ് ചെയ്യൂ.",
    recordingTooLong: "റെക്കോർഡ് ചെയ്യുന്ന അഭ്യർത്ഥന ഒരു മിനിറ്റിൽ താഴെയാക്കുക.",
  },
};
