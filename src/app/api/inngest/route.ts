import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";

const handler = serve({ client: inngest, functions: [] });

export { handler as GET, handler as POST, handler as PUT };
