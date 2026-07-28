# Family Hierarchy Ordering

This document explains how the Family Directory listing order is built from Firestore records.

## Desired Order

The root ancestor record with code `0` must always appear first:

```text
0
1
  11
  12
  13
  14
  15
  111
  112
  113
  121
  122
  ...
2
  21
  22
  23
  211
  ...
3
...
7
  71
  72/44
  73
  74
...
```

## Important Rule For Code `0`

Record `0` is the top ancestor card.

It is displayed first, but its `children` array is not used to drive the listing order. This prevents the list from becoming:

```text
0
1
2
3
4
5
6
7
11
12
...
```

That flattened order is incorrect because it separates each branch from its descendants.

## How The Loader Works

The hierarchy is implemented in `loadAllRecords()` inside:

```text
services/family/firestore-service.ts
```

The loader performs these steps:

1. Load all records from the `families` Firestore collection.
2. Build a `recordMap` by family code.
3. Hydrate child display data from matching child records.
4. Add record `0` first, if it exists.
5. Traverse roots `1` through `7` in numeric order.
6. For each root, visit descendants level-by-level.
7. Append any unvisited records at the end as fallback.

## Level-By-Level Traversal

Each main family branch is kept together, but descendants are grouped by generation.
Direct children appear before grandchildren, grandchildren appear before great-grandchildren, and so on.

Example:

```text
1
11
12
13
14
15
111
112
113
121
122
2
21
22
211
```

This keeps family `1` together, while showing all second-digit records before third-digit records.

## Why Plain Global Sorting Is Not Used

A plain global code sort would mix or flatten records without respecting the root traversal and fallback rules:

```text
0
1
11
111
12
121
```

That is not correct for this directory because each root family must be processed as its own branch, with code `0` first and unlinked fallback records protected.

## Sorting

Children are sorted using numeric-aware code sorting:

```ts
primaryCode.localeCompare(otherPrimaryCode, undefined, { numeric: true })
```

This keeps codes like `2`, `10`, and `11` in natural numeric order instead of plain string order.

For slash/inter-family codes, the left side of the slash is used as the primary sort key:

```text
7
71
72/44
73
74
```

In this example, `72/44` aligns with the `7` family branch and sorts as `72`.

## Fallback Records

After the hierarchy traversal finishes, any records not visited are appended at the end.

This protects records that are not connected to roots `1` through `7`, or records with unusual/inter-family codes, from disappearing.
