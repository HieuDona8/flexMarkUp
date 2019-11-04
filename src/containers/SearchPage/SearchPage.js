import React, { useState } from 'react';
import { array, bool, func, number, oneOf, object, shape, string } from 'prop-types';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import debounce from 'lodash/debounce';
import unionWith from 'lodash/unionWith';
import classNames from 'classnames';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { parse, stringify } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { SearchMap, ModalInMobile, Page } from '../../components';
import { TopbarContainer } from '../../containers';

import { searchListings, searchMapListings, setActiveListing } from './SearchPage.duck';
import {
  pickSearchParamsOnly,
  validURLParamsForExtendedData,
  validFilterParams,
  createSearchResultSchema,
} from './SearchPage.helpers';
import MainPanel from './MainPanel';
import css from './SearchPage.css';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 12 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 24;
const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout
const SEARCH_WITH_MAP_DEBOUNCE = 300; // Little bit of debounce before search is initiated.

const SearchPageComponent = props => {
  const [isSearchMapOpenOnMobile, setIsSearchMapOpenOnMobile] = useState(props.tab === 'map');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isOpenMap, setIsOpenMap] = useState(true);  

  const openMap = ()=>{
    setIsOpenMap(!isOpenMap);
  };

  const filters= ()=> {
    const {
      categories,
      amenities,
      priceFilterConfig,
      dateRangeFilterConfig,
      keywordFilterConfig,
      capacityOptions,
    } = props;

    return {
      capacityFilter: {
        paramName: 'pub_capacity',
        options: capacityOptions,
      },
      categoryFilter: {
        paramName: 'pub_category',
        options: categories,
      },
      amenitiesFilter: {
        paramName: 'pub_amenities',
        options: amenities,
      },
      priceFilter: {
        paramName: 'price',
        config: priceFilterConfig,
      },
      dateRangeFilter: {
        paramName: 'dates',
        config: dateRangeFilterConfig,
      },
      keywordFilter: {
        paramName: 'keywords',
        config: keywordFilterConfig,
      },
    };
  };


  const onMapMoveEnd = debounce( (viewportBoundsChanged, data)=> {
    const { viewportBounds, viewportCenter } = data;

    const routes = routeConfiguration();
    const searchPagePath = pathByRouteName('SearchPage', routes);
    const currentPath =
      typeof window !== 'undefined' && window.location && window.location.pathname;

    // When using the ReusableMapContainer onMapMoveEnd can fire from other pages than SearchPage too
    const isSearchPage = currentPath === searchPagePath;

    // If mapSearch url param is given
    // or original location search is rendered once,
    // we start to react to "mapmoveend" events by generating new searches
    // (i.e. 'moveend' event in Mapbox and 'bounds_changed' in Google Maps)
    if (viewportBoundsChanged && isSearchPage) {
      const { history, location } = props;

      // parse query parameters, including a custom attribute named category
      const { address, bounds, mapSearch, ...rest } = parse(location.search, {
        latlng: ['origin'],
        latlngBounds: ['bounds'],
      });

      //const viewportMapCenter = SearchMap.getMapCenter(map);
      const originMaybe = config.sortSearchByDistance ? { origin: viewportCenter } : {};

      const searchParams = {
        address,
        ...originMaybe,
        bounds: viewportBounds,
        mapSearch: true,
        ...validFilterParams(rest,filters()),
      };

      history.push(createResourceLocatorString('SearchPage', routes, {}, searchParams));
    }
  }, SEARCH_WITH_MAP_DEBOUNCE);

  // Invoked when a modal is opened from a child component,
  // for example when a filter modal is opened in mobile view
  function onOpenMobileModal() {
    setIsMobileModalOpen(true);
  }

  // Invoked when a modal is closed from a child component,
  // for example when a filter modal is opened in mobile view
  function onCloseMobileModal() {
    setIsMobileModalOpen(false);    
  }

  
  const {
    intl,
    listings,
    location,
    mapListings,
    onManageDisableScrolling,
    pagination,
    scrollingDisabled,
    searchInProgress,
    searchListingsError,
    searchParams,
    activeListingId,
    onActivateListing,
  } = props;
  // eslint-disable-next-line no-unused-vars
  const { mapSearch, page, ...searchInURL } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  const getFilters = filters();

  // urlQueryParams doesn't contain page specific url params
  // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
  const urlQueryParams = pickSearchParamsOnly(searchInURL, getFilters);

  // Page transition might initially use values from previous search
  const urlQueryString = stringify(urlQueryParams);
  const paramsQueryString = stringify(pickSearchParamsOnly(searchParams, getFilters));
  const searchParamsAreInSync = urlQueryString === paramsQueryString;

  const validQueryParams = validURLParamsForExtendedData(searchInURL, getFilters);

  const isWindowDefined = typeof window !== 'undefined';
  const isMobileLayout = isWindowDefined && window.innerWidth < MODAL_BREAKPOINT;
  const shouldShowSearchMap =
    !isMobileLayout || (isMobileLayout && isSearchMapOpenOnMobile);

  const onMapIconClick = () => {
    this.useLocationSearchBounds = true;
    setIsSearchMapOpenOnMobile(true);
  };

  const { address, bounds, origin } = searchInURL || {};
  const { title, description, schema } = createSearchResultSchema(listings, address, intl);

  // Set topbar class based on if a modal is open in
  // a child component
  const topbarClasses = isMobileModalOpen
    ? classNames(css.topbarBehindModal, css.topbar)
    : css.topbar;

  // N.B. openMobileMap button is sticky.
  // For some reason, stickyness doesn't work on Safari, if the element is <button>
  /* eslint-disable jsx-a11y/no-static-element-interactions */
  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      description={description}
      title={title}
      schema={schema}
    >
      <TopbarContainer
        className={topbarClasses}
        currentPage="SearchPage"
        currentSearchParams={urlQueryParams}
      />
      <div className={css.container}>
        <MainPanel
          stateOpenMap = { isOpenMap }
          handleShowMap = { openMap}
          urlQueryParams={validQueryParams}
          listings={listings}
          searchInProgress={searchInProgress}
          searchListingsError={searchListingsError}
          searchParamsAreInSync={searchParamsAreInSync}
          onActivateListing={onActivateListing}
          onManageDisableScrolling={onManageDisableScrolling}
          onOpenModal={onOpenMobileModal}
          onCloseModal={onCloseMobileModal}
          onMapIconClick={onMapIconClick}
          pagination={pagination}
          searchParamsForPagination={parse(location.search)}
          showAsModalMaxWidth={MODAL_BREAKPOINT}
          primaryFilters={{
            categoryFilter: getFilters.categoryFilter,
            amenitiesFilter: getFilters.amenitiesFilter,
            priceFilter: getFilters.priceFilter,
            dateRangeFilter: getFilters.dateRangeFilter,
            keywordFilter: getFilters.keywordFilter,
            capacityFilter: getFilters.capacityFilter,
          }}
        />
        {isOpenMap && 
          <ModalInMobile
            className={css.mapPanel}
            id="SearchPage.map"
            isModalOpenOnMobile={isSearchMapOpenOnMobile}
            onClose={() => setIsSearchMapOpenOnMobile(false)}
            showAsModalMaxWidth={MODAL_BREAKPOINT}
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <div className={css.mapWrapper}>
              {shouldShowSearchMap ? (
                <SearchMap
                  reusableContainerClassName={css.map}
                  activeListingId={activeListingId}
                  bounds={bounds}
                  center={origin}
                  isSearchMapOpenOnMobile={isSearchMapOpenOnMobile}
                  location={location}
                  listings={mapListings || []}
                  onMapMoveEnd={onMapMoveEnd}
                  onCloseAsModal={() => {
                    onManageDisableScrolling('SearchPage.map', false);
                  }}
                  messages={intl.messages}
                />
              ) : null}
            </div>
          </ModalInMobile>
        }          
      </div>
    </Page>
  );
};

