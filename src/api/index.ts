export { apiRequest } from './client';
export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from './authToken';
export { authApi, OTP_LENGTH } from './auth.api';
export { ordersApi, fromOrderDocument, toDayUnix } from './orders.api';
export { locationApi } from './location.api';
export {
  connectSocket,
  disconnectSocket,
  driverNotificationEvent,
  emitDriverLocation,
  forgetOrderRoom,
  joinOrderRoom,
  onDriverNotification,
  onOrderUpdate,
} from './socket';
export {
  ApiError,
  NetworkError,
  TimeoutError,
  toApiError,
} from './errors';
export type { ApiErrorCode } from './errors';
export type {
  UserRole,
  AuthUser,
  SignInRequest,
  SignInResponse,
  RefreshRequest,
  RefreshResponse,
  ForgotPasswordResponse,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LogoutRequest,
  LogoutResponse,
} from './auth.api';
export type {
  ApiOrder,
  ApiOrderStatus,
  OrdersListResponse,
  OrdersPagination,
  ListOrdersParams,
  Decimal128Json,
  OrderDocument,
  OrderDocumentStatus,
  OrderParty,
  OrderPlace,
  OrderHistoryRequest,
  OrderHistoryResponse,
  UpdateOrderStatusRequest,
  CreateOrderRequest,
} from './orders.api';
export type {
  DriverDeliveryState,
  DriverLocationUpdate,
  DriverNotification,
  DriverNotificationType,
} from './socket';
export type {
  ReportLocationRequest,
  ReportLocationResponse,
} from './location.api';
