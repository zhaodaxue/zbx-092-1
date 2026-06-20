export const tokenize = (text: string): Set<string> => {
  const cleaned = text
    .replace(/[，。！？、；：""''（）\[\]【】\s]+/g, ' ')
    .trim()
    .toLowerCase();
  
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
  return new Set(tokens);
};

export const calculateSimilarity = (text1: string, text2: string): number => {
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);
  
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

export const checkDisputeThreshold = (rejections: Array<{ reason: string }>): { shouldDispute: boolean; similarity: number } => {
  if (rejections.length < 2) {
    return { shouldDispute: false, similarity: 0 };
  }
  
  const latestTwo = rejections.slice(-2);
  const similarity = calculateSimilarity(latestTwo[0].reason, latestTwo[1].reason);
  
  return {
    shouldDispute: similarity > 0.5,
    similarity: Math.round(similarity * 100) / 100,
  };
};
