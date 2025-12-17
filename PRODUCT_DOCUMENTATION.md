# Resume Forge - SaaS Product Documentation

> A market-ready Resume Intelligence SaaS platform helping users get better job matches through intelligent resume analysis and improvement.

---

## 📊 Feature Map

### TIER 1: CORE INTELLIGENCE FEATURES

#### 1️⃣ **Resume Analysis Against Job Descriptions**
- **User Value**: Understand exactly how well your resume matches a specific role
- **Data Sources**: Resume text + JD text → Gemini AI analysis
- **UI Location**: `/analyze` page → AnalysisResults component
- **Outputs**: 
  - Match score (0-100)
  - Strengths detected
  - Weaknesses identified
  - Missing skills
  - Actionable recommendations

#### 2️⃣ **Resume Versioning System** ⭐ CRITICAL
- **User Value**: Track improvements over time, compare changes, restore previous versions
- **Data Sources**: Resume → ResumeVersion model (links to MatchAnalysis)
- **UI Location**: `/versions?resumeId=X` page with timeline view
- **Features**:
  - Version number + timestamp
  - Source type (upload, AI-generated, manual edit)
  - Score at creation
  - Restore to previous version
  - Compare two versions side-by-side
  - Delete versions (except last)
- **Data Model**: `ResumeVersion` table with `versionNumber`, `sourceType`, `scoreAtCreation`, `scoreImprovement`

#### 3️⃣ **Before/After Resume Diff Viewer**
- **User Value**: See exactly what changed between versions with keyword highlighting
- **Data Sources**: Two ResumeVersion records
- **UI Location**: ResumeDiffViewer component in `/versions` page
- **Outputs**:
  - Side-by-side text comparison
  - Keywords added (green highlight)
  - Keywords removed (red strikethrough)
  - Score delta (+X%)
  - Statistics (total words added/removed)

#### 4️⃣ **Job Description Library**
- **User Value**: Save JDs, re-analyze against same resume, eliminate paste fatigue
- **Data Sources**: User-created JobDescription records + key skills extraction
- **UI Location**: `/job-descriptions` page + CRUD operations
- **Features**:
  - Save JD with title, company, tags
  - Auto-extract key skills using Gemini
  - Filter by tags
  - Search by title/company
  - Delete JDs
  - Quick analyze buttons
- **Data Model**: `JobDescription` table with `tags[]`, `keySkills[]`

---

### TIER 2: TRACKING & ANALYTICS

#### 5️⃣ **Score History & Progress Tracking**
- **User Value**: Visualize improvement journey, identify trends
- **Data Sources**: MatchAnalysis records grouped by resume/date
- **UI Location**: `/progress` page + dashboard Progress card
- **Metrics**:
  - Best score achieved
  - Lowest score
  - Average score
  - Total analyses count
  - Improvement delta (current - first)
  - Score timeline chart
- **Data Model**: Queries on existing MatchAnalysis + UsageMetrics

#### 6️⃣ **Usage & Plan Limits Tracking**
- **User Value**: Know when hitting limits, understand plan value
- **Data Sources**: UserPlan + UsageMetrics models
- **UI Location**: 
  - Dashboard: PlanUsageCard component
  - Settings: Plan management page
  - Analysis flows: Hard/soft paywalls
- **Metrics**:
  - Analyses used / limit (monthly)
  - AI generations used / limit (monthly)
  - JDs saved / limit
  - Current plan type (free/pro/enterprise)
  - Export modes available
- **Data Model**: `UserPlan`, `UsageMetrics` with `month` field for monthly reset

---

### TIER 3: QUALITY & INTELLIGENCE

#### 7️⃣ **Resume Completeness Score**
- **User Value**: Understand if resume is "complete enough" for analysis
- **Data Sources**: Resume text → Gemini completeness check
- **UI Location**: AnalysisResults section 1 (subscores), AnalysisErrorExplainer
- **Output**: Score 0-100 indicating completeness
- **Data Model**: `completenessScore` field in MatchAnalysis
- **Confidence**: Low completeness < 50 triggers warning

