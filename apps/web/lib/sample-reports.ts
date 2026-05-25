import type { Report, TimelinePoint, Word } from "@/lib/api";

function timeline(
  durationSec: number,
  pitchCurve: (t: number) => number | null,
  wpmCurve: (t: number) => number,
  pitchMeanHz: number,
  stepSec = 1.5,
): TimelinePoint[] {
  const pts: TimelinePoint[] = [];
  for (let t = 0; t < durationSec; t += stepSec) {
    const hz = pitchCurve(t);
    const st =
      hz === null || pitchMeanHz <= 0
        ? null
        : Number((12 * Math.log2(hz / pitchMeanHz)).toFixed(2));
    pts.push({
      t: Number(t.toFixed(2)),
      pitch_hz: hz,
      pitch_st: st,
      wpm_local: Number(wpmCurve(t).toFixed(1)),
    });
  }
  return pts;
}

function placeholderWords(count: number, durationSec: number): Word[] {
  const step = durationSec / Math.max(count, 1);
  return Array.from({ length: count }, (_, i) => ({
    text: "word",
    start: Number((i * step).toFixed(2)),
    end: Number(((i + 0.6) * step).toFixed(2)),
    confidence: 0.97,
  }));
}

export const cleanSampleReport: Report = {
  report_id: "sample_clean",
  audio_key: "samples/clean.mp3",
  created_at: "2026-05-12T10:32:00Z",
  duration_sec: 504.3,
  schema_version: 4,
  speech_type: "prepared",
  transcript: {
    text: "",
    words: placeholderWords(1196, 504.3),
    duration_sec: 504.3,
  },
  acoustic: {
    timeline: timeline(
      504.3,
      (t) => 140 + 22 * Math.sin(t / 18) + (t > 60 && t < 90 ? 18 : 0),
      (t) => 142 + 8 * Math.sin(t / 14),
      142,
    ),
    pauses: [
      { start: 74.1, end: 75.6 },
      { start: 188.2, end: 189.3 },
      { start: 322.5, end: 323.9 },
      { start: 478.1, end: 479.7 },
    ],
    pitch_mean_hz: 142,
    pitch_std_hz: 28,
    pitch_std_st: 3.4,
  },
  metrics: {
    wpm: 142.4,
    fillers: [
      { word: "um", t: 73.2, category: "interjection" },
      { word: "uh", t: 312.4, category: "interjection" },
    ],
    filler_per_min: 0.24,
    long_pauses: 4,
    monotone_score: 0.18,
  },
  synthesis: {
    headline:
      "A confident, well-shaped talk. The hook works, the close calls back the open, and the pitch lands where you mean it to.",
    message_sentence: "Curiosity is the only renewable competitive advantage.",
    walkthrough: {
      opening: {
        start_t: 0,
        end_t: 38,
        observation:
          "Cold open on a single concrete question — no throat-clearing, no apology. Audience is in within fifteen seconds.",
        praise:
          "The pause after the rhetorical question (around 0:18) gives the room time to actually answer it in their head.",
        critique: null,
        quote_t: 14,
      },
      body: [
        {
          start_t: 38,
          end_t: 188,
          observation:
            "First arc — the personal story. Pace settles into the 140s and pitch range opens up across the verbs.",
          praise:
            "Strong emphasis on “stopped” at 1:12 — the room could hear the click of the decision.",
          critique: null,
          quote_t: 72,
        },
        {
          start_t: 188,
          end_t: 360,
          observation:
            "Second arc — the data. A clean three-step structure: claim, number, what it means.",
          praise: null,
          critique:
            "Pace creeps to 168 wpm here. Not a problem yet, but the third datapoint passed quickly enough that the room may not have caught it.",
          quote_t: 244,
        },
      ],
      close: {
        start_t: 360,
        end_t: 504,
        observation:
          "Call-back to the opening question, answered. Final sentence drops a half-step in pitch — a deliberate close, not a fade.",
        praise:
          "Best moment of the talk: the four-word answer at 7:58 followed by two seconds of silence before the thank-you.",
        critique: null,
        quote_t: 478,
      },
    },
    categories: {
      hook: {
        score: 5,
        rationale:
          "A question that's both specific and answerable. The audience leans in.",
        evidence: [{ quote: "Why did we stop?", t: 14 }],
        applicability_reason: null,
      },
      message_focus: {
        score: 5,
        rationale:
          "Every section serves the thesis. No detours, no asides — the core idea is restated in three different shapes.",
        evidence: [
          { quote: "Curiosity is the only renewable advantage.", t: 482 },
        ],
        applicability_reason: null,
      },
      structure: {
        score: 5,
        rationale:
          "Cold open, two clearly signposted arcs, call-back close. Textbook shape — don't change it.",
        evidence: [],
        applicability_reason: null,
      },
      closing: {
        score: 5,
        rationale:
          "The close lands the thesis in four words, then leaves a pause. The room had time to register it before the applause.",
        evidence: [{ quote: "And that's the advantage.", t: 478 }],
        applicability_reason: null,
      },
      pacing: {
        score: 4,
        rationale:
          "Average 142 wpm — in the band for a serious talk. Slight acceleration through the data section, but recovers before the close.",
        evidence: [{ quote: "the third number is the one", t: 244 }],
        applicability_reason: null,
      },
      pauses: {
        score: 5,
        rationale:
          "Four long pauses, all on transitions or after a rhetorical question. Placement, not just presence.",
        evidence: [],
        applicability_reason: null,
      },
      vocal_variety: {
        score: 5,
        rationale:
          "Semitone range of 9.4 across the talk. Emphasis lands on the verbs in the open and the nouns in the close.",
        evidence: [{ quote: "we stopped", t: 72 }],
        applicability_reason: null,
      },
      language: {
        score: 5,
        rationale:
          "Two interjections in eight minutes. No hedges, no verbal pauses, no tics.",
        evidence: [],
        applicability_reason: null,
      },
    },
    delivery_habits: {
      fillers: null,
      pauses: null,
      pace: null,
      vocal_variety: null,
      language: null,
    },
    priorities: [
      {
        title: "Hold the data-section pace 10 wpm slower.",
        observation:
          "Between 3:08 and 5:30 you climb past 165 wpm. The numbers themselves are fine — the third one is the one that needs the extra second.",
        example_quote: "the third number is the one",
        example_t: 244,
        why_it_matters:
          "A number lands once. If the audience misses the third one, they lose the chain to the conclusion.",
        drill:
          "Rehearse the data section with a metronome at 130 wpm. Find the natural quarter-second after each number.",
      },
      {
        title: "Lift the body's first sentence half a semitone.",
        observation:
          "The transition into the personal story at 0:38 is flat. Everything else in the talk has shape; this one moment doesn't.",
        example_quote: "So a year ago I was sitting in",
        example_t: 38,
        why_it_matters:
          "The body's opening sets the contract for the next two minutes. A pitch lift signals “new section, listen up”.",
        drill:
          "Record the first eight words five times, each starting a half-semitone higher than the last. Pick the highest one that still feels like you.",
      },
    ],
    rewrites: [],
  },
  overall: {
    score: 4.7,
    weights_version: 1,
    weights: {
      message_focus: 0.18,
      structure: 0.15,
      hook: 0.1,
      closing: 0.1,
      pacing: 0.1,
      pauses: 0.1,
      vocal_variety: 0.1,
      language: 0.07,
    },
    applicable_categories: [
      "hook",
      "message_focus",
      "structure",
      "closing",
      "pacing",
      "pauses",
      "vocal_variety",
      "language",
    ],
  },
  cost: { total_usd: 0.0093, synthesis_usd: 0.0081, lexical_fillers_usd: 0.0012 },
};

