"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { isUserLoading } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No redirect here. The AuthGate will handle it.
      toast({
        variant: 'success',
        title: "Logged in successfully!",
      });
    } catch (error: any) {
      let title = "Login Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        title = "Invalid Credentials";
        description = "The email or password you entered is incorrect. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        title = "Too Many Attempts";
        description = "Access to this account has been temporarily disabled due to many failed login attempts. You can try again later.";
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // No redirect here. The AuthGate will handle it.
       toast({
        variant: 'success',
        title: "Logged in with Google!",
      });
    } catch (error: any) {
      let description = "Could not sign you in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
          description = "The login popup was closed before completing. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
      }
      toast({
        variant: "destructive",
        title: "Google login failed.",
        description: description,
      });
      setGoogleLoading(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="mx-auto max-w-sm w-full border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Enter your email to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading || googleLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
          <div className="my-4 flex items-center gap-2">
              <div className="flex-grow border-t border-muted"></div>
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-muted"></div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={googleLoading || loading}>
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" className="w-4 h-4 mr-2" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 56.6l-66.2 65.9c-21.6-20.5-52.2-32.9-88.3-32.9-68.9 0-125.3 56.3-125.3 125.8s56.3 125.8 125.3 125.8c76.3 0 110.7-53.1 114.3-81.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>}
            Login with Google
          </Button>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
