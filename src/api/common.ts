import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import { AuthHttpClient, SsoService } from '@bogdanovmn/ssofw';


export interface ApiError {
  message: string;
  status: number;
}

// Обработчик ошибок API
const handleApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<{ status: number; error: string }>;
  const responseError = axiosError.response?.data;

  return {
    message: responseError?.error || 'Неизвестная ошибка API',
    status: responseError?.status || axiosError.response?.status || 500,
  };
};

// Конфигурация Axios
const apiUrl = import.meta.env.VITE_API_URL;
console.log('API URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
});

export const authApi = new AuthHttpClient(
  apiUrl,
  new SsoService(import.meta.env.VITE_SSO_SERVICE_URL)
)

export const makeApiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  params: Record<string, unknown> = {}
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api({
      method,
      url,
      ...(method === 'get' || method === 'delete' 
        ? { params } 
        : { data: params }
      )
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};