import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import {
  Brain, Folder, FolderOpen, Sparkles, X, Maximize2, Minimize2, Search, CheckCircle2,
  Cpu, Layers, Zap, Server, Activity, ShieldCheck, GitBranch, ArrowRight,
  Database, Network, Code, Terminal, Check, Copy, ExternalLink, Sliders,
  BarChart2, Award, Trophy, Clock, ArrowUpDown, ChevronRight, FileText, CheckSquare,
  Workflow, BookOpen, AlertTriangle, Play, Pause, RefreshCw, Radio, Lock, Box,
  FileSpreadsheet, BarChart3, HelpCircle, Target, ChevronDown, Upload, Download,
  TrendingUp, Send, Eye, Settings, Flame, SlidersHorizontal, Info, Compass,
  Sparkle, ShieldAlert, FileCheck, RefreshCcw, Gauge, LineChart, MessageSquare,
  Share2, Binary, Image, Film, MessageCircle, Bot, Sliders as SlidersIcon,
  GitCommit, CheckCheck, PlayCircle, Layers3, MoveRight, ArrowLeft, Star, RotateCcw,
  Sun, Moon
} from 'lucide-react';
import HDScreenshotButton from './HDScreenshotButton';

// ============================================================================
// 12 PRELOADED REAL-WORLD PROJECT TEMPLATES
// ============================================================================
const REAL_WORLD_PROJECTS = [
  {
    id: 'churn',
    name: 'Customer Churn Prediction',
    category: 'Tabular DL',
    domain: 'Telecom / SaaS',
    badgeColor: '#38bdf8',
    target: 'Churn (0/1)',
    problem: 'Predict customer cancellation 30 days prior to contract renewal',
    recommendedArch: 'TabNet / Deep Residual MLP with Categorical Embeddings',
    requiredData: 'Customer demographics, tenure, payment method, monthly charges, ticket history',
    evaluationMetric: 'ROC-AUC / F1',
    expectedOutput: 'Churn probability score (0.0 to 1.0) with SHAP attribution factors',
    realWorldUse: 'Automated retention discount triggers & proactive customer success outreach',
    defaultTargetCol: 'Churn',
    sampleRows: [
      { CustomerID: 'CUST-001', Age: 42, Tenure: 24, MonthlySpend: 89.50, SupportTickets: 4, PaymentMethod: 'CreditCard', Contract: 'Month-to-Month', Churn: 1 },
      { CustomerID: 'CUST-002', Age: 29, Tenure: 48, MonthlySpend: 45.00, SupportTickets: 0, PaymentMethod: 'BankTransfer', Contract: 'Two-Year', Churn: 0 },
      { CustomerID: 'CUST-003', Age: 55, Tenure: 6, MonthlySpend: 112.00, SupportTickets: 6, PaymentMethod: 'CreditCard', Contract: 'Month-to-Month', Churn: 1 },
      { CustomerID: 'CUST-004', Age: 36, Tenure: 36, MonthlySpend: 75.20, SupportTickets: 1, PaymentMethod: 'ElectronicCheck', Contract: 'One-Year', Churn: 0 },
      { CustomerID: 'CUST-005', Age: 61, Tenure: 12, MonthlySpend: 95.80, SupportTickets: 5, PaymentMethod: 'ElectronicCheck', Contract: 'Month-to-Month', Churn: 1 },
      { CustomerID: 'CUST-006', Age: 23, Tenure: 60, MonthlySpend: 32.50, SupportTickets: 0, PaymentMethod: 'BankTransfer', Contract: 'Two-Year', Churn: 0 },
      { CustomerID: 'CUST-007', Age: 48, Tenure: 18, MonthlySpend: 104.00, SupportTickets: 3, PaymentMethod: 'CreditCard', Contract: 'Month-to-Month', Churn: 0 },
      { CustomerID: 'CUST-008', Age: 33, Tenure: 30, MonthlySpend: 68.90, SupportTickets: 2, PaymentMethod: 'ElectronicCheck', Contract: 'One-Year', Churn: 0 }
    ]
  },
  {
    id: 'fraud',
    name: 'Real-Time Fraud Detection',
    category: 'Anomaly Detection',
    domain: 'Fintech & Banking',
    badgeColor: '#ec4899',
    target: 'is_fraud (0/1)',
    problem: 'Detect fraudulent credit card and wire transfers under 10ms latency',
    recommendedArch: 'Variational Autoencoder (VAE) + Focal Loss Residual MLP',
    requiredData: 'Amount, merchant category, device reputation, velocity 1h, distance km',
    evaluationMetric: 'PR-AUC / Recall',
    expectedOutput: 'Fraud probability & real-time transaction blocking flag',
    realWorldUse: 'Payment gateway fraud scoring and anti-money laundering enforcement',
    defaultTargetCol: 'is_fraud',
    sampleRows: [
      { TxnID: 'TXN-901', Amount: 4200.00, MerchantCat: 'Jewelry', DeviceRisk: 0.92, Velocity1h: 5, DistanceKm: 850, Timestamp: '2026-08-15 14:02:11', is_fraud: 1 },
      { TxnID: 'TXN-902', Amount: 14.50, MerchantCat: 'Grocery', DeviceRisk: 0.05, Velocity1h: 1, DistanceKm: 4, Timestamp: '2026-08-15 14:02:15', is_fraud: 0 },
      { TxnID: 'TXN-903', Amount: 85.00, MerchantCat: 'Restaurant', DeviceRisk: 0.08, Velocity1h: 2, DistanceKm: 12, Timestamp: '2026-08-15 14:02:19', is_fraud: 0 },
      { TxnID: 'TXN-904', Amount: 7500.00, MerchantCat: 'CryptoExchange', DeviceRisk: 0.88, Velocity1h: 8, DistanceKm: 2400, Timestamp: '2026-08-15 14:02:22', is_fraud: 1 },
      { TxnID: 'TXN-905', Amount: 29.90, MerchantCat: 'Retail', DeviceRisk: 0.10, Velocity1h: 1, DistanceKm: 6, Timestamp: '2026-08-15 14:02:29', is_fraud: 0 }
    ]
  },
  {
    id: 'sales',
    name: 'Multivariate Sales Forecasting',
    category: 'Time-Series DL',
    domain: 'Retail & Commerce',
    badgeColor: '#10b981',
    target: 'Sales (USD)',
    problem: 'Forecast 12-week store demand across 45 departments with promotion lags',
    recommendedArch: 'Temporal Fusion Transformer (TFT) / Dilated 1D-TCN',
    requiredData: 'Date, store_id, dept_id, weekly_sales, is_holiday, promo_markdown, temp',
    evaluationMetric: 'WMAE / RMSE',
    expectedOutput: 'Quantile forecasts (P10, P50, P90) per SKU',
    realWorldUse: 'Supply chain warehouse replenishment and safety stock planning',
    defaultTargetCol: 'weekly_sales',
    sampleRows: [
      { Date: '2026-01-10', StoreID: 1, DeptID: 5, PromoDiscount: 15.0, Temperature: 45.2, FuelPrice: 3.45, weekly_sales: 24500 },
      { Date: '2026-01-17', StoreID: 1, DeptID: 5, PromoDiscount: 0.0, Temperature: 42.0, FuelPrice: 3.48, weekly_sales: 18900 },
      { Date: '2026-01-24', StoreID: 1, DeptID: 5, PromoDiscount: 25.0, Temperature: 39.5, FuelPrice: 3.50, weekly_sales: 31200 },
      { Date: '2026-01-31', StoreID: 1, DeptID: 5, PromoDiscount: 5.0, Temperature: 41.2, FuelPrice: 3.52, weekly_sales: 21400 }
    ]
  },
  {
    id: 'sentiment',
    name: 'Customer Support NLP Triage',
    category: 'NLP & Text DL',
    domain: 'Enterprise Support',
    badgeColor: '#8b5cf6',
    target: 'Priority (P1-P3)',
    problem: 'Classify high-urgency ticket text and triage to specialized engineer teams',
    recommendedArch: 'Fine-tuned DistilBERT / ModernBERT + Dual-Head Classifier',
    requiredData: 'Ticket text, customer tier, channel, timestamp, urgency label',
    evaluationMetric: 'Macro F1',
    expectedOutput: 'Predicted priority class + extracted entity tokens',
    realWorldUse: 'Automated SLA escalation and routing in Zendesk/Jira platforms',
    defaultTargetCol: 'priority_level',
    sampleRows: [
      { TicketID: 'TK-101', CustomerTier: 'Enterprise', Text: 'Production cluster down with 500 errors on payment API!', WordCount: 11, priority_level: 'P1-Critical' },
      { TicketID: 'TK-102', CustomerTier: 'Free', Text: 'How do I update my profile avatar photo?', WordCount: 8, priority_level: 'P3-Low' },
      { TicketID: 'TK-103', CustomerTier: 'Pro', Text: 'Billing invoice discrepancy for last month subscription', WordCount: 8, priority_level: 'P2-Medium' }
    ]
  },
  {
    id: 'maintenance',
    name: 'Predictive Maintenance Telemetry',
    category: 'IoT & Sensors',
    domain: 'Manufacturing',
    badgeColor: '#f59e0b',
    target: 'Failure (0/1)',
    problem: 'Anticipate CNC spindle failure 48 hours in advance using sensor vibration',
    recommendedArch: '1D Convolutional ResNet + Bidirectional LSTM',
    requiredData: 'Vibration Hz, temperature C, hydraulic pressure psi, motor current A, hours',
    evaluationMetric: 'Recall / RUL',
    expectedOutput: 'Remaining Useful Life (RUL) curve & failure risk index',
    realWorldUse: 'Prevent unplanned factory downtime and order replacement bearings proactively',
    defaultTargetCol: 'machine_failure',
    sampleRows: [
      { MachineID: 'M-401', VibrationHz: 142.5, TempC: 88.2, PressurePsi: 310, CurrentA: 28.5, RuntimeHours: 1450, machine_failure: 1 },
      { MachineID: 'M-402', VibrationHz: 45.1, TempC: 62.0, PressurePsi: 240, CurrentA: 18.2, RuntimeHours: 320, machine_failure: 0 },
      { MachineID: 'M-403', VibrationHz: 52.8, TempC: 65.4, PressurePsi: 245, CurrentA: 19.0, RuntimeHours: 490, machine_failure: 0 }
    ]
  },
  {
    id: 'recsys',
    name: 'Two-Tower Recommendation',
    category: 'RecSys AI',
    domain: 'Digital Commerce',
    badgeColor: '#06b6d4',
    target: 'Click/Buy (Ranking)',
    problem: 'Generate top-20 personalized item recommendations from 500k inventory catalogue',
    recommendedArch: 'Two-Tower Dual Encoder (User + Item) with Dot-Product Annoy',
    requiredData: 'User demographics, browsing history embeddings, item category, price point',
    evaluationMetric: 'Hit@10 / NDCG',
    expectedOutput: 'Top ranked candidate item IDs with similarity relevance scores',
    realWorldUse: 'Homepage carousel personalization and real-time checkout upsells',
    defaultTargetCol: 'click_and_buy',
    sampleRows: [
      { UserID: 'U-88', ItemID: 'ITM-402', UserAge: 31, ItemCategory: 'Electronics', Price: 149.00, PastPurchases: 14, click_and_buy: 1 },
      { UserID: 'U-88', ItemID: 'ITM-901', UserAge: 31, ItemCategory: 'Gardening', Price: 22.50, PastPurchases: 14, click_and_buy: 0 },
      { UserID: 'U-92', ItemID: 'ITM-402', UserAge: 45, ItemCategory: 'Electronics', Price: 149.00, PastPurchases: 3, click_and_buy: 1 }
    ]
  },
  {
    id: 'healthcare',
    name: 'Patient Readmission Risk',
    category: 'Clinical DL',
    domain: 'Healthcare & MedTech',
    badgeColor: '#34d399',
    target: 'Readmit (0/1)',
    problem: 'Predict 30-day emergency hospital readmission from clinical diagnostic records',
    recommendedArch: 'FT-Transformer / Deep ResNet with Medical Embeddings',
    requiredData: 'Age, primary diagnosis code, length of stay, prior admissions, lab tests',
    evaluationMetric: 'ROC-AUC / Sens',
    expectedOutput: 'Readmission probability score with key clinical risk drivers',
    realWorldUse: 'Proactive post-discharge care coordination and nurse follow-up scheduling',
    defaultTargetCol: 'readmitted_30d',
    sampleRows: [
      { PatientID: 'P-101', Age: 68, LengthOfStay: 5, Comorbidities: 3, PriorAdmissions: 2, BloodGlucose: 185, readmitted_30d: 1 },
      { PatientID: 'P-102', Age: 42, LengthOfStay: 2, Comorbidities: 0, PriorAdmissions: 0, BloodGlucose: 98, readmitted_30d: 0 },
      { PatientID: 'P-103', Age: 74, LengthOfStay: 7, Comorbidities: 4, PriorAdmissions: 3, BloodGlucose: 210, readmitted_30d: 1 }
    ]
  },
  {
    id: 'credit',
    name: 'Credit Default & Risk Scoring',
    category: 'Finance DL',
    domain: 'Banking & Lending',
    badgeColor: '#fbbf24',
    target: 'Default (0/1)',
    problem: 'Assess loan default risk and compute dynamic interest credit spread',
    recommendedArch: 'TabNet Sparsemax + Monotonic Constrained Deep MLP',
    requiredData: 'Annual income, debt-to-income ratio, credit inquiries, revolving utilization',
    evaluationMetric: 'Gini / KS-Stat',
    expectedOutput: 'Default probability & approved credit line limit',
    realWorldUse: 'Instant algorithmic loan underwriting and credit card issuance',
    defaultTargetCol: 'default_risk',
    sampleRows: [
      { AppID: 'AP-501', AnnualIncome: 85000, DTI: 0.28, FicoScore: 720, RevolvingUtil: 0.35, Inquiries6m: 1, default_risk: 0 },
      { AppID: 'AP-502', AnnualIncome: 34000, DTI: 0.54, FicoScore: 580, RevolvingUtil: 0.88, Inquiries6m: 5, default_risk: 1 },
      { AppID: 'AP-503', AnnualIncome: 110000, DTI: 0.19, FicoScore: 780, RevolvingUtil: 0.12, Inquiries6m: 0, default_risk: 0 }
    ]
  },
  {
    id: 'hr_attrition',
    name: 'Employee Attrition Intelligence',
    category: 'Workforce AI',
    domain: 'Enterprise HR',
    badgeColor: '#a855f7',
    target: 'Attrition (0/1)',
    problem: 'Identify flight risk employees and determine key satisfaction drivers',
    recommendedArch: 'SAINT Multi-Head Self-Attention + ResNet MLP',
    requiredData: 'Department, tenure, salary hike %, overtime, satisfaction rating, manager tenure',
    evaluationMetric: 'ROC-AUC / F1',
    expectedOutput: 'Retention risk index with customized stay-interview recommendations',
    realWorldUse: 'HR workforce planning, compensation benchmarking, and talent retention',
    defaultTargetCol: 'attrition',
    sampleRows: [
      { EmpID: 'EMP-201', Department: 'Engineering', Tenure: 3.5, OverTime: 'Yes', SalaryHike: 8.5, JobSatisfaction: 2, attrition: 1 },
      { EmpID: 'EMP-202', Department: 'Data Analytics', Tenure: 5.0, OverTime: 'No', SalaryHike: 16.0, JobSatisfaction: 5, attrition: 0 },
      { EmpID: 'EMP-203', Department: 'Product', Tenure: 2.0, OverTime: 'Yes', SalaryHike: 10.0, JobSatisfaction: 3, attrition: 1 }
    ]
  },
  {
    id: 'cybersecurity',
    name: 'Network Intrusion Detection',
    category: 'Cyber Defense',
    domain: 'Network SecOps',
    badgeColor: '#f43f5e',
    target: 'Threat (Multi)',
    problem: 'Detect DDoS, PortScan, and Botnet network attacks in packet telemetry',
    recommendedArch: 'Deep Packet Conv1D + Residual Dense Network',
    requiredData: 'Flow duration, packet count, byte rate, header length, flag counts',
    evaluationMetric: 'Macro F1 / Prec',
    expectedOutput: 'Real-time threat classification & automated firewall IP block rule',
    realWorldUse: 'SOC operations center intrusion prevention and automated incident triage',
    defaultTargetCol: 'attack_type',
    sampleRows: [
      { FlowID: 'FL-801', DurationMs: 120, PktCount: 450, ByteRate: 850000, SynFlags: 400, attack_type: 'DDoS' },
      { FlowID: 'FL-802', DurationMs: 4500, PktCount: 18, ByteRate: 3200, SynFlags: 1, attack_type: 'Benign' },
      { FlowID: 'FL-803', DurationMs: 30, PktCount: 80, ByteRate: 140000, SynFlags: 78, attack_type: 'PortScan' }
    ]
  },
  {
    id: 'realestate',
    name: 'Real Estate Valuation & Hedging',
    category: 'Tabular Reg',
    domain: 'PropTech & Realty',
    badgeColor: '#38bdf8',
    target: 'Price (USD)',
    problem: 'Predict residential property valuations and estimate rental yields',
    recommendedArch: 'Ensemble TabNet + Gradient Boosted Neural Trees',
    requiredData: 'Square footage, bedrooms, zip code, school rating, distance to transit, year built',
    evaluationMetric: 'MAPE / R2',
    expectedOutput: 'Fair market valuation range & expected 5-year capital appreciation',
    realWorldUse: 'Mortgage appraisal automation and institutional real estate portfolio bidding',
    defaultTargetCol: 'property_price',
    sampleRows: [
      { PropID: 'PROP-901', SqFt: 2400, Beds: 4, Baths: 3, ZipCode: '94107', SchoolRating: 9, property_price: 1350000 },
      { PropID: 'PROP-902', SqFt: 1100, Beds: 2, Baths: 1, ZipCode: '94110', SchoolRating: 7, property_price: 780000 },
      { PropID: 'PROP-903', SqFt: 3100, Beds: 5, Baths: 4, ZipCode: '94025', SchoolRating: 10, property_price: 2150000 }
    ]
  },
  {
    id: 'energy',
    name: 'Energy Grid & Solar Forecast',
    category: 'CleanTech AI',
    domain: 'Utilities & Power',
    badgeColor: '#10b981',
    target: 'Grid Load (MWh)',
    problem: 'Forecast regional hourly electric grid load and solar panel generation output',
    recommendedArch: 'N-BEATS / Temporal Convolutional Network (TCN)',
    requiredData: 'Hour, ambient temp, solar irradiance W/m2, wind speed, historical load',
    evaluationMetric: 'MAE / Peak Err',
    expectedOutput: 'Hourly megawatt-hour dispatch schedule for grid operators',
    realWorldUse: 'Battery energy storage system (BESS) charging and peaking power plant dispatch',
    defaultTargetCol: 'grid_load_mwh',
    sampleRows: [
      { Timestamp: '2026-08-15 12:00', TempC: 32.5, SolarIrradiance: 920, WindSpeedKmh: 14, grid_load_mwh: 4850 },
      { Timestamp: '2026-08-15 18:00', TempC: 28.0, SolarIrradiance: 150, WindSpeedKmh: 18, grid_load_mwh: 6100 },
      { Timestamp: '2026-08-15 23:00', TempC: 22.1, SolarIrradiance: 0, WindSpeedKmh: 8, grid_load_mwh: 3400 }
    ]
  }
];

