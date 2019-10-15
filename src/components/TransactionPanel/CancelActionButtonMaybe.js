import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { PrimaryButton } from '../../components';

import css from './TransactionPanel.css';

// Functional component as a helper to build ActionButtons for
// provider when state is preauthorized
const CancelActionButtonMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    cancelInProgress,
    cancelSaleError,
    onCancelSale,
  } = props;

  const buttonsDisabled = cancelInProgress;

  const cancelErrorMessage = cancelSaleError ? (
    <p className={css.actionError}>
      <FormattedMessage id="TransactionPanel.cancelFailed" />
    </p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {cancelErrorMessage}        
      </div>
      <div className={css.actionButtonWrapper}>        
        <PrimaryButton
          inProgress={cancelInProgress}
          disabled={buttonsDisabled}
          onClick={onCancelSale}
        >
          <FormattedMessage id="TransactionPanel.cancelButton" />
        </PrimaryButton>
      </div>
    </div>
  ) : null;
};

export default CancelActionButtonMaybe;
