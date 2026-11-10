/**
 * Chọn tư thế nhân vật theo nội dung lời thoại.
 *
 * Tách khỏi `SpeakerBadge.tsx` vì phần này không có JSX, và vì `npm run poses` cần
 * import được nó từ một script Node — Node đọc được `.ts` nhưng không đọc `.tsx`.
 * Nhờ vậy lệnh soi dùng **đúng hàm mà video đang chạy**, không phải bản chép lại.
 */
import type { CharacterPose, Scene } from "./types";

/** Tìm từ khoá trong lời thoại, bỏ qua hoa thường. */
const has = (text: string, ...keys: string[]) => keys.some((k) => text.includes(k));

/**
 * Chọn **một** tư thế cho cả scene, theo nội dung lời thoại.
 *
 * Bản trước đổi tư thế 3–4 lần bên trong một scene theo tiến độ frame, và chọn trong
 * danh sách bằng `sceneIndex % n`. Hai điều đó cộng lại thành: nhân vật đổi dáng giữa
 * câu, và dáng ấy không liên quan gì tới điều đang nói. Giờ mỗi scene đúng một tư thế,
 * giữ nguyên từ đầu tới cuối, và tư thế ấy đọc ra từ chính lời thoại.
 *
 * **Tên tư thế KHÔNG mô tả đúng hình vẽ** — đây là bẫy, đã dính một lần. Hình thật:
 *
 * | Tên | Hình vẽ thật sự |
 * |---|---|
 * | `neutral-attentive`, `touch*` | cầm quyển sách đỏ đang đọc |
 * | `ok*` | ăn bỏng ngô, mắt sao lấp lánh |
 * | `shocked`, `think-doubt`, `neutral-shy` | mặt xanh, mắt xoáy, giọt mồ hôi — quá tải |
 * | `curious*` | ôm má, mắt sao — hẫng, tò mò |
 * | `think*` | chống cằm, có dấu hỏi bên đầu |
 * | `point*` | giơ ngón trỏ, cười tự tin — đang giảng |
 * | `peace*` | giơ chữ V, cười tít mắt |
 * | `heart*` | thả tim bằng tay, nháy mắt |
 * | `wave*` | vẫy tay |
 * | `neutral` | cười, một tay giơ ngang vai |
 *
 * Sửa ánh xạ thì nhìn vào bảng này, đừng suy từ tên. Dựng lại bảng tra bất cứ lúc nào
 * bằng cách ghép ảnh trong `public/characters/<nhân vật>/` kèm nhãn tên file.
 *
 * Muốn chỉ định cứng thì đặt `"pose"` trong scene — luôn thắng mọi quy tắc ở đây.
 */
export const resolveCharacterPose = (opts: {
  pose?: CharacterPose;
  sceneType?: Scene["type"];
  narration?: string;
}): CharacterPose => {
  if (opts.pose) return opts.pose;

  const text = (opts.narration ?? "").toLowerCase();
  // Cố ý KHÔNG bắt từ "khó": nó quá phổ biến, và "không khó" thì nghĩa ngược hẳn —
  // dùng nó làm nhân vật xanh mặt ở gần 10% số scene.
  const nangNe = has(text, "sập", "lỗi nặng", "rắc rối", "phức tạp", "chông chênh", "đau đầu");

  switch (opts.sceneType) {
    case "title":
      return "wave"; // vẫy tay chào đầu tập

    case "outro":
    case "endcard":
      return "wave-cheer";

    case "hook":
      // Hook mở bằng một câu hỏi gây hụt hẫng — ôm má mắt sao hợp hơn là chỉ trỏ.
      return text.includes("?") ? "curious-surprised" : "point-explain";

    case "question": {
      // Vai hỏi phải khớp với KIỂU câu hỏi, không phải bốc đại một dáng.
      if (nangNe) return "think-doubt"; // quá tải: mặt xanh mắt xoáy
      if (has(text, "vì sao", "tại sao", "sao lại", "sao phải")) return "think";
      if (has(text, "liệu", "có thật", "có đúng", "có cần", "có nên", "chắc không"))
        return "think-left";
      if (has(text, "khác nhau", "khác gì", "so với", "hay là")) return "curious-tilt";
      if (has(text, "là gì", "thế nào", "ra sao", "những gì", "gồm những")) return "curious";
      return "think";
    }

    case "diagram":
    case "image":
      return "point"; // giơ ngón trỏ, đang chỉ vào hình bên cạnh

    case "formula":
    case "quote":
      return "touch"; // cầm sách đọc định nghĩa

    case "bullets":
    default: {
      // Cố ý KHÔNG lấy <laugh> làm tư thế nền: nếu nền đã là cười thì tới đúng lúc cười
      // chẳng còn gì để đổi, và nhân vật cười sẵn từ trước câu đùa. Để tag làm mốc đổi.
      if (nangNe) return "shocked";
      if (has(text, "ví dụ", "chẳng hạn", "thử tưởng tượng")) return "ok"; // bỏng ngô: xem ví dụ
      if (has(text, "tức là", "nghĩa là", "nói cách khác")) return "point-explain";
      if (has(text, "định nghĩa", "khái niệm", "theo sách", "giáo trình"))
        return "neutral-attentive"; // cầm sách
      return "neutral";
    }
  }
};

