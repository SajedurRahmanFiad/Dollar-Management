/**
 * Helper to generate authentic SVG-based receipt screenshots for testing
 * and realistic visual proof cards.
 */

export function generateReceiptDataUrl(type: 'usd_sent' | 'bdt_paid', details: {
  amount: number;
  recipient: string;
  sender: string;
  timestamp?: string;
  channel?: string;
  ref?: string;
}): string {
  const dateStr = details.timestamp ? new Date(details.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleString();

  const refNumber = details.ref || Math.random().toString(36).substring(2, 10).toUpperCase();

  if (type === 'usd_sent') {
    const channel = details.channel || 'Binance Pay / Wise USD';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
      <rect width="600" height="750" rx="16" fill="#0F172A"/>
      <circle cx="300" cy="110" r="44" fill="#10B981" fill-opacity="0.15"/>
      <circle cx="300" cy="110" r="32" fill="#10B981"/>
      <path d="M288 110L296 118L312 102" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      
      <text x="300" y="185" fill="#94A3B8" font-family="sans-serif" font-size="14" font-weight="500" text-anchor="middle">TRANSFER SUCCESSFUL</text>
      <text x="300" y="235" fill="#FFFFFF" font-family="sans-serif" font-size="38" font-weight="700" text-anchor="middle">$${details.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</text>
      <text x="300" y="265" fill="#64748B" font-family="sans-serif" font-size="13" text-anchor="middle">${channel}</text>

      <rect x="36" y="300" width="528" height="340" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1"/>

      <!-- Details Rows -->
      <text x="64" y="345" fill="#94A3B8" font-family="sans-serif" font-size="14">Recipient Account</text>
      <text x="536" y="345" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">${details.recipient}</text>
      <line x1="64" y1="365" x2="536" y2="365" stroke="#334155" stroke-dasharray="4 4"/>

      <text x="64" y="405" fill="#94A3B8" font-family="sans-serif" font-size="14">Sender</text>
      <text x="536" y="405" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">${details.sender}</text>
      <line x1="64" y1="425" x2="536" y2="425" stroke="#334155" stroke-dasharray="4 4"/>

      <text x="64" y="465" fill="#94A3B8" font-family="sans-serif" font-size="14">Transfer Network</text>
      <text x="536" y="465" fill="#38BDF8" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">Internal Verified USD</text>
      <line x1="64" y1="485" x2="536" y2="485" stroke="#334155" stroke-dasharray="4 4"/>

      <text x="64" y="525" fill="#94A3B8" font-family="sans-serif" font-size="14">Transaction Ref ID</text>
      <text x="536" y="525" fill="#F8FAFC" font-family="monospace" font-size="13" text-anchor="end">TRX-${refNumber}</text>
      <line x1="64" y1="545" x2="536" y2="545" stroke="#334155" stroke-dasharray="4 4"/>

      <text x="64" y="585" fill="#94A3B8" font-family="sans-serif" font-size="14">Date &amp; Time</text>
      <text x="536" y="585" fill="#F8FAFC" font-family="sans-serif" font-size="13" text-anchor="end">${dateStr}</text>

      <rect x="36" y="660" width="528" height="50" rx="8" fill="#10B981" fill-opacity="0.1" stroke="#10B981" stroke-opacity="0.3"/>
      <text x="300" y="691" fill="#34D399" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">✓ Funds Dispatched to Customer Wallet</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    // BDT Payment Receipt (bKash / Nagad / Bank Transfer style)
    const channel = details.channel || 'bKash / City Bank Transfer';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
      <rect width="600" height="750" rx="16" fill="#F8FAFC"/>
      <rect width="600" height="14" fill="#E11D48"/>
      
      <circle cx="300" cy="95" r="36" fill="#E11D48" fill-opacity="0.1"/>
      <circle cx="300" cy="95" r="26" fill="#E11D48"/>
      <path d="M290 95L297 102L311 88" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

      <text x="300" y="155" fill="#64748B" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">PAYMENT SUCCESSFUL</text>
      <text x="300" y="200" fill="#0F172A" font-family="sans-serif" font-size="36" font-weight="800" text-anchor="middle">৳${details.amount.toLocaleString('en-US')} BDT</text>
      <text x="300" y="228" fill="#94A3B8" font-family="sans-serif" font-size="13" text-anchor="middle">${channel}</text>

      <rect x="36" y="260" width="528" height="360" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="64" y="305" fill="#64748B" font-family="sans-serif" font-size="14">Sent From</text>
      <text x="536" y="305" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">${details.sender}</text>
      <line x1="64" y1="325" x2="536" y2="325" stroke="#F1F5F9" stroke-width="1.5"/>

      <text x="64" y="365" fill="#64748B" font-family="sans-serif" font-size="14">Paid To Business</text>
      <text x="536" y="365" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">${details.recipient}</text>
      <line x1="64" y1="385" x2="536" y2="385" stroke="#F1F5F9" stroke-width="1.5"/>

      <text x="64" y="425" fill="#64748B" font-family="sans-serif" font-size="14">Transfer Method</text>
      <text x="536" y="425" fill="#E11D48" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="end">${channel}</text>
      <line x1="64" y1="445" x2="536" y2="445" stroke="#F1F5F9" stroke-width="1.5"/>

      <text x="64" y="485" fill="#64748B" font-family="sans-serif" font-size="14">Payment Trx ID</text>
      <text x="536" y="485" fill="#0F172A" font-family="monospace" font-size="13" font-weight="600" text-anchor="end">${refNumber}</text>
      <line x1="64" y1="505" x2="536" y2="505" stroke="#F1F5F9" stroke-width="1.5"/>

      <text x="64" y="545" fill="#64748B" font-family="sans-serif" font-size="14">Timestamp</text>
      <text x="536" y="545" fill="#334155" font-family="sans-serif" font-size="13" text-anchor="end">${dateStr}</text>
      <line x1="64" y1="565" x2="536" y2="565" stroke="#F1F5F9" stroke-width="1.5"/>

      <text x="64" y="598" fill="#10B981" font-family="sans-serif" font-size="13" font-weight="600">Status</text>
      <text x="536" y="598" fill="#10B981" font-family="sans-serif" font-size="13" font-weight="700" text-anchor="end">COMPLETED &amp; SUBMITTED</text>

      <rect x="36" y="640" width="528" height="55" rx="8" fill="#F1F5F9"/>
      <text x="300" y="672" fill="#64748B" font-family="sans-serif" font-size="12" text-anchor="middle">Official payment proof for settlement of dollar purchase</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
