"""Shared pytest fixtures."""

import pytest


@pytest.fixture
def sample_ticker():
    return "WEGE3.SA"


@pytest.fixture
def sample_date():
    return "2026-03-25"
