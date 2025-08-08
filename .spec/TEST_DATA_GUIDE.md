# Test Data Guide

## Overview

Test data files provide the exact values needed to test features. They do NOT duplicate test scenarios (which are in requirements.md) - they only provide the data values.

## Test Data Format

Use simple markdown files named `TEST_DATA.md`:

```markdown
# Test Data

Use this exact data when testing the feature:

## Server Connection
- **Name**: Any text (e.g., "Local Dev")  
- **URL**: `ws://localhost:8433/ws`

## Project Selection
- **Name**: Any text (e.g., "Test Project")
- **Path**: `/Users/boyd/wip/test`

## Important Notes
- Use these exact values - others will not work
```

## Test Data Locations

1. **Feature-specific**: `documentation/modules/{module}/features/{feature}/TEST_DATA.md`
   - Use when a feature needs specific test data

2. **Global**: `.spec/TEST_DATA.md`
   - Default values for all features

## Best Practices

- Keep it simple - just the data values needed
- Don't duplicate test scenarios from requirements.md
- Use exact values that are known to work
- Update when server URLs or paths change

## Usage by Reviewers

The product owner reviewer will:
1. Look for TEST_DATA.md in the feature folder
2. Fall back to .spec/TEST_DATA.md if not found
3. Use the exact values provided
4. Document which test data was used