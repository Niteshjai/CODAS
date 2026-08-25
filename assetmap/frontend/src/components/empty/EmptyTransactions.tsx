import { EmptyState } from './EmptyState'

export function EmptyTransactions() {
  return (
    <EmptyState
      icon="💳"
      title="No transactions yet"
      description="We couldn't find any recent transactions for this account."
    />
  )
}
