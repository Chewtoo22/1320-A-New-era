"""
Basic smoke tests for the backend game_data module.

These tests verify that core data structures and functions
can be imported and return expected types without needing
a live database or server.
"""

import pytest
from game_data import (
    CAR_CATALOG,
    PARTS_CATALOG,
    TOURNAMENTS,
    PAINT_COLORS,
    calculate_effective_stats,
)


def test_car_catalog_not_empty():
    assert len(CAR_CATALOG) > 0


def test_car_catalog_entries_have_required_fields():
    # Field names use camelCase to match the game data JSON schema
    required_fields = {"id", "name", "category", "hp", "weight", "quarterMile", "price"}
    for car_id, car in CAR_CATALOG.items():
        for field in required_fields:
            assert field in car, f"Car '{car_id}' is missing field '{field}'"


def test_parts_catalog_not_empty():
    assert len(PARTS_CATALOG) > 0


def test_paint_colors_not_empty():
    assert len(PAINT_COLORS) > 0


def test_calculate_effective_stats_returns_dict():
    car = next(iter(CAR_CATALOG.values()))
    stats = calculate_effective_stats(car, {})
    assert isinstance(stats, dict)


def test_tournaments_not_empty():
    assert len(TOURNAMENTS) > 0
