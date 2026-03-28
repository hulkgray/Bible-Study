/**
 * Curated prompt templates for the Bible Study AI.
 * Organized by category for the Prompt Library UI.
 */

export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  title: string;
  description: string;
  /** Template string — placeholders in {curly braces} are for user to fill in */
  template: string;
}

export type PromptCategory =
  | "exegesis"
  | "topical"
  | "comparison"
  | "historical"
  | "devotional"
  | "language"
  | "practical";

export const PROMPT_CATEGORIES: { id: PromptCategory; label: string; emoji: string }[] = [
  { id: "exegesis", label: "Exegesis", emoji: "📖" },
  { id: "language", label: "Original Language", emoji: "🔤" },
  { id: "topical", label: "Topical Study", emoji: "🎯" },
  { id: "comparison", label: "Compare & Cross-Ref", emoji: "🔀" },
  { id: "historical", label: "Historical Context", emoji: "🏛️" },
  { id: "devotional", label: "Devotional", emoji: "🙏" },
  { id: "practical", label: "Practical", emoji: "💡" },
];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ─── Exegesis ───
  {
    id: "exegesis-verse",
    category: "exegesis",
    title: "Verse-by-Verse Breakdown",
    description: "Deep dive into a specific verse",
    template: "Do a thorough verse-by-verse exegesis of {verse reference}. Include the original language analysis, historical context, cross-references, and practical application.",
  },
  {
    id: "exegesis-passage",
    category: "exegesis",
    title: "Passage Analysis",
    description: "Analyze a full passage or chapter",
    template: "Analyze {passage or chapter} in its literary and theological context. What is the main argument? How does it fit in the book's structure?",
  },
  {
    id: "exegesis-parable",
    category: "exegesis",
    title: "Parable Interpretation",
    description: "Understand a parable of Jesus",
    template: "Explain the parable in {verse reference}. Who was the original audience? What is the central point Jesus was making? How does it apply today?",
  },

  // ─── Original Language ───
  {
    id: "lang-word-study",
    category: "language",
    title: "Word Study",
    description: "Study a word in Hebrew or Greek",
    template: "Do a word study on the word \"{word}\" as used in {verse reference}. Include the Strong's number, original language root, semantic range, and how it's used elsewhere in Scripture.",
  },
  {
    id: "lang-compare-translations",
    category: "language",
    title: "Translation Comparison",
    description: "Why translations differ on a verse",
    template: "Compare how different translations render {verse reference}. Why do they differ? What does the original Hebrew/Greek most precisely mean?",
  },
  {
    id: "lang-grammar",
    category: "language",
    title: "Grammar Deep Dive",
    description: "Analyze the grammar of a verse",
    template: "Explain the grammatical structure of {verse reference} in the original language. What tense, voice, and mood are the key verbs? How does this affect meaning?",
  },

  // ─── Topical Study ───
  {
    id: "topic-what-says",
    category: "topical",
    title: "What Does the Bible Say About...",
    description: "Survey a topic across Scripture",
    template: "What does the Bible teach about {topic}? Provide key verses from both Old and New Testaments, and summarize the overall biblical theology of this subject.",
  },
  {
    id: "topic-character",
    category: "topical",
    title: "Character Study",
    description: "Learn from a biblical figure",
    template: "Do a character study on {biblical figure}. Cover their background, key events, spiritual highs and lows, and the lessons we can learn from their life.",
  },
  {
    id: "topic-doctrine",
    category: "topical",
    title: "Doctrine Explained",
    description: "Understand a Christian doctrine",
    template: "Explain the doctrine of {doctrine name} from a Reformed/Protestant perspective. What are the key Scripture passages? How has the Church historically understood this?",
  },

  // ─── Compare & Cross-Reference ───
  {
    id: "compare-verses",
    category: "comparison",
    title: "Compare Two Passages",
    description: "See how passages relate",
    template: "Compare {verse/passage A} with {verse/passage B}. What are the similarities and differences? How do they complement each other theologically?",
  },
  {
    id: "compare-testament",
    category: "comparison",
    title: "OT/NT Connections",
    description: "Trace a theme across testaments",
    template: "Trace the theme of {theme} from the Old Testament into the New Testament. How does it develop? What are the key connecting passages?",
  },
  {
    id: "compare-type",
    category: "comparison",
    title: "Types & Shadows",
    description: "OT types fulfilled in Christ",
    template: "Explain how {OT person, event, or institution} is a type or shadow of Christ or the New Covenant. What parallels exist?",
  },

  // ─── Historical Context ───
  {
    id: "hist-context",
    category: "historical",
    title: "Historical Background",
    description: "Understand the setting",
    template: "What is the historical and cultural context of {book or passage}? What was happening politically, socially, and religiously when this was written?",
  },
  {
    id: "hist-audience",
    category: "historical",
    title: "Original Audience",
    description: "Who first heard this message",
    template: "Who was the original audience of {book}? What were their circumstances? How would they have understood this message differently than we do today?",
  },
  {
    id: "hist-authorship",
    category: "historical",
    title: "Authorship & Date",
    description: "Who wrote it and when",
    template: "Discuss the authorship, date, and occasion of writing for the book of {book}. What evidence supports these conclusions?",
  },

  // ─── Devotional ───
  {
    id: "devot-meditate",
    category: "devotional",
    title: "Meditation Guide",
    description: "Slow, prayerful reflection",
    template: "Guide me through a devotional meditation on {verse reference}. Help me see what God is revealing about Himself, about me, and how I should respond in prayer.",
  },
  {
    id: "devot-comfort",
    category: "devotional",
    title: "Comfort in Trial",
    description: "Biblical encouragement",
    template: "I am going through {situation or trial}. What does Scripture say about this? Give me specific verses and words of encouragement grounded in God's promises.",
  },
  {
    id: "devot-prayer",
    category: "devotional",
    title: "Scripture-Based Prayer",
    description: "Pray the Bible",
    template: "Help me write a prayer based on {verse reference or passage}. Incorporate the themes and truths of this passage into a personal prayer.",
  },

  // ─── Practical ───
  {
    id: "pract-teach",
    category: "practical",
    title: "Teaching Outline",
    description: "Prepare a lesson or sermon",
    template: "Create a teaching outline for {passage or topic}. Include an introduction, 3 main points with supporting Scripture, illustrations, and a practical application.",
  },
  {
    id: "pract-memorize",
    category: "practical",
    title: "Memory Verse Help",
    description: "Memorize a verse",
    template: "Help me memorize {verse reference}. Break it down into phrases, explain the meaning of each part, and give me a mnemonic or framework to remember it.",
  },
  {
    id: "pract-discussion",
    category: "practical",
    title: "Discussion Questions",
    description: "For small group study",
    template: "Generate 5-7 discussion questions for a small group studying {passage or chapter}. Include observation, interpretation, and application questions.",
  },
];
