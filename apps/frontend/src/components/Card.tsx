import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import chessIcon from '../../public/chess.png';
import computerIcon from '../../public/computer.png';
import lightningIcon from '../../public/lightning-bolt.png';
import friendIcon from '../../public/friendship.png';
import GameModeComponent from './GameModeComponent';

export function PlayCard() {
  const navigate = useNavigate();

  const gameModeData = [
    {
      icon: (
        <img
          src={lightningIcon}
          className="inline-block mt-1 h-7 w-7"
          alt="online"
        />
      ),
      title: 'Play Online',
      description: 'Play vs a Person of Similar Skill',
      onClick: () => {
        navigate('/game/random');
      },
      disabled: false,
    },
    {
      icon: (
        <img
          src={computerIcon}
          className="inline-block mt-1 h-7 w-7"
          alt="computer"
        />
      ),
      title: 'Play vs Computer',
      description: 'Challenge a bot from easy to master',
      onClick: () => {
        navigate('/game/computer');
      },
      disabled: false, // Enable computer mode
    },
    {
      icon: (
        <img
          src={friendIcon}
          className="inline-block mt-1 h-7 w-7"
          alt="friend"
        />
      ),
      title: 'Play a Friend',
      description: 'Invite a Friend to a game of Chess',
      disabled: true, // Keep this disabled for now
    },
  ];

  return (
    <Card className="bg-transparent border-none">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="font-semibold tracking-wide flex flex-col items-center justify-center">
          <p className='text-white'>
            Welcome to
          </p>
          <img className="pl-1 w-1/2 mt-4" src={chessIcon} alt="chess" />
        </CardTitle>
        <CardDescription />
      </CardHeader>
      <CardContent className="grid gap-2 cursor-pointer mt-1">
        {gameModeData.map((data, index) => {
          return <GameModeComponent key={index} {...data} />;
        })}
      </CardContent>
    </Card>
  );
}
