import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    toggle: new WebSocket('ws://localhost:2525'),
    slide: new WebSocket('ws://localhost:1515'),
    toggleValue: 'off',
    slideValue: 1,
  };

  wsLog = logline => {
    console.log(logline);
  };

  setupToggleSocket = () => {
    const websocket = this.state.slide;

    websocket.onopen = () => {
      this.wsLog('----- Toggle websocket connected -----');
    };

    websocket.onmessage = event => {
      const { toggle } = JSON.parse(event.data);
      this.setState({ toggleValue: toggle });
    };

    websocket.onclose = () => {
      this.wsLog('xxxxx Toggle websocket disconnected xxxxx');
      this.setState(
        {
          slide: new WebSocket('ws://localhost:1515'),
        },
        () => {
          this.setupToggleSocket();
          this.setupSlideSocket();
        },
      );
    };
  };

  setupSlideSocket = () => {
    const websocket = this.state.toggle;

    websocket.onopen = () => {
      this.wsLog('----- Slide websocket connected -----');
    };

    websocket.onmessage = event => {
      const { slider } = JSON.parse(event.data);
      this.setState({ slideValue: slider });
    };

    websocket.onclose = () => {
      this.wsLog('xxxxx Slide websocket disconnected xxxxx');
      this.setState(
        {
          toggle: new WebSocket('ws://localhost:2525'),
        },
        () => {
          this.setupToggleSocket();
          this.setupSlideSocket();
        },
      );
    };
  };

  componentDidMount() {
    this.setupSlideSocket();
    this.setupToggleSocket();
  }

  componentWillUnmount() {
    const { toggle, slide } = this.state;
    toggle.close();
    slide.close();
  }

  render() {
    const { toggleValue, slideValue } = this.state;
    return (
      <div className="post">
        <div className="side r-side">
          <div className="post">
            <div className="item">
              <input
                type="checkbox"
                id="toggle_stocks"
                name=""
                checked={toggleValue !== 'off' ? true : false}
                onChange={event => {
                  const data = {
                    toggleStatus: event.target.checked ? 'on' : 'off',
                  };

                  return fetch('http://localhost:4000/toggle', {
                    method: 'POST', // or 'PUT'
                    body: JSON.stringify(data),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }).catch(err => {
                    console.error(err.message);
                  });
                }}
              />
              <div className="toggle">
                <label htmlFor="toggle_stocks">
                  <i />
                </label>
              </div>
            </div>
          </div>
          <div className="post">
            <h1
              style={{
                fontSize: 120,
                color: toggleValue === 'off' ? '#f1c40f' : '#9b59b6',
              }}
            >
              {toggleValue}
            </h1>
          </div>
        </div>
        <div className="side">
          <div className="post">
            <input
              type="range"
              min="1"
              max="100"
              value={slideValue}
              className="slider"
              id="myRange"
              onChange={event => {
                const data = { sliderValue: event.target.value };
                return fetch('http://localhost:3000/slide', {
                  method: 'POST', // or 'PUT'
                  body: JSON.stringify(data),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }).catch(err => console.error(err.message));
              }}
            />
          </div>
          <div className="post">
            <h1
              style={{
                fontSize: 120,
                color: slideValue === 0 ? '#e74c3c' : '#3498db',
              }}
            >
              {slideValue}
            </h1>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
