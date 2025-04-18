/**
 * Simple run-length encoding for text compression
 * Format: When a character repeats, it's encoded as {count}{char}
 * Non-repeating characters are preserved as-is
 */
export function compressText(text: string): string {
  if (!text) return ""

  let compressed = ""
  let count = 1

  for (let i = 0; i < text.length; i++) {
    // If current character matches the next one, increment count
    if (i + 1 < text.length && text[i] === text[i + 1]) {
      count++
    } else {
      // If count is greater than 3, use run-length encoding
      // (only compress if we save space - 3 or more repetitions)
      if (count >= 3) {
        compressed += `${count}${text[i]}`
      } else {
        // Otherwise, just add the character repeated the correct number of times
        compressed += text[i].repeat(count)
      }
      count = 1
    }
  }

  return compressed
}

/**
 * Decompresses text that was compressed with the run-length encoding algorithm
 */
export function decompressText(compressed: string): string {
  if (!compressed) return ""

  let decompressed = ""
  let i = 0

  while (i < compressed.length) {
    // Check if the current character is a digit
    if (/\d/.test(compressed[i])) {
      // Find the complete number (could be multiple digits)
      let countStr = ""
      while (i < compressed.length && /\d/.test(compressed[i])) {
        countStr += compressed[i]
        i++
      }

      // Get the character to repeat
      if (i < compressed.length) {
        const char = compressed[i]
        const count = Number.parseInt(countStr, 10)
        decompressed += char.repeat(count)
        i++
      }
    } else {
      // If not a digit, just add the character
      decompressed += compressed[i]
      i++
    }
  }

  return decompressed
}

/**
 * Advanced compression with dictionary-based encoding
 * This is a new feature that implements a simple LZW-inspired compression
 */
export function advancedCompressText(text: string): string {
  if (!text || text.length < 10) {
    // Fall back to simple compression for very short texts
    return compressText(text)
  }

  // First pass: find common patterns (at least 3 chars long)
  const patterns: Record<string, number> = {}
  const minPatternLength = 3

  for (let i = 0; i < text.length - minPatternLength; i++) {
    for (let j = minPatternLength; j <= 10 && i + j <= text.length; j++) {
      const pattern = text.substring(i, i + j)
      patterns[pattern] = (patterns[pattern] || 0) + 1
    }
  }

  // Select top patterns that appear at least 3 times
  const usefulPatterns = Object.entries(patterns)
    .filter(([pattern, count]) => count >= 3 && pattern.length * count > pattern.length + 2)
    .sort((a, b) => b[1] * b[0].length - a[1] * a[0].length)
    .slice(0, 20)
    .map(([pattern]) => pattern)

  if (usefulPatterns.length === 0) {
    // If no useful patterns found, fall back to simple compression
    return compressText(text)
  }

  // Create a dictionary with special markers
  // We'll use ASCII control characters that are unlikely to appear in text files
  const dictionary: Record<string, string> = {}
  const markers: string[] = []

  // Generate markers from ASCII control characters (1-31)
  for (let i = 1; i <= 31; i++) {
    if (i !== 10 && i !== 13) {
      // Skip newline and carriage return
      markers.push(String.fromCharCode(i))
    }
  }

  // Assign markers to patterns
  for (let i = 0; i < Math.min(usefulPatterns.length, markers.length); i++) {
    dictionary[usefulPatterns[i]] = markers[i]
  }

  // Replace patterns with markers
  let compressed = text
  for (const [pattern, marker] of Object.entries(dictionary)) {
    compressed = compressed.split(pattern).join(marker)
  }

  // Add dictionary at the beginning
  // Format: <marker><length><pattern>
  let header = ""
  for (const [pattern, marker] of Object.entries(dictionary)) {
    header += marker + pattern.length.toString() + pattern
  }

  // Add separator between dictionary and content
  const separator = String.fromCharCode(31) // Unit separator
  return header + separator + compressed
}

/**
 * Decompress text that was compressed with the advanced algorithm
 */
export function advancedDecompressText(compressed: string): string {
  // Check if this is advanced compressed format
  const separator = String.fromCharCode(31) // Unit separator

  if (!compressed.includes(separator)) {
    // If no separator found, assume it's simple compression
    return decompressText(compressed)
  }

  // Split header and content
  const [header, content] = compressed.split(separator)

  // Parse dictionary
  const dictionary: Record<string, string> = {}
  let i = 0

  while (i < header.length) {
    const marker = header[i++]

    // Parse pattern length
    let lengthStr = ""
    while (i < header.length && /\d/.test(header[i])) {
      lengthStr += header[i++]
    }

    if (lengthStr) {
      const length = Number.parseInt(lengthStr, 10)
      const pattern = header.substring(i, i + length)
      dictionary[marker] = pattern
      i += length
    }
  }

  // Replace markers with patterns
  let decompressed = content
  for (const [marker, pattern] of Object.entries(dictionary)) {
    decompressed = decompressed.split(marker).join(pattern)
  }

  return decompressed
}
