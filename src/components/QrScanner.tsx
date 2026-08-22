import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";

type QrScannerProps = {
  onResult: (value: string) => void;
  busy?: boolean;
};

/**
 * Camera QR scanning with a manual fallback so the merchant flow keeps
 * working on devices without camera access.
 */
export function QrScanner({ onResult, busy }: QrScannerProps) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState(false);

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);

  const start = async () => {
    setCameraError(false);
    setScanning(true);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result) => {
          if (!result) return;
          stop();
          onResult(result.getText().trim());
        },
      );
    } catch {
      setCameraError(true);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        <video
          ref={videoRef}
          className="aspect-4/3 w-full object-cover"
          muted
          playsInline
          aria-label={t("scan.camera_hint")}
        />
        {!scanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/95 p-6 text-center">
            <Camera className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">{t("scan.camera_hint")}</p>
            <Button type="button" onClick={start} disabled={busy}>
              {t("scan.start")}
            </Button>
          </div>
        ) : null}
      </div>

      {scanning ? (
        <Button type="button" variant="outline" onClick={stop} className="w-full">
          <CameraOff className="size-4" aria-hidden />
          {t("scan.stop")}
        </Button>
      ) : null}

      {cameraError ? <p className="text-sm text-destructive">{t("scan.no_camera")}</p> : null}

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = manual.trim();
          if (!value) return;
          setManual("");
          onResult(value);
        }}
      >
        <label className="text-sm text-muted-foreground" htmlFor="manual-qr">
          {t("scan.manual")}
        </label>
        <div className="flex gap-2">
          <Input
            id="manual-qr"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={t("scan.token_placeholder")}
            dir="ltr"
          />
          <Button type="submit" variant="secondary" disabled={busy || manual.trim().length === 0}>
            {t("scan.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
