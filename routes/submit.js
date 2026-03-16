require("dotenv").config();

const express = require("express");
const router = express.Router();

const { getInstagramData } = require("../api/instagram");
const { analyzeWithGemini } = require("../api/gemini");

router.post("/submit", async (req, res) => {
    try {
        const { url, message } = req.body;

        // URL과 메시지 둘 다 없는 경우만 에러 처리
        if (!url && !message) {
            return res.status(400).json({ error: "분석할 URL 또는 메시지를 입력해주세요." });
        }

        let instaData = null;
        if (url) {
            console.log(`[링크 분석 시작] ${url}`);
            instaData = await getInstagramData(url);
        } else {
            console.log(`[텍스트 분석 시작] 메시지만 처리함`);
        }

        const aiResult = await analyzeWithGemini({
            message,
            ...(instaData || {}) // instaData가 있으면 전개, 없으면 빈 객체
        });

        res.json({
            status: "ok",
            data: aiResult
        });

    } catch (e) {
        const errorMessage = e.response?.data?.error?.message || e.message;
        console.error("에러:", errorMessage);
        res.status(500).json({
            status: "error",
            error: "분석 중 오류 발생",
            details: errorMessage
        });
    }
});

module.exports = router;