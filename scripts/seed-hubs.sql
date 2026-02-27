INSERT INTO "Hub" (id, name, location) VALUES 
('dhaka-central', 'Dhaka Central Hub', 'Dhaka'), 
('khulna-hub', 'Khulna Hub', 'Khulna'), 
('chattogram-hub', 'Chattogram Hub', 'Chattogram') 
ON CONFLICT (id) DO NOTHING;
