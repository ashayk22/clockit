import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Compass, LayoutDashboard, Notebook, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ClockItLogo } from '../components/brand/ClockItLogo';
import '../styles/casestudies.css';

interface Story {
  id: string;
  number: string;
  title: string;
  tag: string;
  icon: React.ReactNode;
  summary: string;
  problem: string;
  design: string;
  implementation: string;
  result: string;
}

const stories: Story[] = [
  {
    id: 'focus-workspace',
    number: '01',
    title: 'Distraction-Free Focus Workspace',
    tag: 'Focus & Attention',
    icon: <Clock3 size={18} />,
    summary: 'Designing an intentional analog and digital timer environment that encourages deep, single-task work without stressful gamification.',
    problem: 'Standard productivity timers are either clinical countdown digits that provoke deadline anxiety or hyper-gamified tools with distracting popups, sounds, and badges that defeat the state of deep flow.',
    design: 'We created dual clock interfaces — a geometric analog dial and a clean digital face — paired with customizable work and break durations, gentle acoustic ticking options, and an integrated session notes panel alongside the clock.',
    implementation: 'Built with scalable SVG vector arcs in FocusClockDisplay.tsx, precise interval counters in useFocusSession.ts, and a responsive flex layout in focus-workspace.css that seamlessly transitions between desktop side-by-side editing and mobile stacked views.',
    result: 'A calm, grounded timer environment where users can sustain focus for 25 to 50 minute blocks while capturing thoughts directly into personal notes without breaking flow.',
  },
  {
    id: 'unified-dashboard',
    number: '02',
    title: 'Unified Productivity Dashboard',
    tag: 'Daily Organization',
    icon: <LayoutDashboard size={18} />,
    summary: 'Consolidating daily priorities, upcoming calendar blocks, and routine tracking into a single morning command center.',
    problem: 'Switching between isolated applications for task management, calendar scheduling, and daily progress creates cognitive fragmentation and morning planning inertia.',
    design: 'We architected the Today dashboard (/app) as a quiet command center that gathers today\'s high-priority tasks, scheduled calendar commitments, active habit trackers, and quick focus shortcuts into one view.',
    implementation: 'Orchestrated via DashboardLayout.tsx with shared outlet contexts and responsive widgets. Task state and calendar events communicate through shared repositories, keeping schedule adjustments synchronized in real time.',
    result: 'Users open their workspace to an immediate, calm overview of their day with zero setup friction or cross-app synchronizing headaches.',
  },
  {
    id: 'notes-experience',
    number: '03',
    title: 'Interconnected Notes Experience',
    tag: 'Knowledge Organization',
    icon: <Notebook size={18} />,
    summary: 'Building a rich-text notebook with bidirectional backlink indexing, folder hierarchies, and resilient local persistence.',
    problem: 'Linear note-taking tools either trap ideas in rigid silos or impose complex database schemas that make quick reference retrieval cumbersome.',
    design: 'We built a distraction-free rich text editor supporting headings, checklists, code blocks, folders, and bidirectional backlinks that surface incoming and outgoing note relationships automatically.',
    implementation: 'Integrated TipTap headless editor extensions in NotesEditor.tsx, backed by an inverted link indexing engine in notesRepository.ts and indexed persistence in notesStorage.ts that runs entirely client-side.',
    result: 'Fast, search-friendly notes that form an organic knowledge web, allowing users to move fluidly between project documentation and daily session reflections.',
  },
  {
    id: 'habit-tracking',
    number: '04',
    title: 'Personal Habit Tracking',
    tag: 'Rhythm & Cadence',
    icon: <Compass size={18} />,
    summary: 'Rethinking daily routines with sustainable momentum tracking rather than punitive streak resets.',
    problem: 'Conventional habit trackers emphasize unbroken streaks, turning an occasional missed day into a disheartening failure that prompts users to abandon their habits altogether.',
    design: 'ClockIt reframes habit building around gentle daily cadence and weekly frequency targets, encouraging positive routines without harsh punitive mechanics.',
    implementation: 'Engineered in habitRepository.ts with optimistic UI toggles, local persistence, and customizable frequency configurations that integrate with daily dashboard summaries.',
    result: 'A compassionate ritual system that supports sustainable personal habits and long-term consistency.',
  },
  {
    id: 'cross-device-architecture',
    number: '05',
    title: 'Cross-Device Usability & Owner Isolation',
    tag: 'Architecture & Privacy',
    icon: <ShieldCheck size={18} />,
    summary: 'Delivering zero-overflow responsive ergonomics from 320px to 1440px while guaranteeing strict owner-scoped data isolation.',
    problem: 'Web apps frequently break down on smaller mobile viewports or risk data cross-contamination when multiple users or test accounts access the same browser.',
    design: 'We established strict owner-scoped storage partitions (Hotfix 03) across all repositories and implemented audited responsive layouts with accessible 44px touch targets across all device sizes.',
    implementation: 'Scoped all IndexedDB keys and cloud sync queues to active user IDs in storage.ts and syncEngine.ts. Styled responsive transitions via clockit-theme.css with dedicated mobile bottom navigation.',
    result: 'Uncompromised data privacy and a responsive user experience that operates identically whether on a mobile phone, tablet, or high-resolution desktop monitor.',
  },
];

