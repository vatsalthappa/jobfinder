require('dotenv').config();

async function testGoogleApi() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log("No API Key found in .env");
    return;
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log(`Checking all available models for this API key...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Available Models:", data.models ? data.models.map(m => m.name).join(", ") : data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testGoogleApi();
