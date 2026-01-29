# Clipping Analytics Dashboard

A full-stack analytics dashboard for tracking social media clip performance across TikTok, YouTube, and Twitter/X. Sort and analyze your clips by clipper with real-time stats on views, likes, comments, and shares.

## Features

- 📊 Track clips from TikTok, YouTube, and Twitter/X
- 👥 Organize and sort clips by clipper
- 📈 Real-time view counts, likes, comments, and shares
- 🎯 Aggregate statistics per clipper
- 🔄 On-demand data refresh
- ➕ Easy clip management (add/delete)
- 🎨 Beautiful, responsive dashboard

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Storage**: JSON file (simple and portable)
- **APIs**: TikTok, YouTube, Twitter/X

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Credentials

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then fill in your API credentials (see API Setup section below).

### 3. Run the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 4. Open Dashboard

Open your browser to: `http://localhost:3000`

## API Setup

### YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the API key to `.env` as `YOUTUBE_API_KEY`

**Note**: YouTube API has a daily quota of 10,000 units. Each stats request costs ~1 unit.

### Twitter/X API

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app (Free tier available)
3. Generate a **Bearer Token** from the app settings
4. Copy the token to `.env` as `TWITTER_BEARER_TOKEN`

**Note**: Free tier allows 1,500 tweets per month with v2 API.

### TikTok API

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Apply for API access (requires approval)
4. Get your Client Key and Client Secret
5. Add credentials to `.env`

**Note**: TikTok API access requires approval and may take several days. The app currently shows placeholder data for TikTok until you configure the API.

## Usage

### Adding Clips

**Option 1: Via Dashboard**
1. Click "Add Clip" button
2. Enter clipper name, platform, and URL
3. Submit

**Option 2: Manually Edit `clips.json`**
```json
{
  "clips": [
    {
      "id": "1",
      "clipper": "YourClipperName",
      "platform": "youtube",
      "url": "https://www.youtube.com/shorts/VIDEO_ID",
      "videoId": "VIDEO_ID",
      "addedAt": "2026-01-29T10:00:00Z"
    }
  ]
}
```

### Viewing Analytics

1. Click "Refresh Stats" to fetch latest data from all platforms
2. View aggregated stats by clipper (sorted by total views)
3. See platform breakdown for each clipper
4. Click "View" links to open clips

### Understanding Metrics

- **Views**: Total video views
- **Likes**: Number of likes
- **Comments**: Number of comments
- **Shares**: Number of shares/retweets
- **Engagement**: Likes + Comments + Shares

## Project Structure

```
clipping-analytics/
├── server.js           # Express server & API endpoints
├── clips.json          # Clip data storage
├── package.json        # Dependencies
├── .env                # API credentials (not in git)
├── .env.example        # Template for .env
├── public/
│   ├── index.html      # Dashboard UI
│   ├── styles.css      # Styling
│   └── app.js          # Frontend logic
└── README.md           # This file
```

## API Endpoints

### GET `/api/clips`
Get all clips

### POST `/api/clips`
Add a new clip
```json
{
  "clipper": "ClipperName",
  "platform": "youtube",
  "url": "https://..."
}
```

### GET `/api/stats/by-clipper`
Get aggregated stats sorted by clipper (fetches fresh data)

### GET `/api/stats/refresh`
Refresh all clip stats (returns array with stats)

### DELETE `/api/clips/:id`
Delete a clip by ID

## Rate Limiting

Social media APIs have rate limits:
- **YouTube**: 10,000 units/day
- **Twitter/X**: 1,500 tweets/month (free tier)
- **TikTok**: Varies by approval level

The app includes small delays between requests to avoid rate limiting.

## Troubleshooting

### "API key not configured" errors
- Make sure you've created a `.env` file
- Verify your API credentials are correct
- Check that `.env` is in the root directory

### No data showing up
- Click "Refresh Stats" to fetch data
- Check browser console for errors
- Verify clips have valid URLs and video IDs

### TikTok not working
- TikTok API requires approval, which can take time
- Make sure you've been approved for API access
- Check your Client Key and Secret are correct

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT License - feel free to use this for your own projects.

## Support

For issues and questions:
- Check the browser console for error messages
- Verify API credentials in `.env`
- Check that video URLs are valid and accessible

---

Built with ❤️ for content creators and clippers
