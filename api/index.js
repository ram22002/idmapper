import 'dotenv/config';
import { URL } from 'url';
// FORCE UPDATE VERCEL DEPLOYMENT
import Redis from 'ioredis';

// Global cache (persists in memory as long as server is running/frozen)
let cachedList = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Redis Connection (Global to reuse connection in lambda)
let redis = null;
if (process.env.REDIS_URL) {
    try {
        redis = new Redis(process.env.REDIS_URL);
        // Silently handle errors to prevent crashes if Redis fails
        redis.on('error', (err) => console.error('Redis Client Error', err));
    } catch (e) {
        console.error('Failed to initialize Redis', e);
    }
}

// Global Stats (Fallback / In-Memory State)
let stats = {
    totalRequests: 0,
    requestsToday: 0,
    jsonDownloads: 0,
    lastResetTime: Date.now(),
    startTime: Date.now()
};

export default async function handler(req, res) {
    console.log("Handler invoked (FS-aware version)");
    const url = new URL(req.url, `http://${req.headers.host}`);

    // --- STATUS ROUTE ---
    if (url.pathname.includes('/status')) {
        let responseData = { ...stats, status: 'Operational', region: process.env.VERCEL_REGION || 'dev' };

        // Fetch valid data from Redis if available
        if (redis) {
            try {
                const total = await redis.get('total_requests') || 0;
                const downloads = await redis.get('json_downloads') || 0;

                // Get daily requests
                const today = new Date().toISOString().split('T')[0];
                const daily = await redis.get(`daily_requests:${today}`) || 0;

                // Get or Set Project Start Time
                let projectStart = await redis.get('project_start_time');
                if (!projectStart) {
                    projectStart = Date.now();
                    await redis.set('project_start_time', projectStart);
                }

                responseData.total_requests = parseInt(total);
                responseData.requests_today = parseInt(daily);
                responseData.json_downloads = parseInt(downloads);
                responseData.start_time = parseInt(projectStart);

                // Calculate Uptime based on Project Start (Persistence)
                const uptime = Date.now() - parseInt(projectStart);
                // Convert uptime to readable string
                const seconds = Math.floor((uptime / 1000) % 60);
                const minutes = Math.floor((uptime / (1000 * 60)) % 60);
                const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
                const days = Math.floor((uptime / (1000 * 60 * 60 * 24)));

                responseData.uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                responseData.debug = { redis_enabled: true, status: redis.status };

            } catch (err) {
                console.error('Redis fetch error', err);
                responseData.debug = { redis_enabled: true, error: err.message };
            }
        } else {
            // In-Memory Uptime
            const uptime = Date.now() - stats.startTime;
            const seconds = Math.floor((uptime / 1000) % 60);
            const minutes = Math.floor((uptime / (1000 * 60)) % 60);
            const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
            const days = Math.floor((uptime / (1000 * 60 * 60 * 24)));
            responseData.uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            responseData.debug = { redis_enabled: false, message: 'No REDIS_URL found' };
        }

        return res.status(200).json(responseData);
    }

    // --- MAPPER ROUTE (Default) ---

    // Update Stats
    stats.totalRequests++;

    // In-memory daily logic
    const now = Date.now();
    if (now - stats.lastResetTime > CACHE_DURATION) {
        stats.requestsToday = 0;
        stats.lastResetTime = now;
    }
    stats.requestsToday++;

    // Redis Updates
    if (redis) {
        try {
            await redis.incr('total_requests');
            const today = new Date().toISOString().split('T')[0];
            await redis.incr(`daily_requests:${today}`);
            await redis.expire(`daily_requests:${today}`, 172800); // 48h expire
        } catch (e) {
            console.error('Redis update error', e);
        }
    }

    // 1. The huge file URL (Self-Hosted Master File)
    const EXTERNAL_URL = 'https://cdn.jsdelivr.net/gh/ram22002/idmapper@main/public/master_anime.json';

    try {
        // List of supported IDs to search by
        const supportedIds = [
            'anilist_id',
            'mal_id',
            'thetvdb_id',
            'imdb_id',
            'anisearch_id',
            'themoviedb_id',
            'kitsu_id',
            'notify.moe_id',
            'simkl_id',
            'livechart_id',
            'anime-planet_id',
            'anidb_id',
            'animecountdown_id'
        ];

        // Find which ID is present in the request query
        let searchIdKey = null;
        let searchIdValue = null;

        for (const key of supportedIds) {
            if (req.query[key]) {
                searchIdKey = key;
                searchIdValue = req.query[key];
                break; // Use the first valid ID found
            }
        }

        // Check if ANY ID is provided
        if (!searchIdKey) {
            return res.status(400).json({ error: `Missing valid ID parameter. Supported: ${supportedIds.join(', ')}` });
        }

        // 2. Fetch the large JSON from GitHub (Cache logic)
        // 2. Fetch the large JSON (Local FS -> GitHub Cache)
        const nowFetch = Date.now();
        if (!cachedList || (nowFetch - lastFetchTime > CACHE_DURATION)) {
            let loaded = false;

            // Try Local File System first (Best for Local Dev & if bundled)
            try {
                const fs = await import('fs');
                const path = await import('path');
                const localPath = path.join(process.cwd(), 'public', 'master_anime.json');

                if (fs.existsSync(localPath)) {
                    console.log('Loading data from local MASTER file...');
                    const fileContent = await fs.promises.readFile(localPath, 'utf-8');
                    cachedList = JSON.parse(fileContent);
                    loaded = true;
                    console.log('Data list updated from Local FS (MASTER).');
                }
            } catch (err) {
                console.warn('Local file read failed, falling back to fetch:', err.message);
            }

            // Fallback to Remote Fetch
            if (!loaded) {
                console.log('Fetching new data list from remote...');
                const response = await fetch(EXTERNAL_URL);
                if (!response.ok) throw new Error('Failed to download list: ' + response.statusText);

                cachedList = await response.json();
                console.log('Data list updated from Remote.');
            }

            lastFetchTime = nowFetch;

            // Stats update
            stats.jsonDownloads++;
            if (redis) {
                redis.incr('json_downloads');
            }
        }

        // 3. Find the matching item
        let result = null;

        // General search using the found key
        // We use loose equality (==) to handle string vs number differences (e.g. "21" vs 21)
        result = cachedList.find(item => item[searchIdKey] == searchIdValue);

        // 4. Cache Config (Important for speed!)
        // Cache for 1 day (86400 seconds)
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: 'Anime not found in list' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
