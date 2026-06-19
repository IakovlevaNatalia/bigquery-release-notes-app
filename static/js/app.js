/* -------------------------------------------------------------
   BigQuery Release Notes Tracker - Frontend JavaScript
   Handles fetching, caching, filtering, statistics animation, and X (Twitter) integration.
   ------------------------------------------------------------- */

// App State
let allNotes = [];
let activeFilter = 'all';
let searchQuery = '';
let selectedNote = null;

// DOM Elements
const feedContainer = document.getElementById('feedContainer');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const syncIcon = document.getElementById('syncIcon');
const syncStatus = document.getElementById('syncStatus');
const resultsCount = document.getElementById('resultsCount');

// Statistics Elements
const valTotal = document.getElementById('valTotal');
const valFeatures = document.getElementById('valFeatures');
const valIssues = document.getElementById('valIssues');
const valLatest = document.getElementById('valLatest');

// Filter Chips
const filterChipsContainer = document.getElementById('filterChips');
const chipCounts = {
    all: document.getElementById('cntAll'),
    feature: document.getElementById('cntFeature'),
    issue: document.getElementById('cntIssue'),
    changed: document.getElementById('cntChanged'),
    announcement: document.getElementById('cntAnnouncement'),
    other: document.getElementById('cntOther')
};

// State Blocks
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const retryBtn = document.getElementById('retryBtn');

// Modal Elements
const tweetModal = document.getElementById('tweetModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelTweetBtn = document.getElementById('cancelTweetBtn');
const shareTweetBtn = document.getElementById('shareTweetBtn');
const tweetTextarea = document.getElementById('tweetTextarea');
const charCount = document.getElementById('charCount');
const modalTag = document.getElementById('modalTag');
const modalDate = document.getElementById('modalDate');
const modalSnippet = document.getElementById('modalSnippet');
const tagHelpers = document.querySelectorAll('.tag-helper');

// Document Ready
window.addEventListener('DOMContentLoaded', () => {
    // Initial Fetch
    fetchReleaseNotes(false);

    // Event Listeners
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search input typing
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        applyFiltersAndSearch();
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        toggleClearSearchButton();
        searchInput.focus();
        applyFiltersAndSearch();
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Filter Chips click
    filterChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        // Update active class
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeFilter = chip.dataset.filter;
        applyFiltersAndSearch();
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Retry on error
    retryBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Modal closing
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on outside click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Tweet character counter
    tweetTextarea.addEventListener('input', updateCharCount);

    // Hashtag shortcuts
    tagHelpers.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagText = tag.dataset.tag;
            const currentText = tweetTextarea.value;
            
            // Check if hashtag already exists
            if (currentText.includes(tagText)) return;
            
            // Append hashtag with proper spacing
            if (currentText.length + tagText.length + 1 <= 280) {
                const spacing = currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '';
                tweetTextarea.value = currentText + spacing + tagText;
                updateCharCount();
            }
        });
    });

    // Share/Post to X button
    shareTweetBtn.addEventListener('click', handleTweetPost);
}

// Fetch notes from Flask API
async function fetchReleaseNotes(forceRefresh = false) {
    // Set Loading State
    setLoadingState(true);
    
    const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const res = await response.json();
        
        if (res.status === 'error') {
            throw new Error(res.message);
        }

        allNotes = res.data;
        
        // Show status message with source (live/cache)
        const formatTime = new Date(res.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (res.status === 'warning') {
            syncStatus.textContent = `Sync warning: ${res.message}`;
            syncStatus.parentElement.querySelector('.status-dot').style.backgroundColor = '#fbbc05';
            syncStatus.parentElement.querySelector('.status-dot').style.boxShadow = '0 0 8px #fbbc05';
        } else {
            const sourceStr = res.source === 'live' ? 'Synced live' : 'Fetched from cache';
            syncStatus.textContent = `${sourceStr} at ${formatTime}`;
            syncStatus.parentElement.querySelector('.status-dot').style.backgroundColor = '#10b981';
            syncStatus.parentElement.querySelector('.status-dot').style.boxShadow = '0 0 8px #10b981';
        }

        // Process and display data
        updateDashboardMetrics();
        applyFiltersAndSearch();
        
        // Hide error state
        errorState.style.display = 'none';
        
    } catch (error) {
        console.error("Error fetching release notes:", error);
        errorMessage.textContent = error.message || "Failed to load release notes from server.";
        
        // Only show full error screen if we have no current notes to display
        if (allNotes.length === 0) {
            feedContainer.innerHTML = '';
            errorState.style.display = 'block';
            emptyState.style.display = 'none';
        } else {
            // Show toast/status warning instead
            syncStatus.textContent = `Sync failed. Showing offline data.`;
            syncStatus.parentElement.querySelector('.status-dot').style.backgroundColor = '#ea4335';
            syncStatus.parentElement.querySelector('.status-dot').style.boxShadow = '0 0 8px #ea4335';
        }
    } finally {
        setLoadingState(false);
    }
}

