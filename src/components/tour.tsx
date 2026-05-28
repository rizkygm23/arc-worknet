"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { markTourDone, TOUR_STEPS, type TourStep } from "@/lib/tour";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const TOOLTIP_W = 280;
const GAP = 14;

function getRect(selector: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function tooltipPosition(rect: Rect, placement: TourStep["placement"]) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top: number;
  let left: number;

  switch (placement) {
    case "bottom":
      top = rect.top + rect.height + GAP;
      left = rect.left;
      break;
    case "left":
      top = rect.top;
      left = rect.left - TOOLTIP_W - GAP;
      break;
    case "top":
      top = rect.top - GAP;
      left = rect.left;
      break;
    case "right":
    default:
      top = rect.top;
      left = rect.left + rect.width + GAP;
      break;
  }

  left = Math.max(GAP, Math.min(left, vw - TOOLTIP_W - GAP));
  top = Math.max(GAP, Math.min(top, vh - 180));
  return { top, left };
}

export function TourOverlay({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  const finish = useCallback(() => {
    markTourDone();
    onClose();
  }, [onClose]);

  // Skip steps whose target isn't on screen (e.g. desktop sidebar on mobile).
  const measure = useCallback(() => {
    const r = getRect(step.selector);
    setRect(r);
  }, [step.selector]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    // If the current step's target is missing, advance past it.
    if (rect === null) {
      if (isLast) {
        finish();
      } else {
        setIndex((i) => i + 1);
      }
    }
  }, [rect, isLast, finish]);

  useEffect(() => {
    function onResize() {
      measure();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLast) finish();
        else setIndex((i) => i + 1);
      }
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [measure, isLast, finish]);

  if (!rect) return null;

  const spotlight = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  const tip = tooltipPosition(rect, step.placement);

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="tour-backdrop" onClick={finish} />
      <div
        className="tour-spotlight"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
        aria-hidden
      />
      <div className="tour-tooltip" style={{ top: tip.top, left: tip.left, width: TOOLTIP_W }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          Step {index + 1} of {TOUR_STEPS.length}
        </p>
        <strong className="tour-tooltip-title">{step.title}</strong>
        <p className="tour-tooltip-body">{step.body}</p>
        <div className="tour-tooltip-foot">
          <button type="button" className="button ghost small" onClick={finish}>
            Skip
          </button>
          <div className="tour-tooltip-nav">
            {index > 0 ? (
              <button
                type="button"
                className="button ghost small"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="button primary small"
              onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
