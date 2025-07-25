import type { NetlessApp } from "@netless/window-manager";
import Player from "./player.svelte";
import { Sync } from "./sync";
import styles from "./style.scss?inline";
import { isAndroid, isIOS } from "./environment";
import { guessTypeFromSrc } from "./mime";
import closeSvg from "./assets/close.svg";
const ClickThroughAppliances = new Set(["clicker"]);
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

    if (context?.getIsWritable()) {
      storage.ensureState(DefaultAttributes);
    }

    if (!storage.state.src) {
      context.emitter.emit("destroy", {
        error: new Error(`[Plyr]: missing "src"`),
      });
      return;
    }

    if (!storage.state.type && !storage.state.provider) {
      console.warn(`[Plyr]: missing "type", will guess from file extension`);
    }

    const type = storage.state.type || guessTypeFromSrc(storage.state.src);

    const box = context.getBox();
    const room = context.getRoom();

    box.mountStyles(styles);
    box.$box.classList.toggle("is-mobile", isIOS() || isAndroid());

    const loading = document.createElement("div");
    loading.className = "app-plyr-loading";
    const loader = document.createElement("div");
    loader.className = "app-plyr-loader";
    loading.appendChild(loader);

    if (type?.startsWith("video/")) {
      box.$content.appendChild(loading);
    }

    const sync = new Sync(context);
    const app = new Player({
      target: box.$content,
      props: {
        storage: context.storage,
        sync,
        readonly: isIOS() || isAndroid() || !context?.getIsWritable(),
        isMobile: isIOS() || isAndroid(),
      },
    });

    setTimeout(() => {
      loading.remove();
    }, 300);

    context.emitter.on("writableChange", writable => {
      app.$set({ readonly: isIOS() || isAndroid() || !writable });
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

    const shouldClickThrough = (tool: string) => {
      return ClickThroughAppliances.has(tool);
    };

    if (type?.startsWith("audio/")) {
      box.$box.style.pointerEvents = "none";
      box.$titleBar.style.display = "none";
      const wrp: HTMLDivElement | null = box.$box.querySelector(".telebox-content-wrap");
      if (wrp) {
        wrp.style.background = "none";
        const boxMain: HTMLDivElement | null = box.$box.querySelector(".telebox-box-main");
        if (boxMain) {
          boxMain.style.background = "none";
          boxMain.style.pointerEvents = "none";
        }
      }

      const content: HTMLDivElement | null = box.$box.querySelector(".telebox-content");

      if (content) {
        content.style.background = "none";
        const p: HTMLDivElement | null = content.querySelector(".plyr__controls");

        if (p) {
          const close = document.createElement("button");
          close.className = "plyr__controls__item plyr__close plyr__control";
          const img = document.createElement("img");

          img.src = closeSvg;
          close.appendChild(img);
          close.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            box._delegateEvents.emit("close");
          });
          p.appendChild(close);
          const toggleClickThrough = (enable?: boolean) => {
            p.style.pointerEvents = enable ? "none" : "auto";
            img.style.display = enable ? "none" : "block";
          };

          if (room?.state.memberState.currentApplianceName) {
            toggleClickThrough(!shouldClickThrough(room?.state.memberState.currentApplianceName));
          }

          if (room) {
            const onRoomStateChanged = (e: { memberState: { currentApplianceName: string } }) => {
              if (e.memberState) {
                toggleClickThrough(!shouldClickThrough(e.memberState.currentApplianceName));
              }
            };
            room.callbacks.on("onRoomStateChanged", onRoomStateChanged);
          }
        }
      }
    }
  },
};

export default Plyr;
