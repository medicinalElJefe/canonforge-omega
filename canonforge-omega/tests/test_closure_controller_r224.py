from omega_runtime.closure_controller import ClosureController
from omega_runtime.intrinsic_skin import ClosureAddress, PathAddress, PathStep, ProofObligation


def obligation(oid, skin, status="FAILED", residual=.2, contradiction=.2, priority=1, deps=()):
    path = PathAddress(oid, (PathStep(oid, oid, "RETURN", residual=residual),), skin, "canonical")
    closure = ClosureAddress(path, "declared-equivalence", residual, 0, residual, contradiction, status)
    return ProofObligation(oid, f"prove {oid}", closure, priority, deps)


def test_r224_selects_dependency_satisfied_highest_priority_closure():
    controller = ClosureController(.05)
    first = obligation("first", 144, priority=2)
    blocked = obligation("blocked", 1728, priority=9, deps=("first",))
    assert controller.plan((first, blocked)).obligation_id == "first"
    assert controller.plan((first, blocked), ("first",)).obligation_id == "blocked"


def test_r224_escalates_to_next_skin_without_canon_mutation():
    action = ClosureController(.05).plan((obligation("x", 144),))
    assert action.action == "ESCALATE"
    assert action.current_skin == 144 and action.target_skin == 1728
    assert action.canonical_mutation is False and len(action.receipt) == 64


def test_r224_turns_at_resolution_ceiling():
    action = ClosureController(.05).plan((obligation("x", 248832),))
    assert action.action == "TURN" and action.target_skin == 248832


def test_r224_routes_approximate_return_to_equivalence_proof():
    action = ClosureController(.05).plan((obligation("x", 20736, status="APPROXIMATE", residual=.01, contradiction=.01),))
    assert action.action == "PROVE_EQUIVALENCE"


def test_r224_cycle_is_deterministic_addressed_and_fail_closed():
    controller = ClosureController(.05)
    o = obligation("x", 144)
    a = controller.cycle((o,))
    b = controller.cycle((o,))
    assert a == b
    assert a["closure_address"] == o.closure_address
    assert a["canonical_mutation"] is False
    assert a["loop"] == ["ADDRESS", "SELECT_UNRESOLVED_CLOSURE", "TRAVERSE", "RETURN", "COMPARE", "PROVE", "SELECT_NEXT"]
    assert len(a["receipt_sha256"]) == 64


def test_r224_no_ready_work_returns_no_action():
    closed = obligation("done", 144, status="EXACT", residual=0, contradiction=0)
    cycle = ClosureController().cycle((closed,))
    assert cycle["action"] is None and cycle["closure_address"] is None
