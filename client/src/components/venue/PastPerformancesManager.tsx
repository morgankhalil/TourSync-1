import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  PastPerformance, 
  AddPastPerformanceRequest, 
  generatePastPerformanceId, 
  groupPerformancesByYear,
  PastPerformancesByYear 
} from "@/types/pastPerformance";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Validation schema for adding/editing a past performance
const pastPerformanceSchema = z.object({
  artistName: z.string().min(1, "Artist name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  genre: z.string().optional(),
  drawSize: z.coerce.number().int().positive().optional(),
  ticketPrice: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  poster: z.string().url().optional().or(z.literal("")),
  isSoldOut: z.boolean().optional(),
  isHeadliner: z.boolean().optional()
});

type FormValues = z.infer<typeof pastPerformanceSchema>;

interface PastPerformancesManagerProps {
  venueId: number;
}

export default function PastPerformancesManager({ venueId }: PastPerformancesManagerProps) {
  const [activeTab, setActiveTab] = useState<"add" | "view">("view");
  const [editingPerformance, setEditingPerformance] = useState<PastPerformance | null>(null);
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(pastPerformanceSchema),
    defaultValues: {
      artistName: "",
      date: new Date().toISOString().split("T")[0],
      genre: "",
      drawSize: undefined,
      ticketPrice: undefined,
      notes: "",
      poster: "",
      isSoldOut: false,
      isHeadliner: false
    }
  });

  // Reset form when switching to add tab
  useEffect(() => {
    if (activeTab === "add" && !editingPerformance) {
      form.reset();
    }
  }, [activeTab, form, editingPerformance]);

  // Update form values when editing a performance
  useEffect(() => {
    if (editingPerformance) {
      form.reset({
        artistName: editingPerformance.artistName,
        date: editingPerformance.date,
        genre: editingPerformance.genre || "",
        drawSize: editingPerformance.drawSize,
        ticketPrice: editingPerformance.ticketPrice,
        notes: editingPerformance.notes || "",
        poster: editingPerformance.poster || "",
        isSoldOut: editingPerformance.isSoldOut || false,
        isHeadliner: editingPerformance.isHeadliner || false
      });
      setActiveTab("add");
    }
  }, [editingPerformance, form]);

  // Fetch past performances
  const {
    data: performances = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/venues", venueId, "performances"],
    queryFn: async () => {
      const result = await apiRequest(`/api/venues/${venueId}/performances`);
      return result as PastPerformance[];
    },
    staleTime: 60000
  });

  // Group performances by year
  const performancesByYear: PastPerformancesByYear = groupPerformancesByYear(performances);

  // Add performance mutation
  const addMutation = useMutation({
    mutationFn: (data: AddPastPerformanceRequest) => 
      apiRequest(`/api/venues/${venueId}/performances`, { 
        method: "POST", 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues", venueId, "performances"] });
      toast({
        title: "Success",
        description: "Performance has been added",
        variant: "default"
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding performance",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update performance mutation
  const updateMutation = useMutation({
    mutationFn: ({ performanceId, data }: { performanceId: string; data: Partial<PastPerformance> }) =>
      apiRequest(`/api/venues/${venueId}/performances/${performanceId}`, { 
        method: "PUT", 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues", venueId, "performances"] });
      toast({
        title: "Success",
        description: "Performance has been updated",
        variant: "default"
      });
      setEditingPerformance(null);
      form.reset();
      setActiveTab("view");
    },
    onError: (error: any) => {
      toast({
        title: "Error updating performance",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete performance mutation
  const deleteMutation = useMutation({
    mutationFn: (performanceId: string) =>
      apiRequest(`/api/venues/${venueId}/performances/${performanceId}`, { 
        method: "DELETE" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues", venueId, "performances"] });
      toast({
        title: "Success",
        description: "Performance has been deleted",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting performance",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    if (editingPerformance) {
      updateMutation.mutate({
        performanceId: editingPerformance.id,
        data: values
      });
    } else {
      addMutation.mutate(values);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPerformance(null);
    form.reset();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Past Performances</CardTitle>
        <CardDescription>
          Manage the artists who have performed at your venue in the past
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "add" | "view")}>
          <TabsList className="mb-4">
            <TabsTrigger value="view">View Performances</TabsTrigger>
            <TabsTrigger value="add">
              {editingPerformance ? "Edit Performance" : "Add Performance"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view">
            {isLoading ? (
              <div className="text-center py-8">Loading performances...</div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500">
                Error loading performances: {(error as Error).message}
              </div>
            ) : Object.keys(performancesByYear).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No past performances found. Add your first one!
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {Object.keys(performancesByYear)
                  .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years in descending order
                  .map((year) => (
                    <AccordionItem key={year} value={year}>
                      <AccordionTrigger>
                        <span className="font-semibold">{year}</span>
                        <Badge variant="outline" className="ml-2">
                          {performancesByYear[year].length} shows
                        </Badge>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {performancesByYear[year]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((performance) => (
                              <Card key={performance.id} className="p-3 md:p-4 relative">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="font-bold text-lg">{performance.artistName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(performance.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        {performance.isHeadliner && (
                                          <Badge>Headliner</Badge>
                                        )}
                                        {performance.isSoldOut && (
                                          <Badge variant="destructive">Sold Out</Badge>
                                        )}
                                      </div>
                                    </div>

                                    {performance.genre && (
                                      <p className="text-sm mt-2">
                                        <span className="font-semibold">Genre:</span> {performance.genre}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-x-4 mt-2">
                                      {performance.drawSize && (
                                        <p className="text-sm">
                                          <span className="font-semibold">Attendance:</span> {performance.drawSize}
                                        </p>
                                      )}

                                      {performance.ticketPrice && (
                                        <p className="text-sm">
                                          <span className="font-semibold">Ticket:</span> ${(performance.ticketPrice / 100).toFixed(2)}
                                        </p>
                                      )}
                                    </div>

                                    {performance.notes && (
                                      <p className="text-sm mt-2 text-muted-foreground">
                                        {performance.notes}
                                      </p>
                                    )}
                                  </div>

                                  {performance.poster && (
                                    <div className="sm:w-24 w-full flex justify-center">
                                      <img 
                                        src={performance.poster} 
                                        alt={`${performance.artistName} poster`} 
                                        className="h-24 object-contain rounded-md"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 mt-4 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPerformance(performance)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this performance?")) {
                                        deleteMutation.mutate(performance.id);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter artist name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Format: YYYY-MM-DD</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Rock, Jazz, Hip-Hop" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="drawSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendance</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Number of attendees" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ticketPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Price (in cents)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 1500 for $15.00" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Enter price in cents (e.g. 1500 for $15.00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="poster"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poster URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/poster.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>URL to an image of the show poster</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isSoldOut"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sold Out</FormLabel>
                          <FormDescription>
                            Check if the show was sold out
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isHeadliner"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Headliner</FormLabel>
                          <FormDescription>
                            Check if this artist was the headlining act
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about the performance" 
                          className="h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  {editingPerformance && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    disabled={addMutation.isPending || updateMutation.isPending}
                  >
                    {editingPerformance 
                      ? (updateMutation.isPending ? "Updating..." : "Update Performance")
                      : (addMutation.isPending ? "Adding..." : "Add Performance")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}