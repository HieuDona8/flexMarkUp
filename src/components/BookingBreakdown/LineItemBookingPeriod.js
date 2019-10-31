import React from 'react';
import { FormattedMessage, FormattedDate } from '../../util/reactIntl';
import moment from 'moment';
import { LINE_ITEM_NIGHT, DATE_TYPE_DATE, propTypes } from '../../util/types';
import { dateFromAPIToLocalNoon } from '../../util/dates';

import css from './BookingBreakdown.css';

const BookingPeriod = props => {
  const { startDate, endDate } = props;
  
  const dateFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  };

  return (
    <>
      <div className={css.bookingPeriod}>
        <div className={css.bookingPeriodSection}>
          <span className={css.dayLabel}>
            <FormattedMessage id="BookingBreakdown.bookingStart" />
          </span>          
          <span className={css.dayInfo}>
            <FormattedDate value={startDate} {...dateFormatOptions} />
          </span>
        </div>

        <div className={css.bookingPeriodSection}>
          <div className={css.dayLabel}>
            <FormattedMessage id="BookingBreakdown.bookingEnd" />
          </div>
          <div className={css.dayInfo}>
            <FormattedDate value={endDate} {...dateFormatOptions} />
          </div>          
        </div>
      </div>
    </>
  );
};

const LineItemBookingPeriod = props => {
  const { booking, unitType, dateType } = props;
  
  // Attributes: displayStart and displayEnd can be used to differentiate shown time range
  // from actual start and end times used for availability reservation. It can help in situations
  // where there are preparation time needed between bookings.
  // Read more: https://www.sharetribe.com/api-reference/#bookings
  const { start, end, displayStart, displayEnd } = booking.attributes;
  //const localStartDate = dateFromAPIToLocalNoon(displayStart || start);
  //const localEndDateRaw = dateFromAPIToLocalNoon(displayEnd || end);
  const localStartDate = (displayStart || start);
  const localEndDateRaw = (displayEnd || end);


  const isNightly = unitType === LINE_ITEM_NIGHT;
  //const endDay = isNightly ? localEndDateRaw : moment(localEndDateRaw).subtract(1, 'days');
  const endDay = localEndDateRaw;

  return (
    <>
      <div className={css.lineItem}>
        <BookingPeriod startDate={localStartDate} endDate={endDay} dateType={dateType} />
      </div>
      <hr className={css.totalDivider} />
    </>
  );
};
LineItemBookingPeriod.defaultProps = { dateType: null };

LineItemBookingPeriod.propTypes = {
  booking: propTypes.booking.isRequired,
  dateType: propTypes.dateType,
};

export default LineItemBookingPeriod;
