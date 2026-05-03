"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Heart, MapPin, Star, X } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { supabase, Profile } from "@/lib/supabase";

const mockProfiles: Profile[] = [
  {
    id: "1",
    nickname: "小雨",
    grade: "大二",
    major: "计算机科学与技术",
    bio: "喜欢编程、摄影和旅行，想找志同道合的朋友",
    tags: ["编程", "摄影", "旅行"],
    location: "北京",
    avatar_url: null,
    email: "",
    is_verified: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    nickname: "阿明",
    grade: "大三",
    major: "经济学",
    bio: "热爱篮球和音乐，喜欢探索新事物",
    tags: ["篮球", "音乐", "阅读"],
    location: "上海",
    avatar_url: null,
    email: "",
    is_verified: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    nickname: "晓晓",
    grade: "大一",
    major: "新闻传播",
    bio: "喜欢写作和绘画，记录生活点滴",
    tags: ["写作", "绘画", "摄影"],
    location: "广州",
    avatar_url: null,
    email: "",
    is_verified: true,
    created_at: "",
    updated_at: "",
  },
];

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user?.id || null);

      const { data, error } = await supabase.from("profiles").select("*").limit(20);
      if (error || !data || data.length === 0) {
        setProfiles(mockProfiles);
      } else {
        setProfiles(data);
      }
      setLoading(false);
    };

    init();
  }, []);

  const currentProfile = profiles[currentIndex];

  const goNext = () => {
    setCurrentIndex((prev) => (profiles.length === 0 ? 0 : (prev + 1) % profiles.length));
  };

  const handleLike = async () => {
    if (currentProfile && currentUser) {
      await supabase.from("likes").insert({
        from_user: currentUser,
        to_user: currentProfile.id,
      });
    }
    goNext();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#fe3c72] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-x-hidden pb-36">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fe3c72] to-[#ff6b6b] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-[#fe3c72] to-[#ff6b6b] bg-clip-text text-transparent">
              校园匹配
            </span>
          </div>
        </div>
      </header>

      <section id="test" className="scroll-mt-20 pt-20 px-4 max-w-md mx-auto">
        {currentProfile ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="relative h-[340px] bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                  <span className="text-5xl font-bold text-white">{currentProfile.nickname.charAt(0)}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-end gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{currentProfile.nickname}</h2>
                  <span className="text-lg opacity-90">{currentProfile.grade}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                  {currentProfile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{currentProfile.location}</span>
                    </div>
                  )}
                  {currentProfile.major && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{currentProfile.major}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {currentProfile.bio || "这个同学还没有填写简介。"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(currentProfile.tags || []).slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#fe3c72]/10 to-[#ff6b6b]/10 text-[#fe3c72] text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center">
            <Heart className="w-12 h-12 text-[#fe3c72] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">没有更多推荐了</h2>
            <p className="text-gray-500 text-sm">稍后再来看看吧。</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 py-8">
          <button
            onClick={goNext}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 border border-gray-100"
          >
            <X className="w-7 h-7 text-[#fe3c72]" />
          </button>
          <button
            onClick={handleLike}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 border border-gray-100"
          >
            <Star className="w-6 h-6 text-[#2ab5ff] fill-[#2ab5ff]" />
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#11b683] to-[#0ea5e9] shadow-lg shadow-[#11b683]/30 flex items-center justify-center active:scale-95"
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </button>
        </div>
      </section>

      <section id="discover" className="scroll-mt-20 px-4 max-w-md mx-auto pb-24">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <p className="text-sm font-semibold text-[#fe3c72] mb-2">发现</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">继续下滑，发现更多校园连接</h2>
          <p className="text-gray-500 text-sm leading-6 mb-5">
            底部“测一测”会回到卡片区域，“发现”会跳到这里，“匹配”会进入匹配页面。
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-pink-50 p-3">
              <p className="text-lg font-bold text-[#fe3c72]">{profiles.length}</p>
              <p className="text-xs text-gray-500">推荐</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-lg font-bold text-[#2ab5ff]">滑动</p>
              <p className="text-xs text-gray-500">测一测</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-lg font-bold text-[#11b683]">匹配</p>
              <p className="text-xs text-gray-500">去聊天</p>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
