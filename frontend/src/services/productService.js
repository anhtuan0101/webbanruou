import api from './api';

// Product Service with enhanced features
class ProductService {
  // Get all products with filtering, sorting, and pagination
  async getAllProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);
      const url = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      // Đảm bảo luôn trả về object có products là mảng
      let products = [];
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (Array.isArray(response.data.products)) {
        products = response.data.products;
      }

  // Normalize product objects to ensure frontend gets consistent fields
      // Some backends/admin panels return sub-category under different names
      // (type, sub_category, subcategory, sub_category_name, subcategory_name, type_label, ...).
      // Map common variants into `type` and `sub_category_name` so filtering and display work.
      products = products.map((p) => {
        const prod = { ...p };

        // Candidates for a human-friendly sub-category name
        const nameCandidates = [
          prod.sub_category_name,
          prod.subcategory_name,
          prod.sub_category,
          prod.subcategory,
          prod.type_label,
          prod.sub_category_label,
          prod.type
        ].filter(Boolean);

        if (nameCandidates.length > 0) {
          prod.sub_category_name = String(nameCandidates[0]);
        }

        // Ensure `type` exists (used by some filters). Prefer existing `type`, then sub_category_name, then sub_category_id
        if (!prod.type) {
          if (prod.sub_category_name) prod.type = String(prod.sub_category_name);
          else if (prod.sub_category_id !== undefined && prod.sub_category_id !== null) prod.type = String(prod.sub_category_id);
        }

        return prod;
      });

      // Apply any client-side overrides (temporary workaround) stored in localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem('productSubCategoryOverrides');
          const overrides = raw ? JSON.parse(raw) : {};
          products = products.map(prod => {
            const id = prod.product_id || prod.id || prod.productId || String(prod.product_id || prod.id || '') ;
            if (!id) return prod;
            const ov = overrides[String(id)];
            if (ov) {
              return { ...prod, ...ov };
            }
            return prod;
          });
        }
      } catch (err) {
        // ignore localStorage issues
        console.debug('[productService] local override merge failed', err);
      }
      return {
        products,
        pagination: response.data.pagination || null,
        total: products.length
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get single product by ID
  async getProductById(id) {
    try {
      const response = await api.get(`/products/${id}`);
      // Normalize single product shape similar to getAllProducts mapping
      const data = response.data;
      const prod = { ...data };

      const nameCandidates = [
        prod.sub_category_name,
        prod.subcategory_name,
        prod.sub_category,
        prod.subcategory,
        prod.type_label,
        prod.sub_category_label,
        prod.type
      ].filter(Boolean);

      if (nameCandidates.length > 0) {
        prod.sub_category_name = String(nameCandidates[0]);
      }

      if (!prod.type) {
        if (prod.sub_category_name) prod.type = String(prod.sub_category_name);
        else if (prod.sub_category_id !== undefined && prod.sub_category_id !== null) prod.type = String(prod.sub_category_id);
      }

      // Merge client-side override if present
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem('productSubCategoryOverrides');
          const overrides = raw ? JSON.parse(raw) : {};
          const key = String(prod.product_id || prod.id || prod.productId || '');
          if (key && overrides[key]) {
            return { ...prod, ...overrides[key] };
          }
        }
      } catch (err) {
        console.debug('[productService] local override fetch failed', err);
      }

      return prod;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  // Search products with advanced options
  async searchProducts(query, options = {}) {
    try {
      const params = {
        search: query,
        ...options
      };
      
      return await this.getAllProducts(params);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get products by category
  async getProductsByCategory(categoryId, options = {}) {
    try {
      const params = {
        category: categoryId,
        ...options
      };
      
      return await this.getAllProducts(params);
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw error;
    }
  }

  // Get featured/popular products
  async getFeaturedProducts(limit = 8) {
    try {
      const response = await api.get(`/products/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      // Fallback to regular products if featured endpoint doesn't exist
      console.log('Featured products not available, using regular products');
      const result = await this.getAllProducts({ limit, sortBy: 'created_at', sortOrder: 'desc' });
      return result.products;
    }
  }

  // Get product categories
  async getCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get related products
  async getRelatedProducts(productId, limit = 4) {
    try {
      const response = await api.get(`/products/${productId}/related?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.log('Related products endpoint not available, using category-based fallback');
      // Fallback: get product and find others in same category
      try {
        const product = await this.getProductById(productId);
        if (product.category_id) {
          const result = await this.getProductsByCategory(product.category_id, { limit: limit + 1 });
          return result.products.filter(p => p.product_id !== parseInt(productId)).slice(0, limit);
        }
      } catch (fallbackError) {
        console.error('Fallback related products failed:', fallbackError);
      }
      return [];
    }
  }

  // Admin functions
  async createProduct(productData) {
    try {
      console.debug('[productService] createProduct payload:', productData);
      const response = await api.post('/products', productData);
      console.debug('[productService] createProduct response:', response && response.data);

      // If server didn't persist sub-category fields, store a temporary client-side override
      try {
        const resp = response && response.data ? response.data : {};
        const createdId = resp.product_id || resp.id || (resp.product && (resp.product.product_id || resp.product.id)) || null;
        const savedSub = resp.sub_category_name || resp.subcategory_name || resp.sub_category || resp.subcategory || (resp.product && (resp.product.sub_category_name || resp.product.sub_category));
        if (createdId && productData && productData.sub_category_name && !savedSub) {
          // write override
          if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('productSubCategoryOverrides');
            const overrides = raw ? JSON.parse(raw) : {};
            overrides[String(createdId)] = {
              sub_category_name: productData.sub_category_name,
              type: productData.type || String(productData.sub_category_name || '')
            };
            window.localStorage.setItem('productSubCategoryOverrides', JSON.stringify(overrides));
            console.debug('[productService] wrote local override for product', createdId);
          }
        }
      } catch (err) {
        console.debug('[productService] createProduct override write failed', err);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      console.debug('[productService] updateProduct id, payload:', id, productData);
      const response = await api.put(`/products/${id}`, productData);
      console.debug('[productService] updateProduct response:', response && response.data);

      // If server didn't persist sub-category fields, store/update a temporary client-side override
      try {
        const resp = response && response.data ? response.data : {};
        const savedSub = resp.sub_category_name || resp.subcategory_name || resp.sub_category || resp.subcategory || (resp.product && (resp.product.sub_category_name || resp.product.sub_category));
        const targetId = id || resp.product_id || resp.id || (resp.product && (resp.product.product_id || resp.product.id));
        if (targetId && productData && productData.sub_category_name && !savedSub) {
          if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('productSubCategoryOverrides');
            const overrides = raw ? JSON.parse(raw) : {};
            overrides[String(targetId)] = {
              sub_category_name: productData.sub_category_name,
              type: productData.type || String(productData.sub_category_name || '')
            };
            window.localStorage.setItem('productSubCategoryOverrides', JSON.stringify(overrides));
            console.debug('[productService] wrote local override for product (update)', targetId);
          }
        } else if (targetId && savedSub) {
          // server saved it, remove any existing override
          if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('productSubCategoryOverrides');
            const overrides = raw ? JSON.parse(raw) : {};
            if (overrides[String(targetId)]) {
              delete overrides[String(targetId)];
              window.localStorage.setItem('productSubCategoryOverrides', JSON.stringify(overrides));
              console.debug('[productService] removed local override for product (server saved)', targetId);
            }
          }
        }
      } catch (err) {
        console.debug('[productService] updateProduct override write failed', err);
      }

      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  // Upload product image
  async uploadProductImage(productId, imageFile, onUploadProgress) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/products/${productId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress,
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading image for product ${productId}:`, error);
      throw error;
    }
  }

  // Get product statistics
  async getProductStats() {
    try {
      const response = await api.get('/products/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats:', error);
      // Return fallback stats
      return {
        total: 0,
        inStock: 0,
        lowStock: 0,
        categories: 0
      };
    }
  }

  // Update product stock
  async updateStock(productId, quantity) {
    try {
      const response = await api.patch(`/products/${productId}/stock`, { quantity });
      return response.data;
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchUpdateProducts(updates) {
    try {
      const response = await api.patch('/products/batch', { updates });
      return response.data;
    } catch (error) {
      console.error('Error batch updating products:', error);
      throw error;
    }
  }

  async batchDeleteProducts(productIds) {
    try {
      const response = await api.delete('/products/batch', { data: { ids: productIds } });
      return response.data;
    } catch (error) {
      console.error('Error batch deleting products:', error);
      throw error;
    }
  }
}

// Create singleton instance
const productService = new ProductService();

// Export individual methods for backward compatibility
export const getAllProducts = (params) => productService.getAllProducts(params);
export const getProductById = (id) => productService.getProductById(id);
export const searchProducts = (query, options) => productService.searchProducts(query, options);
export const getProductsByCategory = (categoryId, options) => productService.getProductsByCategory(categoryId, options);
export const getFeaturedProducts = (limit) => productService.getFeaturedProducts(limit);
export const getCategories = () => productService.getCategories();
export const getRelatedProducts = (productId, limit) => productService.getRelatedProducts(productId, limit);
export const createProduct = (data) => productService.createProduct(data);
export const updateProduct = (id, data) => productService.updateProduct(id, data);
export const deleteProduct = (id) => productService.deleteProduct(id);
export const uploadProductImage = (productId, imageFile, onProgress) => productService.uploadProductImage(productId, imageFile, onProgress);
export const getProductStats = () => productService.getProductStats();
export const updateStock = (productId, quantity) => productService.updateStock(productId, quantity);
export const batchUpdateProducts = (updates) => productService.batchUpdateProducts(updates);
export const batchDeleteProducts = (ids) => productService.batchDeleteProducts(ids);

// Export service instance
export default productService;
