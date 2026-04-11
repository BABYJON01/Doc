-- Med-Zukkoo Full-Stack Platform V2
-- PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- O'zbek tili "x/h" kabi fuzziy qidiruvlar uchun

-- ==========================================
-- 1. ROLES & USERS
-- ==========================================
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. COURSE STRUCTURE
-- ==========================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500)
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(250) NOT NULL,
    content_text TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector -- Qidiruv tizimi uchun
);

-- Index for searching (O'zbekcha)
CREATE INDEX lessons_search_idx ON lessons USING GIN(search_vector);
CREATE INDEX topics_title_trgm_idx ON topics USING gin (title gin_trgm_ops);

-- ==========================================
-- 3. INTERACTIVE CASES & QUIZZES
-- ==========================================
CREATE TABLE clinical_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    expected_diagnosis TEXT
);

CREATE TABLE hotspots_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES clinical_cases(id) ON DELETE CASCADE,
    target_x FLOAT NOT NULL,
    target_y FLOAT NOT NULL,
    radius FLOAT NOT NULL,
    pathology_name VARCHAR(150) NOT NULL
);

-- ==========================================
-- 4. GAMIFICATION & PROGRESS
-- ==========================================
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    bookmarked BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria_type VARCHAR(50) -- e.g., '10_cases_solved', 'top_1_week'
);

CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

-- ==========================================
-- 5. DISCUSSIONS / COMMENTS
-- ==========================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. AI MICROSERVICE TABLES (NEW)
-- ==========================================
CREATE TABLE lectures_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    file_type VARCHAR(10) NOT NULL, -- env: docx, pdf, pptx
    file_url VARCHAR(500) NOT NULL,
    extracted_text TEXT,
    processed_status VARCHAR(50) DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT TRUE
);

CREATE TABLE adaptive_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weak_topic_tags TEXT[], -- massiv shaklda mavzular saqlanadi
    total_quizzes_taken INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    last_evaluated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
