import { openDB } from 'idb';

const DB_NAME = 'InventoryDB';
const STORE_NAME = 'inventory';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
};

export const saveInventory = async (data: any[]) => {
    const db = await initDB();
    await db.put(STORE_NAME, data, 'currentData');
};

export const getInventory = async () => {
    const db = await initDB();
    return await db.get(STORE_NAME, 'currentData');
};

export const clearInventory = async () => {
    const db = await initDB();
    await db.delete(STORE_NAME, 'currentData');
};
