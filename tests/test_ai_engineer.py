from omega_genesis.ai_engineer import extract_output_text, normalize_patch, patch_paths, validate_patch


def test_extract_output_text_from_responses_payload():
    payload = {
        "output": [
            {"type": "message", "content": [{"type": "output_text", "text": "diff --git a/web/a b/web/a\n"}]}
        ]
    }
    assert extract_output_text(payload).startswith("diff --git")


def test_normalize_patch_strips_diff_fence():
    raw = "```diff\ndiff --git a/web/a b/web/a\n--- a/web/a\n+++ b/web/a\n@@ -1 +1 @@\n-a\n+b\n```"
    value = normalize_patch(raw)
    assert value.startswith("diff --git")
    assert not value.startswith("```")


def test_validate_patch_accepts_bounded_web_change():
    patch = """diff --git a/web/styles.css b/web/styles.css
index 1111111..2222222 100644
--- a/web/styles.css
+++ b/web/styles.css
@@ -1 +1 @@
-a
+b
"""
    assert patch_paths(patch) == ["web/styles.css"]
    assert validate_patch(patch, ["config/evolution_policy.json"]) == []


def test_validate_patch_rejects_protected_and_workflow_change():
    patch = """diff --git a/config/evolution_policy.json b/config/evolution_policy.json
index 1111111..2222222 100644
--- a/config/evolution_policy.json
+++ b/config/evolution_policy.json
@@ -1 +1 @@
-a
+b
diff --git a/.github/workflows/verify.yml b/.github/workflows/verify.yml
index 1111111..2222222 100644
--- a/.github/workflows/verify.yml
+++ b/.github/workflows/verify.yml
@@ -1 +1 @@
-a
+b
"""
    errors = validate_patch(patch, ["config/evolution_policy.json"])
    assert "protected_path:config/evolution_policy.json" in errors
    assert "hard_blocked_path:config/evolution_policy.json" in errors
    assert "hard_blocked_path:.github/workflows/verify.yml" in errors


def test_validate_patch_rejects_traversal():
    patch = """diff --git a/web/a b/../escape.txt
--- a/web/a
+++ b/../escape.txt
@@ -1 +1 @@
-a
+b
"""
    errors = validate_patch(patch, [])
    assert any(item.startswith("unsafe_path:") for item in errors)
