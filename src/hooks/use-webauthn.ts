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

export function getSafeRpId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (!hostname || hostname === "localhost") return "localhost";
  
  // W3C WebAuthn spec disallows IP addresses in rp.id
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpv6 = hostname.includes(":");
  if (isIpv4 || isIpv6) {
    return undefined; // Omit so browser defaults to document origin
  }
  return hostname;
}

export interface BiometricDevice {
  type: "FACE_ID" | "TOUCH_ID" | "FINGERPRINT" | "WINDOWS_HELLO" | "BIOMETRIC";
  label: string;
  platform: "iOS" | "Android" | "macOS" | "Windows" | "Other";
  lockScreenName: string;
  permissionDescription: string;
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
      label: "Lock Screen Biometrics",
      platform: "Other",
      lockScreenName: "Device Lock Screen Biometrics / PIN",
      permissionDescription: "Attendex requests permission to authenticate using your device's lock screen security.",
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

  if (isAndroid) {
    return {
      type: "FINGERPRINT",
      label: "Android Lock Screen Biometrics",
      platform: "Android",
      lockScreenName: "Android Fingerprint, Face Unlock, or Lock Screen PIN/Pattern",
      permissionDescription: "Attendex requires permission to invoke Android's lock screen biometric prompt (Fingerprint, Face unlock, or Lock Screen PIN). Verification occurs entirely on your device.",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }

  if (isWindows) {
    return {
      type: "WINDOWS_HELLO",
      label: "Windows Hello Lock Screen",
      platform: "Windows",
      lockScreenName: "Windows Hello Fingerprint, Facial Recognition, or Windows PIN",
      permissionDescription: "Attendex requires permission to access Windows Hello lock screen authentication. You will be prompted with your Windows security fingerprint, face, or PIN.",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }

  if (isMac) {
    return {
      type: "TOUCH_ID",
      label: "macOS Touch ID & Password",
      platform: "macOS",
      lockScreenName: "Apple Touch ID or Mac Administrator Password",
      permissionDescription: "Attendex requires permission to invoke Apple Touch ID or your Mac login password to authenticate your workspace.",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }

  if (isIOS) {
    return {
      type: "FACE_ID",
      label: "Apple Face ID / Touch ID",
      platform: "iOS",
      lockScreenName: "Apple Face ID, Touch ID, or Device Passcode",
      permissionDescription: "Attendex requires permission to access Apple Face ID or Touch ID using your device's Secure Enclave.",
      isSupported,
      isPlatformAuthenticatorAvailable: isSupported
    };
  }

  return {
    type: "BIOMETRIC",
    label: "Lock Screen Biometrics",
    platform: "Other",
    lockScreenName: "Physical Device Lock Screen (Fingerprint / PIN)",
    permissionDescription: "Attendex requires permission to authenticate using your device's native lock screen credentials.",
    isSupported,
    isPlatformAuthenticatorAvailable: isSupported
  };
}

export function useWebAuthn() {
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<BiometricDevice>({
    type: "BIOMETRIC",
    label: "Lock Screen Biometrics",
    platform: "Other",
    lockScreenName: "Device Lock Screen Biometrics",
    permissionDescription: "Attendex requires permission to authenticate with device biometrics.",
    isSupported: false,
    isPlatformAuthenticatorAvailable: false,
  });
  const [enrolledPasskey, setEnrolledPasskey] = useState<StoredPasskey | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

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

    // Check local storage for enrollment & permission
    try {
      const stored = localStorage.getItem("attendex_biometric_passkey");
      if (stored) {
        setEnrolledPasskey(JSON.parse(stored));
      }
      const perm = localStorage.getItem("attendex_biometric_permission_granted");
      if (perm === "true") {
        setHasPermission(true);
      }
    } catch {}
  }, []);

  const grantPermission = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("attendex_biometric_permission_granted", "true");
        setHasPermission(true);
      } catch {}
    }
  };

  const registerPasskey = async (): Promise<boolean> => {
    setIsLoading(true);
    grantPermission();

    try {
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        throw new Error("Biometric authentication is not supported on this browser. Please use Chrome, Safari, or Edge with HTTPS or localhost.");
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

      const safeRpId = getSafeRpId();

      const options: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Attendex",
          ...(safeRpId ? { id: safeRpId } : {})
        },
        user: {
          id: userID,
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256 (P-256) - Android, iOS, macOS
          { alg: -257, type: "public-key" }, // RS256 - Windows Hello
          { alg: -8, type: "public-key" }    // Ed25519
        ],
        timeout: 60000,
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Directs device to native Face ID, Touch ID, Android Biometric or Windows Hello
          userVerification: "required",        // Strictly requires OS lock screen authentication (Fingerprint / Face / PIN)
          residentKey: "preferred",
          requireResidentKey: false
        }
      };

      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("Lock screen authentication cancelled or timed out.");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      let publicKeyBase64 = "";

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

      toast.success(`${device.label} Bound!`, {
        description: "Your device lock screen credentials are now authorized for single-touch access."
      });
      return true;
    } catch (err: any) {
      console.warn("Passkey Registration Exception:", err);
      let message = err.message || "Failed to register lock screen credentials.";
      if (err.name === "NotAllowedError" || err.message?.includes("cancelled")) {
        message = "Lock screen verification was cancelled or timed out.";
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
    grantPermission();

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

      // If device has not enrolled lock screen credentials yet, directly invoke native lock screen enrollment & authentication
      if (!stored) {
        const registered = await registerPasskey();
        if (!registered) {
          return { success: false };
        }
        const newlyStoredRaw = localStorage.getItem("attendex_biometric_passkey");
        if (newlyStoredRaw) {
          stored = JSON.parse(newlyStoredRaw);
        }
        if (!stored) {
          return { success: false };
        }
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const safeRpId = getSafeRpId();

      const requestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required", // Strictly prompts for OS lock screen biometric (Fingerprint, Face, or PIN)
        ...(safeRpId ? { rpId: safeRpId } : {})
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

      let assertion: PublicKeyCredential | null = null;
      try {
        assertion = await navigator.credentials.get({ publicKey: requestOptions }) as PublicKeyCredential | null;
      } catch (getErr: any) {
        // If assertion lookup failed on this device, seamlessly invoke lock screen registration
        console.info("[WebAuthn] Credential lookup failed, prompting direct lock screen setup:", getErr);
        const registered = await registerPasskey();
        if (registered) {
          const newlyStoredRaw = localStorage.getItem("attendex_biometric_passkey");
          if (newlyStoredRaw) stored = JSON.parse(newlyStoredRaw);
        } else {
          throw getErr;
        }
      }

      // Set user session cookies and local storage
      const activeUser = stored || {
        credentialId: assertion?.id || "bio-" + Math.random().toString(36).slice(2, 8),
        rawId: assertion?.rawId ? bufferToBase64(assertion.rawId) : "",
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

      toast.success("Lock Screen Identity Verified", {
        description: `Welcome back, ${activeUser.userName}!`
      });

      return { success: true, user: activeUser };
    } catch (err: any) {
      console.warn("Passkey Auth Exception:", err);
      let message = err.message || "Lock screen authentication failed.";
      if (err.name === "NotAllowedError" || err.message?.includes("cancelled")) {
        message = "Lock screen verification was cancelled.";
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
    localStorage.removeItem("attendex_biometric_permission_granted");
    setEnrolledPasskey(null);
    setHasPermission(false);
    toast.success("Lock Screen Biometric Binding Removed", {
      description: "You can re-enroll your lock screen credentials at any time."
    });
  };

  return {
    registerPasskey,
    authenticateWithPasskey,
    grantPermission,
    removePasskey,
    isLoading,
    device,
    isEnrolled: Boolean(enrolledPasskey),
    enrolledPasskey,
    hasPermission
  };
}
