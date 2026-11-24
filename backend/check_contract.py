import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
main_path = os.path.join(backend_dir, 'app', 'main.py')
schemas_path = os.path.join(backend_dir, 'app', 'schemas.py')

with open(main_path, 'r') as f:
    main_content = f.read()

with open(schemas_path, 'r') as f:
    schemas_content = f.read()

combined = main_content + "\n" + schemas_content

print('=== Endpoint Detection ===')

endpoints = [
    ('GET /health', '@app.get("/health"'),
    ('POST /chat', '@app.post("/chat"'),
    ('GET /sessions/{session_id}/messages', '@app.get("/sessions/{session_id}/messages"'),
]

for name, pattern in endpoints:
    status = '[PASS]' if pattern in main_content else '[FAIL]'
    print(f'  {status} {name} endpoint present')

print()
print('=== Mandatory Response Fields ===')

checks = {
    'Health status': 'status' in schemas_content,
    'Health keys_configured': 'keys_configured' in schemas_content,
    'Health cache_enabled': 'cache_enabled' in schemas_content,
    'Chat session_id': 'session_id' in schemas_content,
    'Chat reply': 'reply' in schemas_content,
    'Chat metadata': 'metadata' in schemas_content,
    'Chat resolution_source': 'resolution_source' in schemas_content,
    'Chat model': 'model' in schemas_content,
    'Chat latency_ms': 'latency_ms' in schemas_content,
    'Chat input_tokens': 'input_tokens' in schemas_content,
    'Chat output_tokens': 'output_tokens' in schemas_content,
    'Messages messages': 'messages' in schemas_content,
    'Messages role': 'role' in schemas_content,
    'Messages content': 'content' in schemas_content,
    'Messages metadata': 'metadata' in schemas_content,
}

for field, result in checks.items():
    status = '[PASS]' if result else '[FAIL]'
    print(f'  {status} {field}')
