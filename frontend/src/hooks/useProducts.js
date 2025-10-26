// frontend/src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { getAllProducts } from '../services/productService';
import useApi from './useApi';
import useDebounce from './useDebounce';
import usePagination from './usePagination';

/**
 * Custom hook for managing products with search, filter, and pagination
 */
const useProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'created_at'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch products from API
  const {
    data: apiData,
    loading,
    error,
    refetch
  } = useApi(getAllProducts, [], {
    immediate: true,
    onError: (error) => {
      console.error('Error fetching products:', error);
    }
  });

  // Extract products array from API response
  const allProducts = apiData?.products || [];

  // Filter and sort products
  const filteredProducts = useCallback(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    
    let filtered = [...allProducts];

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.category_id === parseInt(categoryFilter)
      );
    }

    // Apply type filter (e.g., 'vieng', 'sinh-nhat', 'ke-chuc-mung')
    if (typeFilter) {
      filtered = filtered.filter(product => String(product.type || '').toLowerCase() === String(typeFilter).toLowerCase());
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === 'price') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allProducts, debouncedSearchTerm, categoryFilter, typeFilter, sortBy, sortOrder]);

  const processedProducts = filteredProducts();

  // Use pagination hook
  const {
    currentData: paginatedProducts,
    currentPage,
    totalPages,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage,
    resetPagination
  } = usePagination(processedProducts, 12); // 12 products per page

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [debouncedSearchTerm, categoryFilter, typeFilter, sortBy, sortOrder, resetPagination]);

  // Search and filter functions
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (categoryId) => {
    setCategoryFilter(categoryId);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
  };

  const handleSort = (field, order = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  return {
    // Data
    products: paginatedProducts,
    allProducts,
    filteredCount: processedProducts.length,
    totalCount: allProducts?.length || 0,
    
    // Loading & Error
    loading,
    error,
    refetch,
    
    // Search & Filter
    searchTerm,
    categoryFilter,
  typeFilter,
    sortBy,
    sortOrder,
    handleSearch,
    handleCategoryFilter,
  handleTypeFilter,
    handleSort,
    clearFilters,
    
    // Pagination
    currentPage,
    totalPages,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage
    ,
    resetPagination
  };
};

export { useProducts };
export default useProducts;