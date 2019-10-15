import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { PrimaryButton } from '../../components';

import css from './TransactionPanel.css';

// Functional component as a helper to build ActionButtons for
// provider when state is preauthorized
const DeclineActionButtonMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    declineInProgress,
    declineSaleError,
    onDeclineSale,
  } = props;

  const declineErrorMessage = declineSaleError ? (
    <p className={css.actionError}>
      <FormattedMessage id="TransactionPanel.declineSaleFailed" />
    </p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>        
        {declineErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        <PrimaryButton
          inProgress={declineInProgress}          
          onClick={onDeclineSale}
        >
          <FormattedMessage id="TransactionPanel.declineButton" />
        </PrimaryButton>
      </div>
    </div>
  ) : null;
};

export default DeclineActionButtonMaybe;
