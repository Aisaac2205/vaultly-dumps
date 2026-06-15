/**
 * Generic wrapper for paginated API responses.
 *
 * Shape contract: `{ data: T[], total: number, page: number, pageSize: number }`
 * This must match the frontend's `Pagination` compound type (PR 2b).
 */
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }
}
