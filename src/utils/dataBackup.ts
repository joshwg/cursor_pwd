// Utility for backing up and restoring data across preview reloads
export const DATA_KEYS = {
  USERS: 'pm_users',
  CURRENT_USER: 'pm_current_user',
  PASSWORDS: 'pm_passwords',
  TAGS: 'pm_tags'
} as const;

export const BACKUP_KEYS = {
  USERS: 'pm_users_backup',
  CURRENT_USER: 'pm_current_user_backup', 
  PASSWORDS: 'pm_passwords_backup',
  TAGS: 'pm_tags_backup'
} as const;

// Create backups of all data
export const backupAllData = () => {
  try {
    Object.entries(DATA_KEYS).forEach(([key, value]) => {
      const data = localStorage.getItem(value);
      if (data) {
        const backupKey = BACKUP_KEYS[key as keyof typeof BACKUP_KEYS];
        localStorage.setItem(backupKey, data);
        // Also store in sessionStorage as additional backup
        sessionStorage.setItem(backupKey, data);
      }
    });
  } catch (error) {
    console.warn('Failed to backup data:', error);
  }
};

// Restore data from backups if main data is missing
export const restoreDataFromBackups = () => {
  try {
    Object.entries(DATA_KEYS).forEach(([key, value]) => {
      const currentData = localStorage.getItem(value);
      if (!currentData) {
        const backupKey = BACKUP_KEYS[key as keyof typeof BACKUP_KEYS];
        
        // Try localStorage backup first
        let backupData = localStorage.getItem(backupKey);
        
        // If not found, try sessionStorage backup
        if (!backupData) {
          backupData = sessionStorage.getItem(backupKey);
        }
        
        if (backupData) {
          localStorage.setItem(value, backupData);
          console.log(`Restored ${value} from backup`);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to restore data from backups:', error);
  }
};

// Enhanced data save that includes backup
export const saveDataWithBackup = (key: string, data: any) => {
  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    
    // Create backup
    const backupKey = key + '_backup';
    localStorage.setItem(backupKey, jsonData);
    sessionStorage.setItem(backupKey, jsonData);
  } catch (error) {
    console.warn(`Failed to save data for ${key}:`, error);
  }
};

// Get data with fallback to backup
export const getDataWithFallback = (key: string) => {
  try {
    // Try main key first
    let data = localStorage.getItem(key);
    
    if (!data) {
      // Try backup in localStorage
      data = localStorage.getItem(key + '_backup');
    }
    
    if (!data) {
      // Try backup in sessionStorage
      data = sessionStorage.getItem(key + '_backup');
    }
    
    return data;
  } catch (error) {
    console.warn(`Failed to get data for ${key}:`, error);
    return null;
  }
};

// Auto-backup data periodically
export const startAutoBackup = () => {
  // Backup data every 30 seconds
  const interval = setInterval(backupAllData, 30000);
  
  // Backup before page unload
  const handleBeforeUnload = () => {
    backupAllData();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};