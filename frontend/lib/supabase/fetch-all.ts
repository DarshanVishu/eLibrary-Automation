/**
 * Utility to fetch all rows from Supabase queries by paginating in chunks.
 * PostgREST servers enforce \max_rows\ (typically 1000 rows per request).
 * This helper loops in chunks of \chunkSize\ (default 1000) until all matching rows are retrieved.
 */
export async function fetchAllRows<T = any>(
  queryBuilder: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  chunkSize = 1000,
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const res = await queryBuilder(from, from + chunkSize - 1);
    if (!res || res.error || !res.data || res.data.length === 0) {
      break;
    }
    allRows.push(...res.data);
    if (res.data.length < chunkSize) {
      break;
    }
    from += chunkSize;
  }

  return allRows;
}
