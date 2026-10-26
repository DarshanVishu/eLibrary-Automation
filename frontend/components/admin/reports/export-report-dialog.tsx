'use client';

import {
  getOverallReportData,
  getAllStudentsReportData,
  getIndividualStudentReportData,
} from '@/app/admin/reports/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import type { ExportFormat, ReportType } from '@/lib/types/reports';
import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

type PresetPeriod = 'this-month' | 'last-month' | 'this-year' | 'all-time';

const PRESET_LABELS: Record<PresetPeriod, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-year': 'This Year',
  'all-time': 'All Time',
};

const REPORT_TITLES: Record<ReportType, string> = {
  overall: 'Platform Overview & Institutional Report',
  'all-students': 'All Students Activity & Progress Report',
  individual: 'Student Academic Dossier & Portfolio',
};

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  overall:
    'Institutional summary with grade-by-grade matrices, subject curriculum performance, top learning resources, and student honor roll.',
  'all-students':
    'Cohort-wide student roster with engagement levels, total views, estimated pages read, reading progress, and book completions.',
  individual:
    'Comprehensive student academic dossier with reading consistency, subject mastery, resource transcript, and qualitative learning insights.',
};

function getPresetDates(preset: PresetPeriod): { from: Date | undefined; to: Date | undefined } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this-month':
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) };
    case 'last-month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case 'this-year':
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
    case 'all-time':
      return { from: undefined, to: undefined };
  }
}

function formatDisplayDate(date: Date | undefined): string {
  if (!date) return 'Pick a date';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toISODate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}

function isDateAfter(a: Date, b: Date): boolean {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return da > db;
}

function isDateBefore(a: Date, b: Date): boolean {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return da < db;
}

interface ExportReportDialogProps {
  reportType?: ReportType;
  /** Required when reportType === 'individual' */
  studentId?: string;
  /** Optional student name shown in the dialog title */
  studentName?: string;
  /** Custom trigger element; defaults to an "Export Report" button */
  trigger?: ReactNode;
}