/**
 * Những khoảnh khắc trong lời thoại đáng đổi tư thế, kèm tư thế tương ứng.
 * Xếp theo độ ưu tiên: gặp nhiều từ khoá thì giữ cái đứng trước.
 */
const BEATS: { keys: string[]; pose: CharacterPose }[] = [
  { keys: ["<laugh>", "haha"], pose: "peace-playful" },
  { keys: ["rắc rối", "phức tạp", "sập", "lỗi nặng", "đau đầu"], pose: "shocked" },
  { keys: ["ví dụ", "chẳng hạn", "tưởng tượng", "giả sử"], pose: "ok" },
  { keys: ["tức là", "nghĩa là", "nói cách khác", "đơn giản là"], pose: "point-explain" },
  { keys: ["nhớ", "quan trọng", "lưu ý", "chú ý", "đừng"], pose: "point" },
  { keys: ["định nghĩa", "khái niệm", "giáo trình", "theo sách"], pose: "neutral-attentive" },
  { keys: ["nhưng", "ngược lại", "trái lại", "tuy nhiên", "đổi lại"], pose: "curious-tilt" },
  { keys: ["vì sao", "tại sao", "thật ra", "thực ra", "hoá ra", "hóa ra"], pose: "think" },
  { keys: ["tóm lại", "cuối cùng", "kết quả là"], pose: "neutral" },
  { keys: ["hẹn gặp lại", "cảm ơn", "chúc bạn", "chào bạn"], pose: "heart" },
];

const MIN_DWELL_MS = 3000; // một tư thế phải đứng ít nhất chừng này
const EDGE_MS = 2000; // không đổi tư thế ngay đầu hoặc sát cuối scene
const MAX_POSES = 3;

/**
 * Bản lật của cùng một tư thế. Dùng cho scene lẻ, để hai scene liền nhau cùng ý không ra
 * y hệt một khung hình. Đây **không phải đổi nghĩa** — vẫn là chỉ tay, vẫn là cầm sách,
 * chỉ đổi bên — nên nó không rơi vào chuyện bốc dáng ngẫu nhiên.
 */
const MIRROR: Partial<Record<CharacterPose, CharacterPose>> = {
  point: "point-left",
  think: "think-left",
  touch: "touch-left",
  wave: "wave-left",
  peace: "peace-left",
  heart: "heart-left",
  ok: "ok-right",
};

/**
 * Tư thế bổ trợ cho tư thế nền. Dùng khi scene dài mà lời thoại không có từ chuyển ý nào —
 * lúc đó vẫn đổi một lần ở **ranh giới câu** gần giữa scene, vì đứng yên một dáng suốt
 * 40 giây thì nhân vật trông như ảnh dán. Cặp nào cũng là một bước chuyển có nghĩa
 * (đang kể → đang giảng, đang chỉ → đang đọc sách), không phải bốc ngẫu nhiên.
 */
