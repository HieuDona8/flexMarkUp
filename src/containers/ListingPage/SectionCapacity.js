import React from 'react';
import { array, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import css from './ListingPage.css';

const SectionCapacity = props => {
  const { publicData, options } = props;
  
  // if(!publicData){
  //   return null;
  // }

  const { capacity } = publicData || {};
  const capacityOption = options.find(
    option => option.key === capacity
  );

  return capacityOption ? (
    <div className={css.sectionCapacity}>
      <h2 className={css.capacityTitle}>
        <FormattedMessage id="ListingPage.capacityTitle" />
      </h2>
      <p className={css.capacity}>{capacityOption.label}</p>
    </div>
  ) : null;
};

SectionCapacity.propTypes = {
  options: array.isRequired,
  publicData: shape({
    capacity: string,
  }).isRequired,
};

export default SectionCapacity;