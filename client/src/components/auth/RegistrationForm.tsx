import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type for form values
type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'artist',
    },
  });

  // Handle form submission
  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        userType: values.userType,
      });
      
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
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register('email')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...form.register('password')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="********"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...form.register('confirmPassword')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="********"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center space-x-2">
              <input
                id="artist"
                type="radio"
                value="artist"
                {...form.register('userType')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="artist" className="text-sm text-gray-700">
                Artist
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="venue"
                type="radio"
                value="venue"
                {...form.register('userType')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="venue" className="text-sm text-gray-700">
                Venue
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="fan"
                type="radio"
                value="fan"
                {...form.register('userType')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="fan" className="text-sm text-gray-700">
                Fan
              </label>
            </div>
          </div>
          {form.formState.errors.userType && (
            <p className="text-sm text-red-500">{form.formState.errors.userType.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="text-center pt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a 
            href="/login" 
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              setLocation('/login');
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}