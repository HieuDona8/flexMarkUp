import React, { Component } from 'react';
import { string, bool, arrayOf } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { 
  required, 
  bookingDatesRequired, 
  composeValidators, 
  bookingDateRequired,
  bookingPerson,
} from '../../util/validators';
import { createTimeSlots } from '../../util/test-data';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import classNames from 'classnames';
import moment from 'moment';
import { 
  START_DATE, 
  END_DATE, 
  START_HOUR, 
  END_HOUR, 
  NUMBER_PERSON
} from '../../util/dates';
import { propTypes } from '../../util/types';
import config from '../../config';
import { 
  Form, 
  PrimaryButton, 
  FieldSelect, 
  FieldDateInput, 
  FieldTextInput 
} from '../../components';
import EstimatedBreakdownMaybe from './EstimatedBreakdownMaybe';


import css from './BookingDatesForm.css';

const identity = v => v;

const createAvailableTimeSlots = dayCount => {
  const slots = createTimeSlots(new Date(), dayCount);
  return slots;
};

export class BookingDatesFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { focusedInput: null };
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.onFocusedInputChange = this.onFocusedInputChange.bind(this);

    this.startValue = null;
  }

  // Function that can be passed to nested components
  // so that they can notify this component when the
  // focused input changes.
  onFocusedInputChange(focusedInput) {
    this.setState({ focusedInput });
  }

  // In case start or end date for the booking is missing
  // focus on that input, otherwise continue with the
  // default handleSubmit function.
  handleFormSubmit(e) {
    const { startDate, endDate, hourStart, hourEnd, numberPerson } = e || {};
    if (!startDate) {          
      this.setState({ focusedInput: START_DATE });
      return false;
    } else if (!endDate) {      
      this.setState({ focusedInput: END_DATE });
      return false;
    } else if (!hourStart) {      
      this.setState({ focusedInput: START_HOUR });
      return false;
    } else if (!hourEnd) {    
      this.setState({ focusedInput: END_HOUR });
      return false;
    } else if (!numberPerson) {    
      this.setState({ focusedInput: NUMBER_PERSON });
      return false;
    }else {      
      // //set time of day => 0
      if( startDate && endDate ){          
        startDate.date.setHours(0,0);
        endDate.date.setHours(0,0);
      }
      //get timeDate
      const timeDiff = startDate && endDate ? moment(endDate.date).diff(moment(startDate.date)) : null;
      const timeDuration = timeDiff || timeDiff === 0 ? moment.duration(timeDiff) : null;          
      //get time          
      const timeEnd = hourEnd ? hourEnd.split(":") : null;
      const timeAddDay = timeEnd && (timeEnd[0] > 0 || timeEnd[1] > 0) ? true : false;        
      //get day:
      const days = timeDuration ? timeAddDay ? timeDuration.get("days") + 1 : timeDuration.get("days")  : null;           
      //daysBetween(startDate.date, endDate.date) : null;
      const quantity = numberPerson && days ? numberPerson*days : null;          
      //move time too date          
      if( quantity ){
        const timeStart = hourStart.split(":");
        const timeEnd = hourEnd.split(":");
        startDate.date.setHours(Number(timeStart[0]),Number(timeStart[1]));
        endDate.date.setHours(Number(timeEnd[0]),Number(timeEnd[1]));
      }

      const values ={ ...e, quantity };
      this.props.onSubmit(values);
    }
  }

  render() {
    const { rootClassName, className, price: unitPrice, isFirstBooking, ...rest } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    if (!unitPrice) {
      return (
        <div className={classes}>
          <p className={css.error}>
            <FormattedMessage id="BookingDatesForm.listingPriceMissing" />
          </p>
        </div>
      );
    }
    if (unitPrice.currency !== config.currency) {
      return (
        <div className={classes}>
          <p className={css.error}>
            <FormattedMessage id="BookingDatesForm.listingCurrencyInvalid" />
          </p>
        </div>
      );
    }

    return (
      <FinalForm
        {...rest}
        unitPrice={unitPrice}        
        onSubmit={this.handleFormSubmit}
        render={fieldRenderProps => {
          const {           
            handleSubmit,
            intl,
            isOwnListing,
            submitButtonWrapperClassName,
            unitPrice,
            unitType,
            values,            
            fetchTimeSlotsError,
            timeSlots,
            form
          } = fieldRenderProps;
          const { startDate, endDate, hourStart, hourEnd, numberPerson } = values && values.startDate && values.hourStart && values.hourEnd ? values : {};
                            
          // EDIT DATE
          //INPUT startDate FIRST (don't have endDate)
          if(values.startDate && moment(values.startDate.date,"MM DD YYYY h:mm:ss", true).isValid() && !values.endDate){                  
            form.change("endDate", { date: new Date(moment(values.startDate.date).add(1, "days")) });
            this.startValue = moment(values.startDate.date).diff(moment(), "days");                        
          }

          //INPUT endDay FIRST
          if (!values.startDate && values.endDate && moment(values.endDate.date,"MM DD YYYY h:mm:ss", true).isValid()) {
            //nếu endDay <= curent => reset startDay và endDay else startDay < endDay 1 ngày
            if (moment(values.endDate.date).diff(moment(), "days") <= 0) {
              form.change("startDate", { date: new Date(moment()) });
              form.change("endDate", { date: new Date(moment().add(1, "days")) });      
              //this.startValue = moment(values.startDate.date).diff(moment(), "days")
              //values.endDate is still curent day:
              this.startValue = moment(values.endDate.date).diff(moment(), "days");              
            } else {
              //subtract 1 day form endDate to startDay
              form.change("startDate", { date: new Date(moment(values.endDate.date).subtract(1, "days")) });
              this.startValue = moment(values.endDate.date).subtract(1, "days").diff(moment(), "days");                           
            }
          }

          //NOT update HAVE startDate, endDate AND start - end =>0; = 0 BECAUSE booking by time
          if (values.startDate && values.endDate && moment(values.startDate.date).diff(moment(values.endDate.date), "days") > 0) {
            const myStarCur = moment(values.startDate.date).diff(moment(), "days");
            //end sub => update start
            if(myStarCur === this.startValue){
              form.change("startDate", { date: new Date(moment(values.endDate.date)) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days");              
            } else{
              //start plus => update end
              form.change("endDate", { date: new Date(moment(values.startDate.date).add(1, "days")) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days");              
            }
          }


          //EIDT TIME
          const hourStartPlaceholder = intl.formatMessage({ id: 'BookingDatesForm.hourStartPlaceholder' });
          const HOUR_FORMAT = 'hh:mm a';         

          const generateHourOptions = (date, startTime, endTime) => {
            let options = [];
            for(let i = startTime.hour; i <= endTime.hour; i++) {
              // e.g. 00:30 ... 22:30.
              const getHour = i >= 10 ? i : `0${i}`;
              const halfHour24 = `${getHour}:30`;
              //the same code to do: const halfHour24 = `${i >= 10 ? i : `0${i}`}:30`;
              const halfHourHuman = date
                .clone()
                .add(i, 'hours')
                .add(30, 'minutes')
                .format(HOUR_FORMAT);

              const optionHalfHour = (
                <option key={halfHour24} value={halfHour24}>
                  {halfHourHuman}
                </option>
              );

              // 00:00 ... 24:00. 24:00 will be converted to the next day 00:00.
              const getSharpHour = i >= 10 ? i : `0${i}`;
              const sharpHour24 = `${getSharpHour}:00`; 

              //const sharpHour24 = `${i >= 10 ? i : `0${i}`}:00`;
              const sharpHourHuman = date.clone().add(i, 'hours').format(HOUR_FORMAT);
            
              const optionSharpHour = (
                <option key={sharpHour24} value={sharpHour24}>
                  {sharpHourHuman}
                </option>
              );

              const startsOnHalfHour = i === startTime.hour && startTime.minute === 30;
              const endsOnSharpHour = i === endTime.hour && endTime.minute === 0;

              // Define order in the option array
              if (startsOnHalfHour) {
                // e.g. ['00:30']
                options.push(optionHalfHour);
              } else if (endsOnSharpHour) {
                // e.g. ['21:00']
                options.push(optionSharpHour);
              } else {
                // e.g. ['01:00', '01:30']
                options.push(optionSharpHour);
                options.push(optionHalfHour);
              }
            }
            return options;
          };
          
          //config lable
          const bookingStartLabel = intl.formatMessage({ id: 'BookingDatesForm.bookingStartTitle' });
          const bookingEndLabel = intl.formatMessage({ id: 'BookingDatesForm.bookingEndTitle' });
          const bookingTimeStartLabel = intl.formatMessage({ id: 'BookingDatesForm.bookingTimeStartTitle' });
          const bookingTimeEndLabel = intl.formatMessage({ id: 'BookingDatesForm.bookingTimeEndTitle' });
          const bookingNumberPerson = intl.formatMessage({ id: 'BookingDatesForm.bookingNumberPerson' });
         
          const timeSlotsError = fetchTimeSlotsError ? (
            <p className={css.timeSlotsError}>
              <FormattedMessage id="BookingDatesForm.timeSlotsError" />
            </p>
          ) : null;

          // This is the place to collect breakdown estimation data. See the
          // EstimatedBreakdownMaybe component to change the calculations
          // for customized payment processes.

          //the same day but time
          if(startDate && endDate && hourStart && hourEnd){
            const timeStart = hourStart.split(":");
            const timeEnd = hourEnd.split(":");
            if(moment(startDate.date).diff(moment(endDate.date), "days") === 0 &&
              (timeStart[0] > timeEnd[0] || ( timeStart[0] === timeEnd[0] && 
              timeStart[1] > timeEnd[1])))
            {
              const timeStart = hourStart.split(":");
              const hour = (parseInt(timeStart[0])+1).toString();
              const hourValue = hour.length === 2 ? hour +":"+ timeStart[1] : "0" + hour + ":" + timeStart[1];
              form.change("hourEnd", hourValue);
            }
          }

          //quantity        
          //set time of day => 0
          if( startDate && endDate && 
            moment(values.startDate.date,"MM DD YYYY h:mm:ss", true).isValid() &&
            moment(values.endDate.date,"MM DD YYYY h:mm:ss", true).isValid())
          {          
            startDate.date.setHours(0,0);
            endDate.date.setHours(0,0);
          }
          //get timeDate
          const timeDiff = startDate && endDate &&
            moment(values.startDate.date,"MM DD YYYY h:mm:ss", true).isValid() && 
            moment(values.endDate.date,"MM DD YYYY h:mm:ss", true).isValid() 
            ? moment(endDate.date).diff(moment(startDate.date)) : null;

          const timeDuration = timeDiff || timeDiff === 0 ? moment.duration(timeDiff) : null;          
          //get time          
          const timeEnd = hourEnd ? hourEnd.split(":") : null;
          const timeAddDay = timeEnd && (timeEnd[0] > 0 || timeEnd[1] > 0) ? true : false;        
          //get day:
          const days = timeDuration ? timeAddDay ? timeDuration.get("days") + 1 : timeDuration.get("days")  : null;           
          //daysBetween(startDate.date, endDate.date) : null;
          const quantity = numberPerson && days ? numberPerson*days : null;          
          //move time too date          
          if( quantity ){
            const timeStart = hourStart.split(":");
            const timeEnd = hourEnd.split(":");
            startDate.date.setHours(Number(timeStart[0]),Number(timeStart[1]));
            endDate.date.setHours(Number(timeEnd[0]),Number(timeEnd[1]));
          }

          const bookingData =
            quantity && numberPerson > 0
              ? {
                unitType,
                unitPrice,
                startDate, 
                endDate,

                // NOTE: If unitType is `line-item/units`, a new picker
                // for the quantity should be added to the form.
                quantity,
              } : null;                    
          const bookingInfo = bookingData ? (
            <div className={css.priceBreakdownContainer}>
              <h3 className={css.priceBreakdownTitle}>
                <FormattedMessage id="BookingDatesForm.priceBreakdownTitle" />
              </h3>
              <EstimatedBreakdownMaybe bookingData={bookingData} isFirstBooking={isFirstBooking}/>
            </div>
          ) : null;

          const submitButtonClasses = classNames(
            submitButtonWrapperClassName || css.submitButtonWrapper
          );

          const classDate = classNames(css.dateBook, css.specialBook);
    
          return (
            <Form onSubmit={handleSubmit} className={classes}>
              {timeSlotsError}
              <div className={css.timeContainer}>
                <div className={css.timeItem}>
                  <FieldDateInput
                    type="date"
                    className={classDate}
                    name='startDate'
                    useMobileMargins={false}
                    id="startBookingDate"
                    label={bookingStartLabel}
                    placeholderText={moment().format('DD/MM/YYYY')}     
                    format={identity}
                    validate= {composeValidators(required('Required'), bookingDateRequired('Date is not valid'))}       
                    timeSlots={createAvailableTimeSlots(90)}
                  />
                  <FieldSelect
                    className={css.hourBook}                    
                    id={"hourStart"}
                    name={"hourStart"}
                    label={bookingTimeStartLabel}
                    validate= {required('Required')}
                    parse={value => {                        
                      return value && value.length > 0 ? value : null;
                    }}
                  >
                    <option value="" disabled>
                      {hourStartPlaceholder}
                    </option>
                    {generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 })}
                  </FieldSelect>                              
                </div>
                <div className={css.timeItem}>                  
                  <FieldDateInput
                    type="date"                    
                    className={css.dateBook}
                    name='endDate'
                    useMobileMargins={false}
                    id={bookingEndLabel}     
                    label={bookingEndLabel}
                    placeholderText={moment().add(1, "day").format('DD/MM/YYYY')}
                    format={identity}
                    validate= {composeValidators(required('Required'), bookingDateRequired('Date is not valid'))}
                    timeSlots={createAvailableTimeSlots(90)}
                  />                                   
                  <FieldSelect
                    className={css.hourBook} 
                    id={"hourEnd"}
                    name={"hourEnd"}
                    label={bookingTimeEndLabel}   
                    validate= {required('Required')}
                    parse={value => {                                                
                      return value && value.length > 0 ? value : null;
                    }}
                  >
                    <option value="" disabled>
                      {hourStartPlaceholder}
                    </option>
                    {generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 })}
                  </FieldSelect>                                           
                </div>
                <div className={css.numberPerson}>
                  <FieldTextInput
                    className={css.numberPersonContent}
                    id={"numberPerson"}
                    label={bookingNumberPerson}
                    name="numberPerson"                    
                    type="number"                    
                    placeholder="0"                    
                    validate={composeValidators(required("This field is required or not valid"),bookingPerson("Person is not valid"))}                    
                  />
                </div>
              </div>

              {bookingInfo}
              <p className={css.smallPrint}>
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingDatesForm.ownListing'
                      : 'BookingDatesForm.youWontBeChargedInfo'
                  }
                />
              </p>
              <div className={submitButtonClasses}>
                <PrimaryButton type="submit">
                  <FormattedMessage id="BookingDatesForm.requestToBook" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

BookingDatesFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  price: null,
  isOwnListing: false,
  startDatePlaceholder: null,
  endDatePlaceholder: null,
  timeSlots: null,
};

BookingDatesFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  unitType: propTypes.bookingUnitType.isRequired,
  price: propTypes.money,
  isOwnListing: bool,
  timeSlots: arrayOf(propTypes.timeSlot),

  // from injectIntl
  intl: intlShape.isRequired,

  // for tests
  startDatePlaceholder: string,
  endDatePlaceholder: string,
};

const BookingDatesForm = compose(injectIntl)(BookingDatesFormComponent);
BookingDatesForm.displayName = 'BookingDatesForm';

export default BookingDatesForm;
