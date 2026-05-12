-- ============================================================
-- BURELIO SISTEMA – Supabase duomenų bazės schema
-- Šį kodą reikia paleisti Supabase SQL Editor
-- ============================================================

-- 1. PROFILES lentelė (vartotojai: admin ir mokytojai)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  vardas TEXT NOT NULL DEFAULT '',
  pavarde TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  grupe_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VAIKAI lentelė
CREATE TABLE vaikai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vardas TEXT NOT NULL,
  pavarde TEXT NOT NULL,
  klase TEXT,
  grupe_id TEXT,
  email TEXT,
  tel TEXT,
  pastabos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LANKOMUMAS lentelė
CREATE TABLE lankomumas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaikas_id UUID REFERENCES vaikai(id) ON DELETE CASCADE,
  grupe_id TEXT NOT NULL,
  savaite DATE NOT NULL,
  atejo BOOLEAN NOT NULL DEFAULT false,
  pazymejo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vaikas_id, grupe_id, savaite)
);

-- 4. MOKEJIMAS lentelė
CREATE TABLE mokejimas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaikas_id UUID REFERENCES vaikai(id) ON DELETE CASCADE,
  menuo INTEGER NOT NULL CHECK (menuo BETWEEN 1 AND 12),
  sumoketa BOOLEAN DEFAULT false,
  data TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vaikas_id, menuo)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) – prieigos kontrolė
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaikai ENABLE ROW LEVEL SECURITY;
ALTER TABLE lankomumas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mokejimas ENABLE ROW LEVEL SECURITY;

-- PROFILES: kiekvienas mato tik savo profilį; admin mato visus
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles_update_admin" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- VAIKAI: admin gali viską; mokytojai mato tik vardo/pavardės laukus per lankomumas
CREATE POLICY "vaikai_admin" ON vaikai FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "vaikai_teacher_select" ON vaikai FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));

-- LANKOMUMAS: admin gali viską; mokytojai gali žymėti savo grupes
CREATE POLICY "lankomumas_admin" ON lankomumas FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "lankomumas_teacher" ON lankomumas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'teacher' AND grupe_id = ANY(grupe_ids)
  ));

-- MOKEJIMAS: tik admin
CREATE POLICY "mokejimas_admin" ON mokejimas FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: automatiškai sukurti profilį kai user prisiregistruoja
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, vardas, pavarde, role)
  VALUES (NEW.id, NEW.email, '', '', 'teacher')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ADMIN vartotojo sukūrimas (pakeiskite el. paštą ir slaptažodį!)
-- Šį bloką paleiskite ATSKIRAI po vartotojo sukūrimo Supabase Auth
-- ============================================================
-- UPDATE profiles SET role = 'admin', vardas = 'Jūsų Vardas', pavarde = 'Jūsų Pavardė'
-- WHERE email = 'jusu@pastas.lt';
