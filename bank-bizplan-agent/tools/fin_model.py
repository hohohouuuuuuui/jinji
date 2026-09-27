#!/usr/bin/env python3
"""은행 신사업 재무 추정 계산기.

가정 JSON을 읽어 연도별 손익, 현금흐름, NPV, IRR, 회수기간, 시나리오, 민감도를
마크다운으로 출력한다. 표준 라이브러리만 사용한다.

사용법:
    python3 tools/fin_model.py <assumptions.json>

단위 규칙:
    - 고객 수: 명
    - 객단가(arpu_won), 고객당 변동비(variable_cost_won), 고객획득비용(cac_won): 원/년
    - 초기 투자, 고정비: 억원
    - 결과 금액: 억원

연도별로 달라지는 값은 리스트로, 매년 같은 값은 숫자 하나로 쓸 수 있다.
형식 예시는 tools/example_assumptions.json 참고.
"""

import json
import sys

WON_PER_EOK = 100_000_000


def per_year(value, years, name):
    if isinstance(value, (int, float)):
        return [float(value)] * years
    if isinstance(value, list) and len(value) == years:
        return [float(v) for v in value]
    raise ValueError(f"'{name}'은 숫자 하나 또는 길이 {years}의 리스트여야 합니다: {value!r}")


def project(a, mult=None):
    """가정(a)과 배수(mult)로 연도별 결과를 계산한다."""
    m = {"customers": 1.0, "arpu": 1.0, "fixed_costs": 1.0, "cac": 1.0, "variable_cost": 1.0}
    m.update(mult or {})
    n = a["years"]
    tax_rate = a.get("tax_rate", 0.24)
    churn = a.get("annual_churn", 0.0)
    invest = float(a["initial_investment"])
    dep_years = a.get("depreciation_years", n)
    dep = invest / dep_years if dep_years else 0.0

    customers = [c * m["customers"] for c in per_year(a["customers"], n, "customers")]
    streams = a["revenue_streams"]
    var_won = [v * m["variable_cost"] for v in per_year(a.get("variable_cost_won", 0), n, "variable_cost_won")]
    cac_won = [v * m["cac"] for v in per_year(a.get("cac_won", 0), n, "cac_won")]
    fixed_items = a.get("fixed_costs", [])

    rows = []
    prev = 0.0
    for t in range(n):
        c = customers[t]
        revenue = 0.0
        for s in streams:
            arpu = per_year(s["arpu_won"], n, s["name"])[t] * m["arpu"]
            revenue += c * arpu / WON_PER_EOK
        new_customers = max(0.0, c - prev) + prev * churn
        variable = c * var_won[t] / WON_PER_EOK
        acquisition = new_customers * cac_won[t] / WON_PER_EOK
        fixed = sum(per_year(f["amount"], n, f["name"])[t] for f in fixed_items) * m["fixed_costs"]
        depreciation = dep if t < dep_years else 0.0
        ebit = revenue - variable - acquisition - fixed - depreciation
        tax = ebit * tax_rate if ebit > 0 else 0.0  # 단순화: 이월결손금 미반영
        cash_flow = ebit - tax + depreciation
        rows.append({
            "year": t + 1, "customers": c, "new_customers": new_customers,
            "revenue": revenue, "variable": variable, "acquisition": acquisition,
            "fixed": fixed, "depreciation": depreciation, "ebit": ebit, "tax": tax,
            "cash_flow": cash_flow,
        })
        prev = c
    return rows


def metrics(a, rows):
    r = a.get("discount_rate", 0.10)
    invest = float(a["initial_investment"])
    flows = [-invest] + [row["cash_flow"] for row in rows]

    tv = 0.0
    g = a.get("terminal_growth")
    if g is not None and r > g:
        tv = rows[-1]["cash_flow"] * (1 + g) / (r - g)
    npv = sum(cf / (1 + r) ** t for t, cf in enumerate(flows)) + tv / (1 + r) ** len(rows)

    cumulative, payback = -invest, None
    for row in rows:
        before = cumulative
        cumulative += row["cash_flow"]
        if payback is None and cumulative >= 0 and row["cash_flow"] > 0:
            payback = row["year"] - 1 + (-before / row["cash_flow"])

    bep_year = next((row["year"] for row in rows if row["ebit"] > 0), None)
    return {"npv": npv, "irr": irr(flows), "payback": payback, "bep_year": bep_year,
            "terminal_value": tv, "cumulative_cf": cumulative}


def irr(flows, lo=-0.99, hi=10.0):
    def npv_at(rate):
        return sum(cf / (1 + rate) ** t for t, cf in enumerate(flows))
    f_lo, f_hi = npv_at(lo), npv_at(hi)
    if f_lo * f_hi > 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2
        f_mid = npv_at(mid)
        if f_lo * f_mid <= 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2


