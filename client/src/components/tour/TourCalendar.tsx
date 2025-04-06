
import React from 'react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tour, TourDate } from '@/types';

interface TourCalendarProps {
  tour: Tour;
  tourDates: TourDate[];
}

const TourCalendar: React.FC<TourCalendarProps> = ({ tour, tourDates }) => {
  const handleExportCalendar = () => {
    window.open(`/api/calendar/tours/${tour.id}/calendar`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tour Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Calendar
            mode="multiple"
            selected={tourDates.map(date => new Date(date.date))}
            className="rounded-md border"
          />
          <Button onClick={handleExportCalendar} className="w-full">
            Export to Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TourCalendar;
