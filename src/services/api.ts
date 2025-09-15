const BASE_URL = 'https://script.google.com/macros/s/AKfycbyntLYWPYjVJ5YQLUFGd9PsJGWTalk38lVRAh3NrwHImaILEjx8SZDkm5pj_m78qC7vaA/exec';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface OptionData {
  'Type (Order/Donation)': string;
  Category: string;
  Department: string;
  'From Department': string;
  'To Department': string;
  'Personal Account Details': string;
}

export interface ExpenseData {
  Items: string;
  Details: string;
  Budget: string;
  Spent: string;
  Incharge: string;
}

export interface DonorData {
  'Donor ID': string;
  'Donor Name': string;
  Address: string;
  'PAN No.': string;
  'Mobile No.': string;
  'Mobile No': string; // Alternative column name without period
}

export interface BookingData {
  id: string;
  date: string;
  fromDepartment: string;
  toDepartment: string;
  personalAccount: string;
  donorDetails: string;
  category: string;
  item: string;
  detail: string;
  particulars: string;
  amount: number;
}

class ApiService {
  private async makeRequest<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getOptions(): Promise<ApiResponse<OptionData[]>> {
    return this.makeRequest<OptionData[]>(`${BASE_URL}?action=getOptions`);
  }

  async getExpenses(): Promise<ApiResponse<ExpenseData[]>> {
    return this.makeRequest<ExpenseData[]>(`${BASE_URL}?action=getExpenses`);
  }

  async getDonors(): Promise<ApiResponse<DonorData[]>> {
    return this.makeRequest<DonorData[]>(`${BASE_URL}?action=getDonors`);
  }

  async saveBooking(bookingData: BookingData): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveBooking',
        ...bookingData
      }),
    });
  }
}

export const apiService = new ApiService();