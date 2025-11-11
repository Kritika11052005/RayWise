// convex/finalizedLayouts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type FinalizedLayoutUpdates = {
  updatedAt: number;
  readyForInstallation?: boolean;
  expertReviewed?: boolean;
  expertNotes?: string;
  description?: string;
};

// Helper function to get or create user
async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Try to find user by token identifier
  let user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  // If user doesn't exist, try by email
  const email = identity.email;

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  }

  // If still no user, create one
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

// Finalize a layout (move from saved project to production-ready)
export const finalizeLayout = mutation({
  args: {
    savedProjectId: v.optional(v.id("savedProjects")),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.object({
      city: v.string(),
      country: v.string(),
      lat: v.optional(v.number()),
      lon: v.optional(v.number()),
    }),
    imageUrl: v.optional(v.string()),
    polygonPoints: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    imageWidth: v.number(),
    imageHeight: v.number(),
    analysis: v.object({
      totalPanels: v.number(),
      totalPowerKw: v.number(),
      orientation: v.union(v.number(), v.string()),
      layout: v.string(),
      annualProduction: v.number(),
      recommendations: v.string(),
      sunAnalysis: v.optional(v.string()),
      shadowAnalysis: v.optional(v.string()),
    }),
    panelLayout: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    // Calculate system specifications
    const totalPanels = args.analysis.totalPanels;
    const systemSizeKw = args.analysis.totalPowerKw;
    const estimatedAnnualProductionKwh = args.analysis.annualProduction;
    
    // Estimate monthly savings (assuming $0.12/kWh average)
    const estimatedMonthlySavings = (estimatedAnnualProductionKwh / 12) * 0.12;
    
    // Calculate CO2 offset (0.92 lbs CO2 per kWh = 0.417 kg CO2 per kWh)
    const co2OffsetKgPerYear = estimatedAnnualProductionKwh * 0.417;

    const now = Date.now();

    const layoutId = await ctx.db.insert("finalizedLayouts", {
      userId: user._id,
      savedProjectId: args.savedProjectId,
      name: args.name,
      description: args.description,
      location: args.location,
      imageUrl: args.imageUrl,
      polygonPoints: args.polygonPoints,
      imageWidth: args.imageWidth,
      imageHeight: args.imageHeight,
      analysis: args.analysis,
      panelLayout: args.panelLayout,
      systemSpecs: {
        totalPanels,
        systemSizeKw,
        estimatedAnnualProductionKwh,
        estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
        co2OffsetKgPerYear: Math.round(co2OffsetKgPerYear),
      },
      readyForInstallation: false, // Expert review needed
      expertReviewed: false,
      finalizedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Layout Finalized",
      message: `Your solar panel layout "${args.name}" has been finalized and is ready for expert review!`,
      type: "system_update",
      read: false,
      createdAt: now,
    });

    return layoutId;
  },
});

// Get all finalized layouts for current user
export const getUserFinalizedLayouts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return [];
    }

    // Try to find user by token identifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    // If no user found by token, try by email (with type guard)
    if (!user && identity.email) {
      const email = identity.email; // TypeScript now knows this is string
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }

    if (!user) {
      return [];
    }

    const layouts = await ctx.db
      .query("finalizedLayouts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return layouts;
  },
});


// Get a single finalized layout
export const getFinalizedLayout = query({
  args: { layoutId: v.id("finalizedLayouts") },
  handler: async (ctx, args) => {
    const layout = await ctx.db.get(args.layoutId);
    if (!layout) return null;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || layout.userId !== user._id) {
      return null;
    }

    return layout;
  },
});

// Update finalized layout (e.g., after expert review)
export const updateFinalizedLayout = mutation({
  args: {
    layoutId: v.id("finalizedLayouts"),
    readyForInstallation: v.optional(v.boolean()),
    expertReviewed: v.optional(v.boolean()),
    expertNotes: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const layout = await ctx.db.get(args.layoutId);
    if (!layout) {
      throw new Error("Layout not found");
    }

    if (layout.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: FinalizedLayoutUpdates = {
      updatedAt: Date.now(),
    };

    if (args.readyForInstallation !== undefined) {
      updates.readyForInstallation = args.readyForInstallation;
    }
    if (args.expertReviewed !== undefined) {
      updates.expertReviewed = args.expertReviewed;
    }
    if (args.expertNotes) {
      updates.expertNotes = args.expertNotes;
    }
    if (args.description) {
      updates.description = args.description;
    }

    await ctx.db.patch(args.layoutId, updates);

    return args.layoutId;
  },
});

// Delete a finalized layout
export const deleteFinalizedLayout = mutation({
  args: { layoutId: v.id("finalizedLayouts") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const layout = await ctx.db.get(args.layoutId);
    if (!layout) {
      throw new Error("Layout not found");
    }

    if (layout.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.layoutId);
    return true;
  },
});

// Get finalized layouts ready for installation
export const getReadyForInstallation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    const layouts = await ctx.db
      .query("finalizedLayouts")
      .withIndex("by_ready_for_installation", (q) => 
        q.eq("userId", user._id).eq("readyForInstallation", true)
      )
      .order("desc")
      .collect();

    return layouts;
  },
});