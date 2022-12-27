const stream = require("stream");
const readline = require("readline");

//for writable streams
const debug_stream_options = {
    highwatermark: 16384,
    decodeStrings: true,
    defaultEncoding: "utf8",
    objectMode: false,
    emitClose: true
};

class debug_stream extends stream.Writable
{
  constructor(source_name, namespace) {
    super(debug_stream_options);
    this._decoder = new StringDecoder(debug_stream_options && debug_stream_options.defaultEncoding);
    this.source_name = source_name;
    // this.data = "";
    this.last_chunk = "";
    this.target = namespace;
  }
  _write(chunk, encoding, callback) {
      if (encoding === "buffer") {
          chunk = this._decoder.write(chunk);
      }
      this.last_chunk = `${chunk}\n`;
      // this.data += `${chunk}\n`;
      this.target.emit(this.source_name, this.last_chunk);
      callback();
  }
//   _read() {
//     this.target.emit(this.source_name, this.last_chunk);
// }
  _writev(chunk, encoding, callback) {
      if (encoding === "buffer") { 
          chunk = this._decoder.write(chunk);
      }
      this.last_chunk = `${chunk}\n`;
      // this.data += `${chunk}\n`;
      this.target.emit(this.source_name, this.last_chunk);
      callback();
  }
  _final(callback) {
      this.data += this._decoder.end();
      callback();
  }
}