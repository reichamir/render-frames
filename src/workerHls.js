import { Canvas2DRenderer } from "./canvas2DRenderer.js";
import { MP4DemuxerCopy } from "./demuxerMp4Copy.js";
import MP4Box from 'mp4box';

let demuxer = null;
let decoder = null;
let renderer = null;
  // Rendering. Drawing is limited to once per animation frame.
  let pendingFrame = null;
//   const muxer = new muxjs.mp4.Transmuxer({
//     keepOriginalTimestamps: true
//   });

//   muxer.on('data', (segment) => {
//     if (segment.type === 'video') {
//       findKeyframeAndDecode(segment.data);
//     }
//   });


function renderFrame(frame) {
  if (!pendingFrame) {
    // Schedule rendering in the next animation frame.
    requestAnimationFrame(renderAnimationFrame);
  } else {  
// Close the current pending frame before replacing it.
pendingFrame.close();
  }
  // Set or replace the pending frame.
  pendingFrame = frame;
}

function renderAnimationFrame() {
    console.log('renderAnimationFrame',pendingFrame);
  renderer.draw(pendingFrame);
  pendingFrame = null;
}

function initCanvas(canvas) {
    renderer = new Canvas2DRenderer(canvas);
}

function initDecoder(decoderConfig) {
    decoder = new VideoDecoder({
        output(frame) {
          renderFrame(frame);
        },
        error(e) {
          console.error(e);
        }
      });

      try {
        decoder.configure(decoderConfig);
      } catch(e) {
        console.log('configure', e)
      }
}

function setStatus(type, message) {
    console.log('setStatus',type, message);
  }

async function onSegment(segment, index) {
    await parseSegmentGop(segment, index);
}

function appendFragment({payload, start}) {
    // demuxer.appendFragment({payload, start});
}

function setInitSegment(data) {
    demuxer.setInitSegment(data);
}

