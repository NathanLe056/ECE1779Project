-- 1. Tables
DROP TABLE IF EXISTS "Match";
DROP TABLE IF EXISTS "TournamentMember";
DROP TABLE IF EXISTS "Tournament";
DROP TABLE IF EXISTS "User";

-- 2. Create Tables
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
    role TEXT NOT NULL
);

CREATE TABLE "Match" (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES "Tournament"(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id INTEGER REFERENCES "User"(id),
    player2_id INTEGER REFERENCES "User"(id),
    winner_id INTEGER REFERENCES "User"(id),
    status TEXT DEFAULT 'scheduled'
);

-- 3. Data
INSERT INTO "User" (username, email, password_hash) 
VALUES ('Admin', 'nathan@test.com', 'hashed_pass');

INSERT INTO "Tournament" (name, description, created_by, bracket_size) 
VALUES ('Week 1 Demo Cup', 'Integration Successful', 1, 8);