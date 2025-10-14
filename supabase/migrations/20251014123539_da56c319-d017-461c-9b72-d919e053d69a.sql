-- Create rooms table for game sessions
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  player1_id uuid,
  player2_id uuid,
  current_turn text CHECK (current_turn IN ('black', 'white')),
  game_state jsonb DEFAULT '{"board": [], "gameOver": false, "winner": null}'::jsonb,
  winner text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_moves table for move history
CREATE TABLE public.game_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(room_code) ON DELETE CASCADE,
  move_data jsonb NOT NULL,
  player text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(room_code) ON DELETE CASCADE,
  player_name text NOT NULL,
  message text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (public access for game rooms)
CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON public.rooms FOR UPDATE
  USING (true);

-- RLS Policies for game_moves
CREATE POLICY "Anyone can view moves"
  ON public.game_moves FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert moves"
  ON public.game_moves FOR INSERT
  WITH CHECK (true);

-- RLS Policies for chat_messages
CREATE POLICY "Anyone can view messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rooms table
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();