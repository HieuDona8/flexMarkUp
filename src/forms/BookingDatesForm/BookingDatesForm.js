import React, { useState, useEffect } from 'react';
import { string, bool, arrayOf } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { 
  required, 
  bookingDatesRequired, 
  composeValidators, 
  bookingDateCheck,
  bookingPerson,
  bookingPersonBig,
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
import { createRangeDay, createNewTimeSlots ,isSameDay, generateHourOptions } from './BookingDates.help';


import css from './BookingDatesForm.css';

const identity = v => v;

const BookingDatesFormComponent = props => {
  const { rootClassName, className, price: unitPrice, isFirstBooking, timeSlots, ...rest } = props;
  const classes = classNames(rootClassName || css.root, className);

  const [focusedInput, setFocusedInput] = useState(null);
  const [timeRangeError, setTimeRangeError] = useState(null);  
  const [timeSlotsToForm, setTimeSlotsToForm] = useState(timeSlots);

  useEffect(() =>{    
    setTimeSlotsToForm(props.timeSlots);
  },[props.timeSlots]);

  let availabeDateTimeSlotsStart = null;
  let availabeDateTimeSlotsEnd = null;
  // Function that can be passed to nested components
  // so that they can notify this component when the
  // focused input changes.
  const onFocusedInputChange = (focusedInput) =>{
    setFocusedInput(focusedInput);
  };

  // In case start or end date for the booking is missing
  // focus on that input, otherwise continue with the
  // default handleSubmit function.
  const handleFormSubmit = e => {
    const { startDate, endDate, hourStart, hourEnd, numberPerson } = e || {};
    if (!startDate) {          
      setFocusedInput(START_DATE);
      return false;
    } else if (!endDate) {      
      setFocusedInput(END_DATE);      
      return false;
    } else if (!hourStart) {   
      setFocusedInput(START_HOUR);       
      return false;
    } else if (!hourEnd) {    
      setFocusedInput(END_HOUR);       
      return false;
    } else if (!numberPerson) {   
      setFocusedInput(NUMBER_PERSON);
      return false;
    }else {            
      const timeDiff = moment(endDate.date).diff(moment(startDate.date));
      const timeDuration = timeDiff ? moment.duration(timeDiff) : null;
      const days = timeDuration 
        ? timeDuration.get("hours") !== 0 || timeDuration.get("minutes") !== 0
          ? timeDuration.get("days") + 1 
          : timeDuration.get("days")
        : null;      
      const quantity = numberPerson && days ? numberPerson*days : null;
      const values ={ ...e, quantity };      
      props.onSubmit(values);
    }
  };

  //render
  //const { rootClassName, className, price: unitPrice, isFirstBooking, timeSlots, ...rest } = props;
  //const classes = classNames(rootClassName || css.root, className);
  
  const newTimeSlots = timeSlots ? createNewTimeSlots(timeSlots) : null;

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
      onSubmit={handleFormSubmit}
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
          form
        } = fieldRenderProps;
                                           
        const { startDate, endDate, hourStart, hourEnd, numberPerson } = values || {};                                      

        //config lable
        const hourStartPlaceholder = intl.formatMessage({ id: 'BookingDatesForm.hourStartPlaceholder' });
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
        //take select:
        if(startDate && moment(startDate.date,"MM DD YYYY h:mm:ss", true).isValid() && timeSlots){
          availabeDateTimeSlotsStart = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 });                                      
          //check point timeSlots
          timeSlots.some((timeSlot, index) => {
            const curentStartPoint = timeSlot.attributes.start;
            const curentEndPoint = timeSlot.attributes.end;
            
            const curentDate = new Date();
            if(isSameDay(new Date(), startDate.date) && 
              isSameDay(new Date(), curentStartPoint) && 
              (curentStartPoint.getHours() + curentStartPoint.getMinutes() < curentDate.getHours() + curentDate.getMinutes()))
            {
              const curentDate = new Date();
              const hour = curentDate.getMinutes() > 30 ? curentDate.getHours() + 1 : curentDate.getHours();
              const minute = curentDate.getMinutes() > 30 ? 0 : 30;                                            
              availabeDateTimeSlotsStart = generateHourOptions(moment().startOf('day'), { hour: hour, minute: minute }, { hour: 23, minute: 30 });
              return true;
            }
      
            const nextTimeSlot = (index +1) < timeSlots.length ? timeSlots[index+1] : null;
            const nextStartDay = nextTimeSlot ? nextTimeSlot.attributes.start : null;
            if(moment(nextStartDay).isSame(startDate.date, 'day') && moment(curentEndPoint).isSame(startDate.date, 'day')){
              const hourStart = nextStartDay.getHours();
              const minuteStart = nextStartDay.getMinutes();
              const hourEnd = curentEndPoint.getHours();
              const minuteEnd = curentEndPoint.getMinutes();    
              const arrayEnd = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: hourEnd, minute: minuteEnd });
              const arrayStart = generateHourOptions(moment().startOf('day'), { hour: hourStart, minute: minuteStart }, { hour: 23, minute: 30 });
              availabeDateTimeSlotsStart = arrayEnd.concat(arrayStart);                        
              return true;
            }
      
            if(moment(curentStartPoint).isSame(startDate.date, 'day')){
              const hour = curentStartPoint.getHours();
              const minute = curentStartPoint.getMinutes();                                            
              availabeDateTimeSlotsStart = generateHourOptions(moment().startOf('day'), { hour: hour, minute: minute }, { hour: 23, minute: 30 });                        
              return true;
            }
            
            if(moment(curentEndPoint).isSame(startDate.date, 'day')){
              const hour = curentEndPoint.getHours();
              const minute = curentEndPoint.getMinutes();                                            
              availabeDateTimeSlotsStart = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: hour, minute: minute });
              return true;
            }
          });
        } else{
          availabeDateTimeSlotsStart = null;
        }

        if(endDate && moment(endDate.date,"MM DD YYYY h:mm:ss", true).isValid() && timeSlots){                                        
          availabeDateTimeSlotsEnd = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 });                    
          //check point timeSlots
          timeSlots.some((timeSlot, index) => {
            const curentStartPoint = timeSlot.attributes.start;
            const curentEndPoint = timeSlot.attributes.end;
            const curentDate = new Date();
            if(isSameDay(new Date(), endDate.date) && 
              isSameDay(new Date(), curentStartPoint) && 
              (curentStartPoint.getHours() + curentStartPoint.getMinutes() < curentDate.getHours() + curentDate.getMinutes()))
            {
              const hour = curentDate.getMinutes() > 30 ? curentDate.getHours() + 1 : curentDate.getHours();
              const minute = curentDate.getMinutes() > 30 ? 0 : 30;                                            
              availabeDateTimeSlotsEnd = generateHourOptions(moment().startOf('day'), { hour: hour, minute: minute }, { hour: 23, minute: 30 });
              return true;
            }

            const nextTimeSlot = (index +1) < timeSlots.length ? timeSlots[index+1] : null;
            const nextStartDay = nextTimeSlot ? nextTimeSlot.attributes.start : null;
            if(moment(nextStartDay).isSame(endDate.date, 'day') && moment(curentEndPoint).isSame(endDate.date, 'day')){
              const hourStart = nextStartDay.getHours();
              const minuteStart = nextStartDay.getMinutes();
              const hourEnd = curentEndPoint.getHours();
              const minuteEnd = curentEndPoint.getMinutes();    
              const arrayEnd = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: hourEnd, minute: minuteEnd });
              const arrayStart = generateHourOptions(moment().startOf('day'), { hour: hourStart, minute: minuteStart }, { hour: 23, minute: 30 });
              availabeDateTimeSlotsEnd = arrayEnd.concat(arrayStart);                        
              return true;
            }
      
            if(moment(curentStartPoint).isSame(endDate.date, 'day')){
              const hour = curentStartPoint.getHours();
              const minute = curentStartPoint.getMinutes();                                            
              availabeDateTimeSlotsEnd = generateHourOptions(moment().startOf('day'), { hour: hour, minute: minute }, { hour: 23, minute: 30 });                        
              return true;
            }
            
            if(moment(curentEndPoint).isSame(endDate.date, 'day')){
              const hour = curentEndPoint.getHours();
              const minute = curentEndPoint.getMinutes();                                            
              availabeDateTimeSlotsEnd = generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: hour, minute: minute });                        
              return true;
            }
          });
        } else{
          availabeDateTimeSlotsEnd = null;
        }

        //move time to date
        if( startDate && endDate && hourStart && hourEnd &&
          moment(values.startDate.date,"MM DD YYYY h:mm:ss", true).isValid() && 
          moment(values.endDate.date,"MM DD YYYY h:mm:ss", true).isValid()
        ) {
          const timeStart = hourStart.split(":");
          const timeEnd = hourEnd.split(":");
          startDate.date.setHours(Number(timeStart[0]),Number(timeStart[1]));
          endDate.date.setHours(Number(timeEnd[0]),Number(timeEnd[1]));
        }

        const timeDiff = startDate && endDate && hourStart && hourEnd &&
          moment(values.startDate.date,"MM DD YYYY h:mm:ss", true).isValid() && 
          moment(values.endDate.date,"MM DD YYYY h:mm:ss", true).isValid() 
          ? moment(endDate.date).diff(moment(startDate.date)) : null;
      
        const timeDuration = timeDiff ? moment.duration(timeDiff) : null;

        const days = timeDuration 
          ? timeDuration.get("hours") !== 0 || timeDuration.get("minutes") !== 0
            ? timeDuration.get("days") + 1 
            : timeDuration.get("days")
          : null;
        
        const quantity = numberPerson && numberPerson <= 10 && numberPerson > 0 && days ? numberPerson*days : null;

        const bookingData =
          quantity && timeRangeError === null
            ? {
              unitType,
              unitPrice,
              startDate, 
              endDate,
              numberPerson,
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
            <FormSpy              
              onChange={formState => {
                const { startDate, endDate, hourStart, hourEnd } = formState.values;
                const invalidStart = startDate && startDate.date;
                const invalidEnd = endDate && endDate.date;
                let breakPoint = true;
                if(invalidStart && invalidEnd){
                  if(moment(endDate.date).diff(moment(startDate.date),"days") < 0){
                    breakPoint = false;
                    setTimeRangeError('An invalid period of time');
                  }else{
                    setTimeRangeError(null);
                  }
                } 

                if(invalidStart && invalidEnd && hourStart && hourEnd && breakPoint){
                  const timeStart = hourStart.split(":");
                  const timeEnd = hourEnd.split(":");
                  if(moment(startDate.date).isSame(endDate.date, 'day')){
                    if((timeStart[0] > timeEnd[0] || ( timeStart[0] === timeEnd[0] && timeStart[1] >= timeEnd[1]))){
                      setTimeRangeError('Invalid duration time (Equal/longer than 1 hour)');
                    } else{
                      setTimeRangeError(null);
                    }
                  }else{
                    setTimeRangeError(null);
                  }
                }
              }}
            />
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
                  validate= {composeValidators(required('Required'), bookingDateCheck('Date is not valid'))}                           
                  timeSlots={newTimeSlots}
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
                  { availabeDateTimeSlotsStart ? availabeDateTimeSlotsStart.map(time => time) : "" }
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
                  validate= {composeValidators(required('Required'), bookingDateCheck('Date is not valid'))}
                  timeSlots={newTimeSlots}
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
                  {availabeDateTimeSlotsEnd ? availabeDateTimeSlotsEnd.map(time => time) : ""}
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
                  validate={composeValidators(required("Required"),bookingPerson("Greater than or equal to 1"),bookingPersonBig('Less than or equal to 10'))}
                />
              </div>
            </div>
            <div className={css.subError}>
              {timeRangeError}
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
