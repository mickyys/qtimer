"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <p>You are not signed in.</p>
      <button onClick={() => signIn("google")}>Sign in with Google</button>
      {/* Add email sign in later */}
    </div>
  );
}
