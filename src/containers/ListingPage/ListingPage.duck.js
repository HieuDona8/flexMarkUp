import pick from 'lodash/pick';
import moment from 'moment';
import config from '../../config';
import { types as sdkTypes } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { denormalisedResponseEntities } from '../../util/data';
import { 
  TRANSITION_ENQUIRE,
  TRANSITION_REQUEST_FIRST_TIME, 
  TRANSITION_REQUEST, 
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_ACCEPT,
  TRANSITION_COMPLETE,
  TRANSITION_REVIEW_1_BY_CUSTOMER,
  TRANSITION_REVIEW_1_BY_PROVIDER,
  TRANSITION_REVIEW_2_BY_CUSTOMER,
  TRANSITION_REVIEW_2_BY_PROVIDER,
  TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
} from '../../util/transaction';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import { monthIdStringInUTC } from '../../util/dates';

import { fetchCurrentUser, fetchCurrentUserHasOrdersSuccess } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITAL_VALUES = 'app/ListingPage/SET_INITIAL_VALUES';

export const SHOW_LISTING_REQUEST = 'app/ListingPage/SHOW_LISTING_REQUEST';
export const SHOW_LISTING_ERROR = 'app/ListingPage/SHOW_LISTING_ERROR';

export const FETCH_REVIEWS_REQUEST = 'app/ListingPage/FETCH_REVIEWS_REQUEST';
export const FETCH_REVIEWS_SUCCESS = 'app/ListingPage/FETCH_REVIEWS_SUCCESS';
export const FETCH_REVIEWS_ERROR = 'app/ListingPage/FETCH_REVIEWS_ERROR';

export const FETCH_TIME_SLOTS_REQUEST = 'app/ListingPage/FETCH_TIME_SLOTS_REQUEST';
export const FETCH_TIME_SLOTS_SUCCESS = 'app/ListingPage/FETCH_TIME_SLOTS_SUCCESS';
export const FETCH_TIME_SLOTS_ERROR = 'app/ListingPage/FETCH_TIME_SLOTS_ERROR';

export const SEND_ENQUIRY_REQUEST = 'app/ListingPage/SEND_ENQUIRY_REQUEST';
export const SEND_ENQUIRY_SUCCESS = 'app/ListingPage/SEND_ENQUIRY_SUCCESS';
export const SEND_ENQUIRY_ERROR = 'app/ListingPage/SEND_ENQUIRY_ERROR';

// ================ Reducer ================ //

const initialState = {
  id: null,
  showListingError: null,
  reviews: [],
  fetchReviewsError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  sendEnquiryInProgress: false,
  sendEnquiryError: null,
  enquiryModalOpenForListingId: null,
  fetchFirstBookingSuccess: false,
};

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INITAL_VALUES:
      return { ...initialState, ...payload };

    case FETCH_FIRST_BOOKING_SUCCESS:
      return { ...state, fetchFirstBookingSuccess: payload, fetchFirstBookingRequest: null, fetchFirstBooingError: null };
    case FETCH_FIRST_BOOKING_REQUEST:
      return { ...state, fetchFirstBookingSuccess: null, fetchFirstBookingRequest: true, fetchFirstBooingError: null };
    case FETCH_FIRST_BOOKING_ERROR:
      return { ...state, fetchFirstBookingSuccess: null, fetchFirstBookingRequest: null, fetchFirstBooingError: payload };
    
    case SHOW_LISTING_REQUEST:
      return { ...state, id: payload.id, showListingError: null };
    case SHOW_LISTING_ERROR:
      return { ...state, showListingError: payload };

    case FETCH_REVIEWS_REQUEST:
      return { ...state, fetchReviewsError: null };
    case FETCH_REVIEWS_SUCCESS:
      return { ...state, reviews: payload };
    case FETCH_REVIEWS_ERROR:
      return { ...state, fetchReviewsError: payload };

    case FETCH_TIME_SLOTS_REQUEST:
      return { ...state, fetchTimeSlotsError: null };
    case FETCH_TIME_SLOTS_SUCCESS:
      return { ...state, timeSlots: payload };
    case FETCH_TIME_SLOTS_ERROR:
      return { ...state, fetchTimeSlotsError: payload };

    case SEND_ENQUIRY_REQUEST:
      return { ...state, sendEnquiryInProgress: true, sendEnquiryError: null };
    case SEND_ENQUIRY_SUCCESS:
      return { ...state, sendEnquiryInProgress: false };
    case SEND_ENQUIRY_ERROR:
      return { ...state, sendEnquiryInProgress: false, sendEnquiryError: payload };

    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const showListingRequest = id => ({
  type: SHOW_LISTING_REQUEST,
  payload: { id },
});