def fmt(x, digits=1):
    return "-" if x is None else f"{x:,.{digits}f}"


def pct(x):
    return "산출 불가" if x is None else f"{x * 100:.1f}%"


def years_str(x):
    return "기간 내 미회수" if x is None else f"{x:.1f}년"


def render(a):
    out = []
    unit = a.get("unit", "억원")
    out.append(f"# 재무 추정 결과: {a.get('project', '(이름 없음)')}\n")
    out.append(f"- 단위: {unit} (고객 수는 명)")
    out.append(f"- 할인율 {pct(a.get('discount_rate', 0.10))}, 법인세율 {pct(a.get('tax_rate', 0.24))}, "
               f"연 이탈률 {pct(a.get('annual_churn', 0.0))}, 초기 투자 {fmt(a['initial_investment'])}")
    if a.get("terminal_growth") is not None:
        out.append(f"- 잔존가치 반영: 영구성장률 {pct(a['terminal_growth'])}")
    else:
        out.append("- 잔존가치 미반영 (추정 기간 내 현금흐름만 계산 — 보수적)")
    out.append("- 단순화: 초기 투자는 정액 상각, 이월결손금 미반영, 운전자본 변동 미반영\n")

    base = project(a)
    out.append("## 기본 시나리오 연도별 손익\n")
    header = "| 항목 | " + " | ".join(f"{r['year']}년차" for r in base) + " |"
    out.append(header)
    out.append("|---|" + "---|" * len(base))
    lines = [
        ("평균 고객 수", "customers", 0), ("신규 고객 수", "new_customers", 0),
        ("매출", "revenue", 1), ("변동비", "variable", 1), ("고객획득비용", "acquisition", 1),
        ("고정비", "fixed", 1), ("감가상각", "depreciation", 1), ("영업이익", "ebit", 1),
        ("법인세", "tax", 1), ("영업현금흐름", "cash_flow", 1),
    ]
    for label, key, d in lines:
        out.append(f"| {label} | " + " | ".join(fmt(r[key], d) for r in base) + " |")

    out.append("\n## 시나리오 비교\n")
    out.append("| 시나리오 | NPV | IRR | 회수기간 | 첫 흑자 연도 | 누적 현금흐름(투자 차감) |")
    out.append("|---|---|---|---|---|---|")
    scenarios = {"기본": {}}
    scenarios.update(a.get("scenarios", {}))
    for name, mult in scenarios.items():
        mt = metrics(a, project(a, mult))
        bep = f"{mt['bep_year']}년차" if mt["bep_year"] else "기간 내 없음"
        out.append(f"| {name} | {fmt(mt['npv'])} | {pct(mt['irr'])} | {years_str(mt['payback'])} "
                   f"| {bep} | {fmt(mt['cumulative_cf'])} |")

    swing = a.get("sensitivity_range", 0.2)
    base_npv = metrics(a, base)["npv"]
    labels = {"customers": "고객 수", "arpu": "객단가", "fixed_costs": "고정비",
              "cac": "고객획득비용", "variable_cost": "변동비"}
    sens = []
    for key, label in labels.items():
        low = metrics(a, project(a, {key: 1 - swing}))["npv"]
        high = metrics(a, project(a, {key: 1 + swing}))["npv"]
        sens.append((abs(high - low), label, low, high))
    sens.sort(reverse=True)
    out.append(f"\n## 민감도 (각 변수 ±{swing * 100:.0f}%, 기본 NPV {fmt(base_npv)})\n")
    out.append(f"| 변수 | -{swing * 100:.0f}% 시 NPV | +{swing * 100:.0f}% 시 NPV | 변동폭 |")
    out.append("|---|---|---|---|")
    for width, label, low, high in sens:
        out.append(f"| {label} | {fmt(low)} | {fmt(high)} | {fmt(width)} |")
    out.append(f"\n가장 민감한 변수: **{sens[0][1]}**, **{sens[1][1]}**")

    notes = [(s["name"], s.get("note")) for s in a["revenue_streams"]]
    notes += [(f["name"], f.get("note")) for f in a.get("fixed_costs", [])]
    notes += [(k, v) for k, v in a.get("notes", {}).items()]
    notes = [(k, v) for k, v in notes if v]
    if notes:
        out.append("\n## 가정 근거\n")
        out.extend(f"- **{k}**: {v}" for k, v in notes)
    return "\n".join(out) + "\n"


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as f:
        assumptions = json.load(f)
    print(render(assumptions))


if __name__ == "__main__":
    main()
