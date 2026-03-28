import Link from "next/link";
import {
  BookOpen,
  Search,
  Languages,
  BookText,
  Library,
  Calendar,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const QUICK_ACCESS = [
  {
    href: "/bible/genesis/1",
    icon: BookOpen,
    title: "Bible",
    desc: "10 parallel translations, 31,103 verses",
    color: "text-amber-500",
  },
  {
    href: "/search",
    icon: Search,
    title: "Search",
    desc: "Full-text search across all translations",
    color: "text-blue-400",
  },
  {
    href: "/strongs",
    icon: Languages,
    title: "Strong's Concordance",
    desc: "Greek & Hebrew word study",
    color: "text-emerald-400",
  },
  {
    href: "/dictionary",
    icon: BookText,
    title: "Bible Dictionary",
    desc: "Easton's complete reference",
    color: "text-purple-400",
  },
  {
    href: "/library",
    icon: Library,
    title: "Library",
    desc: "Spurgeon, Bunyan, Puritan Catechism",
    color: "text-rose-400",
  },
  {
    href: "/study",
    icon: MessageSquare,
    title: "AI Study",
    desc: "RAG-powered theological research",
    color: "text-cyan-400",
  },
];

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-6">
          <Calendar className="h-3.5 w-3.5" />
          <span>Today&apos;s Study</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-scripture font-semibold tracking-tight mb-4">
          Bible Study Tool
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Study Scripture with 10 translations, Strong&apos;s concordance,
          Easton&apos;s dictionary, and AI-powered research.
        </p>
      </div>

      {/* Today's Devotional Card */}
      <div className="mb-10 animate-slide-up">
        <Link
          href="/devotional"
          className="block group p-6 rounded-xl bg-card border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-gold text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Daily Devotional — Faith&apos;s Checkbook</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
          </div>
          <p className="font-scripture text-lg leading-relaxed text-foreground/90 italic">
            &ldquo;A promise from God may very instructively be compared to a
            check payable to order.&rdquo;
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            — Charles H. Spurgeon
          </p>
        </Link>
      </div>

      {/* Quick Access Grid */}
      <h2 className="text-lg font-semibold mb-4 pl-1">Study Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_ACCESS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block p-5 rounded-xl bg-card border border-border hover:border-gold/20 transition-all duration-300 hover:shadow-md animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-gold transition-colors mt-1 shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Scripture of the Day */}
      <div className="mt-12 text-center animate-fade-in">
        <div className="max-w-lg mx-auto p-8 rounded-2xl bg-scripture-bg/50 border border-gold/10">
          <p className="font-scripture text-xl leading-relaxed text-foreground/80 italic">
            &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
          </p>
          <p className="text-gold text-sm font-medium mt-4">
            Psalm 119:105 — KJV
          </p>
        </div>
      </div>
    </div>
  );
}
