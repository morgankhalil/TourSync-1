-- Mohawk Place (Buffalo, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Mohawk Place', '47 E Mohawk St', 'Buffalo', 'NY', '14203', 175, 'Venue Manager', 'booking@mohawkplace.com', '716-312-9279', 'Independent music venue in Buffalo, featuring indie rock, punk, and metal bands', 'Indie, Punk, Metal', 'Door Split', '42.8867', '-78.8784', '{"sound": "Professional house PA system", "stage": "Small raised stage", "lighting": "Basic stage lighting"}', 'Club', '{"bar": true, "parking": "Street parking", "greenRoom": true}', 'https://buffalosmohawkplace.com', '["Indie Rock", "Punk", "Metal", "Alternative"]')
ON CONFLICT (name, city) DO NOTHING;

-- The Haunt (Ithaca, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('The Haunt', '702 Willow Ave', 'Ithaca', 'NY', '14850', 200, 'Venue Booker', 'booking@thehaunt.com', '607-275-3447', 'Longtime indie music venue in Ithaca known for hosting local bands and touring acts', 'Indie, Rock, Alternative', 'Door Split', '42.4396', '-76.5156', '{"sound": "Full PA system", "stage": "20x15 feet stage", "lighting": "Professional lighting rig"}', 'Club', '{"bar": true, "parking": "Venue parking lot", "greenRoom": true}', 'https://thehauntithaca.com', '["Indie Rock", "Alternative", "Folk Punk", "Electronic"]')
ON CONFLICT (name, city) DO NOTHING;

-- Beachland Ballroom (Cleveland, OH)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Beachland Ballroom', '15711 Waterloo Rd', 'Cleveland', 'OH', '44110', 500, 'Venue Manager', 'booking@beachlandballroom.com', '216-383-1124', 'Historic venue with two performance spaces: a ballroom and tavern for more intimate shows', 'Indie, Rock, Punk, Alternative', 'Percentage', '41.5697', '-81.5757', '{"sound": "Professional sound system", "stage": "Large main stage", "lighting": "Full lighting rig"}', 'Concert Hall', '{"bar": true, "parking": "Free lot parking", "greenRoom": true, "restaurant": true}', 'https://www.beachlandballroom.com', '["Indie Rock", "Punk", "Alternative", "Americana", "Jazz"]')
ON CONFLICT (name, city) DO NOTHING;

-- Funk 'n Waffles (Syracuse, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Funk ''n Waffles', '307-313 S Clinton St', 'Syracuse', 'NY', '13202', 150, 'Booking Manager', 'booking@funknwaffles.com', '315-474-1060', 'Funky venue combining live music with delicious food in Armory Square', 'Indie, Funk, Rock, Electronic', 'Door Split', '43.0481', '-76.1541', '{"sound": "House PA system", "stage": "Small intimate stage", "lighting": "Basic stage lighting"}', 'Restaurant/Bar', '{"bar": true, "parking": "Street parking", "greenRoom": true, "restaurant": true}', 'https://www.funknwaffles.com', '["Indie", "Funk", "Jazz", "Electronic", "Hip-Hop"]')
ON CONFLICT (name, city) DO NOTHING;

-- Mr. Small's Theatre (Pittsburgh, PA)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Mr. Small''s Theatre', '400 Lincoln Ave', 'Pittsburgh', 'PA', '15209', 650, 'Booking Agent', 'booking@mrsmalls.com', '412-821-4447', 'Historic converted church venue with excellent acoustics and indie atmosphere', 'Indie, Rock, Alternative', 'Percentage', '40.4895', '-79.9778', '{"sound": "Professional sound system", "stage": "Large elevated stage", "lighting": "Full professional lighting"}', 'Concert Hall', '{"bar": true, "parking": "Venue lot", "greenRoom": true, "merch": "Dedicated merch area"}', 'https://www.mrsmalls.com', '["Indie Rock", "Alternative", "Metal", "Hip-Hop", "Electronic"]')
ON CONFLICT (name, city) DO NOTHING;

