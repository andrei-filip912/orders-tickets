import express, { Request, Response } from 'express';
import { Order, OrderStatus } from '../models/order';
import { NotFoundError, requireAuth, UnauthorizedError, validateRequest } from '@frst-ticket-app/common';
import { param } from 'express-validator';
import mongoose from 'mongoose';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.patch('/api/orders/:orderId',
    requireAuth,
    [
        param('orderId')
            .custom((idValue) => mongoose.Types.ObjectId.isValid(idValue))
            .withMessage('The id must be a valid MongoDB ObjectId')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('ticket');
        if(!order) {
            throw new NotFoundError();
        }

        if(order.userId !== req.currentUser!.id) {
            throw new UnauthorizedError();
        }
        order.status = OrderStatus.Cancelled;
        await order.save();

        new OrderCancelledPublisher(natsWrapper.client).publish({
            id: order.id,
            ticket: {
                id: order.ticket.id,
            },
        });
        
        res.status(204).send(order);
    });

export { router as deleteOrderRouter };