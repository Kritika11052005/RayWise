"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Sun, Zap, Eye, Calculator, Users, ArrowRight, CheckCircle, Globe, TrendingUp, Cpu, Upload, BarChart3 } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const handleStartAnalysis = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  };

  const handleSignInClick = () => {
    openSignIn({
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
      forceRedirectUrl: '/dashboard'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Main Logo/Title */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="p-3 bg-primary rounded-xl">
                <Sun className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground">
                RayWise
              </h1>
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-4xl font-semibold text-foreground max-w-4xl mx-auto">
                AI-Powered Solar Rooftop Analysis
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your rooftop into a renewable energy powerhouse with intelligent computer vision analysis and optimized solar panel placement designs.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              {isSignedIn ? (
                <button 
                  onClick={handleStartAnalysis}
                  className="group bg-primary hover:opacity-90 px-8 py-3 rounded-md font-medium text-primary-foreground transition-all duration-200 flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={handleSignInClick}
                  className="group bg-primary hover:opacity-90 px-8 py-3 rounded-md font-medium text-primary-foreground transition-all duration-200 flex items-center gap-2"
                >
                  Start Analysis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button className="px-8 py-3 border border-border hover:bg-accent hover:text-accent-foreground rounded-md font-medium text-muted-foreground transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Intelligent Solar Analysis
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our cutting-edge AI technology analyzes your rooftop with precision, providing comprehensive insights for optimal solar panel installation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <div className="p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="p-2 bg-primary rounded-lg w-fit mb-4">
                <Eye className="h-6 w-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-card-foreground">Computer Vision</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Advanced AI analyzes satellite and drone imagery to detect rooftop layouts with exceptional accuracy.
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border hover:border-chart-2/50 transition-colors">
              <div className="p-2 bg-chart-2 rounded-lg w-fit mb-4">
                <Cpu className="h-6 w-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-card-foreground">Smart Optimization</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AI-generated optimal panel placement designs that maximize energy output and efficiency.
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border hover:border-chart-3/50 transition-colors">
              <div className="p-2 bg-chart-3 rounded-lg w-fit mb-4">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-card-foreground">Energy Predictions</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Precise energy output forecasts and cost savings estimates tailored to your location and usage.
              </p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border hover:border-chart-4/50 transition-colors">
              <div className="p-2 bg-chart-4 rounded-lg w-fit mb-4">
                <Globe className="h-6 w-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-card-foreground">Provider Network</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect with trusted local and international solar installers for seamless implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How It Works
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Get your solar analysis in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h4 className="text-xl font-semibold mb-4 text-foreground">Upload Your Rooftop</h4>
              <p className="text-muted-foreground leading-relaxed">
                Simply upload a satellite image or photo of your rooftop, or let our AI analyze it automatically using your address.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-chart-2 text-primary-foreground rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h4 className="text-xl font-semibold mb-4 text-foreground">AI Analysis</h4>
              <p className="text-muted-foreground leading-relaxed">
                Our computer vision technology analyzes your rooftop structure, identifies optimal areas, and creates a custom solar design.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-chart-3 text-primary-foreground rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h4 className="text-xl font-semibold mb-4 text-foreground">Get Results</h4>
              <p className="text-muted-foreground leading-relaxed">
                Receive detailed energy predictions, cost savings estimates, and connect with verified solar installers in your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-card rounded-lg border border-border">
              <div className="text-3xl font-bold text-primary mb-2">1,250</div>
              <div className="text-muted-foreground">kWh Monthly Energy</div>
              <div className="text-chart-3 text-sm mt-1">+12% from last month</div>
            </div>

            <div className="text-center p-8 bg-card rounded-lg border border-border">
              <div className="text-3xl font-bold text-chart-3 mb-2">$180</div>
              <div className="text-muted-foreground">Monthly Savings</div>
              <div className="text-chart-3 text-sm mt-1">+8% from last month</div>
            </div>

            <div className="text-center p-8 bg-card rounded-lg border border-border">
              <div className="text-3xl font-bold text-chart-2 mb-2">890</div>
              <div className="text-muted-foreground">kg CO₂ Avoided</div>
              <div className="text-muted-foreground text-sm mt-1">This month</div>
            </div>

            <div className="text-center p-8 bg-card rounded-lg border border-border">
              <div className="text-3xl font-bold text-chart-4 mb-2">7.2</div>
              <div className="text-muted-foreground">Years ROI Progress</div>
              <div className="text-muted-foreground text-sm mt-1">23% complete</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
                Why Choose RayWise?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-chart-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Precision AI Analysis</h4>
                    <p className="text-muted-foreground">Advanced computer vision technology ensures accurate rooftop assessment and optimal panel placement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-chart-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Comprehensive Reports</h4>
                    <p className="text-muted-foreground">Detailed energy output predictions, financial projections, and environmental impact analysis.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-chart-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Trusted Network</h4>
                    <p className="text-muted-foreground">Connect with vetted solar installers and get competitive quotes from multiple providers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-chart-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Free Analysis</h4>
                    <p className="text-muted-foreground">Get started with our comprehensive rooftop analysis at no cost - make informed decisions about your solar future.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card p-8 rounded-lg border border-border">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-card-foreground mb-2">Latest Rooftop Analysis</h4>
                  <p className="text-muted-foreground text-sm">Main Residence - Analyzed on Aug 15, 2024</p>
                  <span className="inline-block px-2 py-1 bg-chart-3 text-primary-foreground text-xs rounded mt-2">Completed</span>
                </div>
                
                <div className="flex items-center justify-center h-32 bg-muted rounded border border-border">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted-foreground/20 rounded mx-auto mb-2 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Rooftop visualization</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded border border-border">
                    <div className="text-lg font-bold text-primary">High</div>
                    <div className="text-xs text-muted-foreground">Energy Potential</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded border border-border">
                    <div className="text-lg font-bold text-chart-2">Excellent</div>
                    <div className="text-xs text-muted-foreground">Feasibility</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Go Solar?
          </h3>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of homeowners who have discovered their solar potential with RayWise. Start your journey to clean, renewable energy today.
          </p>
          {isSignedIn ? (
            <button 
              onClick={handleStartAnalysis}
              className="inline-flex items-center gap-2 bg-primary hover:opacity-90 px-8 py-3 rounded-md font-medium text-primary-foreground transition-opacity"
            >
              <Upload className="h-5 w-5" />
              Go to Dashboard
            </button>
          ) : (
            <button 
              onClick={handleSignInClick}
              className="inline-flex items-center gap-2 bg-primary hover:opacity-90 px-8 py-3 rounded-md font-medium text-primary-foreground transition-opacity"
            >
              <Upload className="h-5 w-5" />
              Get Started
            </button>
          )}
        </div>
      </section>
    </div>
  );
}