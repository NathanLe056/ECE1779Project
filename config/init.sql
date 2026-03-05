CREATE TABLE IF not EXISTS brackets (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF not EXISTS participants (
  id UUID PRIMARY KEY,
  bracket_id UUID REFERENCES brackets(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF not EXISTS matches (
  id UUID PRIMARY KEY,
  bracket_id UUID REFERENCES brackets(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  match_number INT NOT NULL,
  participant1_id UUID REFERENCES participants(id),
  participant2_id UUID REFERENCES participants(id),
  winner_id UUID REFERENCES participants(id)
);