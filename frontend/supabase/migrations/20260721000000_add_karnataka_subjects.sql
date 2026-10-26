-- Migration: Add Karnataka CBSE Subjects

insert into public.subjects (name)
values
  ('Kannada'),
  ('Information Technology'),
  ('Artificial Intelligence'),
  ('Art Education'),
  ('Value Education'),
  ('General Knowledge')
on conflict (name) do nothing;
