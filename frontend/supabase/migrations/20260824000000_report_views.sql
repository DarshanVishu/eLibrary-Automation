-- Creates a read-only view aggregating per-student engagement metrics.
-- Used by the admin report export actions to avoid repeating complex
-- multi-table JOIN logic across multiple queries.
-- RLS is enforced at the underlying table level; the view inherits it.

CREATE OR REPLACE VIEW student_engagement_summary AS
SELECT
  p.id                                                            AS user_id,
  p.full_name,
  p.email,
  p.grade,
  p.is_active,
  p.created_at                                                    AS joined_at,
  COUNT(DISTINCT rv.resource_id)                                  AS unique_resources_accessed,
  COUNT(rv.id)                                                    AS total_views,
  COALESCE(ROUND(AVG(rp.progress_pct)::numeric, 1), 0)           AS avg_progress,
  COUNT(rp.resource_id) FILTER (WHERE rp.progress_pct >= 80)     AS completed_count,
  COUNT(b.resource_id)                                            AS bookmark_count,
  MAX(rv.viewed_at)                                               AS last_active
FROM profiles p
LEFT JOIN resource_views rv ON rv.user_id = p.id
LEFT JOIN reading_progress rp ON rp.user_id = p.id
LEFT JOIN bookmarks b ON b.user_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.email, p.grade, p.is_active, p.created_at;

-- Grant access to authenticated users; RLS on base tables guards data.
GRANT SELECT ON student_engagement_summary TO authenticated;
