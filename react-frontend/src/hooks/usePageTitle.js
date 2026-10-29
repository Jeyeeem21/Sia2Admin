import { useEffect } from 'react';

const BUSINESS_NAME = 'MinSU Business Center';

export default function usePageTitle(page) {
  useEffect(() => {
    document.title = page ? `${page} | ${BUSINESS_NAME}` : BUSINESS_NAME;
    return () => { document.title = BUSINESS_NAME; };
  }, [page]);
}