// ============================================================================
// 12 DEEP LEARNING ARCHITECTURE FOLDERS (USER-SPECIFIED TAXONOMY)
// ============================================================================
const DL_FOLDERS = [
  { id: 'tabular_csv', title: '⭐ Tabular & CSV Champions', count: '6 Models', icon: Star, color: '#fbbf24', desc: 'TabNet, ResNet MLP, FT-Transformer, TFT, VAE, XGBoost' },
  { id: 'fam_1', title: '1. Basic Neural Networks', count: '5 Models', icon: Layers, color: '#38bdf8', desc: 'Perceptron, Single-Layer, MLP, Feedforward (FNN), Deep DNN' },
  { id: 'fam_2', title: '2. CNN — Convolutional Networks', count: '15 Models', icon: Image, color: '#a855f7', desc: 'ResNet, ConvNeXt, EfficientNet, MobileNet, VGG19, Inception' },
  { id: 'fam_3', title: '3. RNN — Recurrent & Sequential', count: '8 Models', icon: Clock, color: '#ec4899', desc: 'LSTM, GRU, BiLSTM, BiGRU, Stacked RNN, Deep RNN' },
  { id: 'fam_4', title: '4. Encoder–Decoder Architectures', count: '5 Models', icon: Workflow, color: '#06b6d4', desc: 'Seq2Seq, LSTM Enc-Dec, GRU Enc-Dec, CNN-LSTM, Attention Enc-Dec' },
  { id: 'fam_5', title: '5. Attention & Transformers', count: '14 Models', icon: Brain, color: '#8b5cf6', desc: 'Transformer, BERT, RoBERTa, GPT Decoder, ViT, Swin, TabNet' },
  { id: 'fam_6', title: '6. Autoencoder Architectures', count: '8 Models', icon: Cpu, color: '#10b981', desc: 'Autoencoder (AE), Sparse AE, Denoising AE, VAE, β-VAE, Conv-AE' },
  { id: 'fam_7', title: '7. GAN Architectures (Generative)', count: '12 Models', icon: Flame, color: '#f43f5e', desc: 'DCGAN, Conditional GAN, WGAN-GP, CycleGAN, StyleGAN3, Pix2Pix' },
  { id: 'fam_8', title: '8. Diffusion Models (Generative AI)', count: '7 Models', icon: Sparkles, color: '#38bdf8', desc: 'DDPM, DDIM, Latent Diffusion, Stable Diffusion, Score Diffusion' },
  { id: 'fam_9', title: '9. Graph Neural Networks (GNN)', count: '7 Models', icon: Network, color: '#c084fc', desc: 'GCN, GraphSAGE, GAT, GIN, ChebNet, R-GCN, Graph Transformer' },
  { id: 'fam_10', title: '10. Deep Reinforcement Learning', count: '11 Models', icon: PlayCircle, color: '#eab308', desc: 'DQN, Double DQN, PPO, Actor-Critic, SAC, DDPG, TD3' },
  { id: 'fam_11', title: '11. Time-Series Deep Learning', count: '12 Models', icon: TrendingUp, color: '#34d399', desc: 'Temporal Fusion Transformer (TFT), TCN, N-BEATS, PatchTST, Informer' },
  { id: 'fam_12', title: '12. Multimodal Architectures', count: '8 Models', icon: Film, color: '#6366f1', desc: 'CLIP, BLIP, Flamingo, Vision-Language Transformers, ViT + LLM' }
];

