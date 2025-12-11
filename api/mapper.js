export default async function handler(req, res) {
    // 1. The huge file URL
    const EXTERNAL_URL = 'https://cdn.jsdelivr.net/gh/Fribb/anime-lists@master/anime-list-full.json';

    try {
        const { anilist_id, mal_id } = req.query;

        // Check if ID is provided
        if (!anilist_id && !mal_id) {
            return res.status(400).json({ error: 'Missing anilist_id or mal_id parameter' });
        }

        // 2. Fetch the large JSON from GitHub (Vercel server does this)
        const response = await fetch(EXTERNAL_URL);
        if (!response.ok) throw new Error('Failed to download list');

        const allAnime = await response.json();

        // 3. Find the matching item
        let result = null;

        if (anilist_id) {
            // Compare as strings or numbers safely
            result = allAnime.find(item => item.anilist_id == anilist_id);
        } else if (mal_id) {
            result = allAnime.find(item => item.mal_id == mal_id);
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
