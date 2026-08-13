import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './SigninDialog.less';
import Dialog from '../Dialog';

const propTypes = {
  cancelButtonText: PropTypes.string,
  headerText: PropTypes.string,
  messageText: PropTypes.string,
  usernameLabelText: PropTypes.string,
  passwordLabelText: PropTypes.string,
  initalUsernameValue: PropTypes.string,
  onChange: PropTypes.func,
  onHide: PropTypes.func,
  onSubmit: PropTypes.func,
  onValidate: PropTypes.func,
  submitButtonText: PropTypes.string,
  lockedMessageText: PropTypes.string,
  lockStorageKeyPrefix: PropTypes.string
};
const defaultProps = {
  cancelButtonText: 'Clear',
  headerText: 'Sign in',
  messageText: '',
  usernameLabelText: 'Username:',
  passwordLabelText: 'Password:',
  initalUsernameValue: '',
  initalPasswordValue: '',
  onChange: () => {},
  onHide: () => {},
  onSubmit: () => {},
  onValidate: () => {},
  submitButtonText: 'Sign in',
  lockedMessageText: 'Too many failed attempts. Please try again in {time}.',
  lockStorageKeyPrefix: 'oc-fm.signin.lockedUntil.',
};

export default
class SigninDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: props.initalUsernameValue,
      password: props.initalPasswordValue,
      validationError: null,
      valid: false,
      lockedUntil: 0,   // Zeitstempel in ms, 0 = nicht gesperrt
      tick: 0           // erzwingt das sekündliche Neuzeichnen des Countdowns
    };
  }

  componentDidMount() {
    this._isMounted = true;
    const until = this.readStoredLock(this.state.username);
    if (until) {
      this.setState({ lockedUntil: until });
      this.startTicker();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.stopTicker();
  }

  handleChange = async (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });

    if (name === 'username') {
      const until = this.readStoredLock(value);
      this.setState({ lockedUntil: until });
      if (until) {
        this.startTicker();
      } else {
        this.stopTicker();
      }
    }

    const validationError = await this.props.onValidate(value);
    if (this._isMounted) {
      this.setState({ validationError, valid: !validationError });
    }
  }

  handleKeyDown = async (e) => {
    if (e.which === 13) { // Enter key
      if (!this.isLocked() && !this.state.validationError && this.state.username) {
        this.handleSubmit();
      }
    }
  }

  handleSubmitButtonClick = async (e) => {
    if (!this.isLocked() && !this.state.validationError && this.state.username) {
      this.handleSubmit();
    }
  }

  handleSubmit = async () => {
    if (this.isLocked()) return;

    const result = await this.props.onSubmit(this.state.username, this.state.password);
    if (!this._isMounted) return;

    if (result && typeof result === 'object' && result.locked) {
      this.applyLock(this.state.username, result.retryAfterMs);
      return;
    }

    if (result) {
      this.setState({ validationError: result });
    }
  }

  handleFocus = (e) => {
    // Move caret to the end
    const tmpValue = e.target.value;
    e.target.value = ''; // eslint-disable-line no-param-reassign
    e.target.value = tmpValue; // eslint-disable-line no-param-reassign
  }
  
  storageKey = (username) => (
    this.props.lockStorageKeyPrefix + String(username || '').toLowerCase()
  )

  readStoredLock = (username) => {
    try {
      const value = window.localStorage.getItem(this.storageKey(username));
      const until = parseInt(value, 10);
      if (!until || until <= Date.now()) {
        if (value !== null) window.localStorage.removeItem(this.storageKey(username));
        return 0;
      }
      return until;
    } catch (err) {
      return 0;   // localStorage nicht verfügbar -> nur In-Memory-Sperre
    }
  }

  writeStoredLock = (username, until) => {
    try {
      window.localStorage.setItem(this.storageKey(username), String(until));
    } catch (err) {
      // bewusst ignoriert: die verbindliche Sperre steht im Server
    }
  }

  startTicker = () => {
    if (this.ticker) return;
    this.ticker = setInterval(() => {
      if (!this._isMounted) return;
      if (this.state.lockedUntil && this.state.lockedUntil <= Date.now()) {
        this.stopTicker();
        this.setState({ lockedUntil: 0, validationError: null });
        return;
      }
      this.setState(prev => ({ tick: prev.tick + 1 }));
    }, 1000);
  }

  stopTicker = () => {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  applyLock = (username, retryAfterMs) => {
    const until = Date.now() + (retryAfterMs || 0);
    this.writeStoredLock(username, until);
    this.setState({ lockedUntil: until, password: '', validationError: null });
    this.startTicker();
  }

  isLocked = () => this.state.lockedUntil > Date.now()

  render() {

    const {
      onHide,
      headerText,
      usernameLabelText,
      passwordLabelText,
      messageText,
      submitButtonText,
      cancelButtonText,
      lockedMessageText
    } = this.props;
    const { username, password, validationError, valid, lockedUntil } = this.state;

    // --- Sperre und Countdown ---
    const locked = lockedUntil > Date.now();
    const remainingSec = locked ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;
    const mm = ('0' + Math.floor(remainingSec / 60)).slice(-2);
    const ss = ('0' + (remainingSec % 60)).slice(-2);

    // Im Sperrfall verdrängt die Sperrmeldung die normale Fehlermeldung.
    const displayedError = locked ?
      lockedMessageText.replace('{time}', mm + ':' + ss) :
      validationError;

    const showValidationErrorElement = typeof displayedError === 'string' && displayedError;
    const validationErrorElement = (
      <div
        className={`
          oc-fm--dialog__validation-error
          ${showValidationErrorElement ? '' : 'oc-fm--dialog__validation-error--hidden'}
        `}
      >
        {displayedError || <span>&nbsp;</span>}
      </div>
    );

    return (
      <Dialog onHide={onHide}>
        <div className="oc-fm--dialog__content" onKeyDown={this.handleKeyDown}>
          <div className="oc-fm--dialog__header">
            {headerText}
          </div>

          {messageText && (
            <div className="oc-fm--dialog__message">{messageText}</div>
          )}

          {usernameLabelText && (
            <div className="oc-fm--dialog__input-label">{usernameLabelText}</div>
          )}

          <input
            spellCheck={false}
            className={`
              oc-fm--dialog__input
              oc-fm--dialog__input--margin-bottom
              ${displayedError ? 'oc-fm--dialog__input--error' : ''}
            `}
            name="username"
            value={username}
            disabled={locked}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
          />

          {passwordLabelText && (
            <div className="oc-fm--dialog__input-label">{passwordLabelText}</div>
          )}

          <input
            type="password"
            spellCheck={false}
            className={`
              oc-fm--dialog__input
              oc-fm--dialog__input--margin-bottom
              ${displayedError ? 'oc-fm--dialog__input--error' : ''}
            `}
            name="password"
            value={password}
            disabled={locked}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
          />
          {validationErrorElement}

          <div className="oc-fm--dialog__horizontal-group oc-fm--dialog__horizontal-group--to-right">
            <button type="button" className="oc-fm--dialog__button oc-fm--dialog__button--default" onClick={onHide}>
              {cancelButtonText}
            </button>
            <button
              type="button"
              className={`oc-fm--dialog__button oc-fm--dialog__button--primary`}
              onClick={this.handleSubmitButtonClick}
              disabled={!valid || locked}
            >
              {submitButtonText}
            </button>
          </div>
        </div>
      </Dialog>
    );
  }
}

SigninDialog.propTypes = propTypes;
SigninDialog.defaultProps = defaultProps;
