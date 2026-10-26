'use client';

import { login } from '@/app/actions';
import { SignInSubmit } from '@/components/shared/sign-in-submit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { getPlatformName } from '@/lib/actions/settings';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('error') || searchParams.get('message') || null,
  );
  const [platformName, setPlatformName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getPlatformName().then(setPlatformName);
  }, []);

  // Initialize form with react-hook-form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange',
  });

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="mb-2 flex flex-col items-center text-center">
          <div className="bg-primary mb-4 flex h-16 w-16 items-center justify-center rounded-xl shadow-sm">
            <Icon name="library" className="text-primary-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign in to {platformName}
          </CardTitle>
          <CardDescription className="mt-1">
            Enter your credentials to access your portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pb-6">
          {errorMessage && (
            <div className="border-destructive/20 bg-destructive/10 flex items-start gap-3 rounded-lg border px-4 py-3">
              <div className="bg-destructive/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                <Icon name="error" size="xs" className="text-destructive" filled />
              </div>
              <p className="text-destructive text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <Form {...form}>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(async (data) => {
                setErrorMessage(null);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(
                    'auth_persistence',
                    data.rememberMe ? 'persistent' : 'session',
                  );
                }

                // Create FormData from validated data
                const formData = new FormData();
                formData.append('email', data.email);
                formData.append('password', data.password);
                formData.append('rememberMe', String(data.rememberMe));

                // Submit to server action
                const result = await login(formData);
                if (result?.error) {
                  setErrorMessage(result.error);
                } else if (result?.destination) {
                  // Force a full page navigation so AuthProvider completely remounts
                  // and picks up the new session cookie.
                  window.location.assign(result.destination);
                }
              })}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="you@school.edu"
                          autoComplete="email"
                          className="bg-secondary border-secondary h-10 px-4"
                        />
                      </div>
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
                      <div className="relative">
                        <div>
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="•••••••"
                            autoComplete="current-password"
                            className="bg-secondary border-secondary h-10 px-4 pr-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 py-1">
                    <FormControl>
                      <Checkbox
                        id="rememberMe"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="rememberMe"
                      className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium"
                    >
                      Keep me logged in
                    </FormLabel>
                  </FormItem>
                )}
              />

              <SignInSubmit form={form} />
            </form>
          </Form>

          <p className="text-muted-foreground text-center text-xs">
            Having trouble? Contact your school administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
