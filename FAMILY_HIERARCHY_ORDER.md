# Family Hierarchy Ordering

This document explains how the Family Directory listing order is built from Firestore records.

## Desired Order

The root ancestor record with code `0` must always appear first:

```text
0
1
  11
  111
  112
  ...
2
  21
  211
  ...
3
...
7
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
6. For each root, visit all descendants depth-first.
7. Append any unvisited records at the end as fallback.

## Depth-First Traversal

Each family branch is walked fully before moving to the next root.

Example:

```text
1
  11
    111
    112
  12
2
  21
```

This keeps every family branch together.

## Why Breadth-First Is Not Used

A queue-based breadth-first traversal would list all siblings before descendants:

```text
1
2
3
11
12
21
22
```

That is not correct for this directory because the expected view is branch-by-branch hierarchy.

## Sorting

Children are sorted using numeric-aware code sorting:

```ts
a.code.localeCompare(b.code, undefined, { numeric: true })
```

This keeps codes like `2`, `10`, and `11` in natural numeric order instead of plain string order.

## Fallback Records

After the hierarchy traversal finishes, any records not visited are appended at the end.

This protects records that are not connected to roots `1` through `7`, or records with unusual/inter-family codes, from disappearing.
