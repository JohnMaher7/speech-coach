import type { Report, TimelinePoint, Word } from "@/lib/api";

function timeline(
  durationSec: number,
  pitchCurve: (t: number) => number | null,
  wpmCurve: (t: number) => number,
  pitchMeanHz: number,
  volumeCurve?: (t: number) => number | null,
  stepSec = 1.5,
): TimelinePoint[] {
  const pts: TimelinePoint[] = [];
  for (let t = 0; t < durationSec; t += stepSec) {
    const hz = pitchCurve(t);
    const st =
      hz === null || pitchMeanHz <= 0
        ? null
        : Number((12 * Math.log2(hz / pitchMeanHz)).toFixed(2));
    const vol = volumeCurve ? volumeCurve(t) : null;
    pts.push({
      t: Number(t.toFixed(2)),
      pitch_hz: hz,
      pitch_st: st,
      wpm_local: Number(wpmCurve(t).toFixed(1)),
      volume_db: vol === null ? null : Number(vol.toFixed(1)),
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
  created_at: "2026-06-16T13:50:21.398737Z",
  duration_sec: 275.5,
  schema_version: 5,
  speech_type: "prepared",
  transcript: {
    text: "",
    words: placeholderWords(648, 275.5),
    duration_sec: 275.5,
  },
  acoustic: {
    timeline: [
      {
        t: 0.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 1.5,
        pitch_hz: 111.47,
        pitch_st: 0.03,
        wpm_local: 92.3,
        volume_db: 55.1,
      },
      {
        t: 3.0,
        pitch_hz: 112.95,
        pitch_st: 0.25,
        wpm_local: 97.5,
        volume_db: 57.8,
      },
      {
        t: 4.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 6.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 7.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 9.0,
        pitch_hz: 107.61,
        pitch_st: -0.58,
        wpm_local: 150.0,
        volume_db: 42.1,
      },
      {
        t: 10.5,
        pitch_hz: 92.23,
        pitch_st: -3.25,
        wpm_local: 174.0,
        volume_db: 45.9,
      },
      {
        t: 12.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 174.0,
        volume_db: null,
      },
      {
        t: 13.5,
        pitch_hz: 111.86,
        pitch_st: 0.09,
        wpm_local: 174.0,
        volume_db: 58.8,
      },
      {
        t: 15.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 186.0,
        volume_db: null,
      },
      {
        t: 16.5,
        pitch_hz: 116.11,
        pitch_st: 0.73,
        wpm_local: 192.0,
        volume_db: 41.9,
      },
      {
        t: 18.0,
        pitch_hz: 98.01,
        pitch_st: -2.2,
        wpm_local: 210.0,
        volume_db: 53.6,
      },
      {
        t: 19.5,
        pitch_hz: 149.23,
        pitch_st: 5.08,
        wpm_local: 186.0,
        volume_db: 47.9,
      },
      {
        t: 21.0,
        pitch_hz: 148.18,
        pitch_st: 4.95,
        wpm_local: 180.0,
        volume_db: 51.0,
      },
      {
        t: 22.5,
        pitch_hz: 100.21,
        pitch_st: -1.82,
        wpm_local: 174.0,
        volume_db: 53.5,
      },
      {
        t: 24.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 168.0,
        volume_db: null,
      },
      {
        t: 25.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 27.0,
        pitch_hz: 93.06,
        pitch_st: -3.1,
        wpm_local: 126.0,
        volume_db: 52.4,
      },
      {
        t: 28.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 132.0,
        volume_db: null,
      },
      {
        t: 30.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 132.0,
        volume_db: null,
      },
      {
        t: 31.5,
        pitch_hz: 111.92,
        pitch_st: 0.1,
        wpm_local: 132.0,
        volume_db: 56.2,
      },
      {
        t: 33.0,
        pitch_hz: 92.47,
        pitch_st: -3.21,
        wpm_local: 132.0,
        volume_db: 49.3,
      },
      {
        t: 34.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 132.0,
        volume_db: null,
      },
      {
        t: 36.0,
        pitch_hz: 125.78,
        pitch_st: 2.12,
        wpm_local: 162.0,
        volume_db: 56.4,
      },
      {
        t: 37.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 150.0,
        volume_db: null,
      },
      {
        t: 39.0,
        pitch_hz: 144.22,
        pitch_st: 4.49,
        wpm_local: 144.0,
        volume_db: 55.5,
      },
      {
        t: 40.5,
        pitch_hz: 114.15,
        pitch_st: 0.44,
        wpm_local: 162.0,
        volume_db: 57.1,
      },
      {
        t: 42.0,
        pitch_hz: 111.0,
        pitch_st: -0.05,
        wpm_local: 150.0,
        volume_db: 54.7,
      },
      {
        t: 43.5,
        pitch_hz: 98.52,
        pitch_st: -2.11,
        wpm_local: 156.0,
        volume_db: 45.2,
      },
      {
        t: 45.0,
        pitch_hz: 126.56,
        pitch_st: 2.22,
        wpm_local: 168.0,
        volume_db: 54.6,
      },
      {
        t: 46.5,
        pitch_hz: 97.75,
        pitch_st: -2.25,
        wpm_local: 144.0,
        volume_db: 59.4,
      },
      {
        t: 48.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 162.0,
        volume_db: null,
      },
      {
        t: 49.5,
        pitch_hz: 94.96,
        pitch_st: -2.75,
        wpm_local: 150.0,
        volume_db: 51.5,
      },
      {
        t: 51.0,
        pitch_hz: 124.87,
        pitch_st: 1.99,
        wpm_local: 138.0,
        volume_db: 46.9,
      },
      {
        t: 52.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 132.0,
        volume_db: null,
      },
      {
        t: 54.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 55.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 57.0,
        pitch_hz: 205.34,
        pitch_st: 10.6,
        wpm_local: 102.0,
        volume_db: 46.4,
      },
      {
        t: 58.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.0,
        volume_db: null,
      },
      {
        t: 60.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 61.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.0,
        volume_db: null,
      },
      {
        t: 63.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 64.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 66.0,
        pitch_hz: 137.42,
        pitch_st: 3.65,
        wpm_local: 132.0,
        volume_db: 42.1,
      },
      {
        t: 67.5,
        pitch_hz: 102.22,
        pitch_st: -1.47,
        wpm_local: 138.0,
        volume_db: 55.4,
      },
      {
        t: 69.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 156.0,
        volume_db: null,
      },
      {
        t: 70.5,
        pitch_hz: 86.2,
        pitch_st: -4.43,
        wpm_local: 162.0,
        volume_db: 51.0,
      },
      {
        t: 72.0,
        pitch_hz: 101.75,
        pitch_st: -1.55,
        wpm_local: 162.0,
        volume_db: 51.6,
      },
      {
        t: 73.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 192.0,
        volume_db: null,
      },
      {
        t: 75.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 192.0,
        volume_db: null,
      },
      {
        t: 76.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 186.0,
        volume_db: null,
      },
      {
        t: 78.0,
        pitch_hz: 99.04,
        pitch_st: -2.02,
        wpm_local: 192.0,
        volume_db: 54.0,
      },
      {
        t: 79.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 192.0,
        volume_db: null,
      },
      {
        t: 81.0,
        pitch_hz: 118.17,
        pitch_st: 1.04,
        wpm_local: 174.0,
        volume_db: 40.2,
      },
      {
        t: 82.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 84.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 96.0,
        volume_db: null,
      },
      {
        t: 85.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 87.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 88.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 90.0,
        pitch_hz: 113.29,
        pitch_st: 0.31,
        wpm_local: 120.0,
        volume_db: 57.1,
      },
      {
        t: 91.5,
        pitch_hz: 95.92,
        pitch_st: -2.57,
        wpm_local: 138.0,
        volume_db: 49.7,
      },
      {
        t: 93.0,
        pitch_hz: 115.48,
        pitch_st: 0.64,
        wpm_local: 168.0,
        volume_db: 56.3,
      },
      {
        t: 94.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 192.0,
        volume_db: null,
      },
      {
        t: 96.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 186.0,
        volume_db: null,
      },
      {
        t: 97.5,
        pitch_hz: 145.0,
        pitch_st: 4.58,
        wpm_local: 168.0,
        volume_db: 57.2,
      },
      {
        t: 99.0,
        pitch_hz: 100.82,
        pitch_st: -1.71,
        wpm_local: 186.0,
        volume_db: 47.8,
      },
      {
        t: 100.5,
        pitch_hz: 117.76,
        pitch_st: 0.98,
        wpm_local: 162.0,
        volume_db: 46.1,
      },
      {
        t: 102.0,
        pitch_hz: 91.66,
        pitch_st: -3.36,
        wpm_local: 192.0,
        volume_db: 53.6,
      },
      {
        t: 103.5,
        pitch_hz: 118.33,
        pitch_st: 1.06,
        wpm_local: 198.0,
        volume_db: 53.1,
      },
      {
        t: 105.0,
        pitch_hz: 93.22,
        pitch_st: -3.07,
        wpm_local: 174.0,
        volume_db: 52.2,
      },
      {
        t: 106.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 174.0,
        volume_db: null,
      },
      {
        t: 108.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 168.0,
        volume_db: null,
      },
      {
        t: 109.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 162.0,
        volume_db: null,
      },
      {
        t: 111.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 156.0,
        volume_db: null,
      },
      {
        t: 112.5,
        pitch_hz: 113.56,
        pitch_st: 0.35,
        wpm_local: 150.0,
        volume_db: 63.0,
      },
      {
        t: 114.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 115.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 117.0,
        pitch_hz: 96.49,
        pitch_st: -2.47,
        wpm_local: 156.0,
        volume_db: 54.7,
      },
      {
        t: 118.5,
        pitch_hz: 150.28,
        pitch_st: 5.2,
        wpm_local: 126.0,
        volume_db: 55.7,
      },
      {
        t: 120.0,
        pitch_hz: 101.05,
        pitch_st: -1.67,
        wpm_local: 126.0,
        volume_db: 58.0,
      },
      {
        t: 121.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 123.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 124.5,
        pitch_hz: 168.11,
        pitch_st: 7.14,
        wpm_local: 108.0,
        volume_db: 55.9,
      },
      {
        t: 126.0,
        pitch_hz: 92.33,
        pitch_st: -3.24,
        wpm_local: 108.0,
        volume_db: 50.4,
      },
      {
        t: 127.5,
        pitch_hz: 105.58,
        pitch_st: -0.91,
        wpm_local: 102.0,
        volume_db: 50.2,
      },
      {
        t: 129.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 130.5,
        pitch_hz: 129.55,
        pitch_st: 2.63,
        wpm_local: 96.0,
        volume_db: 52.1,
      },
      {
        t: 132.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.0,
        volume_db: null,
      },
      {
        t: 133.5,
        pitch_hz: 105.18,
        pitch_st: -0.98,
        wpm_local: 78.0,
        volume_db: 54.9,
      },
      {
        t: 135.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 72.0,
        volume_db: null,
      },
      {
        t: 136.5,
        pitch_hz: 93.99,
        pitch_st: -2.93,
        wpm_local: 84.0,
        volume_db: 51.6,
      },
      {
        t: 138.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 84.0,
        volume_db: null,
      },
      {
        t: 139.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 96.0,
        volume_db: null,
      },
      {
        t: 141.0,
        pitch_hz: 109.92,
        pitch_st: -0.22,
        wpm_local: 102.0,
        volume_db: 52.1,
      },
      {
        t: 142.5,
        pitch_hz: 135.34,
        pitch_st: 3.38,
        wpm_local: 102.0,
        volume_db: 59.1,
      },
      {
        t: 144.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 145.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 147.0,
        pitch_hz: 113.3,
        pitch_st: 0.31,
        wpm_local: 138.0,
        volume_db: 44.4,
      },
      {
        t: 148.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 150.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 151.5,
        pitch_hz: 129.09,
        pitch_st: 2.57,
        wpm_local: 162.0,
        volume_db: 58.6,
      },
      {
        t: 153.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 162.0,
        volume_db: null,
      },
      {
        t: 154.5,
        pitch_hz: 115.51,
        pitch_st: 0.64,
        wpm_local: 156.0,
        volume_db: 52.4,
      },
      {
        t: 156.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 168.0,
        volume_db: null,
      },
      {
        t: 157.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 159.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 160.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 162.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 163.5,
        pitch_hz: 125.11,
        pitch_st: 2.02,
        wpm_local: 156.0,
        volume_db: 61.8,
      },
      {
        t: 165.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 156.0,
        volume_db: null,
      },
      {
        t: 166.5,
        pitch_hz: 108.0,
        pitch_st: -0.52,
        wpm_local: 144.0,
        volume_db: 67.0,
      },
      {
        t: 168.0,
        pitch_hz: 104.06,
        pitch_st: -1.17,
        wpm_local: 168.0,
        volume_db: 67.4,
      },
      {
        t: 169.5,
        pitch_hz: 109.52,
        pitch_st: -0.28,
        wpm_local: 150.0,
        volume_db: 66.2,
      },
      {
        t: 171.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 150.0,
        volume_db: null,
      },
      {
        t: 172.5,
        pitch_hz: 97.72,
        pitch_st: -2.25,
        wpm_local: 138.0,
        volume_db: 59.3,
      },
      {
        t: 174.0,
        pitch_hz: 81.87,
        pitch_st: -5.32,
        wpm_local: 144.0,
        volume_db: 65.3,
      },
      {
        t: 175.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 120.0,
        volume_db: null,
      },
      {
        t: 177.0,
        pitch_hz: 97.8,
        pitch_st: -2.24,
        wpm_local: 138.0,
        volume_db: 68.2,
      },
      {
        t: 178.5,
        pitch_hz: 104.38,
        pitch_st: -1.11,
        wpm_local: 138.0,
        volume_db: 63.9,
      },
      {
        t: 180.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 181.5,
        pitch_hz: 107.69,
        pitch_st: -0.57,
        wpm_local: 150.0,
        volume_db: 65.5,
      },
      {
        t: 183.0,
        pitch_hz: 102.29,
        pitch_st: -1.46,
        wpm_local: 144.0,
        volume_db: 64.9,
      },
      {
        t: 184.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 186.0,
        pitch_hz: 96.5,
        pitch_st: -2.47,
        wpm_local: 126.0,
        volume_db: 66.6,
      },
      {
        t: 187.5,
        pitch_hz: 102.46,
        pitch_st: -1.43,
        wpm_local: 108.0,
        volume_db: 70.7,
      },
      {
        t: 189.0,
        pitch_hz: 77.92,
        pitch_st: -6.17,
        wpm_local: 102.0,
        volume_db: 61.2,
      },
      {
        t: 190.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 114.0,
        volume_db: null,
      },
      {
        t: 192.0,
        pitch_hz: 92.58,
        pitch_st: -3.19,
        wpm_local: 96.0,
        volume_db: 59.6,
      },
      {
        t: 193.5,
        pitch_hz: 83.25,
        pitch_st: -5.03,
        wpm_local: 96.0,
        volume_db: 61.8,
      },
      {
        t: 195.0,
        pitch_hz: 100.34,
        pitch_st: -1.79,
        wpm_local: 102.0,
        volume_db: 65.5,
      },
      {
        t: 196.5,
        pitch_hz: 74.92,
        pitch_st: -6.85,
        wpm_local: 102.0,
        volume_db: 42.5,
      },
      {
        t: 198.0,
        pitch_hz: 80.55,
        pitch_st: -5.6,
        wpm_local: 90.0,
        volume_db: 54.7,
      },
      {
        t: 199.5,
        pitch_hz: 110.54,
        pitch_st: -0.12,
        wpm_local: 96.0,
        volume_db: 59.1,
      },
      {
        t: 201.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 96.0,
        volume_db: null,
      },
      {
        t: 202.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 102.0,
        volume_db: null,
      },
      {
        t: 204.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 102.0,
        volume_db: null,
      },
      {
        t: 205.5,
        pitch_hz: 110.54,
        pitch_st: -0.12,
        wpm_local: 120.0,
        volume_db: 63.5,
      },
      {
        t: 207.0,
        pitch_hz: 133.58,
        pitch_st: 3.16,
        wpm_local: 138.0,
        volume_db: 61.1,
      },
      {
        t: 208.5,
        pitch_hz: 123.45,
        pitch_st: 1.79,
        wpm_local: 150.0,
        volume_db: 54.6,
      },
      {
        t: 210.0,
        pitch_hz: 108.84,
        pitch_st: -0.39,
        wpm_local: 156.0,
        volume_db: 60.0,
      },
      {
        t: 211.5,
        pitch_hz: 110.84,
        pitch_st: -0.07,
        wpm_local: 162.0,
        volume_db: 57.8,
      },
      {
        t: 213.0,
        pitch_hz: 130.8,
        pitch_st: 2.79,
        wpm_local: 168.0,
        volume_db: 59.7,
      },
      {
        t: 214.5,
        pitch_hz: 129.89,
        pitch_st: 2.67,
        wpm_local: 162.0,
        volume_db: 59.2,
      },
      {
        t: 216.0,
        pitch_hz: 93.19,
        pitch_st: -3.07,
        wpm_local: 126.0,
        volume_db: 46.7,
      },
      {
        t: 217.5,
        pitch_hz: 88.34,
        pitch_st: -4.0,
        wpm_local: 114.0,
        volume_db: 52.1,
      },
      {
        t: 219.0,
        pitch_hz: 84.08,
        pitch_st: -4.86,
        wpm_local: 120.0,
        volume_db: 51.8,
      },
      {
        t: 220.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.0,
        volume_db: null,
      },
      {
        t: 222.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 90.0,
        volume_db: null,
      },
      {
        t: 223.5,
        pitch_hz: 83.53,
        pitch_st: -4.97,
        wpm_local: 78.0,
        volume_db: 56.3,
      },
      {
        t: 225.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 96.0,
        volume_db: null,
      },
      {
        t: 226.5,
        pitch_hz: 123.62,
        pitch_st: 1.82,
        wpm_local: 114.0,
        volume_db: 56.3,
      },
      {
        t: 228.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.0,
        volume_db: null,
      },
      {
        t: 229.5,
        pitch_hz: 123.89,
        pitch_st: 1.85,
        wpm_local: 102.0,
        volume_db: 61.2,
      },
      {
        t: 231.0,
        pitch_hz: 119.0,
        pitch_st: 1.16,
        wpm_local: 126.0,
        volume_db: 61.7,
      },
      {
        t: 232.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 126.0,
        volume_db: null,
      },
      {
        t: 234.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 138.0,
        volume_db: null,
      },
      {
        t: 235.5,
        pitch_hz: 106.34,
        pitch_st: -0.79,
        wpm_local: 144.0,
        volume_db: 62.8,
      },
      {
        t: 237.0,
        pitch_hz: 146.26,
        pitch_st: 4.73,
        wpm_local: 132.0,
        volume_db: 64.1,
      },
      {
        t: 238.5,
        pitch_hz: 103.13,
        pitch_st: -1.32,
        wpm_local: 150.0,
        volume_db: 51.0,
      },
      {
        t: 240.0,
        pitch_hz: 89.98,
        pitch_st: -3.68,
        wpm_local: 162.0,
        volume_db: 45.7,
      },
      {
        t: 241.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 156.0,
        volume_db: null,
      },
      {
        t: 243.0,
        pitch_hz: 94.31,
        pitch_st: -2.87,
        wpm_local: 150.0,
        volume_db: 56.3,
      },
      {
        t: 244.5,
        pitch_hz: 106.51,
        pitch_st: -0.76,
        wpm_local: 144.0,
        volume_db: 60.9,
      },
      {
        t: 246.0,
        pitch_hz: 86.83,
        pitch_st: -4.3,
        wpm_local: 186.0,
        volume_db: 54.2,
      },
      {
        t: 247.5,
        pitch_hz: 112.86,
        pitch_st: 0.24,
        wpm_local: 204.0,
        volume_db: 61.0,
      },
      {
        t: 249.0,
        pitch_hz: 83.08,
        pitch_st: -5.06,
        wpm_local: 216.0,
        volume_db: 45.8,
      },
      {
        t: 250.5,
        pitch_hz: 97.18,
        pitch_st: -2.35,
        wpm_local: 186.0,
        volume_db: 55.3,
      },
      {
        t: 252.0,
        pitch_hz: 97.56,
        pitch_st: -2.28,
        wpm_local: 204.0,
        volume_db: 55.0,
      },
      {
        t: 253.5,
        pitch_hz: 91.79,
        pitch_st: -3.34,
        wpm_local: 192.0,
        volume_db: 54.0,
      },
      {
        t: 255.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 168.0,
        volume_db: null,
      },
      {
        t: 256.5,
        pitch_hz: 104.73,
        pitch_st: -1.05,
        wpm_local: 162.0,
        volume_db: 57.9,
      },
      {
        t: 258.0,
        pitch_hz: 78.22,
        pitch_st: -6.11,
        wpm_local: 144.0,
        volume_db: 50.0,
      },
      {
        t: 259.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 144.0,
        volume_db: null,
      },
      {
        t: 261.0,
        pitch_hz: 92.68,
        pitch_st: -3.17,
        wpm_local: 162.0,
        volume_db: 58.8,
      },
      {
        t: 262.5,
        pitch_hz: 117.45,
        pitch_st: 0.93,
        wpm_local: 156.0,
        volume_db: 51.1,
      },
      {
        t: 264.0,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 174.0,
        volume_db: null,
      },
      {
        t: 265.5,
        pitch_hz: 96.08,
        pitch_st: -2.55,
        wpm_local: 162.0,
        volume_db: 60.0,
      },
      {
        t: 267.0,
        pitch_hz: 67.98,
        pitch_st: -8.54,
        wpm_local: 168.0,
        volume_db: 49.9,
      },
      {
        t: 268.5,
        pitch_hz: 103.79,
        pitch_st: -1.21,
        wpm_local: 156.0,
        volume_db: 63.3,
      },
      {
        t: 270.0,
        pitch_hz: 73.73,
        pitch_st: -7.13,
        wpm_local: 144.0,
        volume_db: 50.3,
      },
      {
        t: 271.5,
        pitch_hz: 85.39,
        pitch_st: -4.59,
        wpm_local: 132.4,
        volume_db: 60.8,
      },
      {
        t: 273.0,
        pitch_hz: 93.82,
        pitch_st: -2.96,
        wpm_local: 134.9,
        volume_db: 62.4,
      },
      {
        t: 274.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 108.9,
        volume_db: null,
      },
      {
        t: 275.5,
        pitch_hz: null,
        pitch_st: null,
        wpm_local: 118.5,
        volume_db: null,
      },
    ],
    pauses: [
      {
        start: 4.99,
        end: 6.18,
      },
      {
        start: 7.1,
        end: 7.87,
      },
      {
        start: 11.62,
        end: 12.96,
      },
      {
        start: 15.23,
        end: 16.61,
      },
      {
        start: 23.87,
        end: 24.8,
      },
      {
        start: 29.02,
        end: 30.56,
      },
      {
        start: 34.5,
        end: 35.71,
      },
      {
        start: 37.28,
        end: 38.56,
      },
      {
        start: 42.59,
        end: 43.49,
      },
      {
        start: 47.65,
        end: 48.51,
      },
      {
        start: 50.05,
        end: 50.88,
      },
      {
        start: 53.57,
        end: 56.03,
      },
      {
        start: 64.99,
        end: 66.14,
      },
      {
        start: 75.94,
        end: 76.67,
      },
      {
        start: 78.98,
        end: 80.19,
      },
      {
        start: 80.32,
        end: 81.12,
      },
      {
        start: 82.18,
        end: 83.1,
      },
      {
        start: 85.12,
        end: 88.74,
      },
      {
        start: 95.36,
        end: 96.67,
      },
      {
        start: 110.43,
        end: 112.19,
      },
      {
        start: 115.07,
        end: 116.0,
      },
      {
        start: 121.5,
        end: 123.84,
      },
      {
        start: 126.62,
        end: 127.36,
      },
      {
        start: 128.7,
        end: 129.98,
      },
      {
        start: 130.75,
        end: 132.29,
      },
      {
        start: 133.89,
        end: 135.46,
      },
      {
        start: 136.93,
        end: 140.29,
      },
      {
        start: 141.15,
        end: 141.92,
      },
      {
        start: 145.63,
        end: 147.07,
      },
      {
        start: 148.38,
        end: 148.99,
      },
      {
        start: 149.92,
        end: 150.78,
      },
      {
        start: 152.86,
        end: 153.86,
      },
      {
        start: 155.36,
        end: 156.13,
      },
      {
        start: 157.79,
        end: 158.46,
      },
      {
        start: 160.8,
        end: 161.41,
      },
      {
        start: 162.62,
        end: 163.23,
      },
      {
        start: 164.83,
        end: 165.44,
      },
      {
        start: 179.49,
        end: 180.64,
      },
      {
        start: 189.44,
        end: 191.74,
      },
      {
        start: 195.68,
        end: 196.58,
      },
      {
        start: 201.6,
        end: 203.17,
      },
      {
        start: 219.65,
        end: 222.56,
      },
      {
        start: 224.13,
        end: 225.28,
      },
      {
        start: 227.97,
        end: 228.58,
      },
      {
        start: 233.02,
        end: 234.14,
      },
      {
        start: 239.9,
        end: 241.79,
      },
      {
        start: 243.49,
        end: 244.16,
      },
      {
        start: 246.3,
        end: 247.01,
      },
      {
        start: 254.21,
        end: 255.62,
      },
      {
        start: 258.21,
        end: 259.68,
      },
      {
        start: 261.73,
        end: 262.43,
      },
      {
        start: 267.17,
        end: 268.03,
      },
      {
        start: 271.9,
        end: 272.54,
      },
      {
        start: 274.59,
        end: 275.56,
      },
    ],
    pitch_mean_hz: 111.3,
    pitch_std_hz: 23.27,
    pitch_std_st: 3.32,
  },
  metrics: {
    wpm: 141.1,
    fillers: [
      {
        t: 12.66,
        word: "so",
        category: "verbal_pause",
      },
      {
        t: 33.88,
        word: "actually",
        category: "hedge",
      },
      {
        t: 77.31,
        word: "so",
        category: "verbal_pause",
      },
      {
        t: 77.47,
        word: "just",
        category: "hedge",
      },
      {
        t: 80.87,
        word: "so",
        category: "verbal_pause",
      },
      {
        t: 90.31,
        word: "just",
        category: "hedge",
      },
      {
        t: 112.06,
        word: "so",
        category: "verbal_pause",
      },
      {
        t: 116.54,
        word: "like",
        category: "verbal_pause",
      },
      {
        t: 147.26,
        word: "know",
        category: "verbal_pause",
      },
      {
        t: 222.61,
        word: "so",
        category: "verbal_pause",
      },
      {
        t: 230.77,
        word: "simply",
        category: "hedge",
      },
    ],
    long_pauses: 27,
    pauses_over_2: 6,
    filler_per_min: 2.4,
    monotone_score: 0.07,
    pauses_over_0_6: 54,
    total_pause_sec: 87.3,
    volume_range_db: 12.96,
  },
  synthesis: {
    headline:
      "A masterfully crafted speech with commanding vocal variety — a few hedges and one structural seam are the only things to polish.",
    rewrites: [
      {
        why: "Removes 'just' and 'wanna', replaces the hedge-apology with a forward-pointing stake, and drops the pace-killing filler 'so' at the clause opening.",
        original: "So I just wanna make sure we have that in mind.",
        suggested:
          "Hold that distinction — it matters for everything that follows.",
      },
      {
        why: "Cutting 'simply' removes the unintentional minimiser from the thesis line, and 'fills exactly' adds precision without adding length.",
        original: "AI simply plugs the gaps.",
        suggested: "AI fills exactly those gaps.",
      },
      {
        why: "Drops the meta-announcement label ('the key message tonight is') and reframes the claim as a positive rather than a negation, which lands with more force.",
        original:
          "So the key message tonight is AI doesn't replace the human evaluator.",
        suggested:
          "AI doesn't replace the human evaluator — it makes the human evaluator complete.",
      },
    ],
    categories: {
      hook: {
        score: 5,
        counts: [],
        evidence: [],
        rationale:
          "Opens on an unexpected, concrete claim ('There has never been a perfect evaluation in Toastmasters history') with no warm-up, no hedge, no apology. The staccato follow-ups ('Not one.', 'Not in this club') and a planted callback create forward tension within the first five seconds. This is a textbook strong hook.",
        applicability_reason: null,
      },
      pacing: {
        score: 5,
        counts: [],
        evidence: [
          {
            t: 192.88,
            quote: "No. Nobody can.",
          },
        ],
        rationale:
          "141 WPM overall sits perfectly in the 130–160 band, and the pace shifts are deliberately deployed: 83 WPM for the 'No. Nobody can.' punch, 330 WPM for the rapid-fire rhetorical questions, 119 WPM for the key message reveal. These contrasts mark section transitions and emphasis points rather than betraying anxiety. The only caution is the 330 WPM burst at ~77s which rushes a summary line — a minor blemish in an otherwise excellent rhythm.",
        applicability_reason: null,
      },
      pauses: {
        score: 5,
        counts: [
          {
            count: 54,
            label: "≥0.6s",
          },
          {
            count: 6,
            label: "≥2s",
          },
        ],
        evidence: [],
        rationale:
          "54 pauses of ≥0.6s across 275s — roughly one every five seconds — with 6 pauses over 2 seconds. Crucially, placement is excellent: pauses land after 'never' (prominent word), after 'Not one.', after 'be.' at the end of the hook staccato, after 'that.' and 'touch.' in the human-evaluator defence, and the 3.4s pause after 'humans are gloriously flawed' lets that line breathe. This is among the best pause usage observable in a Toastmasters speech.",
        applicability_reason: null,
      },
      closing: {
        score: 4,
        counts: [],
        evidence: [
          {
            t: 222.37,
            quote:
              "So the key message tonight is AI doesn't replace the human evaluator",
          },
        ],
        rationale:
          "The icebreaker reframe ('Treat it the way you treated your icebreaker. The goal isn't to be brilliant.') is a genuinely memorable close, and the final aphorism about curiosity is a strong landing line. It loses one point because the explicit thesis announcement ('So the key message tonight is…') momentarily flattens energy before the real close resumes — cutting or compressing that transitional label would let the call-to-action carry the weight directly.",
        applicability_reason: null,
      },
      language: {
        score: 4,
        counts: [
          {
            count: 5,
            label: "so (verbal pause)",
          },
          {
            count: 2,
            label: "just (hedge)",
          },
          {
            count: 1,
            label: "actually (hedge)",
          },
          {
            count: 1,
            label: "like (verbal pause)",
          },
          {
            count: 1,
            label: "know (verbal pause)",
          },
          {
            count: 1,
            label: "simply (hedge)",
          },
        ],
        evidence: [
          {
            t: 77.14,
            quote: "So I just wanna make sure we have that in mind",
          },
          {
            t: 230.77,
            quote: "AI simply plugs the gaps",
          },
        ],
        rationale:
          "2.4 fillers/min is clean and well below the problem threshold. The filler profile is dominated by sentence-initial 'so' (×5) used as transitional connectors and two instances of 'just' as hedges — neither pattern disrupts meaning. One note: 'simply' at t=230.77 softens the thesis line ('AI simply plugs the gaps') at exactly the moment the argument deserves its strongest form. Removing 'simply' and cutting 'just' from the 'I just wanna make sure' line would sharpen the two weakest moments in an otherwise precise script.",
        applicability_reason: null,
      },
      structure: {
        score: 5,
        counts: [],
        evidence: [],
        rationale:
          "Clear three-act arc: hook → AI landscape briefing → human vs AI evaluator comparison → call to action. The callback to the opening hook mid-speech ('This brings me back to the perfect evaluation, the one that never was') functions as an elegant hinge. The closing icebreaker analogy closes the loop on the Toastmasters frame. Signposting is present and mostly explicit ('First, let's get clear...', 'This brings me back...', 'So the key message tonight is...').",
        applicability_reason: null,
      },
      message_focus: {
        score: 4,
        counts: [],
        evidence: [
          {
            t: 222.37,
            quote:
              "So the key message tonight is AI doesn't replace the human evaluator",
          },
        ],
        rationale:
          "The central idea — AI complements the human evaluator by filling memory gaps — is clearly stated near the close ('AI doesn't replace the human evaluator. Where humans have limitations, AI simply plugs the gaps'). It loses one point because the thesis doesn't surface until ~222s; the body earns it but the audience spends four minutes assembling the argument before it is named. Stating the thesis earlier — perhaps right after the hook — would give the body sections more cumulative force.",
        applicability_reason: null,
      },
      vocal_variety: {
        score: 5,
        counts: [],
        evidence: [
          {
            t: 57.52,
            quote: "AI can't yet replace real engineering expertise",
          },
          {
            t: 192.88,
            quote: "No. Nobody can.",
          },
        ],
        rationale:
          "Monotone score of 0.07 — essentially the floor — and volume_range_db of 12.96 confirm commanding variety in both channels. Pitch ranges across segments span from a low 0.0 st (the 'is it secure?' throwaway line) to 16.0 st on the 'AI can't yet replace' pivot, and the intensity jump from ~48 dB in the opening to 60–63 dB in the rhetorical question volley is a clear, purposeful swell. The prominent words ('never', 'tonight', 'First', 'AI', 'human's', 'Nobody') consistently sit in higher-range segments. One minor note: at t=74.75 the 'good quality' segment drops to 0.7 st pitch range and 46.1 dB — a flat pocket on a content word — but it is isolated and does not undermine the overall picture.",
        applicability_reason: null,
      },
    },
    priorities: [
      {
        drill:
          "After the hook and callback plant, insert one sentence that names the destination: 'Tonight I'll argue that AI and the human evaluator are better together than either alone.' Then let the body prove it. Time the insertion so it lands before t=30s.",
        title:
          "State the thesis earlier — don't make the audience wait four minutes for it",
        example_t: 222.37,
        observation:
          "The central message ('AI doesn't replace the human evaluator — it plugs the gaps') doesn't arrive until t=222s, roughly 80% of the way through a 275-second speech. The body earns it, but the audience is navigating the argument without a map.",
        example_quote:
          "So the key message tonight is AI doesn't replace the human evaluator",
        why_it_matters:
          "A thesis revealed late forces the audience to hold the pieces in working memory and trust they'll assemble. A thesis planted early gives every body section cumulative weight — each point lands as evidence rather than a new idea.",
      },
      {
        drill:
          "Write out both lines with every hedge removed ('AI plugs the gaps' / 'We need to hold that in mind'). Rehearse each version three times back-to-back until the unhedged form is the default reflex.",
        title: "Strip hedges from the two highest-stakes lines",
        example_t: 230.77,
        observation:
          "'Just wanna make sure we have that in mind' at the close of the AI capability section, and 'AI simply plugs the gaps' at the thesis statement, both soften lines that carry the argument's weight.",
        example_quote: "AI simply plugs the gaps",
        why_it_matters:
          "Hedges on a thesis line signal uncertainty to the audience about the speaker's own claim. These are the lines most likely to be quoted or remembered — they must carry full conviction.",
      },
      {
        drill:
          "Mark this line in your script with a 'SLOW' annotation. In your next run, deliberately pause 0.5s before it and deliver it at under 140 WPM — the contrast with the preceding burst will make it feel deliberate rather than rushed.",
        title: "Slow the 330 WPM summary burst at ~77s",
        example_t: 77.14,
        observation:
          "After the rapid rhetorical questions about code quality and security — a deliberate acceleration that works — the landing line ('So I just wanna make sure we have that in mind') fires at 330 WPM. The summary is too compressed to register.",
        example_quote: "So I just wanna make sure we have that in mind",
        why_it_matters:
          "Acceleration into a question sequence earns energy; the resolution of that sequence needs to decelerate so the audience hears the landing. At 330 WPM the line sounds like a verbal escape hatch, not a conclusion.",
      },
    ],
    walkthrough: {
      body: [
        {
          end_t: 110.0,
          praise:
            "The parallel construction ('Here's what's true… But here's what's also true') is clean signposting that lets the audience track the argument.",
          quote_t: 57.52,
          start_t: 40.0,
          critique:
            "The 330 WPM burst at ~77s ('So I just wanna make sure we have that in mind') rushes the one line that should function as a summary beat — the filler 'just' also undercuts it.",
          observation:
            "Balanced 'here's what's true / here's what's also true' structure sets up AI's capabilities and limits. Pace accelerates sharply at the 'good quality / secure' rhetorical questions (74–79s) before resetting.",
        },
        {
          end_t: 165.0,
          praise:
            "The callback to the opening hook ('This brings me back to the perfect evaluation, the one that never was') is elegantly timed and earns the emotional pivot to human evaluator strengths.",
          quote_t: 123.77,
          start_t: 110.0,
          critique:
            "The Cloud Code explanation is slightly technical and could lose a non-technical audience; 'You provided a go and play in English' reads as a transcript artefact that muddies the explanation.",
          observation:
            "Introduces Claude Code and the agent loop concept. Explains the division of labour: human decomposes and directs, agent executes. Returns to the 'perfect evaluation' plant.",
        },
        {
          end_t: 225.0,
          praise:
            "The rhetorical question sequence ('Could you retain every single word? Could you count every lexical filler word?') builds excellently, and the 83 WPM drop on 'No. Nobody can.' is perfectly deployed contrast.",
          quote_t: 192.88,
          start_t: 165.0,
          critique:
            "The volume surge in this section (intensity_db jumps to 60–63 dB) works well but the prominent words shift slightly off the key content words toward function words ('holding', 'you', 'on').",
          observation:
            "Defends the human evaluator's irreplaceable powers (knowing the speaker's journey, feeling the room, goosebumps) before pivoting to human memory limits with a rhetorical question volley.",
        },
      ],
      close: {
        end_t: 275.5,
        praise:
          "The icebreaker callback is a genuinely elegant structural move; it reframes the stakes and gives Toastmasters members a personal entry point. The closing aphorism lands with real force.",
        quote_t: 268.12,
        start_t: 225.0,
        critique:
          "'So the key message tonight is' is a meta-announcement that slightly diminishes what follows — the message is strong enough to stand without the label. 'AI simply plugs the gaps' softens a strong idea with 'simply'.",
        observation:
          "States the key message explicitly, issues a personal challenge ('Open Cloud Code or Codex'), and closes on a reframed icebreaker analogy — 'The goal isn't to be brilliant. The goal is to discover you could do it at all.' Ends on a pointed aphorism about curiosity.",
      },
      opening: {
        end_t: 40.0,
        praise:
          "The hook is arresting and well-paced; the pauses after 'Not one.' and 'be.' give each fragment room to land. 'Hold on to that thought' creates genuine forward tension.",
        quote_t: 1.12,
        start_t: 0.0,
        critique:
          "The transition from hook to topic ('Because tonight, I'll talk about AI') is slightly procedural — it announces the agenda rather than extending the intrigue.",
        observation:
          "Opens with a bold, counter-intuitive claim — 'There has never been a perfect evaluation in Toastmasters history' — followed by staccato reinforcement ('Not one.') and a deliberate callback plant ('hold on to that thought'). The topic pivot to AI arrives cleanly at ~17s.",
      },
    },
    message_sentence:
      "AI doesn't replace the human Toastmasters evaluator — where humans have memory limits, AI plugs the gaps.",
  },
  overall: {
    score: 4.62,
    weights: {
      hook: 0.12,
      pacing: 0.11,
      pauses: 0.11,
      closing: 0.1,
      language: 0.08,
      structure: 0.18,
      message_focus: 0.2,
      vocal_variety: 0.1,
    },
    weights_version: 2,
    applicable_categories: [
      "message_focus",
      "structure",
      "hook",
      "closing",
      "pacing",
      "pauses",
      "vocal_variety",
      "language",
    ],
  },
  cost: null,
};

export const messySampleReport: Report = {
  report_id: "sample_messy",
  audio_key: "samples/messy.mp3",
  created_at: "2026-05-15T16:08:00Z",
  duration_sec: 282.6,
  schema_version: 5,
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
      (t) => 60 + 1.5 * Math.sin(t / 10),
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
    pauses_over_0_6: 1,
    pauses_over_2: 0,
    total_pause_sec: 0.9,
    monotone_score: 0.62,
    volume_range_db: 2.1,
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
          'Two soft openers stacked: an apology for being last on the agenda, then an "um" before the first real sentence. The thesis arrives at 0:32 — twenty seconds late.',
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
          "An apology is not a hook. The real first line — the one with the substance — is buried twenty seconds in. Cutting just the opening's three fillers would lift the whole talk's first impression.",
        evidence: [{ quote: "Sorry I'm last, um", t: 6 }],
        counts: [],
        applicability_reason: null,
      },
      message_focus: {
        score: 3,
        rationale:
          "The thesis is real, but it's never stated as one clean sentence — the talk circles it three times in softened form without landing it. “What I'm kind of trying to say is” at 3:14 is the closest it comes, and it's hedged twice in eight words. Pick the single sentence the talk is about, strip the softeners, and say it once at the top and once at the close.",
        evidence: [{ quote: "what I'm kind of trying to say is", t: 194 }],
        counts: [],
        applicability_reason: null,
      },
      structure: {
        score: 3,
        rationale:
          "A beginning, middle, and end exist, but nothing signposts them — the audience has to infer where each section ends. The transition from problem to solution at 2:12 is the only audible marker in four-and-a-half minutes. Name each section as you enter it (“So here's the problem… here's what we did”) so the room follows the arc instead of reconstructing it.",
        evidence: [],
        counts: [],
        applicability_reason: null,
      },
      closing: {
        score: 2,
        rationale:
          "Ends on “so yeah” — a verbal shrug, with no call-back, no summary, and no answer to the question implied at the open. The body built something and the trail-off hands it straight back. Write the final six words in advance and rehearse them; the whole talk is judged on the sentence it ends on.",
        evidence: [{ quote: "so yeah", t: 280 }],
        counts: [],
        applicability_reason: null,
      },
      pacing: {
        score: 2,
        rationale:
          "174 wpm average and one pause in four-and-a-half minutes — the audience never gets a beat to catch up. The 30s data section at 1:50 climbs to 195 wpm and never recovers a settle point.",
        evidence: [{ quote: "and basically we needed to ship", t: 117 }],
        counts: [
          { label: "avg wpm", count: 174 },
          { label: "peak wpm", count: 195 },
        ],
        applicability_reason: null,
      },
      pauses: {
        score: 2,
        rationale:
          "One long pause, on luck not design. Pauses are how the audience absorbs a number or a name — there are several here that needed one, and without them the room can't keep up with which sentences matter.",
        evidence: [],
        counts: [{ label: "≥0.6s", count: 1 }],
        applicability_reason: null,
      },
      vocal_variety: {
        score: 2,
        rationale:
          "Semitone range of 2.8 — flat. Pitch sits within a narrow band even on the strongest claims; the strongest line of the talk (“this is the important part” at 2:45) is delivered flat, so the audience gets no acoustic signal that it matters.",
        evidence: [{ quote: "this is the important part", t: 165 }],
        counts: [],
        applicability_reason: null,
      },
      language: {
        score: 1,
        rationale:
          "Eighteen fillers in four-and-a-half minutes — one every fifteen seconds — split across hedges, verbal pauses, and interjections. Each one tells the room the speaker isn't sure; strip them and the sentences still parse.",
        evidence: [
          { quote: "kind of the main thing", t: 22 },
          { quote: "you know, what I mean", t: 47 },
          { quote: "it's like, the thing is", t: 72 },
        ],
        counts: [
          { label: "um/uh", count: 6 },
          { label: "like", count: 4 },
          { label: "kind of", count: 4 },
          { label: "you know", count: 4 },
        ],
        applicability_reason: null,
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
        original:
          "Sorry I'm last on the agenda, um, I'll try to keep this short.",
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
  cost: null,
};
