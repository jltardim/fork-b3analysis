import base64
import os

import pytest

from app.crypto import decrypt_api_key, encrypt_api_key


@pytest.fixture
def encryption_key():
    return base64.b64encode(os.urandom(32)).decode()


def test_encrypt_decrypt_roundtrip(encryption_key):
    original = "sk-ant-api03-test-key-1234567890"
    encrypted = encrypt_api_key(original, encryption_key)
    decrypted = decrypt_api_key(encrypted, encryption_key)
    assert decrypted == original


def test_encrypted_differs_from_plaintext(encryption_key):
    original = "sk-ant-api03-test-key"
    encrypted = encrypt_api_key(original, encryption_key)
    assert original.encode() not in encrypted


def test_different_encryptions_produce_different_ciphertext(encryption_key):
    original = "sk-ant-api03-test-key"
    enc1 = encrypt_api_key(original, encryption_key)
    enc2 = encrypt_api_key(original, encryption_key)
    assert enc1 != enc2  # Different nonces


def test_wrong_key_fails():
    key1 = base64.b64encode(os.urandom(32)).decode()
    key2 = base64.b64encode(os.urandom(32)).decode()
    encrypted = encrypt_api_key("secret", key1)
    with pytest.raises(Exception):
        decrypt_api_key(encrypted, key2)


def test_extract_key_prefix():
    from app.crypto import extract_key_prefix
    assert extract_key_prefix("sk-ant-api03-abcdefghijk") == "sk-ant-...hijk"
    assert extract_key_prefix("short") == "****"
