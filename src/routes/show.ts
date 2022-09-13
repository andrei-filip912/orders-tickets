import express, { Request, Response } from 'express';
import { NotFoundError, requireAuth, UnauthorizedError } from '@frst-ticket-app/common';
import { Order } from '../models/order';
import { param } from 'express-validator';
import { validateRequest } from '@frst-ticket-app/common';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/api/orders/:orderId',
    requireAuth,
    [
        param('orderId')
            .custom((idValue) => mongoose.Types.ObjectId.isValid(idValue))
            .withMessage('The id must be a valid mongoose ObjectId'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const order = await Order.findById(req.params.orderId).populate('ticket');
        if(!order){
            throw new NotFoundError();
        }

        if(order.userId !== req.currentUser!.id) {
            throw new UnauthorizedError();
        }
        
        res.send(order);
    });

export { router as showOrderRouter };