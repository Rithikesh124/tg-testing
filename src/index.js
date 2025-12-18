// =======================================
// ⚠️ DEBUG ONLY — HARD-CODED BOT TOKEN
// =======================================
const BOT_TOKEN = "8475840633:AAFywH6ClZ8zqGupk7aRPWih8o06BcHb_uQ";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("Random Chat Bot is live 🤖");
    }

    const update = await req.json();
    const msg = update.message;
    if (!msg || !msg.text) return new Response("OK");

    const userId = msg.from.id.toString();
    const text = msg.text.trim();

    // =========================
    // COMMANDS
    // =========================
    if (text === "/chat") {
      return await startChat(env, userId);
    }

    if (text === "/stop") {
      return await stopChat(env, userId);
    }

    if (text === "/friend") {
      return await sendFriendRequest(env, userId);
    }

    if (text === "/accept") {
      return await acceptFriend(env, userId);
    }

    if (text === "/profile") {
      return await profile(env, userId);
    }

    // =========================
    // MESSAGE RELAY
    // =========================
    const partner = await env.CHAT_KV.get(`chat:${userId}`);
    if (partner) {
      await sendMessage(partner, text);
    } else {
      await sendMessage(userId, "⚠️ You are not in a chat. Type /chat");
    }

    return new Response("OK");
  },
};

/* =========================
   CHAT LOGIC
========================= */

async function startChat(env, userId) {
  const waiting = await env.CHAT_KV.get("waiting");

  if (!waiting) {
    await env.CHAT_KV.put("waiting", userId);
    await sendMessage(userId, "🔎 Looking for a partner...");
    return new Response("OK");
  }

  if (waiting === userId) {
    await sendMessage(userId, "⏳ Still waiting...");
    return new Response("OK");
  }

  // Match found
  await env.CHAT_KV.delete("waiting");
  await env.CHAT_KV.put(`chat:${userId}`, waiting);
  await env.CHAT_KV.put(`chat:${waiting}`, userId);

  await sendMessage(userId, "✅ Connected! Say hi 👋");
  await sendMessage(waiting, "✅ Connected! Say hi 👋");

  return new Response("OK");
}

async function stopChat(env, userId) {
  const partner = await env.CHAT_KV.get(`chat:${userId}`);
  if (partner) {
    await env.CHAT_KV.delete(`chat:${partner}`);
    await sendMessage(partner, "❌ Partner left the chat.");
  }
  await env.CHAT_KV.delete(`chat:${userId}`);
  await sendMessage(userId, "❌ Chat ended.");
  return new Response("OK");
}

/* =========================
   FRIEND SYSTEM
========================= */

async function sendFriendRequest(env, userId) {
  const partner = await env.CHAT_KV.get(`chat:${userId}`);
  if (!partner) {
    await sendMessage(userId, "⚠️ No active chat.");
    return new Response("OK");
  }

  await env.CHAT_KV.put(`friend_req:${partner}`, userId);
  await sendMessage(partner, "🤝 Friend request received! Type /accept");
  await sendMessage(userId, "📨 Friend request sent.");

  return new Response("OK");
}

async function acceptFriend(env, userId) {
  const requester = await env.CHAT_KV.get(`friend_req:${userId}`);
  if (!requester) {
    await sendMessage(userId, "⚠️ No friend requests.");
    return new Response("OK");
  }

  await env.CHAT_KV.delete(`friend_req:${userId}`);
  await env.CHAT_KV.put(`friend:${userId}`, requester);
  await env.CHAT_KV.put(`friend:${requester}`, userId);

  await sendMessage(userId, "✅ Friend added!");
  await sendMessage(requester, "🎉 Friend request accepted!");

  return new Response("OK");
}

async function profile(env, userId) {
  const friend = await env.CHAT_KV.get(`friend:${userId}`);
  await sendMessage(
    userId,
    `👤 Profile\n\nID: ${userId}\nFriend: ${friend ? "Yes" : "No"}`
  );
  return new Response("OK");
}

/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(chatId, text) {
  await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
  }
