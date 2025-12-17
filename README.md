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
  "imdb_id": "tt0388629",
  "anisearch_id": 2227,
  "themoviedb_id": 37854,
  "kitsu_id": 12,
  "mal_id": 21,
  "type": "TV",
  "notify.moe_id": "jdZp5KmiR",
  "simkl_id": 38636,
  "anilist_id": 21,
  "livechart_id": 321,
  "anime-planet_id": "one-piece",
  "anidb_id": 69,
  "animecountdown_id": 38636
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
- **Local CDN**: `public/anime-list-full.json` (cloned from the source repository)
- **Original Source**: [Fribb's anime-lists](https://github.com/Fribb/anime-lists)
- Data is cached in memory for 24 hours to minimize external fetching

## 🔄 Automated Updates
A GitHub Actions workflow automatically checks for updates from the upstream repository daily:
- **Schedule**: Runs daily at 2 AM UTC
- **Action**: Downloads the latest `anime-list-full.json` and commits changes if detected
- **Manual Trigger**: Can be manually triggered from the Actions tab
- **Workflow**: `.github/workflows/update-anime-list.yml`