SearchPageComponent.defaultProps = {
  listings: [],
  mapListings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
  tab: 'listings',
  categories: config.custom.categories,
  amenities: config.custom.amenities,
  priceFilterConfig: config.custom.priceFilterConfig,
  dateRangeFilterConfig: config.custom.dateRangeFilterConfig,
  keywordFilterConfig: config.custom.keywordFilterConfig,
  activeListingId: null,
  capacityOptions: config.custom.capacityOptions,
};

SearchPageComponent.propTypes = {
  listings: array,
  mapListings: array,
  onActivateListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onSearchMapListings: func.isRequired,
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,
  tab: oneOf(['filters', 'listings', 'map']).isRequired,
  categories: array,
  amenities: array,
  priceFilterConfig: shape({
    min: number.isRequired,
    max: number.isRequired,
    step: number.isRequired,
  }),
  dateRangeFilterConfig: shape({ active: bool.isRequired }),

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
    searchMapListingIds,
    activeListingId,
  } = state.SearchPage;
  const pageListings = getListingsById(state, currentPageResultIds);
  const mapListings = getListingsById(
    state,
    unionWith(currentPageResultIds, searchMapListingIds, (id1, id2) => id1.uuid === id2.uuid)
  );

  return {
    listings: pageListings,
    mapListings,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    searchInProgress,
    searchListingsError,
    searchParams,
    activeListingId,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onSearchMapListings: searchParams => dispatch(searchMapListings(searchParams)),
  onActivateListing: listingId => dispatch(setActiveListing(listingId)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const SearchPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(SearchPageComponent);

SearchPage.loadData = (params, search) => {
  const queryParams = parse(search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  const { page = 1, address, origin, ...rest } = queryParams;
  const originMaybe = config.sortSearchByDistance && origin ? { origin } : {};
  return searchListings({
    ...rest,
    ...originMaybe,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['author', 'images'],
    'fields.listing': ['title', 'geolocation', 'price','publicData'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.landscape-crop', 'variants.landscape-crop2x'],
    'limit.images': 1,
  });
};

export default SearchPage;