#### 8️⃣ **JD Realism Detection**
- **User Value**: Avoid analyzing against fake/scam job postings
- **Data Sources**: JD text → Gemini realism analysis
- **UI Location**: Warning banner if score < 60 in analysis results
- **Output**: Score 0-100 (100 = highly realistic)
- **Data Model**: `jdRealismScore` field in MatchAnalysis
- **Consequence**: Analysis still runs but with warning

#### 9️⃣ **Keyword Stuffing Detection**
- **User Value**: Warn users if resume looks artificially optimized (bad for real humans)
- **Data Sources**: Resume text → Gemini keyword stuffing check
- **UI Location**: Warning in AnalysisErrorExplainer or AnalysisResults
- **Output**: Boolean flag
- **Data Model**: `hasKeywordStuffing` field in MatchAnalysis
- **Warning**: Explains why it hurts readability/ATS

---

### TIER 4: EXPORT & DELIVERY

#### 🔟 **ATS Export Modes**
- **User Value**: Download resume optimized for different audiences
- **Formats**: 
  - PDF (85% ATS friendly)
  - DOCX (90% ATS friendly)
  - ATS-Plain (95% ATS friendly, no formatting)
  - Recruiter-Friendly (enhanced formatting)
- **UI Location**: ExportResumeDialog component (triggered from AnalysisResults)
- **Warning**: Shows ATS score for each format
- **Data Model**: `exportModes[]` array in UserPlan

#### 1️⃣1️⃣ **Error Explanation System**
- **User Value**: Never show generic errors; explain why analysis failed
- **Triggers**:
  - Resume too short (< 200 words)
  - JD too short (< 100 words)
  - Missing keywords
  - Low formatting quality
  - No experience listed
  - Generic resume
- **UI Location**: AnalysisErrorExplainer component
- **Outputs**:
  - Why it happened (reason)
  - Confidence score
  - Actionable suggestions (numbered steps)
  - Retry button
- **Data Model**: Error metadata stored in MatchAnalysis flags

---

### TIER 5: MONETIZATION & PLANS

#### 1️⃣2️⃣ **Free Tier Limits**
- **Analyses/month**: 10
- **AI Generations/month**: 3
- **Saved JDs**: 5
- **Export modes**: PDF only
- **UI**: Soft paywalls (analysis shows blurred data, "Upgrade to see full details")

#### 1️⃣3️⃣ **Pro Plan**
- **Analyses/month**: 100
- **AI Generations/month**: 50
- **Saved JDs**: 50
- **Export modes**: PDF, DOCX, ATS, Recruiter
- **Price**: $9.99/month
- **UI**: Upgrade button in PlanUsageCard, unlock all features

#### 1️⃣4️⃣ **Enterprise Plan**
- **Analyses/month**: Unlimited (-1)
- **AI Generations/month**: Unlimited (-1)
- **Saved JDs**: Unlimited
- **Export modes**: All
- **Price**: Custom
- **UI**: Contact sales button

---

## 🗂️ Data Model

### Core Tables

