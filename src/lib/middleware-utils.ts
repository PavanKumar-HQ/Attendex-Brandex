/**
 * Attendex — Middleware Utilities
 *
 * CSP headers live here (Edge-compatible, no Node APIs).
 * Auth is handled solely by middleware.ts — do NOT call protectRoute
 * from layouts, as it creates a double auth-check loop.
 */

export function getCSPHeader() {
  const csp: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src":  ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
    "style-src":   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src":     ["'self'", "data:", "https://*.supabase.co", "https://i.pravatar.cc", "https://api.dicebear.com", "https://images.unsplash.com"],
    "font-src":    ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://api.dicebear.com",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ],
    "frame-src":      ["'self'"],
    "object-src":     ["'none'"],
    "base-uri":       ["'self'"],
    "form-action":    ["'self'"],
    "frame-ancestors":["'none'"],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

