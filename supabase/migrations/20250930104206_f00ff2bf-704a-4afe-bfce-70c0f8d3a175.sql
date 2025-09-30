-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-purge to run daily at 2 AM UTC
SELECT cron.schedule(
  'auto-purge-deleted-models',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
      url:='https://vmeapvxhkhmtzwscukfe.supabase.co/functions/v1/auto-purge-deleted-models',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZWFwdnhoa2htdHp3c2N1a2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTk1MDYsImV4cCI6MjA3NDIzNTUwNn0.l531S-u3RkxDgQfpZjwSDlCXVNUSJcM1kFpQR47B7vg"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);