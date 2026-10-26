import { StorageAdapter, StorageItem } from '../types';
import { safeJsonParse } from '../utils/formatters';

export class StorageManager {
  private static adapters: Map<string, StorageAdapter> = new Map();

  public static registerAdapter(adapter: StorageAdapter) {
    this.adapters.set(adapter.name, adapter);
  }

  public static getAdapters(): StorageAdapter[] {
    return Array.from(this.adapters.values());
  }

  public static getAdapter(name: string): StorageAdapter | undefined {
    return this.adapters.get(name);
  }

  public static async getItems(adapterName: string): Promise<StorageItem[]> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) return [];

    try {
      const keys = await adapter.getAllKeys();
      const items: StorageItem[] = [];

      for (const key of keys) {
        const value = await adapter.getItem(key);
        const { isJson, value: parsedJson } = safeJsonParse(value);
        items.push({
          key,
          value,
          parsedJson: isJson ? parsedJson : undefined,
        });
      }

      return items.sort((a, b) => a.key.localeCompare(b.key));
    } catch {
      return [];
    }
  }

  public static async removeItem(adapterName: string, key: string): Promise<boolean> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter || !adapter.removeItem) return false;
    try {
      await adapter.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  public static async setItem(adapterName: string, key: string, value: string): Promise<boolean> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter || !adapter.setItem) return false;
    try {
      await adapter.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  public static async clear(adapterName: string): Promise<boolean> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter || !adapter.clear) return false;
    try {
      await adapter.clear();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to create an adapter from @react-native-async-storage/async-storage
   */
  public static createAsyncStorageAdapter(asyncStorage: any, name = 'AsyncStorage'): StorageAdapter {
    return {
      name,
      getAllKeys: () => asyncStorage.getAllKeys(),
      getItem: (key) => asyncStorage.getItem(key),
      setItem: (key, val) => asyncStorage.setItem(key, val),
      removeItem: (key) => asyncStorage.removeItem(key),
      clear: () => asyncStorage.clear(),
    };
  }

  /**
   * Helper to create an adapter from react-native-mmkv
   */
  public static createMMKVAdapter(mmkv: any, name = 'MMKV'): StorageAdapter {
    return {
      name,
      getAllKeys: () => mmkv.getAllKeys(),
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, val) => mmkv.set(key, val),
      removeItem: (key) => mmkv.delete(key),
      clear: () => mmkv.clearAll(),
    };
  }
}
