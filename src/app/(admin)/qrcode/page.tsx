"use client";

import { useEffect, useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function QRCodePage() {
  const [events, setEvents] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => {
      if (d.success && d.data.length) {
        setEvents(d.data);
        setSelectedSlug(d.data[0].slug);
      }
    });
  }, []);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const url = selectedSlug ? `${baseUrl}/event/${selectedSlug}/login` : "";

  useEffect(() => {
    if (!url) return;
    // Generate QR as simple SVG via canvas pattern
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }).catch(() => setQrDataUrl(""));
  }, [url]);

  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6">QR Code</h1>

      <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto text-center">
        <div className="mb-4">
          <select className="px-3 py-2 rounded-xl border border-border bg-background text-sm" value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)}>
            {events.map((ev) => <option key={ev.slug} value={ev.slug}>{ev.name}</option>)}
          </select>
        </div>

        <p className="text-sm text-muted-foreground mb-5">Students scan this code to join the challenge.</p>

        <div className="inline-block p-4 bg-white rounded-2xl mb-5">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" width={240} height={240} />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center">
              <QrCode className="w-16 h-16 text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-brand-500/5 text-xs font-mono text-muted-foreground break-all mb-4">
          {url || "Select an event"}
        </div>

        <div className="flex gap-2 justify-center">
          <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          {qrDataUrl && (
            <a href={qrDataUrl} download={`qr-${selectedSlug}.png`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
              Download PNG
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
