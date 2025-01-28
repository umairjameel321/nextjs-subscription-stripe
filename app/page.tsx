"use client";

import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-full">
      <div className="text-2xl">Home Page</div>
      {isSignedIn && <div>Signed in as {user?.firstName}</div>}
    </div>
  );
}
