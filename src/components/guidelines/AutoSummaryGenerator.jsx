import { base44 } from "@/api/base44Client";

const SUMMARY_CACHE_KEY = 'guideline_summaries_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSummaryCache() {
  try {
    const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setSummaryCache(cache) {
  try {
    localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache summaries:', e);
  }
}

export async function generateGuidlineSummary(query) {
  if (!query || !query.id || !query.answer) {
    return null;
  }

  const cache = getSummaryCache();
  
  // Check if cached and still valid
  if (cache[query.id]) {
    const cached = cache[query.id];
    const now = Date.now();
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a concise, actionable clinical summary for this guideline. Focus on practicality.

Question: ${query.question}

Answer: ${query.answer.substring(0, 1000)}${query.answer.length > 1000 ? '...' : ''}

Confidence Level: ${query.confidence_level || 'moderate'}
Sources: ${query.sources?.slice(0, 2).join('; ') || 'Primary sources'}

Provide a summary with:

1. **Key Recommendation**: One clear, actionable sentence that a clinician can immediately apply
2. **Essential Points**: 2-3 critical clinical pearls (concise, specific, evidence-based)
3. **Evidence Note**: Brief statement about evidence quality and applicability

Keep the entire response under 100 words. Make it clinically actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          key_recommendation: {
            type: "string",
            description: "Single, clear actionable recommendation"
          },
          essential_points: {
            type: "array",
            items: { type: "string" },
            description: "2-3 critical clinical points"
          },
          evidence_note: {
            type: "string",
            description: "Brief evidence quality note"
          }
        }
      }
    });

    // Cache the result
    cache[query.id] = {
      data: result,
      timestamp: Date.now()
    };
    setSummaryCache(cache);

    return result;
  } catch (error) {
    console.error(`Failed to generate summary for ${query.id}:`, error);
    return null;
  }
}

export async function generateMultipleSummaries(queries) {
  if (!queries || queries.length === 0) return {};

  const summaries = {};
  const cache = getSummaryCache();
  const now = Date.now();

  // Separate cached vs new
  const queriesNeedingSummary = [];
  
  queries.forEach(query => {
    if (cache[query.id] && (now - cache[query.id].timestamp < CACHE_DURATION)) {
      summaries[query.id] = cache[query.id].data;
    } else {
      queriesNeedingSummary.push(query);
    }
  });

  // Generate summaries for new ones in parallel (limit to 5 at a time)
  if (queriesNeedingSummary.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < queriesNeedingSummary.length; i += batchSize) {
      const batch = queriesNeedingSummary.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(q => generateGuidlineSummary(q))
      );
      
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          summaries[batch[idx].id] = result.value;
        }
      });
    }
  }

  return summaries;
}

export function clearSummaryCache() {
  try {
    localStorage.removeItem(SUMMARY_CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}