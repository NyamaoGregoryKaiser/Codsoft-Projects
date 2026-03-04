```typescript
import React from 'react';
import { Channel } from 'types';
import { Link } from 'react-router-dom';
import './ChannelCard.css';

interface ChannelCardProps {
  channel: Channel;
  onJoin?: (channelId: string) => void;
  showJoinButton?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onJoin, showJoinButton = false }) => {
  const memberCount = channel.memberCount ? channel.memberCount.memberships : 0;

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if it's a link
    if (onJoin) {
      onJoin(channel.id);
    }
  };

  return (
    <div className="channel-card">
      <Link to={`/chat/${channel.id}`} className="channel-card-link">
        <h3 className="channel-card-name"># {channel.name}</h3>
        {channel.description && <p className="channel-card-description">{channel.description}</p>}
        <div className="channel-card-meta">
          <span>Creator: {channel.creator.username}</span>
          <span>Members: {memberCount}</span>
          {channel.isPrivate && <span className="channel-card-private">Private</span>}
        </div>
      </Link>
      {showJoinButton && (
        <button onClick={handleJoin} className="channel-card-join-button">
          Join
        </button>
      )}
    </div>
  );
};

export default ChannelCard;
```