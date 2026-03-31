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
4. Output must be strictly valid JSON.
5. Do not wrap JSON in markdown.
6. Do not output any text before or after JSON.   
7. MESSAGE MAPPING:
   - Read the 'CEO's Instruction' (CEO’s Directive).
   - Identify which product from the extracted list is most relevant to this instruction.
   - For the RELEVANT product, put the CEO's instruction in the "instructions" field.
   - If the instruction is general or doesn't match any specific product, apply it to the most relevant one or all, but ALWAYS keep the full list of products.

Input Data:
- CEO’s Directive: ${data.message || "None"}
- Instagram Caption: ${cleanedCaption}
- Video Transcript: ${cleanedTranscript}
- Image/Video Context: ${cleanedAlt}

Required JSON Format:
{
  "subject": "제품명 - 판매처 (판매처 정보 없으면 제품명만 반환)",
  "main_category": "음료/디저트/기타 중 택 1",
  "detailed_analysis": "음식/음료와 관련된 전체적인 내용을 요약하되, CEO’s Directive을 반영하여 CEO’s Directive와 영상 내용을 유기적으로 결합한 5~6줄 분량의 상세 분석 리포트를 작성. 제품명/원료명/판매처/가게이름/특징/가격이 포함되어야 함.",
  "summary_data": [
    {
      "product_name": "제품명 혹은 원료명",
      "location": "판매처/원산지/가게이름",
      "features": "맛, 특징, 특이사항 또는 의견",
      "price": "가격",
      "instructions": "입력받은 CEO’s Directive를 요약하여 기재. 또한 CEO’s Directive를 그대로 반환하지 말고, 문장을 다듬어서 기재. 입력값이 없으면 '없음'으로 반환"
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
                    maxOutputTokens: 4096,
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