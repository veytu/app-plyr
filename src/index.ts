import type { NetlessApp } from "@netless/window-manager";
import Player from "./player.svelte";
import { Sync } from "./sync";
import styles from "./style.scss?inline";

export interface Attributes {
  /** can only set once */
  src: string;
  /** can only set once */
  type: string;
  /** can only set once */
  poster: string;

  volume: number;
  paused: boolean;
  muted: boolean;
  currentTime: number;
  hostTime: number;

  provider?: "youtube" | "vimeo";
  owner?: string;
}

const DefaultAttributes: Pick<Attributes, "volume" | "paused" | "muted" | "currentTime"> = {
  volume: 1,
  paused: true,
  muted: false,
  currentTime: 0,
};

const Plyr: NetlessApp<Attributes> = {
  kind: "Plyr",
  config: {
    minwidth: 300,
    minheight: 80,
  },
  setup(context) {
    const storage = context.storage;
    storage.ensureState(DefaultAttributes);

    if (!storage.state.src) {
      context.emitter.emit("destroy", {
        error: new Error(`[Plyr]: missing "src"`),
      });
      return;
    }

    if (!storage.state.type && !storage.state.provider) {
      console.warn(`[Plyr]: missing "type", will guess from file extension`);
    }

    const box = context.getBox();

    box.mountStyles(styles);

    const sync = new Sync(context);
    const app = new Player({
      target: box.$content,
      props: { storage: context.storage, sync },
    });

    // sync.behavior = "ideal";

    if (import.meta.env.DEV) {
      Object.assign(window, {
        media_player: { sync, app },
      });
    }

    context.emitter.on("destroy", () => {
      try {
        sync.dispose();
        app.$destroy();
      } catch (err) {
        // ignore
        // console.warn("[Plyr] destroy failed", err);
      }
    });
  },
};

export default Plyr;
