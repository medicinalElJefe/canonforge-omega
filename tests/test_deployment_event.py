from omega_genesis.deployment_event import CANONICAL_BRANCH, SELF_BUILD_WORKFLOW, deployment_decision


def test_successful_canonical_self_build_allows_latest_genesis_checkout():
    decision = deployment_decision(
        event_name="workflow_run",
        head_branch=CANONICAL_BRANCH,
        workflow_name=SELF_BUILD_WORKFLOW,
        workflow_conclusion="success",
    )
    assert decision.allowed is True
    assert decision.checkout_ref == CANONICAL_BRANCH
    assert decision.reason == "successful_canonical_self_build"


def test_failed_self_build_is_not_deployable():
    decision = deployment_decision(
        event_name="workflow_run",
        head_branch=CANONICAL_BRANCH,
        workflow_name=SELF_BUILD_WORKFLOW,
        workflow_conclusion="failure",
    )
    assert decision.allowed is False
    assert decision.reason == "self_build_not_successful"


def test_noncanonical_or_untrusted_workflow_is_rejected():
    assert deployment_decision(
        event_name="workflow_run",
        head_branch="omega-evolve/example",
        workflow_name=SELF_BUILD_WORKFLOW,
        workflow_conclusion="success",
    ).allowed is False
    assert deployment_decision(
        event_name="workflow_run",
        head_branch=CANONICAL_BRANCH,
        workflow_name="other workflow",
        workflow_conclusion="success",
    ).allowed is False


def test_canonical_push_and_manual_dispatch_remain_supported():
    assert deployment_decision(event_name="push", head_branch=CANONICAL_BRANCH).allowed is True
    assert deployment_decision(event_name="push", head_branch="main").allowed is False
    assert deployment_decision(event_name="workflow_dispatch").allowed is True
