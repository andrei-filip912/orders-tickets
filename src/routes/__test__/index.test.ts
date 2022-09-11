import request from "supertest";
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from "../../nats-wrapper";
import mongoose from 'mongoose';
import { Ticket } from "../../models/ticket";

const buildTicket= async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    return ticket;
};

test('should fetch orders for a specified user', async () => { 
    // create 3 tickets
    const ticketOne = await buildTicket();
    const ticketTwo = await buildTicket();
    const ticketThree = await buildTicket();

    const userOne = global.signin();
    const userTwo = global.signin();

    // create 1 order as user#1
    await request(app)
        .post('/api/orders')
        .set('Cookie', userOne)
        .send({ ticketId: ticketOne.id })
        .expect(201);
    
    // create 2 orders as user#2
    const { body: orderOne } = await request(app)
        .post('/api/orders')
        .set('Cookie', userTwo)
        .send({ ticketId: ticketTwo.id })
        .expect(201);
    const { body: orderTwo } = await request(app)
        .post('/api/orders')
        .set('Cookie', userTwo)
        .send({ ticketId: ticketThree.id })
        .expect(201);

    // fetch user#2 orders
    const response = await request(app)
        .get('/api/orders')
        .set('Cookie', userTwo)
        .expect(200);
    
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[1].id).toEqual(orderTwo.id);
    expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
    expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});