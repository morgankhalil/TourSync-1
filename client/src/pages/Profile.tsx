import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Band name must be at least 2 characters" }),
  description: z.string().optional(),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }),
  contactPhone: z.string().optional(),
  genre: z.string().optional(),
  social: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    website: z.string().optional()
  }).optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch band data (using ID 1 for demo)
  const { data: band, isLoading } = useQuery({
    queryKey: ['/api/bands/1'],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      genre: "",
      social: {
        twitter: "",
        instagram: "",
        facebook: "",
        website: ""
      }
    }
  });

  // Update form when band data is loaded
  useQuery({
    queryKey: ['/api/bands/1'],
    enabled: !!band,
    onSuccess: (data) => {
      form.reset({
        name: data.name,
        description: data.description || "",
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || "",
        genre: data.genre || "",
        social: data.social || {
          twitter: "",
          instagram: "",
          facebook: "",
          website: ""
        }
      });
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const response = await apiRequest("PUT", "/api/bands/1", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bands/1'] });
      toast({
        title: "Profile Updated",
        description: "Your band profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  function onSubmit(values: ProfileFormValues) {
    mutate(values);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 flex items-center gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Band Profile</CardTitle>
              <CardDescription>
                Manage your band's information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Band Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your band"
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="Rock, Pop, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Media</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="social.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="social.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <CardFooter className="px-0 pt-6 flex space-x-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary"
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      form.reset();
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </form>
            </Form>
          ) : band ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-1">Band Name</h3>
                <p>{band.name}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-1">Description</h3>
                <p>{band.description || "No description provided"}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Contact Email</h3>
                  <p>{band.contactEmail}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-1">Contact Phone</h3>
                  <p>{band.contactPhone || "Not provided"}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-1">Genre</h3>
                <p>{band.genre || "Not specified"}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-1">Social Media</h3>
                {band.social ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {band.social.twitter && (
                      <div>
                        <h4 className="text-sm font-medium">Twitter</h4>
                        <p>{band.social.twitter}</p>
                      </div>
                    )}
                    
                    {band.social.instagram && (
                      <div>
                        <h4 className="text-sm font-medium">Instagram</h4>
                        <p>{band.social.instagram}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No social media profiles provided</p>
                )}
              </div>
            </div>
          ) : (
            <p>Failed to load band profile</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
