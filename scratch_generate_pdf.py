import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Draw running header on pages > 1
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "Corporate Access & Intelligence System — Technical Interview Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)
            
        # Draw running footer on all pages
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 32, page_text)
        self.drawString(54, 32, "Enterprise Workforce & Multi-Million Row Data Analytics Architecture")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 44, 8.5 * 72 - 54, 44)
        
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Palette
    c_primary = colors.HexColor("#0f172a")      # Slate 900
    c_secondary = colors.HexColor("#2563eb")    # Blue 600
    c_accent = colors.HexColor("#0284c7")       # Light Blue 600
    c_dark = colors.HexColor("#1e293b")         # Slate 800
    c_body = colors.HexColor("#334155")         # Slate 700
    c_bg_light = colors.HexColor("#f8fafc")     # Slate 50
    c_border = colors.HexColor("#cbd5e1")       # Slate 300
    c_callout_bg = colors.HexColor("#eff6ff")   # Blue 50

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_dark,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_body,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e3a8a")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_body
    )

    table_body_bold = ParagraphStyle(
        'TableBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark
    )

    story = []

    # Title Banner
    story.append(Paragraph("Corporate Access & Intelligence System", title_style))
    story.append(Paragraph("Complete Technical Architecture & Interview Preparation Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_secondary, spaceBefore=0, spaceAfter=12))

    # Executive Elevator Pitch Callout
    pitch_text = "<b>Elevator Pitch for Technical Interviewers:</b><br/>" \
                 "<i>'This project is an Enterprise Workforce & Multi-Million Row CSV Analytics Platform built with React 18, Vite, Chart.js, and HTML5 Web Workers. " \
                 "It enables users to upload massive CSV datasets (up to 10+ million rows) and analyze them in real-time right inside the browser. " \
                 "By offloading parsing, schema detection, statistical profiling, and filtering to a dedicated background Web Worker thread, " \
                 "the application maintains a silky-smooth 60 FPS UI without freezing the DOM. It also features zero-trust multi-method authentication " \
                 "(SSO, OAuth 2.0, Email, Mobile OTP), custom chart building, statistical profiling, and multi-group comparative analytics.'</i>"

    pitch_table = Table(
        [[Paragraph(pitch_text, callout_style)]],
        colWidths=[504]
    )
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_callout_bg),
        ('BOX', (0,0), (-1,-1), 1, c_secondary),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 12))

    # SECTION 1
    story.append(Paragraph("1. How It Works in the Background (Backend & Worker Architecture)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=8))
    story.append(Paragraph(
        "Since this is a high-performance client-side application, the core processing engine runs inside a dedicated <b>HTML5 Web Worker thread</b> (<code>src/workers/csvWorker.js</code>). This keeps the main browser UI thread completely unblocked.",
        body_style
    ))

    story.append(Paragraph("Key Architectural Highlights:", h2_style))
    story.append(Paragraph("• <b>Chunk-Based Streaming Parsing (PapaParse)</b>: Files are streamed in 4MB memory chunks. As parsing progresses, intermediate row counts are sent back to the main thread via worker messages, displaying real-time loading UI without browser lag.", bullet_style))
    story.append(Paragraph("• <b>Sampled Schema & Type Auto-Detection</b>: The worker samples the first 5,000 rows. Columns with >80% numeric values are classified as <i>numeric</i>, >80% date strings as <i>datetime</i>, and remaining columns as <i>categorical</i>.", bullet_style))
    story.append(Paragraph("• <b>Single-Pass Fast Statistical Profiling</b>: Computes Mean, Median, Standard Deviation, Min, Max, missing counts, frequency maps, and 5-number box-plot quartiles (Min, Q1, Median, Q3, Max) in a single pass over the dataset.", bullet_style))
    story.append(Paragraph("• <b>Data Health Score Engine</b>: Evaluates overall dataset integrity index: <i>Health Score = max(0, 100 - (missingCells / totalCells) * 100)</i>.", bullet_style))
    story.append(Paragraph("• <b>Off-Thread Filtering & Pagination Memory Management</b>: The master array stays inside worker memory. When users apply search keywords or range filters, filtering executes off-thread. Only lightweight aggregated metrics (for Chart.js) and active 10-100 row table page slices are posted back to the UI thread.", bullet_style))

    story.append(Spacer(1, 8))

    # SECTION 2
    story.append(Paragraph("2. Frontend Architecture & Component Breakdown", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=8))
    story.append(Paragraph(
        "The frontend is crafted with <b>React 18</b> and <b>Vite</b>, styled with custom Vanilla CSS design tokens supporting Dark & Light themes (<code>data-theme</code>), CSS Grid layouts, and glassmorphism styling.",
        body_style
    ))

    # Components Table
    comp_data = [
        [Paragraph("Component File", table_header_style), Paragraph("Core Responsibility & UI Features", table_header_style)],
        [Paragraph("App.jsx", table_body_bold), Paragraph("Central state coordinator. Manages theme state, authentication checks, Web Worker instantiation (new Worker), filter state, and active tab routing.", table_body_style)],
        [Paragraph("LoginPage.jsx & LoginModal.jsx", table_body_bold), Paragraph("Enterprise authentication portal. Supports Email/Password, Mobile SMS OTP verification, demo account auto-fill, and guest exploration mode.", table_body_style)],
        [Paragraph("OAuthPromptModal.jsx", table_body_bold), Paragraph("Simulates Enterprise OAuth 2.0 & SAML SSO handshakes with Google Workspace, Microsoft 365 / Azure AD, GitHub Enterprise, and Okta SAML SSO.", table_body_style)],
        [Paragraph("Header.jsx", table_body_bold), Paragraph("Brand navbar showing dataset indicator badges, sample dataset loader, CSV export triggers, theme toggle button, and logged-in user profile menu.", table_body_style)],
        [Paragraph("KPICards.jsx", table_body_bold), Paragraph("Top metric cards displaying Total Records, Filtered Overview (with instant LOW / MED / HIGH / ALL level preset buttons), Avg Highlight Metric, and Health Score.", table_body_style)],
        [Paragraph("SidebarFilters.jsx", table_body_bold), Paragraph("Interactive sidebar featuring global keyword search, categorical multi-select checkboxes with counts, and numeric min-max sliders with quick level presets.", table_body_style)],
        [Paragraph("Dashboard.jsx", table_body_bold), Paragraph("Executive dashboard rendering 6 Chart.js charts: Bar, Doughnut, Box Plot Whisker, Histogram, Time-Series Area, and Radar Spider profile.", table_body_style)],
        [Paragraph("CustomChartBuilder.jsx", table_body_bold), Paragraph("Custom Visual Studio allowing dynamic axis selection (X & Y), aggregation functions (mean, sum, count, min, max), and chart types (bar, line, doughnut).", table_body_style)],
        [Paragraph("DataTable.jsx", table_body_bold), Paragraph("High-performance paginated table with column sorting (asc/desc), row page size dropdown (10-100), status badges, and filtered CSV exporter.", table_body_style)],
        [Paragraph("StatsOverview.jsx", table_body_bold), Paragraph("Statistical profiling matrix presenting per-column data types, missing counts/percentages, mean, median, std dev, min, max, and unique categories.", table_body_style)],
        [Paragraph("ComparisonView.jsx", table_body_bold), Paragraph("Dynamic CSV group comparison studio with side-by-side group cards, category leaderboards, comparative bar charts, and heatmaps.", table_body_style)]
    ]

    comp_table = Table(comp_data, colWidths=[140, 364])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 10))

    # SECTION 3
    story.append(Paragraph("3. Data Models & Data Flow", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=8))

    model_data = [
        [Paragraph("Model Name", table_header_style), Paragraph("Storage Location", table_header_style), Paragraph("Data Structure & Description", table_header_style)],
        [Paragraph("Master Dataset Model", table_body_bold), Paragraph("csvWorker.js memory", table_body_style), Paragraph("Full array of parsed CSV objects: [ { Department: 'Engineering', Salary: 95000, Status: 'Active' }, ... ]", table_body_style)],
        [Paragraph("Schema Model", table_body_bold), Paragraph("Worker & React State", table_body_style), Paragraph("Column type dictionary: { Department: 'categorical', Salary: 'numeric', JoinDate: 'datetime' }", table_body_style)],
        [Paragraph("Stats Profiling Model", table_body_bold), Paragraph("Worker & React State", table_body_style), Paragraph("Numerical & Categorical metrics: { count, missingCount, mean, median, stdDev, min, max, uniqueCount, topCategory, frequencies }", table_body_style)],
        [Paragraph("Quartile Box-Plot Model", table_body_bold), Paragraph("Worker Dashboard Metrics", table_body_style), Paragraph("5-number summary per category: { min, q1, median, q3, max } for whisker box plots.", table_body_style)],
        [Paragraph("Filter State Model", table_body_bold), Paragraph("React State (App.jsx)", table_body_style), Paragraph("Filter payload: { search: '', categorical: { Dept: ['Sales'] }, numeric: { Salary: [50000, 120000] } }", table_body_style)],
        [Paragraph("User Session Model", table_body_bold), Paragraph("localStorage & auth.js", table_body_style), Paragraph("Auth profile object: { id, name, email, role, avatar, loginType, provider, loginTime }", table_body_style)]
    ]

    model_table = Table(model_data, colWidths=[120, 110, 274])
    model_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 10))

    # SECTION 4
    story.append(Paragraph("4. Tools, Libraries & Tech Stack", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("• <b>Frontend Core</b>: React 18, Vite 5, PapaParse 5", bullet_style))
    story.append(Paragraph("• <b>Multithreading</b>: HTML5 Web Workers API (Dedicated Worker thread)", bullet_style))
    story.append(Paragraph("• <b>Data Visualization</b>: Chart.js 4 & react-chartjs-2 (Bar, Line, Doughnut, Radar)", bullet_style))
    story.append(Paragraph("• <b>Iconography</b>: Lucide React", bullet_style))
    story.append(Paragraph("• <b>Styling & Theme</b>: Custom Vanilla CSS3 Design Tokens, Dark/Light Mode (data-theme), Glassmorphism, CSS Grid", bullet_style))
    story.append(Paragraph("• <b>Storage & Persistence</b>: HTML5 Web Storage API (localStorage)", bullet_style))

    story.append(Spacer(1, 10))

    # SECTION 5
    story.append(Paragraph("5. Technical Interview Q&A Cheat Sheet", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=0, spaceAfter=8))

    qa_list = [
        ("Q1: Why did you choose Web Workers for this project?",
         "Standard JavaScript runs on a single main UI thread. If you parse and aggregate a 500,000+ row CSV on the main thread, the browser UI will freeze, causing drop-down lag, unresponsive buttons, and browser warning dialogs. By using an HTML5 Web Worker, we move parsing, schema inference, statistical calculations, and filtering off the main thread. The UI stays 100% responsive at 60 FPS while the worker handles heavy computation in the background."),
        
        ("Q2: How do you handle memory optimization when handling large datasets?",
         "We use three strategies: First, chunk-based parsing via PapaParse streams 4MB chunks rather than loading entire raw file strings at once. Second, the full master dataset stays in the worker's isolated thread memory. Third, when filtering or paginating, the worker only sends the current 10-100 row page slice and small pre-aggregated metric objects to the UI thread via postMessage, drastically reducing DOM memory overhead."),

        ("Q3: How does the authentication flow work without a traditional backend server?",
         "We implemented a modular zero-trust client-side authentication utility (auth.js). It supports multi-factor Email/Password and Mobile SMS OTP flows, as well as simulated OAuth 2.0 / SAML SSO handshakes for Google Workspace, Microsoft Azure AD, GitHub Enterprise, and Okta. User sessions are persisted securely in localStorage with role-based access control."),

        ("Q4: How does the Dynamic Comparison Studio work with arbitrary CSV files?",
         "The comparison engine dynamically inspects the schema of whatever CSV file is loaded. It isolates low-cardinality categorical columns as group dimensions (e.g., Department, Work Mode, Region) and numeric columns as metrics (e.g., Salary, Rating). It computes multi-group statistics, determines category champions for the leaderboard, and generates side-by-side bar charts and heatmaps on the fly.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(a, body_style))
        story.append(Spacer(1, 4))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == '__main__':
    output_path = os.path.join(r"e:\EMPLOYEES PROJECTS", "Corporate_Access_Intelligence_System_Interview_Guide.pdf")
    build_pdf(output_path)
