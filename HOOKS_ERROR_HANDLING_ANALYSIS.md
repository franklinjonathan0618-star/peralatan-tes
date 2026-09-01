# Error Handling Analysis - INSERT Mutations Hooks

## Summary Overview

**Total Hooks Analyzed**: 12  
**With Error Handling**: 12/12 (100%)  
**With Try-Catch**: 5/12 (42%)  
**With Console Logging**: 7/12 (58%)  

---

## Error Handling Patterns Breakdown

### Pattern 1: Minimal (Simple throw) - 6 hooks
**Characteristics:**
- ✗ No try-catch wrapper
- ✗ No console logging
- ✓ Simple error check: `if (error) throw error;`
- ✗ No specific error code handling

**Hooks:**
1. `useAddBBMTransaction` → `bbm_transactions`
2. `useAddAlatPendukung` → `alat_pendukung`
3. `useAddKegiatanMekanik` → `kegiatan_mekanik`
4. `useAddOliTransaction` → `oli_transactions`
5. `useAddSparepart` → `sparepart`
6. `useAddPPA` → `ppa`

**Code Pattern:**
```typescript
const { error } = await supabase.from('table').insert(data);
if (error) throw error;
```

---

### Pattern 2: Basic with Callbacks - 2 hooks
**Characteristics:**
- ✗ No try-catch wrapper
- ✗ No console.log (in main function)
- ✓ onSuccess callback for invalidation
- ✓ onError callback with console.error & toast

**Hooks:**
1. `useAddPerbaikan` → `perbaikan`
2. `useAddPPA` → `ppa` (also has onError)

**Code Pattern:**
```typescript
onError: (error: any) => {
  console.error('Error saving:', error);
  toast.error('Gagal menyimpan data');
}
```

---

### Pattern 3: Mock Implementation - 1 hook
**Characteristics:**
- ✗ No try-catch
- ✓ Console.log only (mock data)
- ✗ No actual database error handling

**Hooks:**
1. `useAddSewaAlat` → Simulated (mock)

---

### Pattern 4: Comprehensive Error Handling - 3 hooks ⭐
**Characteristics:**
- ✓ Try-catch wrapper
- ✓ Console logging (both console.log & console.error)
- ✓ Field validation before insert
- ✓ Specific error code handling (23505, 42501, etc.)
- ✓ Detailed error messages
- ✓ Error stack/details logging

**Hooks:**

#### 1. `useAddAlatBerat` → `alat_berat`
```
✓ Try-catch: YES
✓ Field validation: YES (no_lambung, nama_alat required)
✓ Error codes handled: 23505 (duplicate), 42501 (RLS)
✓ Console output: 3 points (initial log, error log, success log)
✓ Error context: Specific user-friendly messages
```

#### 2. `useAddRPA` → `rpa` + `rpa_details` (Dual table)
```
✓ Try-catch: YES (per insert operation)
✓ Field validation: Implicit (structure-based)
✓ Error codes handled: 42501 (RLS error)
✓ Console output: 5+ points (data logs, error logs at each step)
✓ Special handling: Dual-table insert with sequential error checking
✓ Error context: RLS-specific debugging tip included
```

#### 3. `useAddSewaAlatEksternal` → `sewa_alat_eksternal`
```
✓ Try-catch: YES
✓ Field validation: YES (session check + 5 required fields + numeric validation)
✓ Error codes handled: General error details handling
✓ Console output: 6+ points (extensive logging at every step)
✓ Error context: Full error object with code, message, details, hint, stack
✓ Special handling: Session/authentication check before insert
```

#### 4. `useAddTimeSheet` → `timesheet`
```
✓ Try-catch: YES
✓ Field validation: YES (user auth, 3 required fields)
✓ Error codes handled: 23505 (duplicate), 42501 (RLS)
✓ Console output: 3+ points (data log, error details log)
✓ Error context: Specific error code interpretation
✓ Special handling: User authentication validation
```

---

## Error Handling Code Examples

### ❌ Minimal Pattern (Risky)
```typescript
const { error } = await supabase.from('table').insert(data);
if (error) throw error;
```
**Issues:**
- No debugging information
- Hard to trace failures
- No user-friendly feedback
- Difficult to handle specific error types

---

### ✅ Comprehensive Pattern (Recommended)
```typescript
try {
  console.log('Inserting data:', data); // Initial log
  
  // Validation before insert
  if (!data.requiredField) {
    throw new Error('Field is required');
  }
  
  const { data: result, error } = await supabase
    .from('table')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error('Error details:', error); // Detailed error logging
    
    // Specific error handling
    if (error.code === '23505') {
      throw new Error('Data sudah ada');
    } else if (error.code === '42501') {
      throw new Error('Izin ditolak (RLS)');
    } else {
      throw new Error(error.message || 'Unknown error');
    }
  }
  
  console.log('Success:', result); // Success log
  return result;
} catch (error) {
  console.error('Error in operation:', error);
  throw error;
}
```

