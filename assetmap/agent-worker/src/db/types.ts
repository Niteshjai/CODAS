import type { QueryResult, QueryResultRow } from 'pg'

/** Anything that can run a query: the Pool or a checked-out client. */
export interface Queryable {
  query<R extends QueryResultRow = any>(text: string, values?: unknown[]): Promise<QueryResult<R>>
}
