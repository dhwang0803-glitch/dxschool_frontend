"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchToken } from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function init() {
      const paramUserId = searchParams.get("user_id");
      if (paramUserId) {
        localStorage.setItem("user_id", paramUserId);
        try {
          const token = await fetchToken(paramUserId);
          localStorage.setItem("access_token", token);
        } catch (e) {
          console.error("토큰 발급 실패:", e);
        }
      }
      setReady(true);
    }
    init();
  }, [searchParams]);

  if (!ready) return null;

  return <>{children}</>;
}
