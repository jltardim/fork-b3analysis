"""AES-256-GCM encryption for API keys.

Storage format: nonce(12B) || ciphertext || tag(16B)
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_aesgcm(encryption_key_b64: str) -> AESGCM:
    key_bytes = base64.b64decode(encryption_key_b64)
    if len(key_bytes) != 32:
        raise ValueError("Encryption key must be 32 bytes (256 bits)")
    return AESGCM(key_bytes)


def encrypt_api_key(plaintext: str, encryption_key_b64: str) -> bytes:
    aesgcm = _get_aesgcm(encryption_key_b64)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ciphertext  # nonce(12) || ciphertext || tag(16)


def decrypt_api_key(encrypted: bytes, encryption_key_b64: str) -> str:
    aesgcm = _get_aesgcm(encryption_key_b64)
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def extract_key_prefix(api_key: str) -> str:
    if len(api_key) < 10:
        return "****"
    return f"{api_key[:7]}...{api_key[-4:]}"
