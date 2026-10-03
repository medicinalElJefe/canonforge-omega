from omega_fusion_core.intrinsic_skin import NodeState, OmegaAddr
from omega_fusion_core.recursive_resolution import Authority, CheckResult, TransitionRecord
from omega_fusion_core.resolution_graph import ResolutionGraph, coord_key


def node(name, t):
    coord = OmegaAddr(name, 20736, "motion-local", t)
    return NodeState(coord=coord, core_state={"x": t}, skin_state={"x": t})


def edge(a, b, ok=True):
    return TransitionRecord(
        source=a.coord,
        target=b.coord,
        dt=1.0,
        delta_motion={"dx": b.core_state["x"] - a.core_state["x"]},
        physical_checks=[
            CheckResult(
                "motion",
                ok,
                Authority.DERIVED_STANDARD,
                "" if ok else "violates motion constraint",
            )
        ],
    )


def test_resolution_graph_forward_and_backward_reachability():
    g = ResolutionGraph()
    a, b, c = node("a", 0), node("b", 1), node("c", 2)
    for n in (a, b, c):
        g.add_node(n)
    g.add_transition(edge(a, b))
    g.add_transition(edge(b, c))

    f = g.forward_reachable(a.coord, 2)
    r = g.backward_reachable(c.coord, 2)

    assert coord_key(c.coord) in f.reachable
    assert coord_key(a.coord) in r.reachable


def test_resolution_graph_intersection_recovers_middle_path_state():
    g = ResolutionGraph()
    a, b, c = node("a", 0), node("b", 1), node("c", 2)
    for n in (a, b, c):
        g.add_node(n)
    g.add_transition(edge(a, b))
    g.add_transition(edge(b, c))

    intersection = g.constrained_intersection(a.coord, c.coord, 1, 1)
    assert tuple(n.coord.address for n in intersection) == ("b",)


def test_resolution_graph_preserves_rejected_edges_but_prunes_reachability():
    g = ResolutionGraph()
    a, b = node("a", 0), node("b", 1)
    g.add_node(a)
    g.add_node(b)
    rejected = edge(a, b, ok=False)
    g.add_transition(rejected)

    assert len(g.rejected_transitions()) == 1
    assert coord_key(b.coord) not in g.forward_reachable(a.coord, 1).reachable
    assert coord_key(b.coord) in g.forward_reachable(
        a.coord, 1, admissible_only=False
    ).reachable


def test_resolution_graph_requires_registered_endpoints():
    g = ResolutionGraph()
    a, b = node("a", 0), node("b", 1)
    g.add_node(a)
    try:
        g.add_transition(edge(a, b))
    except ValueError as exc:
        assert "endpoints" in str(exc)
    else:
        raise AssertionError("unregistered target must be rejected")
