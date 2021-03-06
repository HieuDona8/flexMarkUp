import React from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ListingLink } from '../../components';
import { EditListingAvailabilityForm } from '../../forms';

import css from './EditListingAvailabilityPanel.css';

const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    availability,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;  

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const defaultAvailabilityPlan = {
    type: 'availability-plan/time',
    timezone: 'Asia/Ho_Chi_Minh',
    entries: [
      { dayOfWeek: 'mon', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'tue', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'wed', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'thu', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'fri', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'sat', seats: 1 , startTime: '00:00', endTime: '00:00' },
      { dayOfWeek: 'sun', seats: 1 , startTime: '00:00', endTime: '00:00' },
    ],    
  };

  const availabilityPlan = currentListing.attributes.availabilityPlan || defaultAvailabilityPlan;
  return (
    <div className={classes}>
      <h1 className={css.title}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} /> }}
          />
        ) : (
          <FormattedMessage id="EditListingAvailabilityPanel.createListingTitle" />
        )}
      </h1>
      <EditListingAvailabilityForm
        className={css.form}
        listingId={currentListing.id}
        initialValues={{ availabilityPlan }}
        availability={availability}
        availabilityPlan={availabilityPlan}
        onSubmit={() => {
          // We save the default availability plan
          // I.e. this listing is available every night.
          // Exceptions are handled with live edit through a calendar,
          // which is visible on this panel.
          onSubmit({ availabilityPlan });
        }}
        onChange={onChange}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateError={errors.updateListingError}
        updateInProgress={updateInProgress}
      />
    </div>
  );
};

EditListingAvailabilityPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingAvailabilityPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  availability: shape({
    calendar: object.isRequired,
    onFetchAvailabilityExceptions: func.isRequired,
    onCreateAvailabilityException: func.isRequired,
    onDeleteAvailabilityException: func.isRequired,
  }).isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingAvailabilityPanel;