const COMPLEMENT: Partial<Record<CharacterPose, CharacterPose>> = {
  // Mỗi cặp là **một bước tiến của cùng một mạch cảm xúc**, không phải đổi qua lại cho khác đi:
  // đang nghĩ thì rối thêm, đang rối thì vỡ ra, đang kể thì chuyển sang giảng rồi nhấn mạnh.
  think: "think-doubt", // nghĩ → càng rối
  "think-left": "think-doubt",
  "think-doubt": "curious", // rối → vỡ lẽ
  curious: "curious-surprised", // tò mò → à hoá ra
  "curious-tilt": "curious",
  "curious-surprised": "peace-playful", // ngạc nhiên → khoái
  neutral: "point-explain", // kể → giảng
  "point-explain": "point", // giảng → nhấn mạnh
  point: "neutral-attentive", // chỉ → mở sách ra
  "neutral-attentive": "point-explain",
  ok: "curious", // xem ví dụ → thích thú
  touch: "point-explain",
  shocked: "think-doubt", // choáng → ngồi gỡ
  "peace-playful": "neutral",
  wave: "neutral",
  "wave-cheer": "heart",
  heart: "peace-left",
};

/**
 * Tag cảm xúc trong `narration` là mốc tốt nhất để đổi tư thế: nó do người viết script đặt
 * đúng chỗ có cảm xúc, chứ không phải máy đoán từ từ khoá. `<short pause>` không phải cảm
 * xúc mà là một nhịp ngắt ý, nên nó chuyển sang tư thế **bổ trợ** của tư thế đang dùng.
 */
const TAG_POSE: Record<string, CharacterPose | "complement"> = {
  // vui
  laugh: "peace-playful",
  laughter: "peace-playful",
  chuckle: "peace-playful",
  chuckles: "peace-playful",
  giggle: "peace-playful",
  snicker: "peace-playful",
  cackle: "peace-playful",
  cheer: "peace",
  // ngán, bực, cam chịu
  sigh: "think-doubt",
  sighs: "think-doubt",
  groan: "think-doubt",
  tsk: "think-doubt",
  pff: "think-doubt",
  phew: "think-doubt",
  yawn: "neutral-shy",
  // bất ngờ
  gasp: "curious-surprised",
  shriek: "curious-surprised",
  // lấy hơi trước một ý nặng
  breath: "think",
  "heavy breath": "think",
  exhales: "think",
  // vào việc nghiêm túc
  "throat-clearing": "point",
  // nói nhỏ như kể bí mật
  whispers: "curious-tilt",
  whispering: "curious-tilt",
  // nhịp ngắt ý, không phải cảm xúc
  "short pause": "complement",
  "long pause": "complement",
};

/**
 * Lịch tư thế của một scene: tư thế nền ở mốc 0, rồi tối đa hai lần đổi nữa, **neo vào
 * đúng lúc giọng nói tới từ khoá** chứ không theo tiến độ frame.
 *
 * Đây là chỗ cân bằng: một tư thế suốt scene dài 40 giây thì đơ, nhưng đổi theo nhịp frame
 * thì thành giật và vô nghĩa. Neo vào từ khoá nghĩa là nhân vật đổi dáng đúng lúc nội dung
 * đổi hướng — người xem đọc ra đó là phản ứng, không phải hiệu ứng.
 *
 * Không có `words` (chưa chạy align) thì trả về đúng một tư thế, không đoán mò.
 */
