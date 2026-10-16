#!/usr/bin/env python3
"""Extract formulario v1 questions into a versioned JSON catalog. Dev only."""

import hashlib
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "260529-FORMULARIOS-X-PASO.xlsx"
OUT = ROOT / "packages/database/definitions/formulario-completo@1.json"
INVENTORY = ROOT / "packages/database/definitions/formulario-completo@1.inventory.json"

SCALE = [
    (1, "1"),
    (2, "2"),
    (3, "3"),
    (4, "4"),
    (5, "5"),
]


def text(value):
    if value is None:
        return ""
    return str(value).replace("\n", " ").strip()


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def options_from_pairs(pairs):
    return [
        {"order": order, "textEs": label, "value": str(order if isinstance(order, int) else label)}
        for order, label in pairs
    ]


def scale_options():
    return [{"order": n, "textEs": label, "value": str(n)} for n, label in SCALE]


def identity_options():
    return [
        {"order": 1, "textEs": "1", "value": "1"},
        {"order": 2, "textEs": "2", "value": "2"},
        {"order": 3, "textEs": "3", "value": "3"},
        {"order": 4, "textEs": "4", "value": "4"},
    ]


def difficulty_options():
    return [
        {"order": 1, "textEs": "Sí", "value": "2"},
        {"order": 2, "textEs": "Más o menos", "value": "1"},
        {"order": 3, "textEs": "No", "value": "0"},
    ]


def question(sheet, row, block, instrument, qtype, options, polarity="DIRECT", role="QUESTION"):
    ws_text = text(sheet.cell(row, 2).value) or text(sheet.cell(row, 3).value)
    observation = text(sheet.cell(row, 3).value)
    if observation == ws_text:
        observation = ""
    return {
        "sourceRef": f"formulario-v1:{sheet.title}!R{row}",
        "sheet": sheet.title,
        "cells": f"R{row}",
        "block": block,
        "order": 0,
        "role": role,
        "type": qtype,
        "textEs": ws_text[:2000] or f"Ítem {sheet.title} fila {row}",
        "contextEs": observation[:2000] or None,
        "instrument": instrument,
        "polarity": polarity,
        "allowedExceptions": ["UNKNOWN", "DECLINED", "NOT_APPLICABLE", "PENDING"],
        "options": options,
        "formula": None,
        "alerts": [],
    }


def numbered_rows(ws, start, end):
    rows = []
    for row in range(start, end + 1):
        if is_number(ws.cell(row, 1).value) and text(ws.cell(row, 2).value):
            rows.append(row)
    return rows


