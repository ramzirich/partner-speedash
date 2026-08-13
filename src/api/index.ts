export { apiRequest } from './client';
export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from './authToken';
export { authApi, OTP_LENGTH } from './auth.api';
export {
  ordersApi,
  zonesApi,
  fromOrderDocument,
  toDayUnix,
} from './orders.api';
export { customersApi } from './customers.api';
export { locationApi } from './location.api';
export {
  acquireSocket,
  connectSocket,
  disconnectSocket,
  driverNotificationEvent,
  emitDriverLocation,
  forgetOrderRoom,
  isSocketConnected,
  joinOrderRoom,
  onDriverNotification,
  onOrderUpdate,
  onSocketStatus,
  releaseSocket,
  resyncSocket,
} from './socket';
export { ApiError, NetworkError, TimeoutError, toApiError } from './errors';
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
  OrderStatusUpdate,
  CancelOrderRequest,
  CreateOrderDropoff,
  CreateOrderRequest,
  ZoneDocument,
} from './orders.api';
export type {
  AppSocket,
  ClientToServerEvents,
  DriverDeliveryState,
  DriverLocationUpdate,
  DriverNotification,
  DriverNotificationType,
  ServerToClientEvents,
} from './socket';
export type {
  ReportLocationRequest,
  ReportLocationResponse,
} from './location.api';
export type {
  ApiCustomerLocation,
  CustomerAddress,
  CustomerLookup,
  FindCustomerResponse,
} from './customers.api';