export const messySampleReport: Report = {
  report_id: "sample_messy",
  audio_key: "samples/messy.mp3",
  created_at: "2026-05-15T16:08:00Z",
  duration_sec: 282.6,
  schema_version: 4,
  speech_type: "prepared",
  transcript: {
    text: "",
    words: placeholderWords(488, 282.6),
    duration_sec: 282.6,
  },
  acoustic: {
    timeline: timeline(
      282.6,
      (t) => 122 + 6 * Math.sin(t / 8),
      (t) => 170 + 14 * Math.sin(t / 6) + (t > 110 && t < 140 ? -40 : 0),
      124,
    ),
    pauses: [{ start: 132.1, end: 133.0 }],
    pitch_mean_hz: 124,
    pitch_std_hz: 11,
    pitch_std_st: 1.3,
  },
  metrics: {
    wpm: 173.6,
    fillers: [
      { word: "um", t: 4.1, category: "interjection" },
      { word: "uh", t: 9.7, category: "interjection" },
      { word: "like", t: 18.4, category: "verbal_pause" },
      { word: "kind of", t: 22.5, category: "hedge" },
      { word: "um", t: 31.2, category: "interjection" },
      { word: "you know", t: 47.0, category: "verbal_pause" },
      { word: "kind of", t: 58.6, category: "hedge" },
      { word: "like", t: 72.3, category: "verbal_pause" },
      { word: "um", t: 88.4, category: "interjection" },
      { word: "kind of", t: 103.0, category: "hedge" },
      { word: "uh", t: 117.9, category: "interjection" },
      { word: "like", t: 134.8, category: "verbal_pause" },
      { word: "you know", t: 162.5, category: "verbal_pause" },
      { word: "um", t: 178.2, category: "interjection" },
      { word: "kind of", t: 194.0, category: "hedge" },
      { word: "like", t: 211.9, category: "verbal_pause" },
      { word: "um", t: 232.6, category: "interjection" },
      { word: "you know", t: 251.0, category: "verbal_pause" },
    ],
    filler_per_min: 3.8,
    long_pauses: 1,
    monotone_score: 0.62,
  },
  synthesis: {
    headline:
      "A real idea trapped under a soft delivery. The thinking is here; the speech is hedging it into the carpet.",
    message_sentence: null,
    walkthrough: {
      opening: {
        start_t: 0,
        end_t: 36,
        observation:
          "Two soft openers stacked: an apology for being last on the agenda, then an \"um\" before the first real sentence. The thesis arrives at 0:32 — twenty seconds late.",
        praise: null,
        critique:
          "Cut the apology entirely. Start where the substance starts — “Here's the problem”.",
        quote_t: 6,
      },
      body: [
        {
          start_t: 36,
          end_t: 132,
          observation:
            "First half of the body — a cluster of hedges (“kind of”, “you know”, “like”) every fifteen seconds keeps undercutting the claim.",
          praise: null,
          critique:
            "Pace is also 175 wpm here. Hedges plus speed reads as nervous, even when the content isn't.",
          quote_t: 58,
        },
        {
          start_t: 132,
          end_t: 240,
          observation:
            "The pause at 2:12 is the only one in the talk. Everything before and after is wall-to-wall speech.",
          praise:
            "That one pause works — it sits before the strongest sentence of the talk. Place three more like it.",
          critique: null,
          quote_t: 134,
        },
      ],
      close: {
        start_t: 240,
        end_t: 282,
        observation:
          "Trail-off close: voice drops in volume but not pitch, and the last word is “yeah”. No call-back, no answer to the question implied at the open.",
        praise: null,
        critique:
          "Write the last six words and rehearse them. The whole talk is judged on the last sentence.",
        quote_t: 280,
      },
    },
    categories: {
      hook: {
        score: 2,
        rationale:
          "An apology is not a hook. The real first line — the one with the substance — is buried twenty seconds in.",
        evidence: [{ quote: "Sorry I'm last, um", t: 6 }],
        applicability_reason: null,
      },
      message_focus: {
        score: 3,
        rationale:
          "The thesis is there but never stated as a single sentence. The talk circles it three times without landing it.",
        evidence: [{ quote: "what I'm kind of trying to say is", t: 194 }],
        applicability_reason: null,
      },
      structure: {
        score: 3,
        rationale:
          "Beginning, middle, end exist but no signposting. The transition from problem to solution at 2:12 is the only marker.",
        evidence: [],
        applicability_reason: null,
      },
      closing: {
        score: 2,
        rationale:
          "Ends on “yeah”. No call-back, no summary, no answer to the implied opening question.",
        evidence: [{ quote: "so yeah", t: 280 }],
        applicability_reason: null,
      },
      pacing: {
        score: 2,
        rationale:
          "174 wpm average and one pause in four-and-a-half minutes. The audience never gets a beat to catch up.",
        evidence: [{ quote: "and basically we needed to ship", t: 117 }],
        applicability_reason: null,
      },
      pauses: {
        score: 2,
        rationale:
          "One long pause, on luck not design. Pauses are how the audience absorbs a number or a name — there are several here that needed one.",
        evidence: [],
        applicability_reason: null,
      },
      vocal_variety: {
        score: 2,
        rationale:
          "Semitone range of 2.8 — flat. Pitch sits within a narrow band even on the strongest claims.",
        evidence: [{ quote: "this is the important part", t: 165 }],
        applicability_reason: null,
      },
      language: {
        score: 1,
        rationale:
          "Eighteen fillers in four-and-a-half minutes. Six hedges, six verbal pauses, six interjections. Each one tells the room the speaker isn't sure.",
        evidence: [
          { quote: "kind of the main thing", t: 22 },
          { quote: "you know, what I mean", t: 47 },
          { quote: "it's like, the thing is", t: 72 },
        ],
        applicability_reason: null,
      },
    },
    delivery_habits: {
      fillers: {
        score: 1,
        summary:
          "Eighteen fillers in 4:42 — one every fifteen seconds on average. The cluster from 0:00 to 0:35 is the worst stretch; cutting just the opening's three would lift this from a 1 to a 3.",
        examples: [
          { quote: "um, sorry I'm last", t: 4 },
          { quote: "kind of the main thing", t: 22 },
          { quote: "you know, the second piece", t: 47 },
        ],
        counts: [
          { label: "um/uh", count: 6 },
          { label: "like", count: 4 },
          { label: "kind of", count: 4 },
          { label: "you know", count: 4 },
        ],
      },
      pauses: {
        score: 2,
        summary:
          "Only one pause longer than 0.6s in the whole talk. The audience needs space after each claim — without it, the room can't keep up with which sentences matter.",
        examples: [{ quote: "<long pause at 2:12>", t: 132 }],
        counts: [{ label: "long pauses (>0.6s)", count: 1 }],
      },
      pace: {
        score: 2,
        summary:
          "Sustained 173 wpm. The 30s data section at 1:50 climbs to 195 wpm and never recovers a settle point.",
        examples: [{ quote: "and basically we needed to ship", t: 117 }],
        counts: [
          { label: "avg wpm", count: 174 },
          { label: "peak wpm", count: 195 },
        ],
      },
      vocal_variety: {
        score: 2,
        summary:
          "Pitch sits within a 2.8-semitone band. The strongest claim of the talk (“this is the important part” at 2:45) is delivered flat — the audience has no acoustic signal that it matters.",
        examples: [{ quote: "this is the important part", t: 165 }],
        counts: [],
      },
      language: {
        score: 1,
        summary:
          "Hedges (“kind of”, “sort of”) appear ten times. Each one softens the claim it precedes. Strip them; the sentences still parse.",
        examples: [
          { quote: "kind of the main thing", t: 22 },
          { quote: "what I'm kind of trying to say", t: 194 },
        ],
        counts: [
          { label: "hedges", count: 10 },
          { label: "verbal pauses", count: 8 },
        ],
      },
    },
    priorities: [
      {
        title: "Cut the opening's first twenty seconds.",
        observation:
          "The apology, the “um”, and the throat-clearing all happen before the audience hears the real first sentence at 0:32.",
        example_quote: "Sorry I'm last on the agenda, um",
        example_t: 6,
        why_it_matters:
          "The opening twenty seconds set the contract for the talk. Right now they're saying “I'm not sure I belong here”.",
        drill:
          "Write the first sentence as one line. Rehearse it five times. The whole talk now starts with that sentence — nothing before it.",
      },
      {
        title: "Place three pauses in the body.",
        observation:
          "Only one long pause across 4:42. Insert one after the problem statement at 1:08, one after the data peak at 2:42, and one before the close.",
        example_quote: "and basically we needed to ship",
        example_t: 117,
        why_it_matters:
          "Pauses are how the audience does the maths in their head. Without them, the numbers sound like words.",
        drill:
          "Mark the three pause points in your script with “[2s]”. Rehearse with a stopwatch; the silence will feel longer than it is.",
      },
      {
        title: "Strip the hedges from the central claim.",
        observation:
          "“What I'm kind of trying to say is” at 3:14 is the thesis sentence — and it's hedged twice in eight words.",
        example_quote: "what I'm kind of trying to say is",
        example_t: 194,
        why_it_matters:
          "If the speaker isn't sure, the audience isn't either. The thesis must arrive without softeners.",
        drill:
          "Rewrite the sentence three times, each version shorter than the last. The shortest one is the one to learn.",
      },
    ],
    rewrites: [
      {
        original: "Sorry I'm last on the agenda, um, I'll try to keep this short.",
        suggested: "Here's the problem we ran into last quarter.",
        why: "An apology shrinks the speaker before they've said a word. Replace the opener with the first real sentence.",
      },
      {
        original: "So basically, you know, we kind of needed to ship it.",
        suggested: "We had to ship.",
        why: "Three hedges (“basically”, “you know”, “kind of”) in one sentence. Strip them all; the meaning sharpens.",
      },
      {
        original: "What I'm kind of trying to say is that curiosity matters.",
        suggested: "Curiosity is the advantage.",
        why: "Five hedge-words wrap a four-word thesis. Cut the wrapper; the thesis is fine on its own.",
      },
      {
        original: "Anyway, that's kind of it. So yeah.",
        suggested: "So: stay curious. That's the talk.",
        why: "“So yeah” is a verbal shrug. Write a one-line close that names the talk.",
      },
    ],
  },
  overall: {
    score: 2.0,
    weights_version: 1,
    weights: {
      message_focus: 0.18,
      structure: 0.15,
      hook: 0.1,
      closing: 0.1,
      pacing: 0.1,
      pauses: 0.1,
      vocal_variety: 0.1,
      language: 0.07,
    },
    applicable_categories: [
      "hook",
      "message_focus",
      "structure",
      "closing",
      "pacing",
      "pauses",
      "vocal_variety",
      "language",
    ],
  },
  cost: { total_usd: 0.0072, synthesis_usd: 0.0063, lexical_fillers_usd: 0.0009 },
};
