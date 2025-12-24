
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANIMELIST_URL = 'https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-full.json';
const MAPPINGS_URL = 'https://raw.githubusercontent.com/eliasbenb/PlexAniBridge-Mappings/master/mappings.json';

const ANIMELIST_FILE = path.join(__dirname, '../public/anime-list-full.json');
const MAPPINGS_FILE = path.join(__dirname, '../public/mappings.json');
const MASTER_FILE = path.join(__dirname, '../public/master_anime.json');

async function fetchJson(url) {
    console.log(`Downloading ${url}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.json();
}

async function main() {
    try {
        // Ensure public directory exists
        const publicDir = path.dirname(ANIMELIST_FILE);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const [animeList, mappings] = await Promise.all([
            fetchJson(ANIMELIST_URL),
            fetchJson(MAPPINGS_URL)
        ]);

        console.log(`Loaded ${animeList.length} anime entries.`);
        console.log(`Loaded mappings for ${Object.keys(mappings).length} entries.`);

        // 1. Save RAW Mirror Files
        fs.writeFileSync(ANIMELIST_FILE, JSON.stringify(animeList, null, 2));
        console.log(`Saved raw mirror: ${ANIMELIST_FILE}`);

        fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
        console.log(`Saved raw mirror: ${MAPPINGS_FILE}`);

        // 2. Create Merged Master File
        const mappingsMap = new Map();
        for (const [key, value] of Object.entries(mappings)) {
            const id = value.anilist_id || parseInt(key);
            if (id) {
                mappingsMap.set(String(id), value);
            }
        }

        let mergedCount = 0;
        const mergedList = animeList.map(anime => {
            const anilistId = String(anime.anilist_id);
            if (mappingsMap.has(anilistId)) {
                mergedCount++;
                return {
                    ...anime,
                    ...mappingsMap.get(anilistId)
                };
            }
            return anime;
        });

        console.log(`Merged data for ${mergedCount} entries.`);

        fs.writeFileSync(MASTER_FILE, JSON.stringify(mergedList, null, 2));
        console.log(`Saved MASTER file: ${MASTER_FILE}`);

    } catch (error) {
        console.error('Error updating data:', error);
        process.exit(1);
    }
}

main();
