from omega_runtime.address_state_field import AddressStateFieldEngine, FieldSample
from omega_runtime.intrinsic_skin import OmegaAddr
from omega_runtime.state import Address20736


def addr(seed):
    n=sum(ord(ch) for ch in str(seed))
    return Address20736(n%12+1,(n//12)%12+1,(n//144)%12+1,(n//1728)%12+1)


def sample(name, skin=144, state=(0.,0.), c=1., p=1., q=.1, burden=.1, scar=0., frame="canonical"):
    return FieldSample(OmegaAddr(addr(name), skin, frame, 0, 1, "h"), c, p, q, burden, scar, state=state)


def test_field_is_deterministic_and_weight_normalized():
    e=AddressStateFieldEngine(); c=sample("c"); n=(sample("b",state=(2.,0.)),sample("a",state=(1.,0.)))
    x=e.compute(c,n); y=e.compute(c,reversed(n))
    assert x.receipt_sha256==y.receipt_sha256
    assert abs(sum(x.weights)-1)<1e-12
    assert x.center.address.key==c.address.key


def test_resolution_controls_relational_horizon():
    e=AddressStateFieldEngine()
    for skin,horizon in e.HORIZON.items():
        c=sample("center",skin); ns=tuple(sample(f"n{i}",skin,state=(float(i+1),0.)) for i in range(20))
        assert len(e.compute(c,ns).samples)==1+horizon


def test_field_rejects_cross_skin_and_cross_frame_samples():
    e=AddressStateFieldEngine(); c=sample("c",144)
    field=e.compute(c,(sample("s",1728),sample("f",144,state=(1.,0.),frame="other")))
    assert field.samples==(c,)


def test_motion_is_relative_to_previous_state():
    e=AddressStateFieldEngine(); c=sample("c",state=(2.,3.)); prev=sample("p",state=(1.,1.))
    assert e.compute(c,previous=prev).motion_vector==(1.,2.)


def test_contradiction_scar_and_geometry_drive_escalation():
    assert AddressStateFieldEngine().compute(sample("c",c=.2,p=.2,q=3.,burden=2.,scar=1.)).action=="ESCALATE"


def test_clean_coherent_field_stays():
    assert AddressStateFieldEngine().compute(sample("c",c=1.,p=1.,q=.01,burden=.01)).action=="STAY"
