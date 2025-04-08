import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVenueOptions } from '@/hooks/useVenues';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Form validation schema
const registrationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
  userType: z.enum(['artist', 'venue', 'fan'], {
    required_error: 'Please select a user type',
  }),
  existingVenueId: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(
  (data) => !(data.userType === 'venue' && !data.existingVenueId),
  {
    message: 'Please select your venue',
    path: ['existingVenueId'],
  }
);

// Type for form values
type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: venueOptions, isLoading: isLoadingVenues } = useVenueOptions();

  // Initialize form with react-hook-form
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'artist',
      existingVenueId: undefined,
    },
  });
  
  // Set up watch for user type changes
  const userType = form.watch('userType');
  const showVenueSelector = userType === 'venue';

  // Handle form submission
  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare registration data
      const registrationData: any = {
        name: values.name,
        email: values.email,
        password: values.password,
        userType: values.userType,
      };

      // Add venue ID if user type is venue and a venue was selected
      if (values.userType === 'venue' && values.existingVenueId) {
        registrationData.existingVenueId = Number(values.existingVenueId);
      }
      
      // Log the registration data for debugging
      console.log('Submitting registration with data:', {
        ...registrationData,
        password: '[REDACTED]'
      });
      
      const success = await registerUser(registrationData);
      
      if (success) {
        toast({
          title: 'Registration successful',
          description: 'Welcome to the platform!',
          variant: 'default',
        });
        // Redirect to dashboard
        setLocation('/');
      } else {
        toast({
          title: 'Registration failed',
          description: 'Email may already be in use. Please try again with a different email.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'An error occurred during registration';
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="your@email.com" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>I am a</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="artist" id="artist" />
                      <Label htmlFor="artist">Artist</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="venue" id="venue" />
                      <Label htmlFor="venue">Venue</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fan" id="fan" />
                      <Label htmlFor="fan">Fan</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Venue selector - only visible when user type is 'venue' */}
          {showVenueSelector && (
            <FormField
              control={form.control}
              name="existingVenueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select your venue</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingVenues ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            <span className="text-sm">Loading venues...</span>
                          </div>
                        ) : venueOptions?.venues && venueOptions.venues.length > 0 ? (
                          venueOptions.venues.map((venue) => (
                            <SelectItem key={venue.id} value={String(venue.id)}>
                              {venue.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No venues found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    If your venue is not listed, select a venue name for now. You can update it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}