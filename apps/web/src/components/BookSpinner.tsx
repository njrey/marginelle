import { useEffect, useRef } from "react";

const COVER = "linear-gradient(to right, oklch(0.40 0.08 45), oklch(0.45 0.08 45))";
const COVER_FRONT = "linear-gradient(to left, oklch(0.45 0.08 45), oklch(0.50 0.08 45))";
const SPINE_BG =
  "linear-gradient(to right, oklch(0.32 0.08 45), oklch(0.42 0.08 45) 50%, oklch(0.32 0.08 45))";
const PAGE_WHITE = "oklch(0.98 0.005 70)";
const PAGE_BACK = "oklch(0.96 0.005 70)";
const RULE_COLOR = "oklch(0.85 0.01 240)";

// Highlight marks: [lineIndex, leftOffset, rightOffset]
// Each tuple marks one ruled line on a page face
type HighlightMark = [line: number, left: number, right: number];
const HIGHLIGHTS: { color: string; marks: HighlightMark[] }[] = [
  {
    color: "rgba(255, 235,  59, 0.45)",
    marks: [
      [1, 8, 18],
      [2, 8, 24],
      [4, 8, 20],
    ],
  }, // yellow
  {
    color: "rgba(255,  64, 129, 0.30)",
    marks: [
      [0, 8, 22],
      [3, 8, 16],
    ],
  }, // magenta
  {
    color: "rgba(  0, 229, 255, 0.35)",
    marks: [
      [2, 8, 26],
      [4, 8, 14],
      [5, 8, 20],
    ],
  }, // cyan
];

const PAGE_FLIP_MS = 1000;
const STAGGER_MS = 350;
const NUM_PAGES = 3;
const NUM_RULES = 6;

export function BookSpinner() {
  // Each ref points to the *inner* rotating div, not the outer translateZ wrapper
  const pageRef0 = useRef<HTMLDivElement>(null);
  const pageRef1 = useRef<HTMLDivElement>(null);
  const pageRef2 = useRef<HTMLDivElement>(null);
  const pageRefs = [pageRef0, pageRef1, pageRef2];

  useEffect(() => {
    let cancelled = false;
    const totalCycle = NUM_PAGES * (PAGE_FLIP_MS + STAGGER_MS);

    function flipPage(ref: React.RefObject<HTMLDivElement | null>, delay: number) {
      setTimeout(() => {
        const el = ref.current;
        if (!el || cancelled) return;
        el.style.transition = `transform ${PAGE_FLIP_MS}ms cubic-bezier(0.4,0,0.2,1)`;
        el.style.transform = "rotateY(-175deg)";

        // Snap back instantly once the flip is done — hidden behind the static stack at 0deg
        setTimeout(
          () => {
            const el = ref.current;
            if (!el || cancelled) return;
            el.style.transition = "none";
            el.style.transform = "rotateY(0deg)";
          },
          delay + PAGE_FLIP_MS + 50,
        );
      }, delay);
    }

    function runCycle() {
      pageRefs.forEach((ref, i) => flipPage(ref, i * (PAGE_FLIP_MS + STAGGER_MS)));
    }

    runCycle();
    const interval = setInterval(() => {
      if (!cancelled) runCycle();
    }, totalCycle);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const W = 96;
  const H = 112;
  const rules = Array.from({ length: NUM_RULES });

  function PageFace({ back = false, highlightIndex }: { back?: boolean; highlightIndex?: number }) {
    const hl = highlightIndex !== undefined ? HIGHLIGHTS[highlightIndex] : null;
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: back ? PAGE_BACK : PAGE_WHITE,
          border: "1px solid oklch(0.88 0.01 70)",
          backfaceVisibility: "hidden",
          overflow: "hidden",
          transform: back ? "rotateY(180deg)" : undefined,
        }}
      >
        {!back &&
          hl?.marks.map(([line, left, right], m) => (
            <div
              key={`hl-${m}`}
              style={{
                position: "absolute",
                left,
                right,
                top: 12 + line * 14,
                height: 7,
                background: hl.color,
                borderRadius: 1,
              }}
            />
          ))}
        {!back &&
          rules.map((_, l) => (
            <div
              key={l}
              style={{
                position: "absolute",
                left: 8,
                right: 8,
                top: 16 + l * 14,
                height: 1,
                background: RULE_COLOR,
                opacity: 0.5,
              }}
            />
          ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: W, height: H, perspective: 700, position: "relative" }}>
        <div style={{ width: W, height: H, position: "relative", transformStyle: "preserve-3d" }}>
          {/* Back cover — brown, leftmost */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: COVER,
              borderRadius: "3px 0 0 3px",
              border: "1.5px solid oklch(0.35 0.06 45)",
              transform: "translateZ(1px)",
            }}
          />

          {/* Already-flipped pages sitting on left side */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transform: "translateZ(4px)",
            }}
          >
            <PageFace highlightIndex={1} />
          </div>

          {/* Static right-side page stack */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transform: "translateZ(6px)",
            }}
          >
            <PageFace highlightIndex={2} />
          </div>

          {/* Flipping pages — outer div holds translateZ, inner div gets rotateY from JS */}
          {pageRefs.map((ref, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                // Outer wrapper: fixed z-depth above the static stack, not animated
                transform: `translateZ(${8 + (NUM_PAGES - i)}px)`,
              }}
            >
              {/* Inner wrapper: only rotateY is animated here */}
              <div
                ref={ref}
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  transform: "rotateY(0deg)",
                }}
              >
                <PageFace highlightIndex={i} />
                <PageFace back />
              </div>
            </div>
          ))}

          {/* Front cover — brown, on top of everything on the right */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: COVER_FRONT,
              borderRadius: "0 3px 3px 0",
              border: "1.5px solid oklch(0.35 0.06 45)",
              transform: `translateZ(${8 + NUM_PAGES + 2}px)`,
            }}
          />

          {/* Spine */}
          <div
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: -9,
              width: 12,
              background: SPINE_BG,
              transform: "rotateY(-70deg) skewY(4deg)",
              transformOrigin: "left center",
              borderRadius: "2px 0 0 2px",
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)",
            }}
          />

          {/* Page-stack edge — bottom */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 5,
              background:
                "repeating-linear-gradient(to right, oklch(0.95 0.01 70) 0px, oklch(0.90 0.015 68) 1px, oklch(0.95 0.01 70) 2px)",
              transform: "rotateX(-90deg)",
              transformOrigin: "bottom center",
            }}
          />
        </div>
      </div>

      <span style={{ fontSize: 14, color: "oklch(0.55 0.01 240)" }}>Loading...</span>
    </div>
  );
}
