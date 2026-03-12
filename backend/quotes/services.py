import base64
import json
import os
from openai import OpenAI


DEFAULT_FIELDS = [
    'customer',
    'insured_name',
    'email',
    'mobile_number',
    'policy_type',
    'premium',
    'vat_5_percent',
    'excess',
    'total_payable',
    'insured_value',
]

FIELD_LABELS = {
    'customer': 'Customer',
    'insured_name': 'Insured Name',
    'email': 'Email',
    'mobile_number': 'Mobile Number',
    'policy_type': 'Policy Type',
    'premium': 'Premium',
    'vat_5_percent': 'VAT 5%',
    'excess': 'Excess',
    'total_payable': 'Total Payable',
    'insured_value': 'Insured Value',
}


def extract_from_pdf(pdf_bytes: bytes, product_type: str) -> dict:
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

    base64_pdf = base64.standard_b64encode(pdf_bytes).decode('utf-8')

    fields_description = ', '.join([f'"{f}" ({FIELD_LABELS[f]})' for f in DEFAULT_FIELDS])

    system_prompt = f"""You are an insurance document data extractor. Extract the following fields from the insurance quote PDF.
Product type: {product_type}

Fields to extract: {fields_description}

Field variation hints:
- "Customer" may appear as "Customer Details" or "Client Name"
- "Insured Name" may appear as "Name of Insured" or "Policyholder"
- "Mobile Number" may appear as "Phone", "Contact Number", or "Tel"
- "VAT 5%" may appear as "VAT", "Tax", or "Value Added Tax"
- "Excess" may appear as "Deductible"
- "Insured Value" may appear as "Sum Insured" or "Coverage Amount"

Return a JSON object with exactly these keys. If a field is not found, use "N/A" as the value.
All values should be strings. For monetary amounts, include the currency symbol.
Return ONLY valid JSON, no markdown formatting."""

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model='gpt-4o',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'file',
                                'file': {
                                    'filename': 'quote.pdf',
                                    'file_data': f'data:application/pdf;base64,{base64_pdf}',
                                },
                            },
                            {
                                'type': 'text',
                                'text': 'Extract the insurance quote data from this PDF document.',
                            },
                        ],
                    },
                ],
                response_format={'type': 'json_object'},
                max_tokens=2000,
            )
            result = json.loads(response.choices[0].message.content)
            # Ensure all default fields are present
            for field in DEFAULT_FIELDS:
                if field not in result:
                    result[field] = 'N/A'
            return result
        except Exception as e:
            if attempt == 0:
                continue
            raise e
