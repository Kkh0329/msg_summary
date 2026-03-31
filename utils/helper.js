const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, maxRetries = 3, baseDelay = 3000) {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isQuotaError = error.response && error.response.status === 429;

            if (isQuotaError && i < maxRetries) {
                const delay = baseDelay * Math.pow(2, i);
                console.warn(`[Retry] ${delay}ms 후 다시 시도... (${i + 1}/${maxRetries})`);
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }
}

function cleanText(text, maxLength = 800) {
    if (!text) return "";

    let cleaned = text
        // URL 제거 
        .replace(/(http|https):\/\/[^\s]+/g, "")
        
        // 이모지 제거
        .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "")
        
        // 반복되는 문장부호 압축
        .replace(/([!?.])\1+/g, "$1")
        
        // 해시태그에서 '#' 기호만 제거
        .replace(/#/g, "")
        
        .replace(/\s+/g, " ")
        .trim();

    return cleaned.substring(0, maxLength);
}

module.exports = {
    sleep,
    withRetry,
    cleanText
};