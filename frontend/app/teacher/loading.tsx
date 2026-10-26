import { FullScreenLoading } from '@/components/shared/loading-animation';

export default function Loading() {
  return (
    <FullScreenLoading message="Loading teacher workspace..." subtext="Preparing your materials" />
  );
}
