const axios = require('axios');

class RateLimitedClient {
    constructor(requestsPerSecond = 20) {
        this.queue = [];
        this.processing = false;
        this.delay = 1000 / requestsPerSecond;
    }

    async get(url, config = {}) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const response = await axios.get(url, config);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            const startTime = Date.now();

            await task();

            // Calculate remaining time to wait to respect the rate limit
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(0, this.delay - elapsed);
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        this.processing = false;
    }
}

// Export singleton instance configured for 20 requests per second (safe margin for 25 limit)
module.exports = new RateLimitedClient(20);
