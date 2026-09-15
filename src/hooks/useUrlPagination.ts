import { useCallback, useEffect, useState } from 'react';

export const PAGE_SIZE = 10;

const readPageFromUrl = (queryKey: string): number => {
  const page = Number.parseInt(new URLSearchParams(window.location.search).get(queryKey) || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export const useUrlPagination = (totalItems: number, queryKey = 'page') => {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(() => readPageFromUrl(queryKey));

  useEffect(() => {
    const handlePopState = () => setCurrentPage(readPageFromUrl(queryKey));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [queryKey]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      const url = new URL(window.location.href);
      url.searchParams.set(queryKey, String(totalPages));
      window.history.replaceState({}, '', url);
    }
  }, [currentPage, totalPages, queryKey]);

  const goToPage = useCallback((page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const url = new URL(window.location.href);
    url.searchParams.set(queryKey, String(nextPage));
    window.history.pushState({}, '', url);
    setCurrentPage(nextPage);
  }, [queryKey, totalPages]);

  return {
    currentPage,
    totalPages,
    pageStart: (currentPage - 1) * PAGE_SIZE,
    pageEnd: currentPage * PAGE_SIZE,
    goToPage,
  };
};
