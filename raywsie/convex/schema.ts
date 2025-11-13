// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user information from Clerk
  users: defineTable({
    tokenIdentifier: v.string(), // Clerk user ID
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    location: v.optional(
      v.object({
        city: v.string(),
        state: v.string(),
        country: v.string(),
      })
    ),
    preferences: v.optional(
      v.object({
        theme: v.union(v.literal("light"), v.literal("dark")),
        notifications: v.boolean(),
      })
    ),
  })
    .index("by_email", ["email"])
    .index("by_token_identifier", ["tokenIdentifier"]),

  // Projects table - stores rooftop analysis projects
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    rooftopArea: v.number(), // in sq meters
    uploadDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    imageUrl: v.optional(v.string()),
    analysisId: v.optional(v.id("rooftopAnalysis")),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Rooftop Analysis table - stores AI analysis results
  rooftopAnalysis: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    analyzedAt: v.number(),

    // AI Analysis Results
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

    // Energy Potential
    estimatedEnergyPotential: v.number(), // kWh/month
    suitabilityScore: v.number(), // 0-100

    // Environmental Impact
    co2AvoidedKg: v.number(),

    // AI Model Info
    aiModel: v.string(),
    confidence: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // Solar Recommendations table - stores panel recommendations
  solarRecommendations: defineTable({
    analysisId: v.id("rooftopAnalysis"),
    projectId: v.id("projects"),
    userId: v.id("users"),

    panelType: v.union(
      v.literal("monocrystalline"),
      v.literal("polycrystalline")
    ),

    // Panel Configuration
    numberOfPanels: v.number(),
    totalPowerKw: v.number(),
    efficiency: v.number(), // percentage

    // Cost Analysis
    estimatedCost: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    }),

    // Savings & ROI
    monthlySavings: v.number(),
    yearlyProduction: v.number(), // kWh
    roiYears: v.number(),

    // Additional Details
    warranty: v.number(), // years
    maintenanceCost: v.number(), // yearly

    createdAt: v.number(),
  })
    .index("by_analysis", ["analysisId"])
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // Energy Data table - stores monthly energy production/savings
  energyData: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),

    month: v.number(), // 1-12
    year: v.number(),

    energyProduced: v.number(), // kWh
    energyConsumed: v.number(), // kWh
    savings: v.number(), // currency
    co2Avoided: v.number(), // kg

    timestamp: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user_date", ["userId", "year", "month"]),

  // Notifications table - stores user notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("analysis_complete"),
      v.literal("new_incentive"),
      v.literal("system_update")
    ),
    read: v.boolean(),
    createdAt: v.number(),
    link: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["userId", "read"]),

  // NEW: Saved Projects (Draft state - not finalized)
  savedProjects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    
    location: v.object({
      city: v.string(),
      country: v.string(),
      lat: v.optional(v.number()),
      lon: v.optional(v.number()),
    }),
    
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imageSource: v.union(v.literal("upload"), v.literal("map")),
    renderedLayoutImage: v.optional(v.string()), // NEW: Base64 canvas image
    
    polygonPoints: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    
    imageWidth: v.number(),
    imageHeight: v.number(),
    
    analysis: v.optional(v.object({
      totalPanels: v.number(),
      totalPowerKw: v.number(),
      orientation: v.union(v.number(), v.string()),
      layout: v.string(),
      annualProduction: v.number(),
      recommendations: v.string(),
      sunAnalysis: v.optional(v.string()),
      shadowAnalysis: v.optional(v.string()),
    })),
    
    panelLayout: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.number(),
      })
    )),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(v.literal("draft"), v.literal("analyzed")),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created_at", ["createdAt"]),
  
  // Full updated finalizedLayouts table:
  finalizedLayouts: defineTable({
    userId: v.id("users"),
    savedProjectId: v.optional(v.id("savedProjects")),
    name: v.string(),
    description: v.optional(v.string()),
    
    location: v.object({
      city: v.string(),
      country: v.string(),
      lat: v.optional(v.number()),
      lon: v.optional(v.number()),
    }),
    
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    renderedLayoutImage: v.optional(v.string()), // NEW: Base64 canvas image
    
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
    
    systemSpecs: v.object({
      totalPanels: v.number(),
      systemSizeKw: v.number(),
      estimatedAnnualProductionKwh: v.number(),
      estimatedMonthlySavings: v.number(),
      co2OffsetKgPerYear: v.number(),
    }),
    
    readyForInstallation: v.boolean(),
    expertReviewed: v.boolean(),
    expertNotes: v.optional(v.string()),
    
    finalizedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_finalized_at", ["finalizedAt"])
    .index("by_ready_for_installation", ["userId", "readyForInstallation"]),

  

  // User Selected Solutions - stores user's selected solar solutions for finalized layouts
  

 // User Selected Solutions - tracks what user chose for their finalized layout
  // This stores AI-generated recommendations that the user selected
  userSelectedSolutions: defineTable({
    userId: v.id("users"),
    finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
    savedProjectId: v.optional(v.id("savedProjects")),
    
    // Panel selection (from AI recommendations)
    panelDetails: v.optional(v.object({
      name: v.string(),
      type: v.string(), // "monocrystalline", "polycrystalline", "thin-film"
      manufacturer: v.string(),
      powerRating: v.number(), // watts per panel
      quantity: v.number(), // number of panels
      totalCost: v.number(), // total cost for all panels
    })),
    
    // Installer selection (from AI recommendations)
    installerDetails: v.optional(v.object({
      name: v.string(), // contact person name
      company: v.string(), // company name
      contact: v.string(), // email or phone
      estimatedCost: v.number(), // installation cost
    })),
    
    // Budget information
    userBudget: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    }),
    
    // Total project estimate
    totalProjectCost: v.optional(v.number()),
    
    // Status tracking
    status: v.union(
      v.literal("solution_selected"),
      v.literal("quote_requested"),
      v.literal("quote_received"),
      v.literal("installation_scheduled"),
      v.literal("installation_completed")
    ),
    
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_layout", ["finalizedLayoutId"])
  .index("by_saved_project", ["savedProjectId"])
  .index("by_status", ["status"]),

// NOTE: You do NOT need the solarPanelTypes and solarInstallers tables
// since we're using AI to generate recommendations dynamically!
savedRecommendations: defineTable({
  userId: v.id("users"),
  finalizedLayoutId: v.optional(v.id("finalizedLayouts")),
  savedProjectId: v.optional(v.id("savedProjects")),
  
  // Type of recommendation
  recommendationType: v.union(v.literal("panel"), v.literal("installer")),
  
  // Panel recommendation data (if type is "panel")
  panelData: v.optional(v.object({
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
  })),
  
  // Installer recommendation data (if type is "installer")
  installerData: v.optional(v.object({
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
  })),
  
  // Notes from user
  userNotes: v.optional(v.string()),
  
  // Metadata
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_type", ["userId", "recommendationType"])
  .index("by_finalized_layout", ["finalizedLayoutId"])
  .index("by_saved_project", ["savedProjectId"]),
});