// Toggle loading skeleton and spinner animation
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
        
        // Show loading skeletons in feed container
        feedContainer.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    } else {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
        lucide.createIcons();
    }
}

// Calculate and animate dashboard figures
function updateDashboardMetrics() {
    const total = allNotes.length;
    const features = allNotes.filter(n => normalizeCategory(n.type) === 'feature').length;
    const issues = allNotes.filter(n => normalizeCategory(n.type) === 'issue').length;
    
    // Find latest release date
    let latestDate = '-';
    if (total > 0) {
        latestDate = allNotes[0].date;
    }

    // Animate stats values
    animateValue(valTotal, 0, total, 800);
    animateValue(valFeatures, 0, features, 800);
    animateValue(valIssues, 0, issues, 800);
    valLatest.textContent = latestDate;

    // Update Filter Chip Counts
    updateFilterCounts();
}

// Helper to animate numbers
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Map the raw update type (h3 content) to one of our filter categories
function normalizeCategory(type) {
    if (!type) return 'other';
    const t = type.toLowerCase().trim();
    if (t.includes('feature') || t.includes('introducing') || t.includes('ga') || t.includes('preview')) {
        return 'feature';
    }
    if (t.includes('issue') || t.includes('bug') || t.includes('fix') || t.includes('resolved')) {
        return 'issue';
    }
    if (t.includes('change') || t.includes('deprecat') || t.includes('notice') || t.includes('remove') || t.includes('support')) {
        return 'changed';
    }
    if (t.includes('announcement') || t.includes('welcome')) {
        return 'announcement';
    }
    return 'other';
}

// Calculate and refresh category counters for filter chips
function updateFilterCounts() {
    const counts = {
        all: allNotes.length,
        feature: 0,
        issue: 0,
        changed: 0,
        announcement: 0,
        other: 0
    };

    allNotes.forEach(note => {
        const cat = normalizeCategory(note.type);
        if (counts.hasOwnProperty(cat)) {
            counts[cat]++;
        } else {
            counts.other++;
        }
    });

    // Render count bubbles
    Object.keys(counts).forEach(key => {
        if (chipCounts[key]) {
            chipCounts[key].textContent = counts[key];
        }
    });
}

// Process filters and query match in real time
function applyFiltersAndSearch() {
    let filtered = allNotes;

    // 1. Apply category filter
    if (activeFilter !== 'all') {
        filtered = filtered.filter(note => {
            const cat = normalizeCategory(note.type);
            return cat === activeFilter;
        });
    }

    // 2. Apply text search query
    if (searchQuery) {
        filtered = filtered.filter(note => {
            const typeMatch = note.type.toLowerCase().includes(searchQuery);
            const dateMatch = note.date.toLowerCase().includes(searchQuery);
            const contentMatch = note.content.toLowerCase().includes(searchQuery);
            return typeMatch || dateMatch || contentMatch;
        });
    }

    // Update Results Meta text
    if (searchQuery || activeFilter !== 'all') {
        resultsCount.textContent = `Found ${filtered.length} matching update${filtered.length === 1 ? '' : 's'}`;
    } else {
        resultsCount.textContent = `Showing all ${filtered.length} updates`;
    }

    // Render filtered list
    renderNotesList(filtered);
}

