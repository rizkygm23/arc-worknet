// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract ArcWorknetEscrow {
    enum JobStatus {
        None,
        Created,
        BudgetSet,
        Funded,
        Submitted,
        RevisionRequested,
        Completed,
        Cancelled,
        Disputed
    }

    struct Job {
        address client;
        address provider;
        address evaluator;
        address hook;
        uint256 budget;
        uint256 fundedAmount;
        uint256 expiredAt;
        string description;
        bytes32 deliverableHash;
        bytes32 completionReasonHash;
        JobStatus status;
    }

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1_000;

    IERC20 public immutable paymentToken;
    address public owner;
    address public feeRecipient;
    uint256 public platformFeeBps;
    uint256 public nextJobId = 1;

    mapping(uint256 => Job) public jobs;

    bool private locked;

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed provider
    );
    event BudgetSet(uint256 indexed jobId, uint256 amount);
    event Funded(uint256 indexed jobId, address indexed client, uint256 amount);
    event Submitted(uint256 indexed jobId, address indexed provider, bytes32 deliverableHash);
    event RevisionRequested(uint256 indexed jobId, address indexed evaluator, bytes32 reasonHash);
    event Completed(
        uint256 indexed jobId,
        address indexed evaluator,
        address indexed provider,
        uint256 providerPayout,
        uint256 platformFee,
        bytes32 reasonHash
    );
    event Cancelled(uint256 indexed jobId, address indexed actor);
    event Refunded(uint256 indexed jobId, address indexed client, uint256 amount);
    event Disputed(uint256 indexed jobId, address indexed actor, bytes32 reasonHash);
    event DisputeResolved(
        uint256 indexed jobId,
        address indexed resolver,
        uint256 providerPayout,
        uint256 clientRefund,
        bytes32 reasonHash
    );
    event Applied(uint256 indexed jobId, address indexed applicant, bytes32 applicationHash);
    event ProviderChanged(uint256 indexed jobId, address indexed provider);
    event FeeRecipientUpdated(address indexed feeRecipient);
    event PlatformFeeUpdated(uint256 platformFeeBps);
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotClient();
    error NotProvider();
    error NotEvaluator();
    error NotParticipant();
    error InvalidAddress();
    error InvalidBudget();
    error InvalidDeadline();
    error InvalidStatus();
    error JobNotFound();
    error DeadlineNotPassed();
    error TransferFailed();
    error Reentrancy();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyClient(uint256 jobId) {
        if (msg.sender != jobs[jobId].client) revert NotClient();
        _;
    }

    modifier onlyProvider(uint256 jobId) {
        if (msg.sender != jobs[jobId].provider) revert NotProvider();
        _;
    }

    modifier onlyEvaluator(uint256 jobId) {
        if (msg.sender != jobs[jobId].evaluator) revert NotEvaluator();
        _;
    }

    modifier jobExists(uint256 jobId) {
        if (jobs[jobId].status == JobStatus.None) revert JobNotFound();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Reentrancy();
        locked = true;
        _;
        locked = false;
    }

    constructor(address paymentToken_, address feeRecipient_, uint256 platformFeeBps_) {
        if (paymentToken_ == address(0) || feeRecipient_ == address(0)) revert InvalidAddress();
        if (platformFeeBps_ > MAX_PLATFORM_FEE_BPS) revert InvalidBudget();

        paymentToken = IERC20(paymentToken_);
        owner = msg.sender;
        feeRecipient = feeRecipient_;
        platformFeeBps = platformFeeBps_;

        emit OwnerTransferred(address(0), msg.sender);
        emit FeeRecipientUpdated(feeRecipient_);
        emit PlatformFeeUpdated(platformFeeBps_);
    }

    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external returns (uint256 jobId) {
        if (provider == address(0) || provider == msg.sender) revert InvalidAddress();
        if (expiredAt != 0 && expiredAt <= block.timestamp) revert InvalidDeadline();

        jobId = nextJobId++;

        jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator == address(0) ? msg.sender : evaluator,
            hook: hook,
            budget: 0,
            fundedAmount: 0,
            expiredAt: expiredAt,
            description: description,
            deliverableHash: bytes32(0),
            completionReasonHash: bytes32(0),
            status: JobStatus.Created
        });

        emit JobCreated(jobId, msg.sender, provider);
    }

    function applyToJob(uint256 jobId, bytes32 applicationHash) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (msg.sender == job.client || msg.sender == job.provider) revert InvalidAddress();

        emit Applied(jobId, msg.sender, applicationHash);
    }

    function changeProvider(
        uint256 jobId,
        address provider
    ) external jobExists(jobId) onlyClient(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created && job.status != JobStatus.BudgetSet) revert InvalidStatus();
        if (provider == address(0) || provider == job.client) revert InvalidAddress();

        job.provider = provider;
        emit ProviderChanged(jobId, provider);
    }

    function setBudget(
        uint256 jobId,
        uint256 amount,
        bytes calldata
    ) external jobExists(jobId) onlyClient(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created && job.status != JobStatus.BudgetSet) revert InvalidStatus();
        if (amount == 0) revert InvalidBudget();

        job.budget = amount;
        job.status = JobStatus.BudgetSet;

        emit BudgetSet(jobId, amount);
    }

    function fund(
        uint256 jobId,
        bytes calldata
    ) external jobExists(jobId) onlyClient(jobId) nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.BudgetSet) revert InvalidStatus();
        if (job.budget == 0) revert InvalidBudget();
        if (job.expiredAt != 0 && job.expiredAt <= block.timestamp) revert InvalidDeadline();

        job.status = JobStatus.Funded;
        job.fundedAmount = job.budget;

        _safeTransferFrom(address(paymentToken), msg.sender, address(this), job.budget);

        emit Funded(jobId, msg.sender, job.budget);
    }

    function submit(
        uint256 jobId,
        bytes32 deliverableHash,
        bytes calldata
    ) external jobExists(jobId) onlyProvider(jobId) {
        Job storage job = jobs[jobId];
        if (
            job.status != JobStatus.Funded &&
            job.status != JobStatus.Submitted &&
            job.status != JobStatus.RevisionRequested
        ) {
            revert InvalidStatus();
        }
        if (deliverableHash == bytes32(0)) revert InvalidBudget();

        job.deliverableHash = deliverableHash;
        job.status = JobStatus.Submitted;

        emit Submitted(jobId, msg.sender, deliverableHash);
    }

    function requestRevision(
        uint256 jobId,
        bytes32 reasonHash,
        bytes calldata
    ) external jobExists(jobId) onlyEvaluator(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert InvalidStatus();

        job.status = JobStatus.RevisionRequested;

        emit RevisionRequested(jobId, msg.sender, reasonHash);
    }

    function complete(
        uint256 jobId,
        bytes32 reasonHash,
        bytes calldata
    ) external jobExists(jobId) onlyEvaluator(jobId) nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert InvalidStatus();

        uint256 amount = job.fundedAmount;
        uint256 platformFee = (amount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 providerPayout = amount - platformFee;

        job.status = JobStatus.Completed;
        job.completionReasonHash = reasonHash;
        job.fundedAmount = 0;

        if (platformFee > 0) {
            _safeTransfer(address(paymentToken), feeRecipient, platformFee);
        }
        _safeTransfer(address(paymentToken), job.provider, providerPayout);

        emit Completed(jobId, msg.sender, job.provider, providerPayout, platformFee, reasonHash);
    }

    function cancelUnfunded(uint256 jobId) external jobExists(jobId) onlyClient(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created && job.status != JobStatus.BudgetSet) revert InvalidStatus();

        job.status = JobStatus.Cancelled;

        emit Cancelled(jobId, msg.sender);
    }

    function refundExpired(uint256 jobId) external jobExists(jobId) nonReentrant {
        Job storage job = jobs[jobId];
        if (msg.sender != job.client && msg.sender != job.evaluator) revert NotParticipant();
        if (
            job.status != JobStatus.Funded &&
            job.status != JobStatus.Submitted &&
            job.status != JobStatus.RevisionRequested
        ) {
            revert InvalidStatus();
        }
        if (job.expiredAt == 0 || block.timestamp <= job.expiredAt) revert DeadlineNotPassed();

        uint256 amount = job.fundedAmount;
        job.status = JobStatus.Cancelled;
        job.fundedAmount = 0;

        _safeTransfer(address(paymentToken), job.client, amount);

        emit Refunded(jobId, job.client, amount);
    }

    function raiseDispute(
        uint256 jobId,
        bytes32 reasonHash
    ) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        if (msg.sender != job.client && msg.sender != job.provider && msg.sender != job.evaluator) {
            revert NotParticipant();
        }
        if (
            job.status != JobStatus.Funded &&
            job.status != JobStatus.Submitted &&
            job.status != JobStatus.RevisionRequested
        ) {
            revert InvalidStatus();
        }

        job.status = JobStatus.Disputed;

        emit Disputed(jobId, msg.sender, reasonHash);
    }

    function resolveDispute(
        uint256 jobId,
        uint256 providerAmount,
        bytes32 reasonHash
    ) external jobExists(jobId) onlyOwner nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed) revert InvalidStatus();
        if (providerAmount > job.fundedAmount) revert InvalidBudget();

        uint256 clientRefund = job.fundedAmount - providerAmount;
        uint256 platformFee = (providerAmount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 providerPayout = providerAmount - platformFee;

        job.status = providerAmount == 0 ? JobStatus.Cancelled : JobStatus.Completed;
        job.completionReasonHash = reasonHash;
        job.fundedAmount = 0;

        if (platformFee > 0) {
            _safeTransfer(address(paymentToken), feeRecipient, platformFee);
        }
        if (providerPayout > 0) {
            _safeTransfer(address(paymentToken), job.provider, providerPayout);
        }
        if (clientRefund > 0) {
            _safeTransfer(address(paymentToken), job.client, clientRefund);
        }

        emit DisputeResolved(jobId, msg.sender, providerPayout, clientRefund, reasonHash);
    }

    function setFeeRecipient(address feeRecipient_) external onlyOwner {
        if (feeRecipient_ == address(0)) revert InvalidAddress();

        feeRecipient = feeRecipient_;

        emit FeeRecipientUpdated(feeRecipient_);
    }

    function setPlatformFeeBps(uint256 platformFeeBps_) external onlyOwner {
        if (platformFeeBps_ > MAX_PLATFORM_FEE_BPS) revert InvalidBudget();

        platformFeeBps = platformFeeBps_;

        emit PlatformFeeUpdated(platformFeeBps_);
    }

    function transferOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();

        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
