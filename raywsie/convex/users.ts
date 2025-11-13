// convex/users.ts
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Get current user (called from frontend)
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
  
      const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      return user;
    },
  });

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Create or update user (called when user signs in)
/*export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called store without authentication present");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // User exists, update their info
      await ctx.db.patch(user._id, {
        name: identity.name ?? user.name,
        email: identity.email ?? user.email,
      });
      return user._id;
    }

    // User doesn't exist, create new user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "User",
      email: identity.email ?? "",
      createdAt: Date.now(),
      preferences: {
        theme: "dark",
        notifications: true,
      },
    });

    return userId;
  },
});*/

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    location: v.optional(
      v.object({
        city: v.string(),
        state: v.string(),
        country: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: {
      name?: string;
      location?: {
        city: string;
        state: string;
        country: string;
      };
    } = {};
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.location !== undefined) updates.location = args.location;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    notifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const currentPrefs = user.preferences || { theme: "dark", notifications: true };
    const newPrefs = {
      theme: args.theme ?? currentPrefs.theme,
      notifications: args.notifications ?? currentPrefs.notifications,
    };

    await ctx.db.patch(user._id, {
      preferences: newPrefs,
    });

    return user._id;
  },
});

// ============================================
// Internal mutations (for webhooks only)
// ============================================

// Sync user from Clerk webhook
export const syncUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
      });
      return existing._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: args.tokenIdentifier,
        email: args.email,
        name: args.name,
        createdAt: Date.now(),
        preferences: {
          theme: "dark",
          notifications: true,
        },
      });
      return userId;
    }
  },
});

// Delete user from Clerk webhook
export const deleteUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (user) {
      // Delete user's projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const project of projects) {
        await ctx.db.delete(project._id);
      }

      // Delete user's notifications
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const notification of notifications) {
        await ctx.db.delete(notification._id);
      }

      // Finally delete the user
      await ctx.db.delete(user._id);
    }
  },
});