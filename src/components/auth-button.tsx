"use client";

import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export const AuthButton = () => {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            className="border-blue-700 rounded-full px-4 py-2 text-blue-700 hover:bg-blue-500 hover:border-none hover:text-white"
          >
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
};
