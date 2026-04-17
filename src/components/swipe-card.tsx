"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  nickname: string;
  grade: string;
  major: string;
  bio?: string;
  tags: string[];
  avatarUrl?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onLike: () => void;
  onSkip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function SwipeCard({
  profile,
  onLike,
  onSkip,
  onSwipeLeft,
  onSwipeRight,
}: SwipeCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  // Reset card when profile changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsVisible(true);
    currentPos.current = { x: 0, y: 0 };
  }, [profile.id]);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    // Limit vertical movement
    const limitedY = Math.max(-50, Math.min(50, deltaY));
    
    currentPos.current = { x: deltaX, y: limitedY };
    setPosition({ x: deltaX, y: limitedY });
    setRotation(deltaX * 0.03);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 80;
    const velocity = Math.abs(currentPos.current.x);
    
    if (velocity > threshold) {
      // Swipe confirmed
      const direction = currentPos.current.x > 0 ? 1 : -1;
      const targetX = direction * window.innerWidth;
      
      setPosition({ x: targetX, y: currentPos.current.y });
      setRotation(direction * 20);
      setIsVisible(false);
      
      if (direction > 0) {
        onLike();
        onSwipeRight?.();
      } else {
        onSkip();
        onSwipeLeft?.();
      }
    } else {
      // Reset position with animation
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      currentPos.current = { x: 0, y: 0 };
    }
  }, [isDragging, onLike, onSkip, onSwipeLeft, onSwipeRight]);

  const handleButtonLike = () => {
    setPosition({ x: window.innerWidth, y: 0 });
    setRotation(20);
    setIsVisible(false);
    setTimeout(() => {
      onLike();
      onSwipeRight?.();
    }, 200);
  };

  const handleButtonSkip = () => {
    setPosition({ x: -window.innerWidth, y: 0 });
    setRotation(-20);
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
      onSwipeLeft?.();
    }, 200);
  };

  // Calculate opacity for like/skip indicators
  const likeOpacity = Math.max(0, Math.min(1, position.x / 80));
  const skipOpacity = Math.max(0, Math.min(1, -position.x / 80));

  if (!isVisible) {
    return (
      <div className="relative w-full max-w-sm mx-auto h-[520px] flex items-center justify-center">
        <div className="animate-pulse text-[#86868b]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-white rounded-[20px] overflow-hidden shadow-lg select-none touch-none",
          !isDragging && "transition-all duration-300 ease-out"
        )}
        style={{
          transform: `translateX(${position.x}px) translateY(${position.y}px) rotate(${rotation}deg)`,
          touchAction: "none",
        }}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Like Indicator */}
        <div
          className="absolute top-4 left-4 z-10 border-3 border-[#ff2d55] rounded-xl px-3 py-1.5 transform -rotate-12 pointer-events-none bg-white/80 backdrop-blur-sm"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-[#ff2d55] text-xl font-bold">喜欢</span>
        </div>

        {/* Skip Indicator */}
        <div
          className="absolute top-4 right-4 z-10 border-3 border-[#86868b] rounded-xl px-3 py-1.5 transform rotate-12 pointer-events-none bg-white/80 backdrop-blur-sm"
          style={{ opacity: skipOpacity }}
        >
          <span className="text-[#86868b] text-xl font-bold">跳过</span>
        </div>

        {/* Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] max-h-[380px]">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.nickname}
              fill
              className="object-cover pointer-events-none"
              priority
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                {profile.nickname.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f]">{profile.nickname}</h2>
            <span className="text-[#86868b] text-sm">{profile.grade}</span>
          </div>
          <p className="text-[#0071e3] font-medium mb-2 text-sm sm:text-base">{profile.major}</p>
          {profile.bio && (
            <p className="text-[#86868b] text-sm line-clamp-2 mb-3">{profile.bio}</p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6">
        <button
          onClick={handleButtonSkip}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:bg-[#e8e8ed] active:scale-95 transition-all duration-200 shadow-md"
          aria-label="跳过"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
        </button>
        
        <button
          onClick={handleButtonLike}
          className="btn-like w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center active:scale-95 transition-transform duration-200"
          aria-label="喜欢"
        >
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Swipe Hint */}
      <p className="text-center text-xs text-[#86868b] mt-3 sm:mt-4">
        左右滑动或点击按钮
      </p>
    </div>
  );
}
