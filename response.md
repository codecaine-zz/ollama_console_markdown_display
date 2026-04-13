# Bubble Sort in JavaScript

Bubble Sort is a simple sorting algorithm that repeatedly steps through a list, compares adjacent elements, and swaps them if they are in the wrong order. This process repeats until the list is sorted.

## Implementation

```javascript
function bubbleSort(arr) {
  const n = arr.length;
  let swapped;

  for (let i = 0; i < n - 1; i++) {
    swapped = false;

    // Last i elements are already in place
    for (let j = 0; j < n - i - 1; j++) {
      // Swap if element is greater than the next element
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }

    // If no two elements were swapped, the array is sorted
    if (!swapped) break;
  }

  return arr;
}
```

## How It Works

1. Iterate through the array multiple times.
2. On each pass, compare adjacent elements.
3. Swap elements if they're in the wrong order.
4. The largest element "bubbles" to the end after each iteration.
5. Include an early exit if no swaps occur (optimization).

## Usage Example

```javascript
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Original:", numbers);

const sorted = bubbleSort([...numbers]); // Copy to preserve original
console.log("Sorted:", sorted);
```

## Test Cases

```javascript
// Test with array of numbers
console.log(bubbleSort([5, 2, 9, 1, 5, 6])); // [1, 2, 5, 5, 6, 9]

// Test with already sorted array
console.log(bubbleSort([1, 2, 3, 4])); // [1, 2, 3, 4]

// Test with reverse sorted array
console.log(bubbleSort([4, 3, 2, 1])); // [1, 2, 3, 4]

// Test with array containing duplicates
console.log(bubbleSort([3, 1, 4, 1, 5, 9, 2, 6, 5])); // [1, 1, 2, 3, 4, 5, 5, 6, 9]

// Test with single element
console.log(bubbleSort([1])); // [1]

// Test with empty array
console.log(bubbleSort([])); // []

// Test with two elements
console.log(bubbleSort([2, 1])); // [1, 2]
```

## Time and Space Complexity

| Scenario        | Time Complexity | Space Complexity |
|-----------------|------------------|------------------|
| Best Case       | O(n)             | O(1)             |
| Average Case    | O(n²)            | O(1)             |
| Worst Case      | O(n²)            | O(1)             |

- **Best Case (O(n)):** Already sorted array with the early-exit optimization.
- **Average/Worst Case (O(n²)):** Requires multiple passes and comparisons.
- **Space Complexity (O(1)):** Sorting happens in-place.

## Important Notes

- 🔄 **In-place Sorting:** Modifies the original array unless you make a copy.
- 🧠 **Simple & Educational:** Great for learning sorting logic, but not ideal for large datasets.
- 🐢 **Performance:** For large arrays, consider more efficient algorithms like QuickSort or MergeSort.

This implementation is clean, efficient, and well-suited for educational or small-scale use cases.