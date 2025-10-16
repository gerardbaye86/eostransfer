import type { VercelRequest, VercelResponse } from '@vercel/node';

// Disable Vercel's default body parser to ensure we can read the stream manually.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read the raw request stream into a buffer.
async function buffer(readable: VercelRequest): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const USERS: Record<string, { id: string; name: string }> = {
  [process.env.PIN_1 as string]: { id: 'user1', name: 'Gerard - EOS' },
  [process.env.PIN_2 as string]: { id: 'user2', name: 'Jordi - EOS' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Manually buffer and parse the request body.
    // This is a robust method that avoids any issues with automatic body parsers.
    const bodyBuffer = await buffer(req);
    const bodyString = bodyBuffer.toString();

    if (!bodyString) {
        return res.status(400).json({ error: 'Request body is empty.' });
    }

    const { pin } = JSON.parse(bodyString);

    if (typeof pin !== 'string') {
      return res.status(400).json({ error: 'Invalid PIN format in request body.' });
    }

    const foundUser = USERS[pin];

    if (foundUser) {
      res.status(200).json({ success: true, user: foundUser });
    } else {
      res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
  } catch (error: any) {
    // This will catch errors from JSON.parse if the body is not valid JSON.
    console.error('Error in login handler:', error);
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
}
