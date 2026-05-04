import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pingRouter   from "./ping";
import statusRouter  from "./status";
import botStatsRouter from "./botStats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pingRouter);
router.use(statusRouter);
router.use(botStatsRouter);

export default router;
