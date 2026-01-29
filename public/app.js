const API_BASE = window.location.origin;

// DOM Elements
const refreshBtn = document.getElementById('refreshBtn');
const refreshText = document.getElementById('refreshText');
const loadingSpinner = document.getElementById('loadingSpinner');
const clipperStatsDiv = document.getElementById('clipperStats');
const addClipBtn = document.getElementById('addClipBtn');
const addClipForm = document.getElementById('addClipForm');
const clipForm = document.getElementById('clipForm');
const cancelBtn = document.getElementById('cancelBtn');

// Summary stat elements
const totalClipsEl = document.getElementById('totalClips');
const totalViewsEl = document.getElementById('totalViews');
const totalLikesEl = document.getElementById('totalLikes');
const totalEngagementEl = document.getElementById('totalEngagement');

// Event Listeners
refreshBtn.addEventListener('click', fetchAndDisplayStats);
addClipBtn.addEventListener('click', () => {
    addClipForm.style.display = 'block';
});
cancelBtn.addEventListener('click', () => {
    addClipForm.style.display = 'none';
    clipForm.reset();
});
clipForm.addEventListener('submit', handleAddClip);

// Format numbers with commas
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// Fetch and display stats
async function fetchAndDisplayStats() {
    try {
        // Disable button and show loading
        refreshBtn.disabled = true;
        refreshText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';

        const response = await fetch(`${API_BASE}/api/stats/by-clipper`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        displayStats(data);
    } catch (error) {
        console.error('Error fetching stats:', error);
        clipperStatsDiv.innerHTML = `
            <div class="error-message">
                Failed to fetch stats: ${error.message}
            </div>
        `;
    } finally {
        // Re-enable button and hide loading
        refreshBtn.disabled = false;
        refreshText.style.display = 'inline-block';
        loadingSpinner.style.display = 'none';
    }
}

// Display stats
function displayStats(clippers) {
    if (!clippers || clippers.length === 0) {
        clipperStatsDiv.innerHTML = '<div class="loading-message">No clips found. Add some clips to get started!</div>';
        return;
    }

    // Calculate summary stats
    const totalClips = clippers.reduce((sum, c) => sum + c.totalClips, 0);
    const totalViews = clippers.reduce((sum, c) => sum + c.totalViews, 0);
    const totalLikes = clippers.reduce((sum, c) => sum + c.totalLikes, 0);
    const totalEngagement = clippers.reduce((sum, c) => sum + c.totalLikes + c.totalComments + c.totalShares, 0);

    totalClipsEl.textContent = formatNumber(totalClips);
    totalViewsEl.textContent = formatNumber(totalViews);
    totalLikesEl.textContent = formatNumber(totalLikes);
    totalEngagementEl.textContent = formatNumber(totalEngagement);

    // Display clipper cards
    clipperStatsDiv.innerHTML = clippers.map((clipper, index) => {
        const platformBreakdown = Object.entries(clipper.platforms)
            .map(([platform, count]) => `
                <span class="platform-tag ${platform}">
                    ${platform.toUpperCase()}: ${count}
                </span>
            `).join('');

        const clipsList = clipper.clips.map(clip => {
            const hasError = clip.stats && clip.stats.error;
            return `
                <div class="clip-item">
                    <div class="clip-info">
                        <div class="clip-platform">${clip.platform}</div>
                        <div class="clip-stats">
                            ${hasError
                                ? `<span style="color: #c62828;">⚠️ ${clip.stats.error}</span>`
                                : `👁️ ${formatNumber(clip.stats.views || 0)} views |
                                   ❤️ ${formatNumber(clip.stats.likes || 0)} |
                                   💬 ${formatNumber(clip.stats.comments || 0)} |
                                   🔁 ${formatNumber(clip.stats.shares || 0)}`
                            }
                        </div>
                    </div>
                    <a href="${clip.url}" target="_blank" class="clip-url">View</a>
                </div>
            `;
        }).join('');

        return `
            <div class="clipper-card">
                <div class="clipper-header">
                    <div class="clipper-name">${clipper.clipper}</div>
                    <div class="clipper-rank">#${index + 1}</div>
                </div>

                <div class="clipper-metrics">
                    <div class="metric">
                        <div class="metric-value">${clipper.totalClips}</div>
                        <div class="metric-label">Clips</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${formatNumber(clipper.totalViews)}</div>
                        <div class="metric-label">Views</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${formatNumber(clipper.totalLikes)}</div>
                        <div class="metric-label">Likes</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${formatNumber(clipper.totalComments)}</div>
                        <div class="metric-label">Comments</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${formatNumber(clipper.totalShares)}</div>
                        <div class="metric-label">Shares</div>
                    </div>
                </div>

                <div class="platform-breakdown">
                    <h4>Platform Distribution</h4>
                    <div class="platform-tags">
                        ${platformBreakdown}
                    </div>
                </div>

                <div class="clips-list">
                    <h4>Individual Clips (${clipper.clips.length})</h4>
                    ${clipsList}
                </div>
            </div>
        `;
    }).join('');
}

// Handle adding a new clip
async function handleAddClip(e) {
    e.preventDefault();

    const clipper = document.getElementById('clipperName').value;
    const platform = document.getElementById('platform').value;
    const url = document.getElementById('clipUrl').value;

    try {
        const response = await fetch(`${API_BASE}/api/clips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clipper, platform, url })
        });

        if (!response.ok) throw new Error('Failed to add clip');

        const newClip = await response.json();
        console.log('Clip added:', newClip);

        // Reset form and hide
        clipForm.reset();
        addClipForm.style.display = 'none';

        // Refresh stats
        alert('Clip added successfully!');
    } catch (error) {
        console.error('Error adding clip:', error);
        alert('Failed to add clip: ' + error.message);
    }
}

// Initial message
console.log('Clipping Analytics Dashboard loaded');
