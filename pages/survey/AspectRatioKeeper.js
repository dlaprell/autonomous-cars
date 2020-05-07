/** @jsx h */
import { h, Component } from "preact";

export default class AspectRatioKeeper extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      availableHeight: 0,
      availableWidth: 0,

      hasMeasurement: false
    };

    this._currentRef = null;

    this.updateRef = ref => {
      this._currentRef = ref;
      if (ref) {
        window.requestAnimationFrame(this.updateSizes)
      }
    };

    this.updateSizes = () => {
      if (!this._currentRef) {
        return;
      }

      const el = this._currentRef.parentNode;
      const { width, height } = el.getBoundingClientRect();

      this.setState({
        availableWidth: width,
        availableHeight: height,
        hasMeasurement: true
      });
    };

    this.onResize = () => {
      window.requestAnimationFrame(this.updateSizes);
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  render() {
    const { children, ratio } = this.props;
    let { minRatio, maxRatio } = this.props;

    if (typeof minRatio === 'undefined' && typeof maxRatio === 'undefined') {
      minRatio = ratio;
      maxRatio = ratio;
    }

    const { availableWidth, availableHeight, hasMeasurement } = this.state;

    let width = 0;
    let height = 0;

    if (hasMeasurement && availableHeight !== 0 && availableWidth !== 0) {
      const avRatio = availableWidth / availableHeight;

      if (avRatio >= minRatio && avRatio <= maxRatio) {
        width = availableWidth;
        height = availableHeight;
      } else if (avRatio > maxRatio) {
        width = availableHeight * maxRatio;
        height = availableHeight;
      } else {
        width = availableWidth;
        height = Math.pow(minRatio, -1) * availableWidth;
      }
    }

    return (
      <div
        ref={this.updateRef}
        style={{
          width,
          height
        }}
      >
        {hasMeasurement && children}
      </div>
    );
  }
}