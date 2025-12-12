// Global cache (persists in memory as long as server is running/frozen)
let cachedList = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Global Stats
let stats = {
    totalRequests: 0,
    requestsToday: 0,
    jsonDownloads: 0,
    lastResetTime: Date.now(),
    startTime: Date.now()
};

// Export stats for status endpoint
export { stats };

export default async function handler(req, res) {
    stats.totalRequests++;

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
        const now = Date.now();
        if (!cachedList || (now - lastFetchTime > CACHE_DURATION)) {
            console.log('Fetching new data list...');
            const response = await fetch(EXTERNAL_URL);
            if (!response.ok) throw new Error('Failed to download list');

            cachedList = await response.json();
            lastFetchTime = now;
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
