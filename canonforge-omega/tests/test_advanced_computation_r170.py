from math import sqrt

import pytest

from omega_runtime.advanced_computation import (
    C_M_S,
    OpticalLayer,
    computation_manifest,
    conservative_diffusion_step,
    conservative_transfer,
    lorentz_boost_event,
    normal_incidence_tmm,
    run_truth_suite,
    scalar_wave_fdtd_1d,
    transform_velocity,
)


def test_r170_lorentz_boost_preserves_minkowski_interval():
    result = lorentz_boost_event(
        2.0,
        (1.0e8, -2.0e7, 4.0e6),
        (0.45 * C_M_S, -0.10 * C_M_S, 0.05 * C_M_S),
    )
    assert result.gamma > 1.0
    assert result.invariant_relative_residual < 1e-12
    assert result.evidence_class == "DERIVED"
    assert result.canonical_mutation is False


def test_r170_relativistic_velocity_transform_never_silently_crosses_c():
    result = transform_velocity((0.80 * C_M_S, 0.10 * C_M_S, 0.0), (0.60 * C_M_S, 0.0, 0.0))
    assert result.transformed_speed_fraction_c < 1.0
    with pytest.raises(ValueError):
        transform_velocity((C_M_S, 0.0, 0.0), (0.1 * C_M_S, 0.0, 0.0))
    with pytest.raises(ValueError):
        transform_velocity((0.1 * C_M_S, 0.0, 0.0), (C_M_S, 0.0, 0.0))


def test_r170_tmm_matches_analytic_fresnel_interface_and_energy_balance():
    result = normal_incidence_tmm(550.0, (), incident_n=1.0, substrate_n=1.5)
    expected = ((1.0 - 1.5) / (1.0 + 1.5)) ** 2
    assert abs(result.reflectance - expected) < 1e-12
    assert abs(result.transmittance - 0.96) < 1e-12
    assert result.energy_balance_residual < 1e-12
    assert result.fabrication_grade is False
    assert result.solver_tier == "REDUCED_ORDER_SCREENING"


def test_r170_tmm_quarter_wave_antireflection_reference_case():
    n_layer = sqrt(1.5)
    thickness = 550.0 / (4.0 * n_layer)
    result = normal_incidence_tmm(550.0, (OpticalLayer(n_layer, 0.0, thickness),), incident_n=1.0, substrate_n=1.5)
    assert result.reflectance < 1e-12
    assert result.energy_balance_residual < 1e-12


def test_r170_passive_absorbing_layer_has_nonnegative_absorption():
    result = normal_incidence_tmm(550.0, (OpticalLayer(2.0, 0.15, 100.0),), incident_n=1.0, substrate_n=1.5)
    assert 0.0 <= result.reflectance <= 1.0
    assert 0.0 <= result.transmittance <= 1.0
    assert result.absorptance > 0.0
    assert result.energy_balance_residual < 1e-12


def test_r170_conservative_transfer_carries_invariant_and_blocks_overdraw():
    result = conservative_transfer((4.0, 3.0, 2.0), ((0, 1, 1.25), (1, 2, 0.5)))
    assert result.invariant_absolute_residual < 1e-12
    assert result.values_after == pytest.approx((2.75, 3.75, 2.5))
    with pytest.raises(ValueError):
        conservative_transfer((1.0, 0.0), ((0, 1, 1.1),))


def test_r170_graph_diffusion_preserves_sum_and_enforces_stability_guard():
    result = conservative_diffusion_step((1.0, 0.0, 0.0, 0.0), ((0, 1), (1, 2), (2, 3)), diffusivity=0.2, dt=0.5)
    assert result.invariant_absolute_residual < 1e-12
    assert result.min_after >= -1e-15
    with pytest.raises(ValueError):
        conservative_diffusion_step((1.0, 0.0, 0.0), ((0, 1), (1, 2)), diffusivity=1.0, dt=1.0)


def test_r170_scalar_wave_fdtd_enforces_cfl_and_is_explicitly_not_maxwell():
    result = scalar_wave_fdtd_1d((0.0, 0.0, 1.0, 0.0, 0.0), wave_speed=1.0, dx=1.0, dt=0.5, steps=30, snapshot_stride=10)
    assert result.cfl == pytest.approx(0.5)
    assert result.maxwell_solver is False
    assert len(result.snapshots) >= 3
    with pytest.raises(ValueError):
        scalar_wave_fdtd_1d((0.0, 1.0, 0.0), wave_speed=1.0, dx=1.0, dt=1.1, steps=2)


def test_r170_manifest_separates_address_resolution_from_physical_dimensions():
    manifest = computation_manifest()
    assert manifest["hierarchy"]["address_levels"] == [12, 144, 1728, 20736]
    assert manifest["hierarchy"]["physical_dimension_claim"] is False
    assert manifest["solvers"]["normal_incidence_tmm"]["fabrication_grade"] is False


def test_r170_reference_truth_suite_passes_and_emits_hash_receipt():
    result = run_truth_suite()
    assert result["passed"] is True
    assert len(result["receipt_sha256"]) == 64
    assert result["authority"] == "DERIVED_REFERENCE_COMPUTATION_NOT_CANON"