```
USER
├── id (cuid)
├── email
├── name
├── passwordHash
├── role (USER | ADMIN)
├── createdAt
└── updatedAt

RESUME
├── id (cuid)
├── filename
├── sizeKB
├── fullText
├── jsonData
├── uploadedById (fk: User)
├── createdAt
└── versions[] (fk: ResumeVersion)

RESUMEVERSION ⭐ NEW
├── id (cuid)
├── resumeId (fk: Resume) - cascade delete
├── versionNumber (auto-increment per resume)
├── title (optional)
├── sourceType (upload | ai_generated | manual_edit)
├── sourceAnalysisId (fk: MatchAnalysis, optional)
├── fullText
├── jsonData
├── scoreAtCreation (0-100)
├── scoreImprovement (delta from prev)
└── createdAt

MATCHANALYSIS
├── id (cuid)
├── userId (fk: User)
├── resumeId (fk: Resume)
├── jdId (fk: JobDescription, optional)
├── summary
├── score (0-100)
├── strengths (array)
├── weaknesses (array)
├── missingSkills (array)
├── recommendations (array)
├── generatedResume (JSON)
├── jdText
├── completenessScore (0-100) ⭐ NEW
├── jdRealismScore (0-100) ⭐ NEW
├── hasKeywordStuffing (boolean) ⭐ NEW
└── createdAt

JOBDESCRIPTION ⭐ NEW
├── id (cuid)
├── userId (fk: User)
├── title
├── company (optional)
├── fullText
├── tags (array) - ["Frontend", "Senior", etc]
├── keySkills (array) - extracted
├── createdAt
└── updatedAt

USERPLAN ⭐ NEW
├── id (cuid)
├── userId (fk: User) - unique
├── planType (free | pro | enterprise)
├── analysesPerMonth (10 | 100 | -1)
├── savedJdsLimit (5 | 50 | -1)
├── aiGenerationsPerMonth (3 | 50 | -1)
├── exportModes (array) - ["pdf", "docx", "ats", "recruiter"]
├── createdAt
└── updatedAt

USAGEMETRICS ⭐ NEW
├── id (cuid)
├── userId (fk: User)
├── month (string) - "2025-01"
├── analysesUsed (int)
├── aiGenerationsUsed (int)
├── jdsSaved (int)
├── createdAt
└── updatedAt
└── @@unique([userId, month]) - monthly reset
```

### Relationships
- User → Resume (1-to-many)
- Resume → ResumeVersion (1-to-many)
- ResumeVersion → MatchAnalysis (source) (many-to-1)
- MatchAnalysis → ResumeVersion (generated) (1-to-many)
- MatchAnalysis → Resume (1-to-many)
- MatchAnalysis → JobDescription (1-to-many)
- User → UserPlan (1-to-1)
- User → UsageMetrics (1-to-many, grouped by month)

---

## 👥 User Journeys

### JOURNEY 1: First-Time User (Cold Start)

```
User lands on app
  ↓
Views landing page hero: "Turn Rejections Into Interviews"
  ↓
Clicks "Get Started" → redirected to signup
  ↓
Signs up (email/password or OAuth)
  ↓
Dashboard loads with greeting + empty state
  ↓
Sees "Upload Resume" CTA
  ↓
Navigates to /resumes
  ↓
Uploads first resume (PDF/DOCX)
  ↓
Resume extracted to fullText + jsonData
  ↓
ResumeVersion created (v1, sourceType: upload)
  ↓
Redirected back to dashboard
  ↓
Sees resume in "Your Resumes" card
  ↓
Clicks "Analyze" button
  ↓
Routed to /analyze page
  ↓
Paste job description text
  ↓
Clicks "Analyze Resume"
  ↓
Usage check: ✓ 10/10 analyses available
  ↓
Usage incremented: analysesUsed = 1
  ↓
Gemini analysis runs (completeness, realism, stuffing, match)
  ↓
MatchAnalysis record created with all scores
  ↓
Routed to AnalysisResults showing:
  - Score: 78%
  - Circular progress + subscores
  - ATS brain view (strengths/weaknesses/missing)
  - Skills intelligence
  - Recommendations
  ↓
Clicks "Generate Improved Resume"
  ↓
Usage check: ✓ 3/3 AI generations available
  ↓
Gemini generates improved resume
  ↓
ResumeVersion created (v2, sourceType: ai_generated, scoreAtCreation: 87)
  ↓
Usage incremented: aiGenerationsUsed = 1
  ↓
Views diff viewer:
  - Before: 78%
  - After: 87%
  - +9% improvement
  - Keywords added highlighted in green
  ↓
Clicks "Download" → Export dialog
  ↓
Chooses "PDF" format
  ↓
File downloaded
  ↓
Back to dashboard → PlanUsageCard shows:
  - Analyses: 1/10
  - AI Generations: 1/3
  ↓
Sees "Upgrade to Pro" button (soft paywall)
  ↓
[Journey ends or user continues with pro analysis]
```

