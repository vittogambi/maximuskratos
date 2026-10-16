#!/usr/bin/env python3
"""Referencia aritmética independiente. No ejecuta ni valida el producto MK."""
import json
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "casos.json").read_text())
assert len(data["cases"]) == 12
assert len(data["mutations"]) == 10
specs = data["source_specs"]
keys = [s["key"] for g in specs for s in g["sources"]]
assert len(keys) == len(set(keys)) == 20

def calculate(answers, excluded=()):
    excluded = set(excluded)
    groups = {}
    eligible = 0
    for group in specs:
        values = []
        for source in group["sources"]:
            value = answers[source["key"]]
            if value is not None:
                assert isinstance(value, int) and not isinstance(value, bool)
                assert source["min"] <= value <= source["max"]
            if value is None or source["key"] in excluded:
                values.append(None)
            else:
                eligible += 1
                value = Fraction(100 * (value - source["min"]), source["max"] - source["min"])
                assert source["polarity"] == "DIRECT"
                values.append(value)
        groups[group["group"]] = None if None in values else sum(values) / len(values)
    pillars = {}
    for pillar in ("E", "M", "C"):
        values = [groups[g["group"]] for g in specs if g["pillar"] == pillar]
        assert len(values) == 3
        pillars[pillar] = None if None in values else sum(values) / 3
    general = None if None in pillars.values() else sum(pillars.values()) / 3
    def out(value):
        return None if value is None else round(float(value), 4)
    return {"groups": {k: out(v) for k, v in groups.items()},
            "pillars": {k: out(v) for k, v in pillars.items()},
            "general": out(general), "eligible_reference_count": eligible}

results = []
for case in data["cases"]:
    assert set(case["core_answers"]) == set(keys)
    assert {k for k, v in case["core_answers"].items() if v is None} == set(case["core_exceptions"])
    assert len(case["weeks"]) == 3 and case["acceptable_help"] and case["must_not"]
    is_legacy = case["capture"]["mode"] == "LEGACY_MANIFEST"
    exclusions = case["capture"].get("minimum_known_unreliable_sources", [])
    entry = {"case_id": case["id"],
             "initial": calculate(case["core_answers"], exclusions),
             "capture_coverage_exact_expected": not is_legacy}
    if is_legacy:
        entry["notice"] = "El manifiesto real puede excluir más señales. No exigir exactamente 12 elegibles."
        entry["after_complete_reconfirmation"] = calculate(case["core_answers"])
    results.append(entry)

expected = {"status": "INDEPENDENT_ARITHMETIC_REFERENCE_NOT_MK_RESULT",
            "tolerance": 0.0001, "cases": results}
by_id = {r["case_id"]: r for r in results}
assert abs(by_id["MK-S01"]["initial"]["general"] - 54.4753) <= .0001
assert by_id["MK-S02"]["initial"]["general"] is None
assert abs(by_id["MK-S03"]["initial"]["general"] - 44.5988) <= .0001
assert by_id["MK-S12"]["initial"]["general"] is None
assert by_id["MK-S12"]["after_complete_reconfirmation"] == by_id["MK-S01"]["initial"]
(ROOT / "referencia_indices.json").write_text(json.dumps(expected, ensure_ascii=False, indent=2) + "\n")
print("12 casos y 10 variantes estructuralmente válidos; 20 señales únicas.")
for result in results:
    print(result["case_id"], result["initial"]["pillars"], result["initial"]["general"])
print("Esto no comprueba que la aplicación haya producido estos resultados.")

