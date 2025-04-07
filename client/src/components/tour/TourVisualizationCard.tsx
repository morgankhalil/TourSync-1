
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, CalendarDays, MapPin } from 'lucide-react';

interface TourVisualizationCardProps {
  confirmedShows: number;
  pendingShows: number;
  totalCities: number;
  tourLength: number;
}

const TourVisualizationCard: React.FC<TourVisualizationCardProps> = ({
  confirmedShows,
  pendingShows,
  totalCities,
  tourLength
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tour Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <BarChart className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{confirmedShows}</span>
            <span className="text-sm text-muted-foreground">Confirmed Shows</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <BarChart className="h-8 w-8 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold">{pendingShows}</span>
            <span className="text-sm text-muted-foreground">Pending Shows</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <MapPin className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-2xl font-bold">{totalCities}</span>
            <span className="text-sm text-muted-foreground">Cities</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <CalendarDays className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-2xl font-bold">{tourLength}</span>
            <span className="text-sm text-muted-foreground">Days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TourVisualizationCard;
