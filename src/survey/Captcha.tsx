import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

export function captchaRequired() {
  return SITE_KEY.length > 0;
}

export function Captcha({ onToken }: { onToken: (token: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let gone = false;
    let widgetId = "";

    const mount = () => {
      if (gone || widgetId || !host.current || !window.turnstile) return;
      widgetId = window.turnstile.render(host.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    };

    if (!document.querySelector("script[data-turnstile]")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "1";
      script.onload = mount;
      document.head.appendChild(script);
    }
    const timer = window.setInterval(() => {
      if (!window.turnstile) return;
      mount();
      window.clearInterval(timer);
    }, 200);

    return () => {
      gone = true;
      window.clearInterval(timer);
      onTokenRef.current("");
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div className="captcha" ref={host} />;
}
