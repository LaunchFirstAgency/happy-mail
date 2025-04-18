/**
 * Calculates the entropy (randomness) of a string
 * Higher values indicate more randomness
 */
export function calculateStringEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;

  const frequencies: { [char: string]: number } = {};

  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  return Object.values(frequencies).reduce((entropy, freq) => {
    const p = freq / len;
    return entropy - p * Math.log2(p);
  }, 0);
}
