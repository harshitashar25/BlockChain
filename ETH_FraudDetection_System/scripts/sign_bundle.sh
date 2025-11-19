#!/bin/bash

# Sign an evidence bundle JSON file using OpenSSL (PoC)
# Usage: ./sign_bundle.sh <evidence.json> <output_signature_file>

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <evidence.json> [output_signature_file]"
    exit 1
fi

EVIDENCE_FILE="$1"
SIGNATURE_FILE="${2:-evidence.sig}"
KEYS_DIR="./keys"
PRIVATE_KEY="$KEYS_DIR/private_key.pem"

if [ ! -f "$EVIDENCE_FILE" ]; then
    echo "❌ Error: Evidence file not found: $EVIDENCE_FILE"
    exit 1
fi

if [ ! -f "$PRIVATE_KEY" ]; then
    echo "❌ Error: Private key not found: $PRIVATE_KEY"
    echo "   Run ./generate_keys.sh first"
    exit 1
fi

echo "📝 Signing evidence bundle: $EVIDENCE_FILE"

# Create SHA256 hash of the evidence file
HASH=$(openssl dgst -sha256 -binary "$EVIDENCE_FILE")

# Sign the hash with private key
openssl pkeyutl -sign -inkey "$PRIVATE_KEY" -in <(echo -n "$HASH") -out "$SIGNATURE_FILE"

# Base64 encode the signature for storage/transmission
BASE64_SIG=$(base64 -w 0 "$SIGNATURE_FILE" 2>/dev/null || base64 "$SIGNATURE_FILE")

echo "✅ Signature created: $SIGNATURE_FILE"
echo "📦 Base64 signature (for JSON):"
echo "$BASE64_SIG"
echo ""
echo "💡 To verify: node scripts/verify_signature.js $EVIDENCE_FILE \"$BASE64_SIG\""

