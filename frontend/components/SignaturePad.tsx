"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
};

const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = cv.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  useImperativeHandle(ref, () => ({
    clear() {
      const c = cv.current!;
      c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
      setEmpty(true);
    },
    isEmpty: () => empty,
    toDataURL: () => cv.current!.toDataURL("image/png"),
  }));

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = cv.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    cv.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    const ctx = cv.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    setEmpty(false);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = point(e);
    const ctx = cv.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  return (
    <canvas
      ref={cv}
      className="sig"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (drawing.current = false)}
      onPointerCancel={() => (drawing.current = false)}
      aria-label="Area tanda tangan"
    />
  );
});

export default SignaturePad;