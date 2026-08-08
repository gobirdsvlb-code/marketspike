import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { useListFriends, useAddFriend, useRemoveFriend, getListFriendsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, UserMinus, Zap, ShieldAlert, Loader2, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

type FriendEntry = {
  id: number;
  userId: number;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  status: string;
  direction: string;
};

export default function Friends() {
  const queryClient = useQueryClient();
  const { data: allEntries = [], isLoading } = useListFriends() as { data: FriendEntry[]; isLoading: boolean };
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();

  const [searchUsername, setSearchUsername] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);

  const friends = allEntries.filter(f => f.status === 'accepted');
  const received = allEntries.filter(f => f.status === 'pending' && f.direction === 'received');
  const sent = allEntries.filter(f => f.status === 'pending' && f.direction === 'sent');

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    addFriend.mutate(
      { data: { username: searchUsername.trim() } },
      {
        onSuccess: () => {
          toast.success(`Friend request sent to ${searchUsername}!`);
          setSearchUsername('');
          refresh();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Could not find user or request already sent.');
        },
      }
    );
  };

  const handleAccept = async (id: number, username: string) => {
    setAcceptingId(id);
    try {
      const res = await fetch(`/api/friends/accept/${id}`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success(`You and ${username} are now friends! 🎉`);
      refresh();
    } catch {
      toast.error('Failed to accept request');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (id: number) => {
    setDecliningId(id);
    try {
      const res = await fetch(`/api/friends/decline/${id}`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error();
      refresh();
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setDecliningId(null);
    }
  };

  const handleRemove = (id: number, username: string) => {
    removeFriend.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success(`Removed ${username}`);
          refresh();
        },
        onError: () => toast.error('Failed to remove friend'),
      }
    );
  };

  const FriendCard = ({ f, actions }: { f: FriendEntry; actions: React.ReactNode }) => (
    <div className="bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white shadow-sm border-2 border-background shrink-0"
        style={{ backgroundColor: f.avatarColor }}
      >
        {f.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-foreground text-lg truncate">{f.username}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent" /> Lvl {f.level}
          </span>
          <span className="text-xs text-muted-foreground">· {f.xp.toLocaleString()} XP</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <header className="mb-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic text-foreground">
            Friends Network
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Connect with other traders — your friends earn XP together with you!
          </p>
        </header>

        {/* Send Request */}
        <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Send a Friend Request</p>
          <form onSubmit={handleSendRequest} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={searchUsername}
                onChange={e => setSearchUsername(e.target.value)}
                placeholder="Search by username…"
                className="w-full bg-background border-2 border-border rounded-xl pl-12 pr-4 py-4 font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={addFriend.isPending || !searchUsername.trim()}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-black uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {addFriend.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              Send Request
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card border-2 border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Received requests */}
            {received.length > 0 && (
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Incoming Requests
                  <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">{received.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {received.map(f => (
                    <FriendCard key={f.id} f={f} actions={
                      <>
                        <button
                          onClick={() => handleAccept(f.id, f.username)}
                          disabled={acceptingId === f.id}
                          className="p-2.5 rounded-xl bg-gain/10 text-gain hover:bg-gain/20 transition-colors"
                          title="Accept"
                        >
                          {acceptingId === f.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDecline(f.id)}
                          disabled={decliningId === f.id}
                          className="p-2.5 rounded-xl bg-loss/10 text-loss hover:bg-loss/20 transition-colors"
                          title="Decline"
                        >
                          {decliningId === f.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                        </button>
                      </>
                    } />
                  ))}
                </div>
              </div>
            )}

            {/* Sent requests */}
            {sent.length > 0 && (
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-4">Sent Requests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sent.map(f => (
                    <FriendCard key={f.id} f={f} actions={
                      <button
                        onClick={() => handleDecline(f.id)}
                        disabled={decliningId === f.id}
                        className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-colors text-xs font-bold"
                        title="Cancel request"
                      >
                        {decliningId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                      </button>
                    } />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted friends */}
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-4">
                Your Friends {friends.length > 0 && <span className="text-foreground">({friends.length})</span>}
              </h2>
              {friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map(f => (
                    <FriendCard key={f.id} f={f} actions={
                      <button
                        onClick={() => handleRemove(f.id, f.username)}
                        disabled={removeFriend.isPending}
                        className="p-3 text-muted-foreground hover:bg-loss/10 hover:text-loss rounded-xl transition-colors"
                        title="Remove Friend"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    } />
                  ))}
                </div>
              ) : (
                <div className="bg-card border-2 border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">No friends yet</h3>
                  <p className="text-muted-foreground font-medium text-lg max-w-md">
                    Send a request above — when they accept, you'll both earn XP together!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
