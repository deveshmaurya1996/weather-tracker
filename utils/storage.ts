import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveItem = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save item', e);
  }
};

export const getItem = async (key: string) => {
  try {
    const result = await AsyncStorage.getItem(key);
    return result ? JSON.parse(result) : null;
  } catch (e) {
    console.error('Failed to get item', e);
    return null;
  }
};

export const deleteItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to delete item', e);
  }
};
