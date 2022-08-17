import express, { Request, Response } from 'express';
import { Order, OrderStatus } from '../models/order';
import { NotFoundError, requireAuth, UnauthorizedError } from '@frst-ticket-app/common';
import { param } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

router.patch('/api/orders/:orderId',
    requireAuth,
    [
        param('orderId')
            .custom((idValue) => mongoose.Types.ObjectId.isValid(idValue))
            .withMessage('The id must be a valid MongoDB ObjectId')
    ],
    async (req: Request, res: Response) => {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if(!order) {
            throw new NotFoundError();
        }

        if(order.userId !== req.currentUser!.id) {
            throw new UnauthorizedError();
        }
        order.status = OrderStatus.Cancelled;
        await order.save();

        res.status(204).send(order);
    });

export { router as deleteOrderRouter };