export const showListingError = e => ({
  type: SHOW_LISTING_ERROR,
  error: true,
  payload: e,
});

export const fetchReviewsRequest = () => ({ type: FETCH_REVIEWS_REQUEST });
export const fetchReviewsSuccess = reviews => ({ type: FETCH_REVIEWS_SUCCESS, payload: reviews });
export const fetchReviewsError = error => ({
  type: FETCH_REVIEWS_ERROR,
  error: true,
  payload: error,
});

export const fetchTimeSlotsRequest = () => ({ type: FETCH_TIME_SLOTS_REQUEST });
export const fetchTimeSlotsSuccess = timeSlots => ({
  type: FETCH_TIME_SLOTS_SUCCESS,
  payload: timeSlots,
});
export const fetchTimeSlotsError = error => ({
  type: FETCH_TIME_SLOTS_ERROR,
  error: true,
  payload: error,
});

export const sendEnquiryRequest = () => ({ type: SEND_ENQUIRY_REQUEST });
export const sendEnquirySuccess = () => ({ type: SEND_ENQUIRY_SUCCESS });
export const sendEnquiryError = e => ({ type: SEND_ENQUIRY_ERROR, error: true, payload: e });

// ================ Thunks ================ //

export const showListing = (listingId, isOwn = false) => (dispatch, getState, sdk) => {
  dispatch(showListingRequest(listingId));
  dispatch(fetchCurrentUser());
  const params = {
    id: listingId,
    include: ['author', 'author.profileImage', 'images'],
    'fields.image': [
      // Listing page
      'variants.landscape-crop',
      'variants.landscape-crop2x',
      'variants.landscape-crop4x',
      'variants.landscape-crop6x',

      // Social media
      'variants.facebook',
      'variants.twitter',

      // Image carousel
      'variants.scaled-small',
      'variants.scaled-medium',
      'variants.scaled-large',
      'variants.scaled-xlarge',

      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
  };

  const show = isOwn ? sdk.ownListings.show(params) : sdk.listings.show(params);

  return show
    .then(data => {
      dispatch(addMarketplaceEntities(data));
      return data;
    })
    .catch(e => {
      dispatch(showListingError(storableError(e)));
    });
};

export const fetchReviews = listingId => (dispatch, getState, sdk) => {
  dispatch(fetchReviewsRequest());
  return sdk.reviews
    .query({
      listing_id: listingId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(fetchReviewsSuccess(reviews));
    })
    .catch(e => {
      dispatch(fetchReviewsError(storableError(e)));
    });
};

const timeSlotsRequest = params => (dispatch, getState, sdk) => {
  return sdk.timeslots.query(params).then(response => {
    return denormalisedResponseEntities(response);
  });
};

export const fetchTimeSlots = listingId => (dispatch, getState, sdk) => {
  dispatch(fetchTimeSlotsRequest);

  // Time slots can be fetched for 90 days at a time,
  // for at most 180 days from now. If max number of bookable
  // day exceeds 90, a second request is made.

  const maxTimeSlots = 90;
  // booking range: today + bookable days -1
  const bookingRange = config.dayCountAvailableForBooking - 1;
  const timeSlotsRange = Math.min(bookingRange, maxTimeSlots);

  const start = moment()
    .utc()
    .startOf('day')
    .toDate();
  const end = moment()
    .utc()
    .startOf('day')
    .add(timeSlotsRange, 'days')
    .toDate();
  const params = { listingId, start, end };

  return dispatch(timeSlotsRequest(params))
    .then(timeSlots => {      
      const secondRequest = bookingRange > maxTimeSlots;      
      if (secondRequest) {
        const secondRange = Math.min(maxTimeSlots, bookingRange - maxTimeSlots);
        const secondParams = {
          listingId,
          start: end,
          end: moment(end)
            .add(secondRange, 'days')
            .toDate(),
        };
        
        return dispatch(timeSlotsRequest(secondParams)).then(secondBatch => {
          const combined = timeSlots.concat(secondBatch);          
          dispatch(fetchTimeSlotsSuccess(combined));
        });
      } else {
        dispatch(fetchTimeSlotsSuccess(timeSlots));
      }
    })
    .catch(e => {
      dispatch(fetchTimeSlotsError(storableError(e)));
    });
};

export const sendEnquiry = (listingId, message) => (dispatch, getState, sdk) => {
  dispatch(sendEnquiryRequest());
  const bodyParams = {
    transition: TRANSITION_ENQUIRE,
    processAlias: config.bookingProcessAlias,
    params: { listingId },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      const transactionId = response.data.data.id;

      // Send the message to the created transaction
      return sdk.messages.send({ transactionId, content: message }).then(() => {
        dispatch(sendEnquirySuccess());
        dispatch(fetchCurrentUserHasOrdersSuccess(true));
        return transactionId;
      });
    })
    .catch(e => {
      dispatch(sendEnquiryError(storableError(e)));
      throw e;
    });
};