// Complete library of models with folder mappings
const ALGORITHM_LIBRARY = [
  // 1. Basic NNs
  {
    id: 'mlp_basic',
    name: 'Multilayer Perceptron (MLP)',
    folderId: 'fam_1',
    folderName: '1. Basic Neural Networks',
    isCsvSpecialist: true,
    mathConcept: 'Fully connected feedforward layers with non-linear activations',
    params: '~150K - 500K',
    complexity: 'O(B · D_in · D_out)',
    inferenceLatency: '1.4 ms',
    interpretability: '70% (SHAP / Feature Weights)',
    strengths: 'Fast training, baseline representation learning for tabular datasets',
    weaknesses: 'Prone to overfitting on small sample sizes without strong regularization',
    bestDataset: 'Standard tabular CSV datasets with continuous & categorical features',
    latexFormula: 'y = \\sigma(W_2 \\cdot \\text{ReLU}(W_1 x + b_1) + b_2)',
    pipelineNodes: [
      { name: 'Input Layer', shape: '[Batch, Features]', icon: Database, color: '#38bdf8' },
      { name: 'Dense Layer (128)', shape: '[Batch, 128]', icon: Cpu, color: '#a855f7' },
      { name: 'ReLU Activation + Dropout', shape: '[Batch, 128]', icon: Sliders, color: '#ec4899' },
      { name: 'Dense Layer (64)', shape: '[Batch, 64]', icon: Layers, color: '#fbbf24' },
      { name: 'Output Classifier', shape: '[Batch, Target]', icon: Target, color: '#10b981' }
    ]
  },
  {
    id: 'residual_mlp',
    name: 'Deep Residual MLP (ResNet for Tabular)',
    folderId: 'fam_1',
    folderName: '1. Basic Neural Networks',
    isCsvSpecialist: true,
    mathConcept: 'Dense Skip Connections x_{l+1} = ReLU(W_l x_l + b_l) + x_l with LayerNorm',
    params: '~320K - 900K',
    complexity: 'O(B · D · L)',
    inferenceLatency: '2.1 ms',
    interpretability: '72% (SHAP Kernel / Gradients)',
    strengths: 'Fast convergence, eliminates vanishing gradients, robust to non-linear numerical boundaries',
    weaknesses: 'Requires careful categorical embedding and scaling',
    bestDataset: 'Clean CSV tabular datasets with normalized continuous features',
    latexFormula: 'x_{l+1} = \\sigma(LayerNorm(W_2 \\sigma(W_1 x_l + b_1) + b_2)) + x_l',
    pipelineNodes: [
      { name: 'Input Vector', shape: '[Batch, N]', icon: Database, color: '#38bdf8' },
      { name: 'Linear + LayerNorm + GELU', shape: '[Batch, 128]', icon: Cpu, color: '#a855f7' },
      { name: 'Residual Skip Block (x4)', shape: '[Batch, 128]', icon: GitBranch, color: '#ec4899' },
      { name: 'Dropout (0.25)', shape: '[Batch, 128]', icon: ShieldCheck, color: '#fbbf24' },
      { name: 'Sigmoid / Softmax Output', shape: '[Batch, 1]', icon: Target, color: '#10b981' }
    ]
  },
  {
    id: 'deep_fnn',
    name: 'Deep Feedforward Neural Network (DNN)',
    folderId: 'fam_1',
    folderName: '1. Basic Neural Networks',
    isCsvSpecialist: true,
    mathConcept: 'Deep stacked dense layers with Batch Normalization & LeakyReLU',
    params: '~500K - 1.2M',
    complexity: 'O(B · \\sum D_i D_{i+1})',
    inferenceLatency: '2.5 ms',
    interpretability: '68%',
    strengths: 'Deep hierarchical representation learning for non-linear decision boundaries',
    weaknesses: 'Requires careful learning rate scheduling and early stopping',
    bestDataset: 'High-volume tabular CSV datasets (>50k rows)',
    latexFormula: 'h^{(l)} = \\text{BatchNorm}(\\text{LeakyReLU}(W^{(l)} h^{(l-1)} + b^{(l)}))',
    pipelineNodes: [
      { name: 'Input Vector', shape: '[Batch, N]', icon: Database, color: '#38bdf8' },
      { name: 'Dense Block 1 + BN', shape: '[Batch, 256]', icon: Cpu, color: '#a855f7' },
      { name: 'Dense Block 2 + BN', shape: '[Batch, 128]', icon: Cpu, color: '#ec4899' },
      { name: 'Dense Block 3 + Dropout', shape: '[Batch, 64]', icon: Layers, color: '#fbbf24' },
      { name: 'Output Head', shape: '[Batch, Classes]', icon: Target, color: '#10b981' }
    ]
  },

  // 2. CNNs
  {
    id: 'resnet_cnn',
    name: 'ResNet-50 / ResNeXt',
    folderId: 'fam_2',
    folderName: '2. CNN — Convolutional Networks',
    isCsvSpecialist: false,
    mathConcept: '2D Spatial convolutions with identity shortcut skip connections H(x) = F(x) + x',
    params: '~25.6M',
    complexity: 'O(C · H · W · K^2)',
    inferenceLatency: '15.2 ms',
    interpretability: '75% (Grad-CAM heatmaps)',
    strengths: 'Eliminates vanishing gradient problem for deep 100+ layer spatial networks',
    weaknesses: 'Heavy computational requirements on high-res inputs',
    bestDataset: 'Image classification, spatial feature matrices, document scan analysis',
    latexFormula: 'y = F(x, {W_i}) + x',
    pipelineNodes: [
      { name: 'Image Tensor', shape: '[Batch, 3, 224, 224]', icon: Image, color: '#38bdf8' },
      { name: 'Conv 7x7 (s=2) + MaxPool', shape: '[Batch, 64, 56, 56]', icon: Layers, color: '#a855f7' },
      { name: 'Residual Bottleneck Blocks (x16)', shape: '[Batch, 2048, 7, 7]', icon: Cpu, color: '#ec4899' },
      { name: 'Global Average Pooling', shape: '[Batch, 2048]', icon: Sliders, color: '#fbbf24' },
      { name: 'Dense Classifier', shape: '[Batch, Classes]', icon: Target, color: '#10b981' }
    ]
  },
  {
    id: 'convnext',
    name: 'ConvNeXt V2 / EfficientNet-B7',
    folderId: 'fam_2',
    folderName: '2. CNN — Convolutional Networks',
    isCsvSpecialist: false,
    mathConcept: 'Modern pure-convolutional network modernized with 7x7 depthwise kernels & inverted bottlenecks',
    params: '~28.5M',
    complexity: 'O(B · C · H · W)',
    inferenceLatency: '12.8 ms',
    interpretability: '78% (Grad-CAM)',
    strengths: 'Outperforms Swin Transformers in throughput with simpler convolutional inductive bias',
    weaknesses: 'Large GPU memory allocation during high-res training',
    bestDataset: 'Computer vision, document image understanding, spatial matrix classification',
    latexFormula: 'x_{out} = x + \\text{GRN}(\\text{Conv}_{1\\times 1}(\\text{GELU}(\\text{Conv}_{1\\times 1}(\\text{DWConv}_{7\\times 7}(x)))))',
    pipelineNodes: [
      { name: 'Input Tensor', shape: '[Batch, 3, 224, 224]', icon: Image, color: '#38bdf8' },
      { name: 'Patchify Stem (4x4, s=4)', shape: '[Batch, 96, 56, 56]', icon: Layers, color: '#a855f7' },
      { name: 'Depthwise 7x7 Inverted Blocks', shape: '[Batch, 768, 7, 7]', icon: Cpu, color: '#ec4899' },
      { name: 'Global Response Norm (GRN)', shape: '[Batch, 768]', icon: Sliders, color: '#fbbf24' },
      { name: 'Linear Projection Head', shape: '[Batch, Classes]', icon: Target, color: '#10b981' }
    ]
  },

  // 3. RNNs
  {
    id: 'lstm_bilstm',
    name: 'Bidirectional LSTM (BiLSTM)',
    folderId: 'fam_3',
    folderName: '3. RNN — Recurrent & Sequential',
    isCsvSpecialist: true,
    mathConcept: 'Gated recurrent cell processing forward & backward temporal sequences',
    params: '~850K - 2.4M',
    complexity: 'O(B · T · H^2)',
    inferenceLatency: '12.0 ms',
    interpretability: '65% (Hidden state activation)',
    strengths: 'Preserves long-term temporal dependencies without exponential gradient decay',
    weaknesses: 'Sequential compute bottleneck limits full parallelization',
    bestDataset: 'Time-series sensor telemetry, sequential tabular logs, log anomaly detection',
    latexFormula: 'f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f); \\quad c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t',
    pipelineNodes: [
      { name: 'Sequence Tensor', shape: '[Batch, Seq_Len, Dim]', icon: Clock, color: '#38bdf8' },
      { name: 'Forward LSTM Cells', shape: '[Batch, Seq_Len, 64]', icon: ArrowRight, color: '#a855f7' },
      { name: 'Backward LSTM Cells', shape: '[Batch, Seq_Len, 64]', icon: ArrowRight, color: '#ec4899' },
      { name: 'Bi-State Concat + Dense', shape: '[Batch, 128]', icon: Layers, color: '#fbbf24' },
      { name: 'Forecasting Output', shape: '[Batch, Horizon]', icon: Target, color: '#10b981' }
    ]
  },

  // 4. Encoder-Decoder
  {
    id: 'seq2seq_attn',
    name: 'Seq2Seq with Bahdanau Attention',
    folderId: 'fam_4',
    folderName: '4. Encoder–Decoder Architectures',
    isCsvSpecialist: true,
    mathConcept: 'Recurrent Encoder + Dynamic Additive Attention Alignment + Autoregressive Decoder',
    params: '~1.8M - 4.5M',
    complexity: 'O(B · T_x · T_y · H)',
    inferenceLatency: '16.5 ms',
    interpretability: '85% (Attention alignment matrix)',
    strengths: 'Transforms variable-length input sequences to variable-length target forecasts',
    weaknesses: 'Autoregressive decoding inference loop is slower than parallel transformers',
    bestDataset: 'Multi-step energy load forecasting, predictive sequence transformations',
    latexFormula: 'e_{ij} = v_a^T \\tanh(W_a s_{i-1} + U_a h_j); \\quad \\alpha_{ij} = \\text{softmax}(e_{ij})',
    pipelineNodes: [
      { name: 'Input Sequence X', shape: '[Batch, T_in, Dim]', icon: Clock, color: '#38bdf8' },
      { name: 'Bi-GRU Encoder', shape: '[Batch, T_in, 2H]', icon: Cpu, color: '#a855f7' },
      { name: 'Additive Attention Context', shape: '[Batch, 2H]', icon: Eye, color: '#ec4899' },
      { name: 'Autoregressive Decoder', shape: '[Batch, T_out, H]', icon: RefreshCw, color: '#fbbf24' },
      { name: 'Output Horizon Tensor', shape: '[Batch, T_out, Target]', icon: Target, color: '#10b981' }
    ]
  },

  // 5. Transformers
  {
    id: 'tabnet',
    name: 'TabNet (Attentive Tabular Network)',
    folderId: 'fam_5',
    folderName: '5. Attention & Transformers',
    isCsvSpecialist: true,
    mathConcept: 'Sparsemax / Sequential Attention Transformers for Feature Selection',
    params: '~450K - 1.8M',
    complexity: 'O(B · N · S)',
    inferenceLatency: '6.5 ms',
    interpretability: '94% (Built-in feature mask)',
    strengths: 'Interpretable mask selection, end-to-end self-supervised pretraining, matches gradient boosted trees',
    weaknesses: 'Requires batch size tuning; slower than LightGBM',
    bestDataset: 'High-dimensional tabular CSV datasets (>10k rows) with mixed types',
    latexFormula: 'M[i] = Sparsemax(P[i-1] · h_{i-1}(a[i-1]))',
    pipelineNodes: [
      { name: 'Input Tensor', shape: '[Batch, Features]', icon: Database, color: '#38bdf8' },
      { name: 'Feature Transformer & BN', shape: '[Batch, 128]', icon: Sliders, color: '#a855f7' },
      { name: 'Attentive Transformer (Sparsemax)', shape: '[Batch, Masks]', icon: Eye, color: '#ec4899' },
      { name: 'Split Step & Mask Aggregator', shape: '[Batch, d_out]', icon: Layers, color: '#fbbf24' },
      { name: 'Final Dense Head', shape: '[Batch, 1/Classes]', icon: Target, color: '#10b981' }
    ]
  },
  {
    id: 'transformer_tabular',
    name: 'FT-Transformer (Feature Tokenizer)',
    folderId: 'fam_5',
    folderName: '5. Attention & Transformers',
    isCsvSpecialist: true,
    mathConcept: 'Multi-Head Self-Attention over Column Feature Token Embeddings',
    params: '~1.2M - 4.5M',
    complexity: 'O(B · H · F^2)',
    inferenceLatency: '18.4 ms',
    interpretability: '88% (Attention weights matrix)',
    strengths: 'Captures all-to-all non-linear feature interaction patterns without manual feature crossing',
    weaknesses: 'Quadratic complexity in number of columns',
    bestDataset: 'Complex tabular tasks where interactions between distinct columns drive outcomes',
    latexFormula: 'Attention(Q,K,V) = softmax(QK^T / \\sqrt{d_k})V',
    pipelineNodes: [
      { name: 'Feature Tokenizer', shape: '[Batch, Cols, Dim]', icon: Database, color: '#38bdf8' },
      { name: '[CLS] Token Concatenation', shape: '[Batch, 1+Cols, Dim]', icon: Layers, color: '#a855f7' },
      { name: 'Multi-Head Self-Attention (8H)', shape: '[Batch, 1+Cols, Dim]', icon: Brain, color: '#ec4899' },
      { name: 'FeedForward + LayerNorm', shape: '[Batch, Dim]', icon: Cpu, color: '#fbbf24' },
      { name: 'Linear Projection Head', shape: '[Batch, Target]', icon: Target, color: '#10b981' }
    ]
  },

  // 6. Autoencoders
  {
    id: 'vae_autoencoder',
    name: 'Variational Autoencoder (VAE)',
    folderId: 'fam_6',
    folderName: '6. Autoencoder Architectures',
    isCsvSpecialist: true,
    mathConcept: 'Probabilistic latent space encoding parameterized by mean μ and variance log σ^2',
    params: '~600K - 1.5M',
    complexity: 'O(B · (D + Latent))',
    inferenceLatency: '4.8 ms',
    interpretability: '85% (Reconstruction error map)',
    strengths: 'Unsupervised outlier detection via reconstruction error; continuous smooth latent space',
    weaknesses: 'Can blur complex multi-modal distributions without KL warm-up',
    bestDataset: 'Unlabeled transaction logs, cybersecurity packet traces, sensor health telemetry',
    latexFormula: 'L_{VAE} = E_{q_\\phi(z|x)}[\\log p_\\theta(x|z)] - D_{KL}(q_\\phi(z|x) || p(z))',
    pipelineNodes: [
      { name: 'Raw Input Vector', shape: '[Batch, N]', icon: Database, color: '#38bdf8' },
      { name: 'Encoder Dense Blocks', shape: '[Batch, 128]', icon: Cpu, color: '#a855f7' },
      { name: 'Latent Mean μ & LogVar log σ²', shape: '[Batch, Latent_Dim=16]', icon: Activity, color: '#ec4899' },
      { name: 'Reparameterization z = μ + σ⊙ε', shape: '[Batch, 16]', icon: Sparkles, color: '#fbbf24' },
      { name: 'Decoder Reconstruction', shape: '[Batch, N]', icon: Target, color: '#10b981' }
    ]
  },

  // 7. GANs
  {
    id: 'wgan_gp',
    name: 'WGAN-GP (Wasserstein GAN)',
    folderId: 'fam_7',
    folderName: '7. GAN Architectures (Generative)',
    isCsvSpecialist: true,
    mathConcept: 'Earth Mover distance optimization with 1-Lipschitz gradient penalty constraint',
    params: '~2.2M - 6.5M',
    complexity: 'O(B · (G + D_steps))',
    inferenceLatency: '5.2 ms',
    interpretability: '62% (Synthetic sample distribution check)',
    strengths: 'Stable synthetic data generation without mode collapse, generates realistic private synthetic CSV rows',
    weaknesses: 'Requires 5 discriminator updates per 1 generator step',
    bestDataset: 'Privacy-preserving synthetic tabular generation, rare fraud oversampling',
    latexFormula: 'L = E_{\\tilde{x}}[D(\\tilde{x})] - E_{x}[D(x)] + \\lambda E_{\\hat{x}}[(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2]',
    pipelineNodes: [
      { name: 'Gaussian Noise z ~ N(0,I)', shape: '[Batch, 64]', icon: Sparkles, color: '#38bdf8' },
      { name: 'Generator Dense MLP', shape: '[Batch, Features]', icon: Cpu, color: '#a855f7' },
      { name: 'Synthetic Sample Matrix', shape: '[Batch, Features]', icon: FileSpreadsheet, color: '#ec4899' },
      { name: 'Critic Discriminator Network', shape: '[Batch, 1]', icon: ShieldCheck, color: '#fbbf24' },
      { name: 'Wasserstein Loss & Penalty', shape: '[Batch, 1]', icon: Target, color: '#10b981' }
    ]
  },

  // 8. Diffusion
  {
    id: 'diffusion_ddpm',
    name: 'Denoising Diffusion (DDPM)',
    folderId: 'fam_8',
    folderName: '8. Diffusion Models (Generative AI)',
    isCsvSpecialist: false,
    mathConcept: 'Forward Gaussian Markov noise addition and reverse U-Net score-based denoising',
    params: '~35M - 120M',
    complexity: 'O(T · U-Net FLOPs)',
    inferenceLatency: '120.0 ms',
    interpretability: '60% (Latent trajectory visualization)',
    strengths: 'Highest fidelity synthetic data sample generation without GAN mode collapse',
    weaknesses: 'Multi-step sampling required during reverse denoising inference',
    bestDataset: 'Synthetic tabular data generation, realistic image synthesis, audio diffusion',
    latexFormula: 'L_{simple}(\\theta) = E_{t, x_0, \\epsilon}[\\|\\epsilon - \\epsilon_\\theta(x_t, t)\\|^2]',
    pipelineNodes: [
      { name: 'Gaussian Noise Latent x_T', shape: '[Batch, Dim]', icon: Sparkles, color: '#38bdf8' },
      { name: 'Time-Step Positional Embedding', shape: '[Batch, 128]', icon: Clock, color: '#a855f7' },
      { name: 'Reverse U-Net Denoising ε_θ', shape: '[Batch, Dim]', icon: Cpu, color: '#ec4899' },
      { name: 'Iterative Langevin Steps (x_t-1)', shape: '[Batch, Dim]', icon: RefreshCw, color: '#fbbf24' },
      { name: 'Synthesized Sample x_0', shape: '[Batch, Features]', icon: Target, color: '#10b981' }
    ]
  },

  // 9. GNNs
  {
    id: 'gcn_graph',
    name: 'Graph Convolutional Network (GCN)',
    folderId: 'fam_9',
    folderName: '9. Graph Neural Networks (GNN)',
    isCsvSpecialist: false,
    mathConcept: 'First-order spectral Chebyshev message passing over adjacency matrix',
    params: '~400K - 1.2M',
    complexity: 'O(|E| · D + |V| · D^2)',
    inferenceLatency: '8.4 ms',
    interpretability: '80% (Sub-graph edge attention)',
    strengths: 'Natively ingests relational network graphs, entity link topologies, and transaction webs',
    weaknesses: 'Over-smoothing when stacking >4 graph convolutional layers',
    bestDataset: 'Social networks, anti-money laundering transaction webs, citation graphs',
    latexFormula: 'H^{(l+1)} = \\sigma(\\tilde{D}^{-\\frac{1}{2}} \\tilde{A} \\tilde{D}^{-\\frac{1}{2}} H^{(l)} W^{(l)})',
    pipelineNodes: [
      { name: 'Node Features X + Adj Matrix A', shape: '[Nodes, Features]', icon: Network, color: '#38bdf8' },
      { name: 'Normalized Laplacians Ã', shape: '[Nodes, Nodes]', icon: Binary, color: '#a855f7' },
      { name: 'Graph Conv Message Passing', shape: '[Nodes, 128]', icon: Share2, color: '#ec4899' },
      { name: 'Graph Attention Layer (GAT)', shape: '[Nodes, 64]', icon: Eye, color: '#fbbf24' },
      { name: 'Node / Edge Classification Head', shape: '[Nodes, Classes]', icon: Target, color: '#10b981' }
    ]
  },

  // 10. DRL
  {
    id: 'ppo_rl',
    name: 'Proximal Policy Optimization (PPO)',
    folderId: 'fam_10',
    folderName: '10. Deep Reinforcement Learning',
    isCsvSpecialist: false,
    mathConcept: 'Clipped surrogate objective function prevents destabilizing large policy updates',
    params: '~1.5M - 4.0M',
    complexity: 'O(Epochs · Batch · (Actor + Critic))',
    inferenceLatency: '3.5 ms',
    interpretability: '68% (Q-Value state advantage maps)',
    strengths: 'Stable training, easy hyperparameter tuning, industry standard for automated dynamic pricing & portfolio trading',
    weaknesses: 'Sample efficiency lower than off-policy methods like SAC/TD3',
    bestDataset: 'Sequential decision environments, trading simulations, dynamic pricing',
    latexFormula: 'L^{CLIP}(\\theta) = \\hat{E}_t [\\min(r_t(\\theta)\\hat{A}_t, \\text{clip}(r_t(\\theta), 1-\\epsilon, 1+\\epsilon)\\hat{A}_t)]',
    pipelineNodes: [
      { name: 'State Observation Vector s_t', shape: '[Batch, State_Dim]', icon: Eye, color: '#38bdf8' },
      { name: 'Actor Policy Network π_θ(a|s)', shape: '[Batch, Action_Dim]', icon: PlayCircle, color: '#a855f7' },
      { name: 'Critic Value Network V_ϕ(s)', shape: '[Batch, 1]', icon: Award, color: '#ec4899' },
      { name: 'Generalized Advantage Estimator (GAE)', shape: '[Batch, 1]', icon: TrendingUp, color: '#fbbf24' },
      { name: 'Sampled Optimal Action a_t', shape: '[Batch, Actions]', icon: Target, color: '#10b981' }
    ]
  },

  // 11. Time-Series DL
  {
    id: 'tft_timeseries',
    name: 'Temporal Fusion Transformer (TFT)',
    folderId: 'fam_11',
    folderName: '11. Time-Series Deep Learning',
    isCsvSpecialist: true,
    mathConcept: 'Multi-horizon quantile forecasting with gating & variable selection networks',
    params: '~2.5M - 6.0M',
    complexity: 'O(B · T · F)',
    inferenceLatency: '14.2 ms',
    interpretability: '92% (Variable importance weights & temporal attention)',
    strengths: 'Gold standard for multi-horizon enterprise supply chain forecasting with static + dynamic features',
    weaknesses: 'Requires strict date-time indexing and feature categorization',
    bestDataset: 'Multivariate time series with promotional lags, holiday markers, and store hierarchies',
    latexFormula: 'GRN_\\omega(a) = LayerNorm(a + GLU_\\omega(\\eta_1))',
    pipelineNodes: [
      { name: 'Past Inputs & Static Metadata', shape: '[Batch, T_past, F]', icon: Clock, color: '#38bdf8' },
      { name: 'Variable Selection Network (VSN)', shape: '[Batch, T, D]', icon: Sliders, color: '#a855f7' },
      { name: 'Interpretable Multi-Head Attention', shape: '[Batch, T, D]', icon: Brain, color: '#ec4899' },
      { name: 'Gated Residual Units (GRN)', shape: '[Batch, T, D]', icon: Cpu, color: '#fbbf24' },
      { name: 'Quantile Forecasts (P10, P50, P90)', shape: '[Batch, T_future, 3]', icon: Target, color: '#10b981' }
    ]
  },
  {
    id: 'nbeats_timeseries',
    name: 'N-BEATS (Basis Expansion)',
    folderId: 'fam_11',
    folderName: '11. Time-Series Deep Learning',
    isCsvSpecialist: true,
    mathConcept: 'Doubly Residual Stacking with polynomial trend and harmonic seasonality basis functions',
    params: '~1.8M - 4.2M',
    complexity: 'O(B · Blocks · Horizon)',
    inferenceLatency: '4.5 ms',
    interpretability: '90% (Decomposed Trend + Seasonality outputs)',
    strengths: 'Interpretable decomposed trend and harmonic Fourier seasonality without external features',
    weaknesses: 'Cannot naturally ingest exogenous static categorical entity embeddings',
    bestDataset: 'Pure univariate and multivariate demand forecasting time series',
    latexFormula: '\\hat{y}_t = \\sum_{l} g_{l, \\text{trend}}(\\theta_l) + \\sum_{l} g_{l, \\text{season}}(\\theta_l)',
    pipelineNodes: [
      { name: 'Lookback Window [B, T]', shape: '[Batch, 5xHorizon]', icon: Clock, color: '#38bdf8' },
      { name: 'Trend Block (Polynomial Basis)', shape: '[Batch, Horizon]', icon: TrendingUp, color: '#a855f7' },
      { name: 'Seasonality Block (Fourier)', shape: '[Batch, Horizon]', icon: Activity, color: '#ec4899' },
      { name: 'Doubly Residual Stacking', shape: '[Batch, Horizon]', icon: Layers, color: '#fbbf24' },
      { name: 'Point / Interval Forecast', shape: '[Batch, Horizon]', icon: Target, color: '#10b981' }
    ]
  },

  // 12. Multimodal
  {
    id: 'clip_multimodal',
    name: 'CLIP / BLIP (Vision-Language)',
    folderId: 'fam_12',
    folderName: '12. Multimodal Architectures',
    isCsvSpecialist: false,
    mathConcept: 'Dual-Tower joint embedding space aligned via symmetric InfoNCE contrastive cross-entropy',
    params: '~150M - 400M',
    complexity: 'O(B^2 · D)',
    inferenceLatency: '24.0 ms',
    interpretability: '86% (Zero-shot text-to-image similarity matrix)',
    strengths: 'Zero-shot classification, cross-modal semantic retrieval without task-specific fine-tuning',
    weaknesses: 'High compute cost for dual-tower training',
    bestDataset: 'Paired image-text datasets, multimedia catalogues, semantic search engines',
    latexFormula: 'L_{InfoNCE} = -\\frac{1}{2B} \\sum_{i=1}^B (\\log \\frac{e^{\\text{sim}(I_i, T_i)/\\tau}}{\\sum_j e^{\\text{sim}(I_i, T_j)/\\tau}} + \\dots)',
    pipelineNodes: [
      { name: 'Dual Input: Image & Text', shape: '[B, 3, 224, 224] & [B, Len]', icon: Image, color: '#38bdf8' },
      { name: 'Vision Transformer (ViT-B/16)', shape: '[Batch, 512]', icon: Cpu, color: '#a855f7' },
      { name: 'Text Transformer Tower', shape: '[Batch, 512]', icon: FileText, color: '#ec4899' },
      { name: 'Cosine Similarity Matrix (I·T^T)', shape: '[Batch, Batch]', icon: Binary, color: '#fbbf24' },
      { name: 'Zero-Shot Prediction Logits', shape: '[Batch, Classes]', icon: Target, color: '#10b981' }
    ]
  },

  // Tabular Benchmark
  {
    id: 'xgboost_baseline',
    name: 'XGBoost / LightGBM Benchmark',
    folderId: 'tabular_csv',
    folderName: 'Classical ML Benchmark',
    isCsvSpecialist: true,
    mathConcept: 'Second-order Taylor expansion gradient tree boosting with column subsampling',
    params: '100 - 500 Trees',
    complexity: 'O(T · K · N)',
    inferenceLatency: '1.2 ms',
    interpretability: '92% (TreeSHAP exact polynomial calculation)',
    strengths: 'Gold standard for tabular speed, handles raw NaNs and unscaled features out of the box',
    weaknesses: 'Cannot naturally ingest streaming raw embeddings or fine-tune end-to-end with deep nets',
    bestDataset: 'Tabular datasets of any size with high categorical cardinality',
    latexFormula: 'L^{(t)} = \\sum_{i=1}^n [g_i f_t(x_i) + \\frac{1}{2} h_i f_t^2(x_i)] + \\Omega(f_t)',
    pipelineNodes: [
      { name: 'Raw Tabular CSV Input', shape: '[Batch, Cols]', icon: Database, color: '#38bdf8' },
      { name: 'Histogram Split Finding', shape: '[256 Bins / Feature]', icon: BarChart2, color: '#a855f7' },
      { name: 'Gradient & Hessian Computation', shape: '[g_i, h_i]', icon: Activity, color: '#ec4899' },
      { name: 'Ensemble Decision Trees (x300)', shape: '[Trees, Depth=6]', icon: GitBranch, color: '#fbbf24' },
      { name: 'Summed Probability Score', shape: '[Batch, 1]', icon: Target, color: '#10b981' }
    ]
  }
];

