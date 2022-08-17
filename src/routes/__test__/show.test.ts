import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

test('should verify the id parameter', async () => {
    const user = global.signin();
    const id = '42342';

    await request(app)
        .get(`/api/orders/${id}`)
        .set('Cookie', user)
        .send()
        .expect(400);
});

test('should not be able to fetch inexistent order', async () => {
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const user = global.signin();

    //  build order with the ticket
    await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    const id = new mongoose.Types.ObjectId();

    await request(app)
        .get(`/api/orders/${id}`)
        .set('Cookie', user)
        .send()
        .expect(404);
});

test("should not allow a user to fetch another user's order", async () => { 
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const userOne = global.signin();
    const userTwo = global.signin();

    // build order with the ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', userOne)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    // make user to fetch the order
    await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Cookie', userTwo)
        .send()
        .expect(401);
});

test('should fetch the order', async () => { 
    // create a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const user = global.signin();

    // build order with the ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id})
        .expect(201);
    
    // make user to fetch the order
    const { body: fetchedOrder } = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send()
        .expect(200);
    
    expect(fetchedOrder.id).toEqual(order.id);
});