def add_module(modules, inventory, slug, order, title, form_code, intro, items):
    for index, item in enumerate(items, start=1):
        item["order"] = index
        inventory.append({k: item[k] for k in ("sourceRef", "sheet", "cells", "block", "role", "instrument")})
    modules.append({
        "slug": slug,
        "order": order,
        "titleEs": title,
        "introEs": intro,
        "formCode": form_code,
        "questions": items,
    })


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=False)
    modules = []
    inventory = []
    order = 1

    audit = wb["E-AUD-001"]
    sections = [
        ("e-aud-s1", "Mentalidad e identidad", 6, 10, "audit"),
        ("e-aud-s2", "Hábitos y acciones", 16, 20, "audit"),
        ("e-aud-s3", "Toma de decisiones y entorno", 26, 30, "audit"),
        ("e-aud-s4", "Soberanía financiera", 37, 40, "audit"),
        ("e-aud-s5", "Calidad de relaciones", 46, 49, "audit"),
        ("e-aud-s6", "Desarrollo y sentido", 56, 68, "sense"),
    ]
    for slug, title, start, end, instrument in sections:
        items = [
            question(audit, row, title, instrument, "SCALE_1_5", scale_options())
            for row in numbered_rows(audit, start, end)
        ]
        add_module(modules, inventory, slug, order, title, "E-AUD-001", title, items)
        order += 1

    physical = wb["F-RAD-001"]
    physical_sections = [
        ("f-rad-001-s1", "Condiciones físicas", 6, 12),
        ("f-rad-001-s2", "Antecedentes de salud", 18, 28),
        ("f-rad-001-s3", "Alimentación", 34, 42),
        ("f-rad-001-s4", "Actividad física", 48, 55),
        ("f-rad-001-s5", "Sueño y estrés", 61, 68),
        ("f-rad-001-s6", "Percepción corporal", 74, 79),
        ("f-rad-001-s7", "Optimización física", 82, 92),
    ]
    for slug, title, start, end in physical_sections:
        items = []
        for row in numbered_rows(physical, start, end):
            items.append(question(physical, row, title, "body", "FREE_TEXT", []))
            detail = text(physical.cell(row + 1, 3).value)
            marker = text(physical.cell(row + 1, 2).value)
            if detail.lower().startswith("registrar") and not marker:
                detail_q = question(physical, row + 1, title, "body", "FREE_TEXT", [], role="DETAIL")
                detail_q["textEs"] = detail
                detail_q["contextEs"] = f"Detalle de {items[-1]['sourceRef']}"
                items.append(detail_q)
        add_module(modules, inventory, slug, order, title, "F-RAD-001", title, items)
        order += 1

    relations = wb["F-RAD-002"]
    rel_sections = [
        ("f-rad-002-s1", "Pareja o núcleo íntimo", 6, 8),
        ("f-rad-002-s2", "Familia", 16, 18),
        ("f-rad-002-s3", "Amistades", 25, 27),
        ("f-rad-002-s4", "Entorno laboral", 34, 36),
    ]
    for slug, title, start, end in rel_sections:
        items = [question(relations, row, title, "relations", "SCALE_1_5", scale_options()) for row in numbered_rows(relations, start, end)]
        add_module(modules, inventory, slug, order, title, "F-RAD-002", title, items)
        order += 1

    finance = wb["F-RAD-003"]
    fin_sections = [
        ("f-rad-003-s1", "Suficiencia y flujo", 7, 9, "finance"),
        ("f-rad-003-s2", "Ahorro", 17, 19, "finance"),
        ("f-rad-003-s3", "Inversión", 26, 28, "finance"),
        ("f-rad-003-s4", "Deudas", 35, 37, "finance"),
    ]
    for slug, title, start, end, instrument in fin_sections:
        items = [question(finance, row, title, instrument, "SCALE_1_5", scale_options()) for row in numbered_rows(finance, start, end)]
        add_module(modules, inventory, slug, order, title, "F-RAD-003", title, items)
        order += 1
    projection = []
    for row in numbered_rows(finance, 44, 55):
        projection.append(question(finance, row, "Proyección financiera", "finance-projection", "FREE_TEXT", []))
    if projection:
        add_module(modules, inventory, "f-rad-003-proy", order, "Construcción y proyección", "F-RAD-003", "Proyección", projection)
        order += 1

    profile = wb["E-PER-000"]
    profile_blocks = [
        ("e-per-origen", "Origen y linaje", 1, 22, "origin", "FREE_TEXT", []),
        ("e-per-vision", "Visión", 28, 34, "vision", "FREE_TEXT", []),
        ("e-per-valores", "Valores", 40, 54, "values", "FREE_TEXT", []),
        ("e-per-estandares", "Estándares", 60, 66, "standards", "FREE_TEXT", []),
        ("e-per-identidad", "Identidad", 73, 86, "identity", "SINGLE_CHOICE", identity_options()),
        ("e-per-personalidad", "Personalidad", 187, 205, "personality", "SCALE_1_5", scale_options()),
        ("e-per-huella", "Huella", 266, 277, "footprint", "FREE_TEXT", []),
    ]
    inverse_rows = {188, 192, 196, 200, 204}
    for slug, title, start, end, instrument, qtype, opts in profile_blocks:
        items = []
        for row in numbered_rows(profile, start, end):
            polarity = "INVERSE" if row in inverse_rows else "DIRECT"
            chosen = opts if opts else []
            if instrument == "values" and row == 40:
                chosen = []
                qtype_row = "FREE_TEXT"
            else:
                qtype_row = qtype
            items.append(question(profile, row, title, instrument, qtype_row, chosen, polarity))
        add_module(modules, inventory, slug, order, title, "E-PER-000", title, items)
        order += 1

    difficulty_items = []
    for row in range(90, 160):
        label = text(profile.cell(row, 3).value)
        prefix = label.split(".", 1)[0]
        if prefix[:2] in ("PR", "ER", "PY", "IN") or (prefix[:1] == "D" and prefix[1:].isdigit()):
            item = question(profile, row, "Dificultades y recursos", "difficulties", "SINGLE_CHOICE", difficulty_options())
            item["textEs"] = label
            difficulty_items.append(item)
    add_module(modules, inventory, "e-per-dificultades", order, "Dificultades y recursos", "E-PER-000", "Dificultades", difficulty_items)
    order += 1

    ikigai_items = []
    lenses = [("Pasión", range(220, 225)), ("Vocación", range(227, 232)), ("Misión", range(234, 239)), ("Profesión", range(241, 246))]
    for lens, rows in lenses:
        for index, row in enumerate(rows, start=1):
            item = question(profile, row, "IKIGAI", "ikigai", "FREE_TEXT", [])
            original = text(profile.cell(row, 2).value)
            item["textEs"] = original or f"Actividad {index} de {lens}"
            item["contextEs"] = f"Campo {lens}. Escribe la actividad o elige no responder."
            ikigai_items.append(item)
    add_module(modules, inventory, "e-per-ikigai", order, "IKIGAI", "E-PER-000", "Cuatro campos, sin puntaje de cruce.", ikigai_items)
    order += 1

    payload = {
        "version": "formulario-completo@1",
        "definitionRef": "formulario-completo",
        "sourceFile": XLSX.name,
        "modules": modules,
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    payload["sourceSha256"] = hashlib.sha256(XLSX.read_bytes()).hexdigest()
    payload["definitionSha256"] = hashlib.sha256(raw).hexdigest()
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    INVENTORY.write_text(json.dumps({"items": inventory, "count": len(inventory)}, ensure_ascii=False, indent=2), encoding="utf-8")
    by_instrument = {}
    for item in inventory:
        by_instrument[item["instrument"]] = by_instrument.get(item["instrument"], 0) + 1
    print(json.dumps({"questions": len(inventory), "modules": len(modules), "byInstrument": by_instrument}, ensure_ascii=False))


if __name__ == "__main__":
    main()
