export interface PaginatedResponse<T> {
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
  items: T[];
}
