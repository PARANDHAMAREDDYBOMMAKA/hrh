"use client";

import { useQuery } from "@tanstack/react-query";
import { X, Download, Loader2 } from "lucide-react";

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

interface InvoiceOrder {
  id: string;
  orderNumber: string;
  roomNumber: string;
  deliverySlot: string;
  status: string;
  totalAmount: number;
  deliveryNotes: string | null;
  items: InvoiceItem[];
  createdAt: string;
  partner: { name: string; address?: string; phone?: string };
  customer: { name: string; email?: string; phone?: string };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lineSubtotal(item: InvoiceItem) {
  return item.subtotal ?? item.price * item.quantity;
}

function buildInvoiceHtml(order: InvoiceOrder) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">₹${item.price}</td>
          <td class="num">₹${lineSubtotal(item).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${order.orderNumber}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
  .wrap { max-width: 640px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .brand span { color: #f97316; }
  .doc { text-align: right; }
  .doc h1 { font-size: 18px; margin: 0; letter-spacing: 0.08em; color: #555; }
  .doc p { margin: 4px 0 0; font-size: 12px; color: #888; }
  .meta { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; font-size: 13px; }
  .meta h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin: 0 0 6px; }
  .meta p { margin: 2px 0; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  th { text-align: left; border-bottom: 1px solid #ddd; padding: 8px 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; }
  td { padding: 10px 4px; border-bottom: 1px solid #f0f0f0; }
  .num { text-align: right; }
  .total { display: flex; justify-content: flex-end; margin-top: 16px; }
  .total .box { width: 220px; }
  .total .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .total .grand { border-top: 2px solid #111; margin-top: 6px; padding-top: 10px; font-weight: 800; font-size: 16px; }
  .foot { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <div class="brand">HR<span>H</span></div>
        <p style="font-size:12px;color:#888;margin:4px 0 0;">${order.partner.name}${order.partner.address ? " · " + order.partner.address : ""}</p>
      </div>
      <div class="doc">
        <h1>INVOICE</h1>
        <p>#${order.orderNumber}</p>
        <p>${formatDate(order.createdAt)}</p>
      </div>
    </div>
    <div class="meta">
      <div>
        <h3>Billed To</h3>
        <p>${order.customer.name}</p>
        ${order.customer.phone ? `<p>${order.customer.phone}</p>` : ""}
        ${order.customer.email ? `<p>${order.customer.email}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <h3>Delivery</h3>
        <p>Room ${order.roomNumber}</p>
        <p>${order.deliverySlot}</p>
        <p>Status: ${order.status}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total">
      <div class="box">
        <div class="row"><span>Subtotal</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
        <div class="row grand"><span>Total</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
      </div>
    </div>
    ${order.deliveryNotes ? `<p style="font-size:12px;color:#777;margin-top:24px;"><strong>Notes:</strong> ${order.deliveryNotes}</p>` : ""}
    <div class="foot">Thank you for your order · HRH</div>
  </div>
</body>
</html>`;
}

export function InvoiceModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading } = useQuery<InvoiceOrder>({
    queryKey: ["invoice", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`).then((r) => r.json()),
  });

  const handleDownload = () => {
    if (!order) return;
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;
    win.document.write(buildInvoiceHtml(order));
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
    };
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-black/4 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-bold text-[15px] tracking-tight">Invoice</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/3 text-foreground/30 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading || !order ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-extrabold tracking-tight">HR<span className="text-orange-500">H</span></div>
                <p className="text-[12px] text-foreground/35 mt-0.5">{order.partner.name}</p>
                {order.partner.address && <p className="text-[11px] text-foreground/25">{order.partner.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-foreground/40 font-semibold">Invoice</p>
                <p className="font-mono text-[12px] text-foreground/50 mt-0.5">#{order.orderNumber?.slice(-8)}</p>
                <p className="text-[11px] text-foreground/30 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-5 text-[12px]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Billed To</p>
                <p className="text-foreground/70">{order.customer.name}</p>
                {order.customer.phone && <p className="text-foreground/40">{order.customer.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Delivery</p>
                <p className="text-foreground/70">Room {order.roomNumber}</p>
                <p className="text-foreground/40">{order.deliverySlot}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-black/6">
              <div className="flex text-[10px] uppercase tracking-wider text-foreground/40 font-semibold py-2 border-b border-black/4">
                <span className="flex-1">Item</span>
                <span className="w-10 text-right">Qty</span>
                <span className="w-20 text-right">Amount</span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex text-[13px] py-2.5 border-b border-black/3">
                  <span className="flex-1 text-foreground/70">{item.name}</span>
                  <span className="w-10 text-right text-foreground/40">{item.quantity}</span>
                  <span className="w-20 text-right font-medium">₹{lineSubtotal(item).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-48">
                <div className="flex justify-between text-[15px] font-extrabold border-t-2 border-foreground pt-2.5">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.deliveryNotes && (
              <p className="text-[12px] text-foreground/40 mt-4"><span className="font-semibold text-foreground/55">Notes:</span> {order.deliveryNotes}</p>
            )}

            <button
              onClick={handleDownload}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground text-background font-semibold text-[14px] hover:opacity-80 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
