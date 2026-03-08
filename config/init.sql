-- 1. Cleanup
DROP TABLE IF EXISTS "Match";
DROP TABLE IF EXISTS "TournamentMember";
DROP TABLE IF EXISTS "Tournament";
DROP TABLE IF EXISTS "User";

-- 2. Schema Implementation
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Tournament" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES "User"(id),
    bracket_size INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "TournamentMember" (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES "Tournament"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    ranking INTEGER DEFAULT 0 -- 0 means unranked/active, 1=1st, 2=2nd, etc.
);

CREATE TABLE "Match" (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES "Tournament"(id) ON DELETE CASCADE,
    player1_id INTEGER REFERENCES "User"(id),
    player2_id INTEGER REFERENCES "User"(id),
    winner_id INTEGER REFERENCES "User"(id),
    round_number INTEGER NOT NULL,
    match_order INTEGER DEFAULT 1,
    match_status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Placeholder Data
-- Create the Team
INSERT INTO "User" (username, email, password_hash) VALUES 
('Nathan', 'nathan@test.com', 'pass123'),
('Harry', 'harry@test.com', 'pass123'),
('Rahul', 'rahul@test.com', 'pass123'),
('Alex', 'alex@test.com', 'pass123');

-- Create Tournament
INSERT INTO "Tournament" (name, description, created_by, bracket_size) 
VALUES ('Week 1 Demo Cup', 'Integration Successful - MVP Active', 1, 8);

-- Fill Tournament with People (Assigning initial ranks)
INSERT INTO "TournamentMember" (tournament_id, user_id, role, ranking) VALUES 
(1, 1, 'organizer', 0),
(1, 2, 'player', 0),
(1, 3, 'player', 0),
(1, 4, 'player', 0);

-- Create a Placeholder Match (Nathan vs Harry)
INSERT INTO "Match" (tournament_id, round_number, match_order, player1_id, player2_id) 
VALUES (1, 1, 1, 1, 2);