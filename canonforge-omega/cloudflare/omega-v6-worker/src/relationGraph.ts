export const RELATION_EDGE_TYPES = [
  "CAUSAL",
  "CONSTITUTIVE",
  "HISTORICAL",
  "OBSERVATIONAL",
  "CONSTRAINT",
  "TRANSFER",
  "SYMBOLIC",
  "OTHER",
] as const;

export type RelationEdgeType = typeof RELATION_EDGE_TYPES[number];

export const RELATION_EVIDENCE_CLASSES = [
  "OBSERVED_MEASURED",
  "ESTABLISHED_MATH_OR_SCIENCE",
  "DERIVED_FROM_OBSERVED",
  "SIMULATED_CONTINUATION",
  "USER_DEFINED_MODEL",
  "SYMBOLIC_ANALOGY",
  "NO_EVIDENCE",
] as const;

export const RELATION_GRAPH_BOUNDARY =
  "Typed relation edges record declared structure and provenance. An edge does not become causal because it is present in the graph; cross-scale causal claims require an explicit transfer operator plus a measured invariant.";

function clean(value: string | null, max = 160): string {
  return (value || "").trim().slice(0, max);
}

function finite01(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

function member<T extends readonly string[]>(items: T, value: string): value is T[number] {
  return (items as readonly string[]).includes(value);
}

export function relationGraphSchema() {
  return {
    schema: "OMEGA_TYPED_RELATION_GRAPH_V1",
    authority: "declaration-and-proof-contract",
    mutation: false,
    edge_types: RELATION_EDGE_TYPES,
    evidence_classes: RELATION_EVIDENCE_CLASSES,
    required_edge_fields: [
      "source", "target", "edge_type", "evidence_class", "confidence", "provenance",
      "source_domain", "target_domain", "source_scale", "target_scale"
    ],
    cross_scale_rule: "If source_scale != target_scale or source_domain != target_domain and edge_type=CAUSAL, transfer_operator and measured_invariant are required.",
    symbolic_rule: "SYMBOLIC edges and SYMBOLIC_ANALOGY evidence may guide comparison or interface projection but never satisfy empirical causal proof.",
    boundary: RELATION_GRAPH_BOUNDARY,
  };
}

export function evaluateRelationEdge(url: URL): { status: number; body: any } {
  const source = clean(url.searchParams.get("source"));
  const target = clean(url.searchParams.get("target"));
  const edgeType = clean(url.searchParams.get("edge_type"), 40).toUpperCase();
  const evidenceClass = clean(url.searchParams.get("evidence_class"), 48).toUpperCase();
  const confidence = finite01(url.searchParams.get("confidence"));
  const provenance = clean(url.searchParams.get("provenance"), 240);
  const sourceDomain = clean(url.searchParams.get("source_domain"), 100) || "UNSPECIFIED";
  const targetDomain = clean(url.searchParams.get("target_domain"), 100) || sourceDomain;
  const sourceScale = clean(url.searchParams.get("source_scale"), 100) || "UNSPECIFIED";
  const targetScale = clean(url.searchParams.get("target_scale"), 100) || sourceScale;
  const transferOperator = clean(url.searchParams.get("transfer_operator"), 200);
  const measuredInvariant = clean(url.searchParams.get("measured_invariant"), 200);

  const errors: string[] = [];
  if (!source) errors.push("source_required");
  if (!target) errors.push("target_required");
  if (!member(RELATION_EDGE_TYPES, edgeType)) errors.push("valid_edge_type_required");
  if (!member(RELATION_EVIDENCE_CLASSES, evidenceClass)) errors.push("valid_evidence_class_required");
  if (confidence === null) errors.push("confidence_must_be_between_0_and_1");
  if (!provenance) errors.push("provenance_required");

  if (errors.length) return { status: 400, body: { ok: false, schema: "OMEGA_RELATION_EDGE_EVALUATION_V1", errors, boundary: RELATION_GRAPH_BOUNDARY } };

  const crossScale = sourceDomain !== targetDomain || sourceScale !== targetScale;
  const causal = edgeType === "CAUSAL";
  const transferComplete = !!transferOperator && !!measuredInvariant;
  const symbolic = edgeType === "SYMBOLIC" || evidenceClass === "SYMBOLIC_ANALOGY";
  const causalAdmissible = causal ? (!crossScale || transferComplete) && !symbolic && evidenceClass !== "NO_EVIDENCE" : false;
  const proofStatus = causal && crossScale && !transferComplete
    ? "HOLD_MISSING_TRANSFER_PROOF"
    : symbolic
      ? "SYMBOLIC_ONLY"
      : causal && causalAdmissible
        ? "CAUSAL_EDGE_DECLARATION_ADMISSIBLE_NOT_INDEPENDENTLY_VERIFIED"
        : "STRUCTURAL_EDGE_DECLARATION";

  return {
    status: 200,
    body: {
      ok: true,
      schema: "OMEGA_RELATION_EDGE_EVALUATION_V1",
      mutation: false,
      edge: {
        source, target, edge_type: edgeType, evidence_class: evidenceClass, confidence,
        provenance, source_domain: sourceDomain, target_domain: targetDomain,
        source_scale: sourceScale, target_scale: targetScale,
        transfer_operator: transferOperator || null,
        measured_invariant: measuredInvariant || null,
      },
      proof: {
        cross_scale: crossScale,
        transfer_operator_declared: !!transferOperator,
        measured_invariant_declared: !!measuredInvariant,
        causal_admissible: causalAdmissible,
        independently_verified: false,
        status: proofStatus,
      },
      boundary: RELATION_GRAPH_BOUNDARY,
    },
  };
}
