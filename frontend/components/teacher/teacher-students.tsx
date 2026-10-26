'use client';

import { getTeacherStudentsData } from '@/app/teacher/students/actions';
import { FilterBar } from '@/components/shared/filter-bar';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { roleBadgeColors } from '@/lib/theme/theme';
import { useEffect, useState } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: number;
  rollNumber: string;
  avatar?: string;
  enrollmentDate: string;
  totalViews: number;
  materialsAccessed: number;
  lastActive: string;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
  parentContact: string;
}

const performanceConfig = {
  excellent: { color: '#059669', icon: 'trophy' as const, label: 'Excellent' },
  good: { color: '#2563EB', icon: 'star' as const, label: 'Good' },
  average: { color: '#D97706', icon: 'trending_up' as const, label: 'Average' },
  'needs-improvement': { color: '#DC2626', icon: 'warning' as const, label: 'Needs Help' },
} as const;

export function TeacherStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedPerformance, setSelectedPerformance] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageViews: 0,
    excellentPerformers: 0,
  });

  useEffect(() => {
    getTeacherStudentsData().then((data) => {
      setStudents(data.students);
      setStats(data.stats);
    });
  }, []);

  const filteredStudents = students
    .filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((student) => selectedGrade === 'all' || student.grade.toString() === selectedGrade)
    .filter(
      (student) => selectedPerformance === 'all' || student.performance === selectedPerformance,
    );

  const PAGE_SIZE = 30;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const clampedPage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filteredStudents.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col">
        <h2 className="text-foreground text-2xl font-bold">My Students</h2>
        <p className="text-muted-foreground text-sm">Monitor student engagement and performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Students', count: stats.totalStudents, icon: 'people' as const },
          { label: 'Active This Week', count: stats.activeStudents, icon: 'bolt' as const },
          {
            label: 'Excellent Performers',
            count: stats.excellentPerformers,
            icon: 'star' as const,
          },
          { label: 'Avg. Views/Student', count: stats.averageViews, icon: 'visibility' as const },
        ].map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="flex items-center gap-4 pt-5 pb-5">
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                <Icon name={card.icon} size="lg" filled className="text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-2xl font-bold">{card.count}</p>
                <p className="text-muted-foreground truncate text-xs font-semibold">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FilterBar
        search={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(0);
        }}
        searchPlaceholder="Search students..."
        resultCount={filteredStudents.length}
        resultLabel={filteredStudents.length === 1 ? 'student' : 'students'}
        onClearAll={() => {
          setSearchTerm('');
          setSelectedGrade('all');
          setSelectedPerformance('all');
          setPage(0);
        }}
        filters={[
          {
            key: 'performance',
            label: 'Performance',
            icon: 'star',
            type: 'toggle-group',
            value: selectedPerformance === 'all' ? null : selectedPerformance,
            onChange: (v) => {
              setSelectedPerformance(v ?? 'all');
              setPage(0);
            },
            options: [
              {
                value: 'excellent',
                label: 'Excellent',
                icon: 'trophy',
                count: students.filter((s) => s.performance === 'excellent').length,
              },
              {
                value: 'good',
                label: 'Good',
                icon: 'star',
                count: students.filter((s) => s.performance === 'good').length,
              },
              {
                value: 'average',
                label: 'Average',
                icon: 'trending_up',
                count: students.filter((s) => s.performance === 'average').length,
              },
              {
                value: 'needs-improvement',
                label: 'Needs Help',
                icon: 'warning',
                count: students.filter((s) => s.performance === 'needs-improvement').length,
              },
            ],
          },
          {
            key: 'grade',
            label: 'Grade',
            type: 'select',
            value: selectedGrade === 'all' ? null : selectedGrade,
            onChange: (v) => {
              setSelectedGrade(v ?? 'all');
              setPage(0);
            },
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({
              value: String(g),
              label: `Grade ${g}`,
            })),
          },
        ]}
      />

      <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border bg-muted/40 border-b">
              {['Student Name', 'Academic Performance', 'Grade', 'Engagement', 'Last Session'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-muted-foreground px-5 py-3.5 text-[10px] font-bold tracking-wider uppercase"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {paged.map((student) => {
              const pCfg = performanceConfig[student.performance];
              return (
                <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                        style={{ background: roleBadgeColors.student.primary }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-foreground truncate text-sm font-bold">
                          {student.name}
                        </div>
                        <div className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">
                          #{student.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className="bg-muted text-foreground border-border inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold whitespace-nowrap"
                    >
                      <Icon name={pCfg.icon} size="xs" filled />
                      {pCfg.label}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-sm font-semibold">
                    Class {student.grade}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <div className="text-foreground text-sm font-bold">
                        {student.totalViews} views
                      </div>
                      <div className="text-muted-foreground text-[10px] font-medium uppercase">
                        {student.materialsAccessed} resources
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-[10px] font-bold tracking-tight uppercase">
                    {student.lastActive}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-20">
            <Icon name="person_off" size="2xl" className="mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm font-bold">No students found</p>
          </div>
        )}
        {totalPages > 1 && (
          <PaginationBar
            page={clampedPage}
            totalPages={totalPages}
            onPageChange={setPage}
            label={`Showing ${clampedPage * PAGE_SIZE + 1}\u2013${Math.min((clampedPage + 1) * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} items`}
          />
        )}
      </div>
    </div>
  );
}
