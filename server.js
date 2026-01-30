const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIPS_FILE = path.join(__dirname, 'clips.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to read clips from JSON file
async function readClips() {
  try {
    const data = await fs.readFile(CLIPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { clips: [] };
  }
}

// Helper function to write clips to JSON file
async function writeClips(data) {
  await fs.writeFile(CLIPS_FILE, JSON.stringify(data, null, 2));
}

// Extract video ID from URL
function extractVideoId(url, platform) {
  try {
    if (platform === 'facebook') {
      // Facebook video/post ID can be in various formats
      const match = url.match(/\/videos\/(\d+)|\/posts\/(\d+)|\/(\d+)\/videos\/(\d+)|story_fbid=(\d+)/);
      if (match) {
        return match[1] || match[2] || match[4] || match[5];
      }
      return null;
    } else if (platform === 'youtube') {
      const match = url.match(/shorts\/([a-zA-Z0-9_-]+)|v=([a-zA-Z0-9_-]+)/);
      return match ? (match[1] || match[2]) : null;
    } else if (platform === 'twitter') {
      const match = url.match(/status\/(\d+)/);
      return match ? match[1] : null;
    }
  } catch (error) {
    return null;
  }
  return null;
}

// Fetch Facebook video/post stats
async function fetchFacebookStats(postId) {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!accessToken) {
      return { views: 0, likes: 0, comments: 0, shares: 0, error: 'Facebook API token not configured' };
    }

    console.log('Fetching Facebook stats for:', postId);

    // Facebook Graph API - get video/post insights
    const response = await axios.get(`https://graph.facebook.com/v18.0/${postId}`, {
      params: {
        fields: 'engagement,likes.summary(true),comments.summary(true),shares',
        access_token: accessToken
      }
    });

    if (response.data) {
      const data = response.data;
      return {
        views: data.engagement?.count || 0,
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0
      };
    }
    return { views: 0, likes: 0, comments: 0, shares: 0, error: 'Post not found' };
  } catch (error) {
    console.error('Facebook API error:', error.message);
    return { views: 0, likes: 0, comments: 0, shares: 0, error: error.message };
  }
}

// Fetch YouTube video stats
async function fetchYouTubeStats(videoId) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return { views: 0, likes: 0, comments: 0, error: 'YouTube API key not configured' };
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'statistics',
        id: videoId,
        key: apiKey
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const stats = response.data.items[0].statistics;
      return {
        views: parseInt(stats.viewCount) || 0,
        likes: parseInt(stats.likeCount) || 0,
        comments: parseInt(stats.commentCount) || 0,
        shares: 0 // YouTube API doesn't provide share count
      };
    }
    return { views: 0, likes: 0, comments: 0, shares: 0, error: 'Video not found' };
  } catch (error) {
    console.error('YouTube API error:', error.message);
    return { views: 0, likes: 0, comments: 0, shares: 0, error: error.message };
  }
}

// Fetch Twitter/X video stats
async function fetchTwitterStats(tweetId) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      return { views: 0, likes: 0, comments: 0, shares: 0, error: 'Twitter API token not configured' };
    }

    const response = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
      params: {
        'tweet.fields': 'public_metrics'
      }
    });

    if (response.data && response.data.data) {
      const metrics = response.data.data.public_metrics;
      return {
        views: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0
      };
    }
    return { views: 0, likes: 0, comments: 0, shares: 0, error: 'Tweet not found' };
  } catch (error) {
    console.error('Twitter API error:', error.message);
    return { views: 0, likes: 0, comments: 0, shares: 0, error: error.message };
  }
}

// API Routes

// Get all clips
app.get('/api/clips', async (req, res) => {
  try {
    const data = await readClips();
    res.json(data.clips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new clip
app.post('/api/clips', async (req, res) => {
  try {
    const { clipper, platform, url } = req.body;

    if (!clipper || !platform || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const videoId = extractVideoId(url, platform);
    const data = await readClips();

    const newClip = {
      id: String(Date.now()),
      clipper,
      platform: platform.toLowerCase(),
      url,
      videoId,
      addedAt: new Date().toISOString()
    };

    data.clips.push(newClip);
    await writeClips(data);

    res.json(newClip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch fresh stats for all clips
app.get('/api/stats/refresh', async (req, res) => {
  try {
    const data = await readClips();
    const clipsWithStats = [];

    for (const clip of data.clips) {
      let stats = {};

      if (clip.platform === 'facebook' && clip.videoId) {
        stats = await fetchFacebookStats(clip.videoId);
      } else if (clip.platform === 'youtube' && clip.videoId) {
        stats = await fetchYouTubeStats(clip.videoId);
      } else if (clip.platform === 'twitter' && clip.videoId) {
        stats = await fetchTwitterStats(clip.videoId);
      }

      clipsWithStats.push({
        ...clip,
        stats
      });

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json(clipsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated stats by clipper
app.get('/api/stats/by-clipper', async (req, res) => {
  try {
    const data = await readClips();
    const clipperStats = {};

    for (const clip of data.clips) {
      if (!clipperStats[clip.clipper]) {
        clipperStats[clip.clipper] = {
          clipper: clip.clipper,
          totalClips: 0,
          platforms: {},
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          clips: []
        };
      }

      let stats = {};
      if (clip.platform === 'facebook' && clip.videoId) {
        stats = await fetchFacebookStats(clip.videoId);
      } else if (clip.platform === 'youtube' && clip.videoId) {
        stats = await fetchYouTubeStats(clip.videoId);
      } else if (clip.platform === 'twitter' && clip.videoId) {
        stats = await fetchTwitterStats(clip.videoId);
      }

      clipperStats[clip.clipper].totalClips++;
      clipperStats[clip.clipper].totalViews += stats.views || 0;
      clipperStats[clip.clipper].totalLikes += stats.likes || 0;
      clipperStats[clip.clipper].totalComments += stats.comments || 0;
      clipperStats[clip.clipper].totalShares += stats.shares || 0;

      // Track platform counts
      clipperStats[clip.clipper].platforms[clip.platform] =
        (clipperStats[clip.clipper].platforms[clip.platform] || 0) + 1;

      clipperStats[clip.clipper].clips.push({
        ...clip,
        stats
      });

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Convert to array and sort by total views
    const result = Object.values(clipperStats).sort((a, b) => b.totalViews - a.totalViews);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a clip
app.delete('/api/clips/:id', async (req, res) => {
  try {
    const data = await readClips();
    data.clips = data.clips.filter(clip => clip.id !== req.params.id);
    await writeClips(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Clipping Analytics Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
