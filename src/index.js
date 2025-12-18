export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("Random Chat Bot is live 🤖");
    }
    BOT_TOKWN="8475840633:AAFywH6ClZ8zqGupk7aRPWih8o06BcHb_uQ"
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
      await sendMessage(env, partner, text);
    } else {
      await sendMessage(env, userId, "⚠️ You are not in a chat. Type /chat");
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
    await sendMessage(env, userId, "🔎 Looking for a partner...");
    return new Response("OK");
  }

  if (waiting === userId) {
    await sendMessage(env, userId, "⏳ Still waiting...");
    return new Response("OK");
  }

  // Match found
  await env.CHAT_KV.delete("waiting");
  await env.CHAT_KV.put(`chat:${userId}`, waiting);
  await env.CHAT_KV.put(`chat:${waiting}`, userId);

  await sendMessage(env, userId, "✅ Connected! Say hi 👋");
  await sendMessage(env, waiting, "✅ Connected! Say hi 👋");

  return new Response("OK");
}

async function stopChat(env, userId) {
  const partner = await env.CHAT_KV.get(`chat:${userId}`);
  if (partner) {
    await env.CHAT_KV.delete(`chat:${partner}`);
    await sendMessage(env, partner, "❌ Partner left the chat.");
  }
  await env.CHAT_KV.delete(`chat:${userId}`);
  await sendMessage(env, userId, "❌ Chat ended.");
  return new Response("OK");
}

/* =========================
   FRIEND SYSTEM
========================= */

async function sendFriendRequest(env, userId) {
  const partner = await env.CHAT_KV.get(`chat:${userId}`);
  if (!partner) {
    await sendMessage(env, userId, "⚠️ No active chat.");
    return new Response("OK");
  }

  await env.CHAT_KV.put(`friend_req:${partner}`, userId);
  await sendMessage(env, partner, "🤝 Friend request received! Type /accept");
  await sendMessage(env, userId, "📨 Friend request sent.");

  return new Response("OK");
}

async function acceptFriend(env, userId) {
  const requester = await env.CHAT_KV.get(`friend_req:${userId}`);
  if (!requester) {
    await sendMessage(env, userId, "⚠️ No friend requests.");
    return new Response("OK");
  }

  await env.CHAT_KV.delete(`friend_req:${userId}`);
  await env.CHAT_KV.put(`friend:${userId}`, requester);
  await env.CHAT_KV.put(`friend:${requester}`, userId);

  await sendMessage(env, userId, "✅ Friend added!");
  await sendMessage(env, requester, "🎉 Friend request accepted!");

  return new Response("OK");
}

async function profile(env, userId) {
  const friend = await env.CHAT_KV.get(`friend:${userId}`);
  await sendMessage(
    env,
    userId,
    `👤 Profile\n\nID: ${userId}\nFriend: ${friend ? "Yes" : "No"}`
  );
}

/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
        }
