import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Sơ đồ vẽ lại bằng code thay cho ảnh chụp slide: từng phần hiện ra theo thứ tự
 * người giảng nhắc tới, nên người xem nhìn đúng chỗ đang nghe.
 *
 * Mỗi sơ đồ nhận `progressFrames` = số frame dành cho phần dựng hình (thường 70%
 * thời lượng scene), rồi tự chia đều cho các bước của mình.
 */

type DiagramProps = { durationInFrames: number; vertical?: boolean; cues?: number[] };

/** Chỉ ô sơ đồ mới nổi lên khỏi giấy; mũi tên và nhãn nằm phẳng trên trang. */
const NODE_SHADOW = "drop-shadow(0 8px 14px rgba(43, 37, 32, 0.14))";

/**
 * Từng bước sơ đồ bám theo mốc lời nói khi script có khai báo `cues`;
 * không có thì chia đều như cũ.
 */
const useSteps = (count: number, durationInFrames: number, cues?: number[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const build = durationInFrames * 0.62;
  const step = build / Math.max(count, 1);
  return (i: number) => {
    const at = cues && cues[i] != null ? ((cues[i] - 220) / 1000) * fps : i * step;
    return spring({
      frame: frame - Math.max(0, at),
      fps,
      config: { damping: 200 },
      durationInFrames: 16,
    });
  };
};

const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  t: number;
  tone?: "ink" | "accent" | "ask";
}> = ({ x, y, w, h, title, sub, t, tone = "ink" }) => {
  const color = tone === "accent" ? theme.accent : tone === "ask" ? theme.ask : theme.ink;
  // Ô sơ đồ dùng chính giấy của trang, không phải thẻ trắng dán lên
  const fill = tone === "accent" ? "#FBEFE9" : tone === "ask" ? theme.askPaper : theme.paper;
  return (
    <g
      opacity={t}
      transform={`translate(${x} ${y}) scale(${interpolate(t, [0, 1], [0.94, 1])})`}
      style={{ filter: NODE_SHADOW }}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={14}
        fill={fill}
        stroke={color}
        strokeWidth={2.5}
      />
      <text
        x={0}
        y={sub ? -6 : 8}
        textAnchor="middle"
        fontFamily={theme.fontFamily}
        fontSize={25}
        fontWeight={700}
        fill={color}
      >
        {title}
      </text>
      {sub ? (
        <text
          x={0}
          y={26}
          textAnchor="middle"
          fontFamily={theme.fontFamily}
          fontSize={20}
          fill={theme.inkSoft}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
};

const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  label?: string;
  t: number;
  both?: boolean;
  tone?: "ink" | "accent";
  labelOffset?: [number, number];
}> = ({ from, to, label, t, both, tone = "ink", labelOffset = [0, -14] }) => {
  const color = tone === "accent" ? theme.accent : theme.ink;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const mid = [(from[0] + to[0]) / 2 + labelOffset[0], (from[1] + to[1]) / 2 + labelOffset[1]];
  const id = `h-${tone}`;
  const idRev = `h-${tone}-rev`;
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill={color} />
        </marker>
        <marker
          id={idRev}
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L9,4.5 L0,9 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        stroke={color}
        strokeWidth={2.5}
        markerEnd={t > 0.75 ? `url(#${id})` : undefined}
        markerStart={both && t > 0.75 ? `url(#${idRev})` : undefined}
        strokeDasharray={len}
        strokeDashoffset={interpolate(t, [0, 1], [len, 0])}
      />
      {label ? (
        <text
          x={mid[0]}
          y={mid[1]}
          textAnchor="middle"
          fontFamily={theme.fontFamily}
          fontSize={24}
          fontWeight={600}
          fill={color}
          opacity={interpolate(t, [0.55, 1], [0, 1], { extrapolateLeft: "clamp" })}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** Slide 13 — ba vai và ba động tác của SOA. */
const SoaTriangle: React.FC<DiagramProps> = ({ durationInFrames, vertical, cues }) => {
  const s = useSteps(6, durationInFrames, cues);
  if (vertical) {
    return (
      <svg viewBox="0 0 900 900" style={{ width: "100%", height: "100%", display: "block" }}>
        <Node x={450} y={80} w={360} h={100} title="Service registry" sub="nơi tra cứu" t={s(0)} />
        <Node x={220} y={620} w={360} h={100} title="Service requestor" sub="bên cần dùng" t={s(1)} />
        <Node
          x={680}
          y={400}
          w={360}
          h={100}
          title="Service provider"
          sub="bên cung cấp"
          t={s(2)}
          tone="accent"
        />
        <Arrow from={[680, 348]} to={[530, 140]} label="Publish" t={s(3)} tone="accent" labelOffset={[84, 10]} />
        <Arrow from={[260, 568]} to={[380, 140]} label="Find" t={s(4)} labelOffset={[-60, 0]} />
        <Arrow from={[300, 568]} to={[600, 456]} label="Bind" t={s(5)} both labelOffset={[10, -34]} />
        <text
          x={450}
          y={790}
          textAnchor="middle"
          fontFamily={theme.fontFamily}
          fontSize={26}
          fill={theme.inkSoft}
        >
          bind dùng SOAP · mô tả service viết bằng WSDL
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1200 660" style={{ width: "100%", height: "100%", display: "block" }}>
      <Node x={600} y={90} w={330} h={92} title="Service registry" sub="nơi tra cứu" t={s(0)} />
      <Node x={190} y={520} w={330} h={92} title="Service requestor" sub="bên cần dùng" t={s(1)} />
      <Node
        x={1010}
        y={520}
        w={330}
        h={92}
        title="Service provider"
        sub="bên cung cấp"
        t={s(2)}
        tone="accent"
      />
      <Arrow from={[880, 490]} to={[690, 150]} label="Publish" t={s(3)} tone="accent" labelOffset={[70, 0]} />
      <Arrow from={[290, 480]} to={[470, 140]} label="Find" t={s(4)} labelOffset={[-62, 0]} />
      <Arrow from={[365, 520]} to={[835, 520]} label="Bind" t={s(5)} both labelOffset={[0, -20]} />
      <text
        x={600}
        y={620}
        textAnchor="middle"
        fontFamily={theme.fontFamily}
        fontSize={22}
        fill={theme.inkSoft}
      >
        bind dùng SOAP · mô tả service viết bằng WSDL
      </text>
    </svg>
  );
};

/** Slide 8 — hệ thống thông tin trên xe hơi, vẽ gọn lại quanh Mobile Info Service. */
const InCarSystem: React.FC<DiagramProps> = ({ durationInFrames, vertical, cues }) => {
  const s = useSteps(7, durationInFrames, cues);
  if (vertical) {
    return (
      <svg viewBox="0 0 900 1180" style={{ width: "100%", height: "100%", display: "block" }}>
        <Node x={155} y={90} w={280} h={86} title="Weather info" t={s(5)} />
        <Node x={450} y={90} w={280} h={86} title="Road traffic" t={s(5)} />
        <Node x={745} y={90} w={280} h={86} title="Facilities info" t={s(5)} />
        <Arrow from={[380, 414]} to={[180, 142]} t={s(5)} />
        <Arrow from={[450, 414]} to={[450, 142]} t={s(5)} />
        <Arrow from={[520, 414]} to={[720, 142]} t={s(5)} />

        <Node
          x={450}
          y={470}
          w={420}
          h={104}
          title="Mobile Info Service"
          sub="gom thông tin"
          t={s(4)}
          tone="accent"
        />
        <Node x={450} y={640} w={300} h={80} title="Translator" t={s(6)} tone="ask" />
        <Arrow from={[450, 524]} to={[450, 598]} t={s(6)} />
        <Arrow from={[620, 820]} to={[560, 540]} label="gps coord" t={s(4)} labelOffset={[108, 0]} />

        <g opacity={s(0)} style={{ filter: NODE_SHADOW }}>
          <rect
            x={70}
            y={780}
            width={760}
            height={340}
            rx={20}
            fill={theme.paperDeep}
            stroke={theme.rule}
            strokeWidth={2}
          />
          <text
            x={810}
            y={1098}
            textAnchor="end"
            fontFamily={theme.fontFamily}
            fontSize={24}
            fill={theme.inkSoft}
          >
            In-car software system
          </text>
        </g>
        <Node x={270} y={850} w={330} h={86} title="Receiver" sub="nhận luồng tin" t={s(1)} />
        <Node x={620} y={850} w={330} h={86} title="Transmitter" sub="gửi vị trí đi" t={s(2)} />
        <Node x={450} y={980} w={330} h={86} title="Locator" sub="GPS" t={s(3)} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1280 720" style={{ width: "100%", height: "100%", display: "block" }}>
      <g opacity={s(0)} style={{ filter: NODE_SHADOW }}>
        <rect
          x={120}
          y={470}
          width={1040}
          height={210}
          rx={18}
          fill={theme.paperDeep}
          stroke={theme.rule}
          strokeWidth={2}
        />
        <text
          x={1140}
          y={662}
          textAnchor="end"
          fontFamily={theme.fontFamily}
          fontSize={21}
          fill={theme.inkSoft}
        >
          In-car software system
        </text>
      </g>
      <Node x={280} y={545} w={270} h={86} title="Receiver" sub="nhận luồng tin" t={s(1)} />
      <Node x={640} y={545} w={270} h={86} title="Transmitter" sub="gửi vị trí đi" t={s(2)} />
      <Node x={1000} y={545} w={270} h={86} title="Locator" sub="GPS" t={s(3)} />

      <Node
        x={640}
        y={300}
        w={360}
        h={100}
        title="Mobile Info Service"
        sub="gom thông tin"
        t={s(4)}
        tone="accent"
      />
      <Arrow from={[640, 502]} to={[640, 352]} label="gps coord" t={s(4)} labelOffset={[108, 10]} />

      <Node x={220} y={120} w={280} h={86} title="Weather info" t={s(5)} />
      <Node x={640} y={120} w={280} h={86} title="Road traffic info" t={s(5)} />
      <Node x={1060} y={120} w={280} h={86} title="Facilities info" t={s(5)} />
      <Arrow from={[540, 262]} to={[300, 166]} t={s(5)} />
      <Arrow from={[640, 250]} to={[640, 166]} t={s(5)} />
      <Arrow from={[740, 262]} to={[980, 166]} t={s(5)} />

      <Node x={1080} y={340} w={240} h={78} title="Translator" t={s(6)} tone="ask" />
      <Arrow from={[822, 318]} to={[958, 334]} t={s(6)} />
    </svg>
  );
};

/** Slide 27–29 — resource và bốn thao tác REST. */
const RestVerbs: React.FC<DiagramProps> = ({ durationInFrames, cues }) => {
  const s = useSteps(5, durationInFrames, cues);
  const rows: [string, string, string][] = [
    ["POST", "Create", "tạo resource mới"],
    ["GET", "Read", "đọc, trả về một representation"],
    ["PUT", "Update", "thay giá trị của resource"],
    ["DELETE", "Delete", "làm resource không còn truy cập được"],
  ];
  return (
    <svg viewBox="0 0 1200 620" style={{ width: "100%", height: "100%", display: "block" }}>
      <Node x={600} y={70} w={520} h={92} title="Resource" sub="một URL, nhiều representation" t={s(0)} tone="accent" />
      {rows.map(([verb, crud, note], i) => {
        const t = s(i + 1);
        const y = 190 + i * 102;
        return (
          <g key={verb} opacity={t} transform={`translate(${interpolate(t, [0, 1], [-24, 0])} 0)`}>
            <rect x={120} y={y} width={190} height={66} rx={12} fill={theme.accent} />
            <text
              x={215}
              y={y + 43}
              textAnchor="middle"
              fontFamily={theme.fontFamily}
              fontSize={28}
              fontWeight={800}
              fill={theme.paper}
            >
              {verb}
            </text>
            <text x={350} y={y + 30} fontFamily={theme.fontFamily} fontSize={27} fontWeight={700} fill={theme.ink}>
              {crud}
            </text>
            <text x={350} y={y + 58} fontFamily={theme.fontFamily} fontSize={22} fill={theme.inkSoft}>
              {note}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const diagrams: Record<string, React.FC<DiagramProps>> = {
  "soa-triangle": SoaTriangle,
  "in-car-system": InCarSystem,
  "rest-verbs": RestVerbs,
};
