"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Zap, Shield, Clock, ArrowRight } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

interface LandingPageProps {
  onSignIn: () => void
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-secondary/5 dark:bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Mail className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GmailAgent
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button
            onClick={onSignIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 animate-fade-in-up shadow-lg hover:shadow-xl transition-all"
            style={{ animationDelay: "0.1s" }}
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4 animate-fade-in-up">
              <div className="inline-block px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full border border-primary/20 hover:border-primary/40 transition-colors">
                <span className="text-sm font-semibold text-primary">AI-Powered Email Management</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
                Your{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Email</span>{" "}
                <span className="block">Assistant</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Manage your Gmail efficiently with intelligent AI assistance. View unread emails, filter important
                messages, draft and send emails—all in one beautiful, modern interface.
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {[
                { icon: Zap, label: "Lightning Fast", desc: "Instant email management" },
                { icon: Shield, label: "Secure", desc: "Your data is protected" },
                { icon: Clock, label: "Time Saving", desc: "Automate repetitive tasks" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{feature.label}</p>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Button
                onClick={onSignIn}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 group"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign Up with Google
                <ArrowRight className={`w-5 h-5 ml-2 transition-transform ${isHovering ? "translate-x-1" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative hidden md:block animate-slide-in-right">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 rounded-2xl border border-primary/30 dark:border-primary/40 backdrop-blur-sm p-8 space-y-6 shadow-2xl hover:shadow-3xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/30 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-primary/30 rounded w-32"></div>
                      <div className="h-2 bg-primary/20 rounded w-24 mt-1"></div>
                    </div>
                  </div>
                  <div className="space-y-2 pl-13">
                    <div className="h-3 bg-primary/30 rounded w-full"></div>
                    <div className="h-3 bg-primary/20 rounded w-5/6"></div>
                    <div className="h-3 bg-primary/20 rounded w-4/5"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-primary/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">✉</div>
                    <div className="text-xs text-muted-foreground mt-1">Inbox</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">✎</div>
                    <div className="text-xs text-muted-foreground mt-1">Drafts</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 dark:bg-primary/30 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 dark:bg-accent/30 rounded-full blur-2xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          {[
            {
              title: "Smart Inbox",
              desc: "AI-powered email filtering and organization",
            },
            {
              title: "Draft Management",
              desc: "Create, edit, and send drafts seamlessly",
            },
            {
              title: "AI Assistant",
              desc: "Get intelligent suggestions and automation",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-card/50 dark:bg-card/30 border border-border dark:border-border/50 rounded-xl p-6 hover:border-primary/50 dark:hover:border-primary/60 transition-all duration-300 hover:shadow-lg backdrop-blur-sm group"
            >
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          {[
            { number: "10K+", label: "Active Users" },
            { number: "99.9%", label: "Uptime" },
            { number: "24/7", label: "AI Support" },
            { number: "100%", label: "Secure" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card/50 dark:bg-card/30 border border-border dark:border-border/50 rounded-xl p-6 text-center hover:border-primary/50 dark:hover:border-primary/60 transition-all duration-300 hover:shadow-lg backdrop-blur-sm group"
            >
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                {stat.number}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
