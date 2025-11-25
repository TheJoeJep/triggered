
import axios from 'axios';

const INTERVAL_MS = 60 * 1000; // 1 minute
const CRON_URL = 'http://localhost:9002/api/cron';

async function runCron() {
    console.log(`[Worker] Pinging cron job at ${new Date().toISOString()}...`);
    try {
        const response = await axios.get(CRON_URL);
        console.log(`[Worker] Success: ${response.data.message}`);
    } catch (error: any) {
        console.error(`[Worker] Failed to ping cron job: ${error.message}`);
        if (error.response) {
            console.error(`[Worker] Response status: ${error.response.status}`);
            console.error(`[Worker] Response data:`, error.response.data);
        }
    }
}

console.log(`[Worker] Starting local cron worker. Pinging ${CRON_URL} every ${INTERVAL_MS / 1000} seconds.`);
runCron(); // Run immediately on start
setInterval(runCron, INTERVAL_MS);
