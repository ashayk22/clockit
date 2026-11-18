import React, { useState } from 'react';
import { ArrowDownRight, ArrowRight, Check, Clock3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ClockItLogo } from '../components/brand/ClockItLogo';
import { FocusClockDisplay, type FocusClockMode } from '../components/focus/FocusClockDisplay';
import '../components/focus/focus-workspace.css';
import './public-home.css';

const faqItems = [
  {
    q: 'What is ClockIt?',
    a: 'ClockIt is a personal productivity workspace for focus sessions, tasks, habits, notes and a clearer view of your progress.',
  },
  {
    q: 'Can I customize my workspace?',
    a: 'Yes. You can choose a light or dark appearance, organize work in workspaces and adjust your focus session lengths.',
  },
  {
    q: 'Does ClockIt support focus sessions?',
    a: 'Yes. The Focus workspace includes configurable work and break sessions, an analog or digital clock display, and task selection.',
  },
  {
    q: 'Can I track habits?',
    a: 'You can create habits and mark them complete. Current analytics are based on the records ClockIt stores; daily historical completion tracking is still limited.',
  },
  {
    q: 'Can I save personal notes?',
    a: 'Yes. Notes support rich text, headings, lists, checklists, folders and local IndexedDB persistence.',
  },
  {
    q: 'Does ClockIt work on mobile?',
    a: 'The app includes responsive layouts for smaller screens with full touch-friendly navigation across all workspaces.',
  },
  {
    q: 'Is ClockIt free?',
    a: 'The app currently has no billing or checkout flow, so you can use the available workspace without a subscription.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [clockMode, setClockMode] = useState<FocusClockMode>('analog');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const startPath = isAuthenticated ? '/app' : '/signup';

  return (
    <div className="public-home">
      {/* Navigation */}
      <header className="public-home-nav">
        <button className="public-home-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="ClockIt home">
          <ClockItLogo size={35} />
          <span>ClockIt</span>
        </button>
        <nav className="public-home-links" aria-label="Main navigation">
          <a href="#features">Overview</a>
          <a href="#focus">Focus</a>
          <a href="#tasks">Tasks</a>
          <a href="#notes">Notes</a>
          <Link to="/case-studies">Case Studies</Link>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="public-home-nav-actions">
          {isAuthenticated ? (
            <button className="public-nav-account" type="button" onClick={() => navigate('/app')}>{user?.name || 'Open workspace'} <ArrowRight size={15} /></button>
          ) : (
            <>
              <button className="public-nav-login" type="button" onClick={() => navigate('/login')}>Log in</button>
              <button className="public-nav-cta" type="button" onClick={() => navigate('/signup')}>Get started <ArrowRight size={15} /></button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-eyebrow"><span /> A calmer way to organize your day</p>
            <h1>Make room for <em>what matters.</em></h1>
            <p className="public-hero-description">Your day, your ideas, your routines — all in one place. ClockIt brings focus, planning and personal organization into a workspace that moves at your pace.</p>
            <div className="public-hero-actions">
              <button type="button" className="public-button-primary" onClick={() => navigate(startPath)}>{isAuthenticated ? 'Open ClockIt' : 'Get started'} <ArrowRight size={17} /></button>
              <a className="public-button-text" href="#features">Explore ClockIt <ArrowDownRight size={16} /></a>
            </div>
            <div className="public-hero-note"><span className="public-note-dot" /> A personal workspace, shaped around the way you work.</div>
          </div>

          <div className="public-hero-art" aria-label="Interactive preview of the ClockIt focus clock">
            <div className="public-preview-topline"><span>FOCUS WORKSPACE</span><span>01 / 04</span></div>
            <div className="public-preview-clock-area">
              <div className="public-preview-ring"><FocusClockDisplay mode={clockMode} showSeconds progress={0.36} /></div>
              <div className="public-preview-copy">
                <span className="public-preview-label">A LITTLE SPACE TO THINK</span>
                <strong>Make room<br />for the work.</strong>
                <span className="public-preview-session"><i /> 25 minute focus session</span>
              </div>
            </div>
            <div className="public-preview-bottom">
              <div className="public-preview-mode-switch" role="group" aria-label="Preview clock mode">
                <button type="button" onClick={() => setClockMode('analog')} className={clockMode === 'analog' ? 'is-active' : ''} aria-pressed={clockMode === 'analog'}>Analog</button>
                <button type="button" onClick={() => setClockMode('digital')} className={clockMode === 'digital' ? 'is-active' : ''} aria-pressed={clockMode === 'digital'}>Digital</button>
              </div>
              <span className="public-preview-caption"><Clock3 size={15} /> Focus, at your pace</span>
            </div>
          </div>
          <a className="public-scroll-cue" href="#features" aria-label="Scroll to workspace features"><span /> Scroll to explore</a>
        </section>

        {/* 2. What you can do with ClockIt */}
        <section className="public-intro" id="features">
          <div className="public-section-index">01 <span>WHAT YOU CAN DO WITH CLOCKIT</span></div>
          <div className="public-intro-content">
            <h2>Everything has<br />a place to <em>begin.</em></h2>
            <p>ClockIt brings the small pieces of a productive day together. Start with what matters now, then make space for the rest.</p>
          </div>
          <div className="public-feature-list">
            <article className="public-feature-row">
              <span className="public-feature-number">01</span><div className="public-feature-mark focus-mark"><Clock3 size={24} /></div>
              <div><h3>Focus</h3><p>Set a session, choose a clock face and give one thing your attention.</p></div><span className="public-feature-detail">Analog + digital</span>
            </article>
            <article className="public-feature-row">
              <span className="public-feature-number">02</span><div className="public-feature-mark task-mark"><Check size={23} /></div>
              <div><h3>Tasks</h3><p>Keep today’s priorities close and see what is coming up next.</p></div><span className="public-feature-detail">Today + upcoming</span>
            </article>
            <article className="public-feature-row">
              <span className="public-feature-number">03</span><div className="public-feature-mark habit-mark">·</div>
              <div><h3>Habits</h3><p>Build a steady rhythm with simple habits and completion tracking.</p></div><span className="public-feature-detail">Small steps count</span>
            </article>
            <article className="public-feature-row">
              <span className="public-feature-number">04</span><div className="public-feature-mark notes-mark">✳</div>
              <div><h3>Notes</h3><p>Keep ideas, rich text, lists and checklists in your own notebook.</p></div><span className="public-feature-detail">Your notes, organized</span>
            </article>
          </div>
        </section>

        {/* 3. Focus showcase */}
        <section className="public-focus-showcase" id="focus">
          <div className="public-focus-copy">
            <div className="public-section-index">02 <span>FOCUS SHOWCASE</span></div>
            <h2>A softer start.<br /><em>A clearer hour.</em></h2>
            <p>Choose a familiar analog face or a clean digital readout. Set your session and break lengths, pick a task, and keep session notes nearby.</p>
            <button type="button" className="public-button-primary" onClick={() => navigate(startPath)}>Visit the Focus workspace <ArrowRight size={16} /></button>
          </div>
          <div className="public-focus-composition">
            <div className="public-focus-clock-card">
              <div className="public-card-label">CURRENT TIME <span>LOCAL</span></div>
              <FocusClockDisplay mode={clockMode} showSeconds progress={0.64} />
              <div className="public-focus-toggle" role="group" aria-label="Choose focus clock style">
                <button type="button" onClick={() => setClockMode('analog')} className={clockMode === 'analog' ? 'is-active' : ''}>Analog</button>
                <button type="button" onClick={() => setClockMode('digital')} className={clockMode === 'digital' ? 'is-active' : ''}>Digital</button>
              </div>
            </div>
            <div className="public-focus-session-card">
              <span className="public-card-label">FOCUS SESSION</span>
              <strong>25<span>:00</span></strong>
              <span className="public-session-caption">A sample session length</span>
              <div className="public-session-rule" />
              <div className="public-session-note"><span>SESSION NOTES</span><p>Capture a thought while it’s still here.</p><small>Notes can be formatted and organized in ClockIt.</small></div>
            </div>
            <span className="public-focus-annotation">A simple rhythm<br />for your attention.</span>
          </div>
        </section>

        {/* 4. Tasks and planning */}
        <section className="public-workspace-story" id="tasks">
          <div className="public-section-index">03 <span>TASKS AND PLANNING</span></div>
          <div className="public-story-heading">
            <h2>Plan your day with<br /><em>quiet clarity.</em></h2>
            <p>Keep today’s priorities in view, organize upcoming work, and schedule time blocks with seamless calendar synchronization.</p>
          </div>
          <div className="public-story-steps">
            <article>
              <span>01 / PRIORITIZE</span>
              <h3>Today's focus</h3>
              <p>A focused daily task list lets you tackle what matters today without getting buried in backlog clutter.</p>
            </article>
            <article>
              <span>02 / TIME BLOCK</span>
              <h3>Calendar alignment</h3>
              <p>Tasks with due dates connect directly to your calendar view, making time allocation natural and visual.</p>
            </article>
            <article>
              <span>03 / DETAILS</span>
              <h3>Deep context</h3>
              <p>Subtasks, priorities, and rich descriptions remain attached without cluttering the main list.</p>
            </article>
          </div>
        </section>

        {/* 5. Habit tracking */}
        <section className="public-workspace-story" id="habits" style={{ background: 'var(--home-paper)' }}>
          <div className="public-section-index">04 <span>HABIT TRACKING</span></div>
          <div className="public-story-heading">
            <h2>Small rhythms that<br /><em>build over time.</em></h2>
            <p>Consistency without pressure. Form steady daily routines, mark completions with a tap, and build momentum that lasts.</p>
          </div>
          <div className="public-story-steps">
            <article>
              <span>01 / ROUTINES</span>
              <h3>Daily cadence</h3>
              <p>Establish recurring habits for morning routines, deep work preparation, and evening wind-downs.</p>
            </article>
            <article>
              <span>02 / MOMENTUM</span>
              <h3>Gentle streaks</h3>
              <p>Track your weekly consistency and build sustained momentum without punitive streak mechanics.</p>
            </article>
            <article>
              <span>03 / INTEGRATED</span>
              <h3>Part of your day</h3>
              <p>Habits live alongside tasks and focus sessions in your unified daily workspace view.</p>
            </article>
          </div>
        </section>

        {/* 6. Notes and knowledge organization */}
        <section className="public-workspace-story" id="notes">
          <div className="public-section-index">05 <span>NOTES AND KNOWLEDGE</span></div>
          <div className="public-story-heading">
            <h2>Keep the ideas you<br /><em>don't want to lose.</em></h2>
            <p>Draft session notes, capture fleeting thoughts, and build a connected knowledge base with clean typography and bidirectional links.</p>
          </div>
          <div className="public-story-steps">
            <article>
              <span>01 / RICH TEXT</span>
              <h3>Distraction-free</h3>
              <p>Write with structured headings, task lists, code blocks, and formatting that never gets in your way.</p>
            </article>
            <article>
              <span>02 / STRUCTURE</span>
              <h3>Folders & tags</h3>
              <p>Organize by workspace, project, or topic so you can locate ideas the moment you need them.</p>
            </article>
            <article>
              <span>03 / CONNECTED</span>
              <h3>Backlink indexing</h3>
              <p>Link notes together with wiki-style references to discover connections across your work.</p>
            </article>
          </div>
        </section>

        {/* 7. Your personal workspace */}
        <section className="public-personalize" id="workspace">
          <div className="public-personalize-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="public-personalize-copy">
            <div className="public-section-index">06 <span>YOUR PERSONAL WORKSPACE</span></div>
            <h2>A workspace that<br /><em>feels like yours.</em></h2>
            <p>Choose light or dark appearance, shape workspaces around your projects, and set the focus and break lengths that suit your day.</p>
            <div className="public-personalize-tags">
              <span>Light + dark themes</span>
              <span>Workspace colors</span>
              <span>Session lengths</span>
              <span>Custom presets</span>
            </div>
          </div>
          <div className="public-theme-swatch" aria-label="ClockIt cream and forest green color palette">
            <div className="public-swatch-heading"><ClockItLogo size={30} /><span>YOUR CLOCKIT</span></div>
            <div className="public-swatch-colors"><i /><i /><i /><i /></div>
            <div className="public-swatch-footer"><span>Warm cream</span><span>Forest green</span></div>
          </div>
        </section>

        {/* 8. Case studies preview */}
        <section className="public-workspace-story" id="case-studies" style={{ background: '#f2eee2' }}>
          <div className="public-section-index">07 <span>PRODUCT JOURNAL</span></div>
          <div className="public-story-heading">
            <h2>Stories from the<br /><em>ClockIt journal.</em></h2>
            <p>An inside look at how ClockIt is built: deliberate design choices, local-first architecture, and focus-driven tooling.</p>
          </div>
          <div className="public-story-steps">
            <article>
              <span>STORY 01</span>
              <h3>The Focus Clock</h3>
              <p>Why we built custom analog and digital faces with ambient ticking and unhurried pacing.</p>
            </article>
            <article>
              <span>STORY 02</span>
              <h3>Local-First Reliability</h3>
              <p>How owner-scoped storage and resilient sync keep your personal workspace private and fast.</p>
            </article>
            <article>
              <span>STORY 03</span>
              <h3>Connected Thinking</h3>
              <p>Designing bidirectional note references that reveal connections without cognitive overhead.</p>
            </article>
          </div>
          <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/case-studies" className="public-button-primary" style={{ textDecoration: 'none' }}>
              Read the Case Studies <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="public-faq" id="faq">
          <div className="public-section-index">08 <span>FREQUENTLY ASKED QUESTIONS</span></div>
          <div className="public-faq-layout">
            <div>
              <h2>A few things<br /><em>you might wonder.</em></h2>
              <p>Clear answers about the workspace as it works today.</p>
            </div>
            <div className="public-faq-list">
              {faqItems.map((item, index) => (
                <article className={`public-faq-item${openFaq === index ? ' is-open' : ''}`} key={item.q}>
                  <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq((current) => current === index ? null : index)}>
                    <span>{item.q}</span>
                    <i>{openFaq === index ? '−' : '+'}</i>
                  </button>
                  {openFaq === index && <p>{item.a}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="public-final-cta">
          <div className="public-section-index">09 <span>A FRESH PAGE</span></div>
          <h2>Give your time<br />a little more <em>intention.</em></h2>
          <p>Start building a workspace that works the way you do.</p>
          <button type="button" className="public-button-primary" onClick={() => navigate(startPath)}>Start with ClockIt <ArrowRight size={17} /></button>
          <span className="public-final-rule" />
        </section>
      </main>

      {/* Footer */}
      <footer className="public-home-footer">
        <button className="public-home-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ClockItLogo size={30} />
          <span>ClockIt</span>
        </button>
        <span>Your time. Your space. Your pace.</span>
        <div>
          <a href="#features">Workspace</a>
          <Link to="/case-studies">Case Studies</Link>
          <a href="#faq">FAQ</a>
          <button type="button" onClick={() => navigate(isAuthenticated ? '/app' : '/login')}>{isAuthenticated ? 'Open app' : 'Log in'}</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
