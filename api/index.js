import 'dotenv/config';
import { URL, fileURLToPath } from 'url';
import path from 'path';
// FORCE UPDATE VERCEL DEPLOYMENT


// Global cache (persists in memory as long as server is running/frozen)
let cachedList = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Global Stats (In-Memory State)
let stats = {
    totalRequests: 0,
    requestsToday: 0,
    jsonDownloads: 0,
    lastResetTime: Date.now(),
    startTime: Date.now()
};

export default async function handler(req, res) {
    // console.log("Handler invoked (FS-aware version)");
    const url = new URL(req.url, `http://${req.headers.host}`);

    // --- STATUS ROUTE ---
    if (url.pathname.includes('/status')) {
        const uptime = Date.now() - stats.startTime;
        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const days = Math.floor((uptime / (1000 * 60 * 60 * 24)));

        let responseData = {
            ...stats,
            status: 'Operational',
            region: process.env.VERCEL_REGION || 'dev',
            total_requests: stats.totalRequests,
            requests_today: stats.requestsToday,
            json_downloads: stats.jsonDownloads,
            uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`
        };

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



    // 1. The huge file URL (Self-Hosted Master File)
    const EXTERNAL_URL = 'https://raw.githubusercontent.com/ram22002/idmapper/main/public/master_anime.json';

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
        if (!searchIdKey && !req.query.debug) {
            return res.status(400).json({ error: `Missing valid ID parameter. Supported: ${supportedIds.join(', ')}` });
        }

        // 2. Fetch the large JSON from GitHub (Cache logic)
        // 2. Fetch the large JSON (Local FS -> GitHub Cache)
        const nowFetch = Date.now();
        if (!cachedList || cachedList.length === 0 || (nowFetch - lastFetchTime > CACHE_DURATION)) {
            let loaded = false;
            console.log(`Debug cache check: List=${cachedList ? cachedList.length : 'null'}, TimeDiff=${nowFetch - lastFetchTime}`);

            // Try Local File System first (Best for Local Dev & if bundled)
            try {
                const fs = await import('fs');
                // Robust path resolution relative to this file (api/index.js)
                const __dirname = path.dirname(fileURLToPath(import.meta.url));
                const localPath = path.join(__dirname, '..', 'public', 'master_anime.json');

                if (fs.existsSync(localPath)) {
                    console.log(`Loading data from local MASTER file at: ${localPath}`);
                    const fileContent = await fs.promises.readFile(localPath, 'utf-8');
                    cachedList = JSON.parse(fileContent);
                    loaded = true;
                    console.log(`Data list updated from Local FS. Loaded ${cachedList.length} entries.`);
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
                console.log(`Data list updated from Remote. Loaded ${cachedList.length} entries.`);
            }

            lastFetchTime = nowFetch;

            // Stats update
            stats.jsonDownloads++;

        }

        // --- DEBUG ENDPOINT ---
        if (req.query.debug) {
            return res.json({
                status: 'Debug Mode',
                cachedListSize: cachedList ? cachedList.length : 0,
                lastFetchTime: lastFetchTime,
                cacheDuration: CACHE_DURATION,
                externalUrl: EXTERNAL_URL,
                cwd: process.cwd(),
                localPath: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'master_anime.json'),
                localFileExists: (await import('fs')).existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'master_anime.json'))
            });
        }

        // 3. Find the matching item
        let result = null;

        // General search using the found key
        // We use loose equality (==) to handle string vs number differences (e.g. "21" vs 21)
        result = cachedList.find(item => {
            const val = item[searchIdKey];
            if (Array.isArray(val)) {
                return val.some(v => v == searchIdValue);
            }
            return val == searchIdValue;
        });

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
