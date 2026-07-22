"use client";

import Image from "next/image";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[1.05fr_1fr]">
      <div className="relative overflow-hidden bg-brand text-white p-10 flex flex-col justify-between">
        <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/10" />
        <Image
          src="/rnp-logo.jpg"
          alt="RNP Express"
          width={130}
          height={130}
          unoptimized
          className="rounded-lg"
        />
        <div className="space-y-2">
          <p className="text-lg font-extrabold tracking-wide">AI Sales Intelligence Platform</p>
          <p className="text-base font-medium opacity-95">
            แพลตฟอร์มอัจฉริยะสำหรับค้นหา วิเคราะห์ และบริหารลูกค้า B2B ด้วย AI
          </p>
          <p className="text-sm font-semibold opacity-85">สำหรับ RNP Express</p>
        </div>
        <p className="text-xs opacity-75">Powered by Xtar Marketing</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-4 p-12">
        <h2 className="text-brand text-xl font-bold">ลืมรหัสผ่าน</h2>
        <p className="text-ink-soft text-sm -mt-2">
          กรอกอีเมลที่ใช้เข้าสู่ระบบ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้
        </p>

        {error && (
          <p className="text-sm text-brand bg-brand-tint border border-brand-tint2 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {sent ? (
          <p className="text-sm text-good bg-good-soft border border-good/30 rounded-lg px-3 py-2">
            ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงถังขยะ/สแปม)
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-soft">อีเมล</span>
              <input
                type="email"
                placeholder="name@rnp.co.th"
                className="border border-line rounded-lg px-3 py-2.5 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-lg py-3 text-sm transition-colors"
            >
              {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
            </button>
          </>
        )}

        <a href="/login" className="text-center text-sm font-semibold text-brand">
          ← กลับไปหน้าเข้าสู่ระบบ
        </a>
      </form>
    </div>
  );
}
