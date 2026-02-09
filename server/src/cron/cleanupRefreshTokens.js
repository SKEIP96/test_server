import cron from "node-cron";
import { prisma } from "../libs/prisma.js";

export const startRefreshTokenCleanup = () => {
  // каждый день в 03:00
  cron.schedule("0 3 * * *", async () => {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(
        `[CRON] Refresh tokens cleanup: ${result.count} removed`
      );
    } catch (err) {
      console.error("[CRON] Refresh token cleanup failed", err);
    }
  });
};
