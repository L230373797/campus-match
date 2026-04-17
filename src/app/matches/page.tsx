"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, ChevronRight, Search } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Mock matches for fallback
const mockMatches = [
  {
    id: "1",
    user: {
      nickname: "小雨",
      avatar: null,
    },
    lastMessage: "你好呀，我也喜欢摄影！",
    lastMessageTime: "2分钟前",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    user: {
      nickname: "思琪",
      avatar: null,
    },
    lastMessage: "周末有空一起喝咖啡吗？",
    lastMessageTime: "1小时前",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    user: {
      nickname: "诗涵",
      avatar: null,
    },
    lastMessage: "哈哈，我也觉得",
    lastMessageTime: "昨天",
    unreadCount: 0,
    isOnline: true,
  },
];

export default function MatchesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState(mockMatches);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Fetch matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (matchesData && matchesData.length > 0) {
        const matchedUserIds = matchesData.map(m => 
          m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1
        );

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', matchedUserIds);

        if (profiles) {
          const formatted = profiles.map((p, index) => ({
            id: matchesData[index].id, // Use match ID, not user ID
            user: {
              nickname: p.nickname,
              avatar: p.avatar_url,
            },
            lastMessage: '匹配成功，开始聊天吧！',
            lastMessageTime: '刚刚',
            unreadCount: 0,
            isOnline: false,
          }));
          setMatches(formatted);
        }
      } else {
        setMatches([]);
      }
      setLoading(false);
    };

    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((m: any) =>
    m.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-gray-900">消息</h1>
            <span className="text-sm text-gray-500">{matches.length}个匹配</span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索聊天记录"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto pb-24">
        {filteredMatches.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredMatches.map((match: any) => (
              <Link
                key={match.id}
                href={`/chat/${match.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white text-lg font-semibold">
                    {match.user.nickname.charAt(0)}
                  </div>
                  {match.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-gray-900">{match.user.nickname}</h3>
                    <span className="text-xs text-gray-400">{match.lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm truncate pr-4",
                      match.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                    )}>
                      {match.lastMessage}
                    </p>
                    {match.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-[#ff2d55] text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {match.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              还没有匹配
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              当你们互相喜欢时，就可以开始聊天了
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
