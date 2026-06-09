export type Tip = {
  heading: string;
  body: string;
  attribution?: string;
};

export type TipsSection = {
  slug: string;
  title: string;
  navLabel: string;
  summary: string;
  intro: string;
  tips: Tip[];
};

export const TIPS_SECTIONS: TipsSection[] = [
  {
    slug: "general",
    title: "General Tips",
    navLabel: "General tips",
    summary:
      "The fundamentals that hold up across every talk, room, and format.",
    intro:
      "Most speaking advice is noise. These six fundamentals are the ones that survive scrutiny — they apply whether you're toasting a wedding or pitching a board.",
    tips: [
      {
        heading: "Start with the audience, not your material",
        body: "The single biggest shift in speaking skill is moving from “here's what I want to say” to “what does this audience need to hear?” Before you write a word, answer three questions: who are they, what do they already know, and what should they do differently afterwards. Every choice — content, length, language — follows from that.",
        attribution: "Matt Abrahams · Stanford Graduate School of Business",
      },
      {
        heading: "Decide your one sentence",
        body: "If the audience remembers a single sentence a week later, what should it be? Write that sentence first and build the talk around it. Speeches fail far more often from having three half-messages than from having one message delivered plainly.",
      },
      {
        heading: "Structure beats memorization",
        body: "Audiences follow and recall talks that have a recognizable shape — a beginning that frames, a middle with a few clear points, an end that resolves. Memorize the map, not the script: know your opening and closing cold, and navigate the middle from structure rather than from memorized prose.",
      },
      {
        heading: "Practice out loud — always",
        body: "Reading your notes silently is not rehearsal. Speaking is a motor skill: pacing problems, clunky phrasing, and missing transitions only show up when the words pass through your mouth. Stand up, say it at full volume, and time it.",
      },
      {
        heading: "Record yourself and review",
        body: "Skill grows fastest with tight feedback loops: perform, measure, adjust, repeat. A recording shows you the gap between how you think you sound and how you actually sound — filler counts, pace, energy, trailing endings. This is the core finding of the deliberate-practice literature: practice improves you when it comes with feedback.",
        attribution: "K. Anders Ericsson · deliberate-practice research",
      },
      {
        heading: "Shorter is stronger",
        body: "Almost every talk improves when cut by a fifth. Ending early is a gift no audience has ever resented; running over is a tax on everything you said before. Decide what to cut in rehearsal so you don't improvise cuts on stage.",
      },
    ],
  },
  {
    slug: "fear",
    title: "Overcoming the Fear of Public Speaking",
    navLabel: "Overcoming the fear",
    summary:
      "What clinical research actually says about speech anxiety — and what works.",
    intro:
      "Speech anxiety is one of the most commonly reported fears in surveys, and it's also one of the most treatable. The techniques below come from clinical research, not locker-room pep talks.",
    tips: [
      {
        heading: "Say “I'm excited” — not “calm down”",
        body: "Anxiety and excitement are nearly identical in the body: racing heart, alertness, adrenaline. Experiments found that speakers who relabelled nerves as excitement (“I am excited”) were rated as more persuasive and competent than those who tried to calm down. You're not fighting the arousal — you're changing what it means.",
        attribution: "Alison Wood Brooks · Harvard Business School",
      },
      {
        heading: "Exposure works; avoidance feeds the fear",
        body: "The gold-standard treatment for speaking anxiety is graded exposure: speak in low-stakes settings, then progressively harder ones. Each repetition teaches your nervous system that the situation is survivable. Avoiding speaking does the opposite — it confirms the threat and makes the next time harder.",
        attribution: "Exposure-based CBT · clinical psychology",
      },
      {
        heading: "Nobody can see your nerves",
        body: "Psychologists call it the illusion of transparency: speakers consistently overestimate how visible their anxiety is. Your pounding heart is loud to you and invisible to the room. In follow-up studies, simply learning this fact measurably improved speakers' performance.",
        attribution: "Thomas Gilovich · Cornell University",
      },
      {
        heading: "Breathe out slower than you breathe in",
        body: "Long, slow exhales engage the body's braking system and bring heart rate down — it's the most portable calming tool there is. Try a few rounds before you're introduced: in through the nose for four counts, out slowly for six to eight. It won't erase nerves, but it takes the edge off the spike.",
      },
      {
        heading: "Over-prepare the first sixty seconds",
        body: "Anxiety peaks just before and just after you start, then falls as you settle in. Exploit that curve: rehearse your opening until it's automatic, so it carries you through the worst minute without needing your conscious brain. Most speakers find the fear has faded by the time the opening is done.",
      },
      {
        heading: "Aim for useful, not flawless",
        body: "Perfectionism raises the stakes, and stakes are the fuel anxiety runs on. The audience wants something useful from you — they aren't grading your performance against an ideal. A stumble recovered with a smile usually builds more trust than a polished delivery.",
      },
    ],
  },
  {
    slug: "delivery",
    title: "Delivery: Voice & Body",
    navLabel: "Voice & body",
    summary:
      "Pace, pauses, vocal variety, eye contact, and what to do with your hands.",
    intro:
      "Delivery is the part of speaking you can measure — and therefore the part you can train. These are the mechanics behind a confident-sounding talk.",
    tips: [
      {
        heading: "Speak at a conversational pace — then vary it",
        body: "Clear conversational speech sits around 120–160 words per minute. The number matters less than the variation: slow down for complex or important material, lift the pace for stories and energy. A talk delivered at one constant speed reads as nervous or rehearsed, whatever the speed is.",
      },
      {
        heading: "Pause instead of “um”",
        body: "Fillers appear when your mouth moves before your next thought is ready. The fix isn't suppressing the “um” — it's replacing it with silence. A pause feels enormous to you and entirely natural to the audience; it also reads as composure. When you feel a filler coming, close your mouth and let the beat land.",
      },
      {
        heading: "Use your full vocal range",
        body: "Monotone is the fastest way to lose a room. Emphasis lives in contrast: raise or drop your pitch on the words that matter, vary your volume, and let your voice actually fall at the end of sentences so statements don't sound like questions. If everything is emphasized, nothing is.",
      },
      {
        heading: "Make eye contact with people, not the room",
        body: "Sweeping your gaze across the crowd connects with no one. Instead, pick one person and hold eye contact for a complete thought — a sentence or two — then move to someone in another part of the room. To each person you look at, it feels like conversation; to everyone else, it looks like confidence.",
      },
      {
        heading: "Let your hands talk, but don't script them",
        body: "Natural gestures come from the shoulders, match what you're saying, and happen in the space between your waist and chest. Plant your feet, keep your posture open, and your hands will mostly take care of themselves. Choreographed gestures look exactly like choreographed gestures.",
      },
      {
        heading: "Finish your sentences",
        body: "Under pressure, speakers trail off, swallow final words, or let endings dissolve into “so, yeah.” The end of a sentence is where the meaning lands — give it full volume and a full stop. Strong endings, sentence by sentence, are what “sounding sure of yourself” is actually made of.",
      },
    ],
  },
  {
    slug: "prepared-speeches",
    title: "Prepared Speeches",
    navLabel: "Prepared speeches",
    summary:
      "Writing, structuring, and rehearsing a speech you've had time to craft.",
    intro:
      "A prepared speech is the one format where you control everything in advance. That's a luxury — spend it on structure and rehearsal, not on more slides or more words.",
    tips: [
      {
        heading: "Build from the close backwards",
        body: "Write your final thirty seconds first: the takeaway, the call to action, the line you want quoted. Then construct the speech as the shortest credible path to that ending. Speeches written front-to-back tend to wander; speeches written from the close land.",
      },
      {
        heading: "Exploit the edges",
        body: "Audiences remember the start and the finish far better than the middle — psychologists call it the primacy and recency effect. Don't spend your opening on throat-clearing (“thanks, so, um, today I'll be talking about…”). Open with a story, a question, or a surprising claim, and make sure your strongest material isn't buried at the midpoint.",
      },
      {
        heading: "Tell stories, not lists",
        body: "Memory research is consistent: people retain narratives far better than disconnected facts, because a story gives each detail a place in a causal chain. Wherever you have a point to make, ask whether there's a moment — a person, a scene, a before-and-after — that carries it. One concrete story beats three abstract arguments.",
      },
      {
        heading: "Use the rule of three",
        body: "Three points, three examples, three-beat phrases — audiences absorb and recall groups of three more easily than longer lists, and rhetoric has leaned on this from Aristotle to “blood, sweat and tears.” If you have five points, you have two speeches or one bloated one. Cut or merge until three remain.",
      },
      {
        heading: "Rehearse spaced, not crammed",
        body: "Four rehearsals spread over a week beat eight on the night before — spacing practice out is one of the most replicated effects in learning research. Early run-throughs fix the structure; later ones polish delivery. Cramming gives you a speech that lives in short-term memory exactly when you need it least.",
        attribution: "Distributed-practice research · cognitive psychology",
      },
      {
        heading: "Memorize the open and close — bullet the middle",
        body: "Word-for-word memorization of a whole speech is fragile: one slip and you're searching for a sentence instead of an idea. Memorize your opening and closing verbatim for confidence at the edges, and reduce the middle to a handful of waypoints you can speak to naturally. You'll sound more alive, and a lost line costs you nothing.",
      },
    ],
  },
  {
    slug: "impromptu",
    title: "Impromptu Speaking",
    navLabel: "Impromptu speaking",
    summary:
      "Sounding coherent when you're put on the spot, with zero preparation.",
    intro:
      "Speaking off the cuff feels like a talent. It's mostly a technique: people who are good at it lean on structure so their brain is free to think about content.",
    tips: [
      {
        heading: "Grab a structure, any structure",
        body: "The difference between rambling and a sharp impromptu answer is rarely intelligence — it's that the sharp answer has a skeleton. PREP is the workhorse: make your Point, give the Reason, share an Example, restate the Point. The structure does the organizing so you can spend your attention on what you're actually saying.",
        attribution: "Matt Abrahams · Stanford Graduate School of Business",
      },
      {
        heading: "What? So what? Now what?",
        body: "For reflections, updates, and feedback, this three-beat frame is hard to beat: what happened, why it matters to this audience, and what should happen next. It forces relevance — the “so what” — which is exactly what unprepared answers usually lack.",
        attribution: "Matt Abrahams · Stanford Graduate School of Business",
      },
      {
        heading: "Buy time honestly",
        body: "You don't owe anyone an instant answer. Paraphrase the question back, ask a clarifying question, or simply take a slow breath and a beat of silence — all of these read as thoughtfulness, not weakness. Two seconds of silence is enough time for a structure to form, and it feels far longer to you than to them.",
      },
      {
        heading: "Dare to be dull",
        body: "Reaching for a brilliant answer is what freezes people. Give yourself permission to say the obvious, useful thing — answer the question actually in front of you, plainly. Paradoxically, dropping the ambition to be impressive is what frees you up enough to occasionally be impressive.",
        attribution: "Matt Abrahams · Stanford Graduate School of Business",
      },
      {
        heading: "Practice being unprepared",
        body: "Spontaneity is a muscle. Drill it in low-stakes reps: pick a random object and talk about it for one minute, answer mock questions, or join a group like Toastmasters where impromptu “Table Topics” are on every agenda. The hundredth time you're put on the spot, your body knows the spot.",
      },
      {
        heading: "Land the plane",
        body: "Impromptu answers don't fail at the start — they fail at the end, dissolving into “so… yeah.” Decide you will end with one declarative sentence, even if it's just restating your point. A clean final sentence retroactively makes the whole answer sound planned.",
      },
    ],
  },
  {
    slug: "presentations",
    title: "Presentations",
    navLabel: "Presentations",
    summary:
      "Slides that help instead of compete — grounded in multimedia-learning research.",
    intro:
      "Most presentation advice is taste. The advice below mostly isn't: it comes from decades of controlled studies on how people actually learn from words and pictures together.",
    tips: [
      {
        heading: "Never read your slides aloud",
        body: "When the same words are on screen and in your mouth, the audience reads and listens at once — and comprehension drops. Research calls this the redundancy effect. Slides should carry what speech can't: images, charts, single key phrases. You carry the sentences.",
        attribution: "Richard Mayer · multimedia-learning research",
      },
      {
        heading: "Cut everything that decorates",
        body: "Irrelevant stock photos, background flourishes, and “fun” clip-art don't just fail to help — controlled studies show extraneous material actively hurts learning by competing for limited attention. If an element doesn't carry the point, it's working against it. Empty space is not a problem to fix.",
        attribution: "Richard Mayer · multimedia-learning research",
      },
      {
        heading: "One idea per slide",
        body: "People process complex material better in small segments than in one dense wall. A slide with four points is four slides, compressed to the point of uselessness. More slides with less on each is almost always the right trade — slide count is free, attention isn't.",
        attribution: "Richard Mayer · multimedia-learning research",
      },
      {
        heading: "Design for the back row",
        body: "If text is too small to read from the worst seat, it shouldn't be on the slide. Big type also enforces discipline: you physically can't fit a paragraph at 30-point. If a slide needs a paragraph, it isn't a slide — it's a document. Send it afterwards.",
      },
      {
        heading: "Black the screen when you talk",
        body: "In most presentation software, pressing B during a slideshow blacks the screen. Use it whenever you tell a story or make a point that needs the room's full attention — eyes come back to you instantly. The strongest moment in many slide decks is the moment the slides disappear.",
      },
      {
        heading: "Rehearse with the gear you'll use",
        body: "The clicker, the screen, the room, your laptop on the venue's projector — every unfamiliar element is a place for the talk to wobble. Arrive early, run the first two minutes in the actual room if you can, and have a fallback (a PDF on a USB stick) for when the tech fails. It eventually will.",
      },
    ],
  },
  {
    slug: "online",
    title: "Speaking Online",
    navLabel: "Speaking online",
    summary:
      "Camera, audio, energy — the mechanics of being compelling through a screen.",
    intro:
      "Online, the room is gone and a lens is your audience. The skills transfer, but the mechanics change more than most speakers realize.",
    tips: [
      {
        heading: "The lens is the eye contact",
        body: "On camera, looking at the faces on your screen reads as looking away. Eye contact happens only when you look into the lens — so deliver your key moments straight to it, especially openings, closings, and direct asks. It feels unnatural to you and looks like connection to them.",
      },
      {
        heading: "Camera at eye level, notes next to the lens",
        body: "A camera below your eyeline has the audience looking up your nose while you appear to look down on them. Raise it to eye level or a touch above. Then drag your notes, slides, and participant video to the part of the screen nearest the lens, so your eyes barely travel when you glance at them.",
      },
      {
        heading: "Audio beats video — invest accordingly",
        body: "Audiences forgive a soft image; they will not tolerate bad sound. A modest external or headset mic in a quiet, soft-furnished room beats an expensive camera with echoing laptop audio every time. If you upgrade one piece of equipment, upgrade the microphone.",
      },
      {
        heading: "Light your face from the front",
        body: "Sitting with a bright window behind you turns you into a silhouette. Face the window instead, or put a soft light behind your camera. Online, your face does the work your body language did in the room — the audience has to be able to see it.",
      },
      {
        heading: "Turn the energy up a notch",
        body: "Cameras and compression flatten you: voices lose range, gestures shrink, and what felt expressive in the room arrives as monotone. Compensate deliberately — more vocal variety than feels natural, visible gestures inside the frame, and stand up if you can. Slightly too animated on camera reads as exactly right.",
      },
      {
        heading: "Re-engage every few minutes",
        body: "Online attention decays faster, and you can't read the room to feel it happening. Build interaction into the plan rather than hoping for it: a question in chat, a poll, a name-check, a pause for reactions every few minutes. Treat silence from a remote audience as a prompt to change gears, not as permission to keep going.",
      },
    ],
  },
  {
    slug: "myths",
    title: "Myths to Unlearn",
    navLabel: "Myths to unlearn",
    summary:
      "Famous speaking advice that research has debunked — and what to do instead.",
    intro:
      "Public speaking attracts zombie facts: claims that sound scientific, get repeated in a thousand trainings, and refuse to die. Here are the big ones, and what the evidence actually says.",
    tips: [
      {
        heading: "“93% of communication is nonverbal”",
        body: "The famous 7–38–55 split comes from 1960s experiments on single spoken words where tone and meaning deliberately conflicted — nothing like a speech. Mehrabian himself has spent decades asking people to stop generalizing it. Words carry your content; delivery shapes how it lands. Neither is 93% of anything.",
        attribution: "Albert Mehrabian, on the misuse of his own 1967 studies",
      },
      {
        heading: "“Do a power pose before you go on”",
        body: "The 2010 study behind power posing failed to replicate in larger follow-ups, and one of its own authors publicly disavowed the effect. Standing tall is fine — posture affects how the audience sees you — but two minutes in a Wonder Woman stance won't change your hormones or your outcome. Preparation and repeated exposure will.",
        attribution: "Replication studies, 2015–2017 · co-author Dana Carney's retraction",
      },
      {
        heading: "“Imagine the audience naked”",
        body: "No evidence supports it, and the logic is backwards: it frames the audience as a threat to be diminished, when connection is what actually dissolves speaking fear. See them as allies who want you to succeed — because overwhelmingly, they do. Then make real eye contact instead of imagining anything.",
      },
      {
        heading: "“Great speakers are born, not made”",
        body: "Speaking is a trainable motor-and-language skill, and it responds to deliberate practice like any other: feedback, repetition, and graded challenge produce measurable improvement. The polished keynote speaker you admire has simply logged reps you didn't see. The fixed-talent story survives because it excuses not practicing.",
      },
      {
        heading: "“Eliminate every um”",
        body: "A modest rate of fillers is normal human speech — spontaneous conversation is full of them, and chasing absolute zero makes speakers stiff and self-monitoring. The real problems are clusters: fillers at every pause, or in place of every transition. Reduce them by pausing instead; don't try to eradicate them.",
      },
      {
        heading: "“A strong speech hides behind a strong slide deck”",
        body: "Slides are the most common way speakers avoid rehearsing — the deck becomes a teleprompter and the talk becomes a read-along. Audiences came for a speaker, not a document. Build the talk first, out loud; add slides only where a picture or chart does what your voice can't.",
      },
    ],
  },
];

export function getTipsSection(slug: string): TipsSection | undefined {
  return TIPS_SECTIONS.find((section) => section.slug === slug);
}

export function getAdjacentSections(slug: string): {
  prev: TipsSection | null;
  next: TipsSection | null;
} {
  const index = TIPS_SECTIONS.findIndex((section) => section.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? TIPS_SECTIONS[index - 1] : null,
    next: index < TIPS_SECTIONS.length - 1 ? TIPS_SECTIONS[index + 1] : null,
  };
}
