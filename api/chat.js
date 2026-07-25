// api/chat.js
// Vercel Serverless Function that proxies requests to the Anthropic API.
// The API key is held server-side via the ANTHROPIC_API_KEY environment variable.

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check the API key is configured
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY environment variable is not set on the server.'
    });
  }

  try {
    // Basic guardrail on request shape
    const body = req.body || {};
    if (!body.messages || !Array.isArray(body.messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Forward to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        system: body.system,
        messages: body.messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Anthropic API returned an error',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}