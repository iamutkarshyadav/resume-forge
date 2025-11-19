import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../backend/src/trpc/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();
