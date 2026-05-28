-- =========================================================================
-- FLUSH: Truncate all tables EXCEPT profiles_arcworker
-- Run this on Supabase SQL Editor
-- =========================================================================

truncate table public.application_status_overlay_arcworker cascade;
truncate table public.ai_evaluations_arcworker cascade;
truncate table public.job_reviews_arcworker cascade;
truncate table public.job_submissions_arcworker cascade;
truncate table public.job_applications_arcworker cascade;
truncate table public.job_messages_arcworker cascade;
truncate table public.job_invitations_arcworker cascade;
truncate table public.saved_jobs_arcworker cascade;
truncate table public.onchain_transactions_arcworker cascade;
truncate table public.onchain_events_arcworker cascade;
truncate table public.notifications_arcworker cascade;
truncate table public.jobs_arcworker cascade;
truncate table public.agents_arcworker cascade;
truncate table public.wallet_sessions_arcworker cascade;
truncate table public.wallet_nonces_arcworker cascade;
truncate table public.indexer_state_arcworker cascade;

-- =========================================================================
-- SEED: 210 Realistic job listings
-- Client  = 531a9807-1f7f-4607-9aa1-bd0796c24fcb
-- Provider = 14c35d5a-7706-4feb-b125-a99d79b8cbc0
-- budget_usdc_units = amount in USDC × 1,000,000 (6 decimals)
-- =========================================================================

