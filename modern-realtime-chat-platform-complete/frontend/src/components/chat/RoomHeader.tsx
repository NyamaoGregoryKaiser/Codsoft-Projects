import React from 'react';
import { Room } from '../../types';

interface RoomHeaderProps {
  room: Room;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ room }) => {
  return (
    <div className="flex items-center border-b border-gray-700 bg-gray-800 p-4 shadow-md">
      <h2 className="text-xl font-semibold text-white">{room.name}</h2>
      {/* You could add more details here, like member count, room type icon, etc. */}
      {/* <span className="ml-3 text-sm text-gray-400">{room.type === 'private' ? 'Private' : 'Public'}</span> */}
    </div>
  );
};

export default RoomHeader;