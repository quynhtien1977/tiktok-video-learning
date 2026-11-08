export type VoiceProvider = "azure" | "capcut" | "gemini";

export type Voice = {
  provider: VoiceProvider;
  /**
   * azure:  vi-VN-Grant:MAI-Voice-2.1 (nam) | vi-VN-Harper:MAI-Voice-2.1 (nữ) | vi-VN-NamMinhNeural
   * capcut: voice_type, ví dụ BV075_streaming (xem `npm run voices:capcut`)
   * gemini: tên giọng, ví dụ achird (nam, ấm) | algieba (nam, trầm) | aoede (nữ)
   */
  name?: string;
  /** Azure: "+3%" | "0.9". CapCut BỎ QUA rate — dùng `speed` bên dưới thay thế. */
  rate?: string;
  /** Chỉ Azure. CapCut bỏ qua pitch. */
  pitch?: string;
  /**
   * azure:  mstts:express-as style (vi-VN-Grant có educational | narrator | neutral | agent)
   * gemini: chỉ đạo bằng tiếng Anh tự nhiên, ví dụ "warm teacher, brisk pace, a bit playful"
   */
  style?: string;
  /** Chỉ CapCut: emotion + độ mạnh 1–5. Đây là núm chỉnh duy nhất CapCut thực sự nghe theo. */
  emotion?: string;
  emotionScale?: string | number;
  /**
   * Hậu kỳ bằng ffmpeg atempo (0.5–2.0), áp dụng cho mọi provider.
   * Dùng để chỉnh nhịp đọc khi engine không cho chỉnh rate. 1.0 = giữ nguyên.
   */
  speed?: number;
};

/**
 * Vai nói. "host" = giọng giảng chính, "ask" = giọng đặt câu hỏi/phản biện.
 * Thêm vai mới chỉ cần khai báo trong episode.voices.
 */
export type SpeakerId = "host" | "ask" | (string & {});

type SceneBase = {
  id: string;
  /** Lời thoại — nguồn duy nhất cho TTS và cho phụ đề */
  narration: string;
  /** Vai nói scene này; không khai báo thì là "host" */
  speaker?: SpeakerId;
  /** Ghi đè giọng cho riêng scene này (ví dụ dùng CapCut cho 1 scene) */
  voice?: Partial<Voice>;
  /** Giây im lặng thêm vào sau scene (mặc định 0.4s) */
  tailSeconds?: number;
  /** Số phần khi cắt tập thành nhiều video ngắn (TikTok). Không ghi thì thuộc phần 1. */
  part?: number;
  /**
   * Chèn tiếng phi lời nói (cười, thở dài) vào giữa câu — xem scripts/insert-sfx.ts.
   * Cần vì không engine TTS nào ở đây hiểu audio tag kiểu ElevenLabs.
   */
  inserts?: { after: string; file: string; gainDb?: number; overlap?: number }[];
};

export type Scene = SceneBase &
  (
    | { type: "title"; title: string; subtitle?: string }
    | { type: "bullets"; heading: string; bullets: string[]; cues?: string[] }
    | { type: "formula"; heading?: string; latex: string; caption?: string }
    | { type: "image"; src: string; caption?: string }
    | { type: "diagram"; name: string; heading?: string; cues?: string[] }
    | { type: "quote"; text: string; author?: string }
    | { type: "question"; question: string; hint?: string }
    | { type: "outro"; heading: string; points?: string[]; next?: string }
  );

export type Episode = {
  id: string;
  episodeNumber: number;
  seriesTitle: string;
  title: string;
  /** Giọng mặc định (vai host) */
  voice: Voice;
  /** Giọng theo vai: { host: {...}, ask: {...} } — ghi đè voice cho scene có speaker tương ứng */
  voices?: Record<string, Partial<Voice>>;
  scenes: Scene[];
};

export type Word = { text: string; startMs: number; endMs: number };

/** public/voice/<ep>/manifest.json — do scripts/ sinh ra, không sửa tay */
export type AudioManifest = {
  episodeId: string;
  generatedAt: string;
  scenes: Record<
    string,
    {
      file: string;
      durationSeconds: number;
      provider: VoiceProvider;
      words?: Word[];
      /** Mốc (ms) để hiện từng bullet / từng bước sơ đồ, lấy từ timing lời nói */
      cues?: number[];
    }
  >;
};

export type EpisodeProps = {
  episode: Episode;
  manifest: AudioManifest | null;
  /** Chỉ render các scene thuộc phần này; bỏ trống là render cả tập. */
  part?: number | null;
};
