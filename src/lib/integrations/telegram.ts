export async function sendTelegramNotification(
  token: string | null | undefined,
  chatId: string | null | undefined,
  text: string,
) {
  if (!token || !chatId) return { ok: false as const, reason: "missing_config" };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false as const, reason: body };
  }
  return { ok: true as const };
}
