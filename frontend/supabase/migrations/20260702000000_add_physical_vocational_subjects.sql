-- Add Physical Education and Vocational Education subjects
INSERT INTO subjects (name) VALUES ('Physical Education') ON CONFLICT (name) DO NOTHING;
INSERT INTO subjects (name) VALUES ('Vocational Education') ON CONFLICT (name) DO NOTHING;
