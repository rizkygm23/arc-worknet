# Quality Assurance Learning Roadmap

> Goal:
> Practice becoming a Software Quality Assurance Engineer by testing this project like a real QA Intern.

---

# QA Workflow

Every new feature should follow this flow:

Requirement
    ↓
Understand Feature
    ↓
Create Test Cases
    ↓
Manual Testing
    ↓
Exploratory Testing
    ↓
Report Bugs
    ↓
Developer Fix
    ↓
Regression Testing
    ↓
Automation Testing (Cypress)
    ↓
Release Validation

---

# 1. Understand Requirement

Before testing, answer these questions:

- What feature is being built?
- Who uses this feature?
- What problem does it solve?
- What should happen?
- What should NOT happen?
- What are the edge cases?

Example:

Feature:
User Login

Expected:

✅ User can login with correct email/password.

❌ Wrong password shows error.

❌ Empty form cannot submit.

❌ Invalid email format rejected.

---

# 2. Create Test Cases

Template

| ID | Scenario | Steps | Expected Result | Status |
|----|----------|-------|-----------------|--------|
| TC001 | Login Success | Input valid email/password | Redirect to Dashboard | ☐ |
| TC002 | Wrong Password | Input wrong password | Error message appears | ☐ |
| TC003 | Empty Email | Leave email empty | Validation shown | ☐ |
| TC004 | Empty Password | Leave password empty | Validation shown | ☐ |

---

# 3. Manual Testing Checklist

For every page check:

## UI

- Layout broken?
- Responsive?
- Button works?
- Image loaded?
- Font readable?
- Overflow?

---

## Functional

- CRUD works?
- Validation works?
- Search works?
- Pagination works?
- Sorting works?
- Navigation works?

---

## Security

- Can access page without login?
- Input accepts SQL Injection?
- XSS possible?
- API protected?

---

## Performance

- Slow page?
- Duplicate request?
- Large image?
- Loading indicator?

---

# 4. Exploratory Testing

Spend 15-30 minutes trying weird things.

Examples

- Double click button rapidly
- Refresh during submit
- Open multiple tabs
- Paste 1000 characters
- Emoji input
- HTML input
- Script injection
- Extremely long name
- Very small screen
- Turn internet off
- Press Back button
- Spam API requests

Record anything unusual.

---

# 5. Bug Report Template

## Bug Title

Login button freezes after multiple clicks

---

Environment

Browser:
Chrome 138

OS:
Windows 11

Version:
v1.0

---

Steps

1. Open Login
2. Input valid account
3. Double click Login

---

Expected

Only one request sent.

---

Actual

Five requests sent.

---

Severity

Medium

Priority

High

---

Screenshot

Attach screenshot

---

Video

Attach recording

---

# 6. Regression Testing

Whenever developer fixes bug:

Re-test:

- Original bug
- Related feature
- Other login flow
- Register
- Logout
- Forgot Password

Never assume fixing one bug doesn't break another feature.

---

# 7. Release Checklist

Before production:

- All critical bugs fixed
- No console errors
- Responsive
- Validation works
- APIs working
- Authentication working
- Forms working
- Loading states
- Error states
- Empty states
- Success notification
- Accessibility basic check

---

# 8. Cypress Learning

Install

```bash
npm install cypress --save-dev
```

Run

```bash
npx cypress open
```

Example

```javascript
describe("Login", () => {

    it("Login Success", () => {

        cy.visit("/login")

        cy.get('[data-testid=email]')
            .type("admin@mail.com")

        cy.get('[data-testid=password]')
            .type("123456")

        cy.get('[data-testid=login]')
            .click()

        cy.url().should("include", "/dashboard")

    })

})
```

---

# 9. Things to Practice

## Authentication

- Login
- Logout
- Register
- Forgot Password

---

## Dashboard

- Statistics
- Charts
- Loading

---

## CRUD

- Create
- Read
- Update
- Delete

---

## Search

- Empty keyword
- Full keyword
- Partial keyword
- Case sensitive
- Spaces

---

## Pagination

- First page
- Last page
- Previous
- Next

---

## Form Validation

- Empty field
- Required
- Min length
- Max length
- Email format
- Phone format

---

## API Error

Mock:

401

403

404

500

Timeout

No Internet

---

# 10. Common Bug Categories

UI Bug

Example:
Button overlaps text.

---

Functional Bug

Example:
Delete button doesn't work.

---

Validation Bug

Example:
Email accepts "abc".

---

Performance Bug

Example:
Dashboard loads for 15 seconds.

---

Security Bug

Example:
User can access admin page directly.

---

Compatibility Bug

Example:
Broken on Firefox.

---

Regression Bug

Example:
Fixing login breaks register.

---

# 11. Daily QA Habit

Whenever adding a feature:

☐ Understand requirement

☐ Create test case

☐ Manual testing

☐ Exploratory testing

☐ Report bug

☐ Verify fix

☐ Automation test

☐ Regression

---

# 12. Interview Notes

Know these terms:

- SDLC
- STLC
- Smoke Testing
- Sanity Testing
- Regression Testing
- Functional Testing
- Exploratory Testing
- Black Box Testing
- White Box Testing
- UAT
- Test Case
- Test Scenario
- Bug Lifecycle
- Severity vs Priority
- Positive Testing
- Negative Testing
- Edge Case
- Boundary Value Analysis
- Equivalence Partitioning

---

# 13. Goal

By the end of this learning project, I should be able to:

✅ Create professional test cases

✅ Find meaningful bugs

✅ Write good bug reports

✅ Perform manual testing

✅ Perform exploratory testing

✅ Write Cypress automation tests

✅ Participate confidently as a QA Intern