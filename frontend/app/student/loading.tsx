import { FullScreenLoading } from '@/components/shared/loading-animation';

export default function Loading() {
  return (
    <FullScreenLoading
      message="Loading your dashboard..."
      subtext="Syncing your learning progress"
    />
  );
}
