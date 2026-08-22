import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

import { cn } from "@/lib/utils";

type QrCodeProps = {
  /** The payload encoded in the QR. Never include sensitive data. */
  value: string;
  size?: number;
  className?: string;
  label?: string;
};

/**
 * Renders a QR code on a canvas. QR codes are technical elements and are
 * therefore never mirrored in RTL layouts.
 */
export function QrCode({ value, size = 220, className, label }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#12281f", light: "#ffffff" },
    }).catch(() => setFailed(true));
  }, [value, size]);

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)} dir="ltr">
      <div className="rounded-2xl bg-white p-3 shadow-card">
        <canvas ref={canvasRef} width={size} height={size} aria-label={label ?? "QR code"} />
      </div>
      {failed ? <p className="text-xs text-destructive">{value}</p> : null}
    </div>
  );
}
