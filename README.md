# Dantotsu Mapper

Serverless API for mapping anime IDs between AniList and MyAnimeList (MAL).

## Features
- Maps AniList IDs to MyAnimeList IDs
- Maps MyAnimeList IDs to AniList IDs
- Cached responses for fast lookups
- Hosted on Vercel

## API Usage

### Get anime by AniList ID
```
GET https://your-url.vercel.app/api/mapper?anilist_id=20
```

### Get anime by MyAnimeList ID
```
GET https://your-url.vercel.app/api/mapper?mal_id=20
```

## Response Example
```json
{
  "anilist_id": 20,
  "mal_id": 20,
  "name": "Naruto"
}
```

## Deployment

This project is deployed on Vercel. Any push to the main branch automatically deploys the latest changes.

## Data Source
Data comes from [Fribb's anime-lists](https://github.com/Fribb/anime-lists)