//my request:
export const FETCH_BOOKINGS_REQUEST = 'app/EditListingPage/FETCH_BOOKINGS_REQUEST';
export const FETCH_BOOKINGS_SUCCESS = 'app/EditListingPage/FETCH_BOOKINGS_SUCCESS';
export const FETCH_BOOKINGS_ERROR = 'app/EditListingPage/FETCH_BOOKINGS_ERROR';


const requestAction = actionType => params => ({ type: actionType, payload: { params } });
const successAction = actionType => result => ({ type: actionType, payload: result.data });
const errorAction = actionType => error => ({ type: actionType, payload: error, error: true });

export const fetchBookingsRequest = requestAction(FETCH_BOOKINGS_REQUEST);
export const fetchBookingsSuccess = successAction(FETCH_BOOKINGS_SUCCESS);
export const fetchBookingsError = errorAction(FETCH_BOOKINGS_ERROR);

//time 2
//const isPast = date => !isInclusivelyAfterDay(date, TODAY_MOMENT);
//const isAfterEndOfRange = date => !isInclusivelyBeforeDay(date, END_OF_RANGE_MOMENT);
//const isAfterEndOfBookingRange = date => !isInclusivelyBeforeDay(date, END_OF_BOOKING_RANGE_MOMENT);
const momentToUTCDate = dateMoment =>
  dateMoment
    .clone()
    .utc()
    .add(dateMoment.utcOffset(), 'minutes')
    .toDate();

export const myRequestFetchBookings = fetchParams => (dispatch, getState, sdk) => {
  const listingId  = fetchParams;
  //caculatur: 
  //star: curDay
  //end: plus 90 day from curday
  const starMoment = moment();
  const start = momentToUTCDate(starMoment);
  const endMoment = moment().add(90, "days");
  const end = momentToUTCDate(endMoment);

  //const startMoment = isPast(monthMoment) ? TODAY_MOMENT : monthMoment;
  //const start = momentToUTCDate(startMoment);
  const state = ['pending', 'accepted'].join(',');
  // When using time-based process, you might want to deal with local dates using monthIdString
  const monthId = monthIdStringInUTC(start);

  dispatch(fetchBookingsRequest({ ...fetchParams, monthId }));

  return sdk.bookings
    .query({ listingId, start, end, state }, { expand: true })
    .then(response => {
      const bookings = denormalisedResponseEntities(response);      
      return dispatch(fetchBookingsSuccess({ data: { monthId, bookings } }));
    })
    .catch(e => {
      return dispatch(fetchBookingsError({ monthId, error: storableError(e) }));
    });
};


