"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { User, Settings, ChevronRight, Heart, MessageCircle, Edit3, Sparkles } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    nickname: "",
    grade: "",
    major: "",
    bio: "",
    avatar: null,
    likesSent: 0,
    likesReceived: 0,
    matches: 0,
    mbtiType: "",
    mbtiPlanet: "",
    mbtiTag: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch stats
      const { count: likesSent } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('from_user', user.id);

      const { count: likesReceived } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('to_user', user.id);

      const { count: matches } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (profile) {
        const localResult = typeof window !== "undefined" ? localStorage.getItem("campus_mbti_result") : null;
        const parsedResult = localResult ? JSON.parse(localResult) : null;
        setUserData({
          nickname: profile.nickname,
          grade: profile.grade || '未知年级',
          major: profile.major || '未知专业',
          bio: profile.bio || '暂无简介',
          avatar: profile.avatar_url,
          likesSent: likesSent || 0,
          likesReceived: likesReceived || 0,
          matches: matches || 0,
          mbtiType: profile.mbti_type || parsedResult?.mbti_type || "",
          mbtiPlanet: profile.mbti_planet || parsedResult?.mbti_planet || "",
          mbtiTag: profile.mbti_tag || parsedResult?.mbti_tag || "",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);
  return (
    <main className="flex-1 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-gray-900">我的</h1>
            <Link
              href="/profile/edit"
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white text-2xl font-semibold">
                {userData.nickname.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{userData.nickname}</h2>
              <p className="text-sm text-gray-500">{userData.grade} · {userData.major}</p>
              <p className="text-sm text-gray-400 mt-1 line-clamp-1">{userData.bio}</p>
            </div>
          </div>
          
          <Link
            href="/profile/edit"
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            编辑资料
          </Link>
        </div>

        {userData.mbtiType && (
          <Link href="/planet-test" className="block bg-white rounded-2xl p-4 mb-4 border border-[#e9edff]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4c7dff] to-[#ff5fcf] flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">校园人格星球</p>
                  <p className="font-semibold text-gray-900">{userData.mbtiType} · {userData.mbtiPlanet || "未命名星球"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{userData.mbtiTag || "点击查看完整结果"}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          </Link>
        )}

        <Link href="/planet-test" className="block bg-white rounded-2xl p-4 mb-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4c7dff] to-[#ff5fcf] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">校园人格星球测试</p>
                <p className="text-xs text-gray-500">16 道题，生成你的 MBTI 星球画像</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="w-4 h-4 text-[#0071e3]" />
              <span className="text-2xl font-semibold text-gray-900">
                {userData.likesSent}
              </span>
            </div>
            <div className="text-xs text-gray-500">喜欢</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="w-4 h-4 text-[#ff2d55] fill-[#ff2d55]" />
              <span className="text-2xl font-semibold text-gray-900">
                {userData.likesReceived}
              </span>
            </div>
            <div className="text-xs text-gray-500">被喜欢</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="w-4 h-4 text-gray-700" />
              <span className="text-2xl font-semibold text-gray-900">
                {userData.matches}
              </span>
            </div>
            <div className="text-xs text-gray-500">匹配</div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <Link
            href="/profile/edit"
            className="flex items-center justify-between bg-white rounded-2xl p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-[#0071e3]" />
              </div>
              <span className="font-medium text-gray-900">编辑资料</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>

          <button className="w-full flex items-center justify-between bg-white rounded-2xl p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">设置</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* About */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">校园匹配 v1.0</p>
          <p className="text-xs text-gray-400 mt-1">专为大学生打造的恋爱匹配平台</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
