# Fix Plan: Web Search Streaming & Prisma Binary Target Issues

## Issue Summary

### 1. Prisma Binary Target Issue
**Error**: `Prisma Client could not locate the Query Engine for runtime "linux-musl"`
**Root Cause**: Missing `binaryTargets` configuration in `schema.prisma`
**Impact**: Database connection failures on deployment (Vercel/Alpine Linux)

### 2. Web Search Streaming Issue  
**Error**: "Stream closed" and "unexpected event type" errors
**Root Cause**: Missing event handlers for web search call events in OpenAI Responses parser
**Impact**: Streaming failures when o4-mini uses web search functionality

## Fix Implementation Plan

### Phase 1: Prisma Binary Target Fix

**File**: `src/server/prisma/schema.prisma`
**Change**: Add `binaryTargets` to generator client block

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"]
}
```

**Why**: Ensures Prisma Client works on both local development (`native`) and deployment (`linux-musl` for Alpine Linux/Vercel)

### Phase 2: Web Search Event Handler Fix

**File**: `src/modules/aix/server/dispatch/chatGenerate/parsers/openai.responses.parser.ts`

**Changes**:

1. **Add missing event handlers** (around line 398, after function call handlers):
```typescript
// 4.4 - Web Search Call Events

case 'response.web_search_call.in_progress':
case 'response.web_search_call.searching':
case 'response.web_search_call.completed':
  R.outputItemVisit(eventType, event.output_index, 'web_search_call');
  // Web search events are acknowledged but not fully implemented yet
  // This prevents "unexpected event type" warnings that cause stream closure
  break;
```

2. **Reduce noise from existing web_search_call warnings**:
   - Line ~300 (streaming parser): Remove console.warn, add comment
   - Line ~606 (non-streaming parser): Remove console.warn, add comment

## Expected Outcomes

### Prisma Fix
- ✅ Eliminates database connection errors on deployment
- ✅ Supports both local development and production environments
- ✅ No functional changes to existing database operations

### Web Search Fix
- ✅ Eliminates "unexpected event type" warnings
- ✅ Prevents premature stream closure
- ✅ Maintains compatibility with all existing functionality
- ✅ Provides clean foundation for future web search implementation

## Risk Assessment

**Low Risk Changes**:
- Prisma binary targets: Standard deployment configuration
- Web search event handlers: No-op acknowledgment only
- No changes to core business logic
- No changes to Google/tRPC/OpenAI response handling

**Validation Steps**:
1. Local development continues to work
2. Deployment database connections succeed
3. Web search streaming no longer causes "Stream closed" errors
4. All existing functionality remains intact

## Implementation Order

1. **Prisma fix first** - Resolves immediate deployment database issues
2. **Web search fix second** - Resolves streaming issues with o4-mini web search
3. **Test both fixes together** - Ensure no conflicts or regressions

This plan addresses both issues with minimal, surgical changes that don't disrupt existing functionality.