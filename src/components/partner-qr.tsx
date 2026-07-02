"use client";

import { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

export function PartnerQR({
  partnerId,
  partnerName,
  variant = "compact",
}: {
  partnerId: string;
  partnerName: string;
  variant?: "compact" | "card";
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/menu/${partnerId}`;

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const padding = 40;
    const labelHeight = 60;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + padding * 2;
    finalCanvas.height = canvas.height + padding * 2 + labelHeight;
    const ctx = finalCanvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(partnerName, finalCanvas.width / 2, canvas.height + padding + 30);

    ctx.fillStyle = "#f97316";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Scan to order food", finalCanvas.width / 2, canvas.height + padding + 55);

    const link = document.createElement("a");
    link.download = `QR-${partnerName.replace(/\s+/g, "-")}.png`;
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
    toast.success("QR downloaded");
  }

  function copyLink() {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const hiddenCanvas = (
    <div ref={qrRef} className="hidden">
      <QRCodeCanvas value={menuUrl} size={300} />
    </div>
  );

  const actions = (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={downloadQR}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-80 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download
      </button>
      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/60 text-foreground text-[13px] font-semibold hover:bg-accent transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );

  if (variant === "card") {
    return (
      <div className="rounded-3xl bg-white shadow-soft p-6">
        <h3 className="text-base font-bold tracking-tight">QR Code</h3>
        <p className="text-[12px] text-foreground/35 mt-0.5">Guests scan this to view the menu &amp; order</p>
        <div className="mt-5 bg-white p-4 rounded-2xl border border-black/6 flex items-center justify-center">
          <QRCodeSVG value={menuUrl} size={200} />
        </div>
        <p className="text-[11px] text-foreground/40 break-all my-4 text-center">{menuUrl}</p>
        {actions}
        {hiddenCanvas}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="View QR code"
        className="shrink-0 bg-white p-1.5 rounded-sm hover:scale-105 active:scale-95 transition-transform shadow-soft"
      >
        <QRCodeSVG value={menuUrl} size={52} />
      </button>

      {hiddenCanvas}

      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/3 text-foreground/30 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-[16px] tracking-tight px-6">{partnerName}</h3>
            <p className="text-[12px] text-foreground/35 mt-0.5">Scan to view menu &amp; order</p>

            <div className="bg-white p-5 rounded-2xl border border-black/6 inline-block my-5">
              <QRCodeSVG value={menuUrl} size={200} />
            </div>

            <p className="text-[11px] text-foreground/40 break-all mb-5 px-2">{menuUrl}</p>

            {actions}
          </div>
        </div>
      )}
    </>
  );
}
