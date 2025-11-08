// convex/savedRecommendations.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// Helper function to get or create user
async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  let user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  const email = identity.email;

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  }

  if (!user) {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email || "",
      name: identity.name || "User",
      createdAt: Date.now(),
    });
    user = await ctx.db.get(userId);
  }

  if (!user) {
    throw new Error("Failed to get or create user");
  }

  return user;
}

// Helper function to get user for queries (without creating)
async function getUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  return user;
}

// Save a panel recommendation
export const savePanelRecommendation = mutation({
  args: {
    finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
    savedProjectId: v.optional(v.id("savedProjects")),
    panelData: v.object({
      name: v.string(),
      type: v.union(
        v.literal("monocrystalline"),
        v.literal("polycrystalline"),
        v.literal("thin-film")
      ),
      manufacturer: v.string(),
      efficiency: v.number(),
      powerRating: v.number(),
      warranty: v.number(),
      pricePerPanel: v.object({
        min: v.number(),
        max: v.number(),
        currency: v.string(),
      }),
      totalCost: v.number(),
      description: v.string(),
      pros: v.array(v.string()),
      cons: v.array(v.string()),
      bestFor: v.array(v.string()),
      reasoning: v.string(),
    }),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    // Check if already saved (prevent duplicates)
    const existing = await ctx.db
      .query("savedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("recommendationType"), "panel"),
          q.eq(q.field("panelData.name"), args.panelData.name),
          q.eq(q.field("panelData.manufacturer"), args.panelData.manufacturer)
        )
      )
      .first();

    if (existing) {
      throw new Error("This panel is already saved");
    }

    const recommendationId = await ctx.db.insert("savedRecommendations", {
      userId: user._id,
      finalizedLayoutId: args.finalizedLayoutId,
      savedProjectId: args.savedProjectId,
      recommendationType: "panel",
      panelData: args.panelData,
      userNotes: args.userNotes,
      createdAt: Date.now(),
    });

    return recommendationId;
  },
});

// Save an installer recommendation
export const saveInstallerRecommendation = mutation({
  args: {
    finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
    savedProjectId: v.optional(v.id("savedProjects")),
    installerData: v.object({
      name: v.string(),
      company: v.string(),
      email: v.string(),
      phone: v.string(),
      website: v.optional(v.string()),
      isLocal: v.boolean(),
      serviceArea: v.string(),
      rating: v.number(),
      yearsInBusiness: v.number(),
      projectsCompleted: v.number(),
      certifications: v.array(v.string()),
      services: v.array(v.string()),
      budgetRange: v.object({
        min: v.number(),
        max: v.number(),
        currency: v.string(),
      }),
      description: v.string(),
      specializations: v.array(v.string()),
      estimatedCost: v.number(),
      reasoning: v.string(),
    }),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    // Check if already saved (prevent duplicates)
    const existing = await ctx.db
      .query("savedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("recommendationType"), "installer"),
          q.eq(q.field("installerData.company"), args.installerData.company),
          q.eq(q.field("installerData.email"), args.installerData.email)
        )
      )
      .first();

    if (existing) {
      throw new Error("This installer is already saved");
    }

    const recommendationId = await ctx.db.insert("savedRecommendations", {
      userId: user._id,
      finalizedLayoutId: args.finalizedLayoutId,
      savedProjectId: args.savedProjectId,
      recommendationType: "installer",
      installerData: args.installerData,
      userNotes: args.userNotes,
      createdAt: Date.now(),
    });

    return recommendationId;
  },
});

// Get all saved recommendations for a user
/*export const getSavedRecommendation = query({
    args: {
      type: v.union(v.literal("panel"), v.literal("installer")),
      panelName: v.optional(v.string()),
      panelManufacturer: v.optional(v.string()),
      installerCompany: v.optional(v.string()),
      installerEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
  
      const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
  
      if (!user) return null;
  
      const saved = await ctx.db
        .query("savedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => {
          if (args.type === "panel") {
            return q.and(
              q.eq(q.field("recommendationType"), "panel"),
              q.eq(q.field("panelData.name"), args.panelName ?? ""),
              q.eq(q.field("panelData.manufacturer"), args.panelManufacturer ?? "")
            );
          } else {
            return q.and(
              q.eq(q.field("recommendationType"), "installer"),
              q.eq(q.field("installerData.company"), args.installerCompany ?? ""),
              q.eq(q.field("installerData.email"), args.installerEmail ?? "")
            );
          }
        })
        .first();
  
      return saved;
    },
  });*/

// Check if a specific recommendation is saved (returns the saved recommendation ID if found)
export const getSavedRecommendation = query({
  args: {
    type: v.union(v.literal("panel"), v.literal("installer")),
    panelName: v.optional(v.string()),
    panelManufacturer: v.optional(v.string()),
    installerCompany: v.optional(v.string()),
    installerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const saved = await ctx.db
      .query("savedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => {
        if (args.type === "panel") {
          return q.and(
            q.eq(q.field("recommendationType"), "panel"),
            q.eq(q.field("panelData.name"), args.panelName ?? ""),
            q.eq(q.field("panelData.manufacturer"), args.panelManufacturer ?? "")
          );
        } else {
          return q.and(
            q.eq(q.field("recommendationType"), "installer"),
            q.eq(q.field("installerData.company"), args.installerCompany ?? ""),
            q.eq(q.field("installerData.email"), args.installerEmail ?? "")
          );
        }
      })
      .first();

    return saved;
  },
});

// Delete a saved recommendation
export const deleteSavedRecommendation = mutation({
  args: {
    recommendationId: v.id("savedRecommendations"),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation) {
      throw new Error("Recommendation not found");
    }

    if (recommendation.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.recommendationId);
    return true;
  },
});

// Unsave a panel by name and manufacturer (alternative to deleteSavedRecommendation)
export const unsavePanelRecommendation = mutation({
  args: {
    panelName: v.string(),
    panelManufacturer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const saved = await ctx.db
      .query("savedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("recommendationType"), "panel"),
          q.eq(q.field("panelData.name"), args.panelName),
          q.eq(q.field("panelData.manufacturer"), args.panelManufacturer)
        )
      )
      .first();

    if (!saved) {
      throw new Error("Saved panel not found");
    }

    await ctx.db.delete(saved._id);
    return true;
  },
});

// Unsave an installer by company and email (alternative to deleteSavedRecommendation)
export const unsaveInstallerRecommendation = mutation({
  args: {
    installerCompany: v.string(),
    installerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const saved = await ctx.db
      .query("savedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("recommendationType"), "installer"),
          q.eq(q.field("installerData.company"), args.installerCompany),
          q.eq(q.field("installerData.email"), args.installerEmail)
        )
      )
      .first();

    if (!saved) {
      throw new Error("Saved installer not found");
    }

    await ctx.db.delete(saved._id);
    return true;
  },
});