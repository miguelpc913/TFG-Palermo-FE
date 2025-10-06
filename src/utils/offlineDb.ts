let request: IDBOpenDBRequest;
let db: IDBDatabase;
const version = 2;

export interface Message {
  name: string;
}

export enum Stores {
  Messages = "messages",
}

export const initDB = (): Promise<boolean> => {
  return new Promise(resolve => {
    // open the connection
    request = indexedDB.open("myDB", version);

    request.onupgradeneeded = () => {
      db = request.result;
      // if the data object store doesn't exist, create it
      if (!db.objectStoreNames.contains(Stores.Messages)) {
        db.createObjectStore(Stores.Messages, { autoIncrement: true });
      }
      // no need to resolve here
    };

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
};

export const addData = <T>(storeName: string, data: T): Promise<T | string | null> => {
  return new Promise(resolve => {
    request = indexedDB.open("myDB", version);

    request.onsuccess = () => {
      console.log("request.onsuccess - addData", data);
      db = request.result;
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.add(data);
      resolve(data);
    };

    request.onerror = () => {
      const error = request.error?.message;
      if (error) {
        resolve(error);
      } else {
        resolve("Unknown error");
      }
    };
  });
};

export const deleteStore = (storeName: string) => {
  return new Promise(resolve => {
    request = indexedDB.open("myDB", version);

    request.onsuccess = () => {
      db = request.result;
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.clear();
    };

    request.onerror = () => {
      const error = request.error?.message;
      if (error) {
        resolve(error);
      } else {
        resolve("Unknown error");
      }
    };
  });
};

export const getStoreData = <T>(storeName: Stores): Promise<T[]> => {
  return new Promise(resolve => {
    request = indexedDB.open("myDB");

    request.onsuccess = () => {
      console.log("request.onsuccess - getAllData");
      db = request.result;
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const res = store.getAll();
      res.onsuccess = () => {
        resolve(res.result);
      };
    };
  });
};
