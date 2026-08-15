import React, { useState } from 'react';
import { 
  X, Folder, ChevronDown, ChevronRight, Play, Check, 
  Database, ShieldCheck, Sparkles, BarChart3, Sliders, GitBranch, 
  Layers, GitCompare, Settings, Award, Activity, Server, 
  LayoutDashboard, TrendingUp, ArrowDown, Code, CheckCircle2,
  RefreshCw, Terminal, Eye, Cpu, Zap, Lightbulb
} from 'lucide-react';

export const ML_PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Dataset',
    subtitle: 'Raw Data Ingestion & Schema Discovery',
    icon: Database,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Ingests structured CSV/Excel dataset, auto-detects column data types, parses headers, and verifies structural row-column constraints.',
    metrics: [
      { label: 'Ingestion Mode', value: 'Auto CSV/JSON Parser' },
      { label: 'Header Schema', value: 'Dynamic Field Mapping' },
      { label: 'Data Type Identification', value: 'Numeric / Categorical / Date' }
    ],
    codeSnippet: `import pandas as pd

# Load Raw Dataset
df = pd.read_csv('workforce_data.csv')
print(f"Dataset Shape: {df.shape}")
print(df.info())`
  },
  {
    id: 2,
    title: 'Data Validation',
    subtitle: 'Schema Verification & Integrity Audit',
    icon: ShieldCheck,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Executes comprehensive health check auditing missing cell density, outlier standard deviations, value range bounds, and unexpected null types.',
    metrics: [
      { label: 'Missing Cells Audit', value: 'Calculated per column' },
      { label: 'Outlier Detection', value: '3-Sigma Z-Score Threshold' },
      { label: 'Health Score Rating', value: 'Automated 0-100 Score' }
    ],
    codeSnippet: `from pydantic import BaseModel
import numpy as np

# Data Integrity Check
missing_pct = df.isnull().sum() / len(df) * 100
z_scores = np.abs((df.select_dtypes(include=np.number) - df.mean()) / df.std())
outliers = (z_scores > 3).sum()`
  },
  {
    id: 3,
    title: 'Data Cleaning',
    subtitle: 'Missing Imputation & Deduplication',
    icon: Sparkles,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Applies median/mode imputation strategies, trims whitespace text tokens, removes duplicate entity rows, and casts consistent column types.',
    metrics: [
      { label: 'Numeric Imputer', value: 'Median Imputation Strategy' },
      { label: 'Categorical Imputer', value: 'Mode / "Unknown" Placement' },
      { label: 'Duplicates Removal', value: 'Exact Row Matching' }
    ],
    codeSnippet: `from sklearn.impute import SimpleImputer

# Impute Missing Values & Remove Duplicates
df = df.drop_duplicates()
imputer_num = SimpleImputer(strategy='median')
df[num_cols] = imputer_num.fit_transform(df[num_cols])`
  },
  {
    id: 4,
    title: 'EDA (Exploratory Analysis)',
    subtitle: 'Statistical Distributions & Correlations',
    icon: BarChart3,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Computes variance skewness, Pearson/Spearman feature correlation matrices, categorical distributions, and statistical summary metrics.',
    metrics: [
      { label: 'Correlation Matrix', value: 'Pearson Pairwise Coefficients' },
      { label: 'Distribution Analysis', value: 'Skewness & Kurtosis Checks' },
      { label: 'Summary Statistics', value: 'Mean, Std, IQR Breakdown' }
    ],
    codeSnippet: `import seaborn as sns
import matplotlib.pyplot as plt

# Correlation & Distribution Analysis
corr = df.corr(numeric_only=True)
sns.heatmap(corr, annot=True, cmap='coolwarm')
plt.title("Feature Correlation Heatmap")`
  },
  {
    id: 5,
    title: 'Feature Engineering',
    subtitle: 'Encoding, Scaling & Transformation',
    icon: Sliders,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Transforms categorical factors using One-Hot/Target Encoding, normalizes continuous numeric features via StandardScaler/RobustScaler.',
    metrics: [
      { label: 'Categorical Encoding', value: 'One-Hot & Ordinal Mapping' },
      { label: 'Feature Scaling', value: 'StandardScaler (Zero-Mean Unit-Var)' },
      { label: 'Derived Features', value: 'Interaction Ratios & Aggregates' }
    ],
    codeSnippet: `from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

preprocessor = ColumnTransformer(transformers=[
    ('num', StandardScaler(), num_cols),
    ('cat', OneHotEncoder(drop='first'), cat_cols)
])`
  },
  {
    id: 6,
    title: 'Train / Test Split',
    subtitle: 'Stratified Partitioning & Cross-Validation',
    icon: GitBranch,
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Partitions dataset into training (80%) and testing (20%) subsets with stratified target sampling and 5-Fold cross-validation folds.',
    metrics: [
      { label: 'Split Ratio', value: '80% Train / 20% Holdout Test' },
      { label: 'Stratification', value: 'Balanced Target Distribution' },
      { label: 'Cross-Validation', value: '5-Fold Stratified K-Fold' }
    ],
    codeSnippet: `from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)`
  },
  {
    id: 7,
    title: 'Multiple ML Models',
    subtitle: 'Parallel Candidate Model Training',
    icon: Layers,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Trains a diverse ensemble of classification/regression algorithms including Random Forest, XGBoost, LightGBM, Logistic Regression & Multi-Layer Perceptrons.',
    metrics: [
      { label: 'Models Evaluated', value: '5 Candidate Algorithms' },
      { label: 'Ensemble Baseline', value: 'Random Forest & Gradient Boosting' },
      { label: 'Linear Baseline', value: 'Regularized Ridge / Logistic Model' }
    ],
    codeSnippet: `from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

models = {
    "RandomForest": RandomForestClassifier(n_estimators=100),
    "XGBoost": XGBClassifier(learning_rate=0.05),
    "LightGBM": LGBMClassifier(n_estimators=100)
}`
  },
  {
    id: 8,
    title: 'Model Comparison',
    subtitle: 'Multi-Metric Benchmarking & Ranking',
    icon: GitCompare,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Evaluates candidate models across Accuracy, ROC-AUC, F1-Score, Precision, Recall, MAE, and RMSE to construct an objective leaderboard.',
    metrics: [
      { label: 'Classification Metrics', value: 'Accuracy, F1-Score, ROC-AUC' },
      { label: 'Regression Metrics', value: 'R², RMSE, MAE' },
      { label: 'Leaderboard Ranking', value: 'Multi-Criteria Scoring' }
    ],
    codeSnippet: `from sklearn.metrics import classification_report, roc_auc_score

results = []
for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    results.append({"Model": name, "ROC-AUC": roc_auc_score(y_test, preds)})`
  },
  {
    id: 9,
    title: 'Hyperparameter Tuning',
    subtitle: 'Optuna / GridSearch Optimization',
    icon: Settings,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Tunes tree depth, learning rate, subsample ratios, and regularization penalties using Bayesian Optimization (Optuna) & GridSearchCV.',
    metrics: [
      { label: 'Optimizer Engine', value: 'Optuna TPE Sampler / GridSearch' },
      { label: 'Trials Conducted', value: '50 Hyperparameter Trials' },
      { label: 'Performance Gain', value: '+4.2% ROC-AUC Improvement' }
    ],
    codeSnippet: `import optuna

def objective(trial):
    max_depth = trial.suggest_int('max_depth', 3, 12)
    lr = trial.suggest_float('lr', 0.01, 0.2, log=True)
    clf = XGBClassifier(max_depth=max_depth, learning_rate=lr)
    return cross_val_score(clf, X_train, y_train, cv=5).mean()`
  },
  {
    id: 10,
    title: 'Best Model Selection',
    subtitle: 'Model Registry & Serialization',
    icon: Award,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Selects top-performing tuned model, validates stability on holdout dataset, and serializes artifact pipeline into compressed `.joblib` package.',
    metrics: [
      { label: 'Selected Model', value: 'XGBoost Tuned Ensemble' },
      { label: 'Final Accuracy', value: '94.8% (ROC-AUC: 0.962)' },
      { label: 'Artifact Output', value: 'model_pipeline_v1.joblib' }
    ],
    codeSnippet: `import joblib

# Export Best Tuned Pipeline Artifact
best_pipeline = best_model_search.best_estimator_
joblib.dump(best_pipeline, 'artifacts/best_model_v1.joblib')
print("Model Artifact successfully saved.")`
  },
  {
    id: 11,
    title: 'SHAP Explainability',
    subtitle: 'Feature Importance & Model Transparency',
    icon: Eye,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Computes SHAP (SHapley Additive exPlanations) values to rank global feature importance and provide local instance waterfall explanations.',
    metrics: [
      { label: 'Explainability Engine', value: 'SHAP TreeExplainer' },
      { label: 'Top Feature', value: 'Salary Ratio & Tenure Months' },
      { label: 'Plot Types', value: 'Summary Beeswarm & Dependence Plots' }
    ],
    codeSnippet: `import shap

# Calculate SHAP Explanations
explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test)`
  },
  {
    id: 12,
    title: 'FastAPI Backend',
    subtitle: 'High-Performance REST API Microservice',
    icon: Server,
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Exposes high-speed asynchronous REST API endpoints for real-time model inference (`/predict`), health diagnostics (`/health`), and schema metadata.',
    metrics: [
      { label: 'API Framework', value: 'FastAPI + Uvicorn ASGI Server' },
      { label: 'Inference Latency', value: '< 15 ms per request' },
      { label: 'Validation Schema', value: 'Pydantic Input Data Contract' }
    ],
    codeSnippet: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="ML Inference API")

