import React from 'react';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { BookOpen, HelpCircle, Info, FileText } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';

export default function Help() {
  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 glow-text font-mono mb-2">
              HELP & INFORMATION
            </h1>
            <p className="text-green-400/70 font-mono text-sm">
              Documentation • FAQs • About the Platform
            </p>
          </div>

          <Tabs defaultValue="guide" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-950/80 border border-green-500/30">
              <TabsTrigger value="guide" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono">
                <BookOpen className="w-4 h-4 mr-2" />
                USER GUIDE
              </TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-mono">
                <FileText className="w-4 h-4 mr-2" />
                MANUAL
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-mono">
                <Info className="w-4 h-4 mr-2" />
                ABOUT
              </TabsTrigger>
            </TabsList>

            {/* User Guide */}
            <TabsContent value="guide" className="space-y-4">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-4">
                  GETTING STARTED
                </h2>
                <div className="space-y-6 text-slate-300 font-mono text-sm">
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">1. War Command (Dashboard)</h3>
                    <p className="mb-2">Your central hub for accessing all conflict intelligence modules. Provides an overview of system capabilities and quick links to major features.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">2. Strategy Hub</h3>
                    <p className="mb-2">AI-powered strategic analysis center featuring:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Strategic analysis generation based on current conflicts</li>
                      <li>Proactive threat alerts with early warning systems</li>
                      <li>Custom scenario builder for "what-if" analysis</li>
                      <li>Enhanced scenario simulator with sensitivity analysis</li>
                      <li>Collaboration tools for team-based planning</li>
                      <li>Scenario branching and version control</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">3. Real-time Data Hub</h3>
                    <p className="mb-2">Live intelligence aggregation with:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Threat intelligence feed from OSINT sources</li>
                      <li>Breaking news monitoring</li>
                      <li>Economic indicators tracking</li>
                      <li>Satellite intelligence</li>
                      <li>Social media sentiment analysis</li>
                      <li>Historical cross-reference analysis</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">4. Current Wars</h3>
                    <p className="mb-2">Monitor active conflicts with real-time updates, threat briefings, escalation predictions, and interactive mapping.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">5. Past Wars</h3>
                    <p className="mb-2">Access comprehensive historical conflict database with:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>100+ historical wars with detailed data</li>
                      <li>Comparative analysis tools</li>
                      <li>War debriefing with AI predictions vs. reality</li>
                      <li>Search by country, war name, or century</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">6. Future Wars</h3>
                    <p className="mb-2">AI-driven conflict prediction featuring:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Predictability analysis with probability forecasts</li>
                      <li>Inevitable war scenarios based on current trends</li>
                      <li>Galactic/far-future conflict projections</li>
                      <li>Climate-resource-conflict network analysis</li>
                      <li>Policy intervention simulator</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">7. Conflict Simulator</h3>
                    <p className="mb-2">Build and simulate custom geopolitical scenarios with AI-powered outcome analysis, counter-strategy generation, and scenario evolution tracking.</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Manual */}
            <TabsContent value="manual" className="space-y-4">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-4">
                  OPERATIONAL MANUAL
                </h2>
                <div className="space-y-6 text-slate-300 font-mono text-sm">
                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">AI ANALYSIS FEATURES</h3>
                    <div className="bg-slate-900/50 cyber-border rounded p-4 space-y-2">
                      <p><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">STRATEGIC ANALYSIS</Badge> - Click "GENERATE ANALYSIS" in Strategy Hub to create comprehensive strategic assessments</p>
                      <p><Badge className="bg-red-500/20 text-red-400 border-red-500/30">PROACTIVE ALERTS</Badge> - Generate early warning alerts for emerging flashpoints</p>
                      <p><Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">THREAT INTEL</Badge> - Subscribe to specific regions/threat types in Real-time Data Hub</p>
                      <p><Badge className="bg-green-500/20 text-green-400 border-green-500/30">THREAT SCAN</Badge> - Use Threat Assessment Engine for predictive trend analysis with root cause analysis and red team challenges</p>
                      <p><Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">WAR-GAMING</Badge> - Advanced simulation with scenario branching and branch comparison visualizations</p>
                      <p><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">EXTERNAL DATA</Badge> - Integrate RSS/API feeds with automated AI contextualization</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">NEW IN v3.0.1</h3>
                    <div className="bg-green-500/10 cyber-border rounded p-4 space-y-2">
                      <p><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">NARRATIVE GENERATOR</Badge> - AI creates realistic news reports, diplomatic cables, intel briefs from simulation data</p>
                      <p><Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">HISTORICAL WHAT-IF</Badge> - Alter historical events and simulate alternate timelines with butterfly effect analysis</p>
                      <p><Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">DATA INTEGRATION</Badge> - World Bank, UN, ACLED, SIPRI connectors with correlation analysis</p>
                      <p><Badge className="bg-green-500/20 text-green-400 border-green-500/30">POLICY ENGINE</Badge> - AI generates diplomatic/economic/military/humanitarian policy recommendations</p>
                      <p><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">NL ALERTS</Badge> - Create alert rules using plain English with AI parsing</p>
                      <p><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">COLLABORATION</Badge> - Multi-user war-gaming with comments, tasks, and activity tracking</p>
                      <p><Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">REGION DRAWER</Badge> - Draw custom map regions for targeted AI threat analysis</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">SCENARIO BUILDING</h3>
                    <p className="mb-2">Multiple creation methods available in Conflict Simulator:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Manual Builder:</strong> Create custom scenarios with specific parameters</li>
                      <li><strong>AI Generation:</strong> Auto-generate realistic war scenarios from brief prompts</li>
                      <li><strong>Fictional Wars:</strong> Create alternative history scenarios with unique narratives</li>
                      <li><strong>AI Opponents:</strong> Design adaptive adversaries with custom aggression/doctrine</li>
                      <li><strong>Collaborative Mode:</strong> Invite team members, assign roles, add comments and tasks</li>
                    </ul>
                    <p className="mt-3 mb-2">After creation:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Run simulation to generate outcomes and predictions</li>
                      <li>Review AI Strategy Advisor recommendations</li>
                      <li>Create what-if branches from any simulation round</li>
                      <li>Compare branches with visual charts and summary tables</li>
                      <li>Generate policy recommendations based on outcomes</li>
                      <li>Create narrative documents (news, briefs, cables)</li>
                      <li>Share and collaborate with team members</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">ADVANCED FEATURES</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Predictive Trends:</strong> AI projects threat levels 30/60/90 days ahead with inflection points</li>
                      <li><strong>Red Team Analysis:</strong> Challenge threat assessments with alternative interpretations and blind spot identification</li>
                      <li><strong>Scenario Modeling:</strong> Simulate best/worst/likely outcomes for counter-strategies with failure mode analysis</li>
                      <li><strong>Auto-Contextualization:</strong> External feeds automatically trigger AI analysis when new data arrives</li>
                      <li><strong>Cross-Platform Integration:</strong> World Bank, UN, ACLED, SIPRI data with correlation analysis</li>
                      <li><strong>Historical What-If:</strong> Alter past events and explore butterfly effects through alternate timelines</li>
                      <li><strong>Natural Language Alerts:</strong> Create complex alert rules using plain English</li>
                      <li><strong>Interactive Regions:</strong> Draw custom map areas for targeted threat analysis</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">SCENARIO BRANCHING</h3>
                    <p className="mb-2">Visual tree structure for parallel scenario exploration:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Click "FORK" to create a new branch with a "what-if" question</li>
                      <li>Navigate branches by clicking on them in the tree view</li>
                      <li>Select multiple branches and click "MERGE" to combine insights</li>
                      <li>Use "REVERT" button to return to any previous state</li>
                      <li>AI Strategy Advisor auto-suggests high-value branches to explore</li>
                      <li>Compare outcomes across branches with visualization charts</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">SETTINGS & CUSTOMIZATION</h3>
                    <p className="mb-2">Navigate to Settings to configure:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Audio:</strong> Background music (10% default), sound effects, volume controls</li>
                      <li><strong>Display:</strong> Choose from 5 background effects (changes apply instantly)</li>
                      <li><strong>Data Refresh:</strong> Configure intervals for wars, predictions, real-time feeds</li>
                      <li><strong>Developer (Admin only):</strong> Upload music, videos, and sound effect files</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">INTERACTIVE MAPS</h3>
                    <p className="mb-2">Dashboard features two map types:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Global Threat Matrix:</strong> Click markers to view active conflicts, threat zones, and strategic resources</li>
                      <li><strong>Threat Heatmap:</strong> Visual representation of predicted escalation zones updated in real-time</li>
                    </ul>
                    <p className="mt-2">Maps auto-refresh every 5 seconds with latest intelligence.</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-4">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono mb-4">
                  FREQUENTLY ASKED QUESTIONS
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      q: "How accurate are the AI predictions?",
                      a: "AI predictions integrate real-time internet data, historical patterns, and geopolitical modeling. They include confidence intervals and probability scores. Use as analytical tools for strategic planning, not definitive forecasts."
                    },
                    {
                      q: "What are fictional war scenarios?",
                      a: "The Fictional War Generator creates alternative history conflicts with unique narratives, believable factions, and strategic challenges. Perfect for exploring historical what-ifs and creative scenario analysis."
                    },
                    {
                      q: "How do AI opponents work?",
                      a: "AI opponents adapt their strategy dynamically based on your actions. Configure aggression, technology focus, diplomatic approach, and military doctrine. The AI generates realistic decision patterns and response protocols."
                    },
                    {
                      q: "What are scenario branches?",
                      a: "Branches let you explore parallel 'what-if' scenarios. Fork to test variations, merge branches to combine insights, or revert to previous states. AI Strategy Advisor auto-suggests valuable branches to explore."
                    },
                    {
                      q: "How does the AI Strategy Advisor work?",
                      a: "The advisor analyzes scenarios and provides: proactive measures, diplomatic approaches, counter-strategies, risk mitigation, predictive insights from similar past conflicts, counter-narrative strategies, and automated branch suggestions."
                    },
                    {
                      q: "What are threat heatmaps?",
                      a: "Interactive maps showing predicted escalation zones and flashpoints based on AI analysis. Color-coded by threat level (Critical/High/Elevated/Moderate). Click zones for detailed assessments. Updates dynamically with new data."
                    },
                    {
                      q: "Why aren't sound effects playing?",
                      a: "Sound effects require admin upload in Settings → Developer tab. Once uploaded, ensure sound effects are enabled in Settings → Audio tab with volume above 0%. Sound plays on button/menu clicks."
                    },
                    {
                      q: "How do I change background effects?",
                      a: "Go to Settings → Display, toggle Background Effects ON, then select from: Matrix Code, Binary (0/1), Equations, Stargate, or Forgotten Soldiers. Changes apply immediately without reload."
                    },
                    {
                      q: "What data sources are used?",
                      a: "Real-time aggregation from: verified news feeds, economic databases, satellite intelligence, historical archives, OSINT sources, and social media sentiment analysis. AI cross-references multiple sources for validation."
                    },
                    {
                      q: "Can I export scenarios?",
                      a: "Yes. Use share/collaboration features to export scenarios. Copy analysis text, save branch trees, and download visualization charts for external reporting."
                    },
                    {
                      q: "What is the Threat Assessment Engine?",
                      a: "Advanced AI module that scans global threats with: predictive trend analysis (30/60/90 day projections), root cause analysis (geopolitical/economic/social factors), counter-strategy modeling with success probabilities, and red team assessments that challenge primary evaluations."
                    },
                    {
                      q: "How does branch comparison work in War-Gaming?",
                      a: "Create what-if branches from any simulation round. The comparison view shows: visual branch tree with divergence points, casualty comparison charts, outcome probability distributions, and round-by-round progression analysis. Select multiple branches to compare metrics side-by-side."
                    },
                    {
                      q: "What is auto-contextualization for external feeds?",
                      a: "Enable auto-contextualize when adding RSS/API feeds. When new data is fetched, AI automatically analyzes it for threat correlations, emerging patterns, and actionable intelligence without manual intervention. Results appear in the Analysis tab."
                    },
                    {
                      q: "How do I use the Historical What-If Analysis?",
                      a: "In Past Wars, select a conflict, then use the What-If analyzer. Choose divergence type (battle, diplomatic, leadership, etc.), specify the change, and AI generates alternate timeline with immediate consequences, long-term effects, butterfly impacts, and how the modern world would differ."
                    },
                    {
                      q: "What data sources does Cross-Platform Integration support?",
                      a: "World Bank (GDP, trade, economic indicators), UN Data (refugees, humanitarian, development), ACLED (conflict events), GDELT (global events database), SIPRI (military expenditure, arms transfers). AI performs correlation analysis to identify leading indicators."
                    },
                    {
                      q: "How does the Natural Language Alert Builder work?",
                      a: "Type alerts in plain English like 'Alert me if threat level in Middle East exceeds 80% AND AI confidence is below 60%'. AI parses it into structured conditions, operators, and thresholds. Review parsed rule before saving."
                    },
                    {
                      q: "Can I collaborate with others on scenarios?",
                      a: "Yes. Use Collaborative War-Gaming to: invite team members via email, assign roles (owner/editor/viewer), add comments and discussions, create and assign tasks, track all activity in timeline. Data syncs via localStorage."
                    },
                    {
                      q: "What is the Interactive Region Drawer?",
                      a: "Draw custom polygon regions directly on world map by clicking points. Once saved, AI analyzes the region for: threat assessment, historical conflicts, economic factors, flashpoints, and monitoring priorities based on geographic coordinates."
                    },
                    {
                      q: "What narratives can the Dynamic Generator create?",
                      a: "AI generates: breaking news reports, diplomatic cables (with classification), intelligence briefs, military SITREPs, and press releases. Based on your simulation data or custom context. Includes realistic formatting, sources, and metadata."
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                      <h3 className="text-md font-bold text-cyan-400 font-mono mb-2">{faq.q}</h3>
                      <p className="text-slate-300 font-mono text-sm whitespace-pre-line">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* About */}
            <TabsContent value="about" className="space-y-4">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-yellow-400 glow-text font-mono mb-4">
                  ABOUT WAR MATRIX
                </h2>
                <div className="space-y-6 text-slate-300 font-mono text-sm">
                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">MISSION</h3>
                    <p>War Matrix is an advanced geopolitical intelligence platform providing comprehensive conflict analysis, prediction, and strategic simulation. Integrating AI analytics with real-time data, interactive threat mapping, and adaptive scenario generation across all timelines—historical, current, near-future, and speculative galactic eras.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">CAPABILITIES</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Real-Time Intelligence:</strong> Interactive maps with threat heatmaps and dynamic conflict tracking</li>
                      <li><strong>AI Analysis:</strong> Predictive insights, counter-narratives, red team assessments, and automated branch suggestions</li>
                      <li><strong>Historical Database:</strong> 100+ conflicts with pattern recognition, comparative tools, and what-if analysis</li>
                      <li><strong>Advanced Simulation:</strong> AI opponents, fictional scenarios, visual branching trees with comparison views</li>
                      <li><strong>Strategy Advisor:</strong> Tailored recommendations with diplomatic, military, and information warfare strategies</li>
                      <li><strong>Multi-Domain Integration:</strong> Climate, resources, economics, technology, social factors, and external data platforms</li>
                      <li><strong>Narrative Generation:</strong> AI-created news reports, diplomatic cables, intelligence briefs from simulation data</li>
                      <li><strong>Policy Recommendations:</strong> Comprehensive diplomatic/economic/military/humanitarian strategies with success modeling</li>
                      <li><strong>Collaboration Tools:</strong> Multi-user scenario planning with comments, tasks, and activity tracking</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">TECHNOLOGY</h3>
                    <p className="mb-2">Cutting-edge technology stack:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Advanced Language Models with internet data integration</li>
                      <li>Real-time threat processing and heatmap generation</li>
                      <li>Interactive geospatial visualization with Leaflet</li>
                      <li>Dynamic scenario branching with merge/revert capabilities</li>
                      <li>Customizable visual effects and immersive audio system</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">USE CASES</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 cyber-border rounded p-3">
                        <h4 className="font-bold text-green-400 mb-1">Strategic Planning</h4>
                        <p className="text-xs">Threat assessment, policy simulation, counter-strategy development</p>
                      </div>
                      <div className="bg-slate-900/50 cyber-border rounded p-3">
                        <h4 className="font-bold text-green-400 mb-1">Intelligence Analysis</h4>
                        <p className="text-xs">Multi-source fusion, predictive modeling, early warning systems</p>
                      </div>
                      <div className="bg-slate-900/50 cyber-border rounded p-3">
                        <h4 className="font-bold text-green-400 mb-1">Education & Research</h4>
                        <p className="text-xs">Alternative history, scenario exploration, comparative analysis</p>
                      </div>
                      <div className="bg-slate-900/50 cyber-border rounded p-3">
                        <h4 className="font-bold text-green-400 mb-1">Crisis Response</h4>
                        <p className="text-xs">Real-time monitoring, adaptive planning, information warfare</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">CREDITS</h3>
                    <div className="bg-slate-900/50 cyber-border rounded p-4 space-y-3">
                      <div>
                        <p className="text-purple-400 font-bold mb-1">Background Music</p>
                        <p className="text-slate-300 text-sm">"Veil of Echoes" by <span className="text-cyan-400">Steve Hardy (spacevortex)</span></p>
                        <p className="text-slate-400 text-xs">Album: Echo • Released: 2025</p>
                      </div>
                      <div>
                        <p className="text-purple-400 font-bold mb-1">Sound Effects</p>
                        <p className="text-slate-300 text-sm">
                          <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Pixabay</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">VERSION</h3>
                    <div className="bg-slate-900/50 cyber-border rounded p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Version</div>
                          <div className="text-green-400 font-bold">3.0.1</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Release</div>
                          <div className="text-green-400 font-bold">2025-12-01</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Status</div>
                          <div className="text-green-400 font-bold">OPERATIONAL</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">AI Model</div>
                          <div className="text-green-400 font-bold">GPT-4o Enhanced</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">v3.0.1 CHANGELOG</h3>
                    <div className="bg-slate-900/50 cyber-border rounded p-4 space-y-2">
                      <p className="text-green-400 font-bold">New Features:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                        <li>Dynamic Narrative Generator for AI-created news/briefs/cables</li>
                        <li>Historical What-If Analysis with alternate timeline exploration</li>
                        <li>Cross-Platform Data Integration (World Bank, UN, ACLED, SIPRI)</li>
                        <li>AI Policy Recommendation Engine with success modeling</li>
                        <li>Natural Language Alert Builder with AI parsing</li>
                        <li>Collaborative War-Gaming with multi-user support</li>
                        <li>Interactive Region Drawer for custom map-based analysis</li>
                      </ul>
                      <p className="text-cyan-400 font-bold mt-3">Enhanced Features:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                        <li>Threat Engine: Predictive trends, red team assessments, confidence scoring</li>
                        <li>War-Gaming: Branch comparison view with visual charts and metrics</li>
                        <li>External Feeds: Auto-contextualization for new data</li>
                        <li>Scanline effects applied globally across all pages</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-2">CONTACT & SUPPORT</h3>
                    <p className="mb-3">Follow us for updates, support, and community discussions:</p>
                    <div className="bg-slate-900/50 cyber-border rounded p-4">
                      <a 
                        href="https://www.facebook.com/profile.php?id=61584163020693" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-green-400 hover:text-green-300 font-bold text-lg"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        War Matrix Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}