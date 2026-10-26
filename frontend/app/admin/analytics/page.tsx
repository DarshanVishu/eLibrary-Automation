import { getAnalyticsData } from './actions';
import { AdminAnalytics } from '@/components/admin';

export default async function Page() {
  const data = await getAnalyticsData();
  return <AdminAnalytics {...data} />;
}
