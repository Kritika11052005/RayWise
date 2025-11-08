import { httpRouter } from "convex/server";
import { httpAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx: ActionCtx, request: Request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Webhook configuration error", {
        status: 500,
      });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers");
      return new Response("Missing svix headers", {
        status: 400,
      });
    }

    // Get the body
    const body = await request.text();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    // Verify the webhook
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", {
        status: 400,
      });
    }

    // Handle the webhook event
    const eventType = evt.type;
    console.log(`Received webhook event: ${eventType}`);

    try {
      switch (eventType) {
        case "user.created":
        case "user.updated": {
          const { id, email_addresses, first_name, last_name } = evt.data;
          
          if (!id) {
            console.error("Missing user ID in webhook data");
            return new Response("Missing user ID", { status: 400 });
          }

          const email = email_addresses?.[0]?.email_address || "";
          const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";

          await ctx.runMutation(internal.users.syncUser, {
            tokenIdentifier: id,
            email,
            name,
          });

          console.log(`User ${eventType}: ${email} (${id})`);
          break;
        }

        case "user.deleted": {
          const { id } = evt.data;
          
          if (!id) {
            console.error("Missing user ID in delete webhook");
            return new Response("Missing user ID", { status: 400 });
          }

          await ctx.runMutation(internal.users.deleteUser, {
            tokenIdentifier: id,
          });
          console.log(`User deleted: ${id}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      return new Response("Webhook processed successfully", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ error: "Error processing webhook" }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;