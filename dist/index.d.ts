import type { NetlessApp } from "@netless/window-manager";
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
declare const Plyr: NetlessApp<Attributes>;
export default Plyr;
