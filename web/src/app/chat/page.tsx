"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createChatToken, createOrJoinChatChannel, sendChatMessage } from "../api";

type ChatMessage = { id: string; text: string; userId: string; createdAt: string };

export default function ChatPage() {
  const router = useRouter();
  const [channelType, setChannelType] = useState("messaging");
  const [channelId, setChannelId] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = useMemo(() => {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem('userId') || "";
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) router.push('/login');
  }, [router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSetupChannel() {
    try {
      setLoading(true);
      setError(null);
      if (!currentUserId) throw new Error('Missing current user');

      // Get a Stream user token from our backend (optional for client SDKs later)
      await createChatToken(currentUserId, 60);

      const parsedMembers = memberIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await createOrJoinChatChannel({
        channelType: channelType || 'messaging',
        channelId: channelId || `${[currentUserId, ...parsedMembers].sort().join('_')}`,
        createdByUserId: currentUserId,
        memberIds: parsedMembers,
        customData: { title: 'Wishlist Chat' }
      });

      setMessages(prev => prev.length ? prev : [{
        id: 'welcome',
        text: 'Channel is ready. Start chatting!',
        userId: 'system',
        createdAt: new Date().toISOString()
      }]);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to setup channel');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    try {
      if (!input.trim()) return;
      if (!currentUserId) return;
      const id = crypto.randomUUID();
      const text = input.trim();
      setInput("");
      setMessages(prev => [...prev, { id, text, userId: currentUserId, createdAt: new Date().toISOString() }]);
      await sendChatMessage({
        channelType: channelType || 'messaging',
        channelId: channelId,
        senderUserId: currentUserId,
        text,
        customData: {}
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send message');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-gray-800 dark:text-gray-100">Chat</div>
          <button onClick={() => router.back()} className="text-sm text-indigo-600 dark:text-purple-400 hover:underline">Back</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Channel Type (messaging)"
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value)}
            />
            <input
              type="text"
              placeholder="Channel Id (leave empty to auto-generate)"
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Member IDs (comma-separated)"
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={memberIds}
              onChange={(e) => setMemberIds(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSetupChannel}
              disabled={loading}
              className="px-4 py-2 rounded bg-indigo-600 dark:bg-purple-600 text-white disabled:opacity-50"
            >{loading ? 'Setting up...' : 'Create/Join Channel'}</button>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{error}</div>
          )}

          <div ref={listRef} className="h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
            {messages.map(m => (
              <div key={m.id} className={`mb-2 flex ${m.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${m.userId === currentUserId ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'}`}>
                  <div className="opacity-70 text-xs mb-1">{m.userId === 'system' ? 'System' : m.userId}</div>
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message"
              className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <button onClick={handleSend} className="px-4 py-2 rounded bg-indigo-600 dark:bg-purple-600 text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}


