/**
 * QR Code Data Placement
 *
 * Handles placement of data bits in the QR code matrix using the zigzag pattern
 * specified in the QR code specification. Data is placed in two-column groups,
 * moving upward and downward alternately, avoiding function pattern areas.
 */

/**
 * Place data bits in the matrix using zigzag pattern per QR specification
 *
 * The zigzag pattern works as follows:
 * - Process matrix in 2-column groups from right to left (skip column 6 for timing)
 * - Within each group, place bits right-to-left
 * - Direction alternates: up, down, up, down...
 * - Skip modules reserved for function patterns
 *
 * @param matrix QR code matrix to modify (data will be placed here)
 * @param functionPattern Function pattern matrix (true = reserved, don't place data)
 * @param bitStream Complete bit stream to place (data + error correction + remainder bits)
 */
export function placeDataBits(
  matrix: boolean[][],
  functionPattern: boolean[][],
  bitStream: boolean[]
): void {
  const size = matrix.length;
  let bitIndex = 0;
  let inc = -1; // Start going up
  let row = size - 1; // Start from bottom

  // Place data in zigzag pattern (right to left, alternating up/down)
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip timing column

    while (true) {
      // Process 2-column group (right column first, then left)
      for (let c = 0; c < 2; c++) {
        if (!functionPattern[row][col - c]) {
          // Place next bit from stream, or false if stream exhausted
          const dark =
            bitIndex < bitStream.length ? bitStream[bitIndex] : false;
          matrix[row][col - c] = dark;
          bitIndex++;
        }
      }

      row += inc;

      // Check if we've reached the top or bottom
      if (row < 0 || size <= row) {
        row -= inc; // Step back
        inc = -inc; // Reverse direction
        break;
      }
    }
  }
}
