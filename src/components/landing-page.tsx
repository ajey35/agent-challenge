"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mail, Zap, Brain, ArrowRight, CheckCircle2, Sparkles, Shield, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onSignIn: () => void
}

function useInView<T extends Element = Element>(ref: React.RefObject<T | null>) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1, rootMargin: "0px" }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
      observer.disconnect()
    }
  }, [ref])

  return isInView
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const heroRef = useRef<HTMLDivElement | null>(null)
  const featuresRef = useRef<HTMLDivElement | null>(null)
  const benefitsRef = useRef<HTMLDivElement | null>(null)
  const testimonialsRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)

  const heroInView = useInView<HTMLDivElement>(heroRef as React.RefObject<HTMLDivElement>)
  const featuresInView = useInView<HTMLDivElement>(featuresRef as React.RefObject<HTMLDivElement>)
  const benefitsInView = useInView<HTMLDivElement>(benefitsRef as React.RefObject<HTMLDivElement>)
  const testimonialsInView = useInView<HTMLDivElement>(testimonialsRef as React.RefObject<HTMLDivElement>)
  const ctaInView = useInView<HTMLDivElement>(ctaRef as React.RefObject<HTMLDivElement>)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    // Defer actual auth to parent via onSignIn so we don't change behavior
    setTimeout(() => {
      onSignIn()
      setIsLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Mail size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">MailAI</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign In
            </>
          )}
        </button>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className={`relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 transition-all duration-1000 ${
          heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-20">
          <div
            className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm transition-all duration-1000 ${
              heroInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Powered by Advanced AI</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight text-balance">
            Write Emails That{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Matter
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed text-balance">
            Compose professional emails in seconds. Let AI help you craft the perfect message every time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Get Started Free
                </>
              )}
            </button>
            <button className="px-8 py-4 rounded-full border-2 border-white/20 text-white font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2">
              Watch Demo
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 border-t border-white/10">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">10M+</div>
              <p className="text-sm text-gray-400">Emails Composed</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">50K+</div>
              <p className="text-sm text-gray-400">Active Users</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">4.9★</div>
              <p className="text-sm text-gray-400">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className={`relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 transition-all duration-1000 ${
          featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to master email communication</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Brain, title: "AI Composition", desc: "Intelligent suggestions for better emails" },
            { icon: Zap, title: "Lightning Fast", desc: "Compose and send in seconds" },
            { icon: Shield, title: "Secure & Private", desc: "Your data stays completely private" },
            { icon: Rocket, title: "Smart Inbox", desc: "AI-powered email organization" },
          ].map((feature, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 group transform ${
                featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: featuresInView ? `${i * 100}ms` : "0ms" }}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <feature.icon size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section
        ref={benefitsRef}
        className={`relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 transition-all duration-1000 ${
          benefitsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Why Teams Choose MailAI</h2>
            <div className="space-y-6">
              {[
                "Save 10+ hours per week on email writing",
                "Improve email clarity and professionalism",
                "Never miss important emails again",
                "Enterprise-grade security and privacy",
              ].map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 transition-all duration-1000 ${
                    benefitsInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                  }`}
                  style={{ transitionDelay: benefitsInView ? `${i * 100}ms` : "0ms" }}
                >
                  <CheckCircle2 size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="h-3 bg-white/10 rounded-full w-3/4"></div>
                <div className="h-3 bg-white/10 rounded-full w-full"></div>
                <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
                <div className="h-12 bg-blue-500/20 rounded-lg mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className={`relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 transition-all duration-1000 ${
          testimonialsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Professionals</h2>
          <p className="text-xl text-gray-400">Join thousands of users who write better emails</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Chen",
              role: "Marketing Director",
              text: "MailAI has transformed how our team communicates. We save hours every week.",
            },
            {
              name: "James Wilson",
              role: "Sales Manager",
              text: "The AI suggestions are incredibly accurate. Our email response rates improved by 40%.",
            },
            {
              name: "Emma Rodriguez",
              role: "HR Manager",
              text: "Professional, intuitive, and reliable. Highly recommend to any organization.",
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl bg-white/5 border border-white/10 transition-all duration-1000 transform ${
                testimonialsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: testimonialsInView ? `${i * 100}ms` : "0ms" }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-yellow-400">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className={`relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 transition-all duration-1000 ${
          ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-12 md:p-20">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_50%,transparent_50%,transparent_75%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1))] bg-[length:40px_40px] animate-pulse"></div>
          <div className="relative text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Write Better Emails?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already saving time and writing better emails with MailAI.
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Get Started Free
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-24 py-12 px-6 md:px-12 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <span className="font-bold">MailAI</span>
              </div>
              <p className="text-gray-400 text-sm">Write better emails with AI assistance.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <p>&copy; 2025 MailAI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
