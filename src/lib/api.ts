import type {
  AdminSession,
  BroadcastCampaign,
  BroadcastList,
  ClientOrder,
  ClientReview,
  ClientUser,
  DashboardStats,
  EventReminder,
  GallerySong,
  MemoryPage,
  NetworkOption,
  Order,
  Package,
  PaymentInfo,
  PromotionSettings,
  PublicOrderTracking,
} from '../types.js';

/**
 * Client API unique.
 *
 * `credentials: 'include'` est indispensable : la session d'administration
 * vit dans un cookie httpOnly, que JavaScript ne peut pas lire. Le
 * navigateur l'envoie automatiquement, et lui seul.
 */

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? `Erreur ${res.status} sur ${path}`;
    const err = new Error(message) as Error & { status?: number; details?: unknown };
    err.status = res.status;
    err.details = (data as { details?: unknown } | null)?.details;
    throw err;
  }
  return data as T;
}

const body = (payload: unknown): RequestInit => ({ body: JSON.stringify(payload) });

export const api = {
  /* ------------------------- Public ------------------------- */

  packages: () => request<Package[]>('/api/packages'),
  gallery: () => request<GallerySong[]>('/api/gallery'),
  reviews: () => request<ClientReview[]>('/api/reviews'),
  promotion: () => request<PromotionSettings>('/api/promotion'),
  memoryPage: (id: string) => request<MemoryPage>(`/api/memory-pages/${encodeURIComponent(id)}`),
  track: (key: string) => request<PublicOrderTracking>(`/api/track/${encodeURIComponent(key)}`),

  createReview: (payload: {
    rating: number;
    clientName: string;
    occasion: string;
    comment: string;
  }) => request<ClientReview>('/api/reviews', { method: 'POST', ...body(payload) }),

  createOrder: (payload: Record<string, unknown>) =>
    request<Order>('/api/orders', { method: 'POST', ...body(payload) }),

  /** Renvoie la vue publique : aucune donnée personnelle. */
  trackOrder: (key: string) =>
    request<PublicOrderTracking>(`/api/track/${encodeURIComponent(key)}`),

  stats: {
    visit: () => request<{ ok: boolean }>('/api/stats/visit', { method: 'POST' }),
    listen: () => request<{ ok: boolean }>('/api/stats/listen', { method: 'POST' }),
  },

  /* ------------------------ Paiement ------------------------ */

  networks: (country = 'CD') =>
    request<{ configured: boolean; networks: NetworkOption[] }>(
      `/api/payments/networks?country=${encodeURIComponent(country)}`,
    ),

  initPayment: (payload: {
    reference: string;
    method: 'checkout' | 'softpay';
    country?: string;
    network?: string;
    phone?: string;
  }) =>
    request<{ paymentId: string; status: string; checkoutUrl: string | null; amountLabel: string }>(
      '/api/payments/init',
      { method: 'POST', ...body(payload) },
    ),

  paymentStatus: (reference: string) =>
    request<{ status: string; verified: boolean }>(
      `/api/payments/${encodeURIComponent(reference)}/status`,
    ),

  /* ---------------------- Authentification ------------------ */

  login: (email: string, password: string) =>
    request<{ ok: true; admin: AdminSession }>('/api/auth/login', {
      method: 'POST',
      ...body({ email, password }),
    }),

  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ admin: AdminSession }>('/api/auth/me'),

  /* ---------------------- Compte client --------------------- */

  account: {
    register: (payload: { name: string; email: string; password: string; phone?: string }) =>
      request<{ ok: true; user: ClientUser }>('/api/account/register', {
        method: 'POST',
        ...body(payload),
      }),

    login: (email: string, password: string) =>
      request<{ ok: true; user: ClientUser }>('/api/account/login', {
        method: 'POST',
        ...body({ email, password }),
      }),

    logout: () => request<{ ok: true }>('/api/account/logout', { method: 'POST' }),

    me: () => request<{ user: ClientUser }>('/api/account/me'),

    update: (payload: {
      name?: string;
      phone?: string;
      city?: string;
      country?: string;
    }) =>
      request<{ user: ClientUser }>('/api/account/me', {
        method: 'PATCH',
        ...body(payload),
      }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: true }>('/api/account/password', {
        method: 'POST',
        ...body({ currentPassword, newPassword }),
      }),

    orders: () => request<ClientOrder[]>('/api/account/orders'),

    forgot: (email: string) =>
      request<{ ok: true }>('/api/account/forgot', { method: 'POST', ...body({ email }) }),

    reset: (token: string, password: string) =>
      request<{ ok: true }>('/api/account/reset', {
        method: 'POST',
        ...body({ token, password }),
      }),
  },

  /* ---------------------- Administration -------------------- */

  admin: {
    stats: () => request<DashboardStats & { totalRevenueLabel: string }>('/api/admin/stats'),

    orders: () => request<Order[]>('/api/orders'),
    orderDetail: (id: string) =>
      request<{ order: Order; payment: PaymentInfo | null }>(`/api/orders/${id}/detail`),
    updateOrder: (id: string, patch: Record<string, unknown>) =>
      request<Order>(`/api/orders/${id}`, { method: 'PUT', ...body(patch) }),
    deleteOrder: (id: string) =>
      request<{ success: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }),

    packages: () => request<Package[]>('/api/admin/packages'),
    updatePackage: (id: string, patch: Record<string, unknown>) =>
      request<Package>(`/api/admin/packages/${id}`, { method: 'PUT', ...body(patch) }),

    gallery: () => request<GallerySong[]>('/api/admin/gallery'),
    createSong: (payload: Record<string, unknown>) =>
      request<GallerySong>('/api/admin/gallery', { method: 'POST', ...body(payload) }),
    updateSong: (id: string, patch: Record<string, unknown>) =>
      request<GallerySong>(`/api/admin/gallery/${id}`, { method: 'PUT', ...body(patch) }),
    deleteSong: (id: string) =>
      request<{ success: boolean }>(`/api/admin/gallery/${id}`, { method: 'DELETE' }),

    allReviews: () => request<ClientReview[]>('/api/reviews?all=true'),
    updateReview: (id: string, patch: Record<string, unknown>) =>
      request<ClientReview>(`/api/admin/reviews/${id}`, { method: 'PUT', ...body(patch) }),
    deleteReview: (id: string) =>
      request<{ success: boolean }>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),

    memoryPages: () => request<MemoryPage[]>('/api/admin/memory-pages'),
    createMemoryPage: (payload: Record<string, unknown>) =>
      request<MemoryPage>('/api/admin/memory-pages', { method: 'POST', ...body(payload) }),
    generateMemoryPage: (orderId: string) =>
      request<{ success: boolean; id: string }>('/api/admin/memory-pages/generate', {
        method: 'POST',
        ...body({ orderId }),
      }),
    deleteMemoryPage: (id: string) =>
      request<{ success: boolean }>(`/api/admin/memory-pages/${id}`, { method: 'DELETE' }),

    updatePromotion: (payload: PromotionSettings) =>
      request<PromotionSettings>('/api/admin/promotion', { method: 'PUT', ...body(payload) }),

    reminders: () => request<EventReminder[]>('/api/admin/reminders'),
    createReminder: (payload: Record<string, unknown>) =>
      request<EventReminder>('/api/admin/reminders', { method: 'POST', ...body(payload) }),
    deleteReminder: (id: string) =>
      request<{ success: boolean }>(`/api/admin/reminders/${id}`, { method: 'DELETE' }),

    broadcastLists: () => request<BroadcastList[]>('/api/admin/broadcast/lists'),
    createBroadcastList: (payload: { name: string; description?: string }) =>
      request<BroadcastList>('/api/admin/broadcast/lists', { method: 'POST', ...body(payload) }),
    addContact: (listId: string, payload: { name: string; phone: string; category?: string }) =>
      request<unknown>(`/api/admin/broadcast/lists/${listId}/contacts`, {
        method: 'POST',
        ...body(payload),
      }),
    deleteBroadcastList: (id: string) =>
      request<{ success: boolean }>(`/api/admin/broadcast/lists/${id}`, { method: 'DELETE' }),

    campaigns: () => request<BroadcastCampaign[]>('/api/admin/broadcast/campaigns'),
    createCampaign: (payload: {
      title: string;
      messageTemplate: string;
      targetListId?: string;
    }) =>
      request<BroadcastCampaign>('/api/admin/broadcast/campaigns', {
        method: 'POST',
        ...body(payload),
      }),
    sendCampaign: (id: string) =>
      request<BroadcastCampaign>(`/api/admin/broadcast/campaigns/${id}/send`, { method: 'POST' }),

    sendWhatsapp: (phone: string, message: string) =>
      request<{ ok: boolean; reason?: string }>('/api/whatsapp/send', {
        method: 'POST',
        ...body({ phone, message }),
      }),
    whatsappStatus: () =>
      request<{
        configure: boolean;
        manquants: string[];
        url?: string;
        sessionId?: string;
        numeroAdmin: boolean;
        joignable: boolean | null;
        detail?: string;
      }>('/api/whatsapp/status'),
    testWhatsapp: (phone?: string) =>
      request<{ ok: boolean; reason?: string }>('/api/whatsapp/test', {
        method: 'POST',
        ...body(phone ? { phone } : {}),
      }),

    ai: (payload: Record<string, unknown>) =>
      request<{ text: string; degraded: boolean; error?: string }>('/api/admin/ai', {
        method: 'POST',
        ...body(payload),
      }),

    audit: () =>
      request<
        { id: string; adminEmail: string; action: string; entity: string; createdAt: string }[]
      >('/api/admin/audit'),
  },
};

export type ApiError = Error & { status?: number; details?: unknown };
