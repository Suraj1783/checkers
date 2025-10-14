import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, UserPlus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateRoomCode, formatRoomCode } from '@/utils/roomCode';

interface RoomSetupProps {
  onRoomReady: (roomCode: string, playerNumber: 1 | 2, playerName: string) => void;
}

const RoomSetup = ({ onRoomReady }: RoomSetupProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const newRoomCode = generateRoomCode();

    const { error } = await supabase
      .from('rooms')
      .insert({
        room_code: newRoomCode,
        player1_id: crypto.randomUUID(),
        current_turn: 'black',
        status: 'waiting'
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    // Send system message
    await supabase.from('chat_messages').insert({
      room_code: newRoomCode,
      player_name: 'System',
      message: `${playerName} created the room`,
      is_system: true
    });

    setRoomCode(newRoomCode);
    setIsLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and room code',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const formattedCode = formatRoomCode(roomCode);

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', formattedCode)
      .single();

    if (error || !room) {
      toast({
        title: 'Room Not Found',
        description: 'Invalid room code',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    if (room.status !== 'waiting') {
      toast({
        title: 'Room Full',
        description: 'This game is already in progress',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        player2_id: crypto.randomUUID(),
        status: 'active'
      })
      .eq('room_code', formattedCode);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    // Send system message
    await supabase.from('chat_messages').insert({
      room_code: formattedCode,
      player_name: 'System',
      message: `${playerName} joined the room`,
      is_system: true
    });

    onRoomReady(formattedCode, 2, playerName);
    setIsLoading(false);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Room code copied to clipboard'
    });
  };

  if (mode === 'select') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="mb-8"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Gamepad2 className="w-20 h-20 text-accent" />
        </motion.div>
        <h1 className="text-5xl font-bold mb-4 text-foreground">Checkers Royal</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Classic checkers with real-time multiplayer. Create a room or join with a code!
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Button
            size="lg"
            onClick={() => setMode('create')}
            className="w-full"
          >
            <Gamepad2 className="mr-2 w-5 h-5" />
            Create Room
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setMode('join')}
            className="w-full"
          >
            <UserPlus className="mr-2 w-5 h-5" />
            Join Room
          </Button>
        </div>
      </motion.div>
    );
  }

  if (mode === 'create') {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Room</CardTitle>
            <CardDescription>
              {roomCode ? 'Share this code with your opponent' : 'Enter your name to create a room'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!roomCode ? (
              <>
                <Input
                  placeholder="Your Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMode('select')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={createRoom}
                    disabled={isLoading}
                  >
                    Create Room
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-accent tracking-widest">
                      {roomCode}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyRoomCode}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Waiting for opponent to join...
                </p>
                <Button
                  variant="outline"
                  onClick={() => onRoomReady(roomCode, 1, playerName)}
                  className="w-full"
                >
                  Enter Game Room
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Room</CardTitle>
          <CardDescription>Enter the room code and your name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Room Code (e.g., ABC123)"
            value={roomCode}
            onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
            maxLength={6}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={joinRoom}
              disabled={isLoading}
            >
              Join Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoomSetup;
