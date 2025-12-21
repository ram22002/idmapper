
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANIMELIST_URL = 'https://cdn.jsdelivr.net/gh/Fribb/anime-lists@master/anime-list-full.json';
const MAPPINGS_URL = 'https://cdn.jsdelivr.net/gh/ram22002/idmapper@main/public/mappings.json';
const OUTPUT_FILE = path.join(__dirname, '../public/anime-list-full.json');
const MAPPINGS_OUTPUT_FILE = path.join(__dirname, '../public/mappings.json');

async function fetchJson(url) {
    console.log(`Downloading ${url}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.json();
}

async function main() {
    try {
        // Ensure public directory exists
        const publicDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const [animeList, mappings] = await Promise.all([
            fetchJson(ANIMELIST_URL),
            fetchJson(MAPPINGS_URL)
        ]);

        console.log(`Loaded ${animeList.length} anime entries.`);
        console.log(`Loaded mappings for ${Object.keys(mappings).length} entries.`);

        let mergedCount = 0;

        // Create a map for faster lookup if mappings is an array (though it seems to be an object keyed by anilist_id?)
        // Based on previous inspection, mappings.json is an object where keys are likely AniList IDs (or some ID).
        // Let's verify usually mappings keys are IDs. The user said "this time this api only give id".
        // Looking at the view_file output from step 27:
        // "1": { "anidb_id": 23, ... } -> Keys are stringified integers.
        // The schema said "anilist_id" is a property.
        // Wait, looking at step 27 again:
        // "1": { ... }
        // "5": { ... }
        // These keys look like AniList IDs. Let's assume the key IS the AniList ID for now, 
        // but we should also check if the value contains 'anilist_id'.

        // In step 27:
        // "1": { "anidb_id": 23, "imdb_id": ..., "mal_id": ... }
        // It doesn't explicitly have "anilist_id" inside the object in some cases (e.g. key "1").
        // But the schema says "anilist_id" is a property.
        // Let's assume the key is the AniList ID as is common in these maps.

        const mappingsMap = new Map();
        for (const [key, value] of Object.entries(mappings)) {
            // If the object has an explicit anilist_id, use that. Otherwise use the key.
            const id = value.anilist_id || parseInt(key);
            if (id) {
                mappingsMap.set(String(id), value);
            }
        }

        const mergedList = animeList.map(anime => {
            const anilistId = String(anime.anilist_id);
            if (mappingsMap.has(anilistId)) {
                const mappingData = mappingsMap.get(anilistId);
                mergedCount++;

                // Merge strategies:
                // 1. Existing IDs in animeList take precedence? Or new ones?
                // Usually we want to ENRICH, so we add missing fields.
                // But mappings might have better ID data.
                // For now, we mainly want 'tvdb_mappings', 'tmdb_mappings' from the new source.

                return {
                    ...anime,
                    ...mappingData, // Overwrite/Add fields from mapping
                    // Ensure we don't break core IDs if they are missing in mapping but present in animeList
                    // combining arrays if both exist could be complex, let's just spread for now
                    // as the user wants "attach this repo... it give season list".
                    // The mappings repo has 'tvdb_mappings' and 'tmdb_mappings' which are key.
                };
            }
            return anime;
        });

        console.log(`Merged data for ${mergedCount} entries.`);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedList, null, 2));
        console.log(`Successfully wrote to ${OUTPUT_FILE}`);

        fs.writeFileSync(MAPPINGS_OUTPUT_FILE, JSON.stringify(mappings, null, 2));
        console.log(`Successfully wrote to ${MAPPINGS_OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error updating data:', error);
        process.exit(1);
    }
}

main();
