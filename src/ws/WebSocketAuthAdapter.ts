import { NetworkAdapter, PeerId, PeerMetadata, cbor } from "@automerge/react";
import WebSocket from "isomorphic-ws";
import {
  FromClientMessage,
  FromServerMessage,
  JoinMessage,
  isErrorMessage,
  isPeerMessage,
} from "./messages.js";
import { ProtocolV1 } from "./protocolVersion.js";
import { assert } from "./assert.js";
import { toArrayBuffer } from "./toArrayBuffer.js";
import { redirectToLogin } from "@/main";
import { toast } from "sonner";

type TimeoutId = ReturnType<typeof setTimeout>;
type GetToken = () => string | Promise<string>;

abstract class WebSocketNetworkAdapter extends NetworkAdapter {
  socket?: WebSocket;
}

export class WebSocketAuthAdapter extends WebSocketNetworkAdapter {
  // readiness
  #ready = false;
  #readyResolver?: () => void;
  #readyPromise: Promise<void> = new Promise<void>(resolve => {
    this.#readyResolver = resolve;
  });

  // reconnect
  #retryIntervalId?: TimeoutId;

  // logging
  #log = console.log;

  // peer
  remotePeerId?: PeerId; // this adapter only connects to one remote at a time

  // auth
  private getToken?: GetToken;
  private useProtocols = true; // prefer subprotocols over query params

  constructor(
    public readonly url: string,
    public readonly retryInterval = 5000,
    opts?: {
      /** Provide a function that returns the current JWT (sync or async). */
      getToken?: GetToken;
      /** Set false to fall back to ?token=... in URL instead of subprotocols. */
      useProtocols?: boolean;
    }
  ) {
    super();
    // this.#log = this.#log.extend(url);
    this.getToken = opts?.getToken;
    if (typeof opts?.useProtocols === "boolean") this.useProtocols = opts.useProtocols;
  }

  /** Whether the adapter has become ready at least once. */
  isReady() {
    return this.#ready;
  }

  /** Promise that resolves when the adapter is ready. */
  whenReady() {
    return this.#readyPromise;
  }

  #forceReady() {
    if (!this.#ready) {
      this.#ready = true;
      this.#readyResolver?.();
    }
  }

  /** Open (or re-open) the WS connection. */
  async connect(peerId: PeerId, peerMetadata?: PeerMetadata) {
    if (!this.socket || !this.peerId) {
      // first time
      this.#log("connecting");
      this.peerId = peerId;
      this.peerMetadata = peerMetadata ?? {};
    } else {
      // reconnect
      this.#log("reconnecting");
      assert(peerId === this.peerId);
      // detach old listeners
      this.socket.removeEventListener("open", this.onOpen);
      this.socket.removeEventListener("close", this.onClose);
      this.socket.removeEventListener("message", this.onMessage);
      this.socket.removeEventListener("error", this.onError);
    }

    // retry loop (idempotent)
    if (!this.#retryIntervalId) {
      this.#retryIntervalId = setInterval(() => {
        this.connect(peerId, peerMetadata);
      }, this.retryInterval);
    }

    // --- JWT handling (fresh on every attempt) ---
    const token = this.getToken ? await this.getToken() : undefined;

    let wsUrl = this.url;
    let protocols: string[] | undefined;

    if (token) {
      if (this.useProtocols) {
        // Preferred: Sec-WebSocket-Protocol: bearer, <token>
        protocols = ["bearer", token];
      } else {
        // Fallback: URL param
        const sep = wsUrl.includes("?") ? "&" : "?";
        wsUrl = `${wsUrl}${sep}token=${encodeURIComponent(token)}`;
      }
    }

    // @ts-ignore isomorphic-ws supports (url, protocols)
    this.socket = new WebSocket(wsUrl, protocols);
    this.socket.binaryType = "arraybuffer";

    this.socket.addEventListener("open", this.onOpen);
    this.socket.addEventListener("close", this.onClose);
    this.socket.addEventListener("message", this.onMessage);
    this.socket.addEventListener("error", this.onError);

    // Don't block readiness forever if no ack comes back
    setTimeout(() => this.#forceReady(), 1000);

    // Try to join immediately (if OPEN it'll send; otherwise onOpen will)
    this.join();
  }

  onOpen = () => {
    this.#log("open");
    clearInterval(this.#retryIntervalId);
    this.#retryIntervalId = undefined;
    this.join();
  };

  onClose = (event?: WebSocket.CloseEvent) => {
    console.log(event);
    this.#log("close");

    // Detect auth/policy close (1008) or any auth-looking reason
    const reason = (event?.reason || "").toLowerCase();
    if (event && (event.code === 1008 || reason.includes("auth"))) {
      console.log("detected auth");
      this.emit("close");
      // Optionally: stop retries until app refreshes token.
      clearInterval(this.#retryIntervalId);
      this.#retryIntervalId = undefined;
      if (reason === "auth error") {
        toast.error("Invalid token");
      }
      redirectToLogin();
      return;
    }

    if (this.remotePeerId) this.emit("peer-disconnected", { peerId: this.remotePeerId });

    if (this.retryInterval > 0 && !this.#retryIntervalId) {
      setTimeout(() => {
        assert(this.peerId);
        return this.connect(this.peerId, this.peerMetadata);
      }, this.retryInterval);
    }
  };

  onMessage = (event: WebSocket.MessageEvent) => {
    // event.data may be ArrayBuffer/Uint8Array/string (we encode binary)
    this.receiveMessage(event.data as Uint8Array);
  };

  /** Browser vs Node error signatures differ; handle both. */
  onError = (event: Event) => {
    if ("error" in event) {
      // Node: we might see ECONNREFUSED etc.
      if ((event.error as any)?.code !== "ECONNREFUSED") {
        /* c8 ignore next */
        this.#log("error", event.error);
      }
    } else {
      // Browser: details are intentionally opaque
      console.log("browser error");
    }
    this.#log("connection error; will retry if enabled…");
  };

  /** Send a join message if socket is already open. */
  join() {
    assert(this.peerId);
    assert(this.socket);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.send(joinMessage(this.peerId!, this.peerMetadata!));
    } else {
      // will join on 'open'
    }
  }

  /** Close and cleanup the socket. */
  disconnect() {
    assert(this.peerId);
    assert(this.socket);
    const socket = this.socket;
    if (socket) {
      socket.removeEventListener("open", this.onOpen);
      socket.removeEventListener("close", this.onClose);
      socket.removeEventListener("message", this.onMessage);
      socket.removeEventListener("error", this.onError);
      socket.close();
    }
    clearInterval(this.#retryIntervalId);
    this.#retryIntervalId = undefined;
    if (this.remotePeerId) this.emit("peer-disconnected", { peerId: this.remotePeerId });
    this.socket = undefined;
  }

  /** Encode + send a message to the server. */
  send(message: FromClientMessage) {
    if ("data" in message && message.data?.byteLength === 0)
      throw new Error("Tried to send a zero-length message");

    assert(this.peerId);
    if (!this.socket) {
      this.#log("Tried to send on a disconnected socket.");
      return;
    }
    if (this.socket.readyState !== WebSocket.OPEN)
      throw new Error(`WebSocket not ready (${this.socket.readyState})`);

    const encoded = cbor.encode(message);
    this.socket.send(toArrayBuffer(encoded));
  }

  /** Handle decoded messages from server or peer announcements. */
  receiveMessage(messageBytes: Uint8Array) {
    let message: FromServerMessage;
    try {
      message = cbor.decode(new Uint8Array(messageBytes));
    } catch (e) {
      this.#log("error decoding message:", e);
      return;
    }

    assert(this.socket);
    if (messageBytes.byteLength === 0) throw new Error("received a zero-length message");

    if (isPeerMessage(message)) {
      const { peerMetadata } = message;
      this.#log(`peer: ${message.senderId}`);
      this.peerCandidate(message.senderId, peerMetadata);
    } else if (isErrorMessage(message)) {
      this.#log(`error: ${message.message}`);
    } else {
      this.emit("message", message);
    }
  }

  /** Announce a peer candidate to Automerge Repo. */
  peerCandidate(remotePeerId: PeerId, peerMetadata: PeerMetadata) {
    assert(this.socket);
    this.#forceReady();
    this.remotePeerId = remotePeerId;
    this.emit("peer-candidate", {
      peerId: remotePeerId,
      peerMetadata,
    });
  }
}

/** Build a 'join' control message. */
function joinMessage(senderId: PeerId, peerMetadata: PeerMetadata): JoinMessage {
  return {
    type: "join",
    senderId,
    peerMetadata,
    supportedProtocolVersions: [ProtocolV1],
  };
}
