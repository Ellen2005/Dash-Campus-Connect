export function isMockDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";
}

export function mergeWithMock<T>(realData: T[], mockData: T[]): T[] {
  if (!isMockDataEnabled()) return realData;
  return [...realData, ...mockData];
}
