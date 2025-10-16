import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read the request stream into a buffer.
async function buffer(readable: VercelRequest): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookUrl = process.env.FILES_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('FILES_WEBHOOK_URL is not configured.');
    return res.status(500).json({ error: 'File webhook URL is not configured' });
  }

  try {
    // Buffer the entire request body from the user.
    const bodyBuffer = await buffer(req);

    // Forward the buffered request to the webhook URL.
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        // Pass the original Content-Type, which is essential for multipart/form-data.
        'Content-Type': req.headers['content-type']!,
      },
      body: bodyBuffer,
    });

    // Check if the webhook call was successful.
    if (webhookResponse.ok) {
      res.status(200).json({ success: true });
    } else {
      // If the webhook returned an error, log it and forward a proper error response.
      const errorText = await webhookResponse.text();
      console.error(`Webhook error: ${webhookResponse.status}`, errorText);
      res.status(webhookResponse.status).json({ error: 'Webhook processing failed', details: errorText });
    }

  } catch (error: any) {
    console.error('Fatal error in file upload handler:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
