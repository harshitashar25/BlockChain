# Mutual TLS (MTLS) Setup Guide

## Production Bank/Exchange Integration

For production integrations with banks and exchanges, mutual TLS (MTLS) is required for secure communication.

## Prerequisites

- OpenSSL installed
- Bank/exchange provided CA certificate
- Client certificate and key (provided by bank/exchange)

## Generate Client Certificate (if needed)

```bash
# Generate private key
openssl genrsa -out client.key 2048

# Generate certificate signing request
openssl req -new -key client.key -out client.csr

# Submit CSR to bank/exchange for signing
# They will return client.crt
```

## Environment Variables

Add to `.env`:

```bash
USE_MTLS=true
MTLS_CLIENT_CERT_PATH=./certs/client.crt
MTLS_CLIENT_KEY_PATH=./certs/client.key
MTLS_CA_CERT_PATH=./certs/ca.crt
```

## API Contract (OpenAPI)

### POST /api/bank/hold

**Headers:**
- `Mutual-TLS`: Client certificate (automatic via HTTPS)
- `X-Request-ID`: UUID for request tracking
- `Date`: UTC timestamp
- `X-Signature`: PKCS7 signature of request body (optional, if required by bank)

**Body:**
```json
{
  "caseId": "CASE-001",
  "assetRef": "ACCOUNT_HASH_OR_WALLET_ADDRESS",
  "evidenceHash": "sha256_hash_of_evidence_bundle",
  "evidenceBundleUrl": "https://evidence-vault.example.com/bundles/CASE-001"
}
```

**Response:**
```json
{
  "ok": true,
  "status": "HOLD_PLACED",
  "hold_id": "HOLD-1234567890",
  "case_id": "CASE-001",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Security Notes

1. **Certificate Rotation**: Implement certificate rotation every 90 days
2. **IP Whitelisting**: Bank should whitelist your server IPs
3. **Signature Verification**: Bank must verify PKCS7 signature if provided
4. **Access Control**: Certificate CN must match registered consortium org
5. **Audit Logging**: All hold requests must be logged immutably

## Testing

```bash
# Test with curl (requires client cert)
curl -X POST https://bank-api.example.com/api/bank/hold \
  --cert ./certs/client.crt \
  --key ./certs/client.key \
  --cacert ./certs/ca.crt \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "Date: $(date -u +'%a, %d %b %Y %H:%M:%S GMT')" \
  -d '{
    "caseId": "CASE-001",
    "assetRef": "ACCOUNT123",
    "evidenceHash": "abc123..."
  }'
```

