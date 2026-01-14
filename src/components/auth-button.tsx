"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { LoadingSpinner } from "./loading-spinner";

export const AuthButton = () => {
  return (
    <>
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            className="border-blue-700 rounded-full px-4 py-2 text-blue-700 hover:bg-blue-500 hover:border-none hover:text-white"
          >
            Sign in
          </Button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
      <AuthLoading>
        <LoadingSpinner />
      </AuthLoading>
    </>
  );
};
