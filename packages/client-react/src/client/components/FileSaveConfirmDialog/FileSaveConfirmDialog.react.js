import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Dialog from '../Dialog';

const propTypes = {
  headerText: PropTypes.string,
  messageText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  submitButtonText: PropTypes.string,
  onHide: PropTypes.func,
  onSubmit: PropTypes.func
};
const defaultProps = {
  headerText: 'Save modifed file?',
  messageText: null,
  cancelButtonText: 'Cancel',
  submitButtonText: 'Yes',
  onHide: () => {},
  onSubmit: () => {},
  onIgnore: () => {}
};

export default
class FileSaveConfirmDialog extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.ref) {
      this.ref.focus();
    }
  }

  handleKeyDown = async (e) => {
    if (e.which === 13) { // Enter key
      this.handleSubmit();
    }
  };

  handleCancel = async () => {
    this.props.onHide();
  };

  handleSubmit = async () => {
    this.props.onSubmit();
  };

  handleIgnore = async () => {
    this.props.onIgnore();
  };

  render() {
    const { onHide, headerText, messageText, submitButtonText, cancelButtonText } = this.props;

    return (
      <Dialog onHide={onHide}>
        <div
          tabIndex="0"
          ref={ref => (this.ref = ref)}
          className="oc-fm--dialog__content" onKeyDown={this.handleKeyDown}
        >
          <div className="oc-fm--dialog__header">
            {headerText}
          </div>

          {messageText && (
            <div className="oc-fm--dialog__message">{messageText}</div>
          )}

          <div className="oc-fm--dialog__horizontal-group oc-fm--dialog__horizontal-group--to-right">
            <button
              type="button"
              className={`oc-fm--dialog__button oc-fm--dialog__button--primary`}
              onClick={this.handleSubmit}
            >
              {submitButtonText}
            </button>
            <button
              type="button"
              className={`oc-fm--dialog__button oc-fm--dialog__button--default`}
              onClick={this.handleIgnore}
            >
              No
            </button>                      
            <button
              type="button"
              className="oc-fm--dialog__button oc-fm--dialog__button--default"
              onClick={this.handleCancel}
            >
              {cancelButtonText}
            </button>
          </div>
        </div>
      </Dialog>
    );
  }
}

FileSaveConfirmDialog.propTypes = propTypes;
FileSaveConfirmDialog.defaultProps = defaultProps;