@app.post("/predict")
def predict(payload: ModelInput):
    prediction = best_model.predict([payload.features])
    return {"prediction": prediction[0], "status": "success"}`
  },
  {
    id: 13,
    title: 'Streamlit / React Dashboard',
    subtitle: 'Interactive UI & Analytics Control Center',
    icon: LayoutDashboard,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Delivers dynamic frontend dashboards with interactive filters, custom chart builders, live session tracking, and real-time inference widgets.',
    metrics: [
      { label: 'Frontend Stack', value: 'React 18 + Vite / Streamlit' },
      { label: 'Visualization Engine', value: 'Chart.js & Dynamic Canvas' },
      { label: 'Responsiveness', value: 'Fully Mobile & Desktop Adaptive' }
    ],
    codeSnippet: `// React Dashboard Component Invocation
import { KPICards, Dashboard, CustomChartBuilder } from './components';

export default function AnalyticsDashboard({ data }) {
  return <Dashboard data={data} metrics={metrics} />;
}`
  },
  {
    id: 14,
    title: 'Prediction + Business Insights',
    subtitle: 'Actionable Executive Decision Support',
    icon: Lightbulb,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    status: 'Completed',
    statusColor: '#10b981',
    description: 'Translates model predictions into strategic recommendations, ROI impact projections, high-risk churn alerts, and automated executive summaries.',
    metrics: [
      { label: 'Business Impact', value: 'Automated Retention Strategy' },
      { label: 'Risk Quantification', value: 'Probability Loss Scoring' },
      { label: 'Executive Reporting', value: 'Auto PDF/CSV Insights Export' }
    ],
    codeSnippet: `# Generate Executive Business Insights
