// @ts-check
/** @jsx h */

import { h, render, Component, createRef, Fragment } from 'preact';
import { Simulation } from './components/Simulation';
import { TimeProvider } from './components/TimeProvider';
import world from './components/worlds/standard.json';

class RecorderProvider extends TimeProvider {
  constructor(...args) {
    super(...args);

    this._first = true;

    this.registerAfterFrame(({ context }) => {
      if (!this._first) {
        this.handleAfterFrame(context);
      }
      this._first = false;

      setTimeout(() => {
        this.renderNextFrame();
      }, 1);
    });

    this._frameRate = 24;

    this._time = 0;
    this._last = 0;

    this._frames = [];
    this._renderFinished = false;
    this._convertRunning = false;

    this._worker = new Worker("./node_modules/ffmpeg.js/ffmpeg-worker-mp4.js");
    this._worker.onerror = function (e) {
      console.error(e);
      debugger;
    }

    this._onFrame = null;
    this._onConverting = null;
    this._onFinished = null;
  }

  async ffmpegRequest(req) {
    return await new Promise((resolve, reject) => {
      const stdout = [];
      const stderr = [];

      this._worker.onmessage = (e) => {
        var msg = e.data;

        switch (msg.type) {
          case "stdout":
            stdout.push(msg.data);
            break;

          case "stderr":
            stderr.push(msg.data);
            break;

          case "exit":
            if (msg.data !== 0) {
              reject(new Error(stderr.join('\n')));
              this._worker.onmessage = null;
            }
            break;

          case "done":
            resolve({
              stdout: stdout.join('\n'),
              stderr: stderr.join('\n'),
              MEMFS: e.data.data.MEMFS
            })
            break;
        }
      }

      this._worker.postMessage({
        type: 'run',
        ...req
      });
    });
  }

  start() {
    super.start();
    this.renderNextFrame();
  }

  renderNextFrame() {
    const delta = (1000 / this._frameRate);
    this._time += delta;

    const rounded = Math.round(this._time);
    const diff = rounded - this._last;
    this._last = rounded;

    this.increment(diff);
  }

  checkIfFinishNeeded() {
    if (!this._renderFinished) {
      return;
    }

    if (this._convertRunning) {
      return;
    }

    const allFinished = this._frames.findIndex(b => b === null) === -1;
    if (!allFinished) {
      return;
    }

    this._convertRunning = true;
    if (this._onConverting) {
      this._onConverting();
    }

    (async function startConvertion(_this) {
      return _this.convert();
    })(this)
      .then(blob => {
        if (this._onFinished) {
          this._onFinished(null, blob);
        }
      })
      .catch(ex => {
        if (this._onFinished) {
          this._onFinished(ex);
        }
      });
  }

  handleAfterFrame({ canvas }) {
    const target = this._frames.length;
    this._frames.push(null);

    canvas.toBlob(
      blob => {
        this._frames[target] = blob;

        if (this._onFrame) {
          this._onFrame(blob, this._frames.length);
        }

        this.checkIfFinishNeeded();
      },
      'image/png'
    );
  }

  async convert() {
    const buffers = await Promise.all(
      this._frames
        .map(blob => blob.arrayBuffer())
    )

    const result = await this.ffmpegRequest({
      arguments: [
        '-r', String(this._frameRate),
        '-i', 'img%05d.png',

        '-preset', 'ultrafast',

        '-vcodec', 'libx264', '-crf', '28', '-pix_fmt', 'yuv420p',

        'out.mp4'
      ],
      MEMFS: buffers.map((buffer, index) => {
        const number = String(index).padStart(5, '0');
        return {
          name: `img${number}.png`,
          data: buffer
        };
      }),
      TOTAL_MEMORY: 512 * (/* MB */ 1024 * 1024)
    });

    const output = result.MEMFS[0].data;
    const blob = new Blob([ output ], { type: 'video/mp4' });

    this._worker.terminate();

    return blob;
  }

  stopRecording() {
    this._renderFinished = true;
    this.checkIfFinishNeeded();
  }
}

class RecordingManager extends Component {
  constructor(...args) {
    super(...args);

    this._fileRef = createRef();

    this.state = {
      step: 0,

      world: null,
      rec: null
    }

    this._curUrl = null;

    this._handleFrame = (blob, count) => {
      this.setState({
        frameCount: count,
        frameBlob: blob
      });
    }

    this._handleConverting = () => {
      this.setState({
        step: 2,
        frameBlob: null
      });
    }

    this._handleFinished = (err, blob) => {
      if (err) {
        console.error(err);
        alert(err);
        return;
      }

      this.setState({
        step: 3,
        videoUrl: URL.createObjectURL(blob)
      });
    }

    this.importWorld = () => {
      const e = this._fileRef.current;
      if (!e) {
        return;
      }

      e.click();
    }

    this.handleWorldImportChange = (evt) => {
      if (!evt.target.files || evt.target.files.length !== 1) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text !== 'string') {
          alert('Invalid file type. Aborting');
          return;
        }

        const rec = new RecorderProvider(null);
        rec._onConverting = this._handleConverting;
        rec._onFinished = this._handleFinished;
        rec._onFrame = this._handleFrame;

        try {
          const world = JSON.parse(text);

          this.setState({
            world,
            step: 1,
            rec
          });
        } catch (ex) {
          console.error(ex);
          alert('File could not be read');
        } finally {
          evt.target.value = '';
        }
      };
      reader.readAsText(evt.target.files[0]);
    }
  }

  render() {
    const {
      step,
      rec,

      frameCount,
      frameBlob,

      videoUrl
    } = this.state;

    if (step === 1 && frameBlob) {
      if (this._curUrl) {
        URL.revokeObjectURL(this._curUrl);
        this._curUrl = null;
      }

      this._curUrl = URL.createObjectURL(frameBlob);
    }

    return (
      <div>
        <div>
          <input
            type="file"
            hidden
            ref={this._fileRef}
            onChange={this.handleWorldImportChange}
            accept="application/json"
          />
          <button type="button" onClick={this.importWorld} disabled={step > 0}>
            Import World
          </button>
        </div>

        {step === 1 && (
          <Fragment>
            <div>
              <h4>Preview:</h4>
              <div>
                Frames so far: {frameCount}
              </div>
              <img
                id="preview"
                src={this._curUrl}
              />
            </div>

            <div id="offScreen">
              <Simulation
                withTraffic
                world={world}
                stopAfter={30000}
                onStop={() => rec.stopRecording()}
                timeProvider={rec}
                renderOptions={{
                  shadow: true,
                  antialias: true
                }}
              />
            </div>
          </Fragment>
        )}

        {step === 2 && (
          <div>
            <h4>Converting to Video</h4>
            <div>
              Please wait ...
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4>Result:</h4>
            <video width="720" height="480" autoplay loop>
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <a href={videoUrl} download="output">
              Download Video
            </a>
          </div>
        )}
      </div>
    );
  }
}

function init() {
  const root = document.body;

  render(
    <RecordingManager />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});
