import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface OCRResponse {
  text: string;
  confidence: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    is_taxable: boolean;
  }>;
}

export interface AllocationRequest {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    is_taxable: boolean;
  }>;
  people: Array<{
    id: string;
    name: string;
  }>;
  rules: Array<{
    id: string;
    rule: string;
    person_id: string;
    item_name?: string;
    quantity?: number;
    type: string;
  }>;
  tax_rate: number;
  tip_rate: number;
  grand_total: number;
}

export interface AllocationResponse {
  allocations: Array<{
    person_id: string;
    person_name: string;
    items: Array<{
      item_id: string;
      item_name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    subtotal: number;
    tax_share: number;
    tip_share: number;
    total: number;
  }>;
  total_calculated: number;
  total_expected: number;
  difference: number;
}

export const apiService = {
  // Health check
  health: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // OCR endpoints
  ocr: {
    extract: async (file: File): Promise<OCRResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Debug: Log the FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const response = await api.post('/api/ocr/extract', formData, {
        headers: {
          // Ensure no Content-Type is set for FormData
        },
        timeout: 30000, // 30 second timeout for OCR processing
      });
      return response.data;
    },

    health: async () => {
      const response = await api.get('/api/ocr/health');
      return response.data;
    },
  },

  // Allocation endpoints
  allocation: {
    calculate: async (request: AllocationRequest): Promise<AllocationResponse> => {
      const response = await api.post('/api/allocation/calculate', request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },

    parseRules: async (rules: string[], people: string[]) => {
      const response = await api.post('/api/allocation/parse-rules', {
        rules,
        people,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
  },
};

export default api;
