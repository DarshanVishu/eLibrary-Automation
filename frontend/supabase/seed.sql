-- Insert seed users into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    '6cdb35d1-da37-405a-b8da-65b5b5f47204',
    'authenticated',
    'authenticated',
    'admin@school.edu',
    crypt('password123', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin","role":"admin"}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '6115e5e0-6fb4-4b70-86fd-a5b459c246f7',
    'authenticated',
    'authenticated',
    'teacher@school.edu',
    crypt('password123', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mrs. Neeta Sharma","role":"teacher"}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '0c58f70e-2161-4ad9-8aff-40ede5f20fef',
    'authenticated',
    'authenticated',
    'student@school.edu',
    crypt('password123', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rahul Verma","role":"student","grade":10}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Insert seed identities
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
(
    gen_random_uuid(),
    '6cdb35d1-da37-405a-b8da-65b5b5f47204',
    '6cdb35d1-da37-405a-b8da-65b5b5f47204',
    format('{"sub":"%s","email":"%s"}', '6cdb35d1-da37-405a-b8da-65b5b5f47204', 'admin@school.edu')::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
),
(
    gen_random_uuid(),
    '6115e5e0-6fb4-4b70-86fd-a5b459c246f7',
    '6115e5e0-6fb4-4b70-86fd-a5b459c246f7',
    format('{"sub":"%s","email":"%s"}', '6115e5e0-6fb4-4b70-86fd-a5b459c246f7', 'teacher@school.edu')::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
),
(
    gen_random_uuid(),
    '0c58f70e-2161-4ad9-8aff-40ede5f20fef',
    '0c58f70e-2161-4ad9-8aff-40ede5f20fef',
    format('{"sub":"%s","email":"%s"}', '0c58f70e-2161-4ad9-8aff-40ede5f20fef', 'student@school.edu')::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
) ON CONFLICT (provider_id, provider) DO NOTHING;
