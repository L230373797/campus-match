"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signUp, signIn } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      if (isLogin) {
        // Login
        await signIn(formData.email, formData.password);
      } else {
        // Register
        await signUp(formData.email, formData.password, formData.nickname);
      }
      // Redirect to home after successful auth
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "操作失败，请重试");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="glass-strong px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-[#f5f5f7] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#1d1d1f]" />
          </Link>
          <h1 className="text-xl font-semibold text-[#1d1d1f] ml-2">
            {isLogin ? "登录" : "注册"}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center mb-8 shadow-lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-10 h-10 text-white"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2">
          {isLogin ? "欢迎回来" : "创建账号"}
        </h2>
        <p className="text-[#86868b] text-sm mb-8 text-center">
          {isLogin
            ? "登录你的账号，继续发现有趣的人"
            : "注册账号，开启你的校园匹配之旅"}
        </p>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-sm bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Nickname (only for register) */}
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input
                type="text"
                placeholder="昵称"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                className="input-glass w-full pl-12 pr-4"
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input
              type="email"
              placeholder="邮箱"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input-glass w-full pl-12 pr-4"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="密码"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input-glass w-full pl-12 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "btn-primary w-full py-3.5 text-base font-medium mt-6",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                处理中...
              </span>
            ) : isLogin ? (
              "登录"
            ) : (
              "注册"
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-8 text-center">
          <p className="text-[#86868b] text-sm">
            {isLogin ? "还没有账号？" : "已有账号？"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#0071e3] font-medium ml-1 hover:underline"
            >
              {isLogin ? "立即注册" : "立即登录"}
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#e8e8ed]"></div>
          <span className="text-[#86868b] text-sm">或</span>
          <div className="flex-1 h-px bg-[#e8e8ed]"></div>
        </div>

        {/* Social Login */}
        <button className="glass-button w-full max-w-sm py-3.5 flex items-center justify-center gap-3 font-medium">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#07C160">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
          </svg>
          微信登录
        </button>
      </div>
    </main>
  );
}
