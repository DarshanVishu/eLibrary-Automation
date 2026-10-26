'use client';

import { TeacherAnalytics } from './teacher-analytics';
import { TeacherStudents } from './teacher-students';
import { TeacherUploads } from './teacher-uploads';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon, IconName } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

interface TeacherDashboardProps {
  onNavigate?: (page: string) => void;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'view' | 'approval';
  title: string;
  timestamp: string;
  status?: 'approved' | 'pending' | 'rejected';
  details?: string;
}

interface QuickStats {
  totalMaterials: number;
  totalViews: number;
  activeStudents: number;
  pendingApprovals: number;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const _ = onNavigate; // unused but kept for API compatibility
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Mock data
  const quickStats: QuickStats = {
    totalMaterials: 24,
    totalViews: 1892,
    activeStudents: 156,
    pendingApprovals: 3,
  };

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'upload',
      title: 'NCERT Science Chapter 1',
      timestamp: '2 hours ago',
      status: 'pending',
      details: 'PDF • 2.4 MB • Grade 6A',
    },
    {
      id: '2',
      type: 'approval',
      title: 'Mathematics Formula Sheet',
      timestamp: '5 hours ago',
      status: 'approved',
      details: 'Approved by Admin',
    },
    {
      id: '3',
      type: 'view',
      title: 'History Timeline Video',
      timestamp: '1 day ago',
      details: '45 students viewed',
    },
    {
      id: '4',
      type: 'upload',
      title: 'English Grammar Presentation',
      timestamp: '2 days ago',
      status: 'rejected',
      details: 'Rejected: Incomplete content',
    },
    {
      id: '5',
      type: 'view',
      title: 'Geography Maps Collection',
      timestamp: '3 days ago',
      details: '23 students viewed',
    },
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Science Project Submission',
      date: '2025-10-28',
      type: 'deadline',
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      date: '2025-10-30',
      type: 'meeting',
    },
    {
      id: '3',
      title: 'Mathematics Test',
      date: '2025-11-02',
      type: 'test',
    },
  ];

  const topPerformingStudents = [
    { name: 'Ananya Singh', grade: '7A', views: 312, materials: 24 },
    { name: 'Aarav Sharma', grade: '6A', views: 234, materials: 18 },
    { name: 'Priya Patel', grade: '6A', views: 189, materials: 15 },
  ];

  const getActivityIcon = (type: string) => {
    const map: Record<string, IconName> = {
      upload: 'upload',
      view: 'visibility',
      approval: 'check_circle',
    };
    const icon = map[type] ?? 'schedule';
    return <Icon name={icon} className="h-4 w-4" />;
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'approved') return <Icon name="check_circle" className="text-success h-3 w-3" />;
    if (status === 'pending') return <Icon name="warning" className="text-warning h-3 w-3" />;
    if (status === 'rejected') return <Icon name="error" className="text-destructive h-3 w-3" />;
    return null;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/15 text-success';
      case 'pending':
        return 'bg-warning/15 text-warning';
      case 'rejected':
        return 'bg-destructive/15 text-destructive';
      default:
        return '';
    }
  };

  const getEventTypeIcon = (type: string) => {
    if (type === 'deadline') return <Icon name="calendar" className="text-destructive h-4 w-4" />;
    if (type === 'meeting') return <Icon name="people" className="text-primary h-4 w-4" />;
    if (type === 'test') return <Icon name="trophy" className="text-warning h-4 w-4" />;
    return <Icon name="calendar" className="h-4 w-4" />;
  };

  if (currentPage === 'analytics') {
    return <TeacherAnalytics />;
  }

  if (currentPage === 'uploads') {
    return <TeacherUploads />;
  }

  if (currentPage === 'students') {
    return <TeacherStudents />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Emerald Gradient */}
      <div className="shadow-strong rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">Teacher Dashboard</h1>
            <p className="text-sm text-white/90">
              Welcome back! Here's what's happening with your classes today.
            </p>
          </div>
          <Button className="shadow-medium border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
            <Icon name="upload" className="mr-2 h-4 w-4" />
            Quick Upload
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="shadow-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <Icon name="book" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">
                  {quickStats.totalMaterials}
                </div>
                <div className="text-muted-foreground text-xs font-medium">Total Materials</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="shadow-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <Icon name="visibility" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">
                  {quickStats.totalViews.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs font-medium">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="shadow-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <Icon name="people" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">
                  {quickStats.activeStudents}
                </div>
                <div className="text-muted-foreground text-xs font-medium">Active Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="shadow-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <Icon
                  name={quickStats.pendingApprovals > 0 ? 'warning' : 'check_circle'}
                  className={`h-6 w-6 ${quickStats.pendingApprovals > 0 ? 'text-warning' : 'text-success'}`}
                />
              </div>
              <div>
                <div className="text-foreground text-2xl font-bold">
                  {quickStats.pendingApprovals}
                </div>
                <div className="text-muted-foreground text-xs font-medium">Pending Approvals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="shadow-soft mt-1 flex h-8 w-8 items-center justify-center rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground font-medium">{activity.title}</h4>
                      {activity.status && (
                        <Badge className={getStatusColor(activity.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(activity.status)}
                            {activity.status}
                          </span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{activity.details}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setCurrentPage('uploads')}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1">{getEventTypeIcon(event.type)}</div>
                  <div>
                    <h4 className="text-foreground font-medium">{event.title}</h4>
                    <p className="text-muted-foreground text-xs">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Students */}
      <Card className="border-border bg-card shadow-soft hover:shadow-medium transition-shadow">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Top Performing Students</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            {topPerformingStudents.map((student, index) => (
              <div key={student.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="shadow-soft flex h-8 w-8 items-center justify-center rounded-full">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium">{student.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      Grade {student.grade} • {student.materials} materials
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-medium">{student.views} views</div>
                  <Progress value={(student.views / 312) * 100} className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setCurrentPage('students')}
          >
            View All Students
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setCurrentPage('analytics')}
        >
          <Icon name="trending_up" className="h-6 w-6" />
          <span>Analytics</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setCurrentPage('uploads')}
        >
          <Icon name="upload" className="h-6 w-6" />
          <span>Uploads</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setCurrentPage('students')}
        >
          <Icon name="people" className="h-6 w-6" />
          <span>Students</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Icon name="calendar" className="h-6 w-6" />
          <span>Schedule</span>
        </Button>
      </div>
    </div>
  );
}