export function ExportReportDialog({
  reportType = 'overall',
  studentId,
  studentName,
  trigger,
}: ExportReportDialogProps) {
  const isIndividual = reportType === 'individual';
  const [selectedType, setSelectedType] = useState<ReportType>(reportType);
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetPeriod>('all-time');
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [useCustom, setUseCustom] = useState(false);
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [loading, setLoading] = useState(false);

  function resetState() {
    setSelectedType(reportType);
    setPreset('all-time');
    setCustomRange({ from: undefined, to: undefined });
    setUseCustom(false);
    setFormat('pdf');
    setLoading(false);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetState();
  }

  function handlePresetClick(p: PresetPeriod) {
    setPreset(p);
    setUseCustom(false);
    setCustomRange({ from: undefined, to: undefined });
  }

  function getEffectiveDates(): { from: string | undefined; to: string | undefined } {
    if (useCustom) {
      return { from: toISODate(customRange.from), to: toISODate(customRange.to) };
    }
    const d = getPresetDates(preset);
    return { from: toISODate(d.from), to: toISODate(d.to) };
  }

  const activeType = isIndividual ? 'individual' : selectedType;

  async function handleExport() {
    setLoading(true);
    try {
      const { from, to } = getEffectiveDates();
      const params = { from, to };

      if (activeType === 'overall') {
        const data = await getOverallReportData(params);
        if (format === 'pdf') {
          const { generateOverallPDF } = await import('./report-generators');
          await generateOverallPDF(data);
        } else {
          const { generateOverallCSV } = await import('./report-generators');
          generateOverallCSV(data);
        }
      } else if (activeType === 'all-students') {
        const data = await getAllStudentsReportData(params);
        if (format === 'pdf') {
          const { generateAllStudentsPDF } = await import('./report-generators');
          await generateAllStudentsPDF(data);
        } else {
          const { generateAllStudentsCSV } = await import('./report-generators');
          generateAllStudentsCSV(data);
        }
      } else if (activeType === 'individual') {
        if (!studentId) throw new Error('studentId is required for individual reports');
        const data = await getIndividualStudentReportData(studentId, params);
        if (format === 'pdf') {
          const { generateIndividualStudentPDF } = await import('./report-generators');
          await generateIndividualStudentPDF(data);
        } else {
          const { generateIndividualStudentCSV } = await import('./report-generators');
          generateIndividualStudentCSV(data);
        }
      }

      toast.success('Report exported successfully');
      setOpen(false);
      resetState();
    } catch {
      toast.error('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const dialogTitle =
    isIndividual && studentName
      ? `Student Dossier - ${studentName}`
      : 'Export Analytics & Academic Reports';

  const effectiveDates = useCustom ? customRange : getPresetDates(preset);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Icon name="download" size="sm" />
            Export Report
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="download" size="md" className="text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{REPORT_DESCRIPTIONS[activeType]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Report Scope Selection (Only for analytics page) ── */}
          {!isIndividual && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Select Report Type</Label>
              <RadioGroup
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as ReportType)}
                className="grid grid-cols-1 gap-2"
              >
                <div
                  className={cn(
                    'border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    selectedType === 'overall' && 'border-primary bg-primary/5',
                  )}
                  onClick={() => setSelectedType('overall')}
                >
                  <RadioGroupItem value="overall" id="rpt-overall" className="mt-0.5" />
                  <div className="flex-1 space-y-0.5">
                    <Label htmlFor="rpt-overall" className="cursor-pointer text-sm font-semibold">
                      Platform Overview Report
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Institutional performance, grade matrices, subject breakdown, top resources,
                      and honor roll.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    selectedType === 'all-students' && 'border-primary bg-primary/5',
                  )}
                  onClick={() => setSelectedType('all-students')}
                >
                  <RadioGroupItem value="all-students" id="rpt-all-students" className="mt-0.5" />
                  <div className="flex-1 space-y-0.5">
                    <Label
                      htmlFor="rpt-all-students"
                      className="cursor-pointer text-sm font-semibold"
                    >
                      All Students Activity Report
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Full student roster with ranks, reading sessions, estimated pages, progress,
                      and completions.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {!isIndividual && <Separator />}

          {/* ── Period ── */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Date Range</Label>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABELS) as PresetPeriod[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={!useCustom && preset === p ? 'default' : 'outline'}
                  onClick={() => handlePresetClick(p)}
                  className="h-7 text-xs"
                >
                  {PRESET_LABELS[p]}
                </Button>
              ))}
              <Button
                size="sm"
                variant={useCustom ? 'default' : 'outline'}
                onClick={() => setUseCustom(true)}
                className="h-7 text-xs"
              >
                Custom
              </Button>
            </div>

            {/* Custom date pickers */}
            {useCustom && (
              <div className="flex items-center gap-2 pt-1">
                {/* From date */}
                <Popover modal={true} open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-8 flex-1 justify-start text-left text-xs font-normal',
                        !customRange.from && 'text-muted-foreground',
                      )}
                    >
                      <Icon name="calendar" size="sm" className="mr-1.5" />
                      {formatDisplayDate(customRange.from)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[60] w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customRange.from}
                      onSelect={(d) => {
                        setCustomRange((prev) => ({ ...prev, from: d }));
                        setFromPopoverOpen(false);
                      }}
                      disabled={(d) => (customRange.to ? isDateAfter(d, customRange.to) : false)}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground text-xs">to</span>

                {/* To date */}
                <Popover modal={true} open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-8 flex-1 justify-start text-left text-xs font-normal',
                        !customRange.to && 'text-muted-foreground',
                      )}
                    >
                      <Icon name="calendar" size="sm" className="mr-1.5" />
                      {formatDisplayDate(customRange.to)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[60] w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customRange.to}
                      onSelect={(d) => {
                        setCustomRange((prev) => ({ ...prev, to: d }));
                        setToPopoverOpen(false);
                      }}
                      disabled={(d) =>
                        customRange.from ? isDateBefore(d, customRange.from) : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Active range summary */}
            {!useCustom && preset !== 'all-time' && (
              <p className="text-muted-foreground text-xs">
                {formatDisplayDate(effectiveDates.from)} - {formatDisplayDate(effectiveDates.to)}
              </p>
            )}
            {!useCustom && preset === 'all-time' && (
              <p className="text-muted-foreground text-xs">All available data will be included</p>
            )}
          </div>

          <Separator />

          {/* ── Format ── */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="fmt-pdf" />
                <Label
                  htmlFor="fmt-pdf"
                  className="flex cursor-pointer items-center gap-1.5 font-normal"
                >
                  <Icon name="pdf" size="sm" className="text-destructive" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="csv" id="fmt-csv" />
                <Label
                  htmlFor="fmt-csv"
                  className="flex cursor-pointer items-center gap-1.5 font-normal"
                >
                  <Icon name="article" size="sm" className="text-success" />
                  CSV Spreadsheet
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading} className="min-w-[130px] gap-2">
            {loading ? (
              <>
                <Icon name="spinner" size="sm" className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Icon name="download" size="sm" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
