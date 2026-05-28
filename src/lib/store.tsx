"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { encodeFunctionData, type Address, type Hex } from "viem";
import {
  useLogin,
  useLogout,
  usePrivy,
  useWallets,
  useCreateWallet,
} from "@privy-io/react-auth";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ERC8183_CONTRACT_ADDRESS,
  ZERO_ADDRESS,
  erc8183Abi,
  erc20UsdcAbi,
} from "./arc";
import { emptyState } from "./empty-state";
import { isDemoDataEnabled } from "./env";
import { sha256Hex, stableJson } from "./hash";
import { ARC_USDC_GAS_BUFFER_UNITS, formatUsdcUnits } from "./money";
import { seedState } from "./seed";
import { hasSupabaseBrowserConfig } from "./env";
import { getBrowserSupabase } from "./supabase/browser";
import { getJobCreatedArcId, ensureArcNetwork, readArcUsdcBalance, waitForArcReceipt } from "./wallet";
import type {
  Agent,
  AiEvaluation,
  Job,
  JobApplication,
  JobStatus,
  JobSubmission,
  Profile,
  WalletState,
  WorkNetState,
} from "./types";

type CreateJobInput = {
  title: string;
  brief: string;
  acceptanceCriteria: string;
  deliverableFormat: string;
  category: string;
  tags: string[];
  budgetUsdcUnits: number;
  deadlineAt?: string;
  actorType: "human" | "agent";
};

type DataContextValue = {
  state: WorkNetState;
  activeProfile?: Profile;
  backendError?: string;
  isSyncing: boolean;
  refreshState: () => Promise<void>;
  setActiveProfile: (profileId: string) => void;
  resetDemo: () => void;
  loadDemoData: () => void;
  getProfile: (profileId?: string) => Profile | undefined;
  getAgent: (agentId?: string) => Agent | undefined;
  getJob: (jobId: string) => Job | undefined;
  getJobApplications: (jobId: string) => JobApplication[];
  getJobSubmissions: (jobId: string) => JobSubmission[];
  getJobEvaluation: (submissionId?: string) => AiEvaluation | undefined;
};

type WalletContextValue = {
  wallet: WalletState;
  walletError?: string;
  isWalletPending: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchWalletToArc: () => Promise<void>;
};

type UpdateProfileInput = Partial<{
  displayName: string;
  handle: string;
  role: "client" | "worker" | "agent_owner";
  bio: string;
  avatarUrl: string;
  countryCode: string;
  timezone: string;
  skills: string[];
  hourlyRateUsdcUnits: number | null;
  availability: "open" | "limited" | "unavailable" | null;
  portfolio: Array<{ id: string; title: string; url?: string; description?: string }>;
}>;

type ActionsContextValue = {
  createJob: (input: CreateJobInput) => Promise<string>;
  applyToJob: (jobId: string, pitch: string, agentId?: string) => Promise<void>;
  acceptApplication: (applicationId: string) => Promise<void>;
  createOnchainJob: (jobId: string) => Promise<void>;
  setBudget: (jobId: string) => Promise<void>;
  approveAndFund: (jobId: string) => Promise<void>;
  submitDeliverable: (jobId: string, input: { url: string; notes: string }) => Promise<string>;
  requestRevision: (jobId: string, submissionId: string, reason: string) => Promise<void>;
  rejectSubmission: (jobId: string, submissionId: string, reason: string) => Promise<void>;
  completeJob: (jobId: string, submissionId: string, input: { rating: number; reviewText: string }) => Promise<void>;
  registerAgent: (input: { name: string; description: string; capabilities: string[]; walletAddress: string }) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
};

type StoreContextValue = DataContextValue & WalletContextValue & ActionsContextValue;

const DataContext = createContext<DataContextValue | undefined>(undefined);
const WalletContext = createContext<WalletContextValue | undefined>(undefined);
const ActionsContext = createContext<ActionsContextValue | undefined>(undefined);

type ApiErrorBody = {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
};

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;

  if (!response.ok) {
    const fieldErrors = body.details?.fieldErrors
      ? Object.entries(body.details.fieldErrors)
          .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
          .join(" ")
      : "";
    throw new Error([body.error, fieldErrors].filter(Boolean).join(" ") || `Request failed with ${response.status}`);
  }

  return body as T;
}

