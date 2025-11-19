package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// FraudChainContract provides functions for managing fraud cases and freezes
type FraudChainContract struct {
	contractapi.Contract
}

// Case represents a fraud case
type Case struct {
	CaseID           string   `json:"case_id"`
	EvidenceHash     string   `json:"evidence_hash"`
	Requester        string   `json:"requester"`
	RequestedBy      string   `json:"requested_by"` // Alias for requester
	CreatedAt        string   `json:"created_at"`
	Status           string   `json:"status"`
	FreezeActive     bool     `json:"freeze_active"`
	Approvals        []string `json:"approvals"`
	RequiredApprovals int     `json:"required_approvals"`
	AssetRefs        []string `json:"asset_refs"`
	Severity         string   `json:"severity"`
}

// SubmitEvidence submits evidence for a fraud case
func (s *FraudChainContract) SubmitEvidence(ctx contractapi.TransactionContextInterface, caseID string, evidenceHash string, requester string) error {
	// Check if case already exists
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if caseJSON != nil {
		return fmt.Errorf("case %s already exists", caseID)
	}

	caseObj := Case{
		CaseID:           caseID,
		EvidenceHash:     evidenceHash,
		Requester:        requester,
		RequestedBy:      requester, // Alias
		CreatedAt:        ctx.GetStub().GetTxTimestamp().String(),
		Status:           "SUBMITTED",
		FreezeActive:     false,
		Approvals:        []string{},
		RequiredApprovals: 3, // 3-of-3 approval required
		AssetRefs:        []string{},
		Severity:         "medium", // Default severity
	}

	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(caseID, caseJSON)
	if err != nil {
		return fmt.Errorf("failed to put case to world state: %v", err)
	}

	// Emit event
	eventPayload := fmt.Sprintf(`{"case_id":"%s","evidence_hash":"%s","requester":"%s","event":"FraudReported"}`, caseID, evidenceHash, requester)
	return ctx.GetStub().SetEvent("FraudReported", []byte(eventPayload))
}

// RequestFreeze requests a freeze for a case
func (s *FraudChainContract) RequestFreeze(ctx contractapi.TransactionContextInterface, caseID string, assetRef string) error {
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if caseJSON == nil {
		return fmt.Errorf("case %s does not exist", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		return err
	}

	// Add asset reference if not already present
	found := false
	for _, ref := range caseObj.AssetRefs {
		if ref == assetRef {
			found = true
			break
		}
	}
	if !found {
		caseObj.AssetRefs = append(caseObj.AssetRefs, assetRef)
	}

	caseObj.Status = "FREEZE_REQUESTED"

	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// ApproveFreeze approves a freeze request (N-of-M multisig)
func (s *FraudChainContract) ApproveFreeze(ctx contractapi.TransactionContextInterface, caseID string, approver string) error {
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if caseJSON == nil {
		return fmt.Errorf("case %s does not exist", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		return err
	}

	// Check if already approved by this approver
	for _, existingApprover := range caseObj.Approvals {
		if existingApprover == approver {
			return fmt.Errorf("freeze already approved by %s", approver)
		}
	}

	// Add approval
	caseObj.Approvals = append(caseObj.Approvals, approver)

	// Check if threshold reached (3-of-3 for production)
	threshold := caseObj.RequiredApprovals
	if threshold == 0 {
		threshold = 3 // Default to 3 if not set
	}
	
	if len(caseObj.Approvals) >= threshold {
		caseObj.FreezeActive = true
		caseObj.Status = "FREEZE_ACTIVE"

		// Emit FreezeActivated event
		assetRefsJSON, _ := json.Marshal(caseObj.AssetRefs)
		eventPayload := fmt.Sprintf(`{"case_id":"%s","asset_refs":%s,"evidence_hash":"%s","event":"FreezeActivated"}`, caseID, string(assetRefsJSON), caseObj.EvidenceHash)
		ctx.GetStub().SetEvent("FreezeActivated", []byte(eventPayload))
	} else {
		// Update status based on approval count
		if len(caseObj.Approvals) == 1 {
			caseObj.Status = "PENDING_APPROVAL"
		} else {
			caseObj.Status = "FREEZE_REQUESTED"
		}
	}

	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetCase returns the case stored in the world state with given id
func (s *FraudChainContract) GetCase(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if caseJSON == nil {
		return nil, fmt.Errorf("case %s does not exist", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		return nil, err
	}

	return &caseObj, nil
}

// GetAllCases returns all cases found in world state
func (s *FraudChainContract) GetAllCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var cases []*Case
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var caseObj Case
		err = json.Unmarshal(queryResponse.Value, &caseObj)
		if err != nil {
			return nil, err
		}
		cases = append(cases, &caseObj)
	}

	return cases, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&FraudChainContract{})
	if err != nil {
		fmt.Printf("Error creating fraudchain chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting fraudchain chaincode: %v", err)
	}
}

