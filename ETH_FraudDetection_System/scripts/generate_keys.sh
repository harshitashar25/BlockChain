#!/bin/bash

# Generate RSA keypair for evidence bundle signing (PoC)
# In production, use HSM/KMS instead

set -e

KEYS_DIR="./keys"
mkdir -p "$KEYS_DIR"

echo "🔑 Generating RSA keypair for evidence signing..."

# Generate private key (2048-bit RSA)
openssl genrsa -out "$KEYS_DIR/private_key.pem" 2048

# Generate public key
openssl rsa -in "$KEYS_DIR/private_key.pem" -pubout -out "$KEYS_DIR/public_key.pem"

# Set permissions (private key should be readable only by owner)
chmod 600 "$KEYS_DIR/private_key.pem"
chmod 644 "$KEYS_DIR/public_key.pem"

echo "✅ Keys generated:"
echo "   Private key: $KEYS_DIR/private_key.pem"
echo "   Public key:  $KEYS_DIR/public_key.pem"
echo ""
echo "⚠️  SECURITY NOTE: In production, use HSM/KMS (AWS KMS, CloudHSM) instead of file-based keys."

