import * as chatService from "../services/chat.service.js";

function writeSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getClientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export async function sendMessage(req, res) {
  const { content, history } = req.body;
  const result = await chatService.sendMessage(
    {
      clientKey: getClientKey(req),
    },
    content,
    history
  );

  res.status(201).json({ ok: true, data: result });
}

export async function streamMessage(req, res) {
  const { content, history } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    await chatService.streamMessage(
      {
        clientKey: getClientKey(req),
      },
      content,
      history,
      {
        onStart: () => writeSseEvent(res, "start", { ok: true }),
        onToken: (delta) => writeSseEvent(res, "delta", { delta }),
        onComplete: (result) => {
          writeSseEvent(res, "done", {
            message: result.message,
          });
          writeSseEvent(res, "usage", result.usage);
        },
      }
    );
  } catch (err) {
    writeSseEvent(res, "error", {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    });
  } finally {
    res.end();
  }
}
