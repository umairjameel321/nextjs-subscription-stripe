import { stripe } from "@/lib/stripe";
import User from "@/modals/user.modal";
import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") as string;
  let event: Stripe.Event;
  let data: any;
  let eventType: any;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    console.error(error);
    return new Response("Error occured in webhook", { status: 400 });
  }

  data = event.data;
  eventType = event.type;

  if (eventType === "checkout.session.completed") {
    const session = await stripe.checkout.sessions.retrieve(data?.object?.id, {
      expand: ["line_items"],
    });

    const customerId = session?.customer;
    const customer = await stripe.customers.retrieve(customerId as string);
    const priceId = session?.line_items?.data[0]?.price?.id;
    const metadata = event?.data?.object?.metadata;

    if (priceId !== process.env.NEXT_PUBLIC_STRIPE_MOHTHLY_PRICE_ID) {
      return new NextResponse("Price ID does not match", {
        status: 400,
      });
    }

    console.log(metadata);

    if (metadata) {
      const userId = metadata.userId;
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          isSubscribed: true,
          customerId: customerId,
        },
        { new: true }
      );

      if (!updatedUser) {
        return new NextResponse("User not found", {
          status: 400,
        });
      } else {
        console.log("User updated successfully");
      }
    }
  } else if (eventType === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0].price.id;

    if (priceId !== process.env.NEXT_PUBLIC_STRIPE_MOHTHLY_PRICE_ID) {
      return new NextResponse("Price ID does not match", {
        status: 400,
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { customerId },
      {
        isSubscribed: false,
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error("No user found", customerId);
    } else {
      console.log("user updated successfully");
    }
  }

  revalidatePath("/", "layout");
  return new NextResponse("Webhook received", { status: 200 });
}
