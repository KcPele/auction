const BRAND = {
  primary: '#2559d6',
  primaryDark: '#173a91',
  ink: '#172033',
  muted: '#64748b',
  surface: '#ffffff',
  background: '#f4f7fb',
  border: '#dbe3ef',
} as const;

export type TransactionalEmailInput = {
  title: string;
  message: string;
  recipientName?: string | null;
  preheader?: string;
  actionUrl?: string;
  actionLabel?: string;
};

export type TransactionalEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderTransactionalEmail(
  input: TransactionalEmailInput,
): TransactionalEmail {
  const title = escapeHtml(input.title.trim());
  const message = escapeHtml(input.message.trim()).replace(/\n/g, '<br>');
  const preheader = escapeHtml(
    (input.preheader ?? input.message).trim().slice(0, 140),
  );
  const greeting = input.recipientName?.trim()
    ? `Hi ${escapeHtml(input.recipientName.trim())},`
    : 'Hello,';
  const safeActionUrl = normalizeHttpUrl(input.actionUrl);
  const actionUrl = safeActionUrl ? escapeAttribute(safeActionUrl) : null;
  const actionLabel = escapeHtml(input.actionLabel?.trim() || 'View in BidNaija');
  const actionHtml = actionUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px"><tr><td style="border-radius:10px;background:${BRAND.primary}"><a href="${actionUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">${actionLabel}</a></td></tr></table>`
    : '';
  const plainAction = safeActionUrl
    ? `\n\n${input.actionLabel?.trim() || 'View in BidNaija'}: ${safeActionUrl}`
    : '';

  return {
    subject: input.title.trim(),
    text: `${input.recipientName?.trim() ? `Hi ${input.recipientName.trim()},` : 'Hello,'}\n\n${input.message.trim()}${plainAction}\n\n— BidNaija`,
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:${BRAND.background};color:${BRAND.ink};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.background};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden">
        <tr><td style="height:5px;background:${BRAND.primary}"></td></tr>
        <tr><td style="padding:28px 32px 10px">
          <div style="font-size:21px;font-weight:800;letter-spacing:-0.4px;color:${BRAND.primaryDark}">BidNaija</div>
          <div style="margin-top:4px;font-size:12px;color:${BRAND.muted}">Verified auctions for cars and gadgets</div>
        </td></tr>
        <tr><td style="padding:18px 32px 32px">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.muted}">${greeting}</p>
          <h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;color:${BRAND.ink}">${title}</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:${BRAND.muted}">${message}</p>
          ${actionHtml}
          <p style="margin:28px 0 0;border-top:1px solid ${BRAND.border};padding-top:18px;font-size:12px;line-height:1.6;color:${BRAND.muted}">This is a transactional message about your BidNaija account. Never share verification codes or passwords.</p>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:${BRAND.muted}">© ${new Date().getUTCFullYear()} BidNaija · Lagos, Nigeria</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function normalizeHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
