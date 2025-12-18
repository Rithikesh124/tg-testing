export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram Bot Webhook Active ✅");
    }

    const BOT_TOKEN = "8475840633:AAFywH6ClZ8zqGupk7aRPWih8o06BcHb_uQ";
    const ADMIN_ID = "6132301377";

    const data = await request.json();
    const msg = data.message;

    if (!msg || !msg.text) {
      return new Response("OK");
    }

    const chatId = msg.chat.id;
    const text = msg.text;
    const user = msg.from;

    // =========================
    // /start
    // =========================
    if (text === "/start") {
      await sendMessage(BOT_TOKEN, chatId,
        "👋 Welcome to *Live Support*\n\nSend your message here.\nType /close to end chat.",
        "Markdown"
      );

      if (chatId != ADMIN_ID) {
        await sendMessage(
          BOT_TOKEN,
          ADMIN_ID,
          `🆕 New chat started\n👤 ${user.first_name}\n🆔 ${chatId}`
        );
      }

      return new Response("OK");
    }

    // =========================
    // /close
    // =========================
    if (text === "/close") {
      await sendMessage(BOT_TOKEN, chatId, "❌ Chat closed.");
      await sendMessage(BOT_TOKEN, ADMIN_ID, `🔒 Chat closed by ${chatId}`);
      return new Response("OK");
    }

    // =========================
    // ADMIN REPLY
    // =========================
    if (chatId == ADMIN_ID && msg.reply_to_message) {
      const original = msg.reply_to_message.text || "";

      const match = original.match(/🆔 (\d+)/);
      if (!match) {
        await sendMessage(BOT_TOKEN, ADMIN_ID, "⚠️ Cannot detect user ID.");
        return new Response("OK");
      }

      const userId = match[1];
      await sendMessage(
        BOT_TOKEN,
        userId,
        `💬 Support:\n\n${text}`
      );

      return new Response("OK");
    }

    // =========================
    // USER MESSAGE → ADMIN
    // =========================
    if (chatId != ADMIN_ID) {
      await sendMessage(
        BOT_TOKEN,
        ADMIN_ID,
        `📩 Message from ${user.first_name}\n🆔 ${chatId}\n\n${text}`
      );
    }

    return new Response("OK");
  },
};

// =========================
// SEND MESSAGE FUNCTION
// =========================
async function sendMessage(token, chatId, text, mode = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text,
  };

  if (mode) payload.parse_mode = mode;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
                        }
