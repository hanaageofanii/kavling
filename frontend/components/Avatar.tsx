"use client";
import { useState } from "react";

export default function Avatar({
  name,
  src,
  size = 38,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="avatar" style={style} src={src} alt="" onError={() => setFailed(true)} />;
  }
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initial}
    </span>
  );
}