# CorDapp Fraud Reporting System - Project Overview

## 🎯 Project Goal
Build a police-ready CorDapp for fraud reporting that allows banks to report fraud cases and police to freeze accounts, with all transactions recorded immutably on the Corda blockchain.

---

## 👥 Team Structure

### **Developer 1: Core CorDapp (Backend)**
- **Focus:** Corda blockchain layer
- **Deliverables:** States, Contracts, Flows, Node setup, RPC interface
- **Quick Start:** See `WORKSTREAM1_QUICKSTART.md`

### **Developer 2: Adapters & Integration (Frontend/Integration)**
- **Focus:** REST APIs, Evidence Vault, React UI, Real-time notifications
- **Deliverables:** Bank Adapter, Police Adapter, Evidence Service, React UI
- **Quick Start:** See `WORKSTREAM2_QUICKSTART.md`

---

## 📋 Documentation Index

### Core Development Documents
1. **TASK_DIVISION.md** - Complete task breakdown and responsibilities
2. **WORKSTREAM1_QUICKSTART.md** - Step-by-step guide for Developer 1
3. **WORKSTREAM2_QUICKSTART.md** - Step-by-step guide for Developer 2
4. **COORDINATION_CHECKLIST.md** - Progress tracking and handoff points

### Comprehensive System Documentation
5. **EXECUTIVE_SUMMARY.md** - High-level overview for executives and stakeholders
6. **EXPANDED_PROBLEM_STATEMENT.md** - Detailed problem analysis and requirements
7. **FEATURE_MATRIX.md** - Complete feature breakdown and prioritization
8. **SYSTEM_OVERVIEW.md** - System architecture and workflows
9. **DOCUMENTATION_INDEX.md** - Complete documentation navigation guide

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Bank UI    │────────▶│ Bank Adapter │────────▶│  BankA Node │
│  (React)    │         │  (REST API)  │         │   (Corda)   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         │ Corda Network
                                                         │
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ Police UI   │────────▶│Police Adapter│────────▶│PoliceLEA Node│
│  (React)    │         │  (REST API)  │         │   (Corda)   │
└─────────────┘         └──────────────┘         └─────────────┘
                                │
                                │
                        ┌───────┴───────┐
                        │ Evidence Vault│
                        │  (Off-chain)  │
                        └───────────────┘
