import { Sun, Moon, Radio, Workflow, Users, BarChart3, Activity } from 'lucide-react';

export default function PlaybookPage() {
  return (
    <main className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
      <header className="mb-10 shrink-0 border-b border-surface-mist pb-6">
        <h1 className="text-2xl font-semibold text-content-ink">The Playbook</h1>
        <p className="text-content-slate mt-2 text-sm leading-relaxed max-w-2xl">
          Welcome to the Signal by DreamStorm methodology. This is your guide to sending emails that actually convert. 
          No marketing jargon—just clear strategies to turn leads into clients.
        </p>
      </header>

      {/* Core Strategy Section */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-content-ink mb-4">1. The Core Strategy</h2>
        <p className="text-sm text-content-slate mb-6 max-w-3xl">
          The best marketers don't ask for the sale in every email. They use the <strong>Light vs. Shade</strong> method. 
          Send 3 "Light" emails for every 1 "Shade" email to build trust before you pitch.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Email Card */}
          <div className="bg-surface-paper border border-surface-mist rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <Sun className="text-amber-600" size={20} />
            </div>
            <h3 className="text-base font-semibold text-content-ink mb-2">Light Emails (Value)</h3>
            <p className="text-sm text-content-slate mb-4">
              Emails that give, teach, and share stories. They build trust and authority so the customer actually likes you.
            </p>
            <ul className="text-sm text-content-slate space-y-2 list-disc list-inside ml-4">
              <li>Focus on education and problem-solving</li>
              <li>Feels like a personal email from a friend</li>
              <li>Soft ask: <i>"Reply to this email if you have questions."</i></li>
            </ul>
          </div>

          {/* Shade Email Card */}
          <div className="bg-surface-paper border border-surface-mist rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Moon className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-base font-semibold text-content-ink mb-2">Shade Emails (Offer)</h3>
            <p className="text-sm text-content-slate mb-4">
              Emails that sell. They are punchy, create urgency, and have a clear, highly visible button to buy or book.
            </p>
            <ul className="text-sm text-content-slate space-y-2 list-disc list-inside ml-4">
              <li>Direct, hard-hitting pitch</li>
              <li>Uses urgency and scarcity</li>
              <li>Hard ask: <i>"Click here to claim your 20% off."</i></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Platform Glossary Section */}
      <section>
        <h2 className="text-lg font-semibold text-content-ink mb-6">2. Platform Glossary</h2>
        
        <div className="space-y-4">
          <GlossaryItem 
            icon={<Radio size={20} className="text-brand-storm" />}
            title="Broadcasts"
            description="A one-off message you send to a group of people right now (or scheduled for a specific date). Use this to make an announcement, run a flash sale, or send a monthly update."
          />
          <GlossaryItem 
            icon={<Workflow size={20} className="text-brand-storm" />}
            title="Flows"
            description="Your 24/7 sales team. Sequences running on autopilot behind the scenes. Set up a welcome sequence once, and every new lead will automatically get nurtured."
          />
          <GlossaryItem 
            icon={<Users size={20} className="text-brand-storm" />}
            title="Audience, Tags & Segments"
            description="Your most valuable asset. Use Tags (like sticky notes) to remember who people are. Use Segments to slice your big list into smaller, highly targeted groups."
          />
          <GlossaryItem 
            icon={<BarChart3 size={20} className="text-brand-storm" />}
            title="Readout"
            description="The scoreboard. It tells you exactly who interacted with your email. High open rates mean your subject line worked. High click rates mean your offer was good."
          />
          <GlossaryItem 
            icon={<Activity size={20} className="text-green-600" />}
            title="Signal Health"
            description="A grade on how much Google and Apple trust you. Keep your bounce rate low and your domain authenticated so your emails land in the Primary inbox, not Spam."
          />
        </div>
      </section>
      
      <div className="mt-12 pb-12">
        <div className="bg-brand-storm rounded-xl p-8 text-center text-white shadow-md">
          <h3 className="text-xl font-semibold mb-2">Ready to send your first signal?</h3>
          <p className="text-brand-glow mb-6 text-sm max-w-md mx-auto">
            Head over to Blueprints, choose a framework, and let the AI Copilot help you draft a high-converting message.
          </p>
          <a href="/blueprints/new" className="inline-block bg-white text-brand-storm px-6 py-3 rounded-lg font-medium text-sm hover:bg-surface-cloud transition-colors">
            Create a Broadcast
          </a>
        </div>
      </div>
    </main>
  );
}

// Helper Component for the Glossary List
function GlossaryItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-surface-paper border border-surface-mist p-5 rounded-lg flex items-start shadow-sm">
      <div className="p-2 bg-surface-cloud rounded-md mr-4 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-content-ink mb-1">{title}</h4>
        <p className="text-sm text-content-slate leading-relaxed">{description}</p>
      </div>
    </div>
  );
}