# Contributing Guidelines

## Protected Branch: `main`

**Rules :**
1. ❌ **NEVER push directly to `main`**
2. ✅ **ALWAYS create a feature branch**
3. ✅ **ALWAYS create a PR**
4. ✅ **ALWAYS get teammate approval before merging**
5. ❌ **NEVER force push to `main`**
6. ❌ **NEVER delete `main`**

## Workflow
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Commit changes
git add .
git commit -m "feat(): description"

# 3. Push feature branch
git push origin feature/my-feature

# 4. Create PR on GitHub
# 5. Request review from teammate
# 6. After approval, merge on GitHub
# 7. Delete feature branch
```

## Violation Consequences
- Code review discussion
- Revert commits if needed
- Learning opportunity, not punishment

### Team Checklist (Print & Pin):
```
┌─────────────────────────────────────────┐
│  BEFORE EVERY COMMIT - CHECK:           │
├─────────────────────────────────────────┤
│  [ ] Am I on a feature branch?          │
│      (not main!)                        │
│                                         │
│  [ ] Did I create a PR?                 │
│                                         │
│  [ ] Did teammate approve?              │
│                                         │
│  [ ] If there are tests, all tests pass?│
│                                         │
│  [ok] THEN merge                        │
└─────────────────────────────────────────┘
```