export const resolvePoseTimeline = (opts: {
  pose?: CharacterPose;
  poses?: { after: string; pose: CharacterPose }[];
  sceneType?: Scene["type"];
  narration?: string;
  words?: { text: string; startMs: number }[];
  sceneDurationMs?: number;
  sceneIndex?: number;
}): { atMs: number; pose: CharacterPose }[] => {
  // Scene lẻ dùng bản lật, để hai scene liền nhau cùng ý không ra y hệt một khung hình.
  const mirror = (tl: { atMs: number; pose: CharacterPose }[]) =>
    (opts.sceneIndex ?? 0) % 2 === 0
      ? tl
      : tl.map((x) => ({ atMs: x.atMs, pose: MIRROR[x.pose] ?? x.pose }));
  const base = resolveCharacterPose(opts);
  const timeline = [{ atMs: 0, pose: base }];
  const words = opts.words;
  const total = opts.sceneDurationMs ?? 0;

  if (!words || words.length === 0) return timeline;

  // Ghép lời thoại lại thành một chuỗi, nhớ mốc thời gian của từng ký tự, để tìm được
  // cụm từ khoá nhiều chữ ("nói cách khác") chứ không chỉ từ đơn.
  let joined = "";
  const charStart: number[] = [];
  for (const w of words) {
    const piece = `${w.text.toLowerCase()} `;
    for (let i = 0; i < piece.length; i++) charStart.push(w.startMs);
    joined += piece;
  }

  const timeOf = (phrase: string) => {
    const at = joined.indexOf(phrase.toLowerCase());
    return at < 0 ? -1 : (charStart[at] ?? 0);
  };

  // Khai báo tay trong scene thắng mọi suy đoán: `"poses": [{ "after": "ví dụ", "pose": "ok" }]`
  if (opts.poses?.length) {
    for (const item of opts.poses) {
      const ms = timeOf(item.after);
      if (ms < 0) continue;
      timeline.push({ atMs: ms, pose: item.pose });
    }
    timeline.sort((a, b) => a.atMs - b.atMs);
    return timeline;
  }

  // Scene chỉ định cứng một tư thế, hoặc quá ngắn để đổi, thì giữ nguyên.
  if (opts.pose || total < MIN_DWELL_MS * 2 + EDGE_MS * 2) return timeline;

  // Mốc từ tag cảm xúc. `words` đã bị lọc hết tag, nên định vị bằng cách đếm số token
  // đứng trước tag trong narration — đã kiểm: số token sau khi bỏ tag khớp đúng số từ.
  const found: { atMs: number; pose: CharacterPose | "complement" }[] = [];
  const raw = opts.narration ?? "";
  for (const mt of raw.matchAll(/<([a-z -]{1,20})>/g)) {
    const pose = TAG_POSE[mt[1].trim()];
    if (!pose) continue;
    const before = raw
      .slice(0, mt.index)
      .replace(/<[^>]{1,24}>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const ms = words[before]?.startMs;
    if (ms == null || ms < EDGE_MS || ms > total - EDGE_MS) continue;
    found.push({ atMs: ms, pose });
  }

  for (const beat of BEATS) {
    for (const key of beat.keys) {
      const ms = timeOf(key);
      if (ms < 0 || ms < EDGE_MS || ms > total - EDGE_MS) continue;
      found.push({ atMs: ms, pose: beat.pose });
      break;
    }
  }

  found.sort((a, b) => a.atMs - b.atMs);
  const push = (cand: { atMs: number; pose: CharacterPose | "complement" }) => {
    if (timeline.length >= MAX_POSES) return;
    const prev = timeline[timeline.length - 1];
    const next = cand.pose === "complement" ? COMPLEMENT[prev.pose] : cand.pose;
    if (!next) return;
    if (cand.atMs - prev.atMs < MIN_DWELL_MS) return;
    if (next === prev.pose) return;
    if (total - cand.atMs < MIN_DWELL_MS) return;
    timeline.push({ atMs: cand.atMs, pose: next });
  };
  for (const cand of found) push(cand);

  // Scene dài mà không bắt được mốc nào ở trên: vẫn đổi một lần, nhưng **chỉ khi câu tiếp
  // theo thật sự đổi màu nội dung**. Bản trước đổi ở một ranh giới câu bất kỳ gần giữa
  // scene — nó chống được cảnh đứng yên 40 giây, nhưng tư thế rơi vào chỗ chẳng ăn nhập
  // gì với điều đang nói. 62 trên 87 lần đổi của cả loạt đến từ tầng đó, nên lệch là thấy rõ.
  if (timeline.length === 1 && total >= 14000) {
    for (let i = 0; i < words.length - 1; i++) {
      if (!/[.!?…]$/.test(words[i].text)) continue;
      const at = words[i + 1].startMs;
      if (at < total * 0.3 || at > total - MIN_DWELL_MS) continue;
      // Đọc câu ngay sau mốc này, xem nó mang màu gì.
      const rest = words
        .slice(i + 1)
        .map((w) => w.text.toLowerCase())
        .join(" ");
      const head = rest.split(/(?<=[.!?…])\s/)[0] ?? rest;
      const beat = BEATS.find((b) => b.keys.some((k) => head.includes(k)));
      if (!beat) continue;
      push({ atMs: at, pose: beat.pose });
      if (timeline.length > 1) break;
    }
  }

  return mirror(timeline);
};
