import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

const ga4Tag = "G-VXMW3XS5BD";
const scriptSrc = `https://www.googletagmanager.com/gtag/js?id={ga4Tag}`;

const GoogleAnalytics = () => {
  useEffect(() => {
    // Inicialização do GA4
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', ga4Tag, {
      'page_title': window.location.host
    } );
  }, []);

  return (
    <Helmet>
      <script async src={scriptSrc}></script>
    </Helmet>
  );
};

export default GoogleAnalytics;
