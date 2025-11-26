
import axios from 'axios';

const BASE_URL = 'http://localhost:9002';

async function checkHealth() {
    try {
        console.log('Checking root...');
        const rootRes = await axios.get(`${BASE_URL}/`);
        console.log(`Root status: ${rootRes.status}`);
    } catch (e: any) {
        console.error(`Root failed: ${e.message}`);
    }

    try {
        console.log('Checking cron...');
        const cronRes = await axios.get(`${BASE_URL}/api/cron`);
        console.log(`Cron status: ${cronRes.status}`);
    } catch (e: any) {
        console.error(`Cron failed: ${e.message}`);
        if (e.response) {
            console.error(`Cron response: ${JSON.stringify(e.response.data)}`);
        }
    }
}

checkHealth();
