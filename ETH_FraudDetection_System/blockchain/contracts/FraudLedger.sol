pragma solidity ^0.8.0;

contract FraudLedger {
    // Define the status for a reported case
    enum CaseStatus { Reported, Frozen }

    // Define the structure to store fraud case details
    struct FraudCase {
        string caseId;
        string fromAccount;
        string toAccount;
        uint amount;
        CaseStatus status; // Default is Reported
    }

    // Mapping to store cases, keyed by caseId
    mapping(string => FraudCase) public cases;

    // State variables for easy testing
    address public leaAddress; // Law Enforcement Agency address
    address public bankAddress; // Reporting Bank address

    // Events to signal status changes to the frontend
    event FraudReported(string caseId, string fromAccount, string toAccount, uint amount);
    event HoldExecuted(string caseId, string toAccount);

    // Constructor sets the initial Bank and LEA addresses (for simplicity, set to deployer)
    constructor() {
        leaAddress = msg.sender;
        bankAddress = msg.sender;
        // In a real application, these would likely be set to specific, authorized addresses.
    }

    /**
     * @notice Allows the designated bank to report a fraudulent transaction.
     * @param _caseId A unique ID for the case.
     * @param _from The sender account.
     * @param _to The receiving account.
     * @param _amount The transaction amount.
     */
    function reportFraud(
        string memory _caseId,
        string memory _from,
        string memory _to,
        uint _amount
    ) public {
        require(msg.sender == bankAddress, "Only the designated Bank can report fraud.");

        FraudCase storage newCase = cases[_caseId];
        newCase.caseId = _caseId;
        newCase.fromAccount = _from;
        newCase.toAccount = _to;
        newCase.amount = _amount;
        newCase.status = CaseStatus.Reported; // Set initial status to Reported

        emit FraudReported(_caseId, _from, _to, _amount);
    }

    /**
     * @notice Allows the designated LEA to place a provisional hold on the funds.
     * @param _caseId The ID of the case to freeze.
     */
    function triggerProvisionalHold(string memory _caseId) public {
        require(msg.sender == leaAddress, "Only the designated LEA can freeze funds.");

        FraudCase storage caseToFreeze = cases[_caseId];
        // Ensure the case exists and is not already frozen (optional)
        require(bytes(caseToFreeze.caseId).length > 0, "Case ID not found.");

        caseToFreeze.status = CaseStatus.Frozen; // Update status to Frozen

        emit HoldExecuted(_caseId, caseToFreeze.toAccount);
    }
}