### JOURNEY 2: Power User (Multi-Analysis)

```
User with Pro plan + existing resumes
  ↓
Dashboard shows multiple resumes + usage: 78/100 analyses
  ↓
Navigates to /job-descriptions (new!)
  ↓
Saves 5 job descriptions with tags:
  - "Senior React Dev" (tags: Frontend, Senior, React)
  - "Full-Stack Engineer" (tags: Backend, Node, JavaScript)
  - "DevOps Lead" (tags: DevOps, AWS, Kubernetes)
  - "Data Engineer" (tags: Data, Python, SQL)
  - "Product Manager" (tags: PM, Product, Strategy)
  ↓
System auto-extracts key skills for each JD
  ↓
Filters JD library by "Backend" tag
  ↓
Views "Full-Stack Engineer" JD
  ↓
Clicks "Analyze" button (directly from JD library)
  ↓
Pre-populates /analyze with JD text
  ↓
Selects resume from dropdown
  ↓
Analysis runs (jdId linked in MatchAnalysis)
  ↓
Score: 85%
  ↓
Generates improved resume
  ↓
Navigates to /versions?resumeId=X
  ↓
Sees timeline:
  - v1 (original upload, 75%)
  - v2 (AI gen for "Senior React", 83%)
  - v3 (AI gen for "Full-Stack", 85%) ← current
  ↓
Selects v1 vs v3 for comparison
  ↓
Views diff showing evolution
  ↓
Clicks "Restore v2" (restores full snapshot from previous)
  ↓
New v4 created from v2 snapshot
  ↓
Navigates to /progress
  ↓
Sees score timeline chart showing +10% improvement over time
  ↓
Best score: 85%, Average: 80%, Improvement: +12%
  ↓
Exports v3 as "ATS-Plain" format for Applicant Tracking System
  ↓
[Power user maintains many versions, tracks progress]
```

### JOURNEY 3: Limited-User (Hitting Paywall)

```
Free tier user, 9/10 analyses used
  ↓
Dashboard PlanUsageCard warns: "Analysis limit approaching"
  ↓
Yellow progress bar at 90%
  ↓
Attempts 10th analysis
  ↓
Clicks "Analyze Resume"
  ↓
Usage check: ✓ 1/10 available
  ↓
Analysis completes successfully
  ↓
Dashboard now shows: "0/10 analyses remaining"
  ↓
Attempts 11th analysis
  ↓
Clicks "Analyze Resume"
  ↓
Usage check: ✗ Limit reached
  ↓
Error dialog: "Analysis Limit Reached"
  - "You have 0 analyses remaining this month"
  - "Upgrade to Pro for 100/month"
  - [Upgrade button]
  ↓
Clicks "Upgrade to Pro"
  ↓
Routed to /settings → Plan section
  ↓
Pro plan highlighted: $9.99/month
  ↓
Clicks "Upgrade Now"
  ↓
Stripe payment form (future)
  ↓
Plan upgraded to pro
  ↓
UserPlan updated: planType = "pro", analysesPerMonth = 100
  ↓
Redirected back to analysis
  ↓
Retries analysis
  ↓
Usage check: ✓ 100/100 available
  ↓
Analysis runs successfully
  ↓
[User now has access to all pro features]
```

### JOURNEY 4: Error Recovery

```
User uploads incomplete resume (50 words, no experience)
  ↓
Attempts analysis
  ↓
Gemini completeness check: 25/100
  ↓
AnalysisResults shows warning banner
  ↓
AnalysisErrorExplainer component displays:
  - Title: "Low Resume Completeness"
  - Reason: "Resume contains fewer than 200 words"
  - Confidence: 25%
  - Suggestions:
    1. Add detailed work experience
    2. Include specific achievements
    3. List technologies and tools
    4. Add education section
  - [Retry button]
  ↓
User manually adds more experience to resume
  ↓
Clicks "Retry Analysis" in error explainer
  ↓
New analysis runs
  ↓
Completeness now: 75/100
  ↓
Analysis succeeds with full AnalysisResults
  ↓
[Error resolved, user proceeds normally]
```

