"use client";

import { useState } from "react";
import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Available tags
const availableTags = [
  "编程", "摄影", "旅行", "咖啡", "音乐", "电影", "阅读",
  "健身", "游戏", "美食", "绘画", "写作", "篮球", "足球",
  "瑜伽", "舞蹈", "唱歌", "吉他", "猫奴", "狗奴", "科技",
];

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    nickname: "访客",
    grade: "大二",
    major: "计算机科学与技术",
    bio: "喜欢编程、摄影和旅行，想找志同道合的朋友",
    tags: ["编程", "摄影", "旅行"],
    wechat: "",
  });

  const [selectedTags, setSelectedTags] = useState(formData.tags);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 8) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    console.log("保存资料:", { ...formData, tags: selectedTags });
    // TODO: Save to database
  };

  return (
    <main className="flex-1 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">编辑资料</h1>
            <button
              onClick={handleSave}
              className="text-[#0071e3] font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">头像</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white text-3xl font-semibold">
                {formData.nickname.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#0071e3] rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              点击更换头像<br />
              支持 JPG、PNG 格式
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">基本信息</h2>
          
          <div className="space-y-4">
            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                昵称
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                placeholder="输入昵称"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                年级
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 appearance-none"
              >
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研一">研一</option>
                <option value="研二">研二</option>
                <option value="研三">研三</option>
              </select>
            </div>

            {/* Major */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                专业
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                placeholder="输入专业"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                个人简介
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 resize-none"
                placeholder="介绍一下自己..."
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.bio.length}/100
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">兴趣标签</h2>
            <span className="text-xs text-gray-500">{selectedTags.length}/8</span>
          </div>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0071e3] text-white text-sm font-medium rounded-full"
                >
                  {tag}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* Available Tags */}
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter(tag => !selectedTags.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  {tag}
                </button>
              ))}
          </div>
        </div>

        {/* WeChat */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">联系方式</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              微信号（匹配后可见）
            </label>
            <input
              type="text"
              value={formData.wechat}
              onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              placeholder="输入微信号"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/25"
        >
          保存资料
        </button>
      </div>
    </main>
  );
}
