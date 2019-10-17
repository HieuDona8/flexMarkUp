import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { PrimaryButton } from '../../components';

import css from './TransactionPanel.css';

// Functional component as a helper to build ActionButtons for
// provider when state is preauthorized
const ActionButtonMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    stateInProgress,
    stateSaleError,
    onActionSale,
    title,
  } = props;

  const buttonsDisabled = stateInProgress ? true : false;

  const actionErrorMessage = stateSaleError ? (
    <p className={css.actionError}>
      <FormattedMessage 
        id="TransactionPanel.actionSaleFailed" 
        values = {{ title }}
      />
    </p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>        
        {actionErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        <PrimaryButton
          inProgress={stateInProgress} 
          disabled={buttonsDisabled}         
          onClick={onActionSale}
        >
          <FormattedMessage 
            id="TransactionPanel.actionButton" 
            values={{ title }}
          />
        </PrimaryButton>
      </div>
    </div>
  ) : null;
};

export default ActionButtonMaybe;
