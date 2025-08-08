-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mindmaps table
CREATE TABLE public.mindmaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    mindmap_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'not-started',
  target_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  framework_data JSONB,
  roadmap_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_steps table
CREATE TABLE IF NOT EXISTS goal_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_time INTEGER DEFAULT 60,
  actual_time INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  "order" INTEGER DEFAULT 1,
  phase TEXT DEFAULT 'Phase 1',
  difficulty TEXT DEFAULT 'Beginner',
  resources JSONB DEFAULT '[]',
  success_criteria TEXT,
  tips TEXT,
  prerequisites JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  step_id UUID REFERENCES goal_steps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'goal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No authentication required - public access

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION public.search_knowledge(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        knowledge_chunks.id,
        knowledge_chunks.content,
        knowledge_chunks.metadata,
        1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
    FROM knowledge_chunks
    WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own goals" ON goals
  FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (user_id = current_user);

CREATE POLICY "Users can view steps for their goals" ON goal_steps
  FOR SELECT USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = current_user)
  );

CREATE POLICY "Users can insert steps for their goals" ON goal_steps
  FOR INSERT WITH CHECK (
    goal_id IN (SELECT id FROM goals WHERE user_id = current_user)
  );

CREATE POLICY "Users can update steps for their goals" ON goal_steps
  FOR UPDATE USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = current_user)
  );

CREATE POLICY "Users can delete steps for their goals" ON goal_steps
  FOR DELETE USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = current_user)
  );

CREATE POLICY "Users can view their own reminders" ON reminders
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own reminders" ON reminders
  FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own reminders" ON reminders
  FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own reminders" ON reminders
  FOR DELETE USING (user_id = current_user);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_steps_updated_at BEFORE UPDATE ON goal_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();