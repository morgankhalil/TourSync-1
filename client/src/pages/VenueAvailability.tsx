
import React from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const VenueAvailability = () => {
  const { activeVenue, isLoading: isVenueLoading } = useActiveVenue();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);

  const { data: availabilities, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: activeVenue ? [`/api/venues/${activeVenue.id}/availability`] : [],
    enabled: !!activeVenue
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (dates: Date[]) => {
      if (!activeVenue?.id) throw new Error('No venue selected');
      // Use the correct API endpoint for venue availability
      const response = await fetch(`/api/venues/${activeVenue.id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: dates.map(date => ({ date, isAvailable: true }))
        })
      });
      if (!response.ok) throw new Error('Failed to update availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${activeVenue?.id}/availability`] });
      toast({ title: 'Success', description: 'Availability updated successfully' });
      setSelectedDates([]);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update availability', variant: 'destructive' });
    }
  });

  if (isVenueLoading || isAvailabilityLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!activeVenue) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Please select a venue first</p>
      </div>
    );
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDates(prev => {
      const dateStr = date.toISOString();
      const exists = prev.find(d => d.toISOString() === dateStr);
      if (exists) {
        return prev.filter(d => d.toISOString() !== dateStr);
      }
      return [...prev, date];
    });
  };

  const handleSave = () => {
    if (selectedDates.length > 0) {
      updateAvailabilityMutation.mutate(selectedDates);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Venue Availability - {activeVenue.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={dates => setSelectedDates(dates || [])}
              className="rounded-md border"
            />
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleSave}
                disabled={selectedDates.length === 0 || updateAvailabilityMutation.isPending}
              >
                {updateAvailabilityMutation.isPending ? <Spinner className="mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueAvailability;
