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
  MyTransaction, //mytranstaction
  MyDate,
} from '../../components';

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


          {/* <div className={css.bookRoom}>
            <div className={css.bookContent}>
              <div className={css.fromBook}>
                <MyDate className={css.inputBook}>
                  
                </MyDate>
              </div>
              
              <div className={css.detailPrice}>
                
              </div>
            </div>
          </div> */}


          <div>
            <NamedLink className={css.changePage} name="LandingPage">Go to home page</NamedLink> or
            <ExternalLink className={css.changePage} href="https://google.com">
              &nbsp; Go to Google
            </ExternalLink>
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