---

## 🎯 User Value Alignment

### Core Mission Fulfilled
Each feature directly supports:
✅ **Analyze resumes against job descriptions** → Analysis feature (tier 1)
✅ **Explain ATS & recruiter compatibility** → ATS Brain View, export modes (tier 1, 4)
✅ **Tell users exactly what to fix** → Recommendations, error explainer (tier 1, 4)
✅ **Generate improved resumes** → AI resume generation + versioning (tier 1, 2)
✅ **Track progress over time** → Score history, version timeline (tier 2)

### Monetization Alignment
- Free tier incentivizes exploring (10 analyses)
- Pro unlocks power-user workflows (JD library, unlimited exports)
- Enterprise for teams (no limits, custom support)
- No paywalls on core value (analysis always works within limits)

---

## 🏗️ Architecture Quality

### Principles Followed
✅ **Dynamic, config-controlled**: All limits in UserPlan, all features gated by usage
✅ **Backend-driven**: TRPC routers validate all operations
✅ **No breaking changes**: Extended existing MatchAnalysis, added new models
✅ **Reusable analysis**: Single Gemini call outputs used across multiple features
✅ **Graceful degradation**: Errors don't block analysis (completeness/realism/stuffing)

### No Vanity Features
❌ Social feeds → ❌ Not included
❌ Comments → ❌ Not included
❌ Chat → ❌ Not included
❌ Fake recruiter simulations → ❌ Not included
❌ Job boards → ❌ Not included
✅ **Only features that strengthen core value added**

---

## 📱 Frontend Pages & Components

### Pages
- `/dashboard` - Main hub, plan usage, recent activity
- `/resumes` - Resume library, upload, manage
- `/versions?resumeId=X` - Version timeline, compare, restore
- `/job-descriptions` - JD library, save, search, tag
- `/analyze` - Main analysis flow
- `/progress` - Score history, analytics
- `/history` - Past analyses list (existing)
- `/settings` - Plan management (existing)

### New Components
- `PlanUsageCard` - Shows usage metrics + upgrade button
- `ResumeDiffViewer` - Before/after resume comparison
- `ExportResumeDialog` - Multi-format download options
- `AnalysisErrorExplainer` - Error handling + suggestions

---

## 🚀 MVP Completeness Checklist

✅ Resume versioning (create, list, restore, delete, compare)
✅ JD library (save, list, search, tag, delete)
✅ Usage tracking (limits per plan, monthly reset)
✅ Score history & progress tracking
✅ Export modes (PDF, DOCX, ATS, Recruiter)
✅ Error explanation system
✅ Resume completeness scoring
✅ JD realism detection
✅ Keyword stuffing detection
✅ Plan/upgrade UI
✅ Feature gating (soft paywalls)
✅ Dashboard enhancements
✅ Before/after diff viewer

---

## 📊 Success Metrics

### For Users
1. "I can see exactly how my resume changed" → Version timeline + diff
2. "I know what to fix" → Recommendations + error explainer
3. "I can track my improvement" → Progress page + score history
4. "I can download for any situation" → Export modes
5. "I understand my limits" → PlanUsageCard, clear messaging

### For Product
1. Engagement: Avg versions per user > 3
2. Conversion: Free-to-Pro conversion rate > 10%
3. Retention: Monthly active users retention > 60%
4. NPS: Target > 50 (recruiting/career platforms benchmark)

---

## 🔮 Phase 2 Features (Not Included)

- Resume templates gallery
- Job board integration
- Salary estimation
- Interview prep
- Real recruiter messaging
- Analytics dashboard (for team accounts)
- API for integrations
- Slack bot

**All will be evaluated for core value alignment before building.**

---

**Status**: MVP Ready for Launch ✨
**Last Updated**: December 2025