// Render release note cards to grid
function renderNotesList(notes) {
    if (notes.length === 0) {
        feedContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    let html = '';
    notes.forEach(note => {
        const category = normalizeCategory(note.type);
        
        html += `
            <article class="note-card ${category}" data-id="${note.id}">
                <div class="note-header">
                    <span class="tag-badge ${category}">${note.type}</span>
                    <span class="note-date">${note.date}</span>
                </div>
                <div class="note-body">
                    ${note.content}
                </div>
                <div class="note-footer">
                    <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="link-original">
                        <span>Original Feed</span>
                        <i data-lucide="external-link"></i>
                    </a>
                    <button class="btn-tweet" onclick="openTweetComposer('${note.id}')">
                        <i data-lucide="twitter"></i>
                        <span>Tweet Update</span>
                    </button>
                </div>
            </article>
        `;
    });

    feedContainer.innerHTML = html;
    
    // Create icons on dynamic content
    lucide.createIcons();
}

// Reset search and chips back to 'All'
function resetFilters() {
    searchInput.value = '';
    searchQuery = '';
    activeFilter = 'all';
    
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.getElementById('chipAll').classList.add('active');
    
    toggleClearSearchButton();
    applyFiltersAndSearch();
}

// Show/Hide search clear button
function toggleClearSearchButton() {
    if (searchQuery.length > 0) {
        clearSearchBtn.style.display = 'flex';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

// Strip HTML tags using the browser's DOM parser
function stripHtmlTags(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Handle specific spacings
    let text = tempDiv.textContent || tempDiv.innerText || "";
    
    // Remove extra whitespaces
    return text.replace(/\s+/g, ' ').trim();
}

// Launch custom tweet drafting composer modal
function openTweetComposer(noteId) {
    selectedNote = allNotes.find(n => n.id === noteId);
    if (!selectedNote) return;

    // Reset fields
    const strippedText = stripHtmlTags(selectedNote.content);
    
    // Setup Modal Metadata Panel
    modalTag.className = `preview-tag ${normalizeCategory(selectedNote.type)}`;
    modalTag.textContent = selectedNote.type;
    modalDate.textContent = selectedNote.date;
    modalSnippet.textContent = strippedText;

    // Format initial Tweet draft:
    // "BigQuery Update [Feature] (June 15): StripText... Details: URL #BigQuery"
    const prefix = `BigQuery Update [${selectedNote.type}] (${selectedNote.date.split(',')[0]}): `;
    const suffix = `\n\nLink: ${selectedNote.link} #BigQuery`;
    
    // Calculate how much text from the note can fit
    const availableLength = 280 - prefix.length - suffix.length;
    
    let noteText = strippedText;
    if (noteText.length > availableLength) {
        noteText = noteText.substring(0, availableLength - 3) + '...';
    }
    
    const draftText = `${prefix}"${noteText}"${suffix}`;
    
    tweetTextarea.value = draftText;
    updateCharCount();

    // Display modal
    tweetModal.style.display = 'flex';
    tweetTextarea.focus();
    tweetTextarea.setSelectionRange(tweetTextarea.value.length, tweetTextarea.value.length);
}

// Close tweet modal
function closeTweetModal() {
    tweetModal.style.display = 'none';
    selectedNote = null;
}

// Update character counter in modal
function updateCharCount() {
    const len = tweetTextarea.value.length;
    charCount.textContent = len;
    
    if (len > 280) {
        charCount.classList.add('warning');
        shareTweetBtn.disabled = true;
    } else {
        charCount.classList.remove('warning');
        shareTweetBtn.disabled = false;
    }
}

// Web intent opening
function handleTweetPost() {
    if (!tweetTextarea.value.trim() || tweetTextarea.value.length > 280) return;
    
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTextarea.value)}`;
    
    // Open in a new tab/window
    window.open(tweetUrl, '_blank', 'width=550,height=420,toolbar=0,status=0');
    
    closeTweetModal();
}
