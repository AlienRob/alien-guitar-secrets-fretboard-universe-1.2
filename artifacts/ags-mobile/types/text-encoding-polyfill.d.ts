declare module "text-encoding-polyfill" {
  export class TextDecoder {
    constructor(label?: string, options?: { fatal?: boolean });
    decode(input?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string;
  }
  export class TextEncoder {
    constructor();
    encode(input?: string): Uint8Array;
  }
}