async function parseSegmentGop(segment, index) {
    // demuxer = new MP4DemuxerCopy(segment.url, {
    //     onConfig(config) {
    //       console.log('config', config);
    //       decoder.configure(config);
    //     },
    //     onChunk(chunk) {
    //       decoder.decode(chunk);
    //     },
    //     setStatus
    //   });

    try {
      const response = await fetch(segment.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log('ArrayBuffer:', arrayBuffer);
      return new Promise((resolve, reject) => {
        const mp4boxfile = MP4Box.createFile();
        mp4boxfile.onError = (error) => reject(new Error(`MP4Box error: ${error}`));
        mp4boxfile.onReady = (info) => {
          currentTrack = info.tracks.find(track => track.type === 'main'); // May type should be video?
          if (!currentTrack) {
            reject(new Error('No video track found'));
            return;
          }
          
          const segmentGop = [];
          let lastKeyFrame = null;
          
          mp4boxfile.setExtractionOptions(currentTrack.id, null, { nbSamples: 1 });
          mp4boxfile.onSamples = (track_id, ref, samples) => {
            for (const sample of samples) {
              if (sample.is_sync) {
                lastKeyFrame = {
                  dts: sample.dts,
                  cts: sample.cts,
                  duration: sample.duration,
                  offset: sample.offset,
                  size: sample.size
                };
              }
              segmentGop.push({
                dts: sample.dts,
                cts: sample.cts,
                duration: sample.duration,
                isKeyFrame: sample.is_sync,
                lastKeyFrame: lastKeyFrame
              });

              decoder.decode(new EncodedVideoChunk({
                type: sample.is_sync ? "key" : "delta",
                timestamp: 1e6 * sample.cts / sample.timescale,
                duration: 1e6 * sample.duration / sample.timescale,
                data: sample.data
              }));
            }
          };
          
          mp4boxfile.start();
          mp4boxfile.flush();
          
          resolve(segmentGop);
        };
        
        const uint8Array = new Uint8Array(arrayBuffer);
        const buffer = uint8Array.buffer;
        buffer.fileStart = index * segment.duration;  // Set fileStart based on segment index
        mp4boxfile.appendBuffer(buffer);
      });
    } catch (error) {
      console.error('Error fetching or parsing segment:', error);
      throw error;
    }
  }

function onChunk(videoData) {
    try {
        const chunk = new EncodedVideoChunk({
        type: 'key', // 'key' or 'delta' depending on frame type
        timestamp: Date.now(),
        data: videoData,
    });

        decoder.decode(chunk);
      } catch (e) {
        console.error('Decode error:', e);
      }

    // processVideoData(videoData);

    // muxer.push(new Uint8Array(videoData));
    // muxer.flush();

    // const chunk = new EncodedVideoChunk({
    //     type: 'key', // 'key' or 'delta' depending on frame type
    //     timestamp: Date.now(),
    //     data: videoData,
    // });

    // try {
    //     decoder.decode(chunk);
    // } catch(e) {
    //     console.error(e);
    // }
    
}

function processVideoData(data) {
    if (decoder.state !== 'configured') {
      console.warn('Decoder not configured yet, dropping fragment');
      return;
    }
  
    const view = new DataView(data);
    let offset = 0;
  
    // Look for NAL units
    while (offset < data.byteLength - 4) {
      if (view.getUint32(offset) === 0x00000001) {
        const nalType = new Uint8Array(data, offset + 4, 1)[0] & 0x1F;
        
        // Find the next NAL unit or end of data
        let nextOffset = offset + 4;
        while (nextOffset < data.byteLength - 4) {
          if (view.getUint32(nextOffset) === 0x00000001) {
            break;
          }
          nextOffset++;
        }
  
        const nalData = new Uint8Array(data, offset, nextOffset - offset);
        
        // For IDR frames (type 5) or regular frames (type 1)
        if (nalType === 5 || nalType === 1) {
          const chunk = new EncodedVideoChunk({
            type: nalType === 5 ? 'key' : 'delta',
            data: nalData,
            timestamp: performance.now()
          });
  
          try {
            decoder.decode(chunk);
          } catch (e) {
            console.error('Decode error:', e);
          }
        }
  
        offset = nextOffset;
      } else {
        offset++;
      }
    }
  }

function processFragment(fragment) {
    if (decoder.state !== 'configured') {
      console.warn('Decoder not configured yet, dropping fragment');
      return;
    }
    
    const view = new DataView(fragment);
    let offset = 0;
    
    // Process NAL units
    while (offset < fragment.byteLength - 4) {
      if (view.getUint32(offset) === 0x00000001) {
        const nalType = new Uint8Array(fragment, offset + 4, 1)[0] & 0x1F;
        if (nalType === 5) { // IDR frame
          const chunk = new EncodedVideoChunk({
            type: 'key',
            data: new Uint8Array(fragment, offset),
            timestamp: performance.now(),
            duration: 33333 // 30fps
          });
          
          decoder.decode(chunk);
          break;
        }
      }
      offset++;
    }
  }

// function findKeyframeAndDecode(data) {
//     const view = new DataView(data.buffer);
//     let offset = 0;
    
//     // Simple NAL unit scanner for H.264
//     while (offset < data.length - 4) {
//       if (view.getUint32(offset) === 0x00000001) {
//         const nalType = data[offset + 4] & 0x1F;
//         // Check for IDR frame (keyframe)
//         if (nalType === 5) {
//           // Found keyframe, start decoding from here
//           const chunk = new EncodedVideoChunk({
//             type: 'key',
//             data: data.slice(offset),
//             timestamp: performance.now()
//           });
//           decoder.decode(chunk);
//           break;
//         }
//       }
//       offset++;
//     }
//   }

self.addEventListener("message", e => {
    const { type, ...data } = e.data;

    if (type === "initCanvas") {
        initCanvas(data.canvas);
    } else if (type === "initDecoder") {
        initDecoder(data.decoderConfig);
    } else if (type === "onChunk") {
        onChunk(data.data)
    } else if (type === "updateSegments") {
        onSegment(data.payload[0])
        // data.payload.forEach(segement => {
        //     parseSegmentGop(segement)
        // })
    } else if (type === "appendFragment") {
        appendFragment(data);
    } else if (type === "decodeMe") {
        const chunk = new EncodedVideoChunk({
            type: "key",
            timestamp: 0,
            data: data.mp4Data,
        });

        decoder.decode(chunk)
    } else if (type === "decodeMeTwo") {
        const chunk = new EncodedVideoChunk({
            type: data.chunkType,
            timestamp: data.timestamp,
            duration: data.duration,
            data: data.data,
        });

        decoder.decode(chunk)
    } else if (type === "decodeMeThree") {
        try {
            const chunk = new VideoFrame(data.payload,{ 
                timestamp: data.timestamp, 
                codedWidth: 640,       // Coded width
                codedHeight: 360,     // Coded height
                displayWidth: 640,   // Display width
                displayHeight: 360,  // Display height
                format: 'I420',  
                });
            
            decoder.decode(chunk)
        } catch (e) {
            console.error('decodeMeThree error:', e);
        }
        
    } 
    // else if (type === "setInitSegment") {
    //     setInitSegment(data);
    // }
});

self.postMessage("Hello from worker");