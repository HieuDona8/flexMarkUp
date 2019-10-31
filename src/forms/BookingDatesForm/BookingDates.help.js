import React, { Component }  from 'react';
import { DEFAULT_TIME_ZONE } from "../../util/types";
import moment from 'moment';

export const isSameDay = (localDay, daySlot) =>{   
  const allFormat = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: DEFAULT_TIME_ZONE
  };

  const formatter = new Intl.DateTimeFormat('default', allFormat);
  return formatter.format(localDay) === formatter.format(daySlot) ? true : false;
}

export const getCurrentDateStringInDesiredTimezone = ({ date, timezone }) => {
  const dateString = date.toString();
  const timezoneOptions = {
    day: 'numeric',
    timeZone: timezone,
    timeZoneName: 'short'
  };

  const timeFormater = new Intl.DateTimeFormat('en-US', timezoneOptions);
  const formatDate = timeFormater.format(new Date(dateString));

  const desiredTimezoneGMT = formatDate.split(', ')[1];
  const splitedDateString = dateString.split(' ');
  const finalStr = splitedDateString.map(str => {
    if (str.includes('GMT')) {
      return desiredTimezoneGMT;
    }
    return str;
  })
  return new Date(finalStr.join(' '));
};

export const createNewTimeSlots = timeSlots => { 
  
  const arrTimeSlot = [];
  timeSlots.forEach((timeSlot, index) => {        

    const curentStartDay = timeSlot.attributes.start;
    const curentEndDay = timeSlot.attributes.end;        

    const timeDiff = moment(curentEndDay).diff(moment(curentStartDay),"days");

    if((curentEndDay.getHours()+curentEndDay.getMinutes())===0){
      for(let i = 0 ;i < timeDiff; i++){
        const start = new Date(moment(curentStartDay).startOf('day').add(i, "days"));
        const end = new Date(moment(curentStartDay).add(i, "days"));
        const attributes = { start, end, seats: 1, type: "time-slot/time" };
        const result = { attributes, id: "myid", type: "timeSlot" };
        arrTimeSlot.push(result);
      }
    }else{
      for(let i = 0 ;i <= timeDiff; i++){
        const start = new Date(moment(curentStartDay).startOf('day').add(i, "days"));
        const end = new Date(moment(curentStartDay).add(i, "days"));
        const attributes = { start, end, seats: 1, type: "time-slot/time" };
        const result = { attributes, id: "myid", type: "timeSlot" };
        arrTimeSlot.push(result);
      }
    }
  });   
  return arrTimeSlot;   
};

//function check point start or end belong timeSlots (extension code)
export const isHaveTimeBooked = (timeSlots, startDate, endDate, hourStart, hourEnd) => {
  //find point end
  timeSlots.some((timeSlot, index) => {    
    const curentEndDay = timeSlot.attributes.end;
    const nextTimeSlot = (index +1) < timeSlots.length ? timeSlots[index+1] : null;
    const nextStartDay = nextTimeSlot ? nextTimeSlot.attributes.start : null;
    if(moment(curentEndDay).isSame(startDate, 'day')){
      const hourBookedEnd = curentEndDay.getHours();
      const minuteBookedEnd = curentEndDay.getMinutes();
    }
  });
  return false;
};

export const createRangeDay = (startDate, endDate) =>{
  const timeDiff = moment(endDate).diff(moment(startDate),"days");
  const arrDate = [];
  for(let i = 0; i <= timeDiff; i++){
    const date = new Date(moment(startDate).add(i, "days"));
    arrDate.push(date);
  }
  return arrDate;
};

//EIDT TIME
const HOUR_FORMAT = 'hh:mm a';         
export const generateHourOptions = (date, startTime, endTime) => {
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