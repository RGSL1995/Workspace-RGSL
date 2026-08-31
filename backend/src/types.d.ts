import 'express-session';

declare global {
  namespace Express {
    interface Request {
      session: Session & {
        userId?: string;
        userEmail?: string;
        userName?: string;
      };
    }
  }
}

declare module 'express-session' {
  interface Session {
    userId?: string;
    userEmail?: string;
    userName?: string;
  }
}
