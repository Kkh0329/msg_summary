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
    return text.replace(/\s+/g, " ").trim().substring(0, maxLength);
}

module.exports = {
    sleep,
    withRetry,
    cleanText
};