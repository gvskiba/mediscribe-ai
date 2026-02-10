import { useEffect } from "react";

export function trackGuidelineView(guidelineId) {
  const viewHistory = JSON.parse(localStorage.getItem('guidelineViewHistory') || '[]');
  if (!viewHistory.includes(guidelineId)) {
    viewHistory.unshift(guidelineId);
    // Keep only last 50 views
    localStorage.setItem('guidelineViewHistory', JSON.stringify(viewHistory.slice(0, 50)));
  }
}

export function trackGuidelineSearch(searchQuery) {
  if (!searchQuery || searchQuery.length < 3) return;
  
  const searchHistory = JSON.parse(localStorage.getItem('guidelineSearchHistory') || '[]');
  if (!searchHistory.includes(searchQuery)) {
    searchHistory.unshift(searchQuery);
    // Keep only last 20 searches
    localStorage.setItem('guidelineSearchHistory', JSON.stringify(searchHistory.slice(0, 20)));
  }
}

export function useGuidelineTracking(guidelineId, searchQuery) {
  useEffect(() => {
    if (guidelineId) {
      trackGuidelineView(guidelineId);
    }
  }, [guidelineId]);

  useEffect(() => {
    if (searchQuery) {
      trackGuidelineSearch(searchQuery);
    }
  }, [searchQuery]);
}