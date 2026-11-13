import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import NextError, { type ErrorProps } from 'next/error';


/** Pages Router error page: Next's default UI, plus a Sentry report of the error that led here. */
function ErrorPage(props: ErrorProps) {
  return <NextError statusCode={props.statusCode} />;
}

ErrorPage.getInitialProps = async (context: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(context);
  return NextError.getInitialProps(context);
};

export default ErrorPage;
