"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowLeft, X } from "lucide-react";

type Category =
  | "UI/UX Design"
  | "Prompt Engineering"
  | "AI & ML Fundamentals"
  | "LLM Concepts"
  | "Product Strategy"
  | "Data & Logic"
  | "API & Integration"
  | "Software Development"
  | "AI Safety & Ethics"
  | "Business Strategy";

type Term = {
  term: string;
  category: Category;
  definition: string;
  example?: string;
};

const CATEGORY_COLORS: Record<Category, string> = {
  "UI/UX Design": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Prompt Engineering": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "AI & ML Fundamentals": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "LLM Concepts": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Product Strategy": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "Data & Logic": "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "API & Integration": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "Software Development": "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "AI Safety & Ethics": "bg-red-500/15 text-red-300 border-red-500/30",
  "Business Strategy": "bg-lime-500/15 text-lime-300 border-lime-500/30",
};

const ALL_TERMS: Term[] = [
  // UI/UX Design
  { term: "Edge Case", category: "UI/UX Design", definition: "A rare or extreme situation outside normal operating parameters.", example: "What happens if a user's name is 500 characters long?" },
  { term: "Happy Path", category: "UI/UX Design", definition: "The default, error-free flow a user takes to complete a task successfully, with no unexpected input or errors." },
  { term: "Friction", category: "UI/UX Design", definition: "Anything that slows a user down, confuses them, or gets in the way of achieving their goal.", example: "A 15-field signup form creates high friction." },
  { term: "Cognitive Load", category: "UI/UX Design", definition: "The amount of mental effort required to understand and use an interface. Fewer decisions and less complexity = lower cognitive load." },
  { term: "Affordance", category: "UI/UX Design", definition: "A visual cue that tells the user how an element should be used.", example: "A raised button 'affords' clicking. A handle 'affords' pulling." },
  { term: "Onboarding", category: "UI/UX Design", definition: "The initial process of guiding a new user through your product so they understand its value and core features." },
  { term: "Empty State", category: "UI/UX Design", definition: "What a user sees when there is no data to display yet.", example: "A new inbox with zero messages, or a dashboard with no charts yet." },
  { term: "Accessibility (A11y)", category: "UI/UX Design", definition: "Designing your product so it can be used by everyone, including people with disabilities such as visual impairments or motor limitations." },
  { term: "Microcopy", category: "UI/UX Design", definition: "Small bits of text on interfaces that guide users, including button labels, error messages, placeholder text, and confirmations." },
  { term: "Information Architecture (IA)", category: "UI/UX Design", definition: "How information and pages are structured, organized, and labeled within your product so users can find things intuitively." },
  { term: "User Journey", category: "UI/UX Design", definition: "The sequence of steps a user takes from first encountering your product to achieving their goal, including emotions and pain points." },
  { term: "Wireframe", category: "UI/UX Design", definition: "A low-fidelity layout sketch showing the structure and placement of elements without visual design or color." },
  { term: "Prototype", category: "UI/UX Design", definition: "An interactive model simulating the product's behavior used for testing and feedback before building the real thing." },
  { term: "Modal", category: "UI/UX Design", definition: "A dialog box that appears on top of the page, blocking interaction with the content behind until the user acts." },
  { term: "Toast Notification", category: "UI/UX Design", definition: "A small, temporary message that pops up briefly to confirm an action or alert the user without interrupting their flow." },
  { term: "Tooltip", category: "UI/UX Design", definition: "Contextual text that appears when hovering over an element to explain what it does." },
  { term: "CTA (Call to Action)", category: "UI/UX Design", definition: "A button or element that prompts a specific action from the user.", example: "'Sign Up', 'Buy Now', 'Get Started Free'." },
  { term: "Above the Fold", category: "UI/UX Design", definition: "Content visible without scrolling. The highest visibility area of any page — critical for first impressions." },
  { term: "Progressive Disclosure", category: "UI/UX Design", definition: "Hiding advanced or secondary options until the user needs them, reducing clutter and cognitive load." },
  { term: "Skeleton Loading", category: "UI/UX Design", definition: "Placeholder shapes shown while content loads, giving users a visual sense of the layout before data arrives." },
  { term: "Error State", category: "UI/UX Design", definition: "The UI shown when something fails — a broken form, a failed API call, or an invalid input." },
  { term: "Navigation Hierarchy", category: "UI/UX Design", definition: "The structured ordering of pages and sections in your product, defining how deep users must go to reach any content." },
  { term: "Breadcrumb", category: "UI/UX Design", definition: "A trail of links showing the user's current location within a site hierarchy.", example: "Home > Products > Electronics > Laptops" },
  { term: "Responsive Design", category: "UI/UX Design", definition: "UI that adapts fluidly to different screen sizes, from mobile to desktop, using flexible layouts and CSS." },
  { term: "Mobile-First Design", category: "UI/UX Design", definition: "A design approach that starts with the smallest screen and scales up, ensuring the core experience works on phones." },
  { term: "Design System", category: "UI/UX Design", definition: "A shared library of reusable components, tokens, spacing rules, and guidelines that create visual consistency across a product." },
  { term: "Dark Pattern", category: "UI/UX Design", definition: "A deceptive UI design that tricks users into doing things they didn't intend.", example: "Hiding the unsubscribe button in tiny grey text." },
  { term: "Heuristic Evaluation", category: "UI/UX Design", definition: "An expert review of a UI against established usability principles (Nielsen's 10 heuristics) to find problems without user testing." },
  { term: "Dead End", category: "UI/UX Design", definition: "A state where the user has no clear path forward — like a 404 page with no navigation back." },
  { term: "Hover State", category: "UI/UX Design", definition: "The visual change an element shows when the cursor moves over it, confirming interactivity." },

  // Prompt Engineering
  { term: "Prompt", category: "Prompt Engineering", definition: "The input text you provide to an AI model. Everything the model sees becomes the prompt." },
  { term: "System Prompt", category: "Prompt Engineering", definition: "Instructions set before the conversation begins that define the AI's behavior, tone, role, and constraints. Users typically can't see it." },
  { term: "User Prompt", category: "Prompt Engineering", definition: "The message from the user in a conversation — what you actually type to the model." },
  { term: "Role Prompting", category: "Prompt Engineering", definition: "Instructing the AI to take on a specific persona or role to shape its tone and expertise.", example: "'Act as a senior software engineer reviewing this code.'" },
  { term: "Chain-of-Thought (CoT)", category: "Prompt Engineering", definition: "Prompting the AI to reason step-by-step before giving its final answer, improving accuracy on complex tasks.", example: "'Think through this step by step before answering.'" },
  { term: "Zero-Shot Prompt", category: "Prompt Engineering", definition: "A prompt with no examples, relying entirely on the model's pre-existing knowledge and instruction-following ability." },
  { term: "Few-Shot Prompt", category: "Prompt Engineering", definition: "A prompt that includes 2–5 examples of the desired input-output pattern so the model can match the format." },
  { term: "One-Shot Prompt", category: "Prompt Engineering", definition: "A prompt with exactly one example to guide the model's output format or behavior." },
  { term: "In-Context Learning", category: "Prompt Engineering", definition: "The model's ability to learn a task from examples provided within the prompt itself, without any weight updates or training." },
  { term: "Prompt Injection", category: "Prompt Engineering", definition: "A malicious technique where hidden instructions embedded in content override the system prompt and hijack model behavior." },
  { term: "Jailbreaking", category: "Prompt Engineering", definition: "Attempts to bypass an AI's safety filters or guidelines through clever prompt manipulation to make it produce disallowed content." },
  { term: "Guardrails", category: "Prompt Engineering", definition: "Safety rules, filters, or constraints that restrict what an AI can say or do — either in the system prompt or hardcoded in the platform." },
  { term: "Structured Output", category: "Prompt Engineering", definition: "Instructing the AI to return data in a predictable format like JSON, XML, or a table for easier programmatic parsing." },
  { term: "Tree of Thought", category: "Prompt Engineering", definition: "A prompting strategy where the AI explores multiple reasoning branches in parallel before converging on the best answer." },
  { term: "ReAct", category: "Prompt Engineering", definition: "A prompting strategy combining Reasoning and Acting — the model reasons, takes an action (like a web search), observes the result, and loops." },
  { term: "Self-Consistency", category: "Prompt Engineering", definition: "Running the same prompt multiple times with higher temperature, then voting on the most common answer to improve reliability." },
  { term: "Retrieval-Augmented Generation (RAG)", category: "Prompt Engineering", definition: "Augmenting an LLM prompt with real-time retrieved documents or data so the model answers from current, specific sources rather than just training memory." },
  { term: "Grounding", category: "Prompt Engineering", definition: "Connecting AI outputs to real, verifiable facts or source documents to reduce hallucination and increase accuracy." },
  { term: "Decomposition", category: "Prompt Engineering", definition: "Breaking a complex task into smaller, manageable sub-tasks for the AI to handle sequentially or in parallel." },
  { term: "Negative Prompting", category: "Prompt Engineering", definition: "Explicitly telling the AI what NOT to do, include, or say in its response.", example: "'Do not use bullet points. Do not include caveats.'" },
  { term: "Prompt Template", category: "Prompt Engineering", definition: "A reusable prompt structure with named placeholders that get filled in with dynamic values at runtime." },
  { term: "Dynamic Prompt", category: "Prompt Engineering", definition: "A prompt constructed programmatically by combining templates with real data, user inputs, or retrieved context." },
  { term: "Multi-turn Conversation", category: "Prompt Engineering", definition: "A back-and-forth dialogue where each new message builds on prior context — the standard format for chat interfaces." },
  { term: "Conversation History", category: "Prompt Engineering", definition: "The previous messages in a session passed to the model as context — what lets the model 'remember' earlier in the conversation." },
  { term: "Memory (AI)", category: "Prompt Engineering", definition: "A system that persists information across separate sessions or conversations so the AI can recall past interactions." },
  { term: "Tool Use / Function Calling", category: "Prompt Engineering", definition: "Allowing an AI to call external functions, APIs, or tools mid-response to fetch data or take actions in the real world." },
  { term: "Constraint", category: "Prompt Engineering", definition: "An explicit limit placed on the AI's output.", example: "'Respond in exactly 3 bullet points' or 'Keep your answer under 100 words.'" },
  { term: "Persona", category: "Prompt Engineering", definition: "A specific character or identity assigned to the AI in a prompt, shaping its personality, style, and communication approach." },
  { term: "Delimiter", category: "Prompt Engineering", definition: "A symbol or string used to visually separate distinct parts of a prompt, helping the model parse structure.", example: "Using ### or ``` to separate sections." },
  { term: "Exemplar", category: "Prompt Engineering", definition: "A concrete example included in a prompt to show the model what good output looks like — the backbone of few-shot prompting." },
  { term: "Prompt Chaining", category: "Prompt Engineering", definition: "Feeding the output of one prompt as the input to the next, creating a pipeline where each step builds on the previous." },
  { term: "Meta-Prompt", category: "Prompt Engineering", definition: "A prompt that instructs the AI on how to generate, evaluate, or improve other prompts." },
  { term: "Output Format", category: "Prompt Engineering", definition: "Specifying how the AI should structure its response.", example: "'Return as JSON', 'Use numbered steps', 'Write in prose, not bullet points.'" },
  { term: "Calibration", category: "Prompt Engineering", definition: "Adjusting prompt wording, examples, or parameters iteratively until model responses are consistently accurate and well-formatted." },
  { term: "Instruction Following", category: "Prompt Engineering", definition: "The model's ability to understand and faithfully execute explicit instructions in the prompt — a key quality metric for LLMs." },
  { term: "Reformulation", category: "Prompt Engineering", definition: "Rewriting a prompt entirely when the first attempt fails, often changing framing, specificity, or role." },
  { term: "Context Stuffing", category: "Prompt Engineering", definition: "Including as much relevant background information as possible in the prompt to help the model make better, informed decisions." },
  { term: "Temperature", category: "Prompt Engineering", definition: "A parameter controlling output randomness. Low temperature (0–0.3) = deterministic and precise. High temperature (0.7–1.0) = creative and varied." },
  { term: "Seed Prompt", category: "Prompt Engineering", definition: "A foundational prompt that defines the core context or rules from which all other prompts in a session are derived." },
  { term: "Agentic Prompting", category: "Prompt Engineering", definition: "Designing prompts for autonomous AI agents that plan and execute multi-step tasks with minimal human intervention." },

  // AI & ML Fundamentals
  { term: "Large Language Model (LLM)", category: "AI & ML Fundamentals", definition: "A neural network trained on massive text datasets, capable of generating, summarizing, translating, and reasoning about language." },
  { term: "Foundation Model", category: "AI & ML Fundamentals", definition: "A large model trained broadly on general data that can be adapted (fine-tuned) for specific downstream tasks." },
  { term: "Training Data", category: "AI & ML Fundamentals", definition: "The dataset used to teach a model its knowledge and behavior during the pre-training phase." },
  { term: "Fine-tuning", category: "AI & ML Fundamentals", definition: "Further training a pre-trained model on domain-specific data to specialize its behavior for a particular task or style." },
  { term: "Parameters", category: "AI & ML Fundamentals", definition: "The numerical values inside a neural network that are learned during training. Model 'size' is often measured in parameters.", example: "GPT-4 has an estimated ~1.8 trillion parameters." },
  { term: "Weights", category: "AI & ML Fundamentals", definition: "The specific learned values of parameters that encode the model's knowledge and determine how it responds to inputs." },
  { term: "Inference", category: "AI & ML Fundamentals", definition: "Running a trained model to generate outputs — as opposed to training it. Every API call you make is an inference." },
  { term: "Embeddings", category: "AI & ML Fundamentals", definition: "Dense numerical vector representations of text that capture semantic meaning. Similar concepts have vectors that are mathematically close." },
  { term: "Vector Database", category: "AI & ML Fundamentals", definition: "A database optimized for storing and searching embedding vectors by similarity. Essential for RAG systems.", example: "Pinecone, Weaviate, Chroma." },
  { term: "Tokenization", category: "AI & ML Fundamentals", definition: "The process of splitting text into smaller units called tokens for the model to process. Roughly 1 token ≈ ¾ of a word in English." },
  { term: "Context Window", category: "AI & ML Fundamentals", definition: "The maximum amount of text (in tokens) a model can process in one request. Everything beyond this limit is invisible to the model." },
  { term: "Hallucination", category: "AI & ML Fundamentals", definition: "When an AI generates convincingly stated but factually incorrect, fabricated, or nonsensical information — often the #1 concern with LLMs." },
  { term: "Top-P Sampling", category: "AI & ML Fundamentals", definition: "A sampling strategy that only considers tokens within the top P% of probability mass (nucleus sampling), balancing creativity and coherence." },
  { term: "Neural Network", category: "AI & ML Fundamentals", definition: "A computational model inspired by the brain, consisting of interconnected layers of nodes that learn patterns from data." },
  { term: "Transformer Architecture", category: "AI & ML Fundamentals", definition: "The architecture underpinning all modern LLMs, introduced in the 2017 paper 'Attention Is All You Need'. Uses attention mechanisms." },
  { term: "Attention Mechanism", category: "AI & ML Fundamentals", definition: "A component that allows the model to dynamically focus on the most relevant parts of the input when generating each token." },
  { term: "RLHF", category: "AI & ML Fundamentals", definition: "Reinforcement Learning from Human Feedback — a training technique where human preferences are used to reward better model behavior, aligning it with human values." },
  { term: "Pre-training", category: "AI & ML Fundamentals", definition: "The initial large-scale training phase where a model learns language patterns from vast text corpora before any task-specific adaptation." },
  { term: "Zero-shot Learning", category: "AI & ML Fundamentals", definition: "A model's ability to perform tasks it was never explicitly trained on, using its broad pre-training knowledge." },
  { term: "Few-shot Learning", category: "AI & ML Fundamentals", definition: "A model's ability to learn a new task or pattern from just a handful of examples provided in the prompt." },
  { term: "Overfitting", category: "AI & ML Fundamentals", definition: "When a model memorizes training data so well it fails to generalize to new, unseen data — effectively memorizing instead of learning." },
  { term: "Underfitting", category: "AI & ML Fundamentals", definition: "When a model is too simple to capture the underlying patterns in the data, resulting in poor performance on both training and test sets." },
  { term: "Bias (in AI)", category: "AI & ML Fundamentals", definition: "Systematic errors in model outputs caused by skewed training data or design choices, often producing unfair or inaccurate results for certain groups." },
  { term: "Benchmark", category: "AI & ML Fundamentals", definition: "A standardized test or dataset used to evaluate and compare the performance of AI models on specific tasks.", example: "MMLU, HumanEval, GSM8K." },
  { term: "Perplexity", category: "AI & ML Fundamentals", definition: "A metric for language model quality measuring how 'surprised' the model is by a test dataset. Lower perplexity = better language modeling." },
  { term: "Latency", category: "AI & ML Fundamentals", definition: "The time from sending a request to receiving the first token of response. Critical for real-time user-facing applications." },
  { term: "Throughput", category: "AI & ML Fundamentals", definition: "The number of tokens or requests a model can process per unit of time. High throughput is critical for batch processing." },
  { term: "Model Collapse", category: "AI & ML Fundamentals", definition: "Degradation that occurs when AI models are trained on AI-generated data over successive generations, losing diversity and quality." },
  { term: "Knowledge Distillation", category: "AI & ML Fundamentals", definition: "Training a smaller, efficient model to mimic the behavior of a larger, more expensive model — compressing capability." },
  { term: "Transfer Learning", category: "AI & ML Fundamentals", definition: "Applying knowledge learned on one task or domain to a different but related task, rather than training from scratch." },
  { term: "Multimodal AI", category: "AI & ML Fundamentals", definition: "AI systems that process and generate multiple input types: text, images, audio, and video — beyond text-only models." },
  { term: "Agentic AI", category: "AI & ML Fundamentals", definition: "AI systems that can autonomously plan, reason, use tools, and take sequences of actions to accomplish complex goals." },
  { term: "Token", category: "AI & ML Fundamentals", definition: "The basic unit of text an LLM processes. Roughly ¾ of a word in English. Pricing and context limits are measured in tokens." },
  { term: "Softmax", category: "AI & ML Fundamentals", definition: "A mathematical function that converts a set of raw scores into a probability distribution summing to 1, used at the model's output layer." },
  { term: "Quantization", category: "AI & ML Fundamentals", definition: "Compressing a model by reducing numerical precision of weights (e.g., from 32-bit to 8-bit integers), enabling faster, cheaper inference." },

  // LLM Concepts
  { term: "API (for LLMs)", category: "LLM Concepts", definition: "The programmatic interface for sending prompts and receiving responses from a hosted language model." },
  { term: "Max Tokens", category: "LLM Concepts", definition: "The maximum number of tokens the model is allowed to generate in a single response. Increase it to allow longer outputs." },
  { term: "Stop Sequence", category: "LLM Concepts", definition: "A specific string that tells the model to stop generating the moment it appears in the output.", example: "Using '\\n\\n' as a stop sequence ends generation at a blank line." },
  { term: "Streaming", category: "LLM Concepts", definition: "Receiving model output token-by-token in real-time as it's generated, rather than waiting for the full response to complete." },
  { term: "Chat Completion", category: "LLM Concepts", definition: "The API format for multi-turn conversations, using an array of messages with 'system', 'user', and 'assistant' roles." },
  { term: "Model Card", category: "LLM Concepts", definition: "Documentation describing a model's training data, capabilities, limitations, intended uses, and known biases." },
  { term: "Prompt Caching", category: "LLM Concepts", definition: "Storing frequently repeated prompt prefixes server-side to reduce latency and cost on repeated API calls with the same context." },
  { term: "Context Length", category: "LLM Concepts", definition: "The total number of tokens (input + output) a model can handle in a single session. Exceeding this causes earlier content to drop off." },
  { term: "Greedy Decoding", category: "LLM Concepts", definition: "Always selecting the single most probable next token — deterministic but often produces repetitive or generic responses." },
  { term: "Beam Search", category: "LLM Concepts", definition: "Maintaining the top N most probable sequences during generation and returning the best one — higher quality but slower." },
  { term: "Logprobs", category: "LLM Concepts", definition: "The log probabilities of each generated token, useful for confidence scoring, ranking outputs, or detecting uncertainty." },
  { term: "Top-K Sampling", category: "LLM Concepts", definition: "Sampling only from the top K most probable next tokens, restricting randomness to a fixed vocabulary size." },
  { term: "Repetition Penalty", category: "LLM Concepts", definition: "A parameter that reduces the likelihood of the model generating text it has already produced, combating repetitive outputs." },
  { term: "Frequency Penalty", category: "LLM Concepts", definition: "Penalizes tokens proportionally to how often they've already appeared in the output — discourages overused words." },
  { term: "Presence Penalty", category: "LLM Concepts", definition: "A flat penalty applied to any token that has appeared at all in the output — encourages topic variety." },
  { term: "Seed (reproducibility)", category: "LLM Concepts", definition: "A fixed number passed to the model to make outputs reproducible across identical requests, enabling reliable testing." },
  { term: "Rate Limit", category: "LLM Concepts", definition: "A cap on the number of API requests or tokens allowed per time window, enforced by the provider to prevent abuse." },
  { term: "Cost Per Token", category: "LLM Concepts", definition: "The price charged for each token processed — typically separate rates for input tokens (cheaper) and output tokens (more expensive)." },
  { term: "Multimodal Input", category: "LLM Concepts", definition: "Providing images, audio, documents, or video alongside text in a prompt for models that support vision or audio." },
  { term: "Model Versioning", category: "LLM Concepts", definition: "Tracking different released versions of a model to ensure consistent behavior and plan for deprecation.", example: "gpt-4o vs gpt-4o-mini vs gpt-4-turbo." },

  // Product Strategy
  { term: "MVP", category: "Product Strategy", definition: "Minimum Viable Product — the simplest version of a product that delivers core value and can be shipped to real users to gather feedback." },
  { term: "Scalability", category: "Product Strategy", definition: "The ability of your product or system to handle growing users, traffic, or data without degrading in performance or reliability." },
  { term: "Technical Debt", category: "Product Strategy", definition: "Accumulated code or design shortcuts taken to move fast, which will require rewriting later at increasing cost." },
  { term: "Idempotency", category: "Product Strategy", definition: "A property where performing an operation multiple times produces the same result as doing it once.", example: "Submitting a payment twice should only charge the user once." },
  { term: "Graceful Degradation", category: "Product Strategy", definition: "When part of a system fails, it continues operating at reduced functionality rather than crashing completely.", example: "If video fails to load, fall back to audio-only." },
  { term: "Feature Flag", category: "Product Strategy", definition: "A code switch that enables or disables a feature without deploying new code, allowing safe rollouts and experiments." },
  { term: "A/B Testing", category: "Product Strategy", definition: "Testing two variants (A and B) with real users to determine which performs better on a target metric." },
  { term: "North Star Metric", category: "Product Strategy", definition: "The single metric that best captures the core long-term value your product delivers to users and predicts growth.", example: "Spotify: Monthly listening hours." },
  { term: "Product-Market Fit", category: "Product Strategy", definition: "When your product satisfies a strong, real market demand and users love it enough to drive organic growth." },
  { term: "MoSCoW Method", category: "Product Strategy", definition: "A prioritization framework: Must Have, Should Have, Could Have, Won't Have — used to scope releases and manage stakeholder expectations." },
  { term: "Scope Creep", category: "Product Strategy", definition: "Uncontrolled expansion of a project's requirements beyond the original plan, usually causing delays and budget overruns." },
  { term: "Iteration", category: "Product Strategy", definition: "A short, focused development cycle that produces an incremental improvement that can be tested and learned from." },
  { term: "Pivot", category: "Product Strategy", definition: "A fundamental strategic change in the product direction while retaining key learnings from the previous approach." },
  { term: "Backlog", category: "Product Strategy", definition: "A prioritized list of features, bugs, and tasks waiting to be worked on — the team's queue of future work." },
  { term: "User Story", category: "Product Strategy", definition: "A feature described from the user's perspective.", example: "'As a user, I want to filter tasks by priority so I can focus on what matters most.'" },
  { term: "Acceptance Criteria", category: "Product Strategy", definition: "The specific conditions a feature must satisfy to be considered complete and accepted by stakeholders." },
  { term: "Definition of Done", category: "Product Strategy", definition: "The team's shared, explicit understanding of what 'finished' means for any task or feature." },
  { term: "Dogfooding", category: "Product Strategy", definition: "Using your own product internally before releasing it — catching real issues before external users do." },
  { term: "Beta Testing", category: "Product Strategy", definition: "Releasing a product to a limited, real-world audience before the official launch to catch issues at scale." },
  { term: "Soft Launch", category: "Product Strategy", definition: "A quiet launch without a marketing push to test real-world performance and iron out issues before going wide." },
  { term: "Go-to-Market Strategy", category: "Product Strategy", definition: "The actionable plan for how you'll launch, reach, and acquire customers in your target market." },
  { term: "Moat", category: "Product Strategy", definition: "A sustainable competitive advantage that is difficult for competitors to replicate.", example: "Data network effects, switching costs, brand loyalty." },
  { term: "Network Effects", category: "Product Strategy", definition: "When a product becomes more valuable to each user as more people use it.", example: "WhatsApp, Airbnb, LinkedIn." },
  { term: "Virality", category: "Product Strategy", definition: "The organic tendency of users to share or invite others to a product, creating growth without paid acquisition." },
  { term: "Retention", category: "Product Strategy", definition: "The percentage of users who continue using your product over a given time period — the most honest signal of value delivered." },

  // Data & Logic
  { term: "CRUD", category: "Data & Logic", definition: "The four fundamental database operations: Create, Read, Update, Delete. Every data-driven app is built on these primitives." },
  { term: "Data Validation", category: "Data & Logic", definition: "Checking that user input meets required rules and formats before processing or saving it.", example: "Ensuring an email contains '@' before saving." },
  { term: "Sanitization", category: "Data & Logic", definition: "Cleaning user input to remove or neutralize malicious content, preventing injection attacks and broken layouts." },
  { term: "Fallbacks", category: "Data & Logic", definition: "Alternative behavior or default values used when the primary approach fails.", example: "Show a generic avatar if the user's profile picture fails to load." },
  { term: "Error Handling", category: "Data & Logic", definition: "Code that catches, interprets, and responds to errors gracefully so the app doesn't crash or expose raw error messages to users." },
  { term: "Race Condition", category: "Data & Logic", definition: "A bug where two concurrent operations depend on shared state and interfere unpredictably based on timing.", example: "Two users both clicking 'claim last seat' simultaneously." },
  { term: "Debouncing", category: "Data & Logic", definition: "Delaying execution of a function until a rapid series of events has paused for a set time.", example: "Only searching after the user stops typing for 300ms." },
  { term: "Throttling", category: "Data & Logic", definition: "Limiting how frequently a function can execute, regardless of how many times it's triggered.", example: "A resize handler that fires at most once per 100ms." },
  { term: "Caching", category: "Data & Logic", definition: "Storing computed results or API responses temporarily to avoid redundant processing and reduce latency on repeated requests." },
  { term: "Rate Limiting", category: "Data & Logic", definition: "Restricting the number of requests a user or service can make within a defined time window to prevent abuse." },
  { term: "Pagination", category: "Data & Logic", definition: "Splitting large datasets into discrete pages to avoid loading and rendering everything at once, reducing memory and latency." },
  { term: "Optimistic Update", category: "Data & Logic", definition: "Updating the UI immediately before server confirmation for a snappier feel, then reverting if the request fails." },
  { term: "Pessimistic Update", category: "Data & Logic", definition: "Waiting for server confirmation before updating the UI — safer but slower-feeling." },
  { term: "Eventual Consistency", category: "Data & Logic", definition: "A model where distributed systems may be temporarily inconsistent but will converge to the same state over time." },
  { term: "ACID", category: "Data & Logic", definition: "Database transaction properties: Atomicity (all or nothing), Consistency (valid state), Isolation (no interference), Durability (persisted on commit)." },
  { term: "Data Schema", category: "Data & Logic", definition: "The formal structure defining how data is organized — what fields exist, their types, and how they relate." },
  { term: "Normalization", category: "Data & Logic", definition: "Organizing database tables to reduce redundancy and ensure data integrity by splitting data across related tables." },
  { term: "Denormalization", category: "Data & Logic", definition: "Combining normalized data into fewer tables for faster read performance, accepting some data redundancy as a trade-off." },
  { term: "Indexing (database)", category: "Data & Logic", definition: "Creating lookup structures on database columns to dramatically speed up query performance at the cost of extra storage." },
  { term: "Idempotent Request", category: "Data & Logic", definition: "An API request that produces the same result whether made once or many times — important for retry logic.", example: "GET requests are naturally idempotent." },

  // API & Integration
  { term: "REST API", category: "API & Integration", definition: "An HTTP-based API design using standard verbs (GET, POST, PUT, DELETE) and stateless requests — the most common API style." },
  { term: "GraphQL", category: "API & Integration", definition: "A query language for APIs that lets clients specify exactly the data fields they need, avoiding over- or under-fetching." },
  { term: "Webhook", category: "API & Integration", definition: "An HTTP callback URL that receives a push notification when an event occurs — the server calls you, not the other way around." },
  { term: "Authentication", category: "API & Integration", definition: "Verifying who a user or service is — answering 'who are you?'", example: "Entering a password, using a fingerprint, API key." },
  { term: "Authorization", category: "API & Integration", definition: "Verifying what an authenticated user is allowed to do — answering 'what can you access?'" },
  { term: "API Key", category: "API & Integration", definition: "A secret string used to authenticate requests to an API, identifying the calling application or user." },
  { term: "OAuth", category: "API & Integration", definition: "An open standard for delegated access — lets users grant third-party apps limited access to their accounts without sharing passwords.", example: "'Sign in with Google' uses OAuth." },
  { term: "JWT", category: "API & Integration", definition: "JSON Web Token — a compact, self-contained, signed token for transmitting claims (like user ID and roles) between parties." },
  { term: "Endpoint", category: "API & Integration", definition: "A specific URL that handles a particular type of API request.", example: "POST /api/users creates a user. GET /api/users/123 fetches user 123." },
  { term: "Payload", category: "API & Integration", definition: "The data body sent in or received from an API request, typically formatted as JSON." },
  { term: "HTTP Status Code", category: "API & Integration", definition: "A numeric code indicating the outcome of an HTTP request.", example: "200=OK, 201=Created, 400=Bad Request, 401=Unauthorized, 404=Not Found, 500=Server Error." },
  { term: "SDK", category: "API & Integration", definition: "Software Development Kit — a library that wraps an API to make it easier to use in a specific programming language." },
  { term: "Async/Await", category: "API & Integration", definition: "JavaScript syntax for handling asynchronous operations sequentially without callback nesting, making async code read like sync code." },
  { term: "Sandbox Environment", category: "API & Integration", definition: "A safe, isolated environment for testing integrations without affecting real data or triggering real-world side effects." },
  { term: "API Versioning", category: "API & Integration", definition: "Maintaining multiple versions of an API to avoid breaking existing integrations when introducing changes.", example: "/api/v1/users, /api/v2/users." },

  // Software Development
  { term: "Version Control", category: "Software Development", definition: "A system that tracks changes to code over time, allowing teams to collaborate, review history, and revert mistakes. Git is the standard." },
  { term: "Branch", category: "Software Development", definition: "An isolated line of development in version control where you can make changes without affecting the main codebase." },
  { term: "Pull Request", category: "Software Development", definition: "A request to merge code changes into a main branch, typically triggering a code review and automated tests before merging." },
  { term: "Code Review", category: "Software Development", definition: "Systematic examination of code by peers before merging — catching bugs, improving quality, and sharing knowledge." },
  { term: "CI/CD", category: "Software Development", definition: "Continuous Integration / Continuous Delivery — automated pipelines that test, build, and deploy code changes safely and frequently." },
  { term: "Environment Variables", category: "Software Development", definition: "Configuration values stored outside code to keep secrets (API keys, DB passwords) and environment-specific settings separate from source." },
  { term: "Debugging", category: "Software Development", definition: "The systematic process of finding, analyzing, and fixing errors in code." },
  { term: "Logging", category: "Software Development", definition: "Recording timestamped events during execution for monitoring, debugging, auditing, and understanding production behavior." },
  { term: "Refactoring", category: "Software Development", definition: "Improving the internal structure and readability of code without changing its external behavior — paying down technical debt." },
  { term: "DRY", category: "Software Development", definition: "Don't Repeat Yourself — a principle to avoid duplicating logic. Every piece of knowledge should have a single, authoritative representation." },
  { term: "SOLID Principles", category: "Software Development", definition: "Five object-oriented design principles for maintainable software: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion." },
  { term: "Type Safety", category: "Software Development", definition: "Catching type errors at compile time rather than runtime, preventing entire categories of bugs.", example: "TypeScript over JavaScript." },
  { term: "Unit Testing", category: "Software Development", definition: "Testing individual functions or components in isolation to verify they produce correct outputs for given inputs." },
  { term: "Deployment", category: "Software Development", definition: "The process of releasing code changes from a development environment to a live, production environment." },
  { term: "Observability", category: "Software Development", definition: "The ability to understand a system's internal state from its external outputs — via logs, metrics, and distributed traces." },
  { term: "Integration Testing", category: "Software Development", definition: "Testing how multiple components work together, verifying correct interaction between services, APIs, and databases." },
  { term: "End-to-End Testing", category: "Software Development", definition: "Testing the full user flow from frontend to backend, simulating real user behavior to catch issues that unit tests miss." },
  { term: "Technical Specification", category: "Software Development", definition: "A document describing how a feature will be built — the system design, data model, APIs, and implementation decisions." },
  { term: "Monorepo", category: "Software Development", definition: "A single repository containing multiple projects or services, sharing dependencies and tooling.", example: "Google, Airbnb, and many startups use monorepos." },
  { term: "Microservices", category: "Software Development", definition: "An architecture where an application is split into small, independently deployable services that communicate over APIs." },

  // AI Safety & Ethics
  { term: "Alignment", category: "AI Safety & Ethics", definition: "The challenge of ensuring AI systems behave in accordance with human values, intentions, and goals — especially as they become more capable." },
  { term: "Safety Filter", category: "AI Safety & Ethics", definition: "A content layer that blocks harmful, illegal, or policy-violating outputs from being returned to users." },
  { term: "Content Moderation", category: "AI Safety & Ethics", definition: "Reviewing and filtering user-generated content for violations, often using a combination of AI models and human reviewers." },
  { term: "Bias Mitigation", category: "AI Safety & Ethics", definition: "Techniques applied during training or post-processing to reduce unfair or discriminatory patterns in AI outputs." },
  { term: "Transparency", category: "AI Safety & Ethics", definition: "Being open about how an AI system works, what data it was trained on, and how decisions are made." },
  { term: "Explainability", category: "AI Safety & Ethics", definition: "The ability to understand and articulate why an AI model made a specific decision or produced a specific output." },
  { term: "Red-teaming", category: "AI Safety & Ethics", definition: "Adversarially testing an AI system by trying to break it, find vulnerabilities, or elicit harmful outputs — before release." },
  { term: "Adversarial Attack", category: "AI Safety & Ethics", definition: "Carefully crafted inputs designed to fool or break an AI model, often causing misclassification or unexpected behavior." },
  { term: "Data Privacy", category: "AI Safety & Ethics", definition: "Protecting personal information from unauthorized access, collection, or misuse — fundamental to building trustworthy AI products." },
  { term: "PII", category: "AI Safety & Ethics", definition: "Personally Identifiable Information — data that can identify an individual: name, email, phone, IP address, location." },
  { term: "Model Governance", category: "AI Safety & Ethics", definition: "Policies and processes for responsible development, deployment, monitoring, and auditing of AI models throughout their lifecycle." },
  { term: "Responsible AI", category: "AI Safety & Ethics", definition: "A framework for building AI that is fair, transparent, safe, accountable, and beneficial — considering societal impact." },
  { term: "Constitutional AI", category: "AI Safety & Ethics", definition: "Anthropic's approach to training AI using a set of explicit principles the model must follow — guiding behavior via self-critique rather than RLHF alone." },
  { term: "GDPR", category: "AI Safety & Ethics", definition: "General Data Protection Regulation — EU law governing how personal data must be collected, stored, processed, and deleted." },
  { term: "Fairness (AI)", category: "AI Safety & Ethics", definition: "The property of AI systems treating people equitably without systematic discrimination based on protected characteristics." },

  // Business Strategy
  { term: "TAM / SAM / SOM", category: "Business Strategy", definition: "Market sizing framework: Total Addressable Market (everyone who could use it), Serviceable (who you can reach), Obtainable (who you'll realistically win)." },
  { term: "Churn Rate", category: "Business Strategy", definition: "The percentage of customers who stop using your product in a given period. High churn signals a product or value delivery problem." },
  { term: "LTV (Lifetime Value)", category: "Business Strategy", definition: "The total revenue you can expect from a single customer over their entire relationship with your business." },
  { term: "CAC", category: "Business Strategy", definition: "Customer Acquisition Cost — how much it costs in sales and marketing to acquire one new customer. Must be lower than LTV." },
  { term: "Conversion Rate", category: "Business Strategy", definition: "The percentage of visitors, leads, or trial users who take a desired action, like signing up or purchasing." },
  { term: "Funnel", category: "Business Strategy", definition: "The stages a prospect moves through from first awareness to becoming a paying customer — typically Awareness > Interest > Decision > Action." },
  { term: "Retention Rate", category: "Business Strategy", definition: "The percentage of users still active in your product after a defined period. The most honest measure of product value." },
  { term: "Monetization", category: "Business Strategy", definition: "The strategy for generating revenue from your product or user base — subscriptions, ads, usage-based, transactions, etc." },
  { term: "Freemium", category: "Business Strategy", definition: "A model offering a useful free tier with optional paid upgrades for premium features, betting on conversion from free users." },
  { term: "SaaS", category: "Business Strategy", definition: "Software as a Service — software delivered via the internet on a subscription basis, hosted by the provider." },
  { term: "ARR", category: "Business Strategy", definition: "Annual Recurring Revenue — the predictable yearly revenue from all active subscriptions, excluding one-time fees." },
  { term: "MRR", category: "Business Strategy", definition: "Monthly Recurring Revenue — the predictable monthly subscription revenue baseline. The primary health metric for SaaS." },
  { term: "Burn Rate", category: "Business Strategy", definition: "How quickly a startup spends its cash reserves each month. High burn without proportional growth is an existential risk." },
  { term: "Runway", category: "Business Strategy", definition: "How many months a company can continue operating at its current burn rate before running out of money." },
  { term: "Unit Economics", category: "Business Strategy", definition: "The revenue and costs associated with a single unit of business (one customer, one transaction) — determines whether the model scales profitably." },
];

