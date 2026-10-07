import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { storeSession } from "../middlewares/storeSession";
import catalogRouter from "./catalog";
import customerRouter from "./customer";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storeSession);
router.use(catalogRouter);
router.use(customerRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