---

## Key Observations

### 1. **Error Code Handling**
Most comprehensive hooks recognize these Supabase error codes:
- **23505** → Duplicate key (UNIQUE constraint)
- **42501** → Permission denied (RLS policy)

### 2. **Logging Coverage**
Hooks vary in logging density:
- **Minimal** (0 logs): BBM, AlatPendukung, Kegiatan, Oli, Sparepart
- **Basic** (1 log): SewaAlat (mock)
- **Standard** (1-3 logs): Perbaikan, PPA
- **Comprehensive** (3+ logs): AlatBerat, RPA, SewaAlatEksternal, TimeSheet

### 3. **Validation Patterns**
- **No validation** (6 hooks): Simple throw pattern
- **Implicit validation** (2 hooks): Type checking + callbacks
- **Explicit validation** (4 hooks): Pre-insert checks (fields, auth, etc.)

### 4. **Special Cases**
- **Dual-table insert** (RPA): Sequential error checking at each step
- **Authentication checks** (TimeSheet, SewaAlatEksternal): Validate user session
- **Numeric validation** (SewaAlatEksternal): Convert & validate numeric fields

---

## Recommendations for Improvement

### For Minimal Pattern Hooks (6 hooks)
**Target:** useAddBBMTransaction, useAddAlatPendukung, useAddKegiatanMekanik, useAddOliTransaction, useAddSparepart, useAddPPA

```typescript
// Add basic try-catch and logging
try {
  console.log('Inserting into table:', data);
  const { error } = await supabase.from('table').insert(data);
  if (error) {
    console.error('Insert error:', error);
    throw error;
  }
} catch (error) {
  console.error('Failed to insert:', error);
  throw error;
}
```

### For Enhancement - Error Code Handling
All hooks should recognize:
```typescript
if (error.code === '23505') {
  throw new Error('Data dengan key ini sudah ada');
} else if (error.code === '42501') {
  throw new Error('RLS policy denied');
}
```

### For Enhancement - Field Validation
Pre-insert validation like in comprehensive patterns:
```typescript
if (!data.fieldName) {
  throw new Error('fieldName is required');
}
```

---

## Files Referenced

| Hook | File | Status |
|------|------|--------|
| useAddBBMTransaction | [src/hooks/useBBMTransactions.ts](src/hooks/useBBMTransactions.ts#L126) | Minimal |
| useAddAlatPendukung | [src/hooks/useAlatPendukung.ts](src/hooks/useAlatPendukung.ts#L40) | Minimal |
| useAddAlatBerat | [src/hooks/useAlatBerat.ts](src/hooks/useAlatBerat.ts#L211) | Comprehensive ⭐ |
| useAddPerbaikan | [src/hooks/usePerbaikan.ts](src/hooks/usePerbaikan.ts#L167) | Basic |
| useAddKegiatanMekanik | [src/hooks/useKegiatanMekanik.ts](src/hooks/useKegiatanMekanik.ts#L72) | Minimal |
| useAddOliTransaction | [src/hooks/useOliTransactions.ts](src/hooks/useOliTransactions.ts#L31) | Minimal |
| useAddRPA | [src/hooks/useRPA.ts](src/hooks/useRPA.ts#L90) | Comprehensive ⭐ |
| useAddSewaAlat | [src/hooks/useSewaAlat.ts](src/hooks/useSewaAlat.ts#L57) | Mock |
| useAddSewaAlatEksternal | [src/hooks/useSewaAlatEksternal.ts](src/hooks/useSewaAlatEksternal.ts#L107) | Comprehensive ⭐ |
| useAddSparepart | [src/hooks/useSparepart.ts](src/hooks/useSparepart.ts#L65) | Minimal |
| useAddPPA | [src/hooks/usePPA.ts](src/hooks/usePPA.ts#L51) | Minimal |
| useAddTimeSheet | [src/hooks/useTimeSheet.ts](src/hooks/useTimeSheet.ts#L159) | Comprehensive ⭐ |

---

## Pattern Distribution Chart

```
Minimal Pattern (6):        ██████░░░░░░ 50%
Basic Pattern (2):          ██░░░░░░░░░░ 17%
Mock Pattern (1):           █░░░░░░░░░░░ 8%
Comprehensive Pattern (3):  ███░░░░░░░░░ 25%
```

**Note**: Comprehensive hooks (AlatBerat, RPA, SewaAlatEksternal, TimeSheet) should serve as templates for refactoring others.
