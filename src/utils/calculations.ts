import { Customer, CustomerFinancialSummary, Deal } from '../types';

export function calculateCustomerSummary(customer: Customer, deals: Deal[]): CustomerFinancialSummary {
  const customerDeals = deals.filter((d) => d.customerId === customer.id);
  
  // Valid active/completed deals
  const confirmedDeals = customerDeals.filter((d) => 
    d.status === 'active_due' || 
    d.status === 'partially_paid' ||
    d.status === 'fundify_verification_pending' ||
    d.status === 'completed'
  );

  const currentDue = customerDeals
    .filter((d) => d.status === 'active_due' || d.status === 'partially_paid' || d.status === 'fundify_verification_pending')
    .reduce((sum, d) => sum + (d.dueAmount || 0), 0);

  const lifetimeValue = confirmedDeals.reduce((sum, d) => sum + (d.expectedBdtAmount || 0), 0);
  const totalDollarsPurchased = confirmedDeals.reduce((sum, d) => sum + (d.dollarAmount || 0), 0);
  const totalAmountPaid = customerDeals.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
  
  const totalDealsCount = customerDeals.length;
  const activeDealsCount = customerDeals.filter(
    (d) => d.status === 'active_due' || d.status === 'partially_paid' || d.status === 'fundify_verification_pending' || d.status === 'awaiting_confirmation'
  ).length;
  const completedDealsCount = customerDeals.filter((d) => d.status === 'completed').length;
  const disputedDealsCount = customerDeals.filter((d) => d.status === 'disputed').length;

  const averageDealSizeUsd = confirmedDeals.length > 0
    ? Math.round(totalDollarsPurchased / confirmedDeals.length)
    : 0;

  const largestDealUsd = confirmedDeals.length > 0
    ? Math.max(...confirmedDeals.map((d) => d.dollarAmount))
    : 0;

  // Find latest activity date
  let latestDate = customer.createdAt;
  customerDeals.forEach((d) => {
    if (d.createdAt > latestDate) latestDate = d.createdAt;
    d.timeline.forEach((t) => {
      if (t.timestamp > latestDate) latestDate = t.timestamp;
    });
  });

  // Calculate oldest unpaid active deal days
  const activeDeals = customerDeals.filter((d) => (d.status === 'active_due' || d.status === 'partially_paid' || d.status === 'fundify_verification_pending') && d.confirmedAt);
  let oldestUnpaidDealDays = 0;
  if (activeDeals.length > 0) {
    const oldestConfirmedDate = Math.min(...activeDeals.map((d) => new Date(d.confirmedAt || d.createdAt).getTime()));
    oldestUnpaidDealDays = Math.floor((Date.now() - oldestConfirmedDate) / (1000 * 60 * 60 * 24));
  }

  // Payment behavior
  let paymentBehavior: CustomerFinancialSummary['paymentBehavior'] = 'New Customer';
  if (totalDealsCount === 0) {
    paymentBehavior = 'New Customer';
  } else if (oldestUnpaidDealDays >= 7) {
    paymentBehavior = 'Has Overdue Dues';
  } else if (completedDealsCount >= 2 && currentDue === 0) {
    paymentBehavior = 'Prompt & Reliable';
  } else {
    paymentBehavior = 'Moderate';
  }

  return {
    currentDue,
    lifetimeValue,
    totalDollarsPurchased,
    totalAmountPaid,
    totalDealsCount,
    activeDealsCount,
    completedDealsCount,
    disputedDealsCount,
    averageDealSizeUsd,
    largestDealUsd,
    lastActivityDate: latestDate,
    paymentBehavior,
    oldestUnpaidDealDays,
  };
}

export function formatBdt(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatRate(rate: number): string {
  return `৳${rate.toFixed(2)}`;
}

export function formatOrdinalDate(value: string): string {
  const date = new Date(value);
  const day = date.getDate();
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? 'th'
      : day % 10 === 1
      ? 'st'
      : day % 10 === 2
      ? 'nd'
      : day % 10 === 3
      ? 'rd'
      : 'th';

  return `${day}${suffix} ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
}
