const fetch = require('node-fetch');

const HF_URL = 'https://api-inference.huggingface.co/models/tabularisai/multilingual-sentiment-analysis';
const HF_TOKEN = process.env.HF_API_TOKEN;

async function analyzeSentiment(text) {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text })
  });

  if (res.status === 503) {
    const data = await res.json();
    console.warn('Model loading, retry after', data.estimated_time);
    await new Promise(r => setTimeout(r, (data.estimated_time + 1) * 1000));
    return analyzeSentiment(text); // retry 1 lần
  }

  if (!res.ok) throw new Error(`HF error: ${res.status}`);

  const [[arr]] = await res.json(); // kết quả là mảng 2 cấp
  const result = {};
  arr.forEach(item => {
    result[item.label] = item.score;
  });
  return result; // { 'Very Negative': 0.58, ... }
}

module.exports = { analyzeSentiment };
