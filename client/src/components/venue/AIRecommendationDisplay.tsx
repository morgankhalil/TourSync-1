
import { useState, useEffect } from 'react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { Band, Venue } from '@/types';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIRecommendationDisplayProps {
  band: Band;
  venues: Venue[];
}

export function AIRecommendationDisplay({ band, venues }: AIRecommendationDisplayProps) {
  const { data: recommendations, isLoading, error } = useAIRecommendations(band, venues);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing venue compatibility...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Unable to get recommendations at this time.
      </p>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">{recommendations}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-green-50">
          Genre Match
        </Badge>
        <Badge variant="outline" className="bg-blue-50">
          Capacity Fit
        </Badge>
        <Badge variant="outline" className="bg-purple-50">
          Route Optimized
        </Badge>
      </div>
    </div>
  );
}
