import os
import sys
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
            self.drawString(54, 11 * 72 - 36, "Corporate Access & Intelligence System — Website Blueprint & Plan")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)
            
        # Draw running footer on all pages
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 32, page_text)
        self.drawString(54, 32, "Confidential — Enterprise Workforce Analytics & Profile System Specification")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
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

    # Color Palette
    c_primary = colors.HexColor("#0f172a")      # Slate 900
    c_secondary = colors.HexColor("#2563eb")    # Blue 600
    c_accent = colors.HexColor("#0284c7")       # Cyan/Blue
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
        spaceAfter=4
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
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_body,
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        'DocBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e40af")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_body
    )

    story = []

    # Title Block
    story.append(Paragraph("Corporate Access & Intelligence System", title_style))
    story.append(Paragraph("Total Website Blueprint, System Architecture & Implementation Plan", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_secondary, spaceBefore=0, spaceAfter=12))

    # Section 1: Executive Overview
    story.append(Paragraph("1. Executive Overview & System Purpose", h1_style))
    story.append(Paragraph(
        "The <b>Corporate Access & Intelligence System</b> is a high-performance, enterprise-grade data analytics "
        "and workforce intelligence application designed to process multi-million row datasets directly in the browser "
        "with zero server-side latency. The platform delivers instant visual charting, dynamic multi-dimensional filtering, "
        "statistical data profiling, anomaly detection, and an integrated <b>Personal Profile & Login Activity System</b>.",
        body_style
    ))

    # Key Objectives Callout Box
    callout_data = [[
        Paragraph(
            "<b>Core Value Proposition:</b> Sub-second multi-million row processing via Web Workers, rich glassmorphism UI "
            "with ambient aurora background, real-time localized session tracking, and full user profile customization.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_callout_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#93c5fd")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 10))

    # Section 2: Technical Architecture
    story.append(Paragraph("2. Complete Technical Architecture", h1_style))
    story.append(Paragraph(
        "The application is built using modern web standards to ensure high reliability, visual elegance, and client-side privacy:",
        body_style
    ))

    tech_table_data = [
        [Paragraph("Layer / Component", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Key Functional Responsibility", table_header_style)],
        [Paragraph("Frontend Framework", table_cell_style), Paragraph("React 18.2 + Vite 5", table_cell_style), Paragraph("Declarative component rendering and fast HMR development environment.", table_cell_style)],
        [Paragraph("Styling System", table_cell_style), Paragraph("Vanilla CSS3 & CSS Variables", table_cell_style), Paragraph("Custom design system with root <code>rem</code> scaling, dark/light themes, aurora mesh background.", table_cell_style)],
        [Paragraph("Data Engine", table_cell_style), Paragraph("Dedicated Web Worker (PapaParse)", table_cell_style), Paragraph("Off-main-thread non-blocking parsing of multi-million row CSV files.", table_cell_style)],
        [Paragraph("Data Visualization", table_cell_style), Paragraph("Chart.js 4 + react-chartjs-2", table_cell_style), Paragraph("Dynamic Bar, Doughnut, Line, Pie, Radar, and Polar Area interactive charts.", table_cell_style)],
        [Paragraph("Authentication & Session", table_cell_style), Paragraph("Local Storage & Activity Tracker", table_cell_style), Paragraph("Automated, read-only login/logout tracking with local timezone enforcement.", table_cell_style)],
        [Paragraph("Iconography", table_cell_style), Paragraph("Lucide React Icons", table_cell_style), Paragraph("Clean modern UI iconography across navigation, cards, tables, and modals.", table_cell_style)]
    ]

    tech_table = Table(tech_table_data, colWidths=[120, 140, 244])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 12))

    # Section 3: Personal Profile & Login Activity System
    story.append(Paragraph("3. Personal Profile & Login Activity System Specification", h1_style))
    story.append(Paragraph(
        "A cornerstone feature of the platform is the full-featured, secure user profile center accessible by clicking "
        "the user profile badge at the top right of the application header.",
        body_style
    ))

    story.append(Paragraph("Left Side: Personal Profile Card", h2_style))
    story.append(Paragraph("• <b>Profile Avatar & Photo Picker:</b> Prominent enlarged avatar circle (115px × 115px) with Camera overlay button. Supports preset executive avatars, custom image file uploads (PNG, JPG, WEBP), and initial badges.", bullet_style))
    story.append(Paragraph("• <b>Personal Information:</b> Full Name, Verified Corporate Checkmark, Email Address, Mobile Number, Role/Title, Department, Account Creation Date.", bullet_style))
    story.append(Paragraph("• <b>Skills & Interests:</b> Interactive skill chips (Data Analytics, Workforce Intelligence, React.js, Python, Financial Modeling, Predictive AI).", bullet_style))
    story.append(Paragraph("• <b>Inline Edit Form:</b> Allows instant updating and saving of profile metadata stored locally.", bullet_style))

    story.append(Paragraph("Right Side: Login & Logout Tracking Dashboard", h2_style))
    story.append(Paragraph("• <b>Live Active Session Ticker:</b> Real-time updating counter ticker (seconds precision) displaying current active login duration.", bullet_style))
    story.append(Paragraph("• <b>5 Metric Dashboard Cards:</b>", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;1. <b>LAST LOGIN:</b> Exact localized timestamp of most recent sign-in.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;2. <b>CURRENT SESSION:</b> Real-time updating session duration ticker.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;3. <b>TOTAL LOGIN HOURS:</b> Cumulative total time spent across all sessions.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;4. <b>LOGIN COUNT:</b> Total count of recorded login sessions.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;5. <b>LAST LOGOUT:</b> Exact localized timestamp of previous logout or active state.", bullet_style))
    story.append(Paragraph("• <b>Automated Login History Table:</b> Read-only, tamper-proof session table recording Date, Login Time, Logout Time, Duration, Device/Location, and Status (Active / Logged Out) formatted in user's local timezone.", bullet_style))
    story.append(Paragraph("• <b>Full Screen Toggle:</b> Dedicated Maximize/Minimize button allowing edge-to-edge full screen modal view.", bullet_style))

    story.append(Spacer(1, 10))

    # Section 4: Data Analytics & Dashboard Modules
    story.append(Paragraph("4. Core Data Analytics Modules & Visual Studio", h1_style))
    story.append(Paragraph(
        "The platform provides an end-to-end data analytics suite organized into logical tabs and metric folder decks:",
        body_style
    ))

    modules_table_data = [
        [Paragraph("Module Name", table_header_style), Paragraph("Key Features & Capabilities", table_header_style)],
        [Paragraph("Interactive Sidebar Filters", table_cell_style), Paragraph("Global text keyword search, categorical checkboxes with row counts, dynamic numeric range sliders, preset risk level selectors (Low, Medium, High, All).", table_cell_style)],
        [Paragraph("Metrics Directory Folders", table_cell_style), Paragraph("Structured folder stack: <b>Quality & Health Folder</b> (Missing values, duplicates, completeness score), <b>Financial Folder</b>, <b>Dataset & Filters Folder</b>.", table_cell_style)],
        [Paragraph("Executive Dashboard View", table_cell_style), Paragraph("High-impact visual analytics deck featuring Department workforce distribution bar chart and Work Mode breakdown doughnut chart.", table_cell_style)],
        [Paragraph("Custom Visual Studio", table_cell_style), Paragraph("Custom chart builder allowing users to choose X-axis, Y-axis, aggregation types (Sum, Mean, Count), and chart styles.", table_cell_style)],
        [Paragraph("Data Explorer Table", table_cell_style), Paragraph("High-performance paginated table supporting multi-column sorting, live row filtering, and instant CSV export.", table_cell_style)],
        [Paragraph("Statistical Profiling", table_cell_style), Paragraph("Detailed metrics summary calculating Min, Max, Mean, Median, Standard Deviation, and Null Ratios for every column.", table_cell_style)],
        [Paragraph("Comparison Analysis", table_cell_style), Paragraph("Side-by-side comparative analytics matrix for workforce segments, department metrics, and historical runs.", table_cell_style)]
    ]

    modules_table = Table(modules_table_data, colWidths=[140, 364])
    modules_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(modules_table)
    story.append(Spacer(1, 12))

    # Section 5: Design System & Aesthetics
    story.append(Paragraph("5. Visual Design System & Aesthetics", h1_style))
    story.append(Paragraph(
        "The user interface follows modern luxury web design standards:",
        body_style
    ))
    story.append(Paragraph("• <b>Aurora Mesh Background:</b> Atmospheric radial gradients blending subtle indigo, purple, cyan, emerald, and rose light glows.", bullet_style))
    story.append(Paragraph("• <b>Glassmorphism:</b> Card elements use backdrop blur (<code>backdrop-filter</code>) and translucent linear gradient borders.", bullet_style))
    story.append(Paragraph("• <b>Dynamic Theme Modes:</b> Seamless switching between Dark Mode (#090d16) and Light Mode (#f6f8fd).", bullet_style))
    story.append(Paragraph("• <b>Fluid Typography:</b> Base font size scaled to 110% (`17.6px`) with Google Fonts (Outfit & Inter) for maximum legibility.", bullet_style))

    story.append(Spacer(1, 10))

    # Section 6: Future Roadmap
    story.append(Paragraph("6. Future Expansion Roadmap", h1_style))
    story.append(Paragraph("1. <b>AI Insights Copilot:</b> Automated natural language dataset summaries and anomaly explanations.", bullet_style))
    story.append(Paragraph("2. <b>Real-Time WebSockets:</b> Streaming data ingestion for live enterprise workforce event tracking.", bullet_style))
    story.append(Paragraph("3. <b>Multi-Tenant RBAC:</b> Granular role-based permissions (Viewer, Analyst, Admin) and team workspace sharing.", bullet_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=5, spaceAfter=10))
    story.append(Paragraph("<b>Document Status:</b> Final Approved Plan &nbsp;|&nbsp; <b>Generated:</b> August 2026 &nbsp;|&nbsp; <b>Author:</b> Sathya Sai Kumar", ParagraphStyle('DocFooter', parent=body_style, fontSize=8, textColor=colors.HexColor("#64748b"))))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == '__main__':
    pdf_filename = r"e:\EMPLOYEES PROJECTS\Corporate_Access_Intelligence_System_Website_Plan.pdf"
    build_pdf(pdf_filename)
    print(f"PDF generated successfully at: {pdf_filename}")
