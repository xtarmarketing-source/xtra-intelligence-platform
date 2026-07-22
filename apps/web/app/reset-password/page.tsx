"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("ตั้งรหัสผ่านใหม่ไม่สำเร็จ — ลิงก์อาจหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้งจากหน้าลืมรหัสผ่าน");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-line-soft/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 bg-white border border-line rounded-2xl p-8 shadow-sm"
      >
        <h2 className="text-brand text-xl font-bold">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-ink-soft text-sm -mt-2">กรอกรหัสผ่านใหม่ที่ต้องการใช้เข้าสู่ระบบ Xtar</p>

        {error && (
          <p className="text-sm text-brand bg-brand-tint border border-brand-tint2 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-soft">รหัสผ่านใหม่</span>
          <input
            type="password"
            required
            minLength={8}
            className="border border-line rounded-lg px-3 py-2.5 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-soft">ยืนยันรหัสผ่านใหม่</span>
          <input
            type="password"
            required
            minLength={8}
            className="border border-line rounded-lg px-3 py-2.5 text-sm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-lg py-3 text-sm transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </form>
    </div>
  );
}
