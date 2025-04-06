
import React from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const EditVenue = () => {
  const { activeVenue, isLoading } = useActiveVenue();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateVenueMutation = useMutation({
    mutationFn: async (formData: Partial<typeof activeVenue>) => {
      if (!activeVenue?.id) throw new Error('No venue selected');
      const response = await fetch(`/api/venues/${activeVenue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to update venue');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      toast({ title: 'Success', description: 'Venue updated successfully' });
      setLocation('/venues');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update venue', variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!activeVenue) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>No venue selected</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    updateVenueMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Venue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Venue Name</Label>
              <Input id="name" name="name" defaultValue={activeVenue.name} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={activeVenue.address} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={activeVenue.city} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={activeVenue.state} />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" defaultValue={activeVenue.capacity} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateVenueMutation.isPending}>
                {updateVenueMutation.isPending ? <Spinner className="mr-2" /> : null}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation('/venues')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditVenue;
