---
title: Anime ID Mapper
emoji: 🐰
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Anime Mapper

A high-performance Serverless API designed to map anime IDs across various platforms (AniList, MyAnimeList, Kitsu, TVDB, IMDB, and more).

## 🚀 Features
- **Multi-Platform Support**: Maps IDs between AniList, MAL, TheTVDB, TheMovieDB, Kitsu, LiveChart, and more.
- **High Performance**: 
    - **In-Memory Caching**: Reduces external data fetching by caching the mapping dataset for 24 hours.
    - **Edge Caching**: Responses are cached at the edge for 24 hours (`s-maxage=86400`).
- **Status Dashboard**: A beautiful Material 3 Design status page to monitor API health, uptime, and request statistics.
- **Serverless Ready**: Optimized for Vercel deployment.

## 🛠 API Usage

### Base URL
`GET /api/mapper`

### Query Parameters
Search by any of the following ID types:

| Parameter | Description |
| :--- | :--- |
| `anilist_id` | Search by AniList ID |
| `mal_id` | Search by MyAnimeList ID |
| `thetvdb_id` | Search by TheTVDB ID |
| `imdb_id` | Search by IMDB ID |
| `anisearch_id` | Search by AniSearch ID |
| `themoviedb_id` | Search by TheMovieDB ID |
| `kitsu_id` | Search by Kitsu ID |
| `notify.moe_id` | Search by notify.moe ID |
| `simkl_id` | Search by Simkl ID |
| `livechart_id` | Search by LiveChart ID |
| `anime-planet_id` | Search by Anime-Planet ID |
| `anidb_id` | Search by AniDB ID |
| `animecountdown_id` | Search by AnimeCountdown ID |

### Examples

#### Get anime by AniList ID
```http
GET https://idmapper.vercel.app/api/mapper?anilist_id=21
```

#### Get anime by MyAnimeList ID
```http
GET https://idmapper.vercel.app/api/mapper?mal_id=21
```

#### Get anime by IMDB ID
```http
GET https://idmapper.vercel.app/api/mapper?imdb_id=tt0388629
```

#### Get anime by TheTVDB ID
```http
GET https://idmapper.vercel.app/api/mapper?thetvdb_id=81797
```

## 📦 Response Example
The API returns a comprehensive set of IDs for the matched anime.

```json
{
  "thetvdb_id": 81797,
  "imdb_id": [
    "tt0388629",
    "tt0975705",
    "tt1003286",
    "tt1010037",
    "tt1012787",
    "tt11744496",
    "tt11757066",
    "tt16900366",
    "tt16900692",
    "tt20874716",
    "tt2598466",
    "tt3354344",
    "tt3354352",
    "tt5098548",
    "tt6425816",
    "tt6597356",
    "tt6609162"
  ],
  "anisearch_id": 2227,
  "themoviedb_id": 37854,
  "kitsu_id": 12,
  "mal_id": [21, 1094, 1237, 1238, 2020, 2680, 8171, 15323, 16143, 16239, 19123, 25161, 31289, 32051, 32437, 33338, 36215, 36239, 37902, 50696, 51162, 51163, 52199, 52921, 53235, 53890, 55289, 55647, 57556, 58015, 58663, 59029, 59596, 59908, 60022, 60108, 60790, 61393, 61674, 61892, 62394, 62593, 62969],
  "type": "TV",
  "notify.moe_id": "jdZp5KmiR",
  "simkl_id": 38636,
  "anilist_id": 21,
  "livechart_id": 321,
  "anime-planet_id": "one-piece",
  "anidb_id": 69,
  "animecountdown_id": 38636,
  "tmdb_mappings": {
    "s1": "e1-e61",
    "s2": "e62-e77",
    "s3": "e78-e91",
    "s4": "e92-e130",
    "s5": "e131-e143",
    "s6": "e144-e195",
    "s7": "e196-e228",
    "s8": "e229-e263",
    "s9": "e264-e336",
    "s10": "e337-e381",
    "s11": "e382-e407",
    "s12": "e408-e421",
    "s13": "e422-e522",
    "s14": "e523-e580",
    "s15": "e581-e642",
    "s16": "e643-e692",
    "s17": "e693-e748",
    "s18": "e749-e803",
    "s19": "e804-e877",
    "s20": "e878-e891",
    "s21": "e892-e1088",
    "s22": "e1089-"
  },
  "tmdb_show_id": 37854,
  "tvdb_id": 81797,
  "tvdb_mappings": {
    "s0": "e39",
    "s1": "e1-e8",
    "s2": "e1-e22",
    "s3": "e1-e17",
    "s4": "e1-e13",
    "s5": "e1-e9",
    "s6": "e1-e22",
    "s7": "e1-e39",
    "s8": "e1-e13",
    "s9": "e1-e52",
    "s10": "e1-e31",
    "s11": "e1-e99",
    "s12": "e1-e56",
    "s13": "e1-e100",
    "s14": "e1-e35",
    "s15": "e1-e62",
    "s16": "e1-e49",
    "s17": "e1-e118",
    "s18": "e1-e33",
    "s19": "e1-e98",
    "s20": "e1-e14",
    "s21": "e1-e194",
    "s22": ""
  }
}
```

## 📊 Status Page
**[Status](https://idmapper.vercel.app/)**

Visit the Status Dashboard to view:
- **System Status**: Real-time operational status.
- **Statistics**: View Total Requests, Daily Requests, and detailed Uptime.
- **Documentation**: Toggleable interactive documentation directly on the page.

## 💻 Local Development

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.

## 📂 Data Source
- **Anime Lists**: [Fribb's anime-lists](https://github.com/Fribb/anime-lists)
- **Mapping Data**: [PlexAniBridge-Mappings](https://github.com/eliasbenb/PlexAniBridge-Mappings)
- **Merged File**: `public/master_anime.json` (Combined & Self-Hosted)
- Data is cached in memory for 24 hours to minimize external fetching

## 🔄 Automated Updates
A GitHub Actions workflow automatically checks for updates from the upstream repository daily:
- **Schedule**: Runs daily at 2 AM UTC / `0 0 * * *`
- **Action**: Executes `scripts/update-data.js` to download fresh data, merge mappings, and update `public/master_anime.json`.
- **Manual Trigger**: Can be manually triggered from the Actions tab
- **Workflow**: `.github/workflows/update-anime-list.yml`


## ☁️ Deployment

### Hybrid Architecture
This project is configured to run seamlessly on both **Vercel** and **Hugging Face Spaces**.

#### Vercel (Serverless)
- Uses `vercel.json` configuration.
- Routes requests to `api/index.js`.
- Optimized for cold starts and edge caching.

#### Hugging Face Spaces (Docker)
- Uses `Dockerfile` configuration.
- Runs `server.js` as a standard Node.js application.
- Auto-synced via GitHub Actions (`.github/workflows/huggingface-sync.yml`).
- Runs on Port `7860`.

### Deploying to Hugging Face
1. Create a **Docker** Space on Hugging Face.
2. Add your `HF_TOKEN` to GitHub Secrets.
3. Push to `main` branch.
   - The GitHub Action will automatically sync your code to the Space.
   - The `Dockerfile` will install dependencies and start the server on the correct port.
