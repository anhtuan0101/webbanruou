// frontend/src/hooks/usePagination.js
import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for pagination logic
 * @param {Array} data - Array of data to paginate
 * @param {number} itemsPerPage - Number of items per page
 */
const usePagination = (data, itemsPerPage = 10, initialPage = 1) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil((data?.length || 0) / itemsPerPage);
  }, [data, itemsPerPage]);

  // Get current page data
  const currentData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = data?.length || 0;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalItems,
      startItem,
      endItem,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1
    };
  }, [data, currentPage, itemsPerPage, totalPages]);

  // Navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Reset to first page when data changes
  // useCallback keeps the same function identity between renders so
  // components/effects that depend on it don't get unnecessary re-runs
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentData,
    currentPage,
    totalPages,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage,
    resetPagination
  };
};

export { usePagination };
export default usePagination;