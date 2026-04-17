"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, MessageCircle, MapPin, Heart, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  nickname: string;
  grade: string;
  major: string;
  bio?: string;
  tags?: string[];
  location?: string;
  avatar: string | null;
  isMatch: boolean;
  lastActive: string;
}

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export function UserDetailModal({ user, isOpen, onClose, onStartChat }: UserDetailModalProps) {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-auto sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10"
        )}
      >
        <div
          className={cn(
            "bg-white sm:rounded-3xl rounded-t-3xl w-full sm:w-[420px] sm:max-h-[85vh] max-h-[90vh] overflow-hidden shadow-2xl",
            "flex flex-col"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-48 sm:h-56 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Avatar */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white text-4xl font-semibold shadow-xl border-4 border-white">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.nickname}
                      fill
                      className="object-cover rounded-full"
                    />
                  ) : (
                    user.nickname.charAt(0)
                  )}
                </div>
                {user.isMatch && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#ff2d55] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-20 px-6 pb-6 overflow-y-auto">
            {/* Basic Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                {user.nickname}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <GraduationCap className="w-4 h-4" />
                <span>{user.grade} · {user.major}</span>
              </div>
              {user.location && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mb-6">
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  "{user.bio}"
                </p>
              </div>
            )}

            {/* Tags */}
            {user.tags && user.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
                  兴趣标签
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {user.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>活跃于 {user.lastActive}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user.isMatch ? (
                <button
                  onClick={() => onStartChat?.(user.id)}
                  className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  开始聊天
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 font-medium py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  等待对方回应
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-4 rounded-xl transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