export const CaseStudiesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const ctaPath = isAuthenticated ? '/app' : '/signup';

  return (
    <div className="case-studies-page">
      {/* Navigation */}
      <header className="case-studies-nav">
        <Link to="/" className="case-studies-brand" aria-label="ClockIt Home">
          <ClockItLogo size={32} />
          <span>ClockIt</span>
        </Link>
        <div className="case-studies-nav-links">
          <Link to="/" className="case-studies-back-link">
            <ArrowLeft size={16} /> Back to ClockIt
          </Link>
          <Link to={ctaPath} className="case-studies-nav-cta">
            {isAuthenticated ? 'Open App' : 'Get Started'} <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="case-studies-hero">
        <div className="case-studies-eyebrow">
          <span /> ClockIt Product Journal <span />
        </div>
        <h1>Case Studies</h1>
        <p className="case-studies-subtitle">
          An inside look at our architectural choices, product design decisions, and engineering principles behind ClockIt’s calm personal productivity workspace.
        </p>
      </section>

      {/* Main Content: 5 Product Stories */}
      <main className="case-studies-container">
        {stories.map((story) => (
          <article className="case-study-card" key={story.id} id={story.id}>
            <header className="case-study-header">
              <div className="case-study-meta">
                <span>Story {story.number}</span>
                <span className="case-study-tag">{story.tag}</span>
              </div>
              <h2>{story.title}</h2>
              <p className="case-study-summary">{story.summary}</p>
            </header>

            <div className="case-study-grid">
              <div className="case-study-section">
                <h3>The Problem</h3>
                <p>{story.problem}</p>
              </div>
              <div className="case-study-section">
                <h3>The Design Decision</h3>
                <p>{story.design}</p>
              </div>
              <div className="case-study-section">
                <h3>The Implementation</h3>
                <p>{story.implementation}</p>
              </div>
              <div className="case-study-section">
                <h3>The Result</h3>
                <p>{story.result}</p>
              </div>
            </div>

            <div className="case-study-highlight">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>Grounded in ClockIt production code and tested across all supported viewports.</span>
            </div>
          </article>
        ))}

        {/* CTA Banner */}
        <section className="case-studies-cta-banner">
          <h2>Experience the difference.</h2>
          <p>
            Try ClockIt’s calm, focused workspace today — designed from the ground up for personal organization and mindful productivity.
          </p>
          <div className="case-studies-cta-actions">
            <Link to={ctaPath} className="case-studies-primary-btn">
              {isAuthenticated ? 'Open Workspace' : 'Get Started Free'} <ArrowRight size={16} />
            </Link>
            <Link to="/" className="case-studies-secondary-btn">
              Explore Homepage
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="case-studies-footer">
        <div>
          <span>ClockIt Product Journal · Built for personal productivity and mindful focus.</span>
        </div>
        <div className="case-studies-footer-links">
          <Link to="/">Home</Link>
          <Link to="/app">Workspace</Link>
          <Link to="/login">Sign In</Link>
        </div>
      </footer>
    </div>
  );
};

export default CaseStudiesPage;