const CATEGORIES: Category[] = [
  "UI/UX Design",
  "Prompt Engineering",
  "AI & ML Fundamentals",
  "LLM Concepts",
  "Product Strategy",
  "Data & Logic",
  "API & Integration",
  "Software Development",
  "AI Safety & Ethics",
  "Business Strategy",
];

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_TERMS.filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      if (!q) return matchesCategory;
      return matchesCategory && (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.example?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== "All") return null;
    const map: Partial<Record<Category, Term[]>> = {};
    for (const term of filtered) {
      if (!map[term.category]) map[term.category] = [];
      map[term.category]!.push(term);
    }
    return map;
  }, [filtered, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4 mb-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <h1 className="text-xl font-bold text-white">AI Prompting Dictionary</h1>
              <p className="text-xs text-gray-500 mt-0.5">{ALL_TERMS.length} terms across {CATEGORIES.length} categories</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, definitions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCategory === "All"
                  ? "bg-white/15 text-white border-white/20"
                  : "text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10"
              }`}
            >
              All ({ALL_TERMS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = ALL_TERMS.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeCategory === cat
                      ? `${CATEGORY_COLORS[cat]} font-semibold`
                      : "text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-lg">No terms match &ldquo;{search}&rdquo;</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : activeCategory !== "All" ? (
          <TermGrid terms={filtered} />
        ) : (
          <div className="space-y-12">
            {CATEGORIES.map((cat) => {
              const terms = grouped?.[cat];
              if (!terms || terms.length === 0) return null;
              return (
                <section key={cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">{cat}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-xs border ${CATEGORY_COLORS[cat]}`}>{terms.length}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <TermGrid terms={terms} />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TermGrid({ terms }: { terms: Term[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {terms.map((term) => (
        <TermCard key={term.term} term={term} />
      ))}
    </div>
  );
}

function TermCard({ term }: { term: Term }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-white text-sm leading-tight">{term.term}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${CATEGORY_COLORS[term.category]}`}>
          {term.category.split(" ")[0]}
        </span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{term.definition}</p>
      {term.example && (
        <p className="mt-2 text-gray-600 text-xs italic leading-relaxed border-t border-white/5 pt-2">
          {term.example}
        </p>
      )}
    </div>
  );
}