function mergeState(current: WorkNetState, incoming: WorkNetState, walletAddress?: string): WorkNetState {
  const activeStillExists = incoming.profiles.some((profile) => profile.id === current.activeProfileId);
  const walletProfile = walletAddress
    ? incoming.profiles.find((profile) => profile.walletAddress.toLowerCase() === walletAddress.toLowerCase())
    : undefined;

  const next: WorkNetState = {
    ...incoming,
    activeProfileId: activeStillExists
      ? current.activeProfileId
      : walletProfile?.id ?? incoming.activeProfileId,
    // Preserve private-slice fields from prior fetch — public bootstrap doesn't
    // include them. They get refreshed by /api/bootstrap/private.
    applications: current.applications,
    submissions: current.submissions,
    reviews: current.reviews,
    aiEvaluations: current.aiEvaluations,
    notifications: current.notifications,
    jobMessages: current.jobMessages,
    jobInvitations: current.jobInvitations,
    savedJobs: current.savedJobs,
    applicationOverlays: current.applicationOverlays,
  };

  // Short-circuit if nothing meaningful changed. Cheap structural check using
  // stableJson keeps React from re-rendering 21 consumers on every bootstrap.
  if (stableJson(current) === stableJson(next)) {
    return current;
  }

  return next;
}

type PrivateBootstrapResponse =
  | { session: null }
  | {
      activeProfileId: string;
      ownedAgents: Agent[];
      privateJobs: Job[];
      applications: JobApplication[];
      submissions: JobSubmission[];
      reviews: WorkNetState["reviews"];
      aiEvaluations: AiEvaluation[];
      privateTransactions: WorkNetState["transactions"];
      profileTransactions: WorkNetState["transactions"];
      notifications: WorkNetState["notifications"];
      jobMessages: WorkNetState["jobMessages"];
      jobInvitations: WorkNetState["jobInvitations"];
      savedJobs: WorkNetState["savedJobs"];
      applicationOverlays: WorkNetState["applicationOverlays"];
    };

function mergePrivate(
  current: WorkNetState,
  priv: Extract<PrivateBootstrapResponse, { activeProfileId: string }>,
): WorkNetState {
  const dedupeById = <T extends { id: string }>(...sets: T[][]) => {
    const map = new Map<string, T>();
    for (const set of sets) for (const item of set) map.set(item.id, item);
    return Array.from(map.values());
  };

  const next: WorkNetState = {
    ...current,
    activeProfileId: priv.activeProfileId,
    agents: dedupeById(current.agents, priv.ownedAgents),
    jobs: dedupeById(current.jobs, priv.privateJobs),
    applications: priv.applications,
    submissions: priv.submissions,
    reviews: priv.reviews,
    aiEvaluations: priv.aiEvaluations,
    transactions: dedupeById(current.transactions, priv.privateTransactions, priv.profileTransactions),
    notifications: priv.notifications,
    jobMessages: priv.jobMessages,
    jobInvitations: priv.jobInvitations,
    savedJobs: priv.savedJobs,
    applicationOverlays: priv.applicationOverlays,
  };

  if (stableJson(current) === stableJson(next)) return current;
  return next;
}

async function refreshWalletBalance(address: string) {
  const balance = await readArcUsdcBalance(address as Address);
  return Number(balance);
}

