# Redesign Reference Notes

## Motion-led reference

The user supplied [MotionSites](https://motionsites.ai/?prompt=scroll-landing) as visual inspiration only. Its accessible gallery presentation demonstrates an editorial dark canvas, restrained high-contrast navigation, animated visual panels, generous whitespace, and progressive content reveals. The AIET implementation must remain original and must not reuse its copy, assets, branding, or layout.

## Supplied AIET hero video

The provided footage was uploaded to managed project storage at `/manus-storage/aiet-campus-hero_4a615586.mp4`. It is a 108 MB campus tour with stable wide angles, slow pans, and building tilts. It combines exterior maroon, cream, and glass-blue imagery with cool laboratory scenes, sports facilities, workshops, and limited student footage. Hero copy should be kept to a protected side region or the upper/lower frame and must avoid obscuring department or partner signage.

## User-provided product requirements

The proposed visual story is **Real Campus → Digital Campus → 3D campus → Intelligent assistant → Voice guidance → AR navigation**. All calls to action must reach existing PathFinder routes; content must remain grounded in configured locations and verified institutional sources; and motion must respect reduced-motion settings. The redesigned landing page must retain authentication, map, assistant, route planning, AR, history, account, admin, multilingual support, and the already-fixed multi-turn assistant conversation.

## Current voice reliability finding

The Assistant page currently relies only on browser-native `SpeechRecognition`/`webkitSpeechRecognition`, which is absent in some browsers and produces the reported unavailable state. The planned fallback is short MediaRecorder capture uploaded through the existing server storage helper, then server-side Whisper transcription via the existing internal transcription helper. Browser speech recognition remains the fast path; typed input stays available as the final fallback.

## Official AIET content check

The public [AIET website](https://new.aiet.org.in/) confirms that it is a unit of Alva's Education Foundation and presents institutional sections for Academic Programs, Research, Placements, Campus Life, Student Clubs, Library, Hostel, Transportation, and Core Facilities. Its public programme list includes Agricultural Engineering; Artificial Intelligence & Machine Learning Engineering; Civil Engineering; Computer Science & Engineering; CSE (IoT & Cyber Security including Blockchain Technology); CSE (Data Science); CSE (Design); Electronics & Communication Engineering; Information Science & Engineering; Mechanical Engineering; and MBA. The PathFinder landing page will link to the official site and describe it as a navigation and exploration companion—not an institutional-site replacement.
