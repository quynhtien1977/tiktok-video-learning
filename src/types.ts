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

/**
 * 28 Tư thế & Biểu cảm Chibi PNGTuber (kiểu Game Cực Hay & snaptik) cho nhân vật SON & MỰC:
 * - 10 Tư thế & Biểu cảm Gốc (9 ô lưới 3x3 + neutral):
 *   neutral (chào mỉm cười) | wave (vẫy tay chào) | touch / book (đọc sách đỏ chăm chú) |
 *   ok / popcorn (ăn bỏng ngô mắt sao) | shocked (tụt huyết áp + đổ mồ hôi hột) |
 *   point (chỉ tay giải thích) | curious / sparkle (ôm má mắt sao lấp lánh ✦) |
 *   think (chống cằm + dấu chấm hỏi ?) | peace (cười tít mắt ^ ^ chữ V) | heart (nháy mắt ;) bắn tim ♥)
 * - 9 Biến thể Đảo chiều & Nghiêng đầu Biểu cảm:
 *   neutral-shy | think-left | curious-tilt | point-left | wave-left | peace-left | ok-right | heart-left | touch-left
 * - 9 Biến thể Cận cảnh & Cảm xúc Năng lượng:
 *   neutral-attentive | think-doubt | curious-surprised | point-explain | wave-cheer | peace-playful | ok-confident | heart-closeup | touch-cool
 */
export type CharacterPose =
  | "neutral"
  | "think"
  | "curious"
  | "point"
  | "wave"
  | "peace"
  | "ok"
  | "heart"
  | "touch"
  | "hat-touch"
  | "shocked"
  | "book"
  | "popcorn"
  | "sparkle"
  | "neutral-shy"
  | "think-left"
  | "curious-tilt"
  | "point-left"
  | "wave-left"
  | "peace-left"
  | "ok-right"
  | "heart-left"
  | "touch-left"
  | "neutral-attentive"
  | "think-doubt"
  | "curious-surprised"
  | "point-explain"
  | "wave-cheer"
  | "peace-playful"
  | "ok-confident"
  | "heart-closeup"
  | "touch-cool";

/**
 * Đủ 8 tạo hình trang phục (8 Reference Styles) của nhân vật nữ SON dựng từ char_reference/woman_ask:
 * 1. beret: Mũ nồi beret kem + kính tròn + tóc đen dài + áo thun trắng viền cổ đen (Photobooth)
 * 2. cardigan: Tóc đen dài rẽ ngôi giữa + áo khoác cardigan đỏ bèo nhún thắt nơ (Video 6)
 * 3. preppy: Kính cài trên đỉnh đầu + tóc dài vắt vai + sơ mi trắng viền đen + dây buộc tóc cổ tay (Video 4)
 * 4. bun-bow: Tóc búi cao phồng + mái bay + áo tay bồng trắng viền hồng phấn đính nơ đen (Video 2)
 * 5. braid-rose: Tóc tết lệch vai + áo xanh baby-blue nhún ngực + cardigan trắng kem + hoa hồng (Video 1)
 * 6. maroon-tee: Tóc buộc gọn mái bay + kính cài trên đỉnh đầu + áo thun đỏ rượu vang maroon (Video 5)
 * 7. black-cami: Tóc búi cao sang trọng + eyeliner sắc sảo + áo hai dây đen + dây chuyền mảnh (Video 3)
 * 8. bus-polo: Tóc đen dài thẳng + áo polo thể thao trắng cổ đỏ sọc đỏ-navy (Ảnh trên xe buýt)
 */
export type CharacterOutfit =
  | "beret"
  | "cardigan"
  | "preppy"
  | "bun-bow"
  | "braid-rose"
  | "maroon-tee"
  | "black-cami"
  | "bus-polo";

type SceneBase = {
  id: string;
  /** Lời thoại — nguồn duy nhất cho TTS và cho phụ đề */
  narration: string;
  /** Vai nói scene này; không khai báo thì là "host" */
  speaker?: SpeakerId;
  /** Tư thế nhân vật cho riêng scene này; bỏ trống sẽ tự động chọn theo ngữ cảnh scene */
  pose?: CharacterPose;
  /** Tạo hình trang phục của nhân vật nữ SON cho scene này */
  outfit?: CharacterOutfit;
  /** Ghi đè giọng cho riêng scene này (ví dụ dùng CapCut cho 1 scene) */
  voice?: Partial<Voice>;
  /** Giây im lặng thêm vào sau scene (mặc định 0.4s) */
  tailSeconds?: number;
  /** Số phần khi cắt tập thành nhiều video ngắn (TikTok). Không ghi thì thuộc phần 1. */
  part?: number;
  /**
   * Scene này chỉ xuất hiện ở một khổ hình. Dùng cho hook và end card của bản dọc:
   * bản 16:9 xem liền mạch nên không cần, chen vào lại gãy mạch.
   */
  renderIn?: "all" | "vertical" | "horizontal";
  /**
   * Đổi tư thế nhân vật giữa scene, neo vào đúng lúc giọng nói tới cụm `after`.
   * Khai báo tay thì thắng mọi suy đoán tự động — dùng khi muốn chỉ đích danh.
   * Ví dụ: `"poses": [{ "after": "ví dụ", "pose": "ok" }]`
   */
  poses?: { after: string; pose: CharacterPose }[];
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
    /** promise = vế thứ hai của hook: xem xong thì làm được gì. Thiếu vế này hook hụt. */
    | { type: "hook"; hook: string; promise?: string; context?: string }
    | { type: "endcard"; next: string; cta?: string }
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
  /** Tạo hình trang phục mặc định cho SON trong tập ("beret" | "cardigan" | "preppy" | "auto") */
  outfit?: CharacterOutfit | "auto";
  /**
   * Hiệu ứng âm thanh: whoosh khi sang scene, pop khi hiện từng bullet, thunk khi
   * từng khối sơ đồ bật ra, sting dưới hook và motif ở end card.
   * Mặc định bật; đặt false để tắt cho cả tập.
   */
  sfx?: boolean;
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
