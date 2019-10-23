import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { LINE_ITEM_UNITS, propTypes } from '../../util/types';
import moment from 'moment';

import css from './BookingBreakdown.css';

const LineItemUnitsMaybe = props => {
  const { transaction, unitType, isDate } = props;

  if (unitType !== LINE_ITEM_UNITS) {
    return null;
  }

  //take day:
  const startDate = (transaction.booking.attributes.displayStart||transaction.booking.attributes.start);
  const endDate = (transaction.booking.attributes.displayEnd||transaction.booking.attributes.end);

  const timeDiff = moment(endDate).diff(moment(startDate));
  const timeDuration = timeDiff ? moment.duration(timeDiff) : null;
  const days = timeDuration 
    ? timeDuration.get("hours") !== 0 || timeDuration.get("minutes") !== 0
      ? timeDuration.get("days") + 1 
      : timeDuration.get("days")
    : null;      

  const unitPurchase = transaction.attributes.lineItems.find(
    item => item.code === unitType && !item.reversal
  );

  if (!unitPurchase) {
    throw new Error(`LineItemUnitsMaybe: lineItem (${unitType}) missing`);
  }

  //const quantity = unitPurchase.quantity;
  const quantity = unitPurchase.quantity;
  const numberPerson = quantity/days;  

  if(!isDate){
    return (
      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <FormattedMessage id="BookingBreakdown.quantityUnit" />
        </span>
        <span className={css.itemValue}>
          <FormattedMessage id="BookingBreakdown.quantity" values={{ quantity:numberPerson }} />
        </span>
      </div>
    );
  } else {    
    return (
      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <FormattedMessage id="BookingBreakdown.numberDayUnit" />
        </span>
        <span className={css.itemValue}>
          <FormattedMessage id="BookingBreakdown.numberDay" values={{ numberDay:days }} />
        </span>
      </div>
    );
  }
};

LineItemUnitsMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
  unitType: propTypes.bookingUnitType.isRequired,
};

export default LineItemUnitsMaybe;
