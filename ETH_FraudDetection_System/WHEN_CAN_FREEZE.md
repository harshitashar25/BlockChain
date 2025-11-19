# 🔒 When Can You Freeze Funds?

## ❌ **Current Problem: "No assets found"**

You're seeing this because **the case doesn't have asset references yet**. The system needs to **trace the fraud trail first** to identify which assets to freeze.

---

## ✅ **WHEN You Can Freeze:**

You can freeze funds **ONLY AFTER** the system has:

1. ✅ **Traced the fraud trail** (from UTR → Bank → Exchange → Wallet)
2. ✅ **Found asset references** (bank accounts, exchange orders, wallet addresses)
3. ✅ **Updated the case** with those asset references

---

## 🎯 **Step-by-Step: When to Freeze**

### **Step 1: Submit Case with UTR** ✅

**When:** First step - Bank reports fraud

**What you do:**
- Go to "Bank Report" page
- Fill form with UTR number
- Submit case

**Status:** Case created, but **NO assets yet** ❌

---

### **Step 2: Run Trace (AUTOMATIC or MANUAL)** ⚠️

**When:** After case is submitted

**What happens:**
- System traces: UTR → Bank Account → Exchange → Wallet → Blockchain
- Finds all connected assets
- Updates case with asset references

**Status:** Case now has **asset references** ✅

---

### **Step 3: Request Freeze** ✅

**When:** AFTER Step 2 is complete (assets found)

**What you do:**
- Go to "LEA Dashboard"
- Find your case
- Click "Request Freeze"
- **NOW it will work!** (because assets exist)

**Status:** Freeze requested, waiting for approvals

---

### **Step 4: Approve 3 Times** ✅

**When:** After freeze is requested

**What you do:**
- Click "Approve" button 3 times
- Or 3 different people approve

**Status:** Freeze activates automatically

---

### **Step 5: Funds Frozen** 🎉

**When:** After 3rd approval

**What happens automatically:**
- All bank accounts frozen
- All exchange accounts frozen
- All wallet addresses frozen

**Status:** Funds are frozen! ✅

---

## 🔍 **How to Check if Assets Exist**

### **In LEA Dashboard:**

Look at the case row:
- ✅ **Has assets:** Shows asset references in the table
- ❌ **No assets:** Shows "No assets specified" or empty

### **In Case Details Modal:**

Look for "Asset References" section:
- ✅ **Has assets:** Shows list like:
  ```
  bank:abc123def456
  exchange:P2P-ORDER-001
  chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  ```
- ❌ **No assets:** Shows "No assets specified"

---

## 🚨 **Why "No Assets Found"?**

### **Reason 1: Case Created Without UTR**

**Problem:** Case was submitted without UTR number

**Solution:**
1. Go to LEA Dashboard
2. Find the case
3. Click "Run Trace" button
4. Enter UTR: `UTR123456789`
5. System will trace and add assets

---

### **Reason 2: Trace Not Run Yet**

**Problem:** Case has UTR but trace wasn't executed

**Solution:**
- **Option A:** Use "Run Trace" button in LEA Dashboard
- **Option B:** Wait for automatic trace (if Bank Report was used with UTR)

---

### **Reason 3: Invalid UTR**

**Problem:** UTR doesn't exist in mock bank database

**Solution:** Use valid UTR from synthetic dataset:
- `UTR123456789` ✅
- `UTR987654321` ✅
- `UTR555666777` ✅

---

## ✅ **QUICK FIX: Get Assets Now**

### **Method 1: Run Trace Button (Easiest)**

1. Go to **LEA Dashboard**
2. Find your case (the one showing "No assets")
3. Click **"Run Trace"** button
4. Enter UTR: `UTR123456789`
5. Click OK
6. Wait 10-30 seconds
7. Refresh page
8. **Assets will now appear!** ✅
9. Click "Request Freeze"

---

### **Method 2: Use API Directly**

```bash
# Step 1: Run trace
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{"utr": "UTR123456789"}'

# Step 2: Copy the asset_refs from response

# Step 3: Request freeze with those assets
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "YOUR-CASE-ID",
    "evidenceHash": "sha256:test",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": [
      "bank:abc123def456",
      "exchange:P2P-ORDER-001",
      "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    ]
  }'
```

---

## 📋 **Complete Timeline**

```
Time 0: Submit case (with UTR)
  ↓
Time 1: System runs trace automatically
  ↓
Time 2: Assets found and added to case
  ↓
Time 3: NOW you can freeze! ✅
  ↓
Time 4: Request freeze
  ↓
Time 5: Approve 3 times
  ↓
Time 6: Funds frozen! 🎉
```

---

## 🎯 **Summary: When Can You Freeze?**

**You can freeze funds WHEN:**

1. ✅ Case has been submitted
2. ✅ Trace has been run (automatic or manual)
3. ✅ Asset references exist in the case
4. ✅ You see assets in "Asset References" section

**You CANNOT freeze funds WHEN:**

1. ❌ Case has no UTR
2. ❌ Trace hasn't been run yet
3. ❌ No asset references found
4. ❌ Shows "No assets specified"

---

## 🚀 **Action Plan for Your Current Case**

1. **Check if case has UTR:**
   - Open case details
   - Look for UTR field

2. **If UTR exists:**
   - Click "Run Trace" button
   - Enter the UTR
   - Wait for assets to appear

3. **If no UTR:**
   - Create new case via "Bank Report"
   - Use UTR: `UTR123456789`
   - System will auto-trace

4. **Once assets appear:**
   - Click "Request Freeze"
   - Approve 3 times
   - Funds will freeze!

---

## 💡 **Pro Tip**

**Always check asset references BEFORE requesting freeze:**
- If you see assets → You can freeze ✅
- If you see "No assets" → Run trace first ⚠️

**The "Run Trace" button is your friend!** Use it whenever you see "No assets found".

