import type Plyr from "plyr";
import type { AppContext } from "@netless/window-manager";
import type { Attributes } from ".";
export declare class Sync {
    readonly context: AppContext<Attributes>;
    /**
     * `ideal`: user action triggers player state change, nothing more.
     *
     * `owner`: user action switches owner, owner publishes player state.
     */
    behavior: "ideal" | "owner";
    readonly uid: string;
    readonly getTimestamp: () => number | undefined;
    private _skip_next_play_pause;
    private _sync_timer;
    private _interval;
    private _blink;
    private _player;
    private _buffering;
    private _throttle;
    private _dispatch_time_again;
    private _buffering_timer;
    private _disposer;
    constructor(context: AppContext<Attributes>);
    dispose(): void;
    get player(): Plyr | null;
    set player(player: Plyr | null);
    setupPlayer(player: Plyr): void;
    syncAll(): void;
    private watchUserInputs;
    private fixSeekBarOnInit;
    private registerListeners;
    private clearBuffering;
    private dispatchOwner;
    private dispatchPlayPause;
    private skipNextPlayPause;
    private dispatchVolume;
    private dispatchMuted;
    private dispatchSeek;
    private dispatchCurrentTime;
    private clearThrottle;
    private isOwner;
    private syncCurrentTime;
    private updateSyncInterval;
}
