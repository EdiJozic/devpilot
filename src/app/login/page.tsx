"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code2, LoaderCircle, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "update">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const queryType = new URLSearchParams(window.location.search).get("type");
      const hashType = new URLSearchParams(window.location.hash.slice(1)).get("type");
      if (queryType === "recovery" || hashType === "recovery") setMode("update");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const enterDemo = () => {
    localStorage.setItem("devpilot-demo-session", "true");
    router.push("/");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      if (!isSupabaseConfigured()) {
        setMessage("Supabase isn’t configured. Use the demo workspace below, or add your Supabase URL and anon key to .env.local.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login?type=recovery` });
        if (error) throw error;
        setSuccess(true);
        setMessage("If an account exists for that email, a password reset link is on its way.");
      } else if (mode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess(true);
        setMessage("Your password has been updated.");
        router.push("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(true);
        setMessage("Account created. Check your email to confirm your address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="login-shell"><section className="login-aside"><Link href="/" className="login-brand"><span className="brand-mark"><Code2 size={17} strokeWidth={2.6} /></span>devpilot</Link><div className="login-pitch"><span>THE DEVELOPER WORKSPACE</span><h1>Less juggling.<br /><i>More building.</i></h1><p>Your projects, tasks, and ideas — all in one calm, focused place.</p><div className="login-quote">“Finally, a workspace that thinks like a developer.”<strong>Alex Rivera · Indie founder</strong></div></div><div className="login-footer">© 2026 DevPilot. Built for the curious.</div></section><section className="login-main"><div className="login-form-wrap"><h2>{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : mode === "update" ? "Set a new password" : "Reset your password"}</h2><p>{mode === "login" ? "Pick up right where you left off." : mode === "signup" ? "Start building with your team for free." : mode === "update" ? "Choose a new password for your account." : "We’ll send you a link to reset your password."}</p>{mode !== "reset" && mode !== "update" && <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button></div>}<form onSubmit={submit}>{mode !== "update" && <label className="form-field"><span>Email address</span><input type="email" name="email" autoComplete="email" placeholder="you@company.com" required /></label>}{mode !== "reset" && <label className="form-field"><span>{mode === "update" ? "New password" : "Password"}</span><input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" minLength={8} required /></label>}{mode === "login" && <button type="button" className="forgot-link" onClick={() => { setMode("reset"); setMessage(""); }}>Forgot password?</button>}{message && <div className={`auth-message ${success ? "success" : ""}`}>{message}</div>}<Button type="submit" disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <>{mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "update" ? "Update password" : "Send reset link"}<ArrowRight size={14} /></>}</Button></form>{(mode === "reset" || mode === "update") && <button className="demo-enter-button" onClick={() => { setMode("login"); setMessage(""); }}>Back to sign in</button>}<div className="auth-demo-note"><Sparkles size={13} /> The Supabase authentication flow activates when credentials are configured. Demo workspace data stays in this browser.</div><button className="demo-enter-button" onClick={enterDemo}>Continue in demo mode <ArrowRight size={13} /></button></div></section></main>;
}
