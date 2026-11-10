#!/usr/bin/env bash

# PayPilot Backend Smoke Test Suite
# Tests all API routes, edge cases, idempotency, and error handling.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

echo "=========================================================="
echo " Starting PayPilot Smoke Tests against $BASE_URL"
echo "=========================================================="

assert_status() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  local response_body="$4"

  if [ "$actual" -eq "$expected" ]; then
    echo " PASS: $test_name (HTTP $actual)"
    PASSED=$((PASSED + 1))
  else
    echo " FAIL: $test_name (Expected HTTP $expected, got $actual)"
    echo "   Response: $response_body"
    FAILED=$((FAILED + 1))
  fi
}

# 1. GET /api/invoices
echo -e "\n--- Test 1: GET /api/invoices ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/invoices")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "GET /api/invoices returns 200" 200 "$STATUS" "$BODY"

# 2. GET /api/invoices/[id]
echo -e "\n--- Test 2: GET /api/invoices/[id] ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/invoices/inv-mock-paid")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "GET /api/invoices/[id] existing returns 200" 200 "$STATUS" "$BODY"

RESP_404=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/invoices/non-existent-id")
STATUS_404=$(echo "$RESP_404" | tail -n 1)
BODY_404=$(echo "$RESP_404" | head -n -1)
assert_status "GET /api/invoices/[id] missing returns 404" 404 "$STATUS_404" "$BODY_404"

# 3. GET /api/actions?status=pending
echo -e "\n--- Test 3: GET /api/actions?status=pending ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/actions?status=pending")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "GET /api/actions?status=pending returns 200" 200 "$STATUS" "$BODY"

# 4. Server-side validation: Invalid email on create_invoice approval returns 400
echo -e "\n--- Test 4: Invalid email validation returns 400 ---"
CREATE_INVALID_ACTION=$(curl -s -X POST "$BASE_URL/api/actions" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "create_invoice",
    "payload": {
      "clientName": "Test Client",
      "clientEmail": "not-an-email",
      "description": "Consulting",
      "amount": 500,
      "dueInDays": 14
    }
  }')
INVALID_ACTION_ID=$(echo "$CREATE_INVALID_ACTION" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/actions/$INVALID_ACTION_ID/approve")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Approving invoice draft with invalid email returns 400" 400 "$STATUS" "$BODY"

# 5. Create valid invoice draft and approve it (returns 200 and creates invoice)
echo -e "\n--- Test 5: Valid create_invoice approval returns 200 ---"
CREATE_VALID_ACTION=$(curl -s -X POST "$BASE_URL/api/actions" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "create_invoice",
    "payload": {
      "clientName": "Acme Partner",
      "clientEmail": "partner@acme.com",
      "description": "Integration Sprint 1",
      "amount": 1200,
      "dueInDays": 14
    }
  }')
VALID_ACTION_ID=$(echo "$CREATE_VALID_ACTION" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/actions/$VALID_ACTION_ID/approve")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Approving valid invoice draft returns 200" 200 "$STATUS" "$BODY"

# 6. Idempotency: Approving the same action twice must return 409
echo -e "\n--- Test 6: Approving already resolved action returns 409 ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/actions/$VALID_ACTION_ID/approve")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Second approval attempt returns 409 Conflict" 409 "$STATUS" "$BODY"

# 7. Reminder on a paid invoice returns 400
echo -e "\n--- Test 7: Reminder on a paid invoice returns 400 ---"
CREATE_REMINDER_ACTION=$(curl -s -X POST "$BASE_URL/api/actions" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "send_reminder",
    "payload": {
      "invoiceId": "inv-mock-paid",
      "message": "Payment reminder for settled bill",
      "tone": "polite"
    }
  }')
REMINDER_ACTION_ID=$(echo "$CREATE_REMINDER_ACTION" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/actions/$REMINDER_ACTION_ID/approve")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Reminder on paid invoice returns 400" 400 "$STATUS" "$BODY"

# 8. Reject action
echo -e "\n--- Test 8: Reject action returns 200 ---"
CREATE_REJECT_ACTION=$(curl -s -X POST "$BASE_URL/api/actions" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "create_invoice",
    "payload": {
      "clientName": "Rejected Client",
      "clientEmail": "reject@client.com",
      "description": "Declined proposal",
      "amount": 300,
      "dueInDays": 7
    }
  }')
REJECT_ACTION_ID=$(echo "$CREATE_REJECT_ACTION" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/actions/$REJECT_ACTION_ID/reject")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Rejecting pending action returns 200" 200 "$STATUS" "$BODY"

# 9. GET /api/logs
echo -e "\n--- Test 9: GET /api/logs ---"
RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/logs")
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "GET /api/logs returns 200" 200 "$STATUS" "$BODY"

# 10. Webhook without signatures returns 401
echo -e "\n--- Test 10: Unsigned webhook is rejected with 401 ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/webhooks/paypal" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "INVOICING.INVOICE.PAID", "resource": {"id": "INV2-MOCK-SENT2"}}')
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Unsigned webhook returns 401" 401 "$STATUS" "$BODY"

# 11. Valid simulated webhook marks invoice paid and returns 200
echo -e "\n--- Test 11: Valid webhook marks invoice as paid ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/webhooks/paypal" \
  -H "Content-Type: application/json" \
  -H "x-mock-webhook: valid" \
  -d '{"event_type": "INVOICING.INVOICE.PAID", "resource": {"invoice": {"id": "INV2-MOCK-SENT2"}}}')
STATUS=$(echo "$RESP" | tail -n 1)
BODY=$(echo "$RESP" | head -n -1)
assert_status "Valid webhook returns 200" 200 "$STATUS" "$BODY"

echo "=========================================================="
echo " Smoke Tests Summary: $PASSED passed, $FAILED failed"
echo "=========================================================="

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
