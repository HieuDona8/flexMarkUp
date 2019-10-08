import React, { Component } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import { object } from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';
import { Form, FieldDateInput, FieldSelect } from '../../components';
import moment from 'moment';
import classNames from 'classnames';
import { createTimeSlots } from '../../util/test-data';

import css from './MyBookingForm.css';


class MyBookingForm extends Component {
  constructor(props) {
    super(props);
    
    this.startValue = null;
  }  

  render() {
    const { intl } = this.props;

    const handleSubmit = value =>{
      console.log("ok",value);
    };

    const bookClass = classNames(css.dateBook, css.First);
    
    return (
      <FinalForm
        onSubmit = { handleSubmit }
        render={ formRenderProps =>{
          const { values, form } = formRenderProps;      
          const preventFormSubmit = e => e.preventDefault();

          //Edit day
          //startDate and !endDate
          if(values.startDate && !values.endDate){
            form.change("endDate", { date: new Date(moment(values.startDate.date).add(1, "days")) });
            this.startValue = moment(values.startDate.date).diff(moment(), "days")
          }

          //mới nhập endDay
          if (!values.startDate && values.endDate) {
            //endDay <= curent => reset startDay and endDay else startDay < endDay sub 1 day
            if (moment(values.endDate.date).diff(moment(), "days") <= 0) {
              form.change("startDate", { date: new Date(moment()) });
              form.change("endDate", { date: new Date(moment().add(1, "days")) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days")
            } else {
              form.change("startDate", { date: new Date(moment(values.endDate.date).subtract(1, "days")) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days")
            }
          }

          //startDate, endDate and start - end >=0
          if (values.startDate && values.endDate && moment(values.startDate.date).diff(moment(values.endDate.date), "days") > 0) {
            const myStarCur = moment(values.startDate.date).diff(moment(), "days");
            
            //update start; end<=
            if(myStarCur === this.startValue){
              form.change("startDate", { date: new Date(moment(values.endDate.date)) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days")
            } else{
              //update end; start =>
              form.change("endDate", { date: new Date(moment(values.startDate.date).add(1, "days")) });
              this.startValue = moment(values.startDate.date).diff(moment(), "days");
            }
          }

          ///////////////Config time///////////////////////
          const hourStartPlaceholder = intl.formatMessage({ id: 'BookingDatesForm.hourStartPlaceholder' });
          const HOUR_FORMAT = 'hh:mm a';         

          const getHours = dateHour => { 
            const { bookingDate, hourStart, hourEnd } = dateHour || {};

            if (!(bookingDate && bookingDate.date && hourStart && hourEnd)) {
              return 0;
            }

            const date = moment(bookingDate.date).startOf('day');
            const startMoment = moment(`${date.format('YYYY MM DD')} ${hourStart}`, 'YYYY MM DD HH:mm');
            const endMoment = moment(`${date.format('YYYY MM DD')} ${hourEnd}`, 'YYYY MM DD HH:mm');

            const duration = moment.duration(endMoment.diff(startMoment));

            return duration.asHours();
          };

          const generateHourOptions = (date, startTime, endTime) => {
            let options = [];
            for(let i = startTime.hour; i <= endTime.hour; i++) {
              // e.g. 00:30 ... 22:30.
              const halfHour24 = `${i >= 10 ? i : `0${i}`}:30`;
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
              const sharpHour24 = `${i >= 10 ? i : `0${i}`}:00`;
              const sharpHourHuman = date
                .clone()
                .add(i, 'hours')
                .format(HOUR_FORMAT);

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
          
          return(
            <Form onSubmit={preventFormSubmit}>          
              <div className={css.transaction}>
                <div className={css.title}>
                  <div className={css.titleMain}>
                    <span>Book Hyundai Elantra 2017</span>
                  </div>
                  <div className={css.describe}>
                    <span>Start by choosing your dates</span>
                  </div>
                </div>

                <div className={css.time}>
                  <div className={css.itemInput}>
                    <label>pick up</label>
                    <FieldDateInput
                      className={bookClass}
                      name='startDate'
                      useMobileMargins={false}
                      id="startBookingDate"
                      placeholderText={moment().format('DD/MM/YYYY')}
                    />

                  </div>
                  <div className={css.itemInput}>
                    <label>pick up time</label>                    
                    <FieldSelect
                      id={"hourStart"}
                      name={"hourStart"}
                      parse={(value, name) => {                        
                        return value && value.length > 0 ? value : null;
                      }}
                    >
                      <option value="" disabled>
                        {hourStartPlaceholder}
                      </option>
                      {generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 })}
                    </FieldSelect>
                  </div>

                  <div className={css.itemInput}>
                    <label>drop off</label>
                    <FieldDateInput
                      className={css.dateBook}
                      name='endDate'
                      useMobileMargins={false}
                      id="endBookingDate"                    
                      placeholderText={moment().add(1, "day").format('DD/MM/YYYY')}                                      
                    />
                  </div>
                  <div className={css.itemInput}>
                    <label>drop off time</label>                    
                    <FieldSelect
                      id={"hourEnd"}
                      name={"hourEnd"}
                      parse={(value, name) => {                                                
                        return value && value.length > 0 ? value : null;
                      }}
                    >
                      <option value="" disabled>
                        {hourStartPlaceholder}
                      </option>
                      {generateHourOptions(moment().startOf('day'), { hour: 0, minute: 0 }, { hour: 23, minute: 30 })}
                    </FieldSelect>
                  </div>
                </div>

              </div>
            </Form>
          );
        }
        }
      />
    );
  }

}

MyBookingForm.propTypes = {
  // from injectIntl (BookingDatesForm.js handle)
  intl: object.isRequired,
};

export default injectIntl(MyBookingForm);