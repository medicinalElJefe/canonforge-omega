"""Addressed state-space graph for OMEGA recursive resolution.

This module turns OmegaAddr/NodeState/TransitionRecord into an executable,
bounded motion graph. It preserves invalid/rejected edges as evidence while
excluding them from physical reachability by default.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Set, Tuple

from .intrinsic_skin import NodeState, OmegaAddr, stable_hash
from .recursive_resolution import TransitionRecord


def coord_key(coord: OmegaAddr) -> str:
    return stable_hash({
        "address": coord.address,
        "skin": coord.skin,
        "frame": coord.frame,
        "t": coord.t,
        "orientation": coord.orientation,
        "history_path": coord.history_path,
    })


@dataclass(frozen=True)
class ReachabilityLayer:
    hops: int
    node_keys: Tuple[str, ...]


@dataclass(frozen=True)
class ReachabilityReport:
    origin_key: str
    max_hops: int
    layers: Tuple[ReachabilityLayer, ...]

    @property
    def reachable(self) -> frozenset[str]:
        out: Set[str] = set()
        for layer in self.layers:
            out.update(layer.node_keys)
        return frozenset(out)


@dataclass
class ResolutionGraph:
    nodes: Dict[str, NodeState] = field(default_factory=dict)
    transitions: Dict[str, TransitionRecord] = field(default_factory=dict)
    outgoing: Dict[str, List[str]] = field(default_factory=dict)
    incoming: Dict[str, List[str]] = field(default_factory=dict)

    def add_node(self, node: NodeState) -> str:
        key = coord_key(node.coord)
        existing = self.nodes.get(key)
        if existing is not None and existing.coord != node.coord:
            raise ValueError("coordinate hash collision")
        self.nodes[key] = node
        self.outgoing.setdefault(key, [])
        self.incoming.setdefault(key, [])
        return key

    def add_transition(self, transition: TransitionRecord) -> str:
        source_key = coord_key(transition.source)
        target_key = coord_key(transition.target)
        if source_key not in self.nodes or target_key not in self.nodes:
            raise ValueError("transition endpoints must be registered nodes")
        if self.nodes[source_key].coord != transition.source:
            raise ValueError("transition source does not match registered node")
        if self.nodes[target_key].coord != transition.target:
            raise ValueError("transition target does not match registered node")

        transition_id = transition.transition_id
        if transition_id in self.transitions:
            return transition_id
        self.transitions[transition_id] = transition
        self.outgoing[source_key].append(transition_id)
        self.incoming[target_key].append(transition_id)
        return transition_id

    def _neighbors(self, key: str, forward: bool, admissible_only: bool) -> Iterable[str]:
        edge_ids = self.outgoing.get(key, ()) if forward else self.incoming.get(key, ())
        for edge_id in edge_ids:
            edge = self.transitions[edge_id]
            if admissible_only and not edge.physically_admissible:
                continue
            yield coord_key(edge.target if forward else edge.source)

    def reachable(
        self,
        origin: OmegaAddr,
        max_hops: int,
        *,
        forward: bool = True,
        admissible_only: bool = True,
    ) -> ReachabilityReport:
        if max_hops < 0:
            raise ValueError("max_hops must be non-negative")
        origin_key = coord_key(origin)
        if origin_key not in self.nodes:
            raise KeyError("origin is not registered")

        seen = {origin_key}
        queue = deque([(origin_key, 0)])
        layers: Dict[int, List[str]] = {0: [origin_key]}

        while queue:
            key, hops = queue.popleft()
            if hops >= max_hops:
                continue
            for neighbor in self._neighbors(key, forward, admissible_only):
                if neighbor in seen:
                    continue
                seen.add(neighbor)
                next_hop = hops + 1
                layers.setdefault(next_hop, []).append(neighbor)
                queue.append((neighbor, next_hop))

        return ReachabilityReport(
            origin_key=origin_key,
            max_hops=max_hops,
            layers=tuple(
                ReachabilityLayer(hops, tuple(sorted(keys)))
                for hops, keys in sorted(layers.items())
            ),
        )

    def forward_reachable(
        self,
        origin: OmegaAddr,
        max_hops: int,
        *,
        admissible_only: bool = True,
    ) -> ReachabilityReport:
        return self.reachable(
            origin, max_hops, forward=True, admissible_only=admissible_only
        )

    def backward_reachable(
        self,
        origin: OmegaAddr,
        max_hops: int,
        *,
        admissible_only: bool = True,
    ) -> ReachabilityReport:
        return self.reachable(
            origin, max_hops, forward=False, admissible_only=admissible_only
        )

    def constrained_intersection(
        self,
        past: OmegaAddr,
        future: OmegaAddr,
        max_hops_from_past: int,
        max_hops_from_future: int,
    ) -> Tuple[NodeState, ...]:
        forward = self.forward_reachable(past, max_hops_from_past).reachable
        backward = self.backward_reachable(future, max_hops_from_future).reachable
        keys = sorted(forward.intersection(backward))
        return tuple(self.nodes[key] for key in keys)

    def rejected_transitions(self) -> Tuple[TransitionRecord, ...]:
        return tuple(
            edge
            for edge in self.transitions.values()
            if not edge.physically_admissible
        )
