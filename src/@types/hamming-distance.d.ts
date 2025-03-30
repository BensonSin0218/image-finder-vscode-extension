/**
 * Declaration file for the 'hamming-distance' module
 */

declare module 'hamming-distance' {
  /**
   * Calculates the Hamming distance between two strings of equal length
   * (number of positions at which corresponding characters are different)
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns The Hamming distance (number of different bits)
   */
  function hammingDistance(str1: string, str2: string): number;

  export default hammingDistance;
}
