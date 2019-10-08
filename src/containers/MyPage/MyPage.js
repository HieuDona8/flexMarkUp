import React from 'react';
import { StaticPage, TopbarContainer } from '../../containers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
  ExternalLink,  
} from '../../components';

import { MyBookingForm } from '../../forms';

import css from './MyPage.css';
import image from './img/konami-contra.jpg';

const MyPage = () => {
  return (
    <StaticPage
      className={css.root}
      title="My Page"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'My Page',
        description: 'Description of this page',
        name: 'My page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <img src={image} alt="My first ice cream." />

          <div className={css.bookRoom}>
            <div className={css.bookContent}>
              <div className={css.fromBook}>
                <MyBookingForm className={css.inputBook}>
                  
                </MyBookingForm>
              </div>
              
              <div className={css.detailPrice}>
                
              </div>
            </div>
          </div>


        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default MyPage;