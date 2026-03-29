from typing import TypedDict


class FieldDef(TypedDict):
    key: str
    label: str
    hints: list[str]


DEFAULT_FIELDS: list[FieldDef] = [
    {"key": "customer", "label": "Customer", "hints": ["Customer Details", "Client Name"]},
    {"key": "insured_name", "label": "Insured Name", "hints": ["Name of Insured", "Policyholder"]},
    {"key": "email", "label": "Email", "hints": ["Email Address", "E-mail"]},
    {"key": "mobile_number", "label": "Mobile Number", "hints": ["Phone", "Contact Number", "Tel"]},
    {"key": "policy_type", "label": "Policy Type", "hints": ["Type of Policy", "Coverage Type", "Plan"]},
    {"key": "premium", "label": "Premium", "hints": ["Premium Amount", "Base Premium"]},
    {"key": "vat_5_percent", "label": "VAT 5%", "hints": ["VAT", "Tax", "Value Added Tax"]},
    {"key": "excess", "label": "Excess", "hints": ["Deductible", "Excess Amount"]},
    {"key": "total_payable", "label": "Total Payable", "hints": ["Total Amount", "Amount Due", "Grand Total"]},
    {"key": "insured_value", "label": "Insured Value", "hints": ["Sum Insured", "Coverage Amount", "Vehicle Value"]},
]

FIELDS_BY_PRODUCT: dict[str, list[FieldDef]] = {
    "MOTOR": DEFAULT_FIELDS,
    "BUSINESS": DEFAULT_FIELDS,
    "HEALTH": DEFAULT_FIELDS,
    "LIFE": DEFAULT_FIELDS,
}


def get_fields(product_type: str) -> list[FieldDef]:
    return FIELDS_BY_PRODUCT.get(product_type, DEFAULT_FIELDS)
