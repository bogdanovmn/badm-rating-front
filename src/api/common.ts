import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';


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

// Универсальная функция для выполнения API-запросов
export const makeApiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  params?: Record<string, unknown>
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api({ method, url, params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};