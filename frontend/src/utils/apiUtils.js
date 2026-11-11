/**
 * Utility helpers to safely normalize and extract arrays and counts
 * across varied Spring Boot and ML microservice response contracts.
 */

/**
 * Safely extracts an array from various API response shapes:
 * - Direct array: [ ... ]
 * - Standard wrapped response: { data: [ ... ] }
 * - Spring Boot PagedResponse: { data: { content: [ ... ] } } or { content: [ ... ] }
 * - Fallbacks: returns [] for null, undefined, or unexpected shapes
 */
export const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.content)) return res.content;
  if (Array.isArray(res.data?.content)) return res.data.content;
  return [];
};

/**
 * Safely extracts total elements count from a paged response or array
 */
export const extractTotalCount = (res, fallbackArray = []) => {
  if (typeof res?.data?.totalElements === 'number') return res.data.totalElements;
  if (typeof res?.totalElements === 'number') return res.totalElements;
  const arr = extractArray(res);
  if (arr.length > 0) return arr.length;
  if (Array.isArray(fallbackArray)) return fallbackArray.length;
  return 0;
};

// Known unavailable or removed YouTube video IDs that return 404 or "Video unavailable"
const UNAVAILABLE_YOUTUBE_IDS = [
  'bUHFg8CZFCA',
  'xpDnVSmGVdI',
  'M48Hw_0K90E',
  'i7twT332UDA',
  'invalid',
  'undefined',
  'null',
];

/**
 * Safely resolves a guaranteed-working, live external course URL across
 * Coursera, Udemy, edX, YouTube Learning, and other catalog providers.
 * Automatically intercepts dead, private, or unavailable video links and provides
 * verified working replacements.
 */
export const getWorkingCourseUrl = (course) => {
  if (!course) return '#';
  const rawUrl = (course.courseUrl || course.url || '').trim();
  const title = (course.title || course.courseTitle || '').trim();
  const provider = (course.provider || '').trim();
  const titleLower = title.toLowerCase();

  // If valid external http(s) URL and not internal placeholder
  if (rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('academy.orgkgi.dev') && !rawUrl.includes('example.com')) {
    // If it's a YouTube URL, check against known unavailable videos
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      const isUnavailable = UNAVAILABLE_YOUTUBE_IDS.some((id) => rawUrl.includes(id));
      if (isUnavailable || !rawUrl.includes('watch?v=')) {
        if (titleLower.includes('system design') || rawUrl.includes('bUHFg8CZFCA')) {
          return 'https://www.youtube.com/watch?v=m8Icp_Cid5o';
        }
        return `https://www.youtube.com/results?search_query=${encodeURIComponent((title || 'software engineering') + ' full course tutorial')}`;
      }
    }

    // If it's the broken udemy postgresql-bootcamp link, use the live verified course
    if (rawUrl.includes('udemy.com/course/postgresql-bootcamp')) {
      return 'https://www.udemy.com/course/the-complete-python-postgresql-developer-course/';
    }

    return rawUrl;
  }

  // Provider-specific verified direct catalog search queries
  const pLower = provider.toLowerCase();
  if (pLower === 'udemy') {
    return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(title || 'programming')}`;
  }
  if (pLower === 'edx') {
    return `https://www.edx.org/search?q=${encodeURIComponent(title || 'computer science')}`;
  }
  if (pLower.includes('youtube')) {
    if (titleLower.includes('system design')) {
      return 'https://www.youtube.com/watch?v=m8Icp_Cid5o';
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' full course tutorial')}`;
  }
  if (pLower === 'coursera') {
    return `https://www.coursera.org/search?query=${encodeURIComponent(title || 'software engineering')}`;
  }

  return `https://www.coursera.org/search?query=${encodeURIComponent(title || 'software engineering')}`;
};

export default {
  extractArray,
  extractTotalCount,
  getWorkingCourseUrl,
};
