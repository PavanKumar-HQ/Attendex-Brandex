"use client";

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 or Base64URL to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  // Convert URL-safe base64 to standard base64 if needed
  let normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }
  const binary = atob(normalized);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

export interface BiometricDevice {
  type: "FACE_ID" | "TOUCH_ID" | "FINGERPRINT" | "WINDOWS_HELLO" | "BIOMETRIC";
  label: string;
  platform: "iOS" | "Android" | "macOS" | "Windows" | "Other";
  isSupported: boolean;
  isPlatformAuthenticatorAvailable: boolean;
}

export interface StoredPasskey {
  credentialId: string;
  rawId: string;
  publicKey: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  platform: string;
  registeredAt: string;
}

export function detectDeviceBiometrics(): BiometricDevice {
  if (typeof window === "undefined") {
    return {
      type: "BIOMETRIC",
      label: "Biometric Sensor",
      platform: "Other",
      isSupported: false,
      isPlatformAuthenticatorAvailable: false,
    };
  }

  const ua = navigator.userAgent || "";
  const nav = navigator as any;
  const platformStr = nav.userAgentData?.platform || navigator.platform || "";

  const isIOS = /iPhone|iPad|iPod/.test(ua) || (platformStr === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(platformStr) && !isIOS;
  const isWindows = /Win32|Win64|Windows/.test(platformStr);

  const isSupported = Boolean(
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined"
  );

  if (isIOS) {
    return {
      type: "FACE_ID",
      label: "Apple Face ID / Touch ID",
      platform: "iOS",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }
  if (isAndroid) {
    return {
      type: "FINGERPRINT",
      label: "Android Fingerprint / Biometric",
      platform: "Android",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }
  if (isMac) {
    return {
      type: "TOUCH_ID",
      label: "Apple Touch ID",
      platform: "macOS",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }
  if (isWindows) {
    return {
      type: "WINDOWS_HELLO",
      label: "Windows Hello",
      platform: "Windows",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }

  return {
    type: "BIOMETRIC",
    label: "Hardware Biometric Authenticator",
    platform: "Other",
    isSupported,
    isPlatformAuthenticatorAvailable: isSupported
  };
}

export function useWebAuthn() {
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<BiometricDevice>({
    type: "BIOMETRIC",
    label: "Biometric Sensor",
    platform: "Other",
    isSupported: false,
    isPlatformAuthenticatorAvailable: false,
  });
  const [enrolledPasskey, setEnrolledPasskey] = useState<StoredPasskey | null>(null);

  useEffect(() => {
    const dev = detectDeviceBiometrics();
    setDevice(dev);

    // Check if platform authenticator is available asynchronously
    if (typeof window !== "undefined" && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setDevice(prev => ({ ...prev, isPlatformAuthenticatorAvailable: available }));
        })
        .catch(() => {});
    }

    // Check local storage for enrollment
    try {
      const stored = localStorage.getItem("attendex_biometric_passkey");
      if (stored) {
        setEnrolledPasskey(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const registerPasskey = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        throw new Error("Biometric authentication is not supported by this browser. Please use a modern browser (Safari, Chrome, Edge) with HTTPS or localhost.");
      }

      // 1. Resolve active user
      let userId = "user-" + Math.random().toString(36).slice(2, 10);
      let userEmail = "user@attendex.edu";
      let userName = "Institutional Member";
      let userRole = "STUDENT";

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email || userEmail;
          userName = user.user_metadata?.full_name || userName;
          userRole = user.user_metadata?.role || userRole;
        }
      } catch {}

      if (typeof window !== "undefined") {
        const localName = localStorage.getItem("attendex_user_name");
        const localEmail = localStorage.getItem("attendex_user_email");
        const localRoll = localStorage.getItem("attendex_student_roll");
        const cookieSession = document.cookie.match(/attendex_demo_session=([^;]+)/)?.[1];
        if (localName) userName = localName;
        if (localEmail) userEmail = localEmail;
        if (cookieSession) userRole = cookieSession.toUpperCase();
        else if (localRoll) userRole = "STUDENT";
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userID = new TextEncoder().encode(userId);

      const hostname = window.location.hostname === "localhost" ? "localhost" : window.location.hostname;

      const options: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Attendex",
          id: hostname,
        },
        user: {
          id: userID,
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256 (P-256) - iOS / Android / Mac
          { alg: -257, type: "public-key" } // RS256 - Windows Hello
        ],
        timeout: 60000,
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Directs device to native Face ID, Touch ID, or Android Biometric
          userVerification: "preferred",
          residentKey: "preferred",
          requireResidentKey: false
        }
      };

      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("Biometric enrollment cancelled or timed out.");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      let publicKeyBase64 = "";

      // Cross-platform key extraction:
      // Chrome 119+ supports getPublicKey(); iOS Safari & Firefox use attestationObject
      if (typeof (response as any).getPublicKey === "function") {
        try {
          const pk = (response as any).getPublicKey();
          if (pk) publicKeyBase64 = bufferToBase64(pk);
        } catch {}
      }
      if (!publicKeyBase64 && response.attestationObject) {
        publicKeyBase64 = bufferToBase64(response.attestationObject);
      }

      const rawIdBase64 = bufferToBase64(credential.rawId);

      const passkeyRecord: StoredPasskey = {
        credentialId: credential.id,
        rawId: rawIdBase64,
        publicKey: publicKeyBase64,
        userId,
        userName,
        userEmail,
        userRole,
        platform: device.label,
        registeredAt: new Date().toISOString()
      };

      // Persist in local storage
      localStorage.setItem("attendex_biometric_passkey", JSON.stringify(passkeyRecord));
      localStorage.setItem("attendex_passkey_enabled", "true");
      setEnrolledPasskey(passkeyRecord);

      // Attempt Supabase database persistence if configured
      if (isSupabaseConfigured) {
        try {
          await supabase.from("passkeys").upsert({
            user_id: userId,
            credential_id: credential.id,
            public_key: publicKeyBase64 || "verified",
            counter: 0
          });
          await supabase.from("user_profiles").update({ passkey_bound: true }).eq("id", userId);
        } catch {}
      }

      toast.success(`${device.label} Enrolled!`, {
        description: "Your device biometrics are bound. You can now log in securely without entering a password."
      });
      return true;
    } catch (err: any) {
      console.warn("Passkey Registration Exception:", err);
      // Clean, human-friendly error messages without technical jargon
      let message = err.message || "Failed to register biometrics.";
      if (err.name === "NotAllowedError" || err.message?.includes("cancelled")) {
        message = "Biometric setup was cancelled or timed out.";
      } else if (err.name === "SecurityError") {
        message = "Biometrics require a secure HTTPS connection or localhost.";
      }
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithPasskey = async (): Promise<{ success: boolean; user?: StoredPasskey }> => {
    setIsLoading(true);
    try {
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        throw new Error("Biometric authentication is not supported by this browser.");
      }

      // Check for enrolled passkey
      let stored: StoredPasskey | null = enrolledPasskey;
      if (!stored) {
        const raw = localStorage.getItem("attendex_biometric_passkey");
        if (raw) stored = JSON.parse(raw);
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const hostname = window.location.hostname === "localhost" ? "localhost" : window.location.hostname;

      const requestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: hostname,
        userVerification: "preferred"
      };

      if (stored?.rawId) {
        try {
          requestOptions.allowCredentials = [{
            id: base64ToBuffer(stored.rawId),
            type: "public-key",
            transports: ["internal"]
          }];
        } catch {}
      }

      const assertion = await navigator.credentials.get({ publicKey: requestOptions }) as PublicKeyCredential | null;
      if (!assertion) {
        throw new Error("Biometric verification did not return credentials.");
      }

      // Set user session cookies and local storage
      const activeUser = stored || {
        credentialId: assertion.id,
        rawId: bufferToBase64(assertion.rawId),
        publicKey: "",
        userId: "bio-user",
        userName: localStorage.getItem("attendex_user_name") || "Student",
        userEmail: localStorage.getItem("attendex_user_email") || "student@attendex.edu",
        userRole: "STUDENT",
        platform: device.label,
        registeredAt: new Date().toISOString()
      };

      const targetRole = (activeUser.userRole || "STUDENT").toUpperCase();
      document.cookie = `attendex_demo_session=${targetRole}; path=/; max-age=86400`;
      
      const roll = localStorage.getItem("attendex_student_roll") || "CS-11";
      document.cookie = `attendex_student_roll=${encodeURIComponent(roll)}; path=/; max-age=86400`;

      toast.success("Biometric Scan Verified", {
        description: `Welcome back, ${activeUser.userName}!`
      });

      return { success: true, user: activeUser };
    } catch (err: any) {
      console.warn("Passkey Auth Exception:", err);
      let message = err.message || "Biometric authentication failed.";
      if (err.name === "NotAllowedError" || err.message?.includes("cancelled")) {
        message = "Biometric scan was cancelled.";
      }
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const removePasskey = () => {
    localStorage.removeItem("attendex_biometric_passkey");
    localStorage.removeItem("attendex_passkey_enabled");
    setEnrolledPasskey(null);
    toast.success("Biometric Binding Removed", {
      description: "You can re-enroll your fingerprint or Face ID at any time."
    });
  };

  return {
    registerPasskey,
    authenticateWithPasskey,
    removePasskey,
    isLoading,
    device,
    isEnrolled: Boolean(enrolledPasskey),
    enrolledPasskey
  };
}
