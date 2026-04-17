"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Filter, Search } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { UserDetailModal } from "@/components/user-detail-modal";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// Mock liked users for fallback
const mockLikedUsers = [
  {
    id: "1",
    nickname: "小雨",
    grade: "大二",
    major: "计算机科学与技术",
    avatar: null,
    isMatch: true,
    lastActive: "2分钟前",
    bio: "喜欢编程、摄影和旅行，想找志同道合的朋友",
    tags: ["编程", "摄影", "旅行"],
    location: "北京",
  },
  {
    id: "2",
    nickname: "晓晓",
    grade: "大一",
    major: "新闻传播",
    avatar: null,
    isMatch: false,
    lastActive: "1小时前",
    bio: "热爱写作和绘画，喜欢记录生活中的美好",
    tags: ["写作", "绘画", "摄影"],
    location: "上海",
  },
  {
    id: "3",
    nickname: "思琪",
    grade: "大二",
    major: "心理学",
    avatar: null,
    isMatch: true,
    lastActive: "刚刚",
    bio: "喜欢观察人，对心理学充满热情",
    tags: ["心理学", "甜品", "电影"],
    location: "杭州",
  },
  {
    id: "4",
    nickname: "诗涵",
    grade: "大三",
    major: "设计学",
    avatar: null,
    isMatch: false,
    lastActive: "3小时前",
    bio: "设计是我的 passion，喜欢探索视觉美学",
    tags: ["设计", "艺术", "音乐"],
    location: "广州",
  },
  {
    id: "5",
    nickname: "浩然",
    grade: "研一",
    major: "人工智能",
    avatar: null,
    isMatch: true,
    lastActive: "5分钟前",
    bio: "AI 方向研究生，喜欢健身和游戏",
    tags: ["AI", "健身", "游戏"],
    location: "深圳",
  },
  {
    id: "6",
    nickname: "阿明",
    grade: "大三",
    major: "经济学",
    avatar: null,
    isMatch: false,
    lastActive: "昨天",
    bio: "热爱篮球和音乐，经济学是我的专业",
    tags: ["篮球", "音乐", "阅读"],
    location: "成都",
  },
];

export default function LikesPage() {
  const [activeTab, setActiveTab] = useState<"all" | "matches">("all");
  const [selectedUser, setSelectedUser] = useState<typeof mockLikedUsers[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedUsers, setLikedUsers] = useState(mockLikedUsers);
  const [matches, setMatches] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current user and fetch likes
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      setCurrentUser(user.id);

      // Fetch users I liked
      const { data: likesData } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', user.id);

      const likedUserIds = likesData?.map(l => l.to_user) || [];

      // Fetch my matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      const matchedUserIds = matchesData?.map(m => 
        m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1
      ) || [];
      setMatches(matchedUserIds);

      // Fetch profiles of liked users
      if (likedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', likedUserIds);

        if (profiles) {
          const formatted = profiles.map(p => ({
            id: p.id,
            nickname: p.nickname,
            grade: p.grade || '未知年级',
            major: p.major || '未知专业',
            avatar: p.avatar_url,
            isMatch: matchedUserIds.includes(p.id),
            lastActive: '刚刚',
            bio: p.bio || '暂无简介',
            tags: p.tags || [],
            location: p.school || '未知地点',
          }));
          setLikedUsers(formatted);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredUsers = likedUsers
    .filter(u => activeTab === "matches" ? u.isMatch : true)
    .filter(u => 
      searchQuery === "" || 
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.major.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleUserClick = (user: typeof likedUsers[0]) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const handleStartChat = (userId: string) => {
    console.log("开始聊天:", userId);
    // TODO: 跳转到聊天页面
    handleCloseModal();
  };

  return (
    <main className="flex-1 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-gray-900">喜欢</h1>
            <span className="text-sm text-gray-500">
              {activeTab === "matches" 
                ? `${likedUsers.filter((u: any) => u.isMatch).length} 匹配` 
                : `${likedUsers.length} 喜欢`}
            </span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索昵称或专业..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "all"
                  ? "text-[#0071e3] border-[#0071e3]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              )}
            >
              全部喜欢
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={cn(
                "py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "matches"
                  ? "text-[#0071e3] border-[#0071e3]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              )}
            >
              互相喜欢
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#ff2d55] text-white text-xs rounded-full">
                {likedUsers.filter((u: any) => u.isMatch).length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
              >
                {/* Avatar */}
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.nickname}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white text-2xl font-semibold">
                        {user.nickname.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  {/* Match Badge */}
                  {user.isMatch && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-[#ff2d55] rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{user.nickname}</h3>
                    {user.isMatch && (
                      <MessageCircle className="w-4 h-4 text-[#0071e3]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{user.grade} · {user.major}</p>
                  <p className="text-xs text-gray-400">{user.lastActive}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery 
                ? "没有找到匹配的结果" 
                : activeTab === "matches" 
                  ? "还没有匹配" 
                  : "还没有喜欢任何人"}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              {searchQuery
                ? "试试其他关键词搜索"
                : activeTab === "matches"
                  ? "当你们互相喜欢时，会出现在这里"
                  : "在发现页面浏览同学资料，点击喜欢来表达心意"}
            </p>
            {!searchQuery && activeTab === "all" && (
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white text-sm font-medium rounded-full hover:bg-[#0077ed] transition-colors shadow-lg shadow-blue-500/25"
              >
                去发现
              </a>
            )}
          </div>
        )}
      </div>

      <BottomNav />

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStartChat={handleStartChat}
      />
    </main>
  );
}
