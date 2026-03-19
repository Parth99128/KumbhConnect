CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    group_id INTEGER,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    battery_level INTEGER,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_known_location GEOMETRY(Point, 4326)
);

CREATE TABLE location_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    location GEOMETRY(Point, 4326),
    battery_level INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Query to calculate distance in meters between two specific user IDs
-- SELECT ST_DistanceSphere(u1.last_known_location, u2.last_known_location) AS distance_meters
-- FROM users u1, users u2
-- WHERE u1.id = 1 AND u2.id = 2;
