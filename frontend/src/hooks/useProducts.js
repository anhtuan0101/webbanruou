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

  // debug: print a small sample of products returned from API (useful to check 'type' field)
  useEffect(() => {
    if (allProducts && allProducts.length) {
      try {
        const sample = allProducts.slice(0, 10).map(p => ({ id: p.product_id, name: p.name, category_id: p.category_id, type: p.type }));
        console.debug('[useProducts] API products sample:', sample);
        // show distinct types present in the sample
        const types = Array.from(new Set(allProducts.map(p => (p.type || '').toString().toLowerCase()).filter(Boolean)));
        console.debug('[useProducts] distinct types (sample):', types.slice(0, 20));
      } catch (err) {
        console.debug('[useProducts] debug sample failed', err);
      }
    }
  }, [allProducts]);

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
      const catNum = Number(categoryFilter);
      filtered = filtered.filter(product => {
        // product.category_id may come as string or number from API
        return Number(product.category_id) === catNum;
      });
    }

    // Apply type / sub-category filter
    // Some APIs may return the sub-category under different property names
    // (e.g. `type`, `sub_category`, `sub_category_name`, `subcategory_name`, `type_label`, ...).
    // Check multiple candidate fields to make the filter resilient to backend naming.
    if (typeFilter) {
      const tf = String(typeFilter || '').toLowerCase();
      filtered = filtered.filter(product => {
        const candidates = [
          product.type,
          product.sub_category,
          product.subcategory,
          product.sub_category_name,
          product.subcategory_name,
          product.type_label,
          product.sub_category_label
        ]
          .filter(Boolean)
          .map(c => String(c).toLowerCase());

        // direct exact match against any candidate field
        if (candidates.includes(tf)) return true;

        // sometimes the API stores an id (number) for sub-category; compare as string
        if (String(product.sub_category_id || '').toLowerCase() === tf) return true;

        // fallback: try matching against the product name (handled also by ProductList fuzzy fallback)
        return false;
      });
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

  // debug: log filter state and resulting count to help diagnose filtering issues
  useEffect(() => {
    try {
      console.debug('[useProducts] filters -> categoryFilter:', categoryFilter, 'typeFilter:', typeFilter, 'searchTerm:', debouncedSearchTerm);
      console.debug('[useProducts] processedProducts count:', processedProducts.length);
    } catch (err) {
      console.debug('[useProducts] filter debug error', err);
    }
  }, [categoryFilter, typeFilter, debouncedSearchTerm, processedProducts.length]);

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