insert into public.jobs_arcworker (
  id, client_profile_id, provider_profile_id, actor_type,
  title, brief, acceptance_criteria, deliverable_format, category, tags,
  budget_usdc_units, platform_fee_bps, deadline_at, status,
  created_at, updated_at
) values

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Smart Contract Security Audit for DeFi Lending Protocol',
  'We need a comprehensive security audit of our DeFi lending protocol deployed on Arc. The protocol includes lending pools, collateral management, and liquidation logic across 4 Solidity contracts (~2,000 lines total). Looking for an experienced auditor familiar with common DeFi attack vectors including flash loan exploits, reentrancy, and oracle manipulation.',
  '1. Full audit report covering all 4 contracts with severity-rated findings (Critical/High/Medium/Low/Informational). 2. Proof-of-concept exploits for any Critical or High findings. 3. Remediation recommendations for each finding. 4. Gas optimization suggestions.',
  'PDF audit report + GitHub repo with PoC tests',
  'Security',
  '{"Solidity", "Smart Contract Audit", "DeFi", "Arc", "Security"}',
  3500000000, 100, now() + interval '21 days', 'open',
  now() - interval '2 hours', now() - interval '2 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Build NFT Marketplace Frontend with Arc Wallet Integration',
  'Looking for a skilled frontend developer to build a modern NFT marketplace UI that connects to our existing Arc smart contracts. The marketplace should support minting, listing, buying, and auctioning NFTs. Must integrate with MetaMask and WalletConnect for Arc chain. Design mockups will be provided in Figma.',
  '1. Responsive Next.js app with TypeScript. 2. Wallet connection (MetaMask + WalletConnect) on Arc testnet. 3. NFT gallery with grid/list views, search, and filtering. 4. Mint, list, buy, and auction flows fully functional. 5. Transaction status tracking with toast notifications. 6. Mobile-friendly design matching provided Figma mockups.',
  'GitHub repository with README, deployed preview on Vercel',
  'Frontend Development',
  '{"Next.js", "TypeScript", "Web3", "NFT", "Arc", "React"}',
  2800000000, 100, now() + interval '30 days', 'open',
  now() - interval '5 hours', now() - interval '5 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Build REST API for On-Chain Analytics Dashboard',
  'We need a backend API service that indexes Arc blockchain data and serves analytics endpoints for our dashboard. The API should track wallet activity, token transfers, smart contract interactions, and provide aggregated statistics. Must handle real-time WebSocket updates for new blocks and transactions.',
  '1. Node.js/TypeScript API with Express or Fastify. 2. PostgreSQL database with proper indexing for query performance. 3. Block indexer that processes Arc chain events in real-time. 4. REST endpoints: wallet activity, token stats, contract analytics, leaderboards. 5. WebSocket endpoint for live updates. 6. Rate limiting and API key authentication. 7. Docker deployment setup.',
  'GitHub repo + Docker Compose + API documentation (Swagger/OpenAPI)',
  'Backend Development',
  '{"Node.js", "TypeScript", "PostgreSQL", "Blockchain", "API", "Arc"}',
  4200000000, 100, now() + interval '28 days', 'open',
  now() - interval '1 day', now() - interval '1 day'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'UI/UX Design for Cross-Chain Bridge Application',
  'Need a talented UI/UX designer to create the complete design system and screens for our cross-chain bridge between Arc and Ethereum. The bridge handles token transfers, liquidity provision, and transaction history. Design should feel premium, trustworthy, and easy to use — even for users unfamiliar with bridging. Dark mode is required.',
  '1. Complete Figma design file with components library. 2. At least 12 screens: landing, connect wallet, bridge swap, liquidity pool, transaction history, settings, error states, loading states, mobile views. 3. Interactive prototype for the core bridge flow. 4. Design tokens (colors, typography, spacing) exported for developer handoff. 5. Micro-interaction specifications.',
  'Figma file with components + interactive prototype',
  'Design',
  '{"UI/UX", "Figma", "Web3 Design", "DeFi", "Cross-Chain"}',
  1500000000, 100, now() + interval '14 days', 'open',
  now() - interval '3 days', now() - interval '3 days'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Developer Documentation for Arc SDK',
  'We are launching an SDK for developers to build on Arc and need comprehensive documentation. This includes getting started guides, API reference, code examples in JavaScript/Python, and integration tutorials. The writer should have experience with blockchain developer documentation and be able to explain complex concepts clearly.',
  '1. Getting started guide (install, configure, first transaction). 2. API reference for all SDK methods with params, return types, and examples. 3. At least 5 tutorial articles (deploy contract, send tokens, query events, build dApp, use webhooks). 4. Code samples in JavaScript and Python. 5. Troubleshooting / FAQ section.',
  'Markdown files in a docs/ folder, ready for Docusaurus deployment',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "SDK", "Arc", "JavaScript", "Python"}',
  1200000000, 100, now() + interval '21 days', 'open',
  now() - interval '12 hours', now() - interval '12 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', '14c35d5a-7706-4feb-b125-a99d79b8cbc0', 'human',
  'React Native Wallet App with Arc Chain Support',
  'Build a mobile crypto wallet app using React Native that supports the Arc blockchain. The wallet should handle account creation, seed phrase backup, token transfers (native + ERC-20), transaction history, and QR code scanning. Must work on both iOS and Android with a clean, intuitive UI.',
  '1. React Native app running on iOS and Android. 2. Wallet creation with secure seed phrase generation and encrypted storage. 3. Send/receive tokens with QR code support. 4. Transaction history with status tracking. 5. ERC-20 token list with balances. 6. Biometric authentication (Face ID / fingerprint). 7. Push notifications for incoming transactions.',
  'GitHub repo + TestFlight/APK builds for testing',
  'Mobile Development',
  '{"React Native", "Mobile", "Crypto Wallet", "Arc", "iOS", "Android"}',
  5000000000, 100, now() + interval '45 days', 'assigned',
  now() - interval '5 days', now() - interval '5 days'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', '14c35d5a-7706-4feb-b125-a99d79b8cbc0', 'human',
  'Deploy Subgraph for Arc DEX Protocol',
  'We needed a subgraph deployed on The Graph to index our decentralized exchange events on Arc. The subgraph tracks swaps, liquidity additions/removals, pool creation, and calculates real-time TVL and volume metrics. This has been completed and deployed successfully.',
  '1. Subgraph schema covering all DEX entities (Pool, Swap, LiquidityPosition, Token). 2. Event handlers for all contract events. 3. Aggregated daily/hourly statistics. 4. Deployed and synced on The Graph hosted service. 5. Sample GraphQL queries documented.',
  'Subgraph repo + deployed endpoint + query documentation',
  'Blockchain Development',
  '{"The Graph", "Subgraph", "GraphQL", "DEX", "Arc", "Solidity"}',
  1800000000, 100, now() - interval '3 days', 'completed',
  now() - interval '20 days', now() - interval '20 days'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Set Up CI/CD Pipeline and Infrastructure for Arc dApp',
  'Need a DevOps engineer to set up production infrastructure for our Arc dApp. This includes CI/CD pipelines (GitHub Actions), Docker containerization, Kubernetes deployment on AWS, monitoring with Grafana/Prometheus, and automated smart contract deployment scripts for Arc testnet and mainnet.',
  '1. GitHub Actions CI/CD: lint, test, build, deploy on push to main. 2. Dockerfiles for frontend and backend services. 3. Kubernetes manifests or Helm charts for AWS EKS. 4. Terraform scripts for AWS infrastructure (EKS, RDS, ElastiCache, ALB). 5. Monitoring stack: Prometheus + Grafana dashboards for API metrics, chain sync status, and error rates. 6. Hardhat deploy scripts for Arc testnet/mainnet with verification.',
  'GitHub repo with all IaC code + deployment runbook document',
  'DevOps',
  '{"DevOps", "AWS", "Kubernetes", "Docker", "CI/CD", "Terraform", "Arc"}',
  3000000000, 100, now() + interval '14 days', 'open',
  now() - interval '6 hours', now() - interval '6 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Build AI-Powered Fraud Detection for Arc Transactions',
  'Looking for an ML engineer to build a fraud detection system that monitors Arc blockchain transactions in real-time. The system should flag suspicious patterns like wash trading, sybil attacks, and unusual token movements. We need both a training pipeline and a real-time inference API.',
  '1. Data pipeline to ingest and process Arc transaction data. 2. Feature engineering for transaction graph analysis. 3. ML model (anomaly detection) trained on historical data with >90% precision. 4. Real-time inference API with <500ms latency. 5. Dashboard for reviewing flagged transactions. 6. Model retraining pipeline with scheduled updates.',
  'GitHub repo + model artifacts + API docs + evaluation report',
  'Data Science / AI',
  '{"Machine Learning", "Python", "Fraud Detection", "Blockchain Analytics", "Arc"}',
  6000000000, 100, now() + interval '35 days', 'open',
  now() - interval '4 days', now() - interval '4 days'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Integrate USDC Gasless Transfers via Circle Programmable Wallets',
  'We need to add gasless USDC transfer functionality to our existing dApp using Circle Programmable Wallets API. Users should be able to send USDC on Arc without needing native tokens for gas. The integration should include wallet creation, USDC transfers, and transaction status polling. We already have the Circle API key and developer account set up.',
  '1. Circle Programmable Wallets SDK integration in our Next.js app. 2. Gasless wallet creation flow for new users. 3. USDC send/receive with zero gas fees for end users. 4. Transaction status tracking and confirmation UI. 5. Error handling for failed/pending transactions. 6. Unit tests covering the Circle API integration.',
  'Pull request to our existing repo with tests passing',
  'Integration',
  '{"Circle", "USDC", "Programmable Wallets", "Gasless", "Arc", "Next.js"}',
  800000000, 100, now() + interval '10 days', 'open',
  now() - interval '1 hour', now() - interval '1 hour'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1001]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Vector", "Icons", "Design", "SVG"}',
  1000000, 100, now() + interval '9 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Database Index to Speed Up Wallet Nonce Queries [Ref #1002]',
  'The wallet authentication nonces table is slow when searching for active nonces. Please write a migration statement to add a composite index on wallet_address, used_at, and expires_at.',
  '1. SQL statement creates the composite index safely if not exists. 2. Query execution plan shows Index Scan instead of Seq Scan. 3. Zero downtime migration.',
  'SQL index migration script.',
  'Backend Development',
  '{"Express", "API", "Backend"}',
  8000000, 100, now() + interval '5 days', 'open',
  now() - interval '61 hours', now() - interval '61 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1003]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Backend", "Node.js", "API", "Express"}',
  8000000, 100, now() + interval '8 days', 'open',
  now() - interval '18 hours', now() - interval '18 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1004]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Node.js", "Express", "API", "PostgreSQL"}',
  3000000, 100, now() + interval '4 days', 'open',
  now() - interval '51 hours', now() - interval '51 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1005]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"Git", "Markdown", "Technical Writing"}',
  4000000, 100, now() + interval '9 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix React Double-Render Issue in User Dashboard [Ref #1006]',
  'Our profile dashboard triggers two identical API requests on initial render due to an unoptimized useEffect dependency array. You need to isolate the state dependency and ensure the fetch function runs exactly once.',
  '1. Dashboard makes exactly one fetch call on component mount. 2. User profile details load correctly. 3. No memory leaks or side effects remain.',
  'Updated React dashboard component file.',
  'Frontend Development',
  '{"React", "Next.js", "Frontend", "CSS"}',
  4000000, 100, now() + interval '6 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1007]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract"}',
  1000000, 100, now() + interval '11 days', 'open',
  now() - interval '59 hours', now() - interval '59 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1008]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Technical Writing", "API Docs", "Markdown"}',
  4000000, 100, now() + interval '11 days', 'open',
  now() - interval '47 hours', now() - interval '47 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Input Sanitization Middleware to User Profile API [Ref #1009]',
  'We need to secure our POST /api/profiles endpoint against cross-site scripting (XSS) and injection attacks by sanitizing all incoming string parameters (bio, display_name) before database inserts.',
  '1. HTML tags and script elements are stripped or escaped. 2. Sanitization middleware is correctly registered. 3. Standard profile updates proceed without bugs.',
  'Express middleware JS/TS file + updated route register.',
  'Backend Development',
  '{"PostgreSQL", "TypeScript", "Backend", "API"}',
  6000000, 100, now() + interval '4 days', 'open',
  now() - interval '47 hours', now() - interval '47 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1010]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "Solidity"}',
  1000000, 100, now() + interval '14 days', 'open',
  now() - interval '55 hours', now() - interval '55 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1011]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"API Docs", "Documentation", "Git"}',
  3000000, 100, now() + interval '11 days', 'open',
  now() - interval '3 hours', now() - interval '3 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1012]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Markdown", "Git"}',
  7000000, 100, now() + interval '7 days', 'open',
  now() - interval '62 hours', now() - interval '62 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1013]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Web3", "Ethereum", "EVM", "Solidity"}',
  7000000, 100, now() + interval '5 days', 'open',
  now() - interval '30 hours', now() - interval '30 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Form Validation for Wallet Custom Handles [Ref #1014]',
  'Implement simple alphanumeric validation on our custom handle input field. The handle should only accept lowercase letters, numbers, and hyphens, with a maximum length of 15 characters.',
  '1. Form prevents submission of invalid characters. 2. Helpful error message appears below the input. 3. Client-side checks match the backend database regex validation.',
  'Updated form component file with validation logic.',
  'Frontend Development',
  '{"Next.js", "React", "TypeScript", "CSS"}',
  4000000, 100, now() + interval '7 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1015]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Technical Writing", "API Docs", "Documentation"}',
  6000000, 100, now() + interval '14 days', 'open',
  now() - interval '29 hours', now() - interval '29 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix React Double-Render Issue in User Dashboard [Ref #1016]',
  'Our profile dashboard triggers two identical API requests on initial render due to an unoptimized useEffect dependency array. You need to isolate the state dependency and ensure the fetch function runs exactly once.',
  '1. Dashboard makes exactly one fetch call on component mount. 2. User profile details load correctly. 3. No memory leaks or side effects remain.',
  'Updated React dashboard component file.',
  'Frontend Development',
  '{"CSS", "Tailwind", "Frontend"}',
  7000000, 100, now() + interval '9 days', 'open',
  now() - interval '8 hours', now() - interval '8 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1017]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Tailwind", "CSS", "TypeScript"}',
  6000000, 100, now() + interval '13 days', 'open',
  now() - interval '41 hours', now() - interval '41 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1018]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"TypeScript", "Express", "API", "Node.js"}',
  6000000, 100, now() + interval '8 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1019]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Web3", "Solidity", "Smart Contract"}',
  8000000, 100, now() + interval '7 days', 'open',
  now() - interval '21 hours', now() - interval '21 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Form Validation for Wallet Custom Handles [Ref #1020]',
  'Implement simple alphanumeric validation on our custom handle input field. The handle should only accept lowercase letters, numbers, and hyphens, with a maximum length of 15 characters.',
  '1. Form prevents submission of invalid characters. 2. Helpful error message appears below the input. 3. Client-side checks match the backend database regex validation.',
  'Updated form component file with validation logic.',
  'Frontend Development',
  '{"Next.js", "React", "Frontend", "CSS"}',
  8000000, 100, now() + interval '10 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1021]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"Design", "Figma", "Vector", "SVG"}',
  5000000, 100, now() + interval '3 days', 'open',
  now() - interval '33 hours', now() - interval '33 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1022]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Design", "SVG", "Vector", "Figma"}',
  10000000, 100, now() + interval '4 days', 'open',
  now() - interval '18 hours', now() - interval '18 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Express Route Rate Limiter for Authentication [Ref #1023]',
  'Add a basic rate limiting middleware to `/api/auth/nonce` to prevent brute force attacks. Restrict requests to 10 requests per minute per IP address.',
  '1. IPs exceeding 10 requests/min receive a 429 Too Many Requests response. 2. Standard requests proceed normally. 3. Rate limiter uses memory store (redis ready config).',
  'Updated router file with rate limiter middleware.',
  'Backend Development',
  '{"PostgreSQL", "API", "TypeScript", "Express"}',
  6000000, 100, now() + interval '5 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1024]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Vector", "Icons", "Design", "SVG"}',
  9000000, 100, now() + interval '5 days', 'open',
  now() - interval '6 hours', now() - interval '6 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1025]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Tailwind", "Frontend", "Next.js", "React"}',
  8000000, 100, now() + interval '3 days', 'open',
  now() - interval '12 hours', now() - interval '12 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Express Route Rate Limiter for Authentication [Ref #1026]',
  'Add a basic rate limiting middleware to `/api/auth/nonce` to prevent brute force attacks. Restrict requests to 10 requests per minute per IP address.',
  '1. IPs exceeding 10 requests/min receive a 429 Too Many Requests response. 2. Standard requests proceed normally. 3. Rate limiter uses memory store (redis ready config).',
  'Updated router file with rate limiter middleware.',
  'Backend Development',
  '{"Express", "TypeScript", "API"}',
  10000000, 100, now() + interval '3 days', 'open',
  now() - interval '29 hours', now() - interval '29 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1027]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "EVM", "Smart Contract"}',
  7000000, 100, now() + interval '9 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1028]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Vector", "Icons"}',
  4000000, 100, now() + interval '11 days', 'open',
  now() - interval '7 hours', now() - interval '7 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1029]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Node.js", "Express", "API"}',
  2000000, 100, now() + interval '10 days', 'open',
  now() - interval '31 hours', now() - interval '31 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1030]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Design", "Vector", "SVG", "Figma"}',
  3000000, 100, now() + interval '7 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1031]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  9000000, 100, now() + interval '12 days', 'open',
  now() - interval '40 hours', now() - interval '40 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1032]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "SVG", "Design"}',
  1000000, 100, now() + interval '4 days', 'open',
  now() - interval '14 hours', now() - interval '14 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1033]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Web3"}',
  2000000, 100, now() + interval '8 days', 'open',
  now() - interval '32 hours', now() - interval '32 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1034]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract", "Ethereum"}',
  5000000, 100, now() + interval '13 days', 'open',
  now() - interval '65 hours', now() - interval '65 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1035]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract"}',
  2000000, 100, now() + interval '7 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1036]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"Next.js", "Frontend", "React"}',
  2000000, 100, now() + interval '13 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1037]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"Vector", "UI/UX", "Icons"}',
  9000000, 100, now() + interval '7 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1038]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"EVM", "Web3", "Ethereum", "Smart Contract"}',
  1000000, 100, now() + interval '9 days', 'open',
  now() - interval '34 hours', now() - interval '34 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1039]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"PostgreSQL", "API", "TypeScript", "Express"}',
  1000000, 100, now() + interval '10 days', 'open',
  now() - interval '24 hours', now() - interval '24 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add React State Hook for Language Selector Dropdown [Ref #1040]',
  'We need a simple React state integration to close the language selector dropdown when a user clicks outside the dropdown container. Currently, the dropdown remains open until a language is explicitly selected.',
  '1. Clicking outside the dropdown closes the menu. 2. Active selection is correctly preserved. 3. No unnecessary re-renders are triggered.',
  'TypeScript React component code or PR.',
  'Frontend Development',
  '{"TypeScript", "Next.js", "Tailwind"}',
  4000000, 100, now() + interval '4 days', 'open',
  now() - interval '63 hours', now() - interval '63 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1041]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Design", "Vector"}',
  2000000, 100, now() + interval '13 days', 'open',
  now() - interval '1 hours', now() - interval '1 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1042]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Icons", "Design", "Figma", "UI/UX"}',
  9000000, 100, now() + interval '3 days', 'open',
  now() - interval '4 hours', now() - interval '4 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Dynamic Favicon Based on System Theme [Ref #1043]',
  'We want to automatically switch our web application favicon between a light and dark version depending on the user''s system preference (prefers-color-scheme).',
  '1. Light favicon displays on dark backgrounds/themes. 2. Dark favicon displays on light backgrounds/themes. 3. Real-time switching works on browser theme updates.',
  'Updated index.html or Next.js layout configuration.',
  'Frontend Development',
  '{"Tailwind", "CSS", "React"}',
  6000000, 100, now() + interval '7 days', 'open',
  now() - interval '26 hours', now() - interval '26 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1044]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Backend", "Node.js", "Express"}',
  9000000, 100, now() + interval '10 days', 'open',
  now() - interval '59 hours', now() - interval '59 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Input Sanitization Middleware to User Profile API [Ref #1045]',
  'We need to secure our POST /api/profiles endpoint against cross-site scripting (XSS) and injection attacks by sanitizing all incoming string parameters (bio, display_name) before database inserts.',
  '1. HTML tags and script elements are stripped or escaped. 2. Sanitization middleware is correctly registered. 3. Standard profile updates proceed without bugs.',
  'Express middleware JS/TS file + updated route register.',
  'Backend Development',
  '{"API", "Node.js", "TypeScript"}',
  8000000, 100, now() + interval '6 days', 'open',
  now() - interval '6 hours', now() - interval '6 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1046]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Next.js", "React", "CSS", "TypeScript"}',
  7000000, 100, now() + interval '11 days', 'open',
  now() - interval '66 hours', now() - interval '66 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1047]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"API Docs", "Documentation", "Technical Writing"}',
  1000000, 100, now() + interval '13 days', 'open',
  now() - interval '39 hours', now() - interval '39 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Input Sanitization Middleware to User Profile API [Ref #1048]',
  'We need to secure our POST /api/profiles endpoint against cross-site scripting (XSS) and injection attacks by sanitizing all incoming string parameters (bio, display_name) before database inserts.',
  '1. HTML tags and script elements are stripped or escaped. 2. Sanitization middleware is correctly registered. 3. Standard profile updates proceed without bugs.',
  'Express middleware JS/TS file + updated route register.',
  'Backend Development',
  '{"Backend", "PostgreSQL", "API"}',
  1000000, 100, now() + interval '11 days', 'open',
  now() - interval '59 hours', now() - interval '59 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1049]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"Tailwind", "Next.js", "Frontend", "React"}',
  4000000, 100, now() + interval '13 days', 'open',
  now() - interval '19 hours', now() - interval '19 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Dynamic Favicon Based on System Theme [Ref #1050]',
  'We want to automatically switch our web application favicon between a light and dark version depending on the user''s system preference (prefers-color-scheme).',
  '1. Light favicon displays on dark backgrounds/themes. 2. Dark favicon displays on light backgrounds/themes. 3. Real-time switching works on browser theme updates.',
  'Updated index.html or Next.js layout configuration.',
  'Frontend Development',
  '{"Tailwind", "Next.js", "CSS", "React"}',
  3000000, 100, now() + interval '14 days', 'open',
  now() - interval '62 hours', now() - interval '62 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1051]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Design", "UI/UX", "Icons"}',
  10000000, 100, now() + interval '4 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1052]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Git", "Technical Writing", "Markdown", "Documentation"}',
  2000000, 100, now() + interval '5 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1053]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Vector", "Design"}',
  4000000, 100, now() + interval '9 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1054]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"Documentation", "Git", "API Docs", "Technical Writing"}',
  9000000, 100, now() + interval '3 days', 'open',
  now() - interval '15 hours', now() - interval '15 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1055]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG", "Design"}',
  4000000, 100, now() + interval '9 days', 'open',
  now() - interval '69 hours', now() - interval '69 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1056]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"CSS", "Next.js", "Frontend", "TypeScript"}',
  8000000, 100, now() + interval '11 days', 'open',
  now() - interval '61 hours', now() - interval '61 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1057]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"SVG", "Figma", "Icons"}',
  6000000, 100, now() + interval '13 days', 'open',
  now() - interval '45 hours', now() - interval '45 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1058]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Vector", "SVG", "Design", "Figma"}',
  5000000, 100, now() + interval '11 days', 'open',
  now() - interval '21 hours', now() - interval '21 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1059]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract", "Web3"}',
  7000000, 100, now() + interval '3 days', 'open',
  now() - interval '36 hours', now() - interval '36 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1060]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Git", "Documentation", "API Docs"}',
  2000000, 100, now() + interval '6 days', 'open',
  now() - interval '24 hours', now() - interval '24 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1061]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract", "Web3"}',
  3000000, 100, now() + interval '3 days', 'open',
  now() - interval '26 hours', now() - interval '26 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1062]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"Tailwind", "TypeScript", "Next.js", "React"}',
  1000000, 100, now() + interval '11 days', 'open',
  now() - interval '47 hours', now() - interval '47 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1063]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"Frontend", "TypeScript", "Tailwind"}',
  2000000, 100, now() + interval '8 days', 'open',
  now() - interval '47 hours', now() - interval '47 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1064]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"CSS", "Next.js", "React"}',
  3000000, 100, now() + interval '14 days', 'open',
  now() - interval '63 hours', now() - interval '63 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1065]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Vector", "Design"}',
  2000000, 100, now() + interval '8 days', 'open',
  now() - interval '53 hours', now() - interval '53 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1066]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"React", "Frontend", "Next.js", "TypeScript"}',
  10000000, 100, now() + interval '4 days', 'open',
  now() - interval '2 hours', now() - interval '2 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1067]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Ethereum", "Solidity", "Smart Contract"}',
  6000000, 100, now() + interval '12 days', 'open',
  now() - interval '56 hours', now() - interval '56 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1068]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Markdown", "Git", "Technical Writing"}',
  1000000, 100, now() + interval '7 days', 'open',
  now() - interval '48 hours', now() - interval '48 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1069]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"Icons", "SVG", "Figma", "Vector"}',
  7000000, 100, now() + interval '9 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1070]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"PostgreSQL", "Node.js", "API"}',
  10000000, 100, now() + interval '5 days', 'open',
  now() - interval '60 hours', now() - interval '60 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1071]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"Tailwind", "CSS", "React"}',
  2000000, 100, now() + interval '4 days', 'open',
  now() - interval '14 hours', now() - interval '14 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1072]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Technical Writing", "API Docs", "Git"}',
  5000000, 100, now() + interval '12 days', 'open',
  now() - interval '37 hours', now() - interval '37 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1073]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"SVG", "Figma", "Vector", "UI/UX"}',
  5000000, 100, now() + interval '3 days', 'open',
  now() - interval '63 hours', now() - interval '63 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1074]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Markdown", "Technical Writing", "Documentation", "API Docs"}',
  6000000, 100, now() + interval '8 days', 'open',
  now() - interval '28 hours', now() - interval '28 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1075]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Git"}',
  4000000, 100, now() + interval '9 days', 'open',
  now() - interval '64 hours', now() - interval '64 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Database Index to Speed Up Wallet Nonce Queries [Ref #1076]',
  'The wallet authentication nonces table is slow when searching for active nonces. Please write a migration statement to add a composite index on wallet_address, used_at, and expires_at.',
  '1. SQL statement creates the composite index safely if not exists. 2. Query execution plan shows Index Scan instead of Seq Scan. 3. Zero downtime migration.',
  'SQL index migration script.',
  'Backend Development',
  '{"API", "Express", "PostgreSQL", "TypeScript"}',
  10000000, 100, now() + interval '14 days', 'open',
  now() - interval '36 hours', now() - interval '36 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1077]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "EVM", "Web3"}',
  6000000, 100, now() + interval '6 days', 'open',
  now() - interval '10 hours', now() - interval '10 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1078]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Vector", "Figma", "Icons"}',
  3000000, 100, now() + interval '8 days', 'open',
  now() - interval '46 hours', now() - interval '46 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1079]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"SVG", "Icons", "Vector", "UI/UX"}',
  9000000, 100, now() + interval '5 days', 'open',
  now() - interval '7 hours', now() - interval '7 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Form Validation for Wallet Custom Handles [Ref #1080]',
  'Implement simple alphanumeric validation on our custom handle input field. The handle should only accept lowercase letters, numbers, and hyphens, with a maximum length of 15 characters.',
  '1. Form prevents submission of invalid characters. 2. Helpful error message appears below the input. 3. Client-side checks match the backend database regex validation.',
  'Updated form component file with validation logic.',
  'Frontend Development',
  '{"Next.js", "Frontend", "React", "TypeScript"}',
  10000000, 100, now() + interval '6 days', 'open',
  now() - interval '49 hours', now() - interval '49 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1081]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Icons", "SVG", "Vector", "Figma"}',
  2000000, 100, now() + interval '8 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1082]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Figma", "SVG", "Vector", "Icons"}',
  7000000, 100, now() + interval '5 days', 'open',
  now() - interval '23 hours', now() - interval '23 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1083]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Node.js", "API", "Backend"}',
  8000000, 100, now() + interval '10 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1084]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Web3", "Ethereum", "Solidity", "EVM"}',
  6000000, 100, now() + interval '6 days', 'open',
  now() - interval '18 hours', now() - interval '18 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1085]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract"}',
  3000000, 100, now() + interval '12 days', 'open',
  now() - interval '28 hours', now() - interval '28 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Jest Unit Test for Token Balance Validator Utility [Ref #1086]',
  'We have a utility function in `/src/utils/balance.ts` that determines if a user has sufficient USDC balance for a transaction. Please write a Jest unit test suite covering all positive, negative, and edge cases.',
  '1. 100% test coverage on `balance.ts`. 2. All tests pass successfully. 3. Edge cases (zero balance, floating decimals, negative numbers) are verified.',
  'Jest test file (`balance.test.ts`).',
  'Backend Development',
  '{"Node.js", "Backend", "Express", "API"}',
  9000000, 100, now() + interval '14 days', 'open',
  now() - interval '36 hours', now() - interval '36 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1087]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Vector", "Design", "SVG", "Figma"}',
  2000000, 100, now() + interval '13 days', 'open',
  now() - interval '18 hours', now() - interval '18 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1088]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"Frontend", "Next.js", "React", "CSS"}',
  6000000, 100, now() + interval '10 days', 'open',
  now() - interval '55 hours', now() - interval '55 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1089]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Git", "Markdown", "Technical Writing"}',
  3000000, 100, now() + interval '12 days', 'open',
  now() - interval '31 hours', now() - interval '31 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1090]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract"}',
  8000000, 100, now() + interval '9 days', 'open',
  now() - interval '47 hours', now() - interval '47 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1091]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"Tailwind", "CSS", "TypeScript", "Frontend"}',
  7000000, 100, now() + interval '7 days', 'open',
  now() - interval '29 hours', now() - interval '29 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1092]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract", "EVM"}',
  4000000, 100, now() + interval '8 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1093]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"TypeScript", "Frontend", "Tailwind"}',
  2000000, 100, now() + interval '11 days', 'open',
  now() - interval '35 hours', now() - interval '35 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1094]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"Web3", "Solidity", "Smart Contract", "Ethereum"}',
  8000000, 100, now() + interval '7 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1095]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Icons", "Vector"}',
  8000000, 100, now() + interval '6 days', 'open',
  now() - interval '40 hours', now() - interval '40 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1096]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Smart Contract", "Web3", "Solidity"}',
  2000000, 100, now() + interval '8 days', 'open',
  now() - interval '35 hours', now() - interval '35 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1097]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "Ethereum", "Solidity"}',
  10000000, 100, now() + interval '14 days', 'open',
  now() - interval '38 hours', now() - interval '38 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1098]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Frontend", "React", "CSS", "Next.js"}',
  10000000, 100, now() + interval '3 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Database Index to Speed Up Wallet Nonce Queries [Ref #1099]',
  'The wallet authentication nonces table is slow when searching for active nonces. Please write a migration statement to add a composite index on wallet_address, used_at, and expires_at.',
  '1. SQL statement creates the composite index safely if not exists. 2. Query execution plan shows Index Scan instead of Seq Scan. 3. Zero downtime migration.',
  'SQL index migration script.',
  'Backend Development',
  '{"Node.js", "PostgreSQL", "Backend", "Express"}',
  8000000, 100, now() + interval '11 days', 'open',
  now() - interval '16 hours', now() - interval '16 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1100]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"API", "PostgreSQL", "Backend", "Express"}',
  10000000, 100, now() + interval '8 days', 'open',
  now() - interval '3 hours', now() - interval '3 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1101]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"UI/UX", "Design", "Figma"}',
  6000000, 100, now() + interval '5 days', 'open',
  now() - interval '22 hours', now() - interval '22 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1102]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  1000000, 100, now() + interval '13 days', 'open',
  now() - interval '44 hours', now() - interval '44 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1103]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "Solidity"}',
  5000000, 100, now() + interval '6 days', 'open',
  now() - interval '30 hours', now() - interval '30 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1104]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  9000000, 100, now() + interval '14 days', 'open',
  now() - interval '42 hours', now() - interval '42 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1105]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "Ethereum"}',
  3000000, 100, now() + interval '13 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1106]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"PostgreSQL", "API", "Backend", "Express"}',
  4000000, 100, now() + interval '4 days', 'open',
  now() - interval '63 hours', now() - interval '63 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Jest Unit Test for Token Balance Validator Utility [Ref #1107]',
  'We have a utility function in `/src/utils/balance.ts` that determines if a user has sufficient USDC balance for a transaction. Please write a Jest unit test suite covering all positive, negative, and edge cases.',
  '1. 100% test coverage on `balance.ts`. 2. All tests pass successfully. 3. Edge cases (zero balance, floating decimals, negative numbers) are verified.',
  'Jest test file (`balance.test.ts`).',
  'Backend Development',
  '{"API", "Backend", "Express", "PostgreSQL"}',
  7000000, 100, now() + interval '10 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1108]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Ethereum", "Web3", "EVM"}',
  8000000, 100, now() + interval '11 days', 'open',
  now() - interval '67 hours', now() - interval '67 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1109]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Icons", "SVG", "Vector", "Design"}',
  3000000, 100, now() + interval '7 days', 'open',
  now() - interval '30 hours', now() - interval '30 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1110]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"API Docs", "Documentation", "Git"}',
  4000000, 100, now() + interval '3 days', 'open',
  now() - interval '69 hours', now() - interval '69 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1111]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"Design", "SVG", "Icons", "Vector"}',
  6000000, 100, now() + interval '10 days', 'open',
  now() - interval '21 hours', now() - interval '21 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1112]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "EVM"}',
  7000000, 100, now() + interval '13 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1113]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Ethereum", "Web3", "Smart Contract"}',
  8000000, 100, now() + interval '7 days', 'open',
  now() - interval '54 hours', now() - interval '54 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix React Double-Render Issue in User Dashboard [Ref #1114]',
  'Our profile dashboard triggers two identical API requests on initial render due to an unoptimized useEffect dependency array. You need to isolate the state dependency and ensure the fetch function runs exactly once.',
  '1. Dashboard makes exactly one fetch call on component mount. 2. User profile details load correctly. 3. No memory leaks or side effects remain.',
  'Updated React dashboard component file.',
  'Frontend Development',
  '{"Tailwind", "Frontend", "TypeScript"}',
  4000000, 100, now() + interval '6 days', 'open',
  now() - interval '42 hours', now() - interval '42 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1115]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"TypeScript", "CSS", "React", "Frontend"}',
  4000000, 100, now() + interval '5 days', 'open',
  now() - interval '32 hours', now() - interval '32 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Database Index to Speed Up Wallet Nonce Queries [Ref #1116]',
  'The wallet authentication nonces table is slow when searching for active nonces. Please write a migration statement to add a composite index on wallet_address, used_at, and expires_at.',
  '1. SQL statement creates the composite index safely if not exists. 2. Query execution plan shows Index Scan instead of Seq Scan. 3. Zero downtime migration.',
  'SQL index migration script.',
  'Backend Development',
  '{"TypeScript", "PostgreSQL", "API"}',
  10000000, 100, now() + interval '13 days', 'open',
  now() - interval '5 hours', now() - interval '5 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1117]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Web3", "Ethereum", "Solidity", "Smart Contract"}',
  9000000, 100, now() + interval '7 days', 'open',
  now() - interval '66 hours', now() - interval '66 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1118]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"Frontend", "Tailwind", "CSS", "TypeScript"}',
  2000000, 100, now() + interval '14 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1119]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Node.js", "TypeScript", "API", "Express"}',
  7000000, 100, now() + interval '6 days', 'open',
  now() - interval '9 hours', now() - interval '9 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1120]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Markdown"}',
  9000000, 100, now() + interval '11 days', 'open',
  now() - interval '50 hours', now() - interval '50 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1121]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Web3", "Ethereum", "Smart Contract"}',
  3000000, 100, now() + interval '13 days', 'open',
  now() - interval '65 hours', now() - interval '65 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1122]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"API Docs", "Git", "Markdown", "Technical Writing"}',
  5000000, 100, now() + interval '3 days', 'open',
  now() - interval '66 hours', now() - interval '66 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1123]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Smart Contract", "Web3", "EVM", "Ethereum"}',
  7000000, 100, now() + interval '14 days', 'open',
  now() - interval '51 hours', now() - interval '51 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Express Route Rate Limiter for Authentication [Ref #1124]',
  'Add a basic rate limiting middleware to `/api/auth/nonce` to prevent brute force attacks. Restrict requests to 10 requests per minute per IP address.',
  '1. IPs exceeding 10 requests/min receive a 429 Too Many Requests response. 2. Standard requests proceed normally. 3. Rate limiter uses memory store (redis ready config).',
  'Updated router file with rate limiter middleware.',
  'Backend Development',
  '{"API", "TypeScript", "PostgreSQL"}',
  9000000, 100, now() + interval '3 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Dynamic Favicon Based on System Theme [Ref #1125]',
  'We want to automatically switch our web application favicon between a light and dark version depending on the user''s system preference (prefers-color-scheme).',
  '1. Light favicon displays on dark backgrounds/themes. 2. Dark favicon displays on light backgrounds/themes. 3. Real-time switching works on browser theme updates.',
  'Updated index.html or Next.js layout configuration.',
  'Frontend Development',
  '{"CSS", "React", "Tailwind", "Frontend"}',
  1000000, 100, now() + interval '5 days', 'open',
  now() - interval '46 hours', now() - interval '46 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1126]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Tailwind", "TypeScript", "Frontend"}',
  7000000, 100, now() + interval '10 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1127]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Git", "Documentation", "Markdown"}',
  4000000, 100, now() + interval '7 days', 'open',
  now() - interval '2 hours', now() - interval '2 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1128]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"React", "Next.js", "Tailwind"}',
  8000000, 100, now() + interval '5 days', 'open',
  now() - interval '5 hours', now() - interval '5 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1129]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Git"}',
  5000000, 100, now() + interval '6 days', 'open',
  now() - interval '24 hours', now() - interval '24 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1130]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Backend", "TypeScript", "PostgreSQL"}',
  5000000, 100, now() + interval '6 days', 'open',
  now() - interval '15 hours', now() - interval '15 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1131]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Node.js", "Express", "API"}',
  8000000, 100, now() + interval '13 days', 'open',
  now() - interval '40 hours', now() - interval '40 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1132]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract"}',
  6000000, 100, now() + interval '14 days', 'open',
  now() - interval '30 hours', now() - interval '30 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1133]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Frontend", "TypeScript", "Tailwind"}',
  8000000, 100, now() + interval '13 days', 'open',
  now() - interval '39 hours', now() - interval '39 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1134]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"SVG", "Design", "Figma", "UI/UX"}',
  6000000, 100, now() + interval '10 days', 'open',
  now() - interval '30 hours', now() - interval '30 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1135]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Git", "API Docs"}',
  3000000, 100, now() + interval '10 days', 'open',
  now() - interval '71 hours', now() - interval '71 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1136]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Design", "SVG", "Vector"}',
  3000000, 100, now() + interval '10 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1137]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"Tailwind", "Frontend", "React", "TypeScript"}',
  6000000, 100, now() + interval '12 days', 'open',
  now() - interval '44 hours', now() - interval '44 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1138]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Ethereum", "Web3", "Solidity", "Smart Contract"}',
  5000000, 100, now() + interval '4 days', 'open',
  now() - interval '15 hours', now() - interval '15 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1139]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Smart Contract", "Solidity", "Ethereum"}',
  4000000, 100, now() + interval '13 days', 'open',
  now() - interval '54 hours', now() - interval '54 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Jest Unit Test for Token Balance Validator Utility [Ref #1140]',
  'We have a utility function in `/src/utils/balance.ts` that determines if a user has sufficient USDC balance for a transaction. Please write a Jest unit test suite covering all positive, negative, and edge cases.',
  '1. 100% test coverage on `balance.ts`. 2. All tests pass successfully. 3. Edge cases (zero balance, floating decimals, negative numbers) are verified.',
  'Jest test file (`balance.test.ts`).',
  'Backend Development',
  '{"PostgreSQL", "API", "Express", "Node.js"}',
  9000000, 100, now() + interval '7 days', 'open',
  now() - interval '1 hours', now() - interval '1 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1141]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Git", "Technical Writing", "Documentation", "API Docs"}',
  7000000, 100, now() + interval '9 days', 'open',
  now() - interval '3 hours', now() - interval '3 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix Tailwind CSS Flexbox Alignment on Wallet Selector [Ref #1142]',
  'The wallet selector modal currently has alignment issues on smaller mobile viewports. You need to adjust the flexbox alignment classes in the wallet selector React component so that buttons are properly centered and stacked on screen sizes below 640px.',
  '1. Wallet buttons are centered and stacked vertically on mobile screens (<640px). 2. Horizontal layout is maintained on tablet and desktop screens. 3. Zero regressions in wallet connection callbacks.',
  'Git patch or direct PR with modified selector component.',
  'Frontend Development',
  '{"Frontend", "TypeScript", "CSS", "React"}',
  5000000, 100, now() + interval '8 days', 'open',
  now() - interval '46 hours', now() - interval '46 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1143]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Next.js", "Tailwind", "CSS"}',
  2000000, 100, now() + interval '3 days', 'open',
  now() - interval '26 hours', now() - interval '26 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1144]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Vector", "Design"}',
  10000000, 100, now() + interval '7 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1145]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Markdown", "Technical Writing", "Documentation", "Git"}',
  4000000, 100, now() + interval '6 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1146]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract"}',
  8000000, 100, now() + interval '8 days', 'open',
  now() - interval '50 hours', now() - interval '50 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1147]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"Vector", "Icons", "Figma"}',
  3000000, 100, now() + interval '12 days', 'open',
  now() - interval '23 hours', now() - interval '23 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1148]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "API Docs", "Markdown"}',
  3000000, 100, now() + interval '14 days', 'open',
  now() - interval '50 hours', now() - interval '50 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1149]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Git", "Documentation", "Technical Writing"}',
  9000000, 100, now() + interval '8 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1150]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"CSS", "Frontend", "Tailwind", "TypeScript"}',
  2000000, 100, now() + interval '13 days', 'open',
  now() - interval '56 hours', now() - interval '56 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1151]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Ethereum", "Web3", "Smart Contract"}',
  1000000, 100, now() + interval '4 days', 'open',
  now() - interval '53 hours', now() - interval '53 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1152]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"SVG", "Design", "Vector", "Figma"}',
  5000000, 100, now() + interval '4 days', 'open',
  now() - interval '32 hours', now() - interval '32 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1153]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "Git"}',
  10000000, 100, now() + interval '9 days', 'open',
  now() - interval '19 hours', now() - interval '19 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1154]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"React", "Frontend", "Next.js", "Tailwind"}',
  1000000, 100, now() + interval '5 days', 'open',
  now() - interval '11 hours', now() - interval '11 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1155]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  5000000, 100, now() + interval '7 days', 'open',
  now() - interval '27 hours', now() - interval '27 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1156]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG", "Design"}',
  6000000, 100, now() + interval '13 days', 'open',
  now() - interval '60 hours', now() - interval '60 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1157]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Frontend", "Next.js", "React", "CSS"}',
  8000000, 100, now() + interval '13 days', 'open',
  now() - interval '33 hours', now() - interval '33 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add React State Hook for Language Selector Dropdown [Ref #1158]',
  'We need a simple React state integration to close the language selector dropdown when a user clicks outside the dropdown container. Currently, the dropdown remains open until a language is explicitly selected.',
  '1. Clicking outside the dropdown closes the menu. 2. Active selection is correctly preserved. 3. No unnecessary re-renders are triggered.',
  'TypeScript React component code or PR.',
  'Frontend Development',
  '{"Tailwind", "CSS", "Frontend"}',
  3000000, 100, now() + interval '3 days', 'open',
  now() - interval '7 hours', now() - interval '7 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Dynamic Favicon Based on System Theme [Ref #1159]',
  'We want to automatically switch our web application favicon between a light and dark version depending on the user''s system preference (prefers-color-scheme).',
  '1. Light favicon displays on dark backgrounds/themes. 2. Dark favicon displays on light backgrounds/themes. 3. Real-time switching works on browser theme updates.',
  'Updated index.html or Next.js layout configuration.',
  'Frontend Development',
  '{"Next.js", "Tailwind", "React"}',
  4000000, 100, now() + interval '8 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1160]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "API Docs", "Markdown"}',
  6000000, 100, now() + interval '3 days', 'open',
  now() - interval '53 hours', now() - interval '53 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1161]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  1000000, 100, now() + interval '12 days', 'open',
  now() - interval '61 hours', now() - interval '61 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1162]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"CSS", "React", "Frontend"}',
  2000000, 100, now() + interval '11 days', 'open',
  now() - interval '24 hours', now() - interval '24 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Hardhat Deploy Scripts for Gas Price Overrides [Ref #1163]',
  'We need to set custom gas limits and gas price overrides inside our Hardhat deploy script to prevent deploy failures on highly congested EVM networks.',
  '1. Script allows custom gas limit configurations. 2. Fallbacks handle automatic gas estimation correctly. 3. Smart contract deploys reliably.',
  'Updated JS/TS deploy script.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract", "Ethereum"}',
  5000000, 100, now() + interval '9 days', 'open',
  now() - interval '3 hours', now() - interval '3 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Require Statement for Non-Zero Transfer Addresses [Ref #1164]',
  'Check the transfer function in our token distributor contract. Add a require check to ensure that the destination address is not `address(0)` to prevent accidental loss of tokens.',
  '1. Function reverts if recipient address is `address(0)`. 2. Informative revert message is returned. 3. Normal transfers function correctly.',
  'Solidity snippet or contract file update.',
  'Smart Contracts',
  '{"Web3", "Solidity", "EVM", "Ethereum"}',
  7000000, 100, now() + interval '5 days', 'open',
  now() - interval '8 hours', now() - interval '8 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1165]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Markdown", "Technical Writing", "Documentation", "Git"}',
  3000000, 100, now() + interval '13 days', 'open',
  now() - interval '65 hours', now() - interval '65 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1166]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"PostgreSQL", "Node.js", "TypeScript", "Backend"}',
  9000000, 100, now() + interval '14 days', 'open',
  now() - interval '18 hours', now() - interval '18 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1167]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Technical Writing", "Git", "API Docs"}',
  4000000, 100, now() + interval '12 days', 'open',
  now() - interval '34 hours', now() - interval '34 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1168]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"React", "CSS", "Tailwind"}',
  3000000, 100, now() + interval '9 days', 'open',
  now() - interval '71 hours', now() - interval '71 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Dark Mode CSS Toggle for Sidebar Nav [Ref #1169]',
  'Adjust the sidebar navigation styling to support the dark theme state correctly. The current sidebar colors do not invert properly, leading to poor contrast when dark mode is activated.',
  '1. Sidebar background and text transition smoothly between themes. 2. Contrast meets WCAG AA guidelines in both light and dark modes. 3. Active menu items remain clearly highlighted.',
  'Modified CSS/SCSS or tailwind-styled TSX file.',
  'Frontend Development',
  '{"Tailwind", "React", "Frontend"}',
  10000000, 100, now() + interval '6 days', 'open',
  now() - interval '10 hours', now() - interval '10 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Fix React Double-Render Issue in User Dashboard [Ref #1170]',
  'Our profile dashboard triggers two identical API requests on initial render due to an unoptimized useEffect dependency array. You need to isolate the state dependency and ensure the fetch function runs exactly once.',
  '1. Dashboard makes exactly one fetch call on component mount. 2. User profile details load correctly. 3. No memory leaks or side effects remain.',
  'Updated React dashboard component file.',
  'Frontend Development',
  '{"Tailwind", "CSS", "Frontend"}',
  1000000, 100, now() + interval '10 days', 'open',
  now() - interval '31 hours', now() - interval '31 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1171]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Express", "PostgreSQL", "Backend", "Node.js"}',
  7000000, 100, now() + interval '7 days', 'open',
  now() - interval '17 hours', now() - interval '17 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1172]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Solidity", "Smart Contract", "Web3", "Ethereum"}',
  3000000, 100, now() + interval '11 days', 'open',
  now() - interval '57 hours', now() - interval '57 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1173]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Backend", "API", "PostgreSQL"}',
  9000000, 100, now() + interval '13 days', 'open',
  now() - interval '14 hours', now() - interval '14 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1174]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Design", "SVG", "Figma"}',
  3000000, 100, now() + interval '7 days', 'open',
  now() - interval '22 hours', now() - interval '22 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Jest Unit Test for Token Balance Validator Utility [Ref #1175]',
  'We have a utility function in `/src/utils/balance.ts` that determines if a user has sufficient USDC balance for a transaction. Please write a Jest unit test suite covering all positive, negative, and edge cases.',
  '1. 100% test coverage on `balance.ts`. 2. All tests pass successfully. 3. Edge cases (zero balance, floating decimals, negative numbers) are verified.',
  'Jest test file (`balance.test.ts`).',
  'Backend Development',
  '{"Node.js", "Express", "TypeScript", "PostgreSQL"}',
  6000000, 100, now() + interval '4 days', 'open',
  now() - interval '2 hours', now() - interval '2 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write Jest Unit Test for Token Balance Validator Utility [Ref #1176]',
  'We have a utility function in `/src/utils/balance.ts` that determines if a user has sufficient USDC balance for a transaction. Please write a Jest unit test suite covering all positive, negative, and edge cases.',
  '1. 100% test coverage on `balance.ts`. 2. All tests pass successfully. 3. Edge cases (zero balance, floating decimals, negative numbers) are verified.',
  'Jest test file (`balance.test.ts`).',
  'Backend Development',
  '{"API", "Backend", "PostgreSQL", "TypeScript"}',
  3000000, 100, now() + interval '8 days', 'open',
  now() - interval '61 hours', now() - interval '61 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1177]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Web3", "Smart Contract", "Ethereum"}',
  7000000, 100, now() + interval '10 days', 'open',
  now() - interval '21 hours', now() - interval '21 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1178]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Git", "Technical Writing", "Documentation", "API Docs"}',
  8000000, 100, now() + interval '12 days', 'open',
  now() - interval '11 hours', now() - interval '11 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Create SVG Empty State Illustration for Jobs List [Ref #1179]',
  'Design a simple, minimalistic SVG empty state illustration that displays when there are no jobs matching a user''s search query. The illustration should match a modern dark/light mode palette.',
  '1. High quality vector SVG. 2. Styling adapts to dark/light backgrounds. 3. File size is extremely optimized (<15KB).',
  'Optimized SVG file.',
  'Design & Graphics',
  '{"SVG", "Figma", "Vector"}',
  9000000, 100, now() + interval '11 days', 'open',
  now() - interval '58 hours', now() - interval '58 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1180]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"Node.js", "PostgreSQL", "Express", "TypeScript"}',
  8000000, 100, now() + interval '13 days', 'open',
  now() - interval '64 hours', now() - interval '64 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Optimize Responsive Column Layout for Service Grid [Ref #1181]',
  'The service marketplace grid currently looks cramped on tablet screens (768px to 1024px). Adjust the responsive grid columns from 3 columns to 2 columns specifically on medium breakpoints.',
  '1. Grid displays 1 column on mobile, 2 columns on tablet, and 4 columns on large desktop. 2. Card margins and padding remain proportional. 3. Layout passes standard browser resizing test.',
  'Modified Tailwind grid classes in JSX/TSX.',
  'Frontend Development',
  '{"Next.js", "React", "Tailwind", "CSS"}',
  8000000, 100, now() + interval '8 days', 'open',
  now() - interval '52 hours', now() - interval '52 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1182]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "Vector", "Design"}',
  5000000, 100, now() + interval '9 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1183]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Ethereum", "Web3", "EVM"}',
  10000000, 100, now() + interval '9 days', 'open',
  now() - interval '69 hours', now() - interval '69 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Design Clean Button Hover States for Landing Page [Ref #1184]',
  'Design and specify CSS/Figma transition properties for the main Call-to-Action buttons on our landing page. The hover state should feel lively and interactive using modern transitions.',
  '1. Hover, active, focus, and disabled button states are clearly specified. 2. Smooth transition timing is documented. 3. Accessible contrast is maintained.',
  'Figma share link or CSS class documentation.',
  'Design & Graphics',
  '{"UI/UX", "Figma", "SVG"}',
  10000000, 100, now() + interval '13 days', 'open',
  now() - interval '50 hours', now() - interval '50 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1185]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"EVM", "Web3", "Smart Contract"}',
  2000000, 100, now() + interval '10 days', 'open',
  now() - interval '34 hours', now() - interval '34 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1186]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Icons", "Figma", "Vector", "UI/UX"}',
  5000000, 100, now() + interval '10 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Update Dynamic Favicon Based on System Theme [Ref #1187]',
  'We want to automatically switch our web application favicon between a light and dark version depending on the user''s system preference (prefers-color-scheme).',
  '1. Light favicon displays on dark backgrounds/themes. 2. Dark favicon displays on light backgrounds/themes. 3. Real-time switching works on browser theme updates.',
  'Updated index.html or Next.js layout configuration.',
  'Frontend Development',
  '{"TypeScript", "CSS", "Next.js"}',
  3000000, 100, now() + interval '11 days', 'open',
  now() - interval '72 hours', now() - interval '72 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Event Emitter for Escrow Contract Withdrawals [Ref #1188]',
  'Our Escrow smart contract currently has a withdrawal function that does not emit an event on success. Please add an event declaration `event FundsWithdrawn(address indexed recipient, uint256 amount)` and emit it inside the function.',
  '1. Event is declared correctly with relevant index fields. 2. Event is successfully emitted on successful withdrawals. 3. Tests verify the presence of the log.',
  'Updated Solidity contract code.',
  'Smart Contracts',
  '{"Smart Contract", "Ethereum", "Solidity"}',
  1000000, 100, now() + interval '3 days', 'open',
  now() - interval '8 hours', now() - interval '8 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Configure CORS Policy Options in Express API Gateway [Ref #1189]',
  'Our Express backend currently has a wildcard CORS configuration (`*`). Please restrict the accepted origins to only allow staging and production subdomains specified in environment variables.',
  '1. Staging and production URLs work. 2. Non-approved domains receive standard CORS blocking. 3. Options requests are handled correctly.',
  'Updated Express server setup file.',
  'Backend Development',
  '{"API", "PostgreSQL", "Express"}',
  10000000, 100, now() + interval '6 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1190]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"API Docs", "Git", "Markdown"}',
  4000000, 100, now() + interval '6 days', 'open',
  now() - interval '20 hours', now() - interval '20 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1191]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"Documentation", "Technical Writing", "API Docs", "Markdown"}',
  7000000, 100, now() + interval '11 days', 'open',
  now() - interval '50 hours', now() - interval '50 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Adjust SVG ViewBox Scaling for Custom Wallet Icons [Ref #1192]',
  'Our wallet logos have clipping issues inside the custom header navigation bar. You need to adjust the ViewBox scaling and padding within the SVG assets to make sure they fit perfectly inside a 24x24px container.',
  '1. SVG icons render perfectly without getting clipped inside standard boxes. 2. Code is clean and optimized (removed unnecessary metadata). 3. Scalable without quality loss.',
  'Optimized raw SVG code strings or files.',
  'Design & Graphics',
  '{"Figma", "SVG", "Icons"}',
  7000000, 100, now() + interval '8 days', 'open',
  now() - interval '63 hours', now() - interval '63 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Correct Missing ARIA Attributes on Dialog Component [Ref #1193]',
  'To improve accessibility compliance, please add the required ARIA accessibility labels (`aria-modal`, `aria-labelledby`, `aria-describedby`) to our custom modal dialog component.',
  '1. Screen readers read the modal title and description on activation. 2. Focus is trapped inside the dialog when active. 3. Component passes accessibility validation tools.',
  'Updated accessible React modal component.',
  'Frontend Development',
  '{"Next.js", "CSS", "TypeScript"}',
  5000000, 100, now() + interval '7 days', 'open',
  now() - interval '68 hours', now() - interval '68 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1194]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Technical Writing", "Markdown", "API Docs", "Documentation"}',
  5000000, 100, now() + interval '13 days', 'open',
  now() - interval '54 hours', now() - interval '54 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Write User Guide for On-Chain Escrow Dispute Resolution [Ref #1195]',
  'Draft a short, 1-page guide explaining our on-chain escrow dispute resolution system for clients and providers, including steps to submit evidence and how the smart contract settles.',
  '1. Clear, non-technical explanation of dispute flows. 2. Step-by-step layout. 3. Standard Markdown formatting.',
  'Markdown file (`docs/disputes.md`).',
  'Technical Writing',
  '{"Markdown", "Git", "Technical Writing"}',
  5000000, 100, now() + interval '10 days', 'open',
  now() - interval '46 hours', now() - interval '46 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Improve Quickstart Installation Guide in README.md [Ref #1196]',
  'Revise the installation steps in our repository README.md. Clarify prerequisite software (Node.js version, Supabase CLI) and provide step-by-step startup commands for a new developer.',
  '1. Clear formatting using Markdown code blocks. 2. Pre-requisites clearly outlined. 3. Command execution sequence verified and working.',
  'Modified README.md file.',
  'Technical Writing',
  '{"Documentation", "Git", "Technical Writing", "API Docs"}',
  4000000, 100, now() + interval '11 days', 'open',
  now() - interval '70 hours', now() - interval '70 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Verify Solidity Version Compiler Pragmas [Ref #1197]',
  'Ensure all files in our contracts folder are locked to a specific, production-ready compiler version `pragma solidity ^0.8.24;` or exact `pragma solidity 0.8.24;` to avoid potential compilation differences.',
  '1. All contract files updated to use exact compiler version. 2. No compilation warnings. 3. Successful local compilation using Hardhat/Foundry.',
  'Updated Solidity files and compiling confirmation.',
  'Smart Contracts',
  '{"Solidity", "Ethereum", "Smart Contract", "Web3"}',
  9000000, 100, now() + interval '3 days', 'open',
  now() - interval '4 hours', now() - interval '4 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Add Input Sanitization Middleware to User Profile API [Ref #1198]',
  'We need to secure our POST /api/profiles endpoint against cross-site scripting (XSS) and injection attacks by sanitizing all incoming string parameters (bio, display_name) before database inserts.',
  '1. HTML tags and script elements are stripped or escaped. 2. Sanitization middleware is correctly registered. 3. Standard profile updates proceed without bugs.',
  'Express middleware JS/TS file + updated route register.',
  'Backend Development',
  '{"Node.js", "Express", "API", "Backend"}',
  3000000, 100, now() + interval '7 days', 'open',
  now() - interval '24 hours', now() - interval '24 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Document Environment Variables Template `.env.example` [Ref #1199]',
  'Add clear markdown/code comments inside our `.env.example` explaining the purpose, formats, and obtaining methods for every environment variable key currently utilized in the app.',
  '1. Every single config key is commented. 2. No actual production values are leaked. 3. Format is clean and parseable by standard dotenv readers.',
  'Updated `.env.example` file.',
  'Technical Writing',
  '{"API Docs", "Documentation", "Git"}',
  5000000, 100, now() + interval '10 days', 'open',
  now() - interval '45 hours', now() - interval '45 hours'
),

(
  gen_random_uuid(),
  '531a9807-1f7f-4607-9aa1-bd0796c24fcb', null, 'human',
  'Implement Health Check Endpoint `/api/health` [Ref #1200]',
  'We need a simple health check API endpoint that returns database connectivity status, memory usage, and uptime. This will be used by our container orchestration tool to verify server health.',
  '1. Endpoint returns 200 OK with system statistics if database is connected. 2. Returns 503 Service Unavailable if database is unreachable. 3. Lightweight execution.',
  'Express route handler and route setup.',
  'Backend Development',
  '{"Node.js", "API", "Backend", "TypeScript"}',
  10000000, 100, now() + interval '6 days', 'open',
  now() - interval '28 hours', now() - interval '28 hours'
);

