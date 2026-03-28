import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  BookOpen,
  Search,
  Languages,
  BookText,
  Library,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "10 Parallel Translations",
    desc: "Read KJV, ESV, NASB, NIV, and more side by side. 31,103 verses across every translation.",
    color: "text-amber-500",
  },
  {
    icon: Languages,
    title: "Strong's Concordance",
    desc: "Study original Hebrew & Greek words with inline interlinear tags and full definitions.",
    color: "text-emerald-400",
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Study",
    desc: "Ask theological questions backed by Scripture, concordance data, and Reformed literature.",
    color: "text-cyan-400",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    desc: "Search across every translation with instant results. Find any verse or phrase.",
    color: "text-blue-400",
  },
  {
    icon: BookText,
    title: "Bible Dictionary",
    desc: "Easton's complete reference with 4,000+ entries on people, places, and concepts.",
    color: "text-purple-400",
  },
  {
    icon: Library,
    title: "Classic Library",
    desc: "Read Spurgeon, Bunyan's Pilgrim's Progress, daily devotionals, and the Puritan Catechism.",
    color: "text-rose-400",
  },
];

const TRUST_POINTS = [
  { icon: Shield, text: "Private & secure — your notes and bookmarks are yours alone" },
  { icon: Zap, text: "Lightning fast — built on edge infrastructure worldwide" },
  { icon: Sparkles, text: "9 AI models — choose from Anthropic, Google, OpenAI, xAI, and Meta" },
];

/**
 * Public landing page.
 * Server component — checks auth and redirects logged-in users to /dashboard.
 */
export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gold text-2xl font-scripture">✦</span>
            <span className="font-semibold text-sm tracking-wide">Bible Study</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gold hover:bg-gold/90 text-black transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Bible Study</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-scripture font-semibold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
            Study Scripture with
            <span className="text-gold"> Depth & Clarity</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            10 parallel translations, Strong&apos;s Greek &amp; Hebrew concordance,
            Easton&apos;s dictionary, classic Reformed literature, and AI research — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/bible/genesis/1"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-border hover:border-gold/30 text-foreground/80 hover:text-foreground font-medium text-base transition-all duration-200"
            >
              Browse the Bible
            </Link>
          </div>
        </div>
      </section>

      {/* Scripture quote divider */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="p-8 rounded-2xl bg-scripture-bg/50 border border-gold/10 text-center animate-slide-up">
          <p className="font-scripture text-xl leading-relaxed text-foreground/80 italic">
            &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
          </p>
          <p className="text-gold text-sm font-medium mt-4">
            Psalm 119:105 — KJV
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-scripture font-semibold mb-3">
            Everything You Need for Deep Study
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            A complete toolkit designed for serious students of the Word.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-gold/20 transition-all duration-300 hover:shadow-md animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className={`p-2.5 rounded-lg bg-muted w-fit mb-4 ${feature.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base mb-2 group-hover:text-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.text} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gold/10 text-gold shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {point.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-scripture font-semibold mb-4">
          Start Your Study Today
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create a free account to save bookmarks, notes, and AI conversations.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
        >
          Create Free Account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="text-gold font-scripture">✦</span>
            <span>Bible Study Tool</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/bible/genesis/1" className="hover:text-foreground transition-colors">Bible</Link>
            <Link href="/search" className="hover:text-foreground transition-colors">Search</Link>
            <Link href="/dictionary" className="hover:text-foreground transition-colors">Dictionary</Link>
            <Link href="/library" className="hover:text-foreground transition-colors">Library</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
