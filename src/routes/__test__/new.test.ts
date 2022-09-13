import request from "supertest";
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import mongoose from 'mongoose';
import { Ticket } from "../../models/ticket";
import { natsWrapper } from '../../nats-wrapper';

test('the route handler is listening for a post request on /api/orders', async () => {
    const response = await request(app)
        .post('/api/orders')
        .send({});
    expect(response.status).not.toEqual(404);
});

test('should only be accessed by a authenticated user', async () => {
    const response = await request(app)
        .post('/api/orders')
        .send({});
    expect(response.status).toEqual(401);
});

test('should return a different status than 401', async () => {
    const response = await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({});
    expect(response.status).not.toEqual(401);
})

test('should return an error if invalid ticketId is provided', async () => { 
    const response = await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({
            ticketId: 'asdf'
        });

    expect(response.status).toEqual(400);
});

test('should return an error if ticket does not exist', async () => { 
    const response = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({
        ticketId: new mongoose.Types.ObjectId()
    });

    expect(response.status).toEqual(404);
});

test('should return an error if ticket is already reserved', async () => { 
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const order = Order.build({
        ticket,
        userId: 'asdf',
        status: OrderStatus.Created,
        expiresAt: new Date()
    });
    await order.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({
            ticketId: ticket.id
        })
        .expect(400);
});

test('should reserve a ticket', async () => { 
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
});

test('should publish an event', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(201);
    
    expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);
});