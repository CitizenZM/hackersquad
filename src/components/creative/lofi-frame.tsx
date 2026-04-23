"use client";

const PALETTES = [
  { bg: "#e0f2fe", fg: "#0369a1", accent: "#38bdf8", ground: "#bae6fd" },
  { bg: "#fef3c7", fg: "#92400e", accent: "#fbbf24", ground: "#fde68a" },
  { bg: "#f0fdf4", fg: "#166534", accent: "#4ade80", ground: "#bbf7d0" },
  { bg: "#fce7f3", fg: "#9d174d", accent: "#f472b6", ground: "#fbcfe8" },
  { bg: "#ede9fe", fg: "#5b21b6", accent: "#a78bfa", ground: "#ddd6fe" },
  { bg: "#e0e7ff", fg: "#3730a3", accent: "#818cf8", ground: "#c7d2fe" },
  { bg: "#fff1f2", fg: "#9f1239", accent: "#fb7185", ground: "#fecdd3" },
];

function detectElements(scene: string, prompt: string) {
  const text = `${scene} ${prompt}`.toLowerCase();
  const elements: string[] = [];
  if (/city|urban|street|building|skyline|downtown/.test(text)) elements.push("city");
  if (/kitchen|home|house|indoor|room|living/.test(text)) elements.push("indoor");
  if (/nature|outdoor|trail|park|tree|forest|sunset|sunrise/.test(text)) elements.push("nature");
  if (/person|woman|man|user|rider|professional|commuter|people/.test(text)) elements.push("person");
  if (/product|device|scooter|segway|bike|vehicle|wheel/.test(text)) elements.push("product");
  if (/phone|screen|laptop|computer|close.?up|detail/.test(text)) elements.push("closeup");
  if (/text|logo|brand|title|cta|overlay|call.to.action/.test(text)) elements.push("text");
  if (/speed|motion|action|dynamic|fast|race/.test(text)) elements.push("action");
  if (/compare|vs|side.by.side|split/.test(text)) elements.push("compare");
  return elements;
}

function drawScene(elements: string[], p: typeof PALETTES[0], frameNum: number) {
  const shapes: string[] = [];

  // Sky/background
  shapes.push(`<rect width="400" height="220" fill="${p.bg}"/>`);

  if (elements.includes("city")) {
    shapes.push(`<rect x="20" y="60" width="40" height="100" rx="2" fill="${p.fg}" opacity="0.15"/>`);
    shapes.push(`<rect x="70" y="40" width="30" height="120" rx="2" fill="${p.fg}" opacity="0.2"/>`);
    shapes.push(`<rect x="110" y="70" width="50" height="90" rx="2" fill="${p.fg}" opacity="0.12"/>`);
    shapes.push(`<rect x="300" y="50" width="35" height="110" rx="2" fill="${p.fg}" opacity="0.18"/>`);
    shapes.push(`<rect x="345" y="65" width="40" height="95" rx="2" fill="${p.fg}" opacity="0.14"/>`);
  }

  if (elements.includes("nature")) {
    shapes.push(`<circle cx="350" cy="40" r="25" fill="${p.accent}" opacity="0.4"/>`);
    shapes.push(`<ellipse cx="60" cy="130" rx="30" ry="40" fill="${p.accent}" opacity="0.3"/>`);
    shapes.push(`<ellipse cx="330" cy="120" rx="25" ry="35" fill="${p.accent}" opacity="0.25"/>`);
  }

  if (elements.includes("indoor")) {
    shapes.push(`<rect x="30" y="30" width="340" height="130" rx="4" fill="${p.fg}" opacity="0.06" stroke="${p.fg}" stroke-opacity="0.1"/>`);
    shapes.push(`<rect x="50" y="50" width="60" height="80" rx="2" fill="${p.accent}" opacity="0.15"/>`);
  }

  // Ground
  shapes.push(`<rect x="0" y="160" width="400" height="60" fill="${p.ground}"/>`);

  if (elements.includes("product")) {
    shapes.push(`<rect x="170" y="120" width="60" height="45" rx="6" fill="${p.fg}" opacity="0.7"/>`);
    shapes.push(`<circle cx="180" cy="165" r="10" fill="${p.fg}" opacity="0.5"/>`);
    shapes.push(`<circle cx="220" cy="165" r="10" fill="${p.fg}" opacity="0.5"/>`);
  }

  if (elements.includes("person")) {
    const px = elements.includes("product") ? 140 : 190;
    shapes.push(`<circle cx="${px}" cy="105" r="12" fill="${p.fg}" opacity="0.6"/>`);
    shapes.push(`<rect x="${px - 10}" y="118" width="20" height="35" rx="4" fill="${p.fg}" opacity="0.5"/>`);
  }

  if (elements.includes("closeup")) {
    shapes.push(`<rect x="100" y="50" width="200" height="120" rx="12" fill="${p.fg}" opacity="0.08" stroke="${p.fg}" stroke-opacity="0.2" stroke-width="2"/>`);
    shapes.push(`<circle cx="200" cy="110" r="30" fill="${p.accent}" opacity="0.3"/>`);
  }

  if (elements.includes("compare")) {
    shapes.push(`<line x1="200" y1="30" x2="200" y2="160" stroke="${p.fg}" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="4"/>`);
    shapes.push(`<text x="100" y="90" text-anchor="middle" font-size="11" fill="${p.fg}" opacity="0.4">A</text>`);
    shapes.push(`<text x="300" y="90" text-anchor="middle" font-size="11" fill="${p.fg}" opacity="0.4">B</text>`);
  }

  if (elements.includes("text")) {
    shapes.push(`<rect x="120" y="175" width="160" height="24" rx="4" fill="${p.accent}" opacity="0.5"/>`);
    shapes.push(`<rect x="140" y="182" width="120" height="8" rx="2" fill="${p.bg}" opacity="0.7"/>`);
  }

  if (elements.includes("action")) {
    shapes.push(`<path d="M280,80 L320,95 L280,110 Z" fill="${p.accent}" opacity="0.4"/>`);
    for (let i = 0; i < 3; i++) {
      shapes.push(`<line x1="${240 + i * 15}" y1="${90 + i * 3}" x2="${260 + i * 15}" y2="${90 + i * 3}" stroke="${p.accent}" stroke-opacity="0.3" stroke-width="2"/>`);
    }
  }

  // Frame number badge
  shapes.push(`<circle cx="380" cy="20" r="14" fill="${p.fg}" opacity="0.7"/>`);
  shapes.push(`<text x="380" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="${p.bg}">${frameNum}</text>`);

  return shapes.join("\n");
}

export function LofiFrame({
  scene,
  imagePrompt,
  frameNumber,
  duration,
}: {
  scene: string;
  imagePrompt: string;
  frameNumber: number;
  duration: string;
}) {
  const palette = PALETTES[frameNumber % PALETTES.length];
  const elements = detectElements(scene, imagePrompt);
  const svgContent = drawScene(elements, palette, frameNumber);

  return (
    <div className="aspect-[16/10] relative overflow-hidden rounded-t-lg">
      <svg
        viewBox="0 0 400 220"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`grain-${frameNumber}`}>
            <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComposite in="SourceGraphic" operator="atop" />
          </filter>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: svgContent }} />
        <rect width="400" height="220" fill="url(#noise)" opacity="0.03" />
      </svg>
      <div className="absolute top-2 left-2 bg-foreground/80 text-background text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {duration}
      </div>
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-[9px] text-foreground/60 bg-background/60 backdrop-blur-sm rounded px-1.5 py-0.5 line-clamp-1">
          {scene}
        </p>
      </div>
    </div>
  );
}
