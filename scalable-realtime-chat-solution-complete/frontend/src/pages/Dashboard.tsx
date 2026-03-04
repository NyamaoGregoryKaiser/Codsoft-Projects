```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Channel } from 'types';
import axios from 'api/axios';
import ChannelCard from 'components/ChannelCard';
import './Dashboard.css'; // For styling
import { useAuth } from 'auth/AuthContext';

const Dashboard: React.FC = () => {
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isAuthenticated) {
      fetchChannels();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myRes, publicRes] = await Promise.all([
        axios.get('/channels/my'),
        axios.get('/channels/public'),
      ]);
      setMyChannels(myRes.data);
      setPublicChannels(publicRes.data);
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setError(err.response?.data?.message || 'Failed to load channels.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      alert('Channel name cannot be empty.');
      return;
    }
    setIsCreatingChannel(true);
    try {
      await axios.post('/channels', {
        name: newChannelName,
        description: newChannelDescription || null,
        isPrivate: newChannelIsPrivate,
      });
      alert('Channel created successfully!');
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelIsPrivate(false);
      fetchChannels(); // Re-fetch channels to update the list
    } catch (err: any) {
      console.error('Failed to create channel:', err);
      alert(err.response?.data?.message || 'Failed to create channel.');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      await axios.post(`/channels/${channelId}/join`);
      alert('Successfully joined channel!');
      fetchChannels(); // Re-fetch to move channel from public to myChannels
    } catch (err: any) {
      console.error('Failed to join channel:', err);
      alert(err.response?.data?.message || 'Failed to join channel.');
    }
  };

  if (authLoading || loading) {
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="channel-creation-section">
        <h2 className="section-title">Create New Channel</h2>
        <form onSubmit={handleCreateChannel} className="create-channel-form">
          <input
            type="text"
            placeholder="Channel Name (e.g., general-chat)"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            required
            disabled={isCreatingChannel}
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newChannelDescription}
            onChange={(e) => setNewChannelDescription(e.target.value)}
            disabled={isCreatingChannel}
          />
          <label className="private-checkbox-label">
            <input
              type="checkbox"
              checked={newChannelIsPrivate}
              onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
              disabled={isCreatingChannel}
            />
            Private Channel
          </label>
          <button type="submit" disabled={isCreatingChannel}>
            {isCreatingChannel ? 'Creating...' : 'Create Channel'}
          </button>
        </form>
      </div>

      <div className="channel-list-section">
        <h2 className="section-title">My Channels</h2>
        <div className="channel-cards-grid">
          {myChannels.length > 0 ? (
            myChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))
          ) : (
            <p>You haven't joined any channels yet.</p>
          )}
        </div>
      </div>

      <div className="channel-list-section">
        <h2 className="section-title">Public Channels to Join</h2>
        <div className="channel-cards-grid">
          {publicChannels.length > 0 ? (
            publicChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onJoin={handleJoinChannel}
                showJoinButton={true}
              />
            ))
          ) : (
            <p>No public channels available to join.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```