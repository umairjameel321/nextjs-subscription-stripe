"use client";
import { subscribe } from "@/actions/stripe.action";
import { getUser } from "@/actions/user.action";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ClientPage = () => {
  const { isSignedIn, user } = useUser();

  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      const userData = await getUser(user?.id || "");
      setUserData(userData);
    };

    if (isSignedIn) {
      getUserData();
    }
  }, [isSignedIn, user]);

  const handleClickSubscribeButton = async () => {
    if (!isSignedIn) {
      throw new Error("User is not signed In");
    }

    const url = await subscribe({
      userId: user?.id || "",
      email: user?.emailAddresses[0]?.emailAddress || "",
      priceId: process.env.NEXT_PUBLIC_STRIPE_MOHTHLY_PRICE_ID!,
    });

    if (url) {
      router.push(url);
    } else {
      throw new Error("Failed to subscribe");
    }
  };

  const editPaymentDetails = async () => {
    const url = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL!;
    if (url) {
      router.push(
        url + "?prefilled_email=" + user?.emailAddresses[0]?.emailAddress
      );
    } else {
      throw new Error("Failed to edit payment details");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-2xl">
      Hello, {user?.firstName} welcome to Clerk
      {userData?.isSubscribed || userData?.customerId ? (
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="text-green-500 text-lg">
            {userData?.isSubscribed &&
              userData?.customerId &&
              `You are subscribed to the plan`}
            {!userData?.isSubscribed &&
              userData?.customerId &&
              `You have to update your subscription details`}
          </div>
          <button
            onClick={editPaymentDetails}
            className="inline-block w-72 rounded-lg bg-blue-600 p-2 mt-4 text-center text-white"
          >
            Edit Payment Details
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="text-red-500 text-lg">
            You are not subscribed to the plan
          </div>
          <button
            onClick={handleClickSubscribeButton}
            className="inline-block w-36 rounded-lg bg-blue-600 p-2 mt-4 text-center text-white"
          >
            Subscribe
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientPage;
