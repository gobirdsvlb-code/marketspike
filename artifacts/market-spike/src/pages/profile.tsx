import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { useGetCurrentUser, useUpdateCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, Zap, Trophy, Loader2, LogIn, Coins, Lock, Camera, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

/* ─── constants ─────────────────────────────────────────── */
const FREE_COLORS = [
  '#6366f1','#ef4444','#f97316','#22c55e',
  '#a855f7','#3b82f6','#ec4899','#14b8a6',
];

const PREMIUM_AVATARS = [
  { id: '🦁', name: 'Lion'      },
  { id: '🐯', name: 'Tiger'     },
  { id: '🦊', name: 'Fox'       },
  { id: '🐺', name: 'Wolf'      },
  { id: '🦄', name: 'Unicorn'   },
  { id: '🐲', name: 'Dragon'    },
  { id: '🦅', name: 'Eagle'     },
  { id: '🐬', name: 'Dolphin'   },
  { id: '🦖', name: 'T-Rex'     },
  { id: '🤖', name: 'Robot'     },
  { id: '👾', name: 'Alien'     },
  { id: '🔥', name: 'Fire'      },
  { id: '⚡', name: 'Thunder'   },
  { id: '💎', name: 'Diamond'   },
  { id: '🎭', name: 'Mask'      },
];

const AVATAR_COST = 100;
const CAMERA_COST = 2000;

/* ─── helpers ────────────────────────────────────────────── */
function AvatarPreview({
  avatarUrl, avatarColor, username, size = 128,
}: { avatarUrl?: string | null; avatarColor: string; username: string; size?: number }) {
  const isPhoto = avatarUrl?.startsWith('data:') || avatarUrl?.startsWith('http');
  const isEmoji = avatarUrl && !isPhoto && avatarUrl.length <= 8;
  const fontSize = size * 0.4;
  return (
    <div
      className="rounded-full flex items-center justify-center border-4 border-background shadow-xl overflow-hidden transition-colors duration-300 shrink-0"
      style={{ width: size, height: size, backgroundColor: avatarColor }}
    >
      {isPhoto  && <img src={avatarUrl!} className="w-full h-full object-cover" />}
      {isEmoji  && <span style={{ fontSize }} className="leading-none select-none">{avatarUrl}</span>}
      {!isPhoto && !isEmoji && (
        <span className="font-black text-white uppercase" style={{ fontSize: size * 0.3 }}>
          {username ? username.substring(0, 2) : '??'}
        </span>
      )}
    </div>
  );
}

/* ─── camera modal ───────────────────────────────────────── */
function CameraModal({
  onCapture,
  onClose,
}: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream,   setStream]   = useState<MediaStream | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let s: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(mediaStream => {
        s = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
        setStarting(false);
      })
      .catch(err => {
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings.'
            : `Could not access camera: ${err.message}`
        );
        setStarting(false);
      });
    return () => { s?.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const dim = Math.min(v.videoWidth, v.videoHeight);
    const ox  = (v.videoWidth  - dim) / 2;
    const oy  = (v.videoHeight - dim) / 2;
    c.width  = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(v, ox, oy, dim, dim, 0, 0, 256, 256);
    setPreview(c.toDataURL('image/jpeg', 0.85));
  };

  const handleUse = () => {
    if (preview) {
      stream?.getTracks().forEach(t => t.stop());
      onCapture(preview);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-foreground">Take Your Photo</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {starting && (
          <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" /> Requesting camera…
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-sm text-destructive font-medium text-center">
            {error}
          </div>
        )}

        {!error && !starting && (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
              {!preview && (
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
              )}
              {preview && (
                <img src={preview} className="w-full h-full object-cover" />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3">
              {!preview ? (
                <button
                  onClick={handleSnap}
                  className="flex-1 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" /> Snap!
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setPreview(null)}
                    className="flex-1 py-3 bg-muted text-foreground font-black rounded-2xl hover:bg-muted/80 transition-all"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleUse}
                    className="flex-1 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Use Photo
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */
export default function Profile() {
  const queryClient  = useQueryClient();
  const { data: user }  = useGetCurrentUser();
  const { user: authUser, isLoading, openAuthModal } = useAuth();
  const updateUser   = useUpdateCurrentUser();

  const [username,     setUsername]     = useState('');
  const [bio,          setBio]          = useState('');
  const [avatarColor,  setAvatarColor]  = useState(FREE_COLORS[0]);
  const [avatarUrl,    setAvatarUrl]    = useState<string | undefined>(undefined);
  const [buyingId,     setBuyingId]     = useState<string | null>(null);
  const [showCamera,   setShowCamera]   = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarColor(user.avatarColor || FREE_COLORS[0]);
      setAvatarUrl(user.avatarUrl ?? undefined);
    }
  }, [user]);

  const handleSave = (overrideUrl?: string) => {
    if (!username.trim()) { toast.error('Username cannot be empty'); return; }
    const finalUrl = overrideUrl !== undefined ? overrideUrl : avatarUrl;
    updateUser.mutate(
      { data: { username, bio, avatarColor, avatarUrl: finalUrl ?? undefined } },
      {
        onSuccess: () => {
          toast.success('Profile updated!');
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        },
        onError: () => toast.error('Failed to update profile'),
      }
    );
  };

  /* buy an emoji avatar or the camera slot */
  const handleBuyAvatar = async (avatarId: string) => {
    setBuyingId(avatarId);
    try {
      const r    = await fetch('/api/users/me/buy-avatar', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const cost = avatarId === 'camera' ? CAMERA_COST : AVATAR_COST;
      toast.success(`🪙 Unlocked! −${cost} coins`);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    } catch (e: any) {
      toast.error(e.message || 'Purchase failed');
    } finally {
      setBuyingId(null);
    }
  };

  /* set an emoji as the active avatar and immediately save */
  const handleSelectEmoji = (emoji: string) => {
    setAvatarUrl(emoji);
    // save immediately
    if (!username.trim()) return;
    updateUser.mutate(
      { data: { username, bio, avatarColor, avatarUrl: emoji } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }) }
    );
  };

  /* camera capture flow */
  const handleCameraCapture = (dataUrl: string) => {
    setShowCamera(false);
    setAvatarUrl(dataUrl);
    handleSave(dataUrl);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!authUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Sign in to access this page</h2>
          <p className="text-muted-foreground font-medium max-w-xs mb-6">
            Sign in to access this page and save your amazing work!
          </p>
          <button onClick={openAuthModal}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
            Sign In / Create Account
          </button>
        </div>
      </Layout>
    );
  }

  const unlockedAvatars: string[] = user?.unlockedColors ?? [];
  const cameraUnlocked = unlockedAvatars.includes('camera');

  return (
    <Layout>
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic text-foreground">
            Trader Profile
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Customize your identity and view your stats.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Edit Form ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Basic info card */}
            <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <AvatarPreview
                    avatarUrl={avatarUrl}
                    avatarColor={avatarColor}
                    username={username}
                  />
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Preview</div>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-6 w-full">
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Username</label>
                    <input
                      type="text" value={username} onChange={e => setUsername(e.target.value)}
                      className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Bio</label>
                    <textarea
                      value={bio} onChange={e => setBio(e.target.value)}
                      maxLength={120} rows={3}
                      className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Write a short bio…"
                    />
                    <div className="text-right text-xs font-bold text-muted-foreground mt-1">{bio.length} / 120</div>
                  </div>

                  {/* Background color swatches */}
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Background Color</label>
                    <div className="flex flex-wrap gap-3">
                      {FREE_COLORS.map(color => (
                        <button key={color} onClick={() => setAvatarColor(color)}
                          className={`w-9 h-9 rounded-full transition-transform ${avatarColor === color ? 'scale-110 ring-4 ring-offset-2 ring-offset-card ring-primary' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button onClick={() => handleSave()} disabled={updateUser.isPending}
                    className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-black uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    {updateUser.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* ── Premium Avatars ── */}
            <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-black text-lg uppercase tracking-widest text-foreground">Premium Avatars</h2>
                  <p className="text-sm text-muted-foreground">Unlock exclusive emoji avatars with Spike Coins.</p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-black text-yellow-600">{(user?.coins ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground font-medium">coins</span>
                </div>
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                {PREMIUM_AVATARS.map(({ id: emoji, name }) => {
                  const isUnlocked = unlockedAvatars.includes(emoji);
                  const isActive   = avatarUrl === emoji;
                  const isBuying   = buyingId === emoji;

                  return (
                    <div key={emoji} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (isUnlocked) handleSelectEmoji(emoji);
                          else if (!isBuying) handleBuyAvatar(emoji);
                        }}
                        disabled={isBuying}
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all
                          ${isActive  ? 'ring-4 ring-primary ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'}
                          ${isUnlocked ? 'bg-muted/60' : 'bg-muted/30 opacity-70'}
                        `}
                      >
                        <span className="leading-none">{emoji}</span>
                        {!isUnlocked && !isBuying && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/25">
                            <Lock className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                        {isBuying && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </button>
                      <span className="text-xs font-bold text-foreground leading-tight text-center">{name}</span>
                      {isUnlocked ? (
                        <span className="text-xs text-green-500 font-bold">Owned</span>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <Coins className="w-2.5 h-2.5 text-yellow-500" />
                          <span className="text-xs font-black text-yellow-600">{AVATAR_COST}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Camera / Selfie avatar */}
              {(() => {
                const hasPhoto = avatarUrl?.startsWith('data:') || avatarUrl?.startsWith('http');
                return (
                  <div className={`rounded-2xl border-2 p-5 flex items-center gap-5 transition-all
                    ${cameraUnlocked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20'}`}>
                    {/* Thumbnail: show the real selfie if one exists, otherwise placeholder */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden
                      ${cameraUnlocked ? 'bg-primary/15' : 'bg-muted/50'}`}>
                      {hasPhoto && cameraUnlocked
                        ? <img src={avatarUrl!} className="w-full h-full object-cover" />
                        : <span className="text-3xl">📷</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-foreground">Selfie Avatar</div>
                      <div className="text-sm text-muted-foreground">
                        {cameraUnlocked
                          ? hasPhoto
                            ? 'Your selfie is your avatar! Tap to retake.'
                            : 'Take a selfie — your real photo becomes your avatar.'
                          : `Unlock for ${CAMERA_COST.toLocaleString()} coins — use a selfie as your avatar.`}
                      </div>
                    </div>
                    {cameraUnlocked ? (
                      <button
                        onClick={() => setShowCamera(true)}
                        className="shrink-0 px-5 py-2.5 bg-primary text-white font-black rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        {hasPhoto ? 'Retake' : 'Take Selfie'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyAvatar('camera')}
                        disabled={buyingId === 'camera'}
                        className="shrink-0 px-5 py-2.5 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                      >
                        {buyingId === 'camera' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            {CAMERA_COST.toLocaleString()}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Stats Sidebar ── */}
          <div className="space-y-6">
            <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-yellow-400/10 to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-yellow-400/15 border-2 border-yellow-400/30 flex items-center justify-center shrink-0">
                <Coins className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Coins</div>
                <div className="text-3xl font-black text-foreground">{(user?.coins ?? 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Total XP</div>
                <div className="text-3xl font-black text-foreground">{user?.xp.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-epic/10 to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-epic/10 border-2 border-epic/20 flex items-center justify-center shrink-0">
                <Trophy className="w-8 h-8 text-epic" />
              </div>
              <div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-widests mb-1">Level</div>
                <div className="text-3xl font-black text-foreground">{user?.level}</div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm">
              <div className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Lives Today</div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Heart key={i}
                    className={`w-8 h-8 ${i < (user?.lives ?? 0) ? 'fill-loss text-loss' : 'text-muted-foreground opacity-30'}`}
                  />
                ))}
              </div>
              <div className="mt-3 text-sm font-medium text-muted-foreground">
                {user?.lives ?? 0} out of 5 remaining
              </div>
            </div>
          </div>
        </div>
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
