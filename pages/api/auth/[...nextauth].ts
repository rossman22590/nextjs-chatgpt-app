import NextAuth from 'next-auth';
import { authOptions } from '~/server/auth/auth.config';

export { authOptions };
export default NextAuth(authOptions);
