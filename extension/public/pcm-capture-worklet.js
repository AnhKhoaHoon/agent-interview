class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel?.length) return true;
    let sourceOffset = 0;
    while (sourceOffset < channel.length) {
      const writable = Math.min(this.buffer.length - this.offset, channel.length - sourceOffset);
      this.buffer.set(channel.subarray(sourceOffset, sourceOffset + writable), this.offset);
      this.offset += writable;
      sourceOffset += writable;
      if (this.offset === this.buffer.length) {
        const completed = this.buffer;
        this.port.postMessage(completed, [completed.buffer]);
        this.buffer = new Float32Array(4096);
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
