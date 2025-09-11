import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.nebula-wars.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('nebula-wars-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp
    config.metadata = { startTime: new Date() };
    
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('📡 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.config.url} (${duration}ms)`);
    
    return response;
  },
  (error) => {
    const duration = error.config ? new Date() - error.config.metadata.startTime : 0;
    console.error(`❌ API Error: ${error.config?.url} (${duration}ms)`, error.response?.data || error.message);
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('nebula-wars-token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const gameAPI = {
  // Player/Account endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  },

  // Player profile
  player: {
    getProfile: () => api.get('/player/profile'),
    updateProfile: (data) => api.put('/player/profile', data),
    getStats: () => api.get('/player/stats'),
    getAchievements: () => api.get('/player/achievements'),
    updateAvatar: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/player/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
  },

  // Game data
  game: {
    saveGameData: (gameData) => api.post('/game/save', gameData),
    loadGameData: () => api.get('/game/load'),
    getCharacters: () => api.get('/game/characters'),
    getArenas: () => api.get('/game/arenas'),
    submitScore: (scoreData) => api.post('/game/scores', scoreData),
    getLeaderboard: (limit = 100) => api.get(`/game/leaderboard?limit=${limit}`),
  },

  // Multiplayer
  multiplayer: {
    createLobby: (settings) => api.post('/multiplayer/lobby', settings),
    joinLobby: (lobbyId) => api.post(`/multiplayer/lobby/${lobbyId}/join`),
    leaveLobby: (lobbyId) => api.post(`/multiplayer/lobby/${lobbyId}/leave`),
    getLobbies: () => api.get('/multiplayer/lobbies'),
    startMatch: (lobbyId) => api.post(`/multiplayer/lobby/${lobbyId}/start`),
  },

  // Tournament
  tournament: {
    createTournament: (settings) => api.post('/tournament/create', settings),
    joinTournament: (tournamentId) => api.post(`/tournament/${tournamentId}/join`),
    getTournaments: () => api.get('/tournament/list'),
    getTournamentDetails: (tournamentId) => api.get(`/tournament/${tournamentId}`),
    submitMatch: (matchData) => api.post('/tournament/match', matchData),
  },

  // Social features
  social: {
    getFriends: () => api.get('/social/friends'),
    addFriend: (playerId) => api.post('/social/friends', { playerId }),
    removeFriend: (playerId) => api.delete(`/social/friends/${playerId}`),
    sendMessage: (playerId, message) => api.post('/social/messages', { playerId, message }),
    getMessages: () => api.get('/social/messages'),
    createClan: (clanData) => api.post('/social/clans', clanData),
    joinClan: (clanId) => api.post(`/social/clans/${clanId}/join`),
  },

  // Analytics and feedback
  analytics: {
    trackEvent: (event, data) => api.post('/analytics/event', { event, data }),
    submitFeedback: (feedback) => api.post('/analytics/feedback', feedback),
    reportBug: (bugReport) => api.post('/analytics/bug-report', bugReport),
  },

  // Content and updates
  content: {
    getNews: () => api.get('/content/news'),
    getUpdates: () => api.get('/content/updates'),
    getSeasonData: () => api.get('/content/season'),
    getShopItems: () => api.get('/content/shop'),
    purchaseItem: (itemId) => api.post(`/content/shop/${itemId}/purchase`),
  },
};

// Utility functions for API calls
export const apiUtils = {
  // Handle API errors with user-friendly messages
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.message || 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You don\'t have permission for this action.';
        case 404:
          return 'Resource not found.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data.message || `Error ${status}: Something went wrong.`;
      }
    } else if (error.request) {
      // Request made but no response received
      return 'Network error. Please check your connection.';
    } else {
      // Something else happened
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Retry failed requests
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        console.log(`Request failed, retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  },

  // Upload file with progress tracking
  uploadWithProgress: (file, endpoint, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(progress);
      },
    });
  },

  // Batch requests
  batchRequests: async (requests) => {
    try {
      const responses = await Promise.allSettled(requests);
      return responses.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    } catch (error) {
      console.error('Batch request error:', error);
      throw error;
    }
  },

  // Cache management
  cache: {
    get: (key) => {
      try {
        const cached = localStorage.getItem(`api_cache_${key}`);
        if (cached) {
          const { data, timestamp, ttl } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            return data;
          } else {
            localStorage.removeItem(`api_cache_${key}`);
          }
        }
      } catch (error) {
        console.error('Cache get error:', error);
      }
      return null;
    },

    set: (key, data, ttl = 300000) => { // 5 minutes default
      try {
        localStorage.setItem(`api_cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        }));
      } catch (error) {
        console.error('Cache set error:', error);
      }
    },

    clear: (key) => {
      if (key) {
        localStorage.removeItem(`api_cache_${key}`);
      } else {
        // Clear all cache
        Object.keys(localStorage)
          .filter(k => k.startsWith('api_cache_'))
          .forEach(k => localStorage.removeItem(k));
      }
    }
  },

  // Real-time WebSocket wrapper
  websocket: {
    connect: (endpoint, options = {}) => {
      const wsUrl = endpoint.startsWith('ws') ? endpoint : 
                   `${import.meta.env.VITE_WS_URL || 'wss://api.nebula-wars.com'}${endpoint}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected:', endpoint);
        options.onOpen?.();
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected:', endpoint);
        options.onClose?.();
      };
      
      ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        options.onError?.(error);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onMessage?.(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      return {
        send: (data) => ws.send(JSON.stringify(data)),
        close: () => ws.close(),
        readyState: ws.readyState
      };
    }
  }
};

export default api;