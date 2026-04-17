"use client";

import Image from "next/image";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  nickname: string;
  grade: string;
  major: string;
  bio?: string;
  tags: string[];
  avatarUrl?: string;
  onLike: () => void;
  onSkip: () => void;
}

export function ProfileCard({
  nickname,
  grade,
  major,
  bio,
  tags,
  avatarUrl,
  onLike,
  onSkip,
}: ProfileCardProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Card */}
      <div className="card bg-white rounded-[20px] overflow-hidden shadow-lg">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={nickname}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center text-white text-4xl font-semibold">
                {nickname.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold text-[#1d1d1f]">{nickname}</h2>
            <span className="text-[#86868b] text-sm">{grade}</span>
          </div>
          <p className="text-[#0071e3] font-medium mb-2">{major}</p>
          {bio && (
            <p className="text-[#86868b] text-sm line-clamp-2 mb-3">{bio}</p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={onSkip}
          className="w-14 h-14 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:bg-[#e8e8ed] hover:scale-105 transition-all duration-200 shadow-md"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>
        
        <button
          onClick={onLike}
          className="btn-like w-16 h-16 flex items-center justify-center hover:scale-105 transition-transform duration-200"
        >
          <Heart className="w-8 h-8 fill-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
