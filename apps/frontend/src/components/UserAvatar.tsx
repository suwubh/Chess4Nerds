import { useUser } from '@repo/store/src/hooks/useUser';
import { Metadata, Player } from '../screens/Game';

interface UserAvatarProps {
  gameMetadata: Metadata | null;
  self?: boolean;
}

export const UserAvatar = ({ gameMetadata, self }: UserAvatarProps) => {
  const user = useUser();
  if (!gameMetadata) return null;

  const isBlack = gameMetadata.blackPlayer.id === user?.id;
  const player: Player | undefined = isBlack
    ? self ? gameMetadata.blackPlayer : gameMetadata.whitePlayer
    : self ? gameMetadata.whitePlayer : gameMetadata.blackPlayer;

  return (
    <div className="text-white flex gap-2">
      <p>{player?.name}</p>
      {player?.isGuest && <p className="text-gray-500">[Guest]</p>}
    </div>
  );
};