// 14-Stage End-to-End Decision Pipeline
const PIPELINE_STAGES = [
  {
    id: 'upload',
    num: '01',
    phase: 1,
    phaseName: 'Phase 1: Ingestion & DNA',
    phaseColor: '#10b981',
    icon: Database,
    title: 'CSV Stream Ingestion',
    subtitle: 'Zero-Copy Memory Mapping',
    desc: 'High-speed memory streaming of CSV, Excel, or JSON data with Arrow buffers.',
    easyAnalogy: 'Like an ultra-fast conveyor belt feeding millions of table cells straight into GPU memory with zero bottlenecks.',
    techStack: ['Apache Arrow', 'Polars C++ Engine', 'Zero-Copy RAM', 'Memory-Mapped I/O'],
    tensorFlow: 'Raw CSV Bytes [50 MB] ➔ Arrow Chunked Matrix [N × D]',
    codeSnippet: `import pyarrow.csv as pv\ntable = pv.read_csv("dataset.csv", read_options=pv.ReadOptions(block_size=1024*1024))\ndf = polars.from_arrow(table)\nprint(f"Zero-copy loaded {df.shape[0]} rows in {df.shape[1]} cols")`,
    simLog: 'Ingested 14,200 rows via Arrow zero-copy memory buffer in 12ms.',
    telemetry: 'Throughput: 2.8 GB/s • Memory: 14 MB • Zero Overhead',
    targetTab: 'hub'
  },
  {
    id: 'profile',
    num: '02',
    phase: 1,
    phaseName: 'Phase 1: Ingestion & DNA',
    phaseColor: '#10b981',
    icon: Activity,
    title: 'Data Profiling & Health',
    subtitle: 'Missing Cells & Quality Scoring',
    desc: 'Automated cardinality, missing cell ratios, duplicate detection & data quality scoring.',
    easyAnalogy: 'A comprehensive medical scan of your dataset to detect broken cells, duplicates, or strange outliers before training.',
    techStack: ['Polars Fast-Stats', 'Outlier Z-Score', 'Cardinality Scan', 'Health Vector'],
    tensorFlow: 'Table [N × D] ➔ Quality Vector [Health: 99.4%, Nulls: 0.0%, Dupes: 0]',
    codeSnippet: `null_matrix = df.null_count()\ncardinality = {col: df[col].n_unique() for col in df.columns}\nhealth_score = 100.0 - (df.null_count().sum().item() / (df.shape[0] * df.shape[1]) * 100)`,
    simLog: 'Data health score computed: 99.4% (0 missing values, 0 duplicate rows).',
    telemetry: 'Health Score: 99.4% • Missing Rate: 0.0% • Outliers: 0.1%',
    targetTab: 'eda'
  },
  {
    id: 'target',
    num: '03',
    phase: 1,
    phaseName: 'Phase 1: Ingestion & DNA',
    phaseColor: '#10b981',
    icon: Target,
    title: 'Target & Feature Topology',
    subtitle: 'Dependent vs Covariate Matrix',
    desc: 'Auto-identify dependent target label vs independent feature covariate columns.',
    easyAnalogy: 'Separates the exact question you want AI to answer (Target) from the clues used to solve it (Features).',
    techStack: ['Mutual Information', 'Information Gain', 'Label Matrix', 'Feature Covariates'],
    tensorFlow: 'Table [N × D] ➔ Covariates X [N × (D-1)], Target y [N × 1]',
    codeSnippet: `y = df[target_col].to_numpy()\nX = df.drop(target_col)\nfeature_names = X.columns\nprint(f"Target: '{target_col}' separated from {len(feature_names)} features")`,
    simLog: "Target column locked: 'Churn' (Binary classification inferred).",
    telemetry: "Target: 'Churn' • Covariates: 13 Features • Cardinality: 2",
    targetTab: 'eda'
  },
  {
    id: 'problem',
    num: '04',
    phase: 2,
    phaseName: 'Phase 2: Automated Intelligence',
    phaseColor: '#8b5cf6',
    icon: Brain,
    title: 'Task & Objective Inference',
    subtitle: 'Classification, Regression or Anomaly',
    desc: 'Infer Classification, Regression, Anomaly detection or Time-Series forecasting task.',
    easyAnalogy: 'Decides if the AI needs to answer Yes/No, pick categories, predict dollar amounts, or spot rare fraudsters.',
    techStack: ['Entropy Heuristics', 'Distribution Profiler', 'Loss Selector', 'Task Classifier'],
    tensorFlow: 'Target Vector y ➔ Task: Binary Classification (BCEWithLogitsLoss)',
    codeSnippet: `n_classes = len(np.unique(y))\nif n_classes == 2:\n    task = "binary_classification"\n    loss_fn = torch.nn.BCEWithLogitsLoss()\nelif np.issubdtype(y.dtype, np.floating):\n    task = "regression"\n    loss_fn = torch.nn.MSELoss()`,
    simLog: 'Task inferred: Supervised Binary Classification with BCEWithLogitsLoss.',
    telemetry: 'Task: Binary Classification • Loss: BCEWithLogits • Balanced',
    targetTab: 'eda'
  },
  {
    id: 'prep',
    num: '05',
    phase: 2,
    phaseName: 'Phase 2: Automated Intelligence',
    phaseColor: '#8b5cf6',
    icon: SlidersHorizontal,
    title: 'Neural Preprocessing Engine',
    subtitle: 'StandardScaler & Entity Embeddings',
    desc: 'StandardScaler, One-Hot/Entity Embeddings, Quantile Transform & Imputation pipeline.',
    easyAnalogy: 'Translates human words and messy numbers into normalized mathematical vectors neural nets love.',
    techStack: ['RobustScaler', 'PyTorch EmbeddingBag', 'Quantile Transform', 'KNN Imputer'],
    tensorFlow: 'Categorical [N × C] + Numerical [N × K] ➔ Dense Tensor X [N × 128]',
    codeSnippet: `from sklearn.preprocessing import RobustScaler, OrdinalEncoder\nX_num_scaled = RobustScaler().fit_transform(X_num)\nX_cat_encoded = OrdinalEncoder().fit_transform(X_cat)\nX_tensor = torch.cat([torch.tensor(X_num_scaled, dtype=torch.float32), torch.tensor(X_cat_encoded, dtype=torch.long)], dim=1)`,
    simLog: 'Engine scaled numerical columns and generated 64-dim categorical embeddings.',
    telemetry: 'Dense Vector Dim: 128 • Scaling: RobustScaler • Embeddings: 64-d',
    targetTab: 'eda'
  },
  {
    id: 'baseline',
    num: '06',
    phase: 2,
    phaseName: 'Phase 2: Automated Intelligence',
    phaseColor: '#8b5cf6',
    icon: Zap,
    title: 'Rapid ML Baseline Screening',
    subtitle: 'XGBoost GPU, LightGBM & CatBoost',
    desc: 'Fast benchmark screening (XGBoost, LightGBM, Logistic Regression) to establish baseline.',
    easyAnalogy: 'Runs instant speed tests on classical algorithms in 2 seconds to set the minimum score to beat.',
    techStack: ['XGBoost GPU (CUDA)', 'LightGBM Tree', 'CatBoost', 'Logistic Regression'],
    tensorFlow: 'X_train, y_train ➔ XGBoost Baseline AUC: 0.884 • LightGBM: 0.891',
    codeSnippet: `import xgboost as xgb\nclf = xgb.XGBClassifier(tree_method="hist", device="cuda")\nclf.fit(X_train, y_train)\nbaseline_auc = roc_auc_score(y_val, clf.predict_proba(X_val)[:, 1])\nprint(f"XGBoost Baseline ROC-AUC: {baseline_auc:.4f}")`,
    simLog: 'Screened ML Baselines: XGBoost AUC = 0.884, LightGBM AUC = 0.891.',
    telemetry: 'LightGBM Baseline AUC: 0.891 • Latency: 0.38s • GPU: Active',
    targetTab: 'architecture'
  },
  {
    id: 'selection',
    num: '07',
    phase: 2,
    phaseName: 'Phase 2: Automated Intelligence',
    phaseColor: '#8b5cf6',
    icon: Cpu,
    title: 'DL Architecture Matcher',
    subtitle: 'TabNet, ResNet MLP & Transformers',
    desc: 'Match data characteristics to TabNet, ResNet MLP, FT-Transformer or SAINT architecture.',
    easyAnalogy: 'Selects the optimal neural brain architecture tailored specifically to your data cardinality and sparsity.',
    techStack: ['TabNet (Sparsemax Attention)', 'Deep ResNet MLP', 'FT-Transformer', 'SAINT'],
    tensorFlow: 'Data Profile [N=14k, C=13] ➔ Selected: TabNet with Sequential Attention',
    codeSnippet: `from pytorch_tabnet.tab_model import TabNetClassifier\nmodel = TabNetClassifier(\n    n_d=64, n_a=64, n_steps=5, gamma=1.5,\n    cat_idxs=cat_indices, cat_dims=cat_dimensions,\n    optimizer_fn=torch.optim.AdamW\n)`,
    simLog: 'Selected Deep Architecture: TabNet with Sparsemax Sequential Attention Masks.',
    telemetry: 'Matched: TabNet Neural Network • Params: 1.42M • Mask Steps: 5',
    targetTab: 'architecture'
  },
  {
    id: 'hyperopt',
    num: '08',
    phase: 3,
    phaseName: 'Phase 3: Hyper-Optimization & Training',
    phaseColor: '#f59e0b',
    icon: Flame,
    title: 'Optuna Hyperparameter Tuning',
    subtitle: 'Bayesian Optimization & TPE',
    desc: 'Tune Learning Rate, Batch Size, Dropout & AdamW Weight Decay via Bayesian optimization.',
    easyAnalogy: 'An AI auto-tuner trying 30 smart parameter combinations to find the highest possible accuracy.',
    techStack: ['Optuna 3.0', 'Tree-structured Parzen Estimator (TPE)', 'Hyperband Pruner', 'AdamW Decay'],
    tensorFlow: 'Search Space [LR, Batch, Dropout] ➔ Optimal: LR=0.00142, Decay=1e-4, Dropout=0.2',
    codeSnippet: `import optuna\ndef objective(trial):\n    lr = trial.suggest_float("lr", 1e-4, 1e-2, log=True)\n    dropout = trial.suggest_float("dropout", 0.1, 0.4)\n    return train_and_eval_trial(lr, dropout)\nstudy = optuna.create_study(direction="maximize")\nstudy.optimize(objective, n_trials=30)`,
    simLog: 'Optuna finished 30 trials: Optimal LR = 0.00142, Weight Decay = 1e-4.',
    telemetry: '30 Trials Evaluated • Best Loss: 0.142 • Tuning Speedup: 6.8x',
    targetTab: 'training'
  },
  {
    id: 'training',
    num: '09',
    phase: 3,
    phaseName: 'Phase 3: Hyper-Optimization & Training',
    phaseColor: '#f59e0b',
    icon: Activity,
    title: 'Live Backpropagation Loop',
    subtitle: 'AdamW, Cosine Annealing & AMP FP16',
    desc: 'Live backpropagation, loss convergence & early stopping trigger with FP16 mixed precision.',
    easyAnalogy: 'The neural network practices on the data, learns from mistakes, and fine-tunes billions of connections.',
    techStack: ['PyTorch 2.0 TorchDynamo', 'AdamW Optimizer', 'Cosine Annealing LR', 'AMP FP16 Mixed Precision'],
    tensorFlow: 'Batch [64, 128] ➔ Forward Pass ➔ Loss: 0.142 ➔ Backprop Gradient ∂L/∂W ➔ Weights Updated',
    codeSnippet: `scaler = torch.cuda.amp.GradScaler()\nfor epoch in range(25):\n    with torch.cuda.amp.autocast():\n        outputs = model(X_batch)\n        loss = criterion(outputs, y_batch)\n    scaler.scale(loss).backward()\n    scaler.step(optimizer)\n    scaler.update()\n    scheduler.step()`,
    simLog: 'Epoch 25/25 complete. Loss converged to 0.142 (Training ROC-AUC: 0.962).',
    telemetry: 'Epoch: 25/25 • Loss: 0.142 • GPU Mem: 1.1 GB • Speed: 9,200 it/s',
    targetTab: 'training'
  },
  {
    id: 'eval',
    num: '10',
    phase: 3,
    phaseName: 'Phase 3: Hyper-Optimization & Training',
    phaseColor: '#f59e0b',
    icon: Trophy,
    title: 'Multi-Metric Neural Evaluation',
    subtitle: 'ROC-AUC, PR-AUC, F1 & Confusion Matrix',
    desc: 'Compute ROC-AUC, F1-Score, RMSE, PR-AUC & confusion matrix across holdout test splits.',
    easyAnalogy: 'The final report card: rigorously tests the model on unseen data to verify genuine intelligence.',
    techStack: ['TorchMetrics', 'Scikit-Learn ROC-AUC', 'Confusion Matrix', 'PR-AUC Curve'],
    tensorFlow: 'Test Predictions ŷ [N_test] vs Ground Truth y [N_test] ➔ ROC-AUC: 0.948, F1: 0.912',
    codeSnippet: `from torchmetrics.classification import BinaryAUROC, BinaryF1Score\nauroc = BinaryAUROC().to(device)(preds, targets)\nf1 = BinaryF1Score().to(device)(preds > 0.5, targets)\nprint(f"Holdout Test ROC-AUC: {auroc.item():.4f} | F1-Score: {f1.item():.4f}")`,
    simLog: 'Test Set Evaluation: ROC-AUC = 0.948, F1-Score = 0.912, Precision = 92.4%.',
    telemetry: 'ROC-AUC: 0.948 • F1: 0.912 • Precision: 92.4% • Recall: 90.1%',
    targetTab: 'training'
  },
  {
    id: 'xai',
    num: '11',
    phase: 4,
    phaseName: 'Phase 4: Explainability & Edge Production',
    phaseColor: '#38bdf8',
    icon: Sparkles,
    title: 'Explainable AI (SHAP & XAI)',
    subtitle: 'Feature Importance & Waterfall Attribution',
    desc: 'Global & local feature importance attribution waterfall charts for regulatory compliance.',
    easyAnalogy: 'Opens the AI black box to show you exactly which columns influenced each prediction the most.',
    techStack: ['SHAP (Shapley Additive exPlanations)', 'Integrated Gradients', 'Captum XAI', 'Waterfall Plots'],
    tensorFlow: 'Model + Sample [1 × D] ➔ Shapley Attribution Vector φ_i [D]',
    codeSnippet: `import shap\nexplainer = shap.Explainer(model.predict, X_background)\nshap_values = explainer(X_test[:50])\nshap.plots.waterfall(shap_values[0])\nprint("Generated SHAP global attribution score matrix.")`,
    simLog: "SHAP waterfall generated: Top driving feature 'Tenure' (+34.2% attribution).",
    telemetry: "Top Driver: 'Tenure' (+34.2%) • 'MonthlySpend' (+22.8%) • Confirmed",
    targetTab: 'streaming'
  },
  {
    id: 'best',
    num: '12',
    phase: 4,
    phaseName: 'Phase 4: Explainability & Edge Production',
    phaseColor: '#38bdf8',
    icon: Lock,
    title: 'Model Checkpoint Lock & INT8',
    subtitle: 'Lossless Quantization & Pruning',
    desc: 'Ensemble selection, optimal checkpoint quantization & weights pruning for low latency.',
    easyAnalogy: 'Compresses the trained model by 75% so it runs 4x faster on servers with zero loss in accuracy.',
    techStack: ['PyTorch Post-Training Quantization', 'INT8 Dynamic Weights', 'SafeTensors', 'Structured Pruning'],
    tensorFlow: 'FP32 Weights (18.4 MB) ➔ INT8 Quantized Model (4.6 MB, 4.2x Faster)',
    codeSnippet: `quantized_model = torch.quantization.quantize_dynamic(\n    model, {torch.nn.Linear}, dtype=torch.qint8\n)\ntorch.save(quantized_model.state_dict(), "model_int8.safetensors")`,
    simLog: 'Locked best checkpoint & quantized to INT8 TensorRT engine (18.4MB -> 4.6MB).',
    telemetry: 'Size: 18.4MB ➔ 4.6MB • Lossless: 99.9% Preserved • Speedup: 4.2x',
    targetTab: 'streaming'
  },
  {
    id: 'pred',
    num: '13',
    phase: 4,
    phaseName: 'Phase 4: Explainability & Edge Production',
    phaseColor: '#38bdf8',
    icon: Radio,
    title: 'Sub-10ms Streaming Prediction',
    subtitle: 'Real-Time Inference & Drift Monitor',
    desc: 'Sub-10ms streaming inference simulator with anomaly score radar and data drift monitor.',
    easyAnalogy: 'Simulates live streaming traffic: generates real-time predictions in under 4 milliseconds per customer.',
    techStack: ['Streaming Inference Engine', 'Population Stability Index (PSI)', 'Data Drift Radar', 'WebSockets / SSE'],
    tensorFlow: 'Live Stream Record ➔ Batch Tensor [1, 14] ➔ Probability Score: 0.892 (Latency: 3.8ms)',
    codeSnippet: `with torch.inference_mode():\n    probs = torch.sigmoid(model(torch.tensor(new_record).unsqueeze(0)))\n    drift_detected = compute_psi(new_record, baseline_dist) > 0.25\n    return {"churn_prob": float(probs.item()), "drift": drift_detected}`,
    simLog: 'Real-time inference engine active: processing streaming requests in 3.8ms.',
    telemetry: 'Inference Latency: 3.8ms • Throughput: 14,200 req/sec • Drift: Normal',
    targetTab: 'streaming'
  },
  {
    id: 'deploy',
    num: '14',
    phase: 4,
    phaseName: 'Phase 4: Explainability & Edge Production',
    phaseColor: '#38bdf8',
    icon: Server,
    title: 'Production Export & Deployment',
    subtitle: 'PyTorch 2.0, ONNX, TensorRT & REST API',
    desc: 'Export production PyTorch 2.0 / ONNX / TorchScript package with FastAPI server & Dockerfile.',
    easyAnalogy: 'Packages the model into ready-to-deploy enterprise artifacts for AWS, Azure, GCP, or Docker containers.',
    techStack: ['ONNX Runtime', 'TorchScript / C++ JIT', 'NVIDIA TensorRT', 'FastAPI Microservice'],
    tensorFlow: 'Trained Model ➔ model.onnx + torchscript.pt + Dockerfile + OpenAPI Swagger',
    codeSnippet: `torch.onnx.export(\n    model, dummy_input, "production_model.onnx",\n    input_names=["features"], output_names=["probabilities"],\n    dynamic_axes={"features": {0: "batch_size"}}\n)\nprint("Exported production ONNX & TorchScript artifacts.")`,
    simLog: 'Exported production bundle: model.onnx & torchscript.pt ready for 1M QPS deployment.',
    telemetry: 'Artifacts: model.onnx, model.pt, Dockerfile • Ready for 1M QPS',
    targetTab: 'code'
  }
];

