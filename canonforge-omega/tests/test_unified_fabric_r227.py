from omega_runtime.unified_fabric import (
    CONSUMERS,
    OperatorDescriptor,
    UnifiedComputationalFabric,
    WovenPacket,
)


def packet():
    return WovenPacket(
        address_key="addr-20736-1",
        closure_address="closure:1",
        field_receipt="field-proof-1",
        state=(1.0, 2.0),
        motion=(0.1, -0.1),
        continuity=0.9,
        future_plasticity=0.7,
        contradiction=0.1,
        burden=0.2,
        scar=0.05,
        history=("observe", "address"),
        provenance=("R223", "R224", "R225"),
    )


def operator():
    return OperatorDescriptor("omega", "identity-test", "1", "x -> x")


def test_manifest_registers_all_major_consumers_and_denies_canon_mutation():
    m = UnifiedComputationalFabric().manifest()
    assert tuple(m["consumers"]) == CONSUMERS
    assert m["canonical_mutation"] is False
    assert m["physical_dimension_claim"] is False
    assert len(m["receipt_sha256"]) == 64


def test_same_computation_is_deterministic_and_proof_bound():
    f = UnifiedComputationalFabric()
    a = f.bind(consumer="forecast", packet=packet(), operator=operator(), output={"x": [1, 2]}, residual=0.01, decision="STAY", next_closure_address="closure:2")
    b = f.bind(consumer="forecast", packet=packet(), operator=operator(), output={"x": [1, 2]}, residual=0.01, decision="STAY", next_closure_address="closure:2")
    assert a == b
    proof, receipt = a
    assert receipt.proof_receipt == proof.receipt_sha256
    assert receipt.operator_id == operator().operator_id
    assert proof.canonical_mutation is False
    assert receipt.canonical_mutation is False


def test_operator_identity_changes_when_law_or_version_changes():
    a = OperatorDescriptor("omega", "solve", "1", "x -> x")
    b = OperatorDescriptor("omega", "solve", "2", "x -> x")
    c = OperatorDescriptor("omega", "solve", "1", "x -> x+1")
    assert len({a.operator_id, b.operator_id, c.operator_id}) == 3


def test_every_declared_surface_consumes_same_protocol():
    f = UnifiedComputationalFabric()
    ids = []
    for consumer in CONSUMERS:
        proof, receipt = f.bind(consumer=consumer, packet=packet(), operator=operator(), output={"surface": consumer}, residual=0.0, decision="STAY", next_closure_address=f"closure:{consumer.lower()}")
        assert receipt.consumer == consumer
        assert receipt.packet_sha256 == packet().packet_sha256
        ids.append(receipt.receipt_sha256)
    assert len(set(ids)) == len(CONSUMERS)


def test_unregistered_surface_and_unaddressed_work_fail_closed():
    f = UnifiedComputationalFabric()
    try:
        f.bind(consumer="shadow", packet=packet(), operator=operator(), output={}, residual=0, decision="STAY", next_closure_address="c")
    except ValueError:
        pass
    else:
        raise AssertionError("unregistered consumer admitted")

    bad = WovenPacket("", "closure", "field", ())
    try:
        f.bind(consumer="SAR", packet=bad, operator=operator(), output={}, residual=0, decision="STAY", next_closure_address="c")
    except ValueError:
        pass
    else:
        raise AssertionError("unaddressed computation admitted")