-- The Lost Horizon (Syracuse, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('The Lost Horizon', '5863 Thompson Rd', 'Syracuse', 'NY', '13214', 300, 'Booking Office', 'booking@thelosthorizon.com', '315-446-1934', 'Legendary Syracuse rock club with a long history of hosting punk and metal shows', 'Punk, Metal, Rock', 'Door Split', '43.0392', '-76.0871', '{"sound": "Full PA system", "stage": "Raised stage", "lighting": "Stage lighting"}', 'Club', '{"bar": true, "parking": "Venue parking", "greenRoom": true}', 'https://www.thelosthorizon.com', '["Punk", "Metal", "Hardcore", "Alternative"]')
ON CONFLICT (name, city) DO NOTHING;

-- Nietzsche's (Buffalo, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Nietzsche''s', '248 Allen St', 'Buffalo', 'NY', '14201', 125, 'Venue Manager', 'booking@nietzsches.com', '716-886-8539', 'Iconic Buffalo institution in the heart of Allentown, known for diverse indie shows', 'Indie, Folk, Jazz, Rock', 'Door Split', '42.9008', '-78.8735', '{"sound": "House sound system", "stage": "Intimate corner stage", "lighting": "Basic lighting"}', 'Bar', '{"bar": true, "parking": "Street parking", "greenRoom": false}', 'https://www.nietzsches.com', '["Indie Folk", "Jazz", "Experimental", "Singer-Songwriter"]')
ON CONFLICT (name, city) DO NOTHING;

-- 9th Ward at Babeville (Buffalo, NY)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('9th Ward at Babeville', '341 Delaware Ave', 'Buffalo', 'NY', '14202', 150, 'Venue Manager', 'booking@babevillebuffalo.com', '716-852-3835', 'Intimate basement venue in Ani DiFranco''s Babeville complex in a converted church', 'Indie, Folk, Singer-Songwriter', 'Door Split', '42.8927', '-78.8738', '{"sound": "High-quality sound system", "stage": "Small corner stage", "lighting": "Intimate lighting setup"}', 'Club', '{"bar": true, "parking": "Street and lot parking", "greenRoom": true}', 'https://www.babevillebuffalo.com', '["Indie Folk", "Singer-Songwriter", "Acoustic", "Experimental"]')
ON CONFLICT (name, city) DO NOTHING;

-- Spirit Hall (Pittsburgh, PA)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Spirit Hall', '242 51st St', 'Pittsburgh', 'PA', '15201', 350, 'Booking Office', 'booking@spiritpgh.com', '412-586-4441', 'Multi-level venue in Lawrenceville with a great sound system and diverse bookings', 'Indie, Electronic, Hip-Hop', 'Percentage', '40.4776', '-79.9498', '{"sound": "High-end sound system", "stage": "Open performance space", "lighting": "Professional lighting"}', 'Club', '{"bar": true, "parking": "Street parking", "greenRoom": true, "restaurant": true}', 'https://www.spiritpgh.com', '["Indie", "Electronic", "Dance", "Hip-Hop", "Experimental"]')
ON CONFLICT (name, city) DO NOTHING;

-- Rex Theater (Pittsburgh, PA)
INSERT INTO venues (name, address, city, state, zip_code, capacity, contact_name, contact_email, contact_phone, description, genre, deal_type, latitude, longitude, technical_specs, venue_type, amenities, website, preferred_genres) 
VALUES ('Rex Theater', '1602 E Carson St', 'Pittsburgh', 'PA', '15203', 500, 'Booking Manager', 'booking@rextheater.net', '412-381-6811', 'Historic theater venue in Pittsburgh''s South Side neighborhood with diverse bookings', 'Indie, Rock, Electronic', 'Percentage', '40.4283', '-79.9861', '{"sound": "Professional sound system", "stage": "Large main stage", "lighting": "Full lighting rig"}', 'Theater', '{"bar": true, "parking": "Street parking", "greenRoom": true}', 'https://www.rextheater.net', '["Indie Rock", "Electronic", "Hip-Hop", "Metal", "Pop"]')
ON CONFLICT (name, city) DO NOTHING;