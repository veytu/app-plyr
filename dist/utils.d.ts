import type Plyr from "plyr";
export declare function youtube_parseId(url: string): string;
/**
 * Return `true` means ok, `false` means some error occurs.
 */
export declare function safePlay(player: Plyr): Promise<boolean>;
export declare function getFileExtension(url: string): string | null | undefined;
export declare function importScript(src: string): Promise<void>;
import type Hls from "hls.js";
export declare function loadHLS(): Promise<Hls>;
export declare function cannotPlayHLSNatively(playerEl: HTMLElement | HTMLVideoElement | HTMLAudioElement): playerEl is HTMLVideoElement;
export declare function clamp(value: number, min: number, max: number): number;
export declare function first<T>(maybeArray: T | T[] | undefined): T | undefined;
