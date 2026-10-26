'use client';

import { getTeacherSettingsData } from '../actions';
import { changePassword } from '@/app/actions';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    uploadApproved: true,
    uploadRejected: true,
    weeklyReport: true,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwPending, setPwPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTeacherSettingsData()
      .then((data) => {
        if (cancelled) return;
        setProfile(data.profile as Profile | null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Failed to load settings.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved.');
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setPwPending(true);
    const result = await changePassword(currentPassword, newPassword);
    setPwPending(false);
    if (result.success) {
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return <FullScreenLoading />;
  }

  const displayName = profile?.full_name || '—';
  const email = profile?.email || '—';
  const initials = displayName !== '—' ? displayName.charAt(0).toUpperCase() : 'T';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-foreground text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your profile and notification preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <Icon name="person" size="sm" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Icon name="bell" size="sm" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Icon name="lock" size="sm" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile ─── */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground text-base font-bold">
                Profile information
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Your details are synced from the school system. Contact admin to make changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary text-primary-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-foreground text-base font-bold">{displayName}</p>
                  <p className="text-muted-foreground text-xs">Teacher</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full name</Label>
                  <Input value={displayName} disabled className="bg-muted/50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email address</Label>
                  <Input value={email} disabled className="bg-muted/50 text-sm" />
                </div>
              </div>

              <Button variant="outline" disabled className="text-muted-foreground text-xs">
                <Icon name="info" size="sm" className="mr-1.5" />
                Contact your administrator to update profile details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notifications ─── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground text-base font-bold">
                Notification preferences
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Choose which email updates you&apos;d like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pb-6">
              {[
                {
                  key: 'uploadApproved',
                  label: 'Upload approved',
                  desc: 'When admin approves your submitted material.',
                },
                {
                  key: 'uploadRejected',
                  label: 'Upload rejected',
                  desc: 'When your upload is rejected with feedback.',
                },
                {
                  key: 'weeklyReport',
                  label: 'Weekly analytics summary',
                  desc: 'A brief overview of engagement with your materials every Monday.',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between border-b py-3 last:border-0"
                >
                  <div className="pr-4">
                    <p className="text-foreground text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((n) => ({ ...n, [item.key]: checked }))
                    }
                  />
                </div>
              ))}

              <div className="flex justify-end pt-3">
                <Button type="button" onClick={handleSaveNotifications} className="gap-2">
                  <Icon name="save" size="sm" />
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Security ─── */}
        <TabsContent value="security" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground text-base font-bold">Change password</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Update your password. You must enter your current password to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs font-semibold">
                  Current password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-9 text-sm"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-semibold">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-semibold">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={pwPending}
                  className="gap-2"
                >
                  <Icon name="lock_reset" size="sm" />
                  {pwPending ? 'Updating...' : 'Update password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