export function WorkNetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkNetState>(emptyState);
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false });
  const [walletError, setWalletError] = useState<string | undefined>();
  const [backendError, setBackendError] = useState<string | undefined>();
  const [isSyncing, setIsSyncing] = useState(true);
  const [isWalletPending, setIsWalletPending] = useState(false);
  const verifiedAddressRef = useRef<string | undefined>(undefined);

  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const primaryWallet = wallets[0];
  const creatingWalletRef = useRef(false);

  // Fallback: if auto-creation didn't fire (OAuth flow, config skew),
  // explicitly create an Ethereum embedded wallet once user is authenticated.
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    if (primaryWallet) return;
    const hasEmbedded = user.linkedAccounts?.some(
      (acc) => acc.type === "wallet" && (acc as { chainType?: string }).chainType === "ethereum",
    );
    if (hasEmbedded) return;
    if (creatingWalletRef.current) return;
    creatingWalletRef.current = true;
    void (async () => {
      try {
        await createWallet();
      } catch (error) {
        setWalletError(
          error instanceof Error ? error.message : "Could not create embedded wallet.",
        );
      } finally {
        creatingWalletRef.current = false;
      }
    })();
  }, [ready, authenticated, user, primaryWallet, createWallet]);

  const refreshState = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Public data first — fast, unblocks UI immediately.
      const { state: publicState } = await apiJson<{ state: WorkNetState }>("/api/bootstrap");
      setBackendError(undefined);
      setState((current) => mergeState(current, publicState, wallet.address));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load production data.";
      setBackendError(message);
      setState((current) => (current === emptyState && isDemoDataEnabled() ? seedState : current));
      setIsSyncing(false);
      return;
    }

    // Private slice — fetched lazily so the UI can render with public data
    // immediately. Failures here don't block the dashboard from rendering.
    try {
      const priv = await apiJson<PrivateBootstrapResponse>("/api/bootstrap/private");
      if (priv && "activeProfileId" in priv && priv.activeProfileId) {
        setState((current) => mergePrivate(current, priv));
      }
    } catch {
      // Private fetch is best-effort; public state already painted.
    } finally {
      setIsSyncing(false);
    }
  }, [wallet.address]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const refreshStateRef = useRef(refreshState);
  useEffect(() => {
    refreshStateRef.current = refreshState;
  }, [refreshState]);
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  // Live refs for state/wallet/activeProfile so action callbacks can have
  // empty deps and stable identity. Without these, every refresh would
  // invalidate every action and re-render every consumer.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const walletRef = useRef(wallet);
  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  // Subscribe to Supabase Realtime so the client refreshes the moment a server
  // mutation calls invalidateBootstrapCache(). Beats blind 3s polling by a
  // wide margin (no traffic when idle, sub-second latency when active).
  // Safety fallback: 60s refresh when tab is visible, in case the realtime
  // socket drops or Supabase isn't configured.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let unsub: (() => void) | undefined;

    if (hasSupabaseBrowserConfig()) {
      const supabase = getBrowserSupabase();
      if (supabase) {
        const channel = supabase
          .channel("arcworknet:bootstrap")
          .on("broadcast", { event: "bump" }, () => {
            if (document.visibilityState === "hidden") return;
            if (isSyncingRef.current) return;
            void refreshStateRef.current();
          })
          .subscribe();
        unsub = () => {
          void supabase.removeChannel(channel);
        };
      }
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (isSyncingRef.current) return;
      void refreshStateRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    const fallback = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (isSyncingRef.current) return;
      void refreshStateRef.current();
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(fallback);
      unsub?.();
    };
  }, []);

  const getProfile = useCallback(
    (profileId?: string) => state.profiles.find((profile) => profile.id === profileId),
    [state.profiles],
  );

  const getAgent = useCallback(
    (agentId?: string) => state.agents.find((agent) => agent.id === agentId),
    [state.agents],
  );

  const getJob = useCallback((jobId: string) => state.jobs.find((job) => job.id === jobId), [state.jobs]);

  const getJobApplications = useCallback(
    (jobId: string) => state.applications.filter((application) => application.jobId === jobId),
    [state.applications],
  );

  const getJobSubmissions = useCallback(
    (jobId: string) => state.submissions.filter((submission) => submission.jobId === jobId),
    [state.submissions],
  );

  const getJobEvaluation = useCallback(
    (submissionId?: string) =>
      state.aiEvaluations.find((evaluation) => evaluation.submissionId === submissionId),
    [state.aiEvaluations],
  );

  const activeProfile = useMemo(
    () => getProfile(state.activeProfileId),
    [getProfile, state.activeProfileId],
  );

  const activeProfileRef = useRef(activeProfile);
  useEffect(() => {
    activeProfileRef.current = activeProfile;
  }, [activeProfile]);

  const setActiveProfile = useCallback((profileId: string) => {
    setState((current) => ({ ...current, activeProfileId: profileId }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(emptyState);
    void refreshStateRef.current();
  }, []);

  const loadDemoData = useCallback(() => {
    if (!isDemoDataEnabled()) return;
    setState(seedState);
    setBackendError(undefined);
  }, []);

  const switchWalletToArc = useCallback(async () => {
    if (!primaryWallet) return;
    try {
      setWalletError(undefined);
      await ensureArcNetwork(primaryWallet);
      const balance = primaryWallet.address ? await refreshWalletBalance(primaryWallet.address) : undefined;
      setWallet((current) => ({
        ...current,
        chainId: ARC_TESTNET_CHAIN_ID,
        isConnected: Boolean(current.address),
        usdcBalanceUnits: balance,
        balanceUpdatedAt: balance === undefined ? current.balanceUpdatedAt : new Date().toISOString(),
      }));
    } catch (error) {
      setWalletError(
        error instanceof Error ? error.message : "Could not switch wallet to Arc Testnet.",
      );
    }
  }, [primaryWallet]);

  const verifyWalletSession = useCallback(
    async (
      wallet: NonNullable<typeof primaryWallet>,
      address: string,
      chainId: number,
    ) => {
      const nonce = await apiJson<{ message: string; nonce: string }>("/api/wallet/nonce", {
        method: "POST",
        body: JSON.stringify({ address, chainId }),
      });
      const signature = await wallet.sign(nonce.message);
      const verified = await apiJson<{ profile: Profile }>("/api/wallet/verify", {
        method: "POST",
        body: JSON.stringify({
          address,
          chainId,
          nonce: nonce.nonce,
          message: nonce.message,
          signature,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      return verified.profile;
    },
    [],
  );

  // Refs for values read inside SIWE effect — keeps the effect's dep array
  // small so background refreshes (which change state.profiles + isSyncing)
  // don't re-fire the effect and trigger a duplicate sign prompt.
  const stateProfilesRef = useRef(state.profiles);
  useEffect(() => {
    stateProfilesRef.current = state.profiles;
  }, [state.profiles]);
  const stateActiveProfileIdRef = useRef(state.activeProfileId);
  useEffect(() => {
    stateActiveProfileIdRef.current = state.activeProfileId;
  }, [state.activeProfileId]);
  const signInFlightRef = useRef(false);

  // Bind Privy wallet → backend SIWE session.
  // Fires once per address; skips signing if /api/bootstrap already returned
  // a profile matching this wallet (cookie still valid). Waits for bootstrap
  // to finish so we don't race-check against an empty profiles array.
  useEffect(() => {
    if (!ready || !authenticated || !primaryWallet?.address) return;
    if (verifiedAddressRef.current === primaryWallet.address) return;
    if (signInFlightRef.current) return;

    let cancelled = false;
    signInFlightRef.current = true;

    void (async () => {
      try {
        // Wait for initial bootstrap to finish so we can read profiles.
        while (isSyncingRef.current && !cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        if (cancelled) return;

        const address = primaryWallet.address;
        const lowerAddress = address.toLowerCase();
        const existingProfile = stateProfilesRef.current.find(
          (p) => p.walletAddress.toLowerCase() === lowerAddress,
        );

        // If SIWE cookie is still alive, bootstrap returns the matching profile
        // AND sets activeProfileId to that profile via the server-side session.
        // Trust that: skip re-signing on refresh.
        const cookieAuthed =
          existingProfile && stateActiveProfileIdRef.current === existingProfile.id;
        if (cookieAuthed) {
          verifiedAddressRef.current = address;
          const chainId = Number(primaryWallet.chainId?.split(":").pop() ?? ARC_TESTNET_CHAIN_ID);
          const balance = await refreshWalletBalance(address);
          if (cancelled) return;
          setWallet({
            address,
            chainId,
            isConnected: true,
            usdcBalanceUnits: balance,
            balanceUpdatedAt: new Date().toISOString(),
          });
          return;
        }

        setIsWalletPending(true);
        setWalletError(undefined);

        let chainId = Number(primaryWallet.chainId?.split(":").pop() ?? "0");
        if (chainId !== ARC_TESTNET_CHAIN_ID) {
          await ensureArcNetwork(primaryWallet);
          chainId = ARC_TESTNET_CHAIN_ID;
        }
        const balance = await refreshWalletBalance(address);
        const profile = await verifyWalletSession(primaryWallet, address, chainId);
        if (cancelled) return;

        verifiedAddressRef.current = address;
        setWallet({
          address,
          chainId,
          isConnected: true,
          usdcBalanceUnits: balance,
          balanceUpdatedAt: new Date().toISOString(),
        });
        setState((current) => ({
          ...current,
          activeProfileId: profile.id,
          profiles: [profile, ...current.profiles.filter((p) => p.id !== profile.id)],
        }));
        await refreshStateRef.current();
      } catch (error) {
        if (cancelled) return;
        setWalletError(error instanceof Error ? error.message : "Wallet session failed.");
      } finally {
        if (!cancelled) {
          setIsWalletPending(false);
        }
        signInFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, primaryWallet, verifyWalletSession]);

  const connectWallet = useCallback(async () => {
    try {
      setWalletError(undefined);
      // If a previous Privy session is still alive, clear it first so the
      // login modal shows the picker (email / Google / wallet) instead of
      // silently re-using the last connector and jumping to personal_sign.
      if (authenticated) {
        verifiedAddressRef.current = undefined;
        setWallet({ isConnected: false });
        await apiJson("/api/wallet/logout", { method: "POST" }).catch(() => undefined);
        await logout();
      }
      login();
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  }, [authenticated, login, logout]);

  const disconnectWallet = useCallback(async () => {
    verifiedAddressRef.current = undefined;
    setWallet({ isConnected: false });
    setWalletError(undefined);
    await apiJson("/api/wallet/logout", { method: "POST" }).catch(() => undefined);
    await logout();
  }, [logout]);

  const sendArcTransaction = useCallback(
    async (params: { to: Address; data: Hex }) => {
      if (!primaryWallet) throw new Error("Connect a wallet first.");
      const chainId = Number(primaryWallet.chainId?.split(":").pop() ?? "0");
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        await ensureArcNetwork(primaryWallet);
      }
      const provider = await primaryWallet.getEthereumProvider();
      const txBase = {
        from: primaryWallet.address,
        to: params.to,
        data: params.data,
      };

      let gasHex: Hex;
      try {
        const estimate = (await provider.request({
          method: "eth_estimateGas",
          params: [txBase],
        })) as Hex;
        // Pad 25% for safety against state drift between estimate and send.
        const padded = (BigInt(estimate) * BigInt(125)) / BigInt(100);
        gasHex = `0x${padded.toString(16)}` as Hex;
      } catch {
        // Fallback: 500k is enough for any ERC8183 / USDC approve call.
        gasHex = "0x7a120" as Hex;
      }

      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ ...txBase, gas: gasHex }],
      })) as Hex;
      return hash;
    },
    [primaryWallet],
  );

  const createJob = useCallback(async (input: CreateJobInput) => {
    const profile = activeProfileRef.current;
    if (!profile) throw new Error("Connect a wallet before creating a job.");
    const normalizedInput = {
      ...input,
      title: input.title.trim(),
      brief: input.brief.trim(),
      acceptanceCriteria: input.acceptanceCriteria.trim(),
      deliverableFormat: input.deliverableFormat.trim(),
      category: input.category.trim(),
    };

    const descriptionHash = await sha256Hex(
      stableJson({
        title: normalizedInput.title,
        brief: normalizedInput.brief,
        acceptanceCriteria: normalizedInput.acceptanceCriteria,
        deliverableFormat: normalizedInput.deliverableFormat,
      }),
    );
    const { job } = await apiJson<{ job: { id: string } }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        ...normalizedInput,
        clientProfileId: profile.id,
        descriptionHash,
      }),
    });
    await refreshStateRef.current();
    return job.id;
  }, []);

  const applyToJob = useCallback(
    async (jobId: string, pitch: string, agentId?: string) => {
      const profile = activeProfileRef.current;
      if (!profile) throw new Error("Connect a wallet before applying to jobs.");
      const body = agentId
        ? { actorType: "agent" as const, applicantAgentId: agentId, pitch }
        : { actorType: "human" as const, applicantProfileId: profile.id, pitch };
      await apiJson(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await refreshStateRef.current();
    },
    [],
  );

  const acceptApplication = useCallback(async (applicationId: string) => {
    const application = stateRef.current.applications.find((item) => item.id === applicationId);
    if (!application) return;
    await apiJson(`/api/jobs/${application.jobId}/accept-application`, {
      method: "POST",
      body: JSON.stringify({ applicationId }),
    });
    await refreshStateRef.current();
  }, []);

  const sendArcTransactionRef = useRef(sendArcTransaction);
  useEffect(() => {
    sendArcTransactionRef.current = sendArcTransaction;
  }, [sendArcTransaction]);

  const createOnchainJob = useCallback(async (jobId: string) => {
    const walletNow = walletRef.current;
    if (!walletNow.address) throw new Error("Connect a wallet before starting the job.");
    const job = stateRef.current.jobs.find((item) => item.id === jobId);
    if (!job) return;
    if (!job.providerAddress) throw new Error("Accept a provider before starting the job.");

    // ERC8183 rejects bytes32(0) for specHash. Compute on-the-fly if backend
    // didn't store one (e.g. legacy job rows from before descriptionHash was wired).
    let specHash = job.descriptionHash;
    if (!specHash || !/^0x[0-9a-fA-F]{64}$/.test(specHash)) {
      specHash = await sha256Hex(
        stableJson({
          title: job.title,
          brief: job.brief,
          acceptanceCriteria: job.acceptanceCriteria,
          deliverableFormat: job.deliverableFormat,
        }),
      );
    }

    // ERC-8183 reverts with InvalidDeadline() if expiredAt is in the past or
    // too close to now. Enforce at least 1 hour buffer; default 30 days when missing.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const minDeadline = nowSeconds + 60 * 60;
    const requestedDeadline = job.deadlineAt
      ? Math.floor(new Date(job.deadlineAt).getTime() / 1000)
      : nowSeconds + 30 * 24 * 60 * 60;
    const deadlineSeconds = Math.max(requestedDeadline, minDeadline);

    const data = encodeFunctionData({
      abi: erc8183Abi,
      functionName: "createJob",
      args: [
        job.providerAddress as Address,
        (job.evaluatorAddress ?? walletNow.address) as Address,
        BigInt(deadlineSeconds),
        specHash as Hex,
        (job.hookAddress ?? ZERO_ADDRESS) as Address,
      ],
    });
    const txHash = await sendArcTransactionRef.current({ to: ERC8183_CONTRACT_ADDRESS, data });
    const receipt = await waitForArcReceipt(txHash);
    await apiJson(`/api/jobs/${jobId}/create-onchain`, {
      method: "POST",
      body: JSON.stringify({
        txHash,
        arcJobId: getJobCreatedArcId(receipt),
        blockNumber: Number(receipt.blockNumber),
      }),
    });
    await refreshStateRef.current();
  }, []);

  const setBudget = useCallback(async (jobId: string) => {
    const walletNow = walletRef.current;
    if (!walletNow.address) throw new Error("Connect a wallet before setting budget.");
    const job = stateRef.current.jobs.find((item) => item.id === jobId);
    if (!job?.arcJobId) throw new Error("Start the job before setting a budget.");

    const data = encodeFunctionData({
      abi: erc8183Abi,
      functionName: "setBudget",
      args: [BigInt(job.arcJobId), BigInt(job.budgetUsdcUnits), "0x"],
    });
    const txHash = await sendArcTransactionRef.current({ to: ERC8183_CONTRACT_ADDRESS, data });
    const receipt = await waitForArcReceipt(txHash);
    await apiJson(`/api/jobs/${jobId}/set-budget`, {
      method: "POST",
      body: JSON.stringify({ txHash, blockNumber: Number(receipt.blockNumber) }),
    });
    await refreshStateRef.current();
  }, []);

  const approveAndFund = useCallback(async (jobId: string) => {
    const walletNow = walletRef.current;
    if (!walletNow.address) throw new Error("Connect a wallet before funding escrow.");
    const job = stateRef.current.jobs.find((item) => item.id === jobId);
    if (!job?.arcJobId) throw new Error("Start the job before funding escrow.");
    if (
      walletNow.usdcBalanceUnits !== undefined &&
      walletNow.usdcBalanceUnits < job.budgetUsdcUnits + ARC_USDC_GAS_BUFFER_UNITS
    ) {
      throw new Error(
        "Not enough USDC. Keep a small buffer above the job budget — the same balance pays gas and funds escrow.",
      );
    }

    const approveData = encodeFunctionData({
      abi: erc20UsdcAbi,
      functionName: "approve",
      args: [ERC8183_CONTRACT_ADDRESS, BigInt(job.budgetUsdcUnits)],
    });
    const approveTxHash = await sendArcTransactionRef.current({ to: ARC_USDC_ADDRESS, data: approveData });
    await waitForArcReceipt(approveTxHash);

    const fundData = encodeFunctionData({
      abi: erc8183Abi,
      functionName: "fund",
      args: [BigInt(job.arcJobId), "0x"],
    });
    const fundTxHash = await sendArcTransactionRef.current({ to: ERC8183_CONTRACT_ADDRESS, data: fundData });
    const receipt = await waitForArcReceipt(fundTxHash);

    await apiJson(`/api/jobs/${jobId}/fund`, {
      method: "POST",
      body: JSON.stringify({
        approveTxHash,
        txHash: fundTxHash,
        blockNumber: Number(receipt.blockNumber),
      }),
    });
    const balance = await refreshWalletBalance(walletNow.address);
    setWallet((current) => ({
      ...current,
      usdcBalanceUnits: balance,
      balanceUpdatedAt: new Date().toISOString(),
    }));
    await refreshStateRef.current();
  }, []);

  const submitDeliverable = useCallback(
    async (jobId: string, input: { url: string; notes: string }) => {
      const walletNow = walletRef.current;
      if (!walletNow.address) throw new Error("Connect a wallet before submitting deliverables.");
      const job = stateRef.current.jobs.find((item) => item.id === jobId);
      if (!job) throw new Error("Job not found.");
      if (!job.arcJobId) throw new Error("Start and fund the job before submitting deliverables.");
      const submissionId = crypto.randomUUID();
      const payload = {
        jobId,
        submissionId,
        urls: [input.url],
        notes: input.notes,
      };
      const deliverableHashBytes32 = await sha256Hex(stableJson(payload));
      const data = encodeFunctionData({
        abi: erc8183Abi,
        functionName: "submit",
        args: [BigInt(job.arcJobId), deliverableHashBytes32 as Hex, "0x"],
      });
      const submitTxHash = await sendArcTransactionRef.current({ to: ERC8183_CONTRACT_ADDRESS, data });
      const receipt = await waitForArcReceipt(submitTxHash);
      const blockNumber = Number(receipt.blockNumber);

      const { submission } = await apiJson<{ submission: { id: string } }>(`/api/jobs/${jobId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          submitterProfileId: activeProfileRef.current?.id,
          submitterAgentId: job.providerAgentId,
          notes: input.notes,
          deliverableUrl: input.url,
          deliverablePayload: payload,
          deliverableHashBytes32,
          submitTxHash,
          blockNumber,
        }),
      });
      await refreshStateRef.current();
      return submission.id;
    },
    [],
  );

  const reviewSubmission = useCallback(
    async (
      jobId: string,
      submissionId: string,
      input: { decision: "approve" | "request_revision" | "reject"; rating?: number; reviewText: string },
    ) => {
      const profile = activeProfileRef.current;
      const walletNow = walletRef.current;
      if (!profile) throw new Error("Connect a wallet before reviewing work.");
      if (!walletNow.address) throw new Error("Connect a wallet before reviewing work.");
      const job = stateRef.current.jobs.find((item) => item.id === jobId);
      if (!job) throw new Error("Job not found.");
      if (!job.arcJobId) throw new Error("Start and fund the job before reviewing work.");
      const reviewPayload = { jobId, submissionId, ...input };
      const reasonHashBytes32 = await sha256Hex(stableJson(reviewPayload));
      const reviewTxMethod =
        input.decision === "approve"
          ? "complete"
          : input.decision === "request_revision"
            ? "requestRevision"
            : "raiseDispute";
      const reviewData = encodeFunctionData({
        abi: erc8183Abi,
        functionName: reviewTxMethod,
        args:
          reviewTxMethod === "raiseDispute"
            ? [BigInt(job.arcJobId), reasonHashBytes32 as Hex]
            : [BigInt(job.arcJobId), reasonHashBytes32 as Hex, "0x"],
      });
      const reviewTxHash = await sendArcTransactionRef.current({ to: ERC8183_CONTRACT_ADDRESS, data: reviewData });
      const receipt = await waitForArcReceipt(reviewTxHash);
      const completeTxHash = input.decision === "approve" ? reviewTxHash : undefined;

      await apiJson(`/api/jobs/${jobId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          reviewerProfileId: profile.id,
          submissionId,
          rating: input.rating,
          reviewText: input.reviewText,
          reasonHashBytes32,
          completeTxHash,
          reviewTxHash,
          reviewTxMethod,
          blockNumber: Number(receipt.blockNumber),
          decision: input.decision,
        }),
      });
      await refreshStateRef.current();
    },
    [],
  );

  const requestRevision = useCallback(
    async (jobId: string, submissionId: string, reason: string) => {
      await reviewSubmission(jobId, submissionId, {
        decision: "request_revision",
        rating: 3,
        reviewText: reason,
      });
    },
    [reviewSubmission],
  );

  const rejectSubmission = useCallback(
    async (jobId: string, submissionId: string, reason: string) => {
      await reviewSubmission(jobId, submissionId, {
        decision: "reject",
        rating: 1,
        reviewText: reason,
      });
    },
    [reviewSubmission],
  );

  const completeJob = useCallback(
    async (jobId: string, submissionId: string, input: { rating: number; reviewText: string }) => {
      await reviewSubmission(jobId, submissionId, {
        decision: "approve",
        rating: input.rating,
        reviewText: input.reviewText,
      });
    },
    [reviewSubmission],
  );

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const profile = activeProfileRef.current;
    if (!profile) throw new Error("Connect a wallet before editing your profile.");
    await apiJson("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await refreshStateRef.current();
  }, []);

  const registerAgent = useCallback(
    async (input: { name: string; description: string; capabilities: string[]; walletAddress: string }) => {
      const profile = activeProfileRef.current;
      if (!profile) throw new Error("Connect a wallet before registering an agent.");
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await apiJson("/api/agents/register", {
        method: "POST",
        body: JSON.stringify({
          ownerProfileId: profile.id,
          name: input.name,
          slug,
          description: input.description,
          capabilities: input.capabilities,
          agentWalletAddress: input.walletAddress,
          metadataUri: `ipfs://pending-${slug}`,
        }),
      });
      await refreshStateRef.current();
    },
    [],
  );

  const dataValue = useMemo<DataContextValue>(
    () => ({
      state,
      activeProfile,
      backendError,
      isSyncing,
      refreshState,
      setActiveProfile,
      resetDemo,
      loadDemoData,
      getProfile,
      getAgent,
      getJob,
      getJobApplications,
      getJobSubmissions,
      getJobEvaluation,
    }),
    [
      state,
      activeProfile,
      backendError,
      isSyncing,
      refreshState,
      setActiveProfile,
      resetDemo,
      loadDemoData,
      getProfile,
      getAgent,
      getJob,
      getJobApplications,
      getJobSubmissions,
      getJobEvaluation,
    ],
  );

  const walletValue = useMemo<WalletContextValue>(
    () => ({
      wallet,
      walletError,
      isWalletPending,
      connectWallet,
      disconnectWallet,
      switchWalletToArc,
    }),
    [wallet, walletError, isWalletPending, connectWallet, disconnectWallet, switchWalletToArc],
  );

  // Actions never change identity — all callbacks above use refs internally.
  // Memoize once so this context literally never invalidates.
  const actionsValue = useMemo<ActionsContextValue>(
    () => ({
      createJob,
      applyToJob,
      acceptApplication,
      createOnchainJob,
      setBudget,
      approveAndFund,
      submitDeliverable,
      requestRevision,
      rejectSubmission,
      completeJob,
      registerAgent,
      updateProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <DataContext.Provider value={dataValue}>
      <WalletContext.Provider value={walletValue}>
        <ActionsContext.Provider value={actionsValue}>{children}</ActionsContext.Provider>
      </WalletContext.Provider>
    </DataContext.Provider>
  );
}

export function useWorkNetData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useWorkNetData must be used inside WorkNetProvider");
  return ctx;
}

export function useWorkNetWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWorkNetWallet must be used inside WorkNetProvider");
  return ctx;
}

export function useWorkNetActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useWorkNetActions must be used inside WorkNetProvider");
  return ctx;
}

// Backward-compatible aggregator. New code should prefer the granular hooks
// above so components only subscribe to the slice they actually use.
export function useWorkNet(): StoreContextValue {
  const data = useWorkNetData();
  const wallet = useWorkNetWallet();
  const actions = useWorkNetActions();
  return { ...data, ...wallet, ...actions };
}

export function nextOnchainAction(status: JobStatus) {
  if (status === "assigned") return "createJob";
  if (status === "onchain_created") return "setBudget";
  if (status === "budget_set" || status === "funding_pending") return "fund";
  return undefined;
}

export function walletBalanceLabel(wallet: WalletState) {
  return wallet.usdcBalanceUnits === undefined ? "Not indexed" : formatUsdcUnits(wallet.usdcBalanceUnits);
}