export const loadData = (params, search) => dispatch => {  
  const listingId = new UUID(params.id);

  const ownListingVariants = [LISTING_PAGE_DRAFT_VARIANT, LISTING_PAGE_PENDING_APPROVAL_VARIANT];
  if (ownListingVariants.includes(params.variant)) {
    return dispatch(showListing(listingId, true));
  }

  if (config.enableAvailability) {    
    return Promise.all([
      dispatch(showListing(listingId)),
      dispatch(fetchTimeSlots(listingId)),
      dispatch(fetchReviews(listingId)),
      dispatch(fetchFirstBooking()),
      dispatch(myRequestFetchBookings(listingId))
    ]);
  } else {
    return Promise.all([dispatch(showListing(listingId)), dispatch(fetchReviews(listingId))]);
  }
};

//my check first booking
export const FETCH_FIRST_BOOKING_REQUEST = 'app/ListingPage/FETCH_FIRST_BOOKING_REQUEST';
export const FETCH_FIRST_BOOKING_SUCCESS = 'app/ListingPage/FETCH_FIRST_BOOKING_SUCCESS';
export const FETCH_FIRST_BOOKING_ERROR = 'app/ListingPage/FETCH_FIRST_BOOKING_ERROR';

export const fetchFirstBookingRequest = () => ({ type: FETCH_FIRST_BOOKING_REQUEST });
export const fetchFirstBookingSuccess = result => ({ type: FETCH_FIRST_BOOKING_SUCCESS, payload: result });
export const fetchFirstBooingError = error =>  ({ type: FETCH_FIRST_BOOKING_ERROR, error: true, payload: error });


export const fetchFirstBooking =() => (dispatch, getState, sdk) =>{  
  dispatch(fetchFirstBookingRequest());
  sdk.transactions.query({
    only: "order",
    lastTransitions: [
      TRANSITION_REQUEST_FIRST_TIME, 
      TRANSITION_REQUEST, 
      TRANSITION_CONFIRM_PAYMENT,
      TRANSITION_ACCEPT,
      TRANSITION_COMPLETE,
      TRANSITION_REVIEW_1_BY_CUSTOMER,
      TRANSITION_REVIEW_1_BY_PROVIDER,
      TRANSITION_REVIEW_2_BY_CUSTOMER,
      TRANSITION_REVIEW_2_BY_PROVIDER,
      TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD,
      TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD,
      TRANSITION_EXPIRE_REVIEW_PERIOD,
    ]
  }).then(res => {
    if(res.data.data.length === 0){      
      dispatch(fetchFirstBookingSuccess(true));
    }else{
      dispatch(fetchFirstBookingSuccess(false));
    }

  }).catch(e =>{
    dispatch(fetchFirstBooingError(e));
  });
};


export const isFirstBooking =() => async(dispatch, getState, sdk) =>{
  let isFirst = false;
  await sdk.transactions.query({
    only: "order",
    lastTransitions: [
      TRANSITION_REQUEST_FIRST_TIME, 
      TRANSITION_REQUEST, 
      TRANSITION_CONFIRM_PAYMENT,
      TRANSITION_ACCEPT,
      TRANSITION_COMPLETE,
      TRANSITION_REVIEW_1_BY_CUSTOMER,
      TRANSITION_REVIEW_1_BY_PROVIDER,
      TRANSITION_REVIEW_2_BY_CUSTOMER,
      TRANSITION_REVIEW_2_BY_PROVIDER,
      TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD,
      TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD,
      TRANSITION_EXPIRE_REVIEW_PERIOD,
    ]
  }).then(res => {   
    if(res.data.data.length === 0){
      isFirst = true;
    }
  });
  
  return isFirst;
};