def derive_business_recommendations(prediction_df):
    high_risk = prediction_df[prediction_df['churn_prob'] > 0.75]
    financial_exposure = high_risk['salary'].sum() * 0.35
    return f"Action Required: High risk exposure estimated at \${financial_exposure:,.2f}"`
  }
];

export default function MLPipelineModal({ isOpen, onClose, activeDatasetName = 'Workforce Dataset' }) {
  const [expandedStep, setExpandedStep] = useState(1);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'code' | 'metrics'
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [activeRunningStep, setActiveRunningStep] = useState(null);

  if (!isOpen) return null;

  const handleRunPipelineSimulation = () => {
    setIsRunningPipeline(true);
    setActiveRunningStep(1);
    
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      if (current <= ML_PIPELINE_STEPS.length) {
        setActiveRunningStep(current);
        setExpandedStep(current);
      } else {
        clearInterval(interval);
        setIsRunningPipeline(false);
        setActiveRunningStep(null);
      }
    }, 400);
  };

  const selectedStepData = ML_PIPELINE_STEPS.find(s => s.id === expandedStep) || ML_PIPELINE_STEPS[0];
  const SelectedIcon = selectedStepData.icon;

  return (
    <div className="ml-pipeline-modal-backdrop" onClick={onClose}>
      <div className="ml-pipeline-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* Modal Top Header */}
        <div className="ml-pipeline-header">
          <div className="ml-header-left">
            <div className="ml-folder-badge-icon">
              <Folder size={22} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <div className="ml-header-title-row">
                <h2 className="ml-header-title">System Folder ML Pipeline</h2>
                <span className="ml-badge-step-count">14 Stages</span>
              </div>
              <p className="ml-header-subtitle">
                End-to-End Automated Data & Machine Learning Workflow Pipeline ({activeDatasetName})
              </p>
            </div>
          </div>

          <div className="ml-header-actions">
            <button 
              type="button" 
              className={`btn btn-primary ml-run-btn ${isRunningPipeline ? 'running' : ''}`}
              onClick={handleRunPipelineSimulation}
              disabled={isRunningPipeline}
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Executing Step {activeRunningStep}/14...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Pipeline Flow</span>
                </>
              )}
            </button>

            <button type="button" className="ml-close-btn" onClick={onClose} aria-label="Close Modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Body Grid */}
        <div className="ml-pipeline-body">
          
          {/* Left Column: 14-Step Downward Flow Visualizer */}
          <div className="ml-flow-list-container custom-scrollbar">
            <div className="ml-flow-list-header">
              <span>WORKFLOW PIPELINE STEPS</span>
              <span className="ml-flow-status-tag">100% Configured</span>
            </div>

            <div className="ml-flow-steps-wrapper">
              {ML_PIPELINE_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isSelected = expandedStep === step.id;
                const isCurrentRunning = activeRunningStep === step.id;
                const isLast = index === ML_PIPELINE_STEPS.length - 1;

                return (
                  <React.Fragment key={step.id}>
                    <div 
                      className={`ml-step-card ${isSelected ? 'selected' : ''} ${isCurrentRunning ? 'running-step' : ''}`}
                      onClick={() => setExpandedStep(step.id)}
                    >
                      <div className="ml-step-card-left">
                        <span className="ml-step-number">{step.id < 10 ? `0${step.id}` : step.id}</span>
                        <div className="ml-step-icon-wrap" style={{ backgroundColor: step.bgColor, color: step.color }}>
                          <StepIcon size={18} />
                        </div>
                        <div className="ml-step-text">
                          <span className="ml-step-title">{step.title}</span>
                          <span className="ml-step-sub">{step.subtitle}</span>
                        </div>
                      </div>

                      <div className="ml-step-card-right">
                        {isCurrentRunning ? (
                          <span className="ml-status-pill running">
                            <RefreshCw size={11} className="animate-spin" /> Running
                          </span>
                        ) : (
                          <span className="ml-status-pill completed">
                            <Check size={12} /> {step.status}
                          </span>
                        )}
                        <ChevronRight size={16} className={`ml-step-chevron ${isSelected ? 'active' : ''}`} />
                      </div>
                    </div>

                    {/* Down Arrow Connector between steps */}
                    {!isLast && (
                      <div className="ml-flow-connector">
                        <ArrowDown size={14} className="ml-connector-arrow" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Inspector & Code/Metrics Viewer */}
          <div className="ml-inspector-container">
            <div className="ml-inspector-card">
              
              {/* Inspector Header */}
              <div className="ml-inspector-header">
                <div className="ml-inspector-title-group">
                  <div className="ml-inspector-icon" style={{ backgroundColor: selectedStepData.bgColor, color: selectedStepData.color }}>
                    <SelectedIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="ml-inspector-step-tag">STAGE {selectedStepData.id} OF 14</span>
                      <span className="badge badge-green"><CheckCircle2 size={12} className="inline mr-1" /> Active Stage</span>
                    </div>
                    <h3 className="ml-inspector-title">{selectedStepData.title}</h3>
                    <p className="ml-inspector-subtitle">{selectedStepData.subtitle}</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="ml-inspector-tabs">
                  <button 
                    type="button" 
                    className={`ml-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    type="button" 
                    className={`ml-tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    Key Metrics
                  </button>
                  <button 
                    type="button" 
                    className={`ml-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                    onClick={() => setActiveTab('code')}
                  >
                    <Code size={14} className="inline mr-1" /> Code Preview
                  </button>
                </div>
              </div>

              {/* Inspector Body */}
              <div className="ml-inspector-content">
                
                {activeTab === 'overview' && (
                  <div className="ml-tab-pane">
                    <div className="ml-desc-box">
                      <h4>Stage Description & Workflow Purpose</h4>
                      <p>{selectedStepData.description}</p>
                    </div>

                    <div className="ml-metrics-grid">
                      {selectedStepData.metrics.map((m, idx) => (
                        <div key={idx} className="ml-metric-card">
                          <span className="ml-metric-label">{m.label}</span>
                          <span className="ml-metric-val">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ml-pipeline-summary-alert">
                      <Zap size={18} style={{ color: '#f59e0b' }} />
                      <div>
                        <strong>Production Standard Pipeline Component</strong>
                        <p>Fully compliant with enterprise data governance, automated reproducibility, and high-throughput inference standards.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="ml-tab-pane">
                    <h4>Technical Configuration Specs</h4>
                    <div className="ml-spec-table">
                      {selectedStepData.metrics.map((m, idx) => (
                        <div key={idx} className="ml-spec-row">
                          <span className="ml-spec-key">{m.label}</span>
                          <span className="ml-spec-val">{m.value}</span>
                        </div>
                      ))}
                      <div className="ml-spec-row">
                        <span className="ml-spec-key">Execution Target</span>
                        <span className="ml-spec-val">Python 3.11 / FastAPI / Node.js Engine</span>
                      </div>
                      <div className="ml-spec-row">
                        <span className="ml-spec-key">Memory Footprint</span>
                        <span className="ml-spec-val">&lt; 120 MB RAM</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="ml-tab-pane">
                    <div className="ml-code-header">
                      <Terminal size={15} />
                      <span>{selectedStepData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_stage.py</span>
                    </div>
                    <pre className="ml-code-block">
                      <code>{selectedStepData.codeSnippet}</code>
                    </pre>
                  </div>
                )}

              </div>

              {/* Inspector Footer Navigation */}
              <div className="ml-inspector-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  disabled={expandedStep <= 1}
                  onClick={() => setExpandedStep(prev => Math.max(1, prev - 1))}
                >
                  Previous Stage
                </button>
                <span>Step {expandedStep} of 14</span>
                <button 
                  type="button"
                  className="btn btn-primary"
                  disabled={expandedStep >= ML_PIPELINE_STEPS.length}
                  onClick={() => setExpandedStep(prev => Math.min(ML_PIPELINE_STEPS.length, prev + 1))}
                >
                  Next Stage
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
