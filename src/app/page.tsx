"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, X, Star, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/bottom-nav";
import { supabase, Profile } from "@/lib/supabase";

// Mock data for demo
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
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch profiles from Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);
      
      if (error) {
        console.error('Error fetching profiles:', error);
        setProfiles(mockProfiles);
      } else if (data && data.length > 0) {
        setProfiles(data);
      } else {
        setProfiles(mockProfiles);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const currentProfile = profiles[currentIndex];

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 100) {
      // Swiped right - Like
      await handleLike();
    } else if (info.offset.x < -100) {
      // Swiped left - Skip
      handleSkip();
    }
  };

  const handleLike = async () => {
    if (!currentProfile || !currentUser) return;

    setDirection("right");
    
    // Save like to database
    try {
      await supabase.from('likes').insert({
        from_user: currentUser,
        to_user: currentProfile.id,
      });

      // Check for mutual like
      const { data: mutual } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user', currentProfile.id)
        .eq('to_user', currentUser)
        .single();

      if (mutual) {
        // Create match
        const id1 = currentUser < currentProfile.id ? currentUser : currentProfile.id;
        const id2 = currentUser < currentProfile.id ? currentProfile.id : currentUser;
        await supabase.from('matches').insert({
          user_id_1: id1,
          user_id_2: id2,
        });
        alert("🎉 匹配成功！你们互相喜欢了！");
      }
    } catch (err) {
      console.error('Error saving like:', err);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      x.set(0);
    }, 200);
  };

  const handleSkip = () => {
    setDirection("left");
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      x.set(0);
    }, 200);
  };

  const handleSuperLike = () => {
    handleLike();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#fe3c72] border-t-transparent"></div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fe3c72] to-[#ff6b6b] flex items-center justify-center mb-6 shadow-lg">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">没有更多推荐了</h2>
          <p className="text-gray-500">稍后再来看看吧～</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
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

      {/* Card Stack */}
      <div className="pt-20 pb-32 px-4 max-w-md mx-auto">
        <div className="relative h-[520px]">
          <AnimatePresence mode="popLayout">
            {profiles.slice(currentIndex, currentIndex + 2).map((profile, index) => {
              const isTop = index === 0;
              
              return (
                <motion.div
                  key={profile.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: profiles.length - currentIndex - index,
                    x: isTop ? x : 0,
                    rotate: isTop ? rotate : 0,
                    opacity: isTop ? opacity : 1,
                  }}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{
                    scale: isTop ? 1 : 0.95,
                    opacity: 1,
                    x: direction === "left" && isTop ? -500 : direction === "right" && isTop ? 500 : 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    {/* Image Area */}
                    <div className="relative h-[65%] bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Avatar placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                          <span className="text-5xl font-bold text-white">
                            {profile.nickname.charAt(0)}
                          </span>
                        </div>
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="flex items-end gap-3 mb-2">
                          <h2 className="text-3xl font-bold">{profile.nickname}</h2>
                          <span className="text-lg opacity-90">{profile.grade}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm opacity-90">
                          {profile.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{profile.location}</span>
                            </div>
                          )}
                          {profile.major && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              <span>{profile.major}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Like/Skip indicators */}
                      <motion.div
                        className="absolute top-6 left-6 border-4 border-[#11b683] rounded-xl px-4 py-2 bg-white/10 backdrop-blur-sm"
                        style={{ opacity: likeOpacity }}
                      >
                        <span className="text-[#11b683] font-bold text-2xl uppercase tracking-wider">喜欢</span>
                      </motion.div>
                      <motion.div
                        className="absolute top-6 right-6 border-4 border-[#fe3c72] rounded-xl px-4 py-2 bg-white/10 backdrop-blur-sm"
                        style={{ opacity: skipOpacity }}
                      >
                        <span className="text-[#fe3c72] font-bold text-2xl uppercase tracking-wider">跳过</span>
                      </motion.div>
                    </div>

                    {/* Content Area */}
                    <div className="h-[35%] p-5 flex flex-col">
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {profile.bio || "这个人很懒，什么都没写～"}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {(profile.tags || []).slice(0, 4).map((tag) => (
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-0 right-0 z-40">
        <div className="max-w-md mx-auto px-8">
          <div className="flex items-center justify-center gap-6">
            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border border-gray-100"
            >
              <X className="w-7 h-7 text-[#fe3c72]" />
            </button>

            {/* Super Like Button */}
            <button
              onClick={handleSuperLike}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border border-gray-100"
            >
              <Star className="w-6 h-6 text-[#2ab5ff] fill-[#2ab5ff]" />
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-[#11b683] to-[#0ea5e9] shadow-lg shadow-[#11b683]/30 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <Heart className="w-7 h-7 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
