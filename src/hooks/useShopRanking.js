import { useMemo } from 'react';
import { computeCompositeScore, applyFilters } from '../utils/scoring';

/**
 * Custom hook to rank and filter shops based on:
 * - Composite score (SCA + Google rating + proximity)
 * - Active filters (brew methods, open now, price range)
 */
export function useShopRanking(shops, userLat, userLng, filters = {}) {
  return useMemo(() => {
    if (!shops || !userLat || !userLng) return [];

    // Add composite scores to each shop
    const shopsWithScores = shops.map((shop) => ({
      ...shop,
      compositeScore: computeCompositeScore(shop, userLat, userLng),
    }));

    // Apply filters
    const filtered = applyFilters(shopsWithScores, filters);

    // Sort by composite score (descending)
    return filtered.sort((a, b) => b.compositeScore - a.compositeScore);
  }, [shops, userLat, userLng, filters]);
}
