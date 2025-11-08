// convex/rooftopAnalysis.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new rooftop analysis
export const createAnalysis = mutation({
  args: {
    projectId: v.id("projects"),
    rooftopCondition: v.string(),
    availableArea: v.number(),
    shading: v.object({
      level: v.union(
        v.literal("minimal"),
        v.literal("moderate"),
        v.literal("significant")
      ),
      description: v.string(),
    }),
    orientation: v.object({
      direction: v.string(),
      angle: v.number(),
      optimality: v.string(),
    }),
    obstacles: v.array(v.string()),
    estimatedEnergyPotential: v.number(),
    suitabilityScore: v.number(),
    co2AvoidedKg: v.number(),
    aiModel: v.string(),
    confidence: v.number(),
    
    // New fields for panel layout
    totalPanels: v.optional(v.number()),
    panelLayout: v.optional(v.string()), // JSON string of panel positions
    layoutRecommendations: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify project belongs to user
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or unauthorized");
    }

    // Create analysis
    const analysisId = await ctx.db.insert("rooftopAnalysis", {
      projectId: args.projectId,
      userId: user._id,
      analyzedAt: Date.now(),
      rooftopCondition: args.rooftopCondition,
      availableArea: args.availableArea,
      shading: args.shading,
      orientation: args.orientation,
      obstacles: args.obstacles,
      estimatedEnergyPotential: args.estimatedEnergyPotential,
      suitabilityScore: args.suitabilityScore,
      co2AvoidedKg: args.co2AvoidedKg,
      aiModel: args.aiModel,
      confidence: args.confidence,
    });

    // Update project status
    await ctx.db.patch(args.projectId, {
      status: "completed",
      analysisId: analysisId,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Analysis Complete",
      message: `Your rooftop analysis for ${project.name} is ready!`,
      type: "analysis_complete",
      read: false,
      createdAt: Date.now(),
    });

    return analysisId;
  },
});

// Get analysis by project ID
export const getAnalysisByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooftopAnalysis")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
  },
});

// Get all analyses for current user
export const getUserAnalyses = query({
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

    return await ctx.db
      .query("rooftopAnalysis")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Update analysis with panel layout
export const updatePanelLayout = mutation({
  args: {
    analysisId: v.id("rooftopAnalysis"),
    totalPanels: v.number(),
    panelLayout: v.string(), // JSON string
    layoutRecommendations: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    // Note: The schema needs to be updated to include these fields
    // For now, we'll store this in the rooftopCondition as JSON
    const updatedData = {
      ...analysis,
      totalPanels: args.totalPanels,
      panelLayout: args.panelLayout,
      layoutRecommendations: args.layoutRecommendations,
    };

    await ctx.db.patch(args.analysisId, {
      rooftopCondition: JSON.stringify(updatedData),
    });

    return args.analysisId;
  },
});

// Delete analysis
export const deleteAnalysis = mutation({
  args: { analysisId: v.id("rooftopAnalysis") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || analysis.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.analysisId);
    return true;
  },
});