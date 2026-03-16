const axios = require("axios");
const { jsonrepair } = require("jsonrepair");
const { withRetry, cleanText } = require("../utils/helper");

async function analyzeWithGemini(data) {

    const cleanedCaption = data.caption ? cleanText(data.caption, 800) : "N/A";
    const cleanedAlt = data.altText ? cleanText(data.altText, 400) : "N/A";
    const cleanedTranscript = data.transcript ? cleanText(data.transcript, 600) : "N/A";

    const prompt = `
You are an expert in Food & Beverage industry analysis.
Your task is to analyze the provided input (Instagram data, User message, or both) and return a structured JSON report.

Rules:
1. Context Integration: 
   - If BOTH Instagram data and User Message are provided, synthesize them. 
   - If ONLY a User Message is provided, analyze the text for business insights, logistics, or product ideas mentioned.
   - If ONLY an Instagram link is provided, summarize the content of the post/reel.
2. Language: All values must be in Korean.
3. Specifics:
   - Location: If it's a home-cafe or unknown, return "정보 없음".
   - Price: If not mentioned, return "정보 없음".
   - Summary Data: Always return an array of objects, even for a single product.
   - The 'tags' key must contain a combined list of Instagram-provided tags and additional keywords inferred and extracted by the model.

Input Data:
- User's Specific Message/Memo: ${data.message || "None"}
- Instagram Caption: ${cleanedCaption}
- Video Transcript: ${cleanedTranscript}
- Image Context: ${cleanedAlt}

Required JSON Format:
{
  "subject": "분석 주제 (가급적 제품명 혹은 핵심 주제)",
  "main_category": "음료/디저트/ETC 중 택 1",
  "detailed_analysis": "전체적인 분석 내용을 5~6문장으로 서술",
  "summary_data": [
    {
      "product_name": "제품명 혹은 원료명",
      "location": "판매처/원산지/가게이름",
      "taste": "맛 혹은 성분 특징",
      "features": "특이사항 또는 의견",
      "price": "가격"
    }
  ],
  "tags": ["태그1", "태그2"]
}
`;

    return await withRetry(async () => {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.1
                }
            }
        );

        let aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            const repaired = jsonrepair(jsonMatch[0]);
            return JSON.parse(repaired);
        } catch (err) {
            console.error("JSON 파싱 에러:", aiText);
            throw err;
        }
    });
}

module.exports = {
    analyzeWithGemini
};