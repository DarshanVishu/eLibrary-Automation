'use client';

import {
  adminPromoteStudents,
  adminDemoteStudents,
  getAdminSettingsData,
  updatePlatformName,
  updateGradeAccessBypass,
  updateSchoolName,
} from './actions';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_PLATFORM_NAME } from '@/lib/constants';
import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [isPending, startTransition] = useTransition();

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteConfirmWord, setPromoteConfirmWord] = useState('');
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const [demoteOpen, setDemoteOpen] = useState(false);
  const [demotePassword1, setDemotePassword1] = useState('');
  const [demotePassword2, setDemotePassword2] = useState('');
  const [demoteError, setDemoteError] = useState<string | null>(null);

  const [announcementOpen, setAnnouncementOpen] = useState(false);

  const [platformName, setPlatformName] = useState(DEFAULT_PLATFORM_NAME);
  const [platformNameLoading, setPlatformNameLoading] = useState(true);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [schoolName, setSchoolName] = useState('');
  const [isUpdatingSchoolName, setIsUpdatingSchoolName] = useState(false);

  const [allowAllGradesAccess, setAllowAllGradesAccess] = useState(false);
  const [isUpdatingBypass, setIsUpdatingBypass] = useState(false);

  // Load current platform name
  useEffect(() => {
    let mounted = true;

    async function fetchName() {
      const data = await getAdminSettingsData();

      if (!mounted) return;

      if (data.error) {
        toast.error('Failed to load settings.');
      } else {
        if (data.platformName) setPlatformName(data.platformName);
        setSchoolName(data.schoolName ?? '');
        setAllowAllGradesAccess(!!data.allowAllGradesAccess);
      }

      setPlatformNameLoading(false);
    }

    fetchName();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdatePlatformName = async () => {
    if (!platformName.trim()) {
      toast.error('Platform name cannot be empty');
      return;
    }
    setIsUpdatingName(true);
    const res = await updatePlatformName(platformName.trim());
    setIsUpdatingName(false);
    if (res.success) {
      toast.success('Platform name updated');
      // Wait a moment then reload to apply changes everywhere (Layout etc)
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error(res.error || 'Failed to update platform name');
    }
  };

  const handleUpdateSchoolName = async () => {
    setIsUpdatingSchoolName(true);
    const res = await updateSchoolName(schoolName);
    setIsUpdatingSchoolName(false);
    if (res.success) {
      toast.success('School name updated — will appear in exported reports');
    } else {
      toast.error(res.error || 'Failed to update school name');
    }
  };

  const handleToggleBypass = async (checked: boolean) => {
    setIsUpdatingBypass(true);
    const res = await updateGradeAccessBypass(checked);
    setIsUpdatingBypass(false);
    if (res.success) {
      setAllowAllGradesAccess(checked);
      toast.success('Grade access policy updated');
    } else {
      toast.error(res.error || 'Failed to update access policy');
    }
  };

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoteConfirmWord !== 'CONFIRM') {
      setPromoteError('You must type CONFIRM to proceed.');
      return;
    }
    setPromoteError(null);
    startTransition(async () => {
      const res = await adminPromoteStudents();
      if (!res.success) {
        setPromoteError(res.error || 'Failed to promote students');
      } else {
        setPromoteOpen(false);
        setPromoteConfirmWord('');
        toast.success('Successfully promoted students.');
      }
    });
  };

  const handleDemote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demotePassword1 || demotePassword1 !== demotePassword2) {
      setDemoteError('Passwords do not match or are empty.');
      return;
    }
    setDemoteError(null);
    startTransition(async () => {
      const res = await adminDemoteStudents(demotePassword1);
      if (!res.success) {
        setDemoteError(res.error || 'Failed to demote students');
      } else {
        setDemoteOpen(false);
        setDemotePassword1('');
        setDemotePassword2('');
        toast.success('Successfully demoted students.');
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-foreground text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure platform-wide settings and administrative preferences
        </p>
      </div>

      {/* ── Announcement Card ── */}
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name="campaign" size="md" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-foreground text-sm font-bold">Announcements</p>
              <p className="text-muted-foreground text-xs">
                Broadcast a realtime notification to all users or a specific group (students,
                teachers, or admins). Recipients see it instantly in their notification bell.
              </p>
            </div>
          </div>

          <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row">
            <Button
              variant="default"
              onClick={() => setAnnouncementOpen(true)}
              className="gap-2"
              id="send-announcement-btn"
            >
              <Icon name="campaign" size="sm" />
              Send Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name="lock" size="md" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-foreground text-sm font-bold">Disable Grade Restrictions</p>
              <p className="text-muted-foreground text-xs">
                When enabled, all students can browse, search, and read any materials across the
                library. If disabled, students are locked to their own standard's curriculum.
              </p>
            </div>
            <div className="flex h-10 items-center">
              <Switch
                checked={allowAllGradesAccess}
                onCheckedChange={handleToggleBypass}
                disabled={isUpdatingBypass || platformNameLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name="people" size="md" filled />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-foreground text-sm font-bold">Manual grade adjustment</p>
              <p className="text-muted-foreground text-xs">
                Manually adjust student grades for the entire school. Use these functions carefully
                to promote or demote all active students by one grade level.
              </p>
            </div>
          </div>

          <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row">
            <Button variant="default" onClick={() => setPromoteOpen(true)} className="gap-2">
              <Icon name="trending_up" size="sm" />
              Promote All Students
            </Button>

            <Button variant="destructive" onClick={() => setDemoteOpen(true)} className="gap-2">
              <Icon name="trending_down" size="sm" />
              Lower All Students Grades
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name="tag" size="md" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-foreground text-sm font-bold">Platform Branding</p>
              <p className="text-muted-foreground text-xs">
                Update the visual name of your eLibrary. This change will be reflected across the
                entire application interface.
              </p>
            </div>
          </div>

          <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
            <div className="max-w-sm flex-1 space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                disabled={platformNameLoading || isUpdatingName}
              />
            </div>
            <div className="sm:pb-0.5">
              <Button
                variant="default"
                onClick={handleUpdatePlatformName}
                disabled={platformNameLoading || isUpdatingName}
                className="gap-2"
              >
                <Icon name="save" size="sm" />
                {isUpdatingName ? 'Saving...' : 'Save Name'}
              </Button>
            </div>
          </div>

          {/* ── School Name row (used in PDF report headers) ── */}
          <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
            <div className="max-w-sm flex-1 space-y-2">
              <Label htmlFor="schoolName">School Name for Reports</Label>
              <Input
                id="schoolName"
                placeholder="e.g. DAV Public School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={platformNameLoading || isUpdatingSchoolName}
              />
            </div>
            <div className="sm:pb-0.5">
              <Button
                variant="default"
                onClick={handleUpdateSchoolName}
                disabled={platformNameLoading || isUpdatingSchoolName}
                className="gap-2"
              >
                <Icon name="save" size="sm" />
                {isUpdatingSchoolName ? 'Saving...' : 'Save School Name'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={promoteOpen}
        onOpenChange={(open) => {
          setPromoteOpen(open);
          if (!open) {
            setPromoteConfirmWord('');
            setPromoteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote all students?</DialogTitle>
            <DialogDescription>
              This will increase the grade of all active students by 1 (up to grade 10). To confirm,
              type <strong>CONFIRM</strong> below.
            </DialogDescription>
          </DialogHeader>
          <form id="promote-form" onSubmit={handlePromote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmWord">Confirmation</Label>
              <Input
                id="confirmWord"
                placeholder="Type CONFIRM"
                value={promoteConfirmWord}
                onChange={(e) => setPromoteConfirmWord(e.target.value)}
              />
            </div>
            {promoteError && <p className="text-destructive text-sm font-medium">{promoteError}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setPromoteOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || promoteConfirmWord !== 'CONFIRM'}>
                {isPending ? 'Promoting...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={demoteOpen}
        onOpenChange={(open) => {
          setDemoteOpen(open);
          if (!open) {
            setDemotePassword1('');
            setDemotePassword2('');
            setDemoteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote all students?</DialogTitle>
            <DialogDescription>
              This will decrease the grade of all active students by 1 (minimum grade 1). Please
              enter your admin password twice to confirm this destructive action.
            </DialogDescription>
          </DialogHeader>
          <form id="demote-form" onSubmit={handleDemote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd1">Admin Password</Label>
              <Input
                id="pwd1"
                type="password"
                value={demotePassword1}
                onChange={(e) => setDemotePassword1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2">Confirm Password</Label>
              <Input
                id="pwd2"
                type="password"
                value={demotePassword2}
                onChange={(e) => setDemotePassword2(e.target.value)}
              />
            </div>
            {demoteError && <p className="text-destructive text-sm font-medium">{demoteError}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setDemoteOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || !demotePassword1 || demotePassword1 !== demotePassword2}
              >
                {isPending ? 'Demoting...' : 'Confirm Demotion'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AnnouncementDialog open={announcementOpen} onOpenChange={setAnnouncementOpen} />
    </div>
  );
}
