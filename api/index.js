// Global cache (persists in memory as long as server is running/frozen)
let cachedList = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Global Stats (Shared between routes because they are in the same file)
let stats = {
    totalRequests: 0,
    requestsToday: 0,
    jsonDownloads: 0,
    lastResetTime: Date.now(),
    startTime: Date.now()
};

export default async function handler(req, res) {
    // Determine which "route" we are on based on URL
    // In Vercel, req.url might be just "/" if rewritten, so we rely on searchParams or logic
    // But since we will rewrite /api/mapper -> /api?type=mapper or check url path

    // We can assume standard Node req.url or Vercel's behavior. 
    // Best approach: Parse the URL to see if it's status or mapper.

    // NOTE: On Vercel, if we rewrite /api/mapper -> /api/index.js, req.url should capture the original path or we can use query params.
    // Let's rely on checking the check inside the logic or adding a type param in vercel.json rewrites.

    const url = new URL(req.url, `http://${req.headers.host}`);

    // --- STATUS ROUTE ---
    if (url.pathname.includes('/status')) {
        const uptime = Date.now() - stats.startTime;

        // Convert uptime to readable string
        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const days = Math.floor((uptime / (1000 * 60 * 60 * 24)));

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        return res.status(200).json({
            status: 'Operational',
            uptime: uptimeString,
            total_requests: stats.totalRequests,
            requests_today: stats.requestsToday,
            json_downloads: stats.jsonDownloads,
            start_time: stats.startTime,
            region: process.env.VERCEL_REGION || 'dev'
        });
    }

    // --- MAPPER ROUTE (Default) ---
    // If it's not status, we assume it's mapper logic (or check for /mapper)

    stats.totalRequests++; // Increment for mapper calls

    // Check if we need to reset the daily counter (24 hours passed)
    const now = Date.now();
    if (now - stats.lastResetTime > CACHE_DURATION) {
        stats.requestsToday = 0;
        stats.lastResetTime = now;
    }
    stats.requestsToday++;

    // 1. The huge file URL
    const EXTERNAL_URL = 'https://cdn.jsdelivr.net/gh/Fribb/anime-lists@master/anime-list-full.json';

    try {
        const { anilist_id, mal_id } = req.query;

        // Check if ID is provided
        if (!anilist_id && !mal_id) {
            return res.status(400).json({ error: 'Missing anilist_id or mal_id parameter' });
        }

        // 2. Fetch the large JSON from GitHub (Cache logic)
        const nowFetch = Date.now();
        if (!cachedList || (nowFetch - lastFetchTime > CACHE_DURATION)) {
            console.log('Fetching new data list...');
            const response = await fetch(EXTERNAL_URL);
            if (!response.ok) throw new Error('Failed to download list');

            cachedList = await response.json();
            lastFetchTime = nowFetch;
            stats.jsonDownloads++;
            console.log('Data list updated.');
        }

        // 3. Find the matching item
        let result = null;

        if (anilist_id) {
            // Compare as strings or numbers safely
            result = cachedList.find(item => item.anilist_id == anilist_id);
        } else if (mal_id) {
            result = cachedList.find(item => item.mal_id == mal_id);
        }

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