```

### Key Components

1. **Corda Network** (Workstream 1)
   - BankA Node: Reports fraud cases
   - PoliceLEA Node: Views cases and triggers freezes
   - Notary Node: Validates transactions

2. **Adapters** (Workstream 2)
   - Bank Adapter: REST API for banks to report fraud
   - Police Adapter: REST API for police to manage cases
   - Evidence Vault: Stores evidence files off-chain, returns hashes

3. **Frontend** (Workstream 2)
   - Bank Dashboard: Report fraud cases
   - Police Dashboard: View cases, trigger freezes, real-time updates

---

## 🚀 Quick Start (Both Teams)

### Prerequisites
- Java 11+ JDK
- IntelliJ IDEA (recommended) or VS Code
- Node.js 16+ (for React UI)
- Git

### Day 1 Setup

**Developer 1:**
```bash
# Clone/create CorDapp project
git clone <template> fraud-cordapp
cd fraud-cordapp
# Follow WORKSTREAM1_QUICKSTART.md
```

**Developer 2:**
```bash
# Create adapter projects
mkdir -p adapters/bank-adapter adapters/police-adapter
cd adapters/bank-adapter
# Follow WORKSTREAM2_QUICKSTART.md
```

---

## 🔄 Workflow

### Typical Flow

1. **Bank reports fraud:**
   - Bank UI → Bank Adapter → Upload evidence → Get hash
   - Bank Adapter → Corda RPC → ReportFraudFlow → Creates FraudCaseState

2. **Police views case:**
   - Police UI → Police Adapter → Query vault → Display cases

3. **Police triggers freeze:**
   - Police UI → Police Adapter → TriggerFreezeFlow → Updates state to FROZEN

4. **Real-time notification:**
   - Corda vault update → Police Adapter subscription → WebSocket → Police UI updates

---

## 📊 Progress Tracking

Use `COORDINATION_CHECKLIST.md` to:
- Track daily progress
- Coordinate handoffs
- Log blockers and issues
- Plan weekly milestones

---

## 🔗 Key Interfaces

### RPC Interface (Workstream 1 → Workstream 2)

**ReportFraudFlow:**
```kotlin
ReportFraudFlow(
    caseId: String,
    fromAccount: String,
    toAccount: String,
    amount: Long,
    evidenceHash: String,
    police: Party,
    receivingBank: Party?
)
```

**TriggerFreezeFlow:**
```kotlin
TriggerFreezeFlow(
    linearId: UniqueIdentifier
)
```

**Query Vault:**
```kotlin
vaultQuery(FraudCaseState::class.java)
```

### REST API Interface (Workstream 2 → Frontend)

**Bank Adapter:**
- `POST /api/bank/report` - Report fraud
- `GET /api/bank/cases` - List cases
- `GET /api/bank/cases/{linearId}` - Get case details

**Police Adapter:**
- `GET /api/police/cases` - List cases
- `GET /api/police/cases/{linearId}` - Get case details
- `POST /api/police/cases/{linearId}/freeze` - Trigger freeze

**Evidence Vault:**
- `POST /api/evidence/upload` - Upload evidence
- `GET /api/evidence/{hash}` - Retrieve evidence

---

## 🧪 Testing Strategy

### Workstream 1
- Unit tests for contracts (MockNetwork)
- Flow tests (DriverDSL)
- Manual RPC testing

### Workstream 2
- Unit tests with mocked RPC
- Integration tests with real RPC
- End-to-end UI tests

### Combined
- Full flow: Report → View → Freeze
- Real-time updates
- Error scenarios

---

## 📅 Timeline

- **Week 1:** Setup and core implementation
- **Week 2:** Testing and RPC integration
- **Week 3:** Full integration and UI
- **Week 4:** Polish, testing, and deployment

See `COORDINATION_CHECKLIST.md` for detailed timeline.

---

## 🆘 Getting Help

### Common Issues

**Nodes won't start:**
- Check ports aren't in use
- Verify certificates generated
- Check logs in `build/nodes/*/logs/`

**RPC connection fails:**
- Verify nodes are running
- Check RPC port matches config
- Verify credentials

**Adapter can't connect:**
- Check RPC host/port
- Verify network connectivity
- Check firewall settings

### Resources

- Corda Docs: https://docs.corda.net/
- Corda Samples: https://github.com/corda/samples
- Spring Boot Docs: https://spring.io/projects/spring-boot

---

## ✅ Success Criteria

### Technical
- [ ] All flows execute successfully
- [ ] Contract verification passes
- [ ] REST APIs respond in < 500ms
- [ ] Real-time updates work
- [ ] Evidence can be uploaded/retrieved

### Functional
- [ ] Bank can report fraud
- [ ] Police can view cases
- [ ] Police can trigger freeze
- [ ] States recorded on ledger
- [ ] End-to-end flow works

---

## 📝 Next Steps

1. **Both teams:** Read your respective quickstart guide
2. **Day 1:** Set up projects and create basic structure
3. **End of Week 1:** First handoff - RPC interface documentation
4. **End of Week 2:** Second handoff - Working nodes
5. **End of Week 3:** Integration complete
6. **Week 4:** Testing and deployment

---

## 🎓 Learning Resources

### Corda
- [Corda Documentation](https://docs.corda.net/)
- [CorDapp Samples](https://github.com/corda/samples)
- [Flow Cookbook](https://docs.corda.net/docs/corda-os/4.10/flow-cookbook.html)

### Spring Boot + Corda
- [Spring WebServer Sample](https://github.com/corda/samples/tree/release-V4/spring-webserver)
- [Corda RPC Client](https://docs.corda.net/docs/corda-os/4.10/clientrpc.html)

### React
- [React Documentation](https://react.dev/)
- [WebSocket with React](https://react.dev/learn/synchronizing-with-effects#connecting-to-a-chat-server)

---

**Good luck! Both teams can work independently with clear interfaces. 🚀**

For questions or issues, refer to the detailed guides or coordinate via the checklist.

