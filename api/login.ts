import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: VercelRequest): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Store user data indexed by email for secure lookup.
const USERS: Record<string, { id: string; name: string; pin: string }> = {
  'gerard@eosconsult.eu': {
    id: 'user1',
    name: 'Gerard',
    pin: process.env.PIN_1 as string,
  },
  'jordi@eosconsult.eu': {
    id: 'user2',
    name: 'Jordi',
    pin: process.env.PIN_2 as string,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const bodyBuffer = await buffer(req);
    const bodyString = bodyBuffer.toString();

    if (!bodyString) {
      return res.status(400).json({ error: 'Request body is empty.' });
    }

    const { email, pin } = JSON.parse(bodyString);

    if (typeof email !== 'string' || typeof pin !== 'string') {
      return res.status(400).json({ error: 'Invalid email or PIN format.' });
    }

    // Find the user entry by email (case-insensitive).
    const userEntry = USERS[email.toLowerCase()];

    // Check if the user exists and the PIN matches.
    if (userEntry && userEntry.pin === pin) {
      // Exclude the PIN from the user object sent to the client.
      const { pin: _, ...user } = userEntry;
      res.status(200).json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or PIN' });
    }
  } catch (error: any) {
    console.error('Error in login handler:', error);
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
}
