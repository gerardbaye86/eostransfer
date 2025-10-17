import type { VercelRequest } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

async function readAndProcessForm(req: Request) {
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;
    const file = formData.get('file') as File | null;

    return { userId, userName, message, file };
}


export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const webhookUrl = process.env.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: 'Chat webhook URL is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  try {
    const { userId, userName, message, file } = await readAndProcessForm(req);

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userName', userName);
    formData.append('message', message);
    if (file) {
      formData.append('file', file, file.name);
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (!webhookResponse.body) {
      return new Response(JSON.stringify({ error: 'No response from webhook service' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a new ReadableStream to pipe the response from the webhook
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = webhookResponse.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // The client expects text chunks.
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream directly to the client
    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Failed to forward chat message:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}
