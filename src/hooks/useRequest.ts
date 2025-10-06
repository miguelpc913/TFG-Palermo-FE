import { useState, useEffect } from "react";
import useNetworkStatus from "./useNetworkStatus";
import { initDB, getStoreData, Stores, deleteStore, addData } from "../utils/offlineDb";

export default function useRequest() {
  const [message, setMessage] = useState("");
  const { isOnline } = useNetworkStatus();
  const [isDbOn, setIsDbOn] = useState(false);
  const [hasDataToSync, setHasDataToSync] = useState(false);

  useEffect(() => {
    const turnOnDb = async () => {
      const dbIsOn = await initDB();
      setIsDbOn(dbIsOn);
    };
    turnOnDb();
  }, [isOnline]);

  useEffect(() => {
    const fetchMessages = async () => {
      const messages = await getStoreData<{ message: string }>(Stores.Messages);
      console.log("request message sent: ", messages);
      deleteStore(Stores.Messages);
      setHasDataToSync(false);
    };
    if (isOnline && isDbOn && hasDataToSync) {
      fetchMessages();
    }
  }, [isOnline]);

  async function sendMessage() {
    if (isOnline) {
      console.log("request message sent: ", message);
    } else {
      try {
        await addData(Stores.Messages, { message });
        setHasDataToSync(true);
      } catch (err: unknown) {
        console.log(err, "there has been an error");
      }
    }
  }

  return { setMessage, sendMessage, isOnline };
}