export default function DeepLearningStudioModal({
  isOpen,
  onClose,
  data = [],
  headers = [],
  schema = {},
  datasetName = 'Active Dataset',
  theme = 'dark',
  onToggleTheme
}) {
  // Theme Mode State ('dark' | 'light')
  const [currentTheme, setCurrentTheme] = useState(() => {
    return theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const handleToggleThemeInternal = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_theme', nextTheme);
    }
    if (onToggleTheme) {
      onToggleTheme(nextTheme);
    }
  };

  // Navigation: 6 core tabs
  const [activeTab, setActiveTab] = useState('hub'); // hub | eda | architecture | training | streaming | code
  const [activeFolderId, setActiveFolderId] = useState('tabular_csv');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [activePipelineStep, setActivePipelineStep] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // 14-Stage Intelligent Pipeline State & Autonomous Simulator
  const [pipelineViewMode, setPipelineViewMode] = useState('dag'); // 'dag' | 'matrix' | 'inspector'
  const [pipelinePhaseFilter, setPipelinePhaseFilter] = useState('all'); // 'all' | 1 | 2 | 3 | 4
  const [pipelineActiveStepId, setPipelineActiveStepId] = useState('upload');
  const [pipelineSimActive, setPipelineSimActive] = useState(false);
  const [pipelineSimStep, setPipelineSimStep] = useState(0); // 0 = idle, 1..14 = running
  const [pipelineSimLogs, setPipelineSimLogs] = useState([]);
  const [pipelineSimSpeed, setPipelineSimSpeed] = useState(900); // ms per step
  const [pipelineSimDone, setPipelineSimDone] = useState(false);
  const [pipelineShowLogs, setPipelineShowLogs] = useState(false);
  const pipelineSimTimerRef = useRef(null);

  const handleStartPipelineSim = () => {
    setPipelineSimActive(true);
    setPipelineSimDone(false);
    const startStep = pipelineSimStep === 0 || pipelineSimDone ? 1 : pipelineSimStep;
    setPipelineSimStep(startStep);
    setPipelineActiveStepId(PIPELINE_STAGES[startStep - 1]?.id || 'upload');
    if (startStep === 1) {
      setPipelineSimLogs([
        `[00:00:01] 🚀 Autonomous Pipeline initialized. Streaming CSV buffer...`
      ]);
    }
  };

  const handlePausePipelineSim = () => {
    setPipelineSimActive(false);
  };

  const handleResetPipelineSim = () => {
    setPipelineSimActive(false);
    setPipelineSimDone(false);
    setPipelineSimStep(0);
    setPipelineActiveStepId('upload');
    setPipelineSimLogs([]);
  };

  useEffect(() => {
    if (!pipelineSimActive) {
      if (pipelineSimTimerRef.current) clearInterval(pipelineSimTimerRef.current);
      return;
    }

    pipelineSimTimerRef.current = setInterval(() => {
      setPipelineSimStep(prev => {
        if (prev >= 14) {
          clearInterval(pipelineSimTimerRef.current);
          setPipelineSimActive(false);
          setPipelineSimDone(true);
          setPipelineSimLogs(logs => [
            ...logs,
            `[00:00:14] 🎯 Pipeline Execution Finished: All 14 Stages passed! Optimal PyTorch 2.0 model locked with 94.8% ROC-AUC.`
          ]);
          return 14;
        }
        const nextStep = prev + 1;
        const stageObj = PIPELINE_STAGES[nextStep - 1];
        if (stageObj) {
          setPipelineActiveStepId(stageObj.id);
          setPipelineSimLogs(logs => [
            ...logs,
            `[Stage ${stageObj.num}/14] ✅ ${stageObj.title}: ${stageObj.simLog || stageObj.desc}`
          ]);
        }
        return nextStep;
      });
    }, pipelineSimSpeed);

    return () => {
      if (pipelineSimTimerRef.current) clearInterval(pipelineSimTimerRef.current);
    };
  }, [pipelineSimActive, pipelineSimSpeed]);

  // Active Project & Dataset State
  const [selectedProjectId, setSelectedProjectId] = useState('churn');
  const [currentDatasetRows, setCurrentDatasetRows] = useState(data && data.length > 0 ? data : REAL_WORLD_PROJECTS[0].sampleRows);
  const [currentHeaders, setCurrentHeaders] = useState(headers && headers.length > 0 ? headers : Object.keys(REAL_WORLD_PROJECTS[0].sampleRows[0]));
  const [activeDatasetTitle, setActiveDatasetTitle] = useState(datasetName || 'Customer Churn Benchmark');
  const [targetColumn, setTargetColumn] = useState('Churn');
  const [selectedRowCount, setSelectedRowCount] = useState('all');
  const [batchInferenceResults, setBatchInferenceResults] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Effective Rows Sliced/Expanded Based on Row Count Selection
  const effectiveRows = useMemo(() => {
    if (!currentDatasetRows || currentDatasetRows.length === 0) return [];
    if (selectedRowCount === 'all') return currentDatasetRows;
    const targetCount = parseInt(selectedRowCount, 10);
    if (isNaN(targetCount)) return currentDatasetRows;
    if (currentDatasetRows.length >= targetCount) {
      return currentDatasetRows.slice(0, targetCount);
    }
    const expanded = [...currentDatasetRows];
    let i = 0;
    while (expanded.length < targetCount) {
      const baseRow = currentDatasetRows[i % currentDatasetRows.length];
      const clone = { ...baseRow };
      Object.keys(clone).forEach(k => {
        const val = clone[k];
        if (typeof val === 'number') {
          const noise = (Math.random() * 0.08 - 0.04) * val;
          clone[k] = Math.round((val + noise) * 100) / 100;
        } else if (typeof val === 'string' && (k.toLowerCase().includes('id') || k.toLowerCase().includes('name'))) {
          clone[k] = `${val}_${expanded.length + 1}`;
        }
      });
      expanded.push(clone);
      i++;
    }
    return expanded;
  }, [currentDatasetRows, selectedRowCount]);

  // EDA State
  const [edaSelectedCol, setEdaSelectedCol] = useState(null);

  // Architecture Visualizer Active Model
  const [vizModel, setVizModel] = useState('tabnet');

  // Training Simulation State
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(200);
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(64);
  const [optimizer, setOptimizer] = useState('AdamW');
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainLoss, setTrainLoss] = useState(0.68);
  const [valLoss, setValLoss] = useState(0.71);
  const [trainMetric, setTrainMetric] = useState(0.74);
  const [valMetric, setValMetric] = useState(0.72);
  const trainingTimerRef = useRef(null);

  // Real-Time Event Simulation State
  const [simRunning, setSimRunning] = useState(false);
  const [simFeed, setSimFeed] = useState([]);
  const [simCounter, setSimCounter] = useState(10480);
  const [injectAnomaly, setInjectAnomaly] = useState(false);
  const simTimerRef = useRef(null);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Senior Deep Learning Architecture Assistant. I have indexed all 12 Deep Learning architecture families (CNN, RNN, Transformers, GNN, Autoencoders, Diffusion, TFT) and your active dataset. How can I optimize your neural network architecture pipeline today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Sync incoming dataset
  useEffect(() => {
    if (data && data.length > 0) {
      setCurrentDatasetRows(data);
      const h = headers && headers.length > 0 ? headers : Object.keys(data[0] || {});
      setCurrentHeaders(h);
      setActiveDatasetTitle(datasetName || 'Uploaded Dataset');
      if (h.length > 0 && !targetColumn) {
        setTargetColumn(h[h.length - 1]);
      }
    }
  }, [data, headers, datasetName]);

  // Default EDA column
  useEffect(() => {
    if (currentHeaders && currentHeaders.length > 0 && !edaSelectedCol) {
      setEdaSelectedCol(currentHeaders[1] || currentHeaders[0]);
    }
  }, [currentHeaders]);

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Switch project
  const handleSelectProject = (project) => {
    setSelectedProjectId(project.id);
    setCurrentDatasetRows(project.sampleRows);
    const h = Object.keys(project.sampleRows[0]);
    setCurrentHeaders(h);
    setActiveDatasetTitle(project.name);
    setTargetColumn(project.defaultTargetCol || h[h.length - 1]);
    setEdaSelectedCol(h[1] || h[0]);
    setActiveTab('eda');
  };

  // Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCurrentDatasetRows(results.data);
          const h = results.meta.fields || Object.keys(results.data[0]);
          setCurrentHeaders(h);
          setActiveDatasetTitle(file.name);
          setTargetColumn(h[h.length - 1]);
          setEdaSelectedCol(h[0]);
          setActiveTab('eda');
        }
      }
    });
  };

  // Computed Dataset Analysis
  const datasetAnalysis = useMemo(() => {
    const rows = effectiveRows || [];
    const rowCount = rows.length;
    const colCount = currentHeaders.length;
    if (rowCount === 0 || colCount === 0) {
      return { rowCount: 0, colCount: 0, numericalCols: [], categoricalCols: [], missingPercent: 0, qualityScore: 100, statsSummary: {} };
    }

    const numericalCols = [];
    const categoricalCols = [];
    let totalMissing = 0;
    const statsSummary = {};

    currentHeaders.forEach(col => {
      let numCount = 0;
      let validCount = 0;
      let missingInCol = 0;
      const values = [];

      rows.forEach(r => {
        const val = r[col];
        if (val === null || val === undefined || val === '') {
          missingInCol++;
        } else {
          validCount++;
          if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)))) {
            numCount++;
            values.push(parseFloat(val));
          }
        }
      });

      totalMissing += missingInCol;

      if (validCount > 0 && numCount / validCount > 0.7) {
        numericalCols.push(col);
        values.sort((a, b) => a - b);
        const sum = values.reduce((acc, v) => acc + v, 0);
        const mean = values.length > 0 ? (sum / values.length) : 0;
        const median = values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
        const min = values.length > 0 ? values[0] : 0;
        const max = values.length > 0 ? values[values.length - 1] : 0;

        statsSummary[col] = {
          mean: mean.toFixed(2),
          median: median.toFixed(2),
          min: min.toFixed(2),
          max: max.toFixed(2),
          missingCount: missingInCol,
          uniqueCount: new Set(values).size
        };
      } else {
        categoricalCols.push(col);
        const uniqueSet = new Set(rows.map(r => r[col]));
        statsSummary[col] = {
          uniqueCount: uniqueSet.size,
          topValues: Array.from(uniqueSet).slice(0, 4).join(', '),
          missingCount: missingInCol
        };
      }
    });

    const totalCells = rowCount * colCount;
    const missingPercent = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : 0;
    const qualityScore = Math.max(75, Math.round(100 - parseFloat(missingPercent) * 2));

    return {
      rowCount,
      colCount,
      numericalCols,
      categoricalCols,
      missingPercent,
      qualityScore,
      statsSummary
    };
  }, [effectiveRows, currentHeaders]);

  // Active folder details
  const activeFolder = useMemo(() => {
    return DL_FOLDERS.find(f => f.id === activeFolderId) || DL_FOLDERS[0];
  }, [activeFolderId]);

  // Models in currently selected folder
  const modelsInSelectedFolder = useMemo(() => {
    return ALGORITHM_LIBRARY.filter(algo => {
      const matchSearch = !modelSearchQuery ||
        algo.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        algo.folderName.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        algo.mathConcept.toLowerCase().includes(modelSearchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFolderId === 'all') return true;
      if (activeFolderId === 'tabular_csv') return algo.isCsvSpecialist;
      return algo.folderId === activeFolderId;
    });
  }, [activeFolderId, modelSearchQuery]);

  // Active algorithm details
  const activeAlgorithm = useMemo(() => {
    return ALGORITHM_LIBRARY.find(a => a.id === vizModel) || ALGORITHM_LIBRARY[0];
  }, [vizModel]);

  // Training Simulation Loop
  useEffect(() => {
    if (isTraining && currentEpoch < totalEpochs) {
      trainingTimerRef.current = setTimeout(() => {
        const nextEpoch = currentEpoch + 1;
        setCurrentEpoch(nextEpoch);

        const decay = Math.exp(-nextEpoch / Math.max(15, totalEpochs * 0.3));
        const newTrainLoss = Math.max(0.038, +(0.05 + 0.63 * decay + (Math.random() * 0.015 - 0.0075)).toFixed(4));
        const newValLoss = Math.max(0.065, +(0.08 + 0.63 * decay + (Math.random() * 0.02 - 0.01)).toFixed(4));
        const newTrainMetric = Math.min(0.995, +(0.99 - 0.25 * decay + (Math.random() * 0.008 - 0.004)).toFixed(4));
        const newValMetric = Math.min(0.985, +(0.97 - 0.25 * decay + (Math.random() * 0.012 - 0.006)).toFixed(4));

        setTrainLoss(newTrainLoss);
        setValLoss(newValLoss);
        setTrainMetric(newTrainMetric);
        setValMetric(newValMetric);

        const logEntry = {
          epoch: nextEpoch,
          totalEpochs: totalEpochs,
          trainLoss: newTrainLoss,
          valLoss: newValLoss,
          trainMetric: newTrainMetric,
          valMetric: newValMetric,
          timestamp: new Date().toLocaleTimeString()
        };

        setTrainingLogs(prev => [logEntry, ...prev]);

        if (nextEpoch >= totalEpochs) {
          setIsTraining(false);
        }
      }, 100);
    } else {
      clearTimeout(trainingTimerRef.current);
    }

    return () => clearTimeout(trainingTimerRef.current);
  }, [isTraining, currentEpoch, totalEpochs]);

  // Streaming Simulation Loop
  useEffect(() => {
    if (simRunning) {
      simTimerRef.current = setInterval(() => {
        setSimCounter(prev => prev + 1);
        const isAnomaly = injectAnomaly || Math.random() < 0.08;
        const latency = (Math.random() * 4 + 2.1).toFixed(1);
        const score = isAnomaly ? (Math.random() * 0.35 + 0.65).toFixed(3) : (Math.random() * 0.15 + 0.02).toFixed(3);

        const eventItem = {
          id: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: latency,
          anomalyScore: score,
          isAnomaly,
          status: isAnomaly ? 'BLOCKED / ALERT' : 'APPROVED'
        };

        setSimFeed(prev => [eventItem, ...prev.slice(0, 15)]);
      }, 600);
    } else {
      clearInterval(simTimerRef.current);
    }

    return () => clearInterval(simTimerRef.current);
  }, [simRunning, injectAnomaly]);

  // Send AI Chat
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let reply = `Based on your dataset (${activeDatasetTitle}) and selected architecture (${activeAlgorithm.name}): `;
      if (userMsg.toLowerCase().includes('overfit') || userMsg.toLowerCase().includes('loss')) {
        reply += `To mitigate overfitting in tabular deep networks, apply LayerNorm + Dropout(0.25), use Weight Decay (1e-4) in AdamW, and activate EarlyStopping(patience=5).`;
      } else if (userMsg.toLowerCase().includes('family') || userMsg.toLowerCase().includes('architecture') || userMsg.toLowerCase().includes('folder')) {
        reply += `You can navigate the 12 Architecture Folders on the left. For CSV datasets, check 'Tabular & CSV Champions' for TabNet, Deep Residual MLP, and TFT.`;
      } else {
        reply += `Your current data quality score is ${datasetAnalysis.qualityScore}%. We recommend training a ${activeAlgorithm.name} with batch size ${batchSize} and learning rate ${learningRate}.`;
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className={`dl-studio-overlay ${currentTheme === 'light' ? 'dl-light-overlay' : ''}`} onClick={onClose}>
      <div
        className={`dl-studio-modal ${isFullScreen ? 'is-fullscreen' : ''} ${currentTheme === 'light' ? 'dl-light-theme' : 'dl-dark-theme'}`}
        data-theme={currentTheme}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================================================== */}
        {/* TOP HEADER: BRAND, STATUS & HERO ACTION BUTTONS      */}
        {/* ==================================================== */}
        <div className="dl-studio-header">
          <div className="dl-studio-brand">
            <div className="dl-studio-brand-icon">
              <Brain size={16} />
            </div>
            <div>
              <div className="dl-studio-title">
                <span>DEEP LEARNING PROJECT ANALYSIS STUDIO</span>
              </div>
              <div className="dl-studio-subtitle">
                <span>Active: <strong>{activeDatasetTitle}</strong> ({datasetAnalysis.rowCount} rows)</span>
                <span>•</span>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>Quality: {datasetAnalysis.qualityScore}%</span>
              </div>
            </div>
          </div>

          {/* HERO QUICK ACTION BUTTONS */}
          <div className="dl-studio-header-actions">
            <button
              type="button"
              className="dl-action-btn dl-action-btn-primary"
              onClick={() => {
                setActiveTab('training');
                setIsTraining(true);
              }}
              title="Launch training simulator epoch loop"
            >
              <Play size={12} /> Train Model Now
            </button>

            <button
              type="button"
              className="dl-action-btn dl-action-btn-amber"
              onClick={() => {
                setActiveTab('streaming');
                setSimRunning(true);
              }}
              title="Launch real-time event streaming inference"
            >
              <Zap size={12} /> Live Streamer
            </button>

            <button
              type="button"
              className="dl-action-btn dl-action-btn-cyan"
              onClick={() => setActiveTab('eda')}
              title="Inspect dataset profiling and health metrics"
            >
              <BarChart3 size={12} /> Data Audit & EDA
            </button>

            <button
              type="button"
              className="dl-action-btn dl-action-btn-emerald"
              onClick={() => setActiveTab('code')}
              title="View & copy production PyTorch 2.0 script"
            >
              <Code size={12} /> PyTorch Code
            </button>

            {/* Quick Upload CSV */}
            <label className="dl-action-btn dl-action-btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={12} /> Upload Data
              <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {/* Theme Toggle Button (Dark / Light) */}
            <button
              type="button"
              className="dl-icon-btn dl-theme-toggle-btn"
              onClick={handleToggleThemeInternal}
              title={`Switch to ${currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
              aria-label="Toggle Theme Mode"
            >
              {currentTheme === 'dark' ? (
                <Sun size={14} style={{ color: '#fbbf24' }} />
              ) : (
                <Moon size={14} style={{ color: '#6366f1' }} />
              )}
            </button>

            {/* 📸 CAMERA HD SCREENSHOT SUITE */}
            <HDScreenshotButton
              compact={true}
              datasetName={`DeepLearning_${activeDatasetTitle || 'Project'}`}
              targetSelector=".dl-studio-modal"
              theme={currentTheme}
            />

            {/* Window Controls */}
            <button
              type="button"
              className="dl-icon-btn"
              onClick={() => setIsFullScreen(prev => !prev)}
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              className="dl-icon-btn close"
              onClick={onClose}
              title="Close DL Studio"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 6 CORE INTUITIVE NAVIGATION TABS                     */}
        {/* ==================================================== */}
        <div className="dl-studio-nav-bar">
          {[
            { id: 'hub', label: '1. Projects & Datasets', icon: Folder, count: '12 Curated' },
            { id: 'eda', label: '2. Data Audit & EDA', icon: BarChart3, count: `${datasetAnalysis.qualityScore}% Health` },
            { id: 'architecture', label: '3. DL Architectures', icon: FolderOpen, count: '12 Families' },
            { id: 'training', label: '4. Training Studio', icon: Sliders, count: `${currentEpoch}/${totalEpochs} Epochs` },
            { id: 'streaming', label: '5. SHAP & Live Stream', icon: Zap, count: 'Live Radar' },
            { id: 'code', label: '6. AI & PyTorch Code', icon: Code, count: 'Export Ready' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`dl-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={13} style={{ color: isActive ? '#a78bfa' : '#64748b' }} />
                <span>{tab.label}</span>
                <span className="dl-tab-badge">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* MAIN BODY VIEW WORKSPACES                            */}
        {/* ==================================================== */}
        <div className="dl-studio-body">

          {/* TAB 1: PROJECTS HUB & DATASET PICKER */}
          {activeTab === 'hub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="dl-card dl-card-glow">
                <div className="dl-card-header">
                  <div>
                    <h3 className="dl-card-title">
                      <Folder size={15} style={{ color: '#8b5cf6' }} />
                      Real-World Enterprise Deep Learning Projects Library
                    </h3>
                    <p style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                      Select any curated domain project to instantly load its benchmark dataset, model architecture parameters, and real-time simulator.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <label className="dl-action-btn dl-action-btn-primary" style={{ cursor: 'pointer' }}>
                      <Upload size={12} /> Upload Custom CSV / Excel
                      <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div className="dl-project-grid">
                  {REAL_WORLD_PROJECTS.map(proj => {
                    const isSelected = selectedProjectId === proj.id;
                    return (
                      <div
                        key={proj.id}
                        className={`dl-project-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectProject(proj)}
                      >
                        <div>
                          <div className="dl-project-top">
                            <span
                              className="dl-project-category"
                              style={{
                                background: `${proj.badgeColor}18`,
                                color: proj.badgeColor,
                                border: `1px solid ${proj.badgeColor}45`
                              }}
                            >
                              {proj.category}
                            </span>
                            <span className="dl-project-domain">{proj.domain}</span>
                          </div>
                          <h4 className="dl-project-name">{proj.name}</h4>
                          <p className="dl-project-desc">{proj.problem}</p>
                        </div>

                        <div>
                          <div className="dl-project-meta-row">
                            <div className="dl-project-meta-pill">
                              <span className="dl-meta-pill-label">Target:</span>
                              <span className="dl-meta-pill-val" style={{ color: '#38bdf8' }}>{proj.target}</span>
                            </div>
                            <div className="dl-project-meta-pill">
                              <span className="dl-meta-pill-label">Metric:</span>
                              <span className="dl-meta-pill-val" style={{ color: '#34d399' }}>{proj.evaluationMetric}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="dl-action-btn dl-action-btn-primary dl-launch-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProject(proj);
                            }}
                          >
                            <Play size={12} /> Launch Project & Data
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA AUDIT & INTERACTIVE EDA */}
          {activeTab === 'eda' && (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0.65rem' }}>
              {/* Left Column: Health Score & Column Selector */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <Activity size={14} style={{ color: '#06b6d4' }} /> Dataset Health
                  </h3>
                </div>

                <div className="dl-health-score-box">
                  <div className="dl-health-score-val">{datasetAnalysis.qualityScore}%</div>
                  <div className="dl-health-score-label">Data Quality Score</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.55rem' }}>
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value">{datasetAnalysis.rowCount}</span>
                    <span className="dl-metric-label">Total Rows</span>
                  </div>
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value">{datasetAnalysis.colCount}</span>
                    <span className="dl-metric-label">Columns</span>
                  </div>
                </div>

                {/* SELECT ROW BATCH / DATA VOLUME SELECTOR */}
                <label style={{ fontSize: '0.66rem', fontWeight: '750', color: '#64748b', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>SELECT ROWS TO PROCESS:</span>
                  <strong style={{ color: '#0284c7' }}>
                    {selectedRowCount === 'all' ? `All (${currentDatasetRows.length})` : `${selectedRowCount} Rows`}
                  </strong>
                </label>
                <select
                  value={selectedRowCount}
                  onChange={(e) => setSelectedRowCount(e.target.value)}
                  className="dl-select-input"
                  style={{
                    width: '100%',
                    height: '38px',
                    minHeight: '38px',
                    fontSize: '13px',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: '600',
                    padding: '6px 10px',
                    lineHeight: 'normal',
                    boxSizing: 'border-box',
                    marginBottom: '0.65rem'
                  }}
                >
                  {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 750, 1000].map(count => (
                    <option key={count} value={count}>
                      {count} Rows {count > currentDatasetRows.length ? `(Expanded Sample Batch)` : ''}
                    </option>
                  ))}
                  <option value="all">Unlimited / Full Dataset ({currentDatasetRows.length} rows)</option>
                </select>

                <label style={{ fontSize: '0.66rem', fontWeight: '750', color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>
                  SELECT FEATURE COLUMN TO PROFILE:
                </label>
                <select
                  value={edaSelectedCol || ''}
                  onChange={(e) => setEdaSelectedCol(e.target.value)}
                  className="dl-select-input"
                  style={{
                    width: '100%',
                    height: '38px',
                    minHeight: '38px',
                    fontSize: '13px',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: '600',
                    padding: '6px 10px',
                    lineHeight: 'normal',
                    boxSizing: 'border-box',
                    marginBottom: '0.75rem'
                  }}
                >
                  {currentHeaders.map(h => (
                    <option key={h} value={h}>{h} {datasetAnalysis.numericalCols.includes(h) ? '(Numerical)' : '(Categorical)'}</option>
                  ))}
                </select>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="dl-action-btn dl-action-btn-emerald"
                    style={{ width: '100%', justifyContent: 'center', height: '26px', minHeight: '26px', fontSize: '0.66rem' }}
                    onClick={() => {
                      const results = effectiveRows.map((r, idx) => {
                        const score = +(Math.random() * 0.7 + 0.25).toFixed(4);
                        const isPositive = score >= 0.5;
                        return {
                          id: r.Employee_ID || r.Customer_ID || r.ID || `ROW-${idx + 1}`,
                          rowObj: r,
                          prediction: isPositive ? (targetColumn ? `Positive (${targetColumn})` : 'Positive') : 'Negative / Retained',
                          probability: `${(score * 100).toFixed(1)}%`,
                          confidence: score > 0.75 ? 'High (98%)' : 'Standard (92%)',
                          latency: `${(Math.random() * 2.5 + 1.2).toFixed(1)}ms`
                        };
                      });
                      setBatchInferenceResults(results);
                      setShowBatchModal(true);
                    }}
                  >
                    <Cpu size={12} style={{ flexShrink: 0 }} />
                    <span>Run Batch Prediction ({datasetAnalysis.rowCount} rows)</span>
                  </button>

                  <button
                    type="button"
                    className="dl-action-btn dl-action-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', height: '26px', minHeight: '26px', fontSize: '0.66rem' }}
                    onClick={() => setActiveTab('architecture')}
                  >
                    <ArrowRight size={12} /> Proceed to 12 DL Folders
                  </button>
                </div>
              </div>

              {/* Right Column: Column Stats & Distribution Card */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <BarChart3 size={14} style={{ color: '#a855f7' }} /> Feature Distribution & Statistical Summary
                  </h3>
                  <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Inspecting: <strong style={{ color: '#38bdf8' }}>{edaSelectedCol}</strong></span>
                </div>

                {edaSelectedCol && datasetAnalysis.statsSummary[edaSelectedCol] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem' }}>
                      {Object.entries(datasetAnalysis.statsSummary[edaSelectedCol]).map(([key, val]) => {
                        const statLabels = {
                          uniqueCount: 'Unique Count',
                          topValues: 'Top Values',
                          missingCount: 'Missing Count',
                          mean: 'Mean Value',
                          median: 'Median Value',
                          std: 'Std Deviation',
                          min: 'Min Value',
                          max: 'Max Value',
                          q25: '25th Percentile',
                          q75: '75th Percentile'
                        };
                        const displayLabel = statLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        return (
                          <div key={key} className="dl-metric-tile">
                            <span className="dl-metric-value" style={{ fontSize: '0.92rem', lineHeight: '1.2' }}>{String(val)}</span>
                            <span className="dl-metric-label">{displayLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="dl-eda-preview-box">
                      <h4 className="dl-eda-preview-title">
                        Feature Values Preview:
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '160px', overflowY: 'auto' }}>
                        {currentDatasetRows.slice(0, 20).map((r, idx) => (
                          <span key={idx} className="dl-eda-value-chip">
                            {String(r[edaSelectedCol])}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: UNIQUE SPLIT-PANE CYBER ARCHITECTURE EXPLORER */}
          {activeTab === 'architecture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

              {/* MASTER-DETAIL SPLIT PANE */}
              <div className="dl-arch-split-pane">

                {/* LEFT: 12 ARCHITECTURE FAMILIES FOLDER RACK (NO TEXT TRUNCATION) */}
                <div className="dl-folder-rack">
                  <div className="dl-rack-header">
                    <span>12 Architecture Families</span>
                    <span style={{ fontSize: '0.62rem', color: '#38bdf8' }}>13 Folders</span>
                  </div>

                  {DL_FOLDERS.map(f => {
                    const isSelected = activeFolderId === f.id;
                    const IconComp = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`dl-rack-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setActiveFolderId(f.id);
                          const firstInFolder = ALGORITHM_LIBRARY.find(a => f.id === 'all' ? true : (f.id === 'tabular_csv' ? a.isCsvSpecialist : a.folderId === f.id));
                          if (firstInFolder) setVizModel(firstInFolder.id);
                        }}
                      >
                        <div className="dl-rack-icon-box" style={{ background: isSelected ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : `${f.color}18`, borderColor: isSelected ? '#a78bfa' : `${f.color}40`, color: isSelected ? '#fff' : f.color }}>
                          <IconComp size={13} />
                        </div>
                        <div className="dl-rack-text">
                          <div className="dl-rack-title">{f.title}</div>
                          <div className="dl-rack-sub">{f.count} • {f.desc.split(',')[0]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* RIGHT: ACTIVE FOLDER CANVAS & ARCHITECTURE INSPECTOR */}
                <div className="dl-canvas-pane">

                  {/* ACTIVE FOLDER BANNER */}
                  <div className="dl-folder-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <div className="dl-rack-icon-box" style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)' }}>
                        {React.createElement(activeFolder.icon, { size: 14 })}
                      </div>
                      <div>
                        <div className="dl-folder-banner-title">
                          {activeFolder.title}
                        </div>
                        <div className="dl-folder-banner-desc">
                          {activeFolder.desc}
                        </div>
                      </div>
                    </div>

                    {/* Global / Folder Search Bar */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                      <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="dl-search-input"
                      />
                    </div>
                  </div>

                  {/* MODELS CHIPS IN ACTIVE FOLDER */}
                  <div>
                    <div style={{ fontSize: '0.64rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
                      SELECT ARCHITECTURE TO INSPECT ({modelsInSelectedFolder.length} IN FOLDER):
                    </div>
                    <div className="dl-model-rack-buttons">
                      {modelsInSelectedFolder.map(algo => {
                        const isSelected = vizModel === algo.id;
                        return (
                          <button
                            key={algo.id}
                            type="button"
                            className={`dl-model-chip-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setVizModel(algo.id)}
                          >
                            <Cpu size={12} style={{ color: isSelected ? '#ffffff' : '#a78bfa' }} />
                            <span>{algo.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTIVE ARCHITECTURE SHOWCASE CANVAS */}
                  <div className="dl-card" style={{ padding: '0.85rem 1rem', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.55rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <h3 className="dl-arch-name-title">
                            {activeAlgorithm.name}
                          </h3>
                          <span style={{ fontSize: '0.62rem', color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(192, 132, 252, 0.3)', fontWeight: 'bold' }}>
                            {activeAlgorithm.folderName}
                          </span>
                        </div>
                        <div className="dl-arch-meta-sub" style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          Inference Latency: <strong style={{ color: '#38bdf8' }}>{activeAlgorithm.inferenceLatency}</strong> • Parameters: <strong style={{ color: '#34d399' }}>{activeAlgorithm.params}</strong> • Complexity: <strong style={{ color: '#fbbf24' }}>{activeAlgorithm.complexity}</strong>
                        </div>
                      </div>

                      {/* HERO ACTION BUTTONS */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="dl-action-btn dl-action-btn-primary"
                          style={{ height: '26px', minHeight: '26px', fontSize: '0.68rem', padding: '0 0.65rem' }}
                          onClick={() => {
                            setActiveTab('training');
                            setIsTraining(true);
                          }}
                        >
                          <Play size={12} /> Train In Studio
                        </button>
                        <button
                          type="button"
                          className="dl-action-btn dl-action-btn-amber"
                          style={{ height: '26px', minHeight: '26px', fontSize: '0.68rem', padding: '0 0.65rem' }}
                          onClick={() => {
                            setActiveTab('streaming');
                            setSimRunning(true);
                          }}
                        >
                          <Zap size={12} /> Live Stream Test
                        </button>
                        <button
                          type="button"
                          className="dl-action-btn dl-action-btn-emerald"
                          style={{ height: '26px', minHeight: '26px', fontSize: '0.68rem', padding: '0 0.65rem' }}
                          onClick={() => setActiveTab('code')}
                        >
                          <Code size={12} /> PyTorch Code
                        </button>
                      </div>
                    </div>

                    {/* DYNAMIC FORWARD PASS TENSOR FLOW DIAGRAM */}
                    <div className="dl-flow-graph-container">
                      <div className="dl-flow-graph-title">
                        <Layers3 size={13} style={{ color: '#a855f7' }} /> Forward Pass Tensor Computational Graph
                      </div>

                      <div className="dl-flow-node-track">
                        {(activeAlgorithm.pipelineNodes || [
                          { name: 'Input Tensor', shape: '[Batch, Features]', icon: Database, color: '#38bdf8' },
                          { name: 'Hidden Layer', shape: '[Batch, 128]', icon: Layers, color: '#a855f7' },
                          { name: 'Output Head', shape: '[Batch, 1]', icon: Target, color: '#10b981' }
                        ]).map((node, nIdx, arr) => {
                          const NodeIcon = node.icon || Cpu;
                          return (
                            <React.Fragment key={nIdx}>
                              <div className="dl-layer-node" style={{ borderColor: node.color, flexShrink: 0, minWidth: '120px' }}>
                                <NodeIcon size={14} style={{ color: node.color, flexShrink: 0 }} />
                                <div style={{ overflow: 'hidden' }}>
                                  <div className="dl-layer-node-name">{node.name}</div>
                                  <div className="dl-layer-node-shape">{node.shape}</div>
                                </div>
                              </div>
                              {nIdx < arr.length - 1 && (
                                <ArrowRight size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* SPECIFICATIONS & FORMULATION DUAL GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                      <div className="dl-spec-card">
                        <div className="dl-spec-card-title-cyan">
                          Mathematical Mechanism & Concept
                        </div>
                        <p className="dl-spec-card-text">
                          {activeAlgorithm.mathConcept}
                        </p>
                        <div className="dl-spec-formula-box">
                          {activeAlgorithm.latexFormula}
                        </div>
                      </div>

                      <div className="dl-spec-card">
                        <div className="dl-spec-card-title-emerald">
                          Performance Strengths & Ideal Datasets
                        </div>
                        <p className="dl-spec-card-text">
                          <strong style={{ color: '#059669' }}>Strengths:</strong> {activeAlgorithm.strengths}
                        </p>
                        <p className="dl-spec-card-text" style={{ color: '#64748b', marginBottom: 0 }}>
                          <strong style={{ color: '#0284c7' }}>Best Datasets:</strong> {activeAlgorithm.bestDataset}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* NEXT-GEN 14-STAGE INTELLIGENT AUTONOMOUS CSV PIPELINE SUITE */}
              <div className="dl-pipeline-suite-card">
                {/* 1. HEADER BAR */}
                <div className="dl-pipeline-header-bar">
                  <div className="dl-pipeline-title-group">
                    <h4>
                      <Workflow size={16} style={{ color: '#38bdf8' }} />
                      Intelligent End-to-End CSV Model-Selection & Execution Pipeline
                    </h4>
                    <p>
                      Automated decision engine and neural compiler transforming raw CSV tabular data into optimized, quantized PyTorch 2.0 / ONNX production models.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.66rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(56, 189, 248, 0.4)', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Zap size={11} /> 14 Active Autonomous Stages
                    </span>
                    <span style={{ fontSize: '0.66rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={11} /> PyTorch 2.0 Ready
                    </span>
                  </div>
                </div>

                {/* 2. AUTONOMOUS SIMULATION CONTROL & TELEMETRY BAR */}
                <div className="dl-pipeline-sim-bar">
                  <div className="dl-pipeline-sim-controls">
                    {!pipelineSimActive ? (
                      <button
                        type="button"
                        className="dl-pipeline-btn-primary"
                        onClick={handleStartPipelineSim}
                      >
                        <Play size={13} />
                        {pipelineSimStep === 0 ? '▶ Run Autonomous AI Pipeline' : '▶ Resume Simulation'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dl-pipeline-btn-primary"
                        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: 'rgba(245, 158, 11, 0.6)' }}
                        onClick={handlePausePipelineSim}
                      >
                        <Pause size={13} /> Pause Pipeline
                      </button>
                    )}

                    <button
                      type="button"
                      className="dl-pipeline-btn-secondary"
                      onClick={handleResetPipelineSim}
                      title="Reset Pipeline to Initial State"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>

                    <div className="dl-pipeline-speed-box">
                      {[
                        { label: '1x', val: 900 },
                        { label: '2x', val: 450 },
                        { label: '4x', val: 200 }
                      ].map(spd => (
                        <button
                          key={spd.label}
                          type="button"
                          className={`dl-pipeline-speed-btn ${pipelineSimSpeed === spd.val ? 'active' : ''}`}
                          onClick={() => setPipelineSimSpeed(spd.val)}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`dl-pipeline-btn-secondary ${pipelineShowLogs ? 'active' : ''}`}
                      onClick={() => setPipelineShowLogs(!pipelineShowLogs)}
                      style={{ color: pipelineShowLogs ? '#34d399' : '#cbd5e1' }}
                    >
                      <Terminal size={12} /> {pipelineShowLogs ? 'Hide Logs' : 'Live Logs'}
                    </button>
                  </div>

                  {/* REAL-TIME PROGRESS BAR */}
                  <div className="dl-pipeline-progress-container">
                    <div className="dl-pipeline-progress-header">
                      <span style={{ color: '#94a3b8' }}>
                        {pipelineSimActive
                          ? `⚡ Executing Stage ${pipelineSimStep}/14: ${PIPELINE_STAGES[pipelineSimStep - 1]?.title}`
                          : pipelineSimDone
                            ? '🎉 Pipeline Completed: All 14 Stages Passed & Quantized'
                            : pipelineSimStep > 0
                              ? `Paused at Stage ${pipelineSimStep}/14`
                              : 'Ready to Execute Autonomous Compilation'}
                      </span>
                      <span style={{ color: pipelineSimDone ? '#34d399' : '#38bdf8' }}>
                        {pipelineSimDone ? '100%' : `${Math.round((pipelineSimStep / 14) * 100)}%`}
                      </span>
                    </div>
                    <div className="dl-pipeline-progress-bar-bg">
                      <div
                        className="dl-pipeline-progress-bar-fill"
                        style={{ width: `${pipelineSimDone ? 100 : (pipelineSimStep / 14) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE TERMINAL LOGS DRAWER */}
                {pipelineShowLogs && (
                  <div className="dl-pipeline-terminal-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem' }}>
                        <Terminal size={12} style={{ color: '#38bdf8' }} /> AUTONOMOUS AI PIPELINE TELEMETRY CONSOLE
                      </span>
                      <span style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: '600' }}>
                        {pipelineSimLogs.length} events logged
                      </span>
                    </div>
                    {pipelineSimLogs.length === 0 ? (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '0.3rem 0', fontSize: '0.66rem' }}>
                        No events logged yet. Click "▶ Run Autonomous AI Pipeline" to stream live execution telemetry...
                      </div>
                    ) : (
                      pipelineSimLogs.map((log, idx) => (
                        <div key={idx} className={`dl-pipeline-terminal-line ${log.includes('Finished') ? 'success' : ''}`}>
                          <ChevronRight size={11} style={{ flexShrink: 0, marginTop: '2px', color: '#38bdf8' }} />
                          <span style={{ color: log.includes('Finished') ? '#34d399' : '#e2e8f0', fontSize: '0.66rem' }}>{log}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. NAVIGATION BAR: FILTER TABS & VIEW TOGGLE */}
                <div className="dl-pipeline-nav-bar">
                  {/* Phase Filter Buttons */}
                  <div className="dl-pipeline-filter-pills">
                    <button
                      type="button"
                      className={`dl-pipeline-filter-btn ${pipelinePhaseFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setPipelinePhaseFilter('all')}
                    >
                      All 14 Stages
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-filter-btn ${pipelinePhaseFilter === 1 ? 'active' : ''}`}
                      onClick={() => setPipelinePhaseFilter(1)}
                      style={{ color: pipelinePhaseFilter === 1 ? '#10b981' : undefined }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Phase 1: Ingestion & DNA (3)
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-filter-btn ${pipelinePhaseFilter === 2 ? 'active' : ''}`}
                      onClick={() => setPipelinePhaseFilter(2)}
                      style={{ color: pipelinePhaseFilter === 2 ? '#a78bfa' : undefined }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
                      Phase 2: Intelligence (4)
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-filter-btn ${pipelinePhaseFilter === 3 ? 'active' : ''}`}
                      onClick={() => setPipelinePhaseFilter(3)}
                      style={{ color: pipelinePhaseFilter === 3 ? '#fbbf24' : undefined }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                      Phase 3: Training & Tuning (3)
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-filter-btn ${pipelinePhaseFilter === 4 ? 'active' : ''}`}
                      onClick={() => setPipelinePhaseFilter(4)}
                      style={{ color: pipelinePhaseFilter === 4 ? '#38bdf8' : undefined }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
                      Phase 4: Production & Edge (4)
                    </button>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="dl-pipeline-view-btns">
                    <button
                      type="button"
                      className={`dl-pipeline-view-tab ${pipelineViewMode === 'dag' ? 'active' : ''}`}
                      onClick={() => setPipelineViewMode('dag')}
                    >
                      <Network size={12} /> Flow DAG
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-view-tab ${pipelineViewMode === 'matrix' ? 'active' : ''}`}
                      onClick={() => setPipelineViewMode('matrix')}
                    >
                      <Layers3 size={12} /> 4-Phase Matrix
                    </button>
                    <button
                      type="button"
                      className={`dl-pipeline-view-tab ${pipelineViewMode === 'inspector' ? 'active' : ''}`}
                      onClick={() => setPipelineViewMode('inspector')}
                    >
                      <Code size={12} /> Deep Inspector
                    </button>
                  </div>
                </div>

                {/* 4. MAIN WORKFLOW VIEWS */}
                {/* VIEW 1: FLOW DAG */}
                {pipelineViewMode === 'dag' && (
                  <div className="dl-pipeline-dag-grid">
                    {PIPELINE_STAGES
                      .filter(st => pipelinePhaseFilter === 'all' || st.phase === pipelinePhaseFilter)
                      .map((st) => {
                        const stepIndex = parseInt(st.num, 10);
                        const isSimActive = pipelineSimStep === stepIndex;
                        const isCompleted = pipelineSimDone || pipelineSimStep > stepIndex;
                        const isInspected = pipelineActiveStepId === st.id;
                        const IconComp = st.icon;

                        return (
                          <div
                            key={st.id}
                            className={`dl-pipeline-stage-card ${isInspected ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isSimActive ? 'sim-active' : ''}`}
                            onClick={() => setPipelineActiveStepId(st.id)}
                          >
                            <div>
                              <div className="dl-pipeline-card-top">
                                <span
                                  className="dl-pipeline-step-badge"
                                  style={{
                                    background: `${st.phaseColor}20`,
                                    color: st.phaseColor,
                                    border: `1px solid ${st.phaseColor}40`
                                  }}
                                >
                                  STAGE {st.num}
                                </span>
                                <div
                                  className="dl-pipeline-card-icon-box"
                                  style={{
                                    background: `${st.phaseColor}15`,
                                    borderColor: `${st.phaseColor}30`,
                                    color: st.phaseColor
                                  }}
                                >
                                  <IconComp size={13} />
                                </div>
                              </div>

                              <div className="dl-pipeline-card-main-info" style={{ marginTop: '0.4rem' }}>
                                <div className="dl-pipeline-card-title">{st.title}</div>
                                <div className="dl-pipeline-card-subtitle">{st.subtitle}</div>
                              </div>

                              <div className="dl-pipeline-card-analogy" style={{ marginTop: '0.35rem' }}>
                                💡 {st.easyAnalogy}
                              </div>

                              <div className="dl-pipeline-tech-tag-list" style={{ marginTop: '0.4rem' }}>
                                {st.techStack.slice(0, 3).map((tech, tIdx) => (
                                  <span key={tIdx} className="dl-pipeline-tech-tag">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="dl-pipeline-card-footer">
                              <span
                                className="dl-pipeline-status-pill"
                                style={{
                                  color: isCompleted ? '#34d399' : isSimActive ? '#38bdf8' : '#94a3b8'
                                }}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 size={11} style={{ color: '#34d399' }} /> Passed
                                  </>
                                ) : isSimActive ? (
                                  <>
                                    <RefreshCw size={11} className="dl-spin" style={{ color: '#38bdf8' }} /> Running
                                  </>
                                ) : (
                                  <>
                                    <Clock size={11} /> Standby
                                  </>
                                )}
                              </span>

                              <button
                                type="button"
                                className="dl-pipeline-action-jump-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (st.targetTab) setActiveTab(st.targetTab);
                                }}
                              >
                                Jump <MoveRight size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* VIEW 2: 4-PHASE MATRIX */}
                {pipelineViewMode === 'matrix' && (
                  <div className="dl-pipeline-matrix-grid">
                    {[
                      { num: 1, title: 'Phase 1: Ingestion & DNA', color: '#10b981', desc: 'Zero-copy Arrow data intake & statistical health profiling' },
                      { num: 2, title: 'Phase 2: Automated Intelligence', color: '#8b5cf6', desc: 'Problem inference, feature engineering & neural matching' },
                      { num: 3, title: 'Phase 3: Training & Tuning', color: '#f59e0b', desc: 'Bayesian hyperopt, AdamW backprop & multi-metric validation' },
                      { num: 4, title: 'Phase 4: Production & Edge', color: '#38bdf8', desc: 'SHAP explainability, INT8 quantization & cloud deployment' }
                    ].map(phase => {
                      const phaseStages = PIPELINE_STAGES.filter(s => s.phase === phase.num);
                      return (
                        <div key={phase.num} className="dl-pipeline-phase-column">
                          <div className="dl-pipeline-phase-col-header">
                            <div className="dl-pipeline-phase-col-title" style={{ color: phase.color }}>
                              <span style={{ width: 9, height: 9, borderRadius: '50%', background: phase.color, display: 'inline-block' }} />
                              {phase.title}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {phaseStages.length} Stages
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>
                            {phase.desc}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' }}>
                            {phaseStages.map(st => {
                              const stepIndex = parseInt(st.num, 10);
                              const isSimActive = pipelineSimStep === stepIndex;
                              const isCompleted = pipelineSimDone || pipelineSimStep > stepIndex;
                              const isInspected = pipelineActiveStepId === st.id;
                              const IconComp = st.icon;

                              return (
                                <div
                                  key={st.id}
                                  className={`dl-pipeline-stage-card ${isInspected ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isSimActive ? 'sim-active' : ''}`}
                                  style={{ padding: '0.75rem' }}
                                  onClick={() => setPipelineActiveStepId(st.id)}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '6px',
                                          background: `${phase.color}20`,
                                          color: phase.color,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.7rem',
                                          fontWeight: '800'
                                        }}
                                      >
                                        {st.num}
                                      </div>
                                      <div>
                                        <div className="dl-pipeline-card-title" style={{ fontSize: '0.8rem' }}>
                                          {st.title}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: phase.color, fontWeight: '700' }}>
                                          {st.subtitle}
                                        </div>
                                      </div>
                                    </div>
                                    <IconComp size={15} style={{ color: phase.color }} />
                                  </div>

                                  <div className="dl-pipeline-card-analogy" style={{ fontSize: '0.7rem', marginTop: '0.35rem', lineHeight: 1.35 }}>
                                    {st.easyAnalogy}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 5. EXPANDED DEEP TECHNICAL INSPECTOR DRAWER */}
                {(() => {
                  const activeStage = PIPELINE_STAGES.find(s => s.id === pipelineActiveStepId) || PIPELINE_STAGES[0];
                  const IconComp = activeStage.icon;
                  const isCopied = copiedKey === `pipeline_code_${activeStage.id}`;

                  return (
                    <div className="dl-pipeline-inspector-card" style={{ borderTop: `2px solid ${activeStage.phaseColor}` }}>
                      <div className="dl-pipeline-inspector-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: `${activeStage.phaseColor}20`,
                              border: `1px solid ${activeStage.phaseColor}50`,
                              color: activeStage.phaseColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <IconComp size={14} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ fontSize: '0.62rem', background: `${activeStage.phaseColor}25`, color: activeStage.phaseColor, padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '900' }}>
                                STAGE {activeStage.num} OF 14
                              </span>
                              <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                                {activeStage.phaseName}
                              </span>
                            </div>
                            <h3 className="dl-inspector-stage-title" style={{ margin: '0.15rem 0 0 0' }}>
                              {activeStage.title} — {activeStage.subtitle}
                            </h3>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="dl-pipeline-btn-primary"
                            style={{ height: '26px', minHeight: '26px', fontSize: '0.68rem', padding: '0 0.65rem' }}
                            onClick={() => {
                              if (activeStage.targetTab) setActiveTab(activeStage.targetTab);
                            }}
                          >
                            <Sparkles size={12} /> Jump to {activeStage.targetTab.toUpperCase()} Studio
                          </button>
                        </div>
                      </div>

                      <div className="dl-pipeline-inspector-grid">
                        {/* Left: Plain English Concept & Tensor Flow */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          <div>
                            <label className="dl-inspector-label">
                              💡 How It Works (In Plain English):
                            </label>
                            <div className="dl-inspector-analogy-box" style={{ borderLeft: `3px solid ${activeStage.phaseColor}` }}>
                              {activeStage.easyAnalogy}
                            </div>
                          </div>

                          <div>
                            <label className="dl-inspector-label">
                              🧬 Input ➔ Transformation ➔ Output Tensor Flow:
                            </label>
                            <div className="dl-pipeline-tensor-flow-box" style={{ marginTop: '0.25rem' }}>
                              <Layers size={13} style={{ color: activeStage.phaseColor, flexShrink: 0 }} />
                              <span>{activeStage.tensorFlow}</span>
                            </div>
                          </div>

                          <div>
                            <label className="dl-inspector-label">
                              ⚡ Real-Time Telemetry & Modern Tech Stack:
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                              {activeStage.techStack.map((t, idx) => (
                                <span key={idx} className="dl-inspector-tech-pill">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#34d399', marginTop: '0.35rem', fontWeight: '700' }}>
                              📊 {activeStage.telemetry}
                            </div>
                          </div>
                        </div>

                        {/* Right: Production PyTorch / Python Code Snippet */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <label className="dl-inspector-label">
                              💻 Under-The-Hood PyTorch 2.0 Logic:
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(activeStage.codeSnippet);
                                setCopiedKey(`pipeline_code_${activeStage.id}`);
                                setTimeout(() => setCopiedKey(null), 2000);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCopied ? '#34d399' : '#94a3b8',
                                fontSize: '0.66rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer'
                              }}
                            >
                              {isCopied ? <Check size={11} /> : <Copy size={11} />} {isCopied ? 'Copied!' : 'Copy Snippet'}
                            </button>
                          </div>

                          <pre className="dl-pipeline-code-preview">
                            <code>{activeStage.codeSnippet}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

          {/* TAB 4: TRAINING & HYPERPARAMETER STUDIO */}
          {activeTab === 'training' && (
            <div className="dl-training-grid">
              {/* Left Column: Hyperparameter Controls & Triggers */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <Sliders size={18} style={{ color: '#8b5cf6' }} /> Training Hyperparameters
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      ACTIVE MODEL TO TRAIN:
                    </label>
                    <select
                      value={vizModel}
                      onChange={(e) => setVizModel(e.target.value)}
                      className="dl-select-input"
                    >
                      {ALGORITHM_LIBRARY.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      OPTIMIZER:
                    </label>
                    <select
                      value={optimizer}
                      onChange={(e) => setOptimizer(e.target.value)}
                      className="dl-select-input"
                    >
                      <option value="AdamW">AdamW (Decoupled Weight Decay)</option>
                      <option value="Adam">Adam (Adaptive Moment)</option>
                      <option value="SGD">SGD with Nesterov Momentum</option>
                      <option value="RMSprop">RMSprop</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span>LEARNING RATE:</span>
                      <strong style={{ color: '#38bdf8' }}>{learningRate}</strong>
                    </label>
                    <input
                      type="range"
                      min="0.0001"
                      max="0.01"
                      step="0.0005"
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      BATCH SIZE:
                    </label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value))}
                      className="dl-select-input"
                    >
                      <option value={32}>32 (Higher stochasticity)</option>
                      <option value={64}>64 (Recommended balanced)</option>
                      <option value={128}>128 (Faster GPU throughput)</option>
                      <option value={256}>256 (Large batch)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span>TRAINING EPOCHS:</span>
                      <strong style={{ color: '#38bdf8' }}>{totalEpochs}</strong>
                    </label>
                    <select
                      value={totalEpochs}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTotalEpochs(val);
                        if (currentEpoch > val) setCurrentEpoch(0);
                      }}
                      className="dl-select-input"
                    >
                      {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500].map(ep => (
                        <option key={ep} value={ep}>
                          {ep} Epochs {ep === 200 ? '(Recommended)' : ep === 25 ? '(Fast Baseline)' : ep === 500 ? '(Max Convergence)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Play / Pause / Reset Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="dl-action-btn dl-action-btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setIsTraining(prev => !prev)}
                    >
                      {isTraining ? <Pause size={14} /> : <Play size={14} />}
                      {isTraining ? 'Pause' : (currentEpoch >= totalEpochs ? 'Restart' : 'Train Epochs')}
                    </button>

                    <button
                      type="button"
                      className="dl-action-btn dl-action-btn-secondary"
                      onClick={() => {
                        setIsTraining(false);
                        setCurrentEpoch(0);
                        setTrainingLogs([]);
                        setTrainLoss(0.68);
                        setValLoss(0.71);
                      }}
                      title="Reset training simulator"
                    >
                      <RefreshCw size={14} /> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Curves & Loss Metrics */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <LineChart size={18} style={{ color: '#10b981' }} /> Live Epoch Loss & Validation Curves
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Epoch: <strong>{currentEpoch} / {totalEpochs}</strong></span>
                </div>

                <div className="dl-metrics-row">
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value" style={{ color: '#38bdf8' }}>{trainLoss}</span>
                    <span className="dl-metric-label">Train Loss</span>
                  </div>
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value" style={{ color: '#a855f7' }}>{valLoss}</span>
                    <span className="dl-metric-label">Val Loss</span>
                  </div>
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value" style={{ color: '#34d399' }}>{trainMetric}</span>
                    <span className="dl-metric-label">Train Metric</span>
                  </div>
                  <div className="dl-metric-tile">
                    <span className="dl-metric-value" style={{ color: '#fbbf24' }}>{valMetric}</span>
                    <span className="dl-metric-label">Val Metric</span>
                  </div>
                </div>

                {/* Live Training Terminal */}
                <div className="dl-terminal">
                  <div className="dl-terminal-header">
                    <Terminal size={14} style={{ color: '#38bdf8' }} />
                    <span>=== PyTorch 2.0 Real-Time Training Simulator Logs ===</span>
                  </div>
                  {trainingLogs.length === 0 ? (
                    <div className="dl-terminal-empty">Click "Train Epochs" to start live gradient descent backpropagation...</div>
                  ) : (
                    trainingLogs.slice(0, 12).map((l, i) => (
                      <div key={i} className="dl-log-line">
                        <span className="dl-log-epoch">[Epoch {l.epoch}/{l.totalEpochs || totalEpochs}]</span>
                        <span className="dl-log-train">train_loss={l.trainLoss}</span>
                        <span className="dl-log-val">val_loss={l.valLoss}</span>
                        <span className="dl-log-metric">metric={l.valMetric}</span>
                        <span className="dl-log-time">{l.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHAP EXPLAINABILITY & REAL-TIME STREAM */}
          {activeTab === 'streaming' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* SHAP Feature Attribution */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <Eye size={18} style={{ color: '#ec4899' }} /> SHAP Feature Attribution Waterfall
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Instance Level Impact</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { feature: currentHeaders[0] || 'Feature_1', value: '+0.342', positive: true, pct: 75 },
                    { feature: currentHeaders[1] || 'Feature_2', value: '-0.215', positive: false, pct: 50 },
                    { feature: currentHeaders[2] || 'Feature_3', value: '+0.180', positive: true, pct: 42 },
                    { feature: currentHeaders[3] || 'Feature_4', value: '+0.125', positive: true, pct: 30 },
                    { feature: currentHeaders[4] || 'Feature_5', value: '-0.090', positive: false, pct: 20 }
                  ].map((item, idx) => (
                    <div key={idx} className="dl-shap-bar-row">
                      <span className="dl-shap-feature-name">{item.feature}</span>
                      <div className="dl-shap-bar-track">
                        <div
                          className={`dl-shap-bar-fill ${item.positive ? 'positive' : 'negative'}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span style={{ width: '50px', textAlign: 'right', fontWeight: 'bold', color: item.positive ? '#fb7185' : '#38bdf8' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-Time Live Streaming Radar */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <Zap size={18} style={{ color: '#fbbf24' }} /> High-Speed Event Stream Simulator
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="dl-action-btn dl-action-btn-amber"
                      onClick={() => setSimRunning(prev => !prev)}
                    >
                      {simRunning ? <Pause size={13} /> : <Play size={13} />}
                      {simRunning ? 'Stop Stream' : 'Start Stream'}
                    </button>
                  </div>
                </div>

                <div className="dl-stream-anomaly-box">
                  <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={injectAnomaly}
                      onChange={(e) => setInjectAnomaly(e.target.checked)}
                    />
                    <span>Inject Anomalous Test Vectors</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 'bold' }}>
                    Stream Events: {simCounter}
                  </span>
                </div>

                <div className="dl-terminal" style={{ height: '220px' }}>
                  <div className="dl-terminal-header">
                    <Zap size={14} style={{ color: '#fbbf24' }} />
                    <span>=== Real-Time High-Throughput Inference Feed ===</span>
                  </div>
                  {simFeed.length === 0 ? (
                    <div className="dl-terminal-empty">Click "Start Stream" to simulate high-throughput inference...</div>
                  ) : (
                    simFeed.map((evt, idx) => (
                      <div key={idx} className="dl-log-line">
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{evt.id}</span>
                        <span className="dl-log-train">latency={evt.latencyMs}ms</span>
                        <span className="dl-log-val">anomaly_score={evt.anomalyScore}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: evt.isAnomaly ? '#f43f5e' : '#10b981' }}>
                          {evt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI ASSISTANT & PYTORCH CODE EXPORT */}
          {activeTab === 'code' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Left Column: Production PyTorch Code Viewer */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <Code size={18} style={{ color: '#10b981' }} /> Production PyTorch 2.0 Code: {activeAlgorithm.name}
                  </h3>
                  <button
                    type="button"
                    className="dl-action-btn dl-action-btn-emerald"
                    onClick={() => handleCopy(`# PyTorch 2.0 Implementation of ${activeAlgorithm.name}\nimport torch\nimport torch.nn as nn\n\nclass EnterpriseModel(nn.Module):\n    def __init__(self, in_features=${datasetAnalysis.colCount}, hidden_dim=128):\n        super().__init__()\n        self.encoder = nn.Sequential(\n            nn.Linear(in_features, hidden_dim),\n            nn.LayerNorm(hidden_dim),\n            nn.GELU(),\n            nn.Dropout(0.25)\n        )\n        self.residual = nn.Sequential(\n            nn.Linear(hidden_dim, hidden_dim),\n            nn.LayerNorm(hidden_dim),\n            nn.GELU(),\n            nn.Dropout(0.25)\n        )\n        self.head = nn.Linear(hidden_dim, 1)\n\n    def forward(self, x):\n        h = self.encoder(x)\n        h = h + self.residual(h)\n        return torch.sigmoid(self.head(h))\n`, 'pytorch')}
                  >
                    {copiedKey === 'pytorch' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === 'pytorch' ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>

                <pre className="dl-pipeline-code-preview" style={{ maxHeight: '440px' }}>
                  {`# Complete PyTorch 2.0 Production Script for ${activeDatasetTitle}
# Architecture: ${activeAlgorithm.name} (${activeAlgorithm.folderName})
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

class ModelArchitecture(nn.Module):
    def __init__(self, in_dim=${datasetAnalysis.colCount}, hidden_dim=128):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.25)
        )
        self.residual_block = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.25)
        )
        self.output_head = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        h = self.encoder(x)
        h = h + self.residual_block(h) # Residual connection
        return torch.sigmoid(self.output_head(h))

# Model & Optimizer Initialization
model = ModelArchitecture()
optimizer = torch.optim.${optimizer}(model.parameters(), lr=${learningRate})
criterion = nn.BCELoss()`}
                </pre>
              </div>

              {/* Right Column: AI Senior DL Assistant Chat */}
              <div className="dl-card">
                <div className="dl-card-header">
                  <h3 className="dl-card-title">
                    <MessageSquare size={18} style={{ color: '#8b5cf6' }} /> Senior AI Architecture Assistant
                  </h3>
                </div>

                <div className="dl-chat-container">
                  <div className="dl-chat-messages">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`dl-chat-bubble ${msg.sender}`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  <div className="dl-chat-input-bar">
                    <input
                      type="text"
                      placeholder="Ask about CNNs, Transformers, Diffusion, GNNs, PPO, TabNet..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <button
                      type="button"
                      className="dl-action-btn dl-action-btn-primary"
                      onClick={handleSendChat}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BATCH INFERENCE RESULTS MODAL OVERLAY */}
        {showBatchModal && batchInferenceResults && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
          >
            <div
              className="dl-card"
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                animation: 'dl-scale-up 0.2s ease-out'
              }}
            >
              <div className="dl-card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Cpu size={20} style={{ color: '#10b981' }} />
                  <div>
                    <h3 className="dl-card-title" style={{ fontSize: '1rem', margin: 0 }}>
                      Neural Batch Inference Results
                    </h3>
                    <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
                      Processed <strong>{batchInferenceResults.length}</strong> rows using architecture: <strong>{activeAlgorithm.name}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="dl-action-btn dl-action-btn-emerald"
                    onClick={() => {
                      const headers = ['Row_ID', 'Predicted_Outcome', 'Confidence_Probability', 'Confidence_Level', 'Inference_Latency'];
                      const csvRows = batchInferenceResults.map(r => `"${r.id}","${r.prediction}","${r.probability}","${r.confidence}","${r.latency}"`);
                      const csvContent = [headers.join(','), ...csvRows].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `neural_batch_predictions_${batchInferenceResults.length}_rows.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={13} /> Export CSV
                  </button>

                  <button
                    type="button"
                    className="dl-action-btn dl-action-btn-secondary"
                    onClick={() => setShowBatchModal(false)}
                  >
                    <X size={14} /> Close
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '0.6rem 0.75rem' }}>#</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Row Identifier</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Predicted Outcome</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Probability</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Confidence</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Inference Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchInferenceResults.slice(0, 100).map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                        <td style={{ padding: '0.55rem 0.75rem', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 'bold', color: '#38bdf8' }}>{r.id}</td>
                        <td style={{ padding: '0.55rem 0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: r.prediction.includes('Positive') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: r.prediction.includes('Positive') ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                            {r.prediction}
                          </span>
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 'bold' }}>{r.probability}</td>
                        <td style={{ padding: '0.55rem 0.75rem', color: '#a78bfa' }}>{r.confidence}</td>
                        <td style={{ padding: '0.55rem 0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchInferenceResults.length > 100 && (
                  <div style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                    Showing first 100 of {batchInferenceResults.length} predicted rows. Use "Export CSV" to download the complete results.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
