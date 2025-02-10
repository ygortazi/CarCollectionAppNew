export const api = {
  syncCollection: async () => {
    // Implement sync logic
    return Promise.resolve();
  },
  getSyncStorageStats: async () => {
    return Promise.resolve({
      images: 0,
      metadata: 0,
      total: 0
    });
  },
  getSyncBatteryImpact: async () => {
    return Promise.resolve(0);
  },
  clearSyncData: async () => {
    return Promise.resolve();
  }
};