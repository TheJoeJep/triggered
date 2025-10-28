# Adding Supabase Realtime to Triggered App

## Quick Summary

**Cost: $0** - Included free in Supabase!
**Benefit: Instant live updates, premium UX**
**Effort: ~2-3 hours to implement**

---

## Step 1: Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Config

Create `frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Step 3: Add Environment Variables

In Railway (frontend service), add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Update TriggerDetailPage for Live Executions

Replace `frontend/src/pages/TriggerDetailPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { triggersApi } from '../api/triggers'
import { TriggerExecution } from '../types'

export default function TriggerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [executions, setExecutions] = useState<TriggerExecution[]>([])
  const [isLive, setIsLive] = useState(true)

  // Initial fetch
  const { data, isLoading } = useQuery({
    queryKey: ['trigger', id],
    queryFn: () => triggersApi.get(id!),
  })

  const { data: initialExecutions } = useQuery({
    queryKey: ['executions', id, 1],
    queryFn: () => triggersApi.getExecutions(id!, 1, 20),
    onSuccess: (data) => {
      setExecutions(data.executions || [])
    },
  })

  // Real-time subscription
  useEffect(() => {
    if (!id || !isLive) return

    const channel = supabase
      .channel(`trigger-executions-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trigger_executions',
          filter: `triggerId=eq.${id}`,
        },
        (payload) => {
          const newExecution = payload.new as TriggerExecution
          setExecutions((prev) => [newExecution, ...prev])
          
          // Show notification
          console.log('New execution:', newExecution)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id, isLive])

  // Also subscribe to trigger updates (pause/resume)
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`trigger-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triggers',
          filter: `id=eq.${id}`,
        },
        () => {
          // Invalidate query to refetch
          queryClient.invalidateQueries({ queryKey: ['trigger', id] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id])

  // ... rest of component
}
```

## Step 5: Update Dashboard for Live Stats

Update `frontend/src/pages/DashboardPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { triggersApi } from '../api/triggers'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ total: 0, active: 0, executions: 0 })
  const queryClient = useQueryClient()

  // Live stats updates
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trigger_executions',
          filter: `userId=eq.${user?.id}`,
        },
        () => {
          // Update execution count
          setStats((prev) => ({
            ...prev,
            executions: prev.executions + 1,
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triggers',
          filter: `userId=eq.${user?.id}`,
        },
        () => {
          // Refetch triggers to update counts
          queryClient.invalidateQueries({ queryKey: ['triggers'] })
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [user?.id, queryClient])

  // ... rest of component
}
```

## Step 6: Enable Realtime in Supabase

1. Go to Supabase Dashboard
2. Go to **Database** → **Replication**
3. Enable replication for tables:
   - `trigger_executions`
   - `triggers`
4. Set Row Level Security (RLS) policies

## Step 7: Update RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE trigger_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own trigger executions
CREATE POLICY "Users can view their own executions"
  ON trigger_executions
  FOR SELECT
  USING (auth.uid()::text = (
    SELECT "userId"::text FROM triggers WHERE id = "triggerId"
  ));

-- Allow users to see their own triggers
CREATE POLICY "Users can view their own triggers"
  ON triggers
  FOR SELECT
  USING (auth.uid()::text = "userId"::text);
```

## Optional: Add Live Status Indicator

In `TriggerDetailPage.tsx`, add a live indicator:

```typescript
<div className="flex items-center gap-2 mb-4">
  <span className="text-sm text-gray-600">Live:</span>
  <button
    onClick={() => setIsLive(!isLive)}
    className={`px-3 py-1 rounded ${
      isLive
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    {isLive ? '🟢 ON' : '⚫ OFF'}
  </button>
</div>
```

## Testing

1. Create a trigger in one browser
2. Open the trigger detail page in another tab
3. Wait for the trigger to execute
4. See execution appear instantly in the second tab!

## Performance Comparison

### Before (Polling):
```
Request every 5 seconds
Bandwidth: ~500KB/hour per user
Database: 720 queries/hour per user
Latency: 0-5 seconds
```

### After (Realtime):
```
Update only when data changes
Bandwidth: ~50KB/hour per user (90% savings!)
Database: Single connection
Latency: 0ms instant!
```

## Rollout Plan

### Phase 1: Dashboard Live Stats (1 hour)
- Easiest to implement
- High visual impact

### Phase 2: Live Execution Feed (1-2 hours)
- Core feature
- Users love this

### Phase 3: Multi-User Sync (30 mins)
- Polish
- Nice-to-have

## Migration Strategy

You can run both systems in parallel:

```typescript
// Support both modes
const useRealtime = import.meta.env.VITE_SUPABASE_URL !== undefined

if (useRealtime) {
  // Use Supabase realtime
} else {
  // Fall back to polling
  useQuery({ refetchInterval: 5000 })
}
```

This allows graceful migration!

