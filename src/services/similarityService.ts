const tokenizeChinese = (text: string): Set<string> => {
  const result = new Set<string>();
  const clean = text.replace(/[\s，。！？、；：""''（）\[\]【】,.!?;:\(\)\[\]"'`\-_~@#\$%\^&\*\+=<>\|\\\/]+/g, '');
  for (let i = 0; i < clean.length - 1; i++) {
    result.add(clean.substring(i, i + 2).toLowerCase());
  }
  if (clean.length === 1) {
    result.add(clean.toLowerCase());
  }
  return result;
};

const tokenizeWords = (text: string): Set<string> => {
  const cleaned = text
    .replace(/[，。！？、；：""''（）\[\]【】,.!?;:\(\)\[\]"'`\-_~@#\$%\^&\*\+=<>\|\\\/]+/g, ' ')
    .trim()
    .toLowerCase();

  const words = cleaned.split(/\s+/).filter(t => t.length > 0);
  const result = new Set<string>();
  words.forEach(w => result.add(w));
  return result;
};

export const tokenize = (text: string): Set<string> => {
  const chineseTokens = tokenizeChinese(text);
  const wordTokens = tokenizeWords(text);
  return new Set([...chineseTokens, ...wordTokens]);
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

export const checkDisputeThreshold = (
  rejections: Array<{ id: string; userId: string; reason: string }>
): { shouldDispute: boolean; similarity: number; rejectionIds?: [string, string]; isSecondRejection?: boolean } => {
  const uniqueUsers = Array.from(new Set(rejections.map(r => r.userId)));
  if (uniqueUsers.length < 2) {
    return { shouldDispute: false, similarity: 0 };
  }

  const userMap = new Map<string, typeof rejections>();
  rejections.forEach(r => {
    const arr = userMap.get(r.userId) || [];
    arr.push(r);
    userMap.set(r.userId, arr);
  });

  const firstUser = uniqueUsers[0];
  const secondUser = uniqueUsers[1];
  const rej1 = userMap.get(firstUser)!.slice(-1)[0];
  const rej2 = userMap.get(secondUser)!.slice(-1)[0];

  const similarity = calculateSimilarity(rej1.reason, rej2.reason);
  const isSecondRejection = 
    userMap.get(firstUser)!.length === 1 && 
    userMap.get(secondUser)!.length === 1;

  return {
    shouldDispute: similarity > 0.5,
    similarity: Math.round(similarity * 100) / 100,
    rejectionIds: [rej1.id, rej2.id],
    isSecondRejection,
  };
};
