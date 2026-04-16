UPDATE public.businesses
SET hours = '{
  "sunday": {"open": "09:00", "close": "20:00"},
  "monday": {"open": "09:00", "close": "20:00"},
  "tuesday": {"open": "09:00", "close": "20:00"},
  "wednesday": {"open": "09:00", "close": "20:00"},
  "thursday": {"open": "09:00", "close": "20:00"},
  "friday": {"open": "09:00", "close": "20:00"},
  "saturday": {"open": "09:00", "close": "20:00"}
}'::jsonb
WHERE id = 'aabe1402-48b7-47b3-88e4-8c06130b5328';