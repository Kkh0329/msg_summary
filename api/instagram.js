const axios = require("axios");
const { withRetry } = require("../utils/helper");

async function getInstagramData(url) {
    return await withRetry(async () => {

        const response = await axios.post(
            `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
            {
                directUrls: [url],
                resultsLimit: 1
            },
            { timeout: 60000 }
        );

        if (!response.data || response.data.length === 0) {
            throw new Error("Instagram 데이터를 가져오지 못했습니다.");
        }

        const post = response.data[0];
        return {
            caption: post.caption || "",
            altText: post.alt || "",
            transcript: post.videoTranscript || "",
            hashtags: Array.isArray(post.hashtags)
                ? post.hashtags.join(", ")
                : (post.hashtags || "")
        };

    });
}

module.exports = {
    getInstagramData
};