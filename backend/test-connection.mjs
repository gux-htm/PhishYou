// Quick connectivity test — run with: node test-connection.mjs
// Set your API key as an environment variable: OPENROUTER_API_KEY
const KEY      = process.env.OPENROUTER_API_KEY || 'your-api-key-here';
const MODEL    = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

if (KEY === 'your-api-key-here') {
  console.error('❌ ERROR: Please set OPENROUTER_API_KEY environment variable');
  console.error('Example: $env:OPENROUTER_API_KEY="sk-or-v1-..."');
  process.exit(1);
}

console.log('Testing OpenRouter connection...');
console.log('  endpoint :', ENDPOINT);
console.log('  model    :', MODEL);
console.log('  key      :', KEY.slice(0, 16) + '...');
console.log('');

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${KEY}`,
    'HTTP-Referer': 'https://phishyou.app',
    'X-Title': 'PhishYou',
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: 'Reply with only the word OK.' },
      { role: 'user',   content: 'Ping' },
    ],
    max_tokens: 16,
  }),
});

const raw = await res.text();
console.log('HTTP status :', res.status, res.statusText);
console.log('Raw response:', raw);

try {
  const json = JSON.parse(raw);
  if (json.choices?.[0]?.message?.content) {
    console.log('\n✅ SUCCESS — model replied:', json.choices[0].message.content);
  } else if (json.error) {
    console.log('\n❌ PROVIDER ERROR:', JSON.stringify(json.error, null, 2));
  }
} catch {
  console.log('(response was not valid JSON)');
}
