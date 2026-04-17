"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatUser {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

export default function ChatClient({ matchId }: { matchId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Get current user and chat data
  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) {
        if (isMounted) window.location.href = '/auth';
        return;
      }
      setCurrentUser(user.id);

      // Get match info
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (!match || !isMounted) {
        console.error('Match not found');
        return;
      }

      // Get other user ID
      const otherUserId = match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1;

      // Get other user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profile && isMounted) {
        setOtherUser(profile);
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (isMounted) {
        setMessages(messagesData || []);
        setLoading(false);
      }

      // Subscribe to new messages - only once
      if (!channelRef.current) {
        channelRef.current = supabase
          .channel(`chat:${matchId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          }, (payload) => {
            if (isMounted) {
              setMessages((prev) => [...prev, payload.new as Message]);
            }
          })
          .subscribe();
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser,
        content: newMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071e3]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href="/matches"
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              
              {otherUser && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-semibold">
                    {otherUser.nickname.charAt(0)}
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900">{otherUser.nickname}</h1>
                    <p className="text-xs text-green-500">在线</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Video className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                匹配成功！
              </h2>
              <p className="text-sm text-gray-500">
                打个招呼，开始聊天吧
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isMe = message.sender_id === currentUser;
                const showTime = index === messages.length - 1 || 
                  new Date(messages[index + 1].created_at).getTime() - new Date(message.created_at).getTime() > 5 * 60 * 1000;

                return (
                  <div key={message.id}>
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMe ? 'bg-[#0071e3] text-white' : 'bg-white text-gray-900'} rounded-2xl px-4 py-2.5 shadow-sm`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                    {showTime && (
                      <div className="flex justify-center mt-2">
                        <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-[#0071e3] text-white rounded-full hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
