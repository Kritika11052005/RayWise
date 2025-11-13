// convex/recommendations.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save user's selected solution (with direct details from AI recommendations)
export const saveUserSolution = mutation({
    args: {
      finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
      savedProjectId: v.optional(v.id("savedProjects")),
    userBudget: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    }),
    panelDetails: v.optional(v.object({
      name: v.string(),
      type: v.string(),
      manufacturer: v.string(),
      powerRating: v.number(),
      quantity: v.number(),
      totalCost: v.number(),
    })),
    installerDetails: v.optional(v.object({
      name: v.string(),
      company: v.string(),
      contact: v.string(),
      estimatedCost: v.number(),
    })),
    notes: v.optional(v.string()),
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

    // Validate that finalizedLayoutId is provided
    if (!args.finalizedLayoutId) {
      throw new Error("Finalized layout ID is required");
    }

    // TypeScript narrowing: after the check above, finalizedLayoutId is guaranteed to be defined
    const finalizedLayoutId = args.finalizedLayoutId;

    // Get the finalized layout
    // Get the layout or project name
    let layoutName = "your project";
    if (args.finalizedLayoutId) {
      const layout = await ctx.db.get(args.finalizedLayoutId);
      if (!layout) {
        throw new Error("Finalized layout not found");
      }
      if (layout.userId !== user._id) {
        throw new Error("Unauthorized");
      }
      layoutName = layout.name;
    } else if (args.savedProjectId) {
      const project = await ctx.db.get(args.savedProjectId);
      if (!project) {
        throw new Error("Saved project not found");
      }
      if (project.userId !== user._id) {
        throw new Error("Unauthorized");
      }
      layoutName = project.name;
    }

    // Calculate total project cost
    let totalProjectCost = 0;
    if (args.panelDetails) {
      totalProjectCost += args.panelDetails.totalCost;
    }
    if (args.installerDetails) {
      totalProjectCost += args.installerDetails.estimatedCost;
    }

    const now = Date.now();

    // Check if solution already exists for this layout
    // Check if solution already exists for this layout or project
    let existingSolution;
    if (args.finalizedLayoutId) {
      existingSolution = await ctx.db
        .query("userSelectedSolutions")
        .withIndex("by_layout", (q) => q.eq("finalizedLayoutId", args.finalizedLayoutId))
        .unique();
    } else if (args.savedProjectId) {
      existingSolution = await ctx.db
        .query("userSelectedSolutions")
        .withIndex("by_saved_project", (q) => q.eq("savedProjectId", args.savedProjectId))
        .unique();
    }

    if (existingSolution) {
        // Update existing solution
        await ctx.db.patch(existingSolution._id, {
          panelDetails: args.panelDetails,
          installerDetails: args.installerDetails,
          userBudget: args.userBudget,
          totalProjectCost: totalProjectCost > 0 ? totalProjectCost : undefined,
          notes: args.notes,
          updatedAt: now,
        });
  
        return existingSolution._id;
      } else {
        // Create new solution
        const solutionId = await ctx.db.insert("userSelectedSolutions", {
          userId: user._id,
          finalizedLayoutId: args.finalizedLayoutId,
          savedProjectId: args.savedProjectId,
          panelDetails: args.panelDetails,
        installerDetails: args.installerDetails,
        userBudget: args.userBudget,
        totalProjectCost: totalProjectCost > 0 ? totalProjectCost : undefined,
        status: "solution_selected",
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });

      // Create notification
      // Create notification
      await ctx.db.insert("notifications", {
        userId: user._id,
        title: "Solution Selected",
        message: `You've selected a solar solution for "${layoutName}". Your installer will be notified!`,
        type: "system_update",
        read: false,
        createdAt: now,
      });

      return solutionId;
    }
  },
});

// Get user's selected solution for a finalized layout
export const getUserSolution = query({
    args: {
      finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
      savedProjectId: v.optional(v.id("savedProjects")),
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

    let solution;
    if (args.finalizedLayoutId) {
      solution = await ctx.db
        .query("userSelectedSolutions")
        .withIndex("by_layout", (q) => q.eq("finalizedLayoutId", args.finalizedLayoutId))
        .unique();
    } else if (args.savedProjectId) {
      solution = await ctx.db
        .query("userSelectedSolutions")
        .withIndex("by_saved_project", (q) => q.eq("savedProjectId", args.savedProjectId))
        .unique();
    }

    return solution;
  },
});

// Update solution status (for tracking progress)
export const updateSolutionStatus = mutation({
  args: {
    solutionId: v.id("userSelectedSolutions"),
    status: v.union(
      v.literal("solution_selected"),
      v.literal("quote_requested"),
      v.literal("quote_received"),
      v.literal("installation_scheduled"),
      v.literal("installation_completed")
    ),
    notes: v.optional(v.string()),
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

    const solution = await ctx.db.get(args.solutionId);
    if (!solution) {
      throw new Error("Solution not found");
    }

    if (solution.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.solutionId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return args.solutionId;
  },
});

// Get all user solutions (for dashboard/history)
export const getUserSolutions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    // Try by email if not found by token
    if (!user && identity.email) {
      const email = identity.email;
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }

    if (!user) return [];

    const solutions = await ctx.db
      .query("userSelectedSolutions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return solutions;
